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
[Route("api/forbruk")]
public class ForbrukController : ControllerBase
{
    private readonly AppDbContext _db;
    public ForbrukController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var memberIds = await GetHouseholdMemberIds(userId.Value);
        if (memberIds.Count == 0) return Ok(Array.Empty<object>());

        var rows = await _db.Forbruk
            .Where(x => memberIds.Contains(x.UserId))
            .Include(x => x.Bruker)
            .Include(x => x.Vare)!.ThenInclude(x => x!.Varetype)
            .Include(x => x.Maaleenhet)
            .OrderByDescending(x => x.Forbruksdato)
            .Select(x => new
            {
                id = x.Id,
                userId = x.UserId,
                brukernavn = x.Bruker!.Brukernavn,
                vareId = x.VareId,
                varenavn = x.Vare!.Varenavn,
                varetype = x.Vare.Varetype!.Navn,
                forbruksdato = x.Forbruksdato,
                innkjopspris = x.Innkjopspris,
                kvantitet = x.Kvantitet,
                maaleenhetId = x.MaaleenhetId,
                maaleenhet = x.Maaleenhet != null ? x.Maaleenhet.Enhet : null
            })
            .ToListAsync();

        return Ok(rows);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateConsumptionRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        var householdId = await GetHouseholdId(userId.Value);
        if (householdId == null) return BadRequest(new { message = "Brukeren er ikke medlem av en husholdning." });
        if (request.Kvantitet <= 0) return BadRequest(new { message = "Kvantitet må være større enn 0." });

        ulong vareId;
        ulong? maaleenhetId = request.MaaleenhetId;
        decimal? innkjopspris = request.Innkjopspris;
        var forbruksdato = request.Forbruksdato ?? DateTime.UtcNow;

        if (request.VarelagerId.HasValue)
        {
            var stockRow = await _db.Varelager
                .FirstOrDefaultAsync(x => x.Id == request.VarelagerId.Value && x.HusholdningId == householdId.Value);
            if (stockRow == null) return NotFound(new { message = "Varelager-rad ikke funnet." });
            if (stockRow.Kvantitet < request.Kvantitet) return BadRequest(new { message = "Ikke nok kvantitet på valgt varelager-rad." });

            vareId = stockRow.VareId;
            maaleenhetId ??= stockRow.MaaleenhetId;
            innkjopspris ??= stockRow.Pris;

            stockRow.Kvantitet -= request.Kvantitet;
            if (stockRow.Kvantitet <= 0) _db.Varelager.Remove(stockRow);
        }
        else
        {
            if (!request.VareId.HasValue) return BadRequest(new { message = "Send enten varelagerId eller vareId." });
            vareId = request.VareId.Value;

            var stockRows = await _db.Varelager
                .Where(x => x.HusholdningId == householdId.Value && x.VareId == vareId)
                .OrderBy(x => x.BestForDato)
                .ThenBy(x => x.Kjopsdato)
                .ThenBy(x => x.Id)
                .ToListAsync();

            var totalAvailable = stockRows.Sum(x => x.Kvantitet);
            if (totalAvailable < request.Kvantitet) return BadRequest(new { message = "Ikke nok kvantitet tilgjengelig i varelager." });

            var remaining = request.Kvantitet;
            foreach (var stockRow in stockRows)
            {
                if (remaining <= 0) break;
                var take = Math.Min(stockRow.Kvantitet, remaining);
                stockRow.Kvantitet -= take;
                remaining -= take;
                maaleenhetId ??= stockRow.MaaleenhetId;
                innkjopspris ??= stockRow.Pris;
                if (stockRow.Kvantitet <= 0) _db.Varelager.Remove(stockRow);
            }
        }

        var row = new ForbrukRad
        {
            UserId = userId.Value,
            VareId = vareId,
            Forbruksdato = forbruksdato,
            Innkjopspris = innkjopspris,
            MaaleenhetId = maaleenhetId,
            Kvantitet = request.Kvantitet
        };

        _db.Forbruk.Add(row);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Forbruk registrert.", id = row.Id });
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
