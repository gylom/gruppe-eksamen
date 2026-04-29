using DefaultNamespace.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DefaultNamespace.Controllers;

[ApiController]
[Route("api/oppskriftskategorier")]
public class OppskriftskategorierController : ControllerBase
{
    private readonly AppDbContext _db;

    public OppskriftskategorierController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var kategorier = await _db.Oppskriftskategorier
            .OrderBy(x => x.Id)
            .Select(x => new
            {
                id = x.Id,
                navn = x.Navn
            })
            .ToListAsync();

        return Ok(kategorier);
    }
}