using DefaultNamespace.Data;
using DefaultNamespace.DTOs;
using DefaultNamespace.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace DefaultNamespace.Controllers;

[ApiController]
[Authorize]
[Route("api/husholdning")]
public class HusholdningController : ControllerBase
{
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
            return Ok(new { household = (object?)null, medlemmer = Array.Empty<object>(), plasseringer = Array.Empty<object>() });

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

        return Ok(new
        {
            household = new
            {
                id = medlemskap.Husholdning.Id,
                navn = medlemskap.Husholdning.Navn,
                minRolle = medlemskap.Rolle
            },
            medlemmer,
            plasseringer
        });
    }

    [HttpPost]
    public async Task<IActionResult> CreateHusholdning(CreateHouseholdRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        if (string.IsNullOrWhiteSpace(request.Navn)) return BadRequest(new { message = "Navn er påkrevd." });

        var existingMembership = await _db.Medlemmer.AnyAsync(x => x.UserId == userId.Value);
        if (existingMembership) return BadRequest(new { message = "Brukeren er allerede medlem av en husholdning." });

        await using var tx = await _db.Database.BeginTransactionAsync();

        var household = new Husholdning
        {
            Navn = request.Navn.Trim(),
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

        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        return Ok(new { message = "Husholdning opprettet.", id = household.Id, navn = household.Navn });
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

        var targetMembership = await _db.Medlemmer.FirstOrDefaultAsync(x => x.UserId == (ulong)userId && x.HusholdningId == myMembership.HusholdningId);
        if (targetMembership == null) return NotFound(new { message = "Medlem ikke funnet i husholdningen." });

        var removingSelf = currentUserId.Value == (ulong)userId;
        var amOwner = string.Equals(myMembership.Rolle, "eier", StringComparison.OrdinalIgnoreCase);

        if (!removingSelf && !amOwner) return Forbid();
        if (removingSelf && amOwner) return BadRequest(new { message = "Eier kan ikke fjerne seg selv." });

        _db.Medlemmer.Remove(targetMembership);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Medlem fjernet." });
    }

    private ulong? GetUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return ulong.TryParse(claim, out var id) ? id : null;
    }
}
