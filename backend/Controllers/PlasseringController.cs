using DefaultNamespace.Data;
using DefaultNamespace.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace DefaultNamespace.Controllers;

[ApiController]
[Authorize]
[Route("api/husholdning/plassering")]
public class PlasseringController : ControllerBase
{
    private readonly AppDbContext _db;
    public PlasseringController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var householdId = await GetHouseholdId();
        if (householdId == null) return BadRequest(new { message = "Brukeren er ikke medlem av en husholdning." });

        var rows = await _db.Plasseringer
            .Where(x => x.HusholdningId == householdId.Value)
            .OrderBy(x => x.Navn)
            .Select(x => new { id = x.Id, plassering = x.Navn })
            .ToListAsync();

        return Ok(rows);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreatePlacementRequest request)
    {
        var householdId = await GetHouseholdId();
        if (householdId == null) return BadRequest(new { message = "Brukeren er ikke medlem av en husholdning." });
        if (string.IsNullOrWhiteSpace(request.Plassering)) return BadRequest(new { message = "Plassering er påkrevd." });

        var exists = await _db.Plasseringer.AnyAsync(x => x.HusholdningId == householdId.Value && x.Navn == request.Plassering.Trim());
        if (exists) return BadRequest(new { message = "Plassering finnes allerede." });

        var row = new DefaultNamespace.Models.Plassering
        {
            HusholdningId = householdId.Value,
            Navn = request.Plassering.Trim()
        };

        _db.Plasseringer.Add(row);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Plassering opprettet.", id = row.Id, plassering = row.Navn });
    }

    [HttpPut("{id:long}")]
    public async Task<IActionResult> Update(long id, UpdatePlacementRequest request)
    {
        if (id < 1) return BadRequest(new { message = "Ugyldig plassering-id." });
        var householdId = await GetHouseholdId();
        if (householdId == null) return BadRequest(new { message = "Brukeren er ikke medlem av en husholdning." });
        if (string.IsNullOrWhiteSpace(request.Plassering)) return BadRequest(new { message = "Plassering er påkrevd." });

        var row = await _db.Plasseringer.FirstOrDefaultAsync(x => x.Id == (ulong)id && x.HusholdningId == householdId.Value);
        if (row == null) return NotFound(new { message = "Plassering ikke funnet." });

        row.Navn = request.Plassering.Trim();
        await _db.SaveChangesAsync();
        return Ok(new { message = "Plassering oppdatert.", plassering = row.Navn });
    }

    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Delete(long id)
    {
        if (id < 1) return BadRequest(new { message = "Ugyldig plassering-id." });
        var householdId = await GetHouseholdId();
        if (householdId == null) return BadRequest(new { message = "Brukeren er ikke medlem av en husholdning." });

        var row = await _db.Plasseringer.FirstOrDefaultAsync(x => x.Id == (ulong)id && x.HusholdningId == householdId.Value);
        if (row == null) return NotFound(new { message = "Plassering ikke funnet." });

        await _db.Database.ExecuteSqlInterpolatedAsync(
            $"UPDATE Varelager SET plassering_id = NULL WHERE plassering_id = {row.Id}");

        _db.Plasseringer.Remove(row);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Plassering slettet." });
    }

    private ulong? GetUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return ulong.TryParse(claim, out var id) ? id : null;
    }

    private async Task<ulong?> GetHouseholdId()
    {
        var userId = GetUserId();
        if (userId == null) return null;
        return await _db.Medlemmer.Where(x => x.UserId == userId.Value).Select(x => (ulong?)x.HusholdningId).FirstOrDefaultAsync();
    }
}
