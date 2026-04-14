using DefaultNamespace.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DefaultNamespace.Controllers;

[ApiController]
[Authorize]
[Route("api/maaleenheter")]
public class MaaleenheterController : ControllerBase
{
    private readonly AppDbContext _db;
    public MaaleenheterController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _db.Maaleenheter.OrderBy(x => x.Type).ThenBy(x => x.Enhet)
            .Select(x => new { id = x.Id, enhet = x.Enhet, type = x.Type })
            .ToListAsync();
        return Ok(result);
    }
}
