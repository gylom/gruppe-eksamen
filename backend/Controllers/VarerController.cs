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
[Route("api/varer")]
public class VarerController : ControllerBase
{
    private readonly AppDbContext _db;
    public VarerController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? sok, [FromQuery] ulong? kategori, [FromQuery] ulong? varetypeId)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var householdMemberIds = await GetHouseholdMemberIds(userId.Value);

        var query = _db.Varer
            .Where(x => !x.Brukerdefinert || x.UserId == null || householdMemberIds.Contains(x.UserId.Value))
            .Include(x => x.Varetype)!.ThenInclude(x => x!.Kategori)
            .Include(x => x.Maaleenhet)
            .Include(x => x.Butikkpriser)
                .ThenInclude(x => x.Butikk)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(sok))
        {
            var search = sok.Trim().ToLower();
            query = query.Where(x =>
                x.Varenavn.ToLower().Contains(search) ||
                x.Merke.ToLower().Contains(search) ||
                (x.Ean != null && x.Ean.Contains(search)) ||
                x.Varetype!.Navn.ToLower().Contains(search));
        }

        if (kategori.HasValue)
            query = query.Where(x => x.Varetype!.KategoriId == kategori.Value);

        if (varetypeId.HasValue)
            query = query.Where(x => x.VaretypeId == varetypeId.Value);

        var result = await query
            .OrderBy(x => x.Varenavn)
            .Select(x => new
            {
                id = x.Id,
                varenavn = x.Varenavn,
                varetype_id = x.VaretypeId,
                varetype = x.Varetype!.Navn,
                kategori_id = x.Varetype.KategoriId,
                kategori = x.Varetype.Kategori!.Kategorinavn,
                merke = x.Merke,
                kvantitet = x.Kvantitet,
                maaleenhet_id = x.MaaleenhetId,
                maaleenhet = x.Maaleenhet!.Enhet,
                ean = x.Ean,
                brukerdefinert = x.Brukerdefinert,
                user_id = x.UserId,

                butikker = x.Butikkpriser
                    .OrderBy(bp => bp.Pris)
                    .Select(bp => new
                    {
                        butikk_id = bp.ButikkId,
                        butikk = bp.Butikk.Butikknavn,
                        pris = bp.Pris,
                        datopris = bp.Datopris,
                        tilbudspris = bp.Tilbudspris,
                        tilbud_fra = bp.Tilbudfradato,
                        tilbud_til = bp.Tilbudtildato
                    })
                    .ToList()
            })
            .ToListAsync();

        return Ok(result);
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetOne(ulong id)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var householdMemberIds = await GetHouseholdMemberIds(userId.Value);

        var item = await _db.Varer
            .Where(x => x.Id == id && (!x.Brukerdefinert || x.UserId == null || householdMemberIds.Contains(x.UserId.Value)))
            .Include(x => x.Varetype)!.ThenInclude(x => x!.Kategori)
            .Include(x => x.Maaleenhet)
            .Include(x => x.Butikkpriser)
                .ThenInclude(x => x.Butikk)
            .Select(x => new
            {
                id = x.Id,
                varenavn = x.Varenavn,
                varetype_id = x.VaretypeId,
                varetype = x.Varetype!.Navn,
                kategori_id = x.Varetype.KategoriId,
                kategori = x.Varetype.Kategori!.Kategorinavn,
                merke = x.Merke,
                kvantitet = x.Kvantitet,
                maaleenhet_id = x.MaaleenhetId,
                maaleenhet = x.Maaleenhet!.Enhet,
                ean = x.Ean,
                brukerdefinert = x.Brukerdefinert,
                user_id = x.UserId,

                butikker = x.Butikkpriser
                    .OrderBy(bp => bp.Pris)
                    .Select(bp => new
                    {
                        butikk_id = bp.ButikkId,
                        butikk = bp.Butikk.Butikknavn,
                        pris = bp.Pris,
                        datopris = bp.Datopris,
                        tilbudspris = bp.Tilbudspris,
                        tilbud_fra = bp.Tilbudfradato,
                        tilbud_til = bp.Tilbudtildato
                    })
                    .ToList()
            })
            .FirstOrDefaultAsync();

        return item == null ? NotFound(new { message = "Vare ikke funnet." }) : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateProductRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        if (string.IsNullOrWhiteSpace(request.Varenavn))
            return BadRequest(new { message = "Varenavn må fylles ut." });

        var varetypeExists = await _db.Varetyper.AnyAsync(x => x.Id == request.VaretypeId);
        if (!varetypeExists)
            return NotFound(new { message = "Varetype ikke funnet." });

        var unitExists = await _db.Maaleenheter.AnyAsync(x => x.Id == request.MaaleenhetId);
        if (!unitExists)
            return NotFound(new { message = "Måleenhet ikke funnet." });

        if (request.ButikkId.HasValue)
        {
            var butikkExists = await _db.Butikker.AnyAsync(x => x.Id == request.ButikkId.Value);
            if (!butikkExists)
                return NotFound(new { message = "Butikk ikke funnet." });

            if (!request.Pris.HasValue)
                return BadRequest(new { message = "Pris må oppgis når butikk er satt." });
        }

        var vare = new Vare
        {
            Varenavn = request.Varenavn.Trim(),
            VaretypeId = request.VaretypeId,
            Merke = request.Merke?.Trim() ?? string.Empty,
            Kvantitet = request.Kvantitet ?? 0,
            MaaleenhetId = request.MaaleenhetId,
            Ean = string.IsNullOrWhiteSpace(request.Ean) ? null : request.Ean.Trim(),
            UserId = userId.Value,
            Brukerdefinert = true
        };

        _db.Varer.Add(vare);
        await _db.SaveChangesAsync();

        if (request.ButikkId.HasValue && request.Pris.HasValue)
        {
            var butikkpris = new Butikkpris
            {
                VareId = vare.Id,
                ButikkId = request.ButikkId.Value,
                Pris = request.Pris.Value,
                Datopris = request.Datopris ?? DateOnly.FromDateTime(DateTime.UtcNow),
                Tilbudspris = request.Tilbudspris,
                Tilbudfradato = request.TilbudFra,
                Tilbudtildato = request.TilbudTil
            };

            _db.Butikkpriser.Add(butikkpris);
            await _db.SaveChangesAsync();
        }

        return Ok(new
        {
            message = "Vare opprettet.",
            id = vare.Id
        });
    }

    private ulong? GetUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return ulong.TryParse(claim, out var id) ? id : null;
    }

    private async Task<List<ulong>> GetHouseholdMemberIds(ulong userId)
    {
        var householdId = await _db.Medlemmer
            .Where(x => x.UserId == userId)
            .Select(x => (ulong?)x.HusholdningId)
            .FirstOrDefaultAsync();

        if (householdId == null)
            return new List<ulong> { userId };

        return await _db.Medlemmer
            .Where(x => x.HusholdningId == householdId.Value)
            .Select(x => x.UserId)
            .ToListAsync();
    }
}