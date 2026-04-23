using DefaultNamespace.Data;
using DefaultNamespace.DTOs;
using DefaultNamespace.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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
        var query = _db.Varer
            .Include(x => x.Varetype)!.ThenInclude(x => x!.Kategori)
            .Include(x => x.Maaleenhet)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(sok))
        {
            var search = sok.Trim().ToLower();
            query = query.Where(x => x.Varenavn.ToLower().Contains(search)
                                     || x.Merke.ToLower().Contains(search)
                                     || x.Ean.Contains(search)
                                     || x.Varetype!.Navn.ToLower().Contains(search));
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
                ean = x.Ean
            })
            .ToListAsync();

        return Ok(result);
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetOne(ulong id)
    {
        var item = await _db.Varer
            .Include(x => x.Varetype)!.ThenInclude(x => x!.Kategori)
            .Include(x => x.Maaleenhet)
            .Where(x => x.Id == id)
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
                ean = x.Ean
            })
            .FirstOrDefaultAsync();

        return item == null ? NotFound(new { message = "Vare ikke funnet." }) : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateProductRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Varenavn))
            return BadRequest(new { message = "Varenavn må fylles ut." });

        var varetypeExists = await _db.Varetyper.AnyAsync(x => x.Id == request.VaretypeId);
        if (!varetypeExists)
            return NotFound(new { message = "Varetype ikke funnet." });

        var unitExists = await _db.Maaleenheter.AnyAsync(x => x.Id == request.MaaleenhetId);
        if (!unitExists)
            return NotFound(new { message = "Måleenhet ikke funnet." });

        var vare = new Vare
        {
            Varenavn = request.Varenavn.Trim(),
            VaretypeId = request.VaretypeId,
            Merke = request.Merke?.Trim() ?? string.Empty,
            Kvantitet = request.Kvantitet ?? 0,
            MaaleenhetId = request.MaaleenhetId,
            Ean = request.Ean?.Trim() ?? string.Empty
        };

        _db.Varer.Add(vare);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            message = "Vare opprettet.",
            id = vare.Id
        });
    }
}
