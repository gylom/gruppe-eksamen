using System.Data;
using System.Security.Cryptography;
using System.Text;
using DefaultNamespace.Data;
using DefaultNamespace.DTOs;
using DefaultNamespace.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace DefaultNamespace.Controllers;

[ApiController]
[Authorize]
[Route("api/husholdning")]
public class HusholdningController : ControllerBase
{
    private const string InviteAlphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    private const int InviteCodeLength = 6;
    private const int HouseholdNameMaxLength = 80;
    private static readonly TimeSpan InviteLifetime = TimeSpan.FromDays(7);

    private readonly AppDbContext _db;
    public HusholdningController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetHusholdning()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var medlemskap = await _db.Medlemmer
            .Include(x => x.Husholdning)
            .FirstOrDefaultAsync(x => x.UserId == userId.Value);

        if (medlemskap == null || medlemskap.Husholdning == null)
            return Ok(new
            {
                household = (object?)null,
                medlemmer = Array.Empty<object>(),
                plasseringer = Array.Empty<object>(),
                activeInvite = (object?)null
            });

        var medlemmer = await _db.Medlemmer
            .Where(x => x.HusholdningId == medlemskap.HusholdningId)
            .Include(x => x.Bruker)
            .Select(x => new
            {
                userId = x.UserId,
                brukernavn = x.Bruker!.Brukernavn,
                email = x.Bruker.Email,
                rolle = x.Rolle,
                erMeg = x.UserId == userId.Value
            })
            .ToListAsync();

        var plasseringer = await _db.Plasseringer
            .Where(x => x.HusholdningId == medlemskap.HusholdningId)
            .OrderBy(x => x.Navn)
            .Select(x => new
            {
                id = x.Id,
                plassering = x.Navn
            })
            .ToListAsync();

        object? activeInvite = null;
        if (string.Equals(medlemskap.Rolle, "eier", StringComparison.OrdinalIgnoreCase))
        {
            var now = DateTime.UtcNow;
            var active = await _db.HusholdningInvitasjoner
                .AsNoTracking()
                .Where(i => i.HusholdningId == medlemskap.HusholdningId
                    && i.RevokedAt == null
                    && i.ExpiresAt > now)
                .OrderByDescending(i => i.CreatedAt)
                .FirstOrDefaultAsync();

            if (active != null)
                activeInvite = new { code = active.Kode, expiresAt = active.ExpiresAt };
        }

        return Ok(new
        {
            household = new
            {
                id = medlemskap.Husholdning.Id,
                navn = medlemskap.Husholdning.Navn,
                minRolle = medlemskap.Rolle
            },
            medlemmer,
            plasseringer,
            activeInvite
        });
    }

    [HttpPost]
    public async Task<IActionResult> CreateHusholdning(CreateHouseholdRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        if (string.IsNullOrWhiteSpace(request.Navn)) return BadRequest(new { message = "Navn er påkrevd." });
        var trimmedNavn = request.Navn.Trim();
        if (trimmedNavn.Length > HouseholdNameMaxLength)
            return BadRequest(new { message = $"Navn kan være maks {HouseholdNameMaxLength} tegn." });

        await using var tx = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable);

        if (await _db.Medlemmer.AnyAsync(x => x.UserId == userId.Value))
        {
            await tx.RollbackAsync();
            return Conflict(new { message = "Brukeren er allerede medlem av en husholdning." });
        }

        var household = new Husholdning
        {
            Navn = trimmedNavn,
            CreatedAt = DateTime.UtcNow
        };

        _db.Husholdninger.Add(household);
        await _db.SaveChangesAsync();

        _db.Medlemmer.Add(new Medlem
        {
            HusholdningId = household.Id,
            UserId = userId.Value,
            Rolle = "eier"
        });

        try
        {
            await _db.SaveChangesAsync();
            await tx.CommitAsync();
        }
        catch (DbUpdateException)
        {
            await tx.RollbackAsync();
            return Conflict(new { message = "Brukeren er allerede medlem av en husholdning." });
        }

        return Ok(new { message = "Husholdning opprettet.", id = household.Id, navn = household.Navn });
    }

    [HttpPost("join")]
    [EnableRateLimiting("invite-join")]
    public async Task<IActionResult> JoinHusholdning(JoinHouseholdRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        if (!TryNormalizeInviteCode(request.Code, out var normalized, out var normalizeError))
            return BadRequest(new { message = normalizeError ?? "Ugyldig invitasjonskode." });

        await using var tx = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable);

        if (await _db.Medlemmer.AnyAsync(x => x.UserId == userId.Value))
        {
            await tx.RollbackAsync();
            return Conflict(new { message = "Brukeren er allerede medlem av en husholdning." });
        }

        var invite = await _db.HusholdningInvitasjoner
            .FirstOrDefaultAsync(i => i.Kode == normalized);

        if (invite == null)
        {
            await tx.RollbackAsync();
            return NotFound(new { message = "Ugyldig invitasjonskode." });
        }

        if (invite.RevokedAt != null)
        {
            await tx.RollbackAsync();
            return Conflict(new { message = "Invitasjonskoden er trukket tilbake." });
        }

        var now = DateTime.UtcNow;
        if (invite.ExpiresAt <= now)
        {
            await tx.RollbackAsync();
            return Conflict(new { message = "Invitasjonskoden er utløpt." });
        }

        _db.Medlemmer.Add(new Medlem
        {
            HusholdningId = invite.HusholdningId,
            UserId = userId.Value,
            Rolle = "medlem"
        });

        try
        {
            await _db.SaveChangesAsync();
            await tx.CommitAsync();
        }
        catch (DbUpdateException)
        {
            await tx.RollbackAsync();
            return Conflict(new { message = "Brukeren er allerede medlem av en husholdning." });
        }

        return Ok(new { message = "Du er nå medlem av husholdningen." });
    }

    [HttpPost("invitasjon")]
    public async Task<IActionResult> GenerateInvitasjon()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        await using var tx = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable);

        var membership = await _db.Medlemmer.FirstOrDefaultAsync(x => x.UserId == userId.Value);
        if (membership == null)
        {
            await tx.RollbackAsync();
            return BadRequest(new { message = "Brukeren er ikke medlem av en husholdning." });
        }
        if (!string.Equals(membership.Rolle, "eier", StringComparison.OrdinalIgnoreCase))
        {
            await tx.RollbackAsync();
            return StatusCode(403, new { message = "Bare eier kan administrere invitasjoner." });
        }

        var toRevoke = await _db.HusholdningInvitasjoner
            .Where(i => i.HusholdningId == membership.HusholdningId
                && i.RevokedAt == null)
            .ToListAsync();

        var revokeTime = DateTime.UtcNow;
        foreach (var row in toRevoke)
            row.RevokedAt = revokeTime;

        if (toRevoke.Count > 0)
            await _db.SaveChangesAsync();

        const int maxAttempts = 24;
        for (var attempt = 0; attempt < maxAttempts; attempt++)
        {
            var code = GenerateInviteCode();
            if (await _db.HusholdningInvitasjoner.AnyAsync(i => i.Kode == code))
                continue;

            _db.HusholdningInvitasjoner.Add(new HusholdningInvitasjon
            {
                HusholdningId = membership.HusholdningId,
                Kode = code,
                CreatedByUserId = userId.Value,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.Add(InviteLifetime)
            });

            try
            {
                await _db.SaveChangesAsync();
                await tx.CommitAsync();
                return Ok(new { message = "Ny invitasjonskode er opprettet.", code, expiresAt = DateTime.UtcNow.Add(InviteLifetime) });
            }
            catch (DbUpdateException)
            {
                _db.ChangeTracker.Clear();
                await tx.RollbackAsync();
                return StatusCode(500, new { message = "Kunne ikke generere invitasjonskode. Prøv igjen." });
            }
        }

        await tx.RollbackAsync();
        return StatusCode(500, new { message = "Kunne ikke generere invitasjonskode. Prøv igjen." });
    }

    [HttpDelete("invitasjon")]
    public async Task<IActionResult> RevokeInvitasjon()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var membership = await _db.Medlemmer.FirstOrDefaultAsync(x => x.UserId == userId.Value);
        if (membership == null)
            return BadRequest(new { message = "Brukeren er ikke medlem av en husholdning." });
        if (!string.Equals(membership.Rolle, "eier", StringComparison.OrdinalIgnoreCase))
            return StatusCode(403, new { message = "Bare eier kan administrere invitasjoner." });

        var actives = await _db.HusholdningInvitasjoner
            .Where(i => i.HusholdningId == membership.HusholdningId
                && i.RevokedAt == null)
            .ToListAsync();

        if (actives.Count == 0)
            return NotFound(new { message = "Ingen aktiv invitasjon." });

        var now = DateTime.UtcNow;
        foreach (var row in actives)
            row.RevokedAt = now;

        await _db.SaveChangesAsync();
        return Ok(new { message = "Invitasjonen er trukket tilbake." });
    }

    [HttpPut]
    public async Task<IActionResult> RenameHusholdning(UpdateHouseholdRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        if (string.IsNullOrWhiteSpace(request.Navn)) return BadRequest(new { message = "Navn er påkrevd." });

        var membership = await _db.Medlemmer.FirstOrDefaultAsync(x => x.UserId == userId.Value);
        if (membership == null) return BadRequest(new { message = "Brukeren er ikke medlem av en husholdning." });
        if (!string.Equals(membership.Rolle, "eier", StringComparison.OrdinalIgnoreCase))
            return Forbid();

        var household = await _db.Husholdninger.FirstOrDefaultAsync(x => x.Id == membership.HusholdningId);
        if (household == null) return NotFound(new { message = "Husholdning ikke funnet." });

        household.Navn = request.Navn.Trim();
        await _db.SaveChangesAsync();
        return Ok(new { message = "Husholdning oppdatert.", navn = household.Navn });
    }

    [HttpGet("medlemmer")]
    public async Task<IActionResult> GetMedlemmer()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var membership = await _db.Medlemmer.FirstOrDefaultAsync(x => x.UserId == userId.Value);
        if (membership == null) return Ok(Array.Empty<object>());

        var medlemmer = await _db.Medlemmer
            .Where(x => x.HusholdningId == membership.HusholdningId)
            .Include(x => x.Bruker)
            .OrderByDescending(x => x.Rolle == "eier")
            .ThenBy(x => x.Bruker!.Brukernavn)
            .Select(x => new
            {
                userId = x.UserId,
                brukernavn = x.Bruker!.Brukernavn,
                email = x.Bruker.Email,
                rolle = x.Rolle,
                erMeg = x.UserId == userId.Value
            })
            .ToListAsync();

        return Ok(medlemmer);
    }

    [HttpPost("medlemmer")]
    public async Task<IActionResult> AddMedlem(AddMemberRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var myMembership = await _db.Medlemmer.FirstOrDefaultAsync(x => x.UserId == userId.Value);
        if (myMembership == null) return BadRequest(new { message = "Brukeren er ikke medlem av en husholdning." });
        if (!string.Equals(myMembership.Rolle, "eier", StringComparison.OrdinalIgnoreCase)) return Forbid();

        Bruker? targetUser = null;
        if (request.UserId.HasValue)
        {
            targetUser = await _db.Brukere.FirstOrDefaultAsync(x => x.Id == request.UserId.Value);
        }
        else if (!string.IsNullOrWhiteSpace(request.BrukernavnEllerEmail))
        {
            var lookup = request.BrukernavnEllerEmail.Trim();
            targetUser = await _db.Brukere.FirstOrDefaultAsync(x => x.Brukernavn == lookup || x.Email == lookup);
        }

        if (targetUser == null) return NotFound(new { message = "Bruker ikke funnet." });
        if (await _db.Medlemmer.AnyAsync(x => x.UserId == targetUser.Id))
            return BadRequest(new { message = "Brukeren er allerede medlem av en husholdning." });

        var role = string.Equals(request.Rolle, "eier", StringComparison.OrdinalIgnoreCase) ? "eier" : "medlem";

        _db.Medlemmer.Add(new Medlem
        {
            HusholdningId = myMembership.HusholdningId,
            UserId = targetUser.Id,
            Rolle = role
        });

        await _db.SaveChangesAsync();
        return Ok(new { message = "Medlem lagt til.", userId = targetUser.Id, rolle = role });
    }

    [HttpDelete("medlemmer/{userId:long}")]
    public async Task<IActionResult> RemoveMedlem(long userId)
    {
        if (userId < 1) return BadRequest(new { message = "Ugyldig bruker-id." });

        var currentUserId = GetUserId();
        if (currentUserId == null) return Unauthorized();

        var myMembership = await _db.Medlemmer.FirstOrDefaultAsync(x => x.UserId == currentUserId.Value);
        if (myMembership == null) return BadRequest(new { message = "Brukeren er ikke medlem av en husholdning." });

        var targetMembership = await _db.Medlemmer.FirstOrDefaultAsync(
            x => x.UserId == (ulong)userId && x.HusholdningId == myMembership.HusholdningId);

        if (targetMembership == null) return NotFound(new { message = "Medlem ikke funnet i husholdningen." });

        var removingSelf = currentUserId.Value == (ulong)userId;
        var amOwner = string.Equals(myMembership.Rolle, "eier", StringComparison.OrdinalIgnoreCase);

        if (!removingSelf && !amOwner) return Forbid();
        if (removingSelf && amOwner) return BadRequest(new { message = "Eier kan ikke fjerne seg selv her. Bruk /api/husholdning/leave." });

        _db.Medlemmer.Remove(targetMembership);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Medlem fjernet." });
    }

    [HttpDelete("leave")]
    public async Task<IActionResult> LeaveHusholdning()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var myMembership = await _db.Medlemmer
            .FirstOrDefaultAsync(x => x.UserId == userId.Value);

        if (myMembership == null)
            return BadRequest(new { message = "Brukeren er ikke medlem av en husholdning." });

        var isOwner = string.Equals(myMembership.Rolle, "eier", StringComparison.OrdinalIgnoreCase);

        await using var tx = await _db.Database.BeginTransactionAsync();

        if (isOwner)
        {
            var otherMembers = await _db.Medlemmer
                .Where(x => x.HusholdningId == myMembership.HusholdningId && x.UserId != userId.Value)
                .ToListAsync();

            if (otherMembers.Count > 0)
            {
                var randomIndex = new Random().Next(otherMembers.Count);
                var newOwner = otherMembers[randomIndex];
                newOwner.Rolle = "eier";

                _db.Medlemmer.Remove(myMembership);
                await _db.SaveChangesAsync();
                await tx.CommitAsync();

                return Ok(new { message = "Du har forlatt husholdningen." });
            }
            else
            {
                var householdId = myMembership.HusholdningId;

                var household = await _db.Husholdninger
                    .FirstOrDefaultAsync(x => x.Id == householdId);

                var medlemmer = await _db.Medlemmer
                    .Where(x => x.HusholdningId == householdId)
                    .ToListAsync();

                var plasseringIds = await _db.Plasseringer
                    .Where(x => x.HusholdningId == householdId)
                    .Select(x => x.Id)
                    .ToListAsync();

                if (plasseringIds.Count > 0)
                {
                    var idList = string.Join(",", plasseringIds);
                    await _db.Database.ExecuteSqlRawAsync($@"
                        UPDATE Varelager
                        SET plassering_id = NULL
                        WHERE plassering_id IN ({idList})
                    ");
                }

                var varelager = await _db.Varelager
                    .Where(x => x.HusholdningId == householdId)
                    .ToListAsync();

                var plasseringer = await _db.Plasseringer
                    .Where(x => x.HusholdningId == householdId)
                    .ToListAsync();

                var settings = await _db.Husholdningsinnstillinger
                    .Where(x => x.HusholdningId == householdId)
                    .ToListAsync();

                if (varelager.Count > 0)
                {
                    _db.Varelager.RemoveRange(varelager);
                    await _db.SaveChangesAsync();
                }

                if (plasseringer.Count > 0)
                {
                    _db.Plasseringer.RemoveRange(plasseringer);
                    await _db.SaveChangesAsync();
                }

                if (settings.Count > 0)
                {
                    _db.Husholdningsinnstillinger.RemoveRange(settings);
                    await _db.SaveChangesAsync();
                }

                if (medlemmer.Count > 0)
                {
                    _db.Medlemmer.RemoveRange(medlemmer);
                    await _db.SaveChangesAsync();
                }

                if (household != null)
                {
                    _db.Husholdninger.Remove(household);
                    await _db.SaveChangesAsync();
                }

                await tx.CommitAsync();
                return Ok(new { message = "Du har forlatt husholdningen, og husholdningen ble slettet." });
            }
        }

        _db.Medlemmer.Remove(myMembership);
        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        return Ok(new { message = "Du har forlatt husholdningen." });
    }

    private static string GenerateInviteCode()
    {
        // Rejection sampling: 256 mod 31 = 8, so values >= 248 are biased.
        // Discard those and redraw to keep alphabet selection uniform.
        const int alphabetLen = 31;
        const int unbiasedCeiling = 256 - (256 % alphabetLen);

        var chars = new char[InviteCodeLength];
        Span<byte> oneByte = stackalloc byte[1];
        for (var i = 0; i < InviteCodeLength; i++)
        {
            byte b;
            do
            {
                RandomNumberGenerator.Fill(oneByte);
                b = oneByte[0];
            } while (b >= unbiasedCeiling);
            chars[i] = InviteAlphabet[b % alphabetLen];
        }
        return new string(chars);
    }

    private static bool TryNormalizeInviteCode(string? raw, out string normalized, out string? errorMessage)
    {
        normalized = string.Empty;
        errorMessage = null;
        if (string.IsNullOrWhiteSpace(raw))
        {
            errorMessage = "Invitasjonskode er påkrevd.";
            return false;
        }

        var sb = new StringBuilder();
        foreach (var c in raw.Trim())
        {
            if (c == ' ' || c == '-') continue;
            sb.Append(char.ToUpperInvariant(c));
        }

        normalized = sb.ToString();
        if (normalized.Length != InviteCodeLength)
        {
            errorMessage = "Invitasjonskoden må være nøyaktig 6 tegn.";
            return false;
        }

        foreach (var c in normalized)
        {
            if (InviteAlphabet.IndexOf(c) < 0)
            {
                errorMessage = "Invitasjonskoden inneholder ugyldige tegn.";
                return false;
            }
        }

        return true;
    }

    private ulong? GetUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return ulong.TryParse(claim, out var id) ? id : null;
    }
}
