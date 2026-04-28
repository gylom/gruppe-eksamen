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

        var visibleOwnerIds = await GetVisibleRecipeOwnerIds(userId.Value);
        var preferenceLookup = await GetPreferenceLookup(userId.Value);

        var hiddenIds = preferenceLookup
            .Where(x => x.Value.Skjul || x.Value.Karakter == 1)
            .Select(x => x.Key)
            .ToList();

        var query = _db.Oppskrifter
            .Where(x => visibleOwnerIds.Contains(x.UserId) && !hiddenIds.Contains(x.Id))
            .Include(x => x.Ingredienser)!.ThenInclude(x => x.Varetype)
            .Include(x => x.Ingredienser)!.ThenInclude(x => x.Maaleenhet)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(sok))
        {
            var search = sok.Trim().ToLower();
            query = query.Where(x => x.Navn.ToLower().Contains(search)
                                     || x.Ingredienser.Any(i => i.Varetype!.Navn.ToLower().Contains(search)));
        }

        var recipes = await query.OrderByDescending(x => x.CreatedAt).ToListAsync();
        return Ok(recipes.Select(x => MapRecipe(x, preferenceLookup.GetValueOrDefault(x.Id))).ToList());
    }

    [HttpGet("api/oppskrifter/skjulte")]
    public async Task<IActionResult> GetHiddenRecipes()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var visibleOwnerIds = await GetVisibleRecipeOwnerIds(userId.Value);
        var preferenceLookup = await GetPreferenceLookup(userId.Value);

        var hiddenIds = preferenceLookup
            .Where(x => x.Value.Skjul || x.Value.Karakter == 1)
            .Select(x => x.Key)
            .ToList();

        if (hiddenIds.Count == 0) return Ok(new List<object>());

        var recipes = await _db.Oppskrifter
            .Where(x => hiddenIds.Contains(x.Id) && visibleOwnerIds.Contains(x.UserId))
            .Include(x => x.Ingredienser)!.ThenInclude(x => x.Varetype)
            .Include(x => x.Ingredienser)!.ThenInclude(x => x.Maaleenhet)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        return Ok(recipes.Select(x => MapRecipe(x, preferenceLookup.GetValueOrDefault(x.Id))).ToList());
    }

    [HttpGet("api/oppskrifter/{id:long}")]
    public async Task<IActionResult> GetOne(ulong id)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var visibleOwnerIds = await GetVisibleRecipeOwnerIds(userId.Value);
        var preferenceLookup = await GetPreferenceLookup(userId.Value);

        var item = await _db.Oppskrifter
            .Where(x => x.Id == id && visibleOwnerIds.Contains(x.UserId))
            .Include(x => x.Ingredienser)!.ThenInclude(x => x.Varetype)
            .Include(x => x.Ingredienser)!.ThenInclude(x => x.Maaleenhet)
            .FirstOrDefaultAsync();

        return item == null
            ? NotFound(new { message = "Oppskrift ikke funnet." })
            : Ok(MapRecipe(item, preferenceLookup.GetValueOrDefault(item.Id)));
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

        var item = await _db.Oppskrifter
            .Include(x => x.Ingredienser)
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId.Value);

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

    [HttpDelete("api/oppskrifter/{id:long}")]
    public async Task<IActionResult> DeleteRecipe(ulong id)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var recipe = await _db.Oppskrifter
            .Include(x => x.Ingredienser)
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId.Value);

        if (recipe == null)
            return NotFound(new { message = "Oppskrift ikke funnet." });

        var preferences = await _db.Skjuloppskrifter
            .Where(x => x.OppskriftId == id)
            .ToListAsync();

        if (preferences.Count > 0)
            _db.Skjuloppskrifter.RemoveRange(preferences);

        if (recipe.Ingredienser.Any())
            _db.Ingredienser.RemoveRange(recipe.Ingredienser);

        _db.Oppskrifter.Remove(recipe);

        await _db.SaveChangesAsync();

        return Ok(new { message = "Oppskrift slettet." });
    }

    [HttpPut("api/oppskrifter/{id:long}/preferanse")]
    public async Task<IActionResult> SavePreference(ulong id, RecipePreferenceRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var visibleOwnerIds = await GetVisibleRecipeOwnerIds(userId.Value);

        var recipeExists = await _db.Oppskrifter
            .AnyAsync(x => x.Id == id && visibleOwnerIds.Contains(x.UserId));

        if (!recipeExists) return NotFound(new { message = "Oppskrift ikke funnet." });

        if (request.Karakter is < 1 or > 10)
            return BadRequest(new { message = "Karakter må være mellom 1 og 10." });

        var preference = await _db.Skjuloppskrifter
            .FirstOrDefaultAsync(x => x.OppskriftId == id && x.UserId == userId.Value);

        if (preference == null)
        {
            preference = new Skjuloppskrift
            {
                OppskriftId = id,
                UserId = userId.Value,
                Skjul = false
            };

            _db.Skjuloppskrifter.Add(preference);
        }

        if (request.Karakter != null)
        {
            preference.Karakter = request.Karakter.Value;

            if (request.Karakter.Value == 1)
            {
                preference.Skjul = true;
                preference.Begrunnelse = "Karakter 1";
            }
        }

        preference.Skjul = request.Skjul;

        if (request.Skjul)
        {
            preference.Begrunnelse ??= "Skjult manuelt";
        }

        if (request.Kommentar != null)
        {
            preference.Kommentar = request.Kommentar;
        }

        await _db.SaveChangesAsync();

        return Ok(new
        {
            message = preference.Skjul ? "Oppskrift skjult." : "Oppskriftpreferanse lagret.",
            karakter = preference.Karakter,
            skjul = preference.Skjul,
            kommentar = preference.Kommentar
        });
    }

    [HttpGet("api/oppskrifteranbefalt")]
    public async Task<IActionResult> Recommended()
    {
        var userId = GetUserId();
        var householdId = GetHouseholdId();

        if (userId == null || householdId == null)
            return BadRequest(new { message = "Manglende bruker/husholdning." });

        var visibleOwnerIds = await GetVisibleRecipeOwnerIds(userId.Value);
        var preferenceLookup = await GetPreferenceLookup(userId.Value);

        var hiddenIds = preferenceLookup
            .Where(x => x.Value.Skjul || x.Value.Karakter == 1)
            .Select(x => x.Key)
            .ToList();

        var availableTypeIds = await _db.Varelager
            .Where(x => x.HusholdningId == householdId.Value && x.Kvantitet > 0)
            .Select(x => x.Vare!.VaretypeId)
            .Distinct()
            .ToListAsync();

        var recipes = await _db.Oppskrifter
            .Where(x => visibleOwnerIds.Contains(x.UserId) && !hiddenIds.Contains(x.Id))
            .Include(x => x.Ingredienser)!.ThenInclude(x => x.Varetype)
            .ToListAsync();

        var result = recipes.Select(r =>
        {
            var required = r.Ingredienser.Where(i => !(i.Valgfritt ?? false)).ToList();
            var have = required.Count(i => availableTypeIds.Contains(i.VaretypeId));

            var missing = required
                .Where(i => !availableTypeIds.Contains(i.VaretypeId))
                .Select(i => new
                {
                    varetype_id = i.VaretypeId,
                    varetype = i.Varetype!.Navn,
                    kvantitet = i.Kvantitet,
                    type = i.Type,
                    valgfritt = i.Valgfritt
                })
                .ToList();

            var pref = preferenceLookup.GetValueOrDefault(r.Id);
var matchProsent = required.Count == 0
    ? 100
    : (int)Math.Round((double)have / required.Count * 100);

string melding =
    matchProsent == 100 ? "Alle ingredienser på lager" :
    matchProsent >= 70 ? "Nesten alle ingredienser på lager" :
    matchProsent >= 50 ? "Mangler noen ingredienser" :
    "Du har noen ingredienser på lager";
    
            return new
            {
                id = r.Id,
                navn = r.Navn,
                porsjoner = r.Porsjoner,
                karakter = pref?.Karakter,
                kommentar = pref?.Kommentar,
                skjul = pref?.Skjul ?? false,
                melding = melding,
                antallIngredienser = required.Count,
                antallDuHar = have,
                antallDuMangler = missing.Count,
                matchProsent = required.Count == 0
                    ? 100
                    : (int)Math.Round((double)have / required.Count * 100),
                manglerKunFa = missing.Count <= 2,
                manglendeIngredienser = missing
            };
        })
        .Where(x => x.matchProsent > 30)
        .OrderByDescending(x => x.matchProsent)
        .ThenByDescending(x => x.karakter ?? 0)
        .ThenBy(x => x.antallDuMangler)
        .ThenBy(x => x.navn)
        .ToList();

        return Ok(result);
    }

    private async Task<Dictionary<ulong, Skjuloppskrift>> GetPreferenceLookup(ulong userId)
    {
        return await _db.Skjuloppskrifter
            .Where(x => x.UserId == userId)
            .ToDictionaryAsync(x => x.OppskriftId, x => x);
    }

    private object MapRecipe(Oppskrift x, Skjuloppskrift? preference)
    {
        return new
        {
            id = x.Id,
            navn = x.Navn,
            instruksjoner = x.Instruksjoner,
            porsjoner = x.Porsjoner,
            bilde = x.Bilde,
            user_id = x.UserId,
            karakter = preference?.Karakter,
            kommentar = preference?.Kommentar,
            skjul = preference?.Skjul ?? false,
            skjultBegrunnelse = preference?.Begrunnelse,
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
        };
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

        if (householdId == null)
            return new List<ulong>();

        return await _db.Medlemmer
            .Where(x => x.HusholdningId == householdId.Value)
            .Select(x => x.UserId)
            .ToListAsync();
    }

    private async Task<List<ulong>> GetVisibleRecipeOwnerIds(ulong userId)
    {
        var householdMemberIds = await GetHouseholdMemberIds();

        var adminUserIds = await _db.Brukere
            .Where(x => x.Rolle)
            .Select(x => x.Id)
            .ToListAsync();

        return householdMemberIds
            .Append(userId)
            .Concat(adminUserIds)
            .Distinct()
            .ToList();
    }
}

public class RecipePreferenceRequest
{
    public bool Skjul { get; set; }

    public int? Karakter { get; set; }

    public string? Kommentar { get; set; }
}