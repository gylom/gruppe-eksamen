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
        var householdId = GetHouseholdId();
        if (userId == null) return Unauthorized();

        var householdMemberIds = await GetHouseholdMemberIds();
        var hiddenIds = await GetHiddenRecipeIds(userId.Value, householdId);
        var ratingLookup = householdId == null
            ? new Dictionary<ulong, string>()
            : await _db.OppskriftVurderinger
                .Where(x => x.HusholdningId == householdId.Value)
                .ToDictionaryAsync(x => x.OppskriftId, x => x.Rating);

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

        var recipes = await query.OrderByDescending(x => x.CreatedAt).ToListAsync();

        var result = recipes.Select(x => MapRecipe(x, ratingLookup.TryGetValue(x.Id, out var rating) ? rating : null)).ToList();

        return Ok(result);
    }

    [HttpGet("api/oppskrifter/skjulte")]
    public async Task<IActionResult> GetHiddenRecipes()
    {
        var userId = GetUserId();
        var householdId = GetHouseholdId();
        if (userId == null) return Unauthorized();

        var householdMemberIds = await GetHouseholdMemberIds();
        var hiddenBySeed = await _db.Skjuloppskrifter
            .Where(x => x.UserId == userId.Value)
            .Select(x => new { x.OppskriftId, x.Begrunnelse, x.Kommentar })
            .ToListAsync();

        var hiddenEntries = hiddenBySeed
            .Select(x => (OppskriftId: x.OppskriftId, Begrunnelse: x.Begrunnelse, Kommentar: x.Kommentar))
            .ToList();

        if (householdId != null)
        {
            var fRated = await _db.OppskriftVurderinger
                .Where(x => x.HusholdningId == householdId.Value && x.Rating == "F")
                .Select(x => x.OppskriftId)
                .ToListAsync();

            hiddenEntries.AddRange(fRated.Select(id => (
                OppskriftId: id,
                Begrunnelse: (string?)"Skjult via F-tier",
                Kommentar: (string?)null
            )));
        }

        var hiddenLookup = hiddenEntries
            .GroupBy(x => x.OppskriftId)
            .ToDictionary(g => g.Key, g => g.First());

        var recipeIds = hiddenLookup.Keys.ToList();
        if (recipeIds.Count == 0) return Ok(new List<object>());

        var ratingLookup = householdId == null
            ? new Dictionary<ulong, string>()
            : await _db.OppskriftVurderinger
                .Where(x => x.HusholdningId == householdId.Value)
                .ToDictionaryAsync(x => x.OppskriftId, x => x.Rating);

        var recipes = await _db.Oppskrifter
            .Where(x => recipeIds.Contains(x.Id) && (x.UserId == userId.Value || householdMemberIds.Contains(x.UserId)))
            .Include(x => x.Ingredienser)!.ThenInclude(x => x.Varetype)
            .Include(x => x.Ingredienser)!.ThenInclude(x => x.Maaleenhet)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        var result = recipes.Select(x => new
        {
            id = x.Id,
            navn = x.Navn,
            instruksjoner = x.Instruksjoner,
            porsjoner = x.Porsjoner,
            bilde = x.Bilde,
            user_id = x.UserId,
            rating = ratingLookup.TryGetValue(x.Id, out var rating) ? rating : null,
            skjultBegrunnelse = hiddenLookup[x.Id].Begrunnelse,
            skjultKommentar = hiddenLookup[x.Id].Kommentar,
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
        }).ToList();

        return Ok(result);
    }

    [HttpGet("api/oppskrifter/{id:long}")]
    public async Task<IActionResult> GetOne(ulong id)
    {
        var userId = GetUserId();
        var householdId = GetHouseholdId();
        if (userId == null) return Unauthorized();
        var householdMemberIds = await GetHouseholdMemberIds();

        var ratingLookup = householdId == null
            ? new Dictionary<ulong, string>()
            : await _db.OppskriftVurderinger
                .Where(x => x.HusholdningId == householdId.Value && x.OppskriftId == id)
                .ToDictionaryAsync(x => x.OppskriftId, x => x.Rating);

        var item = await _db.Oppskrifter
            .Where(x => x.Id == id && (x.UserId == userId.Value || householdMemberIds.Contains(x.UserId)))
            .Include(x => x.Ingredienser)!.ThenInclude(x => x.Varetype)
            .Include(x => x.Ingredienser)!.ThenInclude(x => x.Maaleenhet)
            .FirstOrDefaultAsync();

        return item == null
            ? NotFound(new { message = "Oppskrift ikke funnet." })
            : Ok(MapRecipe(item, ratingLookup.TryGetValue(item.Id, out var rating) ? rating : null));
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

    [HttpDelete("api/oppskrifter/{id:long}")]
    public async Task<IActionResult> DeleteRecipe(ulong id)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var householdMemberIds = await GetHouseholdMemberIds();

        var recipe = await _db.Oppskrifter
            .Include(x => x.Ingredienser)
            .FirstOrDefaultAsync(x =>
                x.Id == id &&
                (x.UserId == userId.Value || householdMemberIds.Contains(x.UserId)));

        if (recipe == null)
            return NotFound(new { message = "Oppskrift ikke funnet." });

        var ratings = await _db.OppskriftVurderinger
            .Where(x => x.OppskriftId == id)
            .ToListAsync();

        var hiddenRows = await _db.Skjuloppskrifter
            .Where(x => x.OppskriftId == id)
            .ToListAsync();

        if (ratings.Count > 0)
            _db.OppskriftVurderinger.RemoveRange(ratings);

        if (hiddenRows.Count > 0)
            _db.Skjuloppskrifter.RemoveRange(hiddenRows);

        if (recipe.Ingredienser.Any())
            _db.Ingredienser.RemoveRange(recipe.Ingredienser);

        _db.Oppskrifter.Remove(recipe);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Oppskrift slettet." });
    }

    [HttpPut("api/oppskrifter/{id:long}/rating")]
    public async Task<IActionResult> RateRecipe(ulong id, RateRecipeRequest request)
    {
        var userId = GetUserId();
        var householdId = GetHouseholdId();
        if (userId == null || householdId == null) return BadRequest(new { message = "Manglende bruker/husholdning." });

        var rating = (request.Rating ?? string.Empty).Trim().ToUpperInvariant();
        var validRatings = new[] { "A", "B", "C", "F" };
        if (!validRatings.Contains(rating))
        {
            return BadRequest(new { message = "Rating må være A, B, C eller F." });
        }

        var householdMemberIds = await GetHouseholdMemberIds();
        var recipeExists = await _db.Oppskrifter.AnyAsync(x => x.Id == id && (x.UserId == userId.Value || householdMemberIds.Contains(x.UserId)));
        if (!recipeExists) return NotFound(new { message = "Oppskrift ikke funnet." });

        var existing = await _db.OppskriftVurderinger.FirstOrDefaultAsync(x => x.OppskriftId == id && x.HusholdningId == householdId.Value);
        if (existing == null)
        {
            _db.OppskriftVurderinger.Add(new OppskriftVurdering
            {
                OppskriftId = id,
                HusholdningId = householdId.Value,
                Rating = rating,
                UpdatedAt = DateTime.UtcNow
            });
        }
        else
        {
            existing.Rating = rating;
            existing.UpdatedAt = DateTime.UtcNow;
        }

        if (rating == "F")
        {
            var hidden = await _db.Skjuloppskrifter.FirstOrDefaultAsync(x => x.OppskriftId == id && x.UserId == userId.Value);
            if (hidden == null)
            {
                _db.Skjuloppskrifter.Add(new Skjuloppskrift
                {
                    OppskriftId = id,
                    UserId = userId.Value,
                    Begrunnelse = "F-tier",
                    Kommentar = "Skjult automatisk fordi oppskriften ble vurdert til F-tier."
                });
            }
            else
            {
                hidden.Begrunnelse ??= "F-tier";
                hidden.Kommentar ??= "Skjult automatisk fordi oppskriften ble vurdert til F-tier.";
            }
        }

        await _db.SaveChangesAsync();
        return Ok(new { message = $"Oppskrift satt til {rating}-tier.", rating });
    }

    [HttpGet("api/oppskrifteranbefalt")]
    public async Task<IActionResult> Recommended()
    {
        var userId = GetUserId();
        var householdId = GetHouseholdId();
        if (userId == null || householdId == null) return BadRequest(new { message = "Manglende bruker/husholdning." });

        var householdMemberIds = await GetHouseholdMemberIds();
        var hiddenIds = await GetHiddenRecipeIds(userId.Value, householdId);
        var ratingLookup = await _db.OppskriftVurderinger
            .Where(x => x.HusholdningId == householdId.Value)
            .ToDictionaryAsync(x => x.OppskriftId, x => x.Rating);

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
                rating = ratingLookup.TryGetValue(r.Id, out var rating) ? rating : null,
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

    private async Task<List<ulong>> GetHiddenRecipeIds(ulong userId, ulong? householdId)
    {
        var hiddenIds = await _db.Skjuloppskrifter
            .Where(x => x.UserId == userId)
            .Select(x => x.OppskriftId)
            .ToListAsync();

        if (householdId != null)
        {
            var fRatedIds = await _db.OppskriftVurderinger
                .Where(x => x.HusholdningId == householdId.Value && x.Rating == "F")
                .Select(x => x.OppskriftId)
                .ToListAsync();

            hiddenIds = hiddenIds.Union(fRatedIds).ToList();
        }

        return hiddenIds;
    }

    private object MapRecipe(Oppskrift x, string? rating)
    {
        return new
        {
            id = x.Id,
            navn = x.Navn,
            instruksjoner = x.Instruksjoner,
            porsjoner = x.Porsjoner,
            bilde = x.Bilde,
            user_id = x.UserId,
            rating,
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
        if (householdId == null) return new List<ulong>();
        return await _db.Medlemmer.Where(x => x.HusholdningId == householdId.Value).Select(x => x.UserId).ToListAsync();
    }
}
