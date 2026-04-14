using DefaultNamespace.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DefaultNamespace.Controllers;

[ApiController]
[Authorize]
[Route("api/varetyper")]
public class VaretyperController : ControllerBase
{
    private readonly AppDbContext _db;
    public VaretyperController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? sok, [FromQuery] ulong? kategoriId)
    {
        var query = _db.Varetyper.Include(x => x.Kategori).AsQueryable();

        if (!string.IsNullOrWhiteSpace(sok))
        {
            var search = sok.Trim().ToLower();
            query = query.Where(x => x.Navn.ToLower().Contains(search));
        }

        if (kategoriId.HasValue)
            query = query.Where(x => x.KategoriId == kategoriId.Value);

        var result = await query.OrderBy(x => x.Navn).Select(x => new
        {
            id = x.Id,
            varetype = x.Navn,
            kategori_id = x.KategoriId,
            kategori = x.Kategori!.Kategorinavn
        }).ToListAsync();

        return Ok(result);
    }
}
