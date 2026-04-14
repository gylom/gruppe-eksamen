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
[Route("api/handleliste")]
public class HandlelisteController : ControllerBase
{
    private readonly AppDbContext _db;
    public HandlelisteController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var memberIds = await GetHouseholdMemberIds(userId.Value);
        if (memberIds.Count == 0) return Ok(new { varer = Array.Empty<object>(), forslag = Array.Empty<object>() });

        var items = await _db.Handleliste
            .Where(x => memberIds.Contains(x.UserId))
            .Include(x => x.Varetype)
            .Include(x => x.Vare)
            .Include(x => x.Maaleenhet)
            .Include(x => x.Bruker)
            .OrderByDescending(x => x.Endret ?? x.Opprettet)
            .Select(x => new
            {
                id = x.Id,
                varetypeId = x.VaretypeId,
                varetype = x.Varetype!.Navn,
                vareId = x.VareId,
                varenavn = x.Vare != null ? x.Vare.Varenavn : null,
                kvantitet = x.Kvantitet,
                maaleenhetId = x.MaaleenhetId,
                maaleenhet = x.Maaleenhet != null ? x.Maaleenhet.Enhet : null,
                userId = x.UserId,
                brukernavn = x.Bruker!.Brukernavn,
                opprettet = x.Opprettet,
                endret = x.Endret
            })
            .ToListAsync();

        var householdId = await GetHouseholdId(userId.Value);
        var forslag = new List<object>();
        if (householdId != null)
        {
            var settings = await _db.Husholdningsinnstillinger
                .Where(x => x.HusholdningId == householdId.Value && x.Minimumslager != null)
                .Include(x => x.Varetype)
                .ToListAsync();

            var stockByType = await _db.Varelager
                .Where(x => x.HusholdningId == householdId.Value)
                .Include(x => x.Vare)
                .GroupBy(x => x.Vare!.VaretypeId)
                .Select(g => new { varetypeId = g.Key, total = g.Sum(x => x.Kvantitet) })
                .ToListAsync();

            forslag = settings
                .Select(s => new
                {
                    varetypeId = s.VaretypeId,
                    varetype = s.Varetype!.Navn,
                    minimumslager = s.Minimumslager ?? 0,
                    tilgjengelig = stockByType.FirstOrDefault(x => x.varetypeId == s.VaretypeId)?.total ?? 0,
                })
                .Where(x => x.tilgjengelig < x.minimumslager)
                .Select(x => (object)new
                {
                    varetypeId = x.varetypeId,
                    varetype = x.varetype,
                    forslagKvantitet = x.minimumslager - x.tilgjengelig,
                    begrunnelse = "Under minimumslager"
                })
                .ToList();
        }

        return Ok(new { varer = items, forslag });
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateShoppingListItemRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var varetypeExists = await _db.Varetyper.AnyAsync(x => x.Id == request.VaretypeId);
        if (!varetypeExists) return NotFound(new { message = "Varetype ikke funnet." });
        if (request.VareId.HasValue && !await _db.Varer.AnyAsync(x => x.Id == request.VareId.Value))
            return NotFound(new { message = "Vare ikke funnet." });

        var row = new HandlelisteRad
        {
            VaretypeId = request.VaretypeId,
            VareId = request.VareId,
            UserId = userId.Value,
            Kvantitet = request.Kvantitet,
            MaaleenhetId = request.MaaleenhetId,
            Opprettet = DateTime.UtcNow,
            Endret = DateTime.UtcNow
        };

        _db.Handleliste.Add(row);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Vare lagt til i handleliste.", id = row.Id });
    }

    [HttpPut("{id:long}")]
    public async Task<IActionResult> Update(long id, UpdateShoppingListItemRequest request)
    {
        if (id < 1) return BadRequest(new { message = "Ugyldig id." });
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var memberIds = await GetHouseholdMemberIds(userId.Value);
        var row = await _db.Handleliste.Include(x => x.Bruker)
            .FirstOrDefaultAsync(x => x.Id == (ulong)id && memberIds.Contains(x.UserId));
        if (row == null) return NotFound(new { message = "Handleliste-rad ikke funnet." });

        if (request.VaretypeId.HasValue) row.VaretypeId = request.VaretypeId.Value;
        if (request.VareId.HasValue || request.VareId == null) row.VareId = request.VareId;
        if (request.Kvantitet.HasValue) row.Kvantitet = request.Kvantitet.Value;
        if (request.MaaleenhetId.HasValue || request.MaaleenhetId == null) row.MaaleenhetId = request.MaaleenhetId;
        row.Endret = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(new { message = "Handleliste oppdatert." });
    }

    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Delete(long id)
    {
        if (id < 1) return BadRequest(new { message = "Ugyldig id." });
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var memberIds = await GetHouseholdMemberIds(userId.Value);
        var row = await _db.Handleliste.FirstOrDefaultAsync(x => x.Id == (ulong)id && memberIds.Contains(x.UserId));
        if (row == null) return NotFound(new { message = "Handleliste-rad ikke funnet." });

        _db.Handleliste.Remove(row);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Handleliste-rad slettet." });
    }

    private ulong? GetUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return ulong.TryParse(claim, out var id) ? id : null;
    }

    private async Task<ulong?> GetHouseholdId(ulong userId)
    {
        return await _db.Medlemmer.Where(x => x.UserId == userId).Select(x => (ulong?)x.HusholdningId).FirstOrDefaultAsync();
    }

    private async Task<List<ulong>> GetHouseholdMemberIds(ulong userId)
    {
        var householdId = await GetHouseholdId(userId);
        if (householdId == null) return new List<ulong>();
        return await _db.Medlemmer.Where(x => x.HusholdningId == householdId.Value).Select(x => x.UserId).ToListAsync();
    }
}
