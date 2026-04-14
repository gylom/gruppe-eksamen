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
public class OppskrifterController : ControllerBase
{
    private readonly AppDbContext _db;
    public OppskrifterController(AppDbContext db) => _db = db;

    [HttpGet("api/oppskrifter")]
    public async Task<IActionResult> GetAll([FromQuery] string? sok)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var householdMemberIds = await GetHouseholdMemberIds();
        var hiddenIds = await _db.Skjuloppskrifter.Where(x => x.UserId == userId.Value).Select(x => x.OppskriftId).ToListAsync();

        var query = _db.Oppskrifter
            .Where(x => (x.UserId == userId.Value || householdMemberIds.Contains(x.UserId)) && !hiddenIds.Contains(x.Id))
            .Include(x => x.Ingredienser)!.ThenInclude(x => x.Varetype)
            .Include(x => x.Ingredienser)!.ThenInclude(x => x.Maaleenhet)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(sok))
        {
            var search = sok.Trim().ToLower();
            query = query.Where(x => x.Navn.ToLower().Contains(search)
                                     || x.Ingredienser.Any(i => i.Varetype!.Navn.ToLower().Contains(search)));
        }

        var result = await query.OrderByDescending(x => x.CreatedAt)
            .Select(x => new
            {
                id = x.Id,
                navn = x.Navn,
                instruksjoner = x.Instruksjoner,
                porsjoner = x.Porsjoner,
                bilde = x.Bilde,
                user_id = x.UserId,
                ingredienser = x.Ingredienser.Select(i => new
                {
                    id = i.Id,
                    varetype_id = i.VaretypeId,
                    varetype = i.Varetype!.Navn,
                    kvantitet = i.Kvantitet,
                    maaleenhet_id = i.MaaleenhetId,
                    maaleenhet = i.Maaleenhet != null ? i.Maaleenhet.Enhet : null,
                    type = i.Type,
                    valgfritt = i.Valgfritt
                })
            })
            .ToListAsync();

        return Ok(result);
    }

    [HttpGet("api/oppskrifter/{id:long}")]
    public async Task<IActionResult> GetOne(ulong id)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        var householdMemberIds = await GetHouseholdMemberIds();

        var item = await _db.Oppskrifter
            .Where(x => x.Id == id && (x.UserId == userId.Value || householdMemberIds.Contains(x.UserId)))
            .Include(x => x.Ingredienser)!.ThenInclude(x => x.Varetype)
            .Include(x => x.Ingredienser)!.ThenInclude(x => x.Maaleenhet)
            .Select(x => new
            {
                id = x.Id,
                navn = x.Navn,
                instruksjoner = x.Instruksjoner,
                porsjoner = x.Porsjoner,
                bilde = x.Bilde,
                user_id = x.UserId,
                ingredienser = x.Ingredienser.Select(i => new
                {
                    id = i.Id,
                    varetype_id = i.VaretypeId,
                    varetype = i.Varetype!.Navn,
                    kvantitet = i.Kvantitet,
                    maaleenhet_id = i.MaaleenhetId,
                    maaleenhet = i.Maaleenhet != null ? i.Maaleenhet.Enhet : null,
                    type = i.Type,
                    valgfritt = i.Valgfritt
                })
            }).FirstOrDefaultAsync();

        return item == null ? NotFound(new { message = "Oppskrift ikke funnet." }) : Ok(item);
    }

    [HttpPost("api/oppskrifter")]
    public async Task<IActionResult> Create(CreateRecipeRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var oppskrift = new Oppskrift
        {
            Navn = request.Navn,
            Instruksjoner = request.Instruksjoner,
            Porsjoner = request.Porsjoner,
            Bilde = request.Bilde,
            UserId = userId.Value,
            CreatedAt = DateTime.UtcNow,
            Ingredienser = request.Ingredienser.Select(i => new Ingrediens
            {
                VaretypeId = i.VaretypeId,
                Kvantitet = i.Kvantitet,
                MaaleenhetId = i.MaaleenhetId,
                Type = i.Type ?? "ingredient",
                Valgfritt = i.Valgfritt ?? false
            }).ToList()
        };

        _db.Oppskrifter.Add(oppskrift);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Oppskrift opprettet.", id = oppskrift.Id });
    }

    [HttpPut("api/oppskrifter/{id:long}")]
    public async Task<IActionResult> Update(ulong id, CreateRecipeRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var item = await _db.Oppskrifter.Include(x => x.Ingredienser).FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId.Value);
        if (item == null) return NotFound(new { message = "Oppskrift ikke funnet." });

        item.Navn = request.Navn;
        item.Instruksjoner = request.Instruksjoner;
        item.Porsjoner = request.Porsjoner;
        item.Bilde = request.Bilde;

        _db.Ingredienser.RemoveRange(item.Ingredienser);
        item.Ingredienser = request.Ingredienser.Select(i => new Ingrediens
        {
            OppskriftId = item.Id,
            VaretypeId = i.VaretypeId,
            Kvantitet = i.Kvantitet,
            MaaleenhetId = i.MaaleenhetId,
            Type = i.Type ?? "ingredient",
            Valgfritt = i.Valgfritt ?? false
        }).ToList();

        await _db.SaveChangesAsync();
        return Ok(new { message = "Oppskrift oppdatert." });
    }

    [HttpGet("api/oppskrifteranbefalt")]
    public async Task<IActionResult> Recommended()
    {
        var userId = GetUserId();
        var householdId = GetHouseholdId();
        if (userId == null || householdId == null) return BadRequest(new { message = "Manglende bruker/husholdning." });

        var householdMemberIds = await GetHouseholdMemberIds();
        var hiddenIds = await _db.Skjuloppskrifter.Where(x => x.UserId == userId.Value).Select(x => x.OppskriftId).ToListAsync();

        var availableTypeIds = await _db.Varelager
            .Where(x => x.HusholdningId == householdId.Value && x.Kvantitet > 0)
            .Select(x => x.Vare!.VaretypeId)
            .Distinct()
            .ToListAsync();

        var recipes = await _db.Oppskrifter
            .Where(x => (x.UserId == userId.Value || householdMemberIds.Contains(x.UserId)) && !hiddenIds.Contains(x.Id))
            .Include(x => x.Ingredienser)!.ThenInclude(x => x.Varetype)
            .ToListAsync();

        var result = recipes.Select(r =>
        {
            var required = r.Ingredienser.Where(i => !(i.Valgfritt ?? false)).ToList();
            var have = required.Count(i => availableTypeIds.Contains(i.VaretypeId));
            var missing = required.Where(i => !availableTypeIds.Contains(i.VaretypeId)).Select(i => new
            {
                varetype_id = i.VaretypeId,
                varetype = i.Varetype!.Navn,
                kvantitet = i.Kvantitet,
                type = i.Type,
                valgfritt = i.Valgfritt
            }).ToList();

            return new
            {
                id = r.Id,
                navn = r.Navn,
                porsjoner = r.Porsjoner,
                antallIngredienser = required.Count,
                antallDuHar = have,
                antallDuMangler = missing.Count,
                matchProsent = required.Count == 0 ? 100 : (int)Math.Round((double)have / required.Count * 100),
                manglerKunFa = missing.Count <= 2,
                manglendeIngredienser = missing
            };
        })
        .OrderByDescending(x => x.matchProsent)
        .ThenBy(x => x.antallDuMangler)
        .ThenBy(x => x.navn)
        .ToList();

        return Ok(result);
    }

    private ulong? GetUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return ulong.TryParse(claim, out var id) ? id : null;
    }

    private ulong? GetHouseholdId()
    {
        var claim = User.FindFirstValue("householdId");
        return ulong.TryParse(claim, out var id) ? id : null;
    }

    private async Task<List<ulong>> GetHouseholdMemberIds()
    {
        var householdId = GetHouseholdId();
        if (householdId == null) return new List<ulong>();
        return await _db.Medlemmer.Where(x => x.HusholdningId == householdId.Value).Select(x => x.UserId).ToListAsync();
    }
}
