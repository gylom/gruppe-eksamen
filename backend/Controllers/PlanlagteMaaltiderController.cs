using DefaultNamespace.Data;
using DefaultNamespace.DTOs;
using DefaultNamespace.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.Security.Claims;

namespace DefaultNamespace.Controllers;

[ApiController]
[Authorize]
[Route("api/planlagte-maaltider")]
public class PlanlagteMaaltiderController : ControllerBase
{
    private static readonly ulong[] PlanningMealTypeIds = [1, 2, 3, 7, 8];
    private readonly AppDbContext _db;

    public PlanlagteMaaltiderController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetForWeek([FromQuery] string weekStartDate)
    {
        if (!TryParseMonday(weekStartDate, out var monday))
            return BadRequest(new { message = "ukeStartDate må være en mandag i formatet YYYY-MM-DD." });

        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var householdId = await GetHouseholdId(userId.Value);
        if (householdId == null) return Ok(Array.Empty<PlannedMealDto>());

        var rows = await _db.PlanlagteMaaltider
            .AsNoTracking()
            .Where(x => x.HusholdningId == householdId.Value && x.UkeStartDato == monday)
            .Include(x => x.Oppskrift!)
                .ThenInclude(o => o.Ingredienser)
                .ThenInclude(i => i.Varetype)
            .Include(x => x.Oppskrift!)
                .ThenInclude(o => o.Ingredienser)
                .ThenInclude(i => i.Maaleenhet)
            .Include(x => x.Maaltidstype)
            .OrderBy(x => x.Dag)
            .ThenBy(x => x.MaaltidstypeId)
            .ToListAsync();

        var mealIds = rows.Select(r => r.Id).ToList();
        var exclusionRows = await _db.PlanlagteMaaltidEkskluderteIngredienser
            .AsNoTracking()
            .Where(e => mealIds.Contains(e.PlanlagtMaaltidId))
            .Select(e => new { e.PlanlagtMaaltidId, e.IngrediensId })
            .ToListAsync();

        var exclusionMap = exclusionRows
            .GroupBy(e => e.PlanlagtMaaltidId)
            .ToDictionary(g => g.Key, g => g.Select(x => x.IngrediensId).ToHashSet());

        var dto = rows
            .Select(r =>
                MapToDto(r, exclusionMap.TryGetValue(r.Id, out var set) ? set : new HashSet<ulong>()))
            .ToList();
        return Ok(dto);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePlannedMealRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var householdId = await GetHouseholdId(userId.Value);
        if (householdId == null)
            return BadRequest(new { message = "Du må tilhøre en husholdning for å legge måltider i planen." });

        if (!TryParseMonday(request.WeekStartDate, out var monday))
            return BadRequest(new { message = "ukeStartDate må være en mandag i formatet YYYY-MM-DD." });

        if (request.Day is < 1 or > 7)
            return BadRequest(new { message = "Dag må være et tall mellom 1 (mandag) og 7 (søndag)." });

        if (request.Servings is < 1 or > 20)
            return BadRequest(new { message = "Antall porsjoner må være mellom 1 og 20." });

        var visibleOwnerIds = await GetVisibleRecipeOwnerIds(userId.Value);
        var hiddenRecipeIds = await GetHiddenRecipeIds(userId.Value);
        var recipeExists = await _db.Oppskrifter.AnyAsync(x =>
            x.Id == request.OppskriftId &&
            visibleOwnerIds.Contains(x.UserId) &&
            !hiddenRecipeIds.Contains(x.Id));
        if (!recipeExists)
            return NotFound(new { message = "Oppskrift ikke funnet." });

        if (!PlanningMealTypeIds.Contains(request.MealTypeId))
            return BadRequest(new { message = "Måltidstypen kan ikke brukes i ukeplanen." });

        var mealTypeExists = await _db.Oppskriftskategorier.AnyAsync(x => x.Id == request.MealTypeId);
        if (!mealTypeExists)
            return NotFound(new { message = "Måltidstype ikke funnet." });

        var slotTaken = await _db.PlanlagteMaaltider.AnyAsync(x =>
            x.HusholdningId == householdId.Value &&
            x.UkeStartDato == monday &&
            x.Dag == request.Day &&
            x.MaaltidstypeId == request.MealTypeId);

        if (slotTaken)
            return Conflict(new { message = "Denne måltidsplassen er allerede i bruk." });

        var now = DateTime.UtcNow;
        var entity = new PlanlagtMaaltid
        {
            HusholdningId = householdId.Value,
            OppskriftId = request.OppskriftId,
            UkeStartDato = monday,
            Dag = request.Day,
            MaaltidstypeId = request.MealTypeId,
            Porsjoner = request.Servings,
            CreatedAt = now,
            UpdatedAt = now
        };

        _db.PlanlagteMaaltider.Add(entity);
        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            _db.Entry(entity).State = EntityState.Detached;
            var slotNowTaken = await _db.PlanlagteMaaltider.AsNoTracking().AnyAsync(x =>
                x.HusholdningId == householdId.Value &&
                x.UkeStartDato == monday &&
                x.Dag == request.Day &&
                x.MaaltidstypeId == request.MealTypeId);

            if (slotNowTaken)
                return Conflict(new { message = "Denne måltidsplassen er allerede i bruk." });

            throw;
        }

        var detail = await LoadMealWithDetails(entity.Id, householdId.Value);
        if (detail == null)
            return Problem("Kunne ikke hente planlagt måltid etter lagring.");

        return Ok(MapToDto(detail, new HashSet<ulong>()));
    }

    [HttpPut("{id:long}/servings")]
    public async Task<IActionResult> UpdateServings(long id, [FromBody] UpdatePlannedMealServingsRequest request)
    {
        if (id < 1) return BadRequest(new { message = "Ugyldig id." });

        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var householdId = await GetHouseholdId(userId.Value);
        if (householdId == null)
            return BadRequest(new { message = "Du må tilhøre en husholdning." });

        if (request.Servings is < 1 or > 20)
            return BadRequest(new { message = "Antall porsjoner må være mellom 1 og 20." });

        var entity = await _db.PlanlagteMaaltider
            .FirstOrDefaultAsync(x => x.Id == (ulong)id && x.HusholdningId == householdId.Value);

        if (entity == null)
            return NotFound(new { message = "Planlagt måltid ikke funnet." });

        entity.Porsjoner = request.Servings;
        entity.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        var detail = await LoadMealWithDetails(entity.Id, householdId.Value);
        if (detail == null)
            return NotFound(new { message = "Planlagt måltid ikke funnet." });

        var excluded = await LoadExclusionSet(entity.Id);
        return Ok(MapToDto(detail, excluded));
    }

    [HttpPost("{id:long}/ekskluder")]
    public async Task<IActionResult> ExcludeIngredient(long id, [FromBody] ExcludeIngredientRequest? body)
    {
        if (id < 1) return BadRequest(new { message = "Ugyldig id." });

        var ingrediensId = body?.IngrediensId ?? 0;
        if (ingrediensId < 1)
            return BadRequest(new { message = "Ugyldig ingrediens-id." });

        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var householdId = await GetHouseholdId(userId.Value);
        if (householdId == null)
            return BadRequest(new { message = "Du må tilhøre en husholdning." });

        var meal = await _db.PlanlagteMaaltider.FirstOrDefaultAsync(x =>
            x.Id == (ulong)id && x.HusholdningId == householdId.Value);

        if (meal == null)
            return NotFound(new { message = "Planlagt måltid ikke funnet." });

        var ingredientOk = await _db.Ingredienser.AnyAsync(i =>
            i.Id == ingrediensId && i.OppskriftId == meal.OppskriftId);

        if (!ingredientOk)
            return NotFound(new { message = "Ingrediensen tilhører ikke denne planlagte måltiden." });

        var exists = await _db.PlanlagteMaaltidEkskluderteIngredienser.AnyAsync(x =>
            x.PlanlagtMaaltidId == meal.Id && x.IngrediensId == ingrediensId);

        if (!exists)
        {
            var exclusion = new PlanlagtMaaltidEkskludertIngrediens
            {
                PlanlagtMaaltidId = meal.Id,
                IngrediensId = ingrediensId,
                CreatedAt = DateTime.UtcNow
            };
            _db.PlanlagteMaaltidEkskluderteIngredienser.Add(exclusion);

            try
            {
                await _db.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                _db.Entry(exclusion).State = EntityState.Detached;
                var duplicateNowExists = await _db.PlanlagteMaaltidEkskluderteIngredienser.AnyAsync(x =>
                    x.PlanlagtMaaltidId == meal.Id && x.IngrediensId == ingrediensId);

                if (!duplicateNowExists)
                    throw;
            }
        }

        var detail = await LoadMealWithDetails(meal.Id, householdId.Value);
        if (detail == null)
            return NotFound(new { message = "Planlagt måltid ikke funnet." });

        var excluded = await LoadExclusionSet(meal.Id);
        return Ok(MapToDto(detail, excluded));
    }

    [HttpDelete("{id:long}/ekskluder/{ingrediensId:long}")]
    public async Task<IActionResult> RestoreIngredient(long id, long ingrediensId)
    {
        if (id < 1 || ingrediensId < 1)
            return BadRequest(new { message = "Ugyldig id." });

        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var householdId = await GetHouseholdId(userId.Value);
        if (householdId == null)
            return BadRequest(new { message = "Du må tilhøre en husholdning." });

        var meal = await _db.PlanlagteMaaltider.FirstOrDefaultAsync(x =>
            x.Id == (ulong)id && x.HusholdningId == householdId.Value);

        if (meal == null)
            return NotFound(new { message = "Planlagt måltid ikke funnet." });

        var ingredientOk = await _db.Ingredienser.AnyAsync(i =>
            i.Id == (ulong)ingrediensId && i.OppskriftId == meal.OppskriftId);

        if (!ingredientOk)
            return NotFound(new { message = "Ingrediensen tilhører ikke denne planlagte måltiden." });

        var row = await _db.PlanlagteMaaltidEkskluderteIngredienser.FirstOrDefaultAsync(x =>
            x.PlanlagtMaaltidId == meal.Id && x.IngrediensId == (ulong)ingrediensId);

        if (row != null)
        {
            _db.PlanlagteMaaltidEkskluderteIngredienser.Remove(row);
            await _db.SaveChangesAsync();
        }

        var detail = await LoadMealWithDetails(meal.Id, householdId.Value);
        if (detail == null)
            return NotFound(new { message = "Planlagt måltid ikke funnet." });

        var excluded = await LoadExclusionSet(meal.Id);
        return Ok(MapToDto(detail, excluded));
    }

    [HttpDelete("{id:long}")]
    public async Task<IActionResult> DeletePlannedMeal(long id)
    {
        if (id < 1) return BadRequest(new { message = "Ugyldig id." });

        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var householdId = await GetHouseholdId(userId.Value);
        if (householdId == null)
            return BadRequest(new { message = "Du må tilhøre en husholdning." });

        var meal = await _db.PlanlagteMaaltider.FirstOrDefaultAsync(x =>
            x.Id == (ulong)id && x.HusholdningId == householdId.Value);

        if (meal == null)
            return NotFound(new { message = "Planlagt måltid ikke funnet." });

        var linkedHandlelisteIds = await _db.HandlelistePlanlagteMaaltider
            .Where(x => x.PlanlagtMaaltidId == meal.Id)
            .Select(x => x.HandlelisteId)
            .ToListAsync();

        var purchased = await _db.Handleliste.AnyAsync(h =>
            h.PurchasedAt != null &&
            (h.PlanlagtMaaltidId == meal.Id || linkedHandlelisteIds.Contains(h.Id)));

        if (purchased)
            return Conflict(new
            {
                message =
                    "Dette måltidet kan ikke fjernes fordi handlelisten viser at det allerede er handlet. Kokkeloggen må beholdes."
            });

        await using var tx = await _db.Database.BeginTransactionAsync();
        try
        {
            var linked = await _db.Handleliste
                .Where(h => h.PlanlagtMaaltidId == meal.Id || linkedHandlelisteIds.Contains(h.Id))
                .ToListAsync();
            _db.Handleliste.RemoveRange(linked);
            _db.PlanlagteMaaltider.Remove(meal);
            await _db.SaveChangesAsync();
            await tx.CommitAsync();
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }

        return NoContent();
    }

    private async Task<PlanlagtMaaltid?> LoadMealWithDetails(ulong mealId, ulong householdId)
    {
        return await _db.PlanlagteMaaltider
            .AsNoTracking()
            .Include(x => x.Oppskrift!)
                .ThenInclude(o => o.Ingredienser)
                .ThenInclude(i => i.Varetype)
            .Include(x => x.Oppskrift!)
                .ThenInclude(o => o.Ingredienser)
                .ThenInclude(i => i.Maaleenhet)
            .Include(x => x.Maaltidstype)
            .FirstOrDefaultAsync(x => x.Id == mealId && x.HusholdningId == householdId);
    }

    private async Task<HashSet<ulong>> LoadExclusionSet(ulong mealId)
    {
        var ids = await _db.PlanlagteMaaltidEkskluderteIngredienser
            .AsNoTracking()
            .Where(e => e.PlanlagtMaaltidId == mealId)
            .Select(e => e.IngrediensId)
            .ToListAsync();

        return ids.ToHashSet();
    }

    private static PlannedMealDto MapToDto(PlanlagtMaaltid x, IReadOnlySet<ulong> excludedIngredientIds)
    {
        var ingredients = x.Oppskrift?.Ingredienser
                ?.OrderBy(i => i.Id)
                .Select(i => new PlannedMealIngredientDto
                {
                    Id = i.Id,
                    VaretypeId = i.VaretypeId,
                    Varetype = i.Varetype?.Navn ?? string.Empty,
                    Kvantitet = i.Kvantitet,
                    MaaleenhetId = i.MaaleenhetId,
                    Maaleenhet = i.Maaleenhet?.Enhet,
                    Type = i.Type,
                    Valgfritt = i.Valgfritt,
                    Excluded = excludedIngredientIds.Contains(i.Id)
                })
                .ToList()
            ?? new List<PlannedMealIngredientDto>();

        return new PlannedMealDto
        {
            Id = x.Id,
            WeekStartDate = x.UkeStartDato.ToString("yyyy-MM-dd"),
            Day = x.Dag,
            MealTypeId = x.MaaltidstypeId,
            MealType = x.Maaltidstype?.Navn ?? string.Empty,
            OppskriftId = x.OppskriftId,
            OppskriftNavn = x.Oppskrift?.Navn ?? string.Empty,
            Servings = x.Porsjoner,
            Ingredients = ingredients
        };
    }

    private static bool TryParseMonday(string weekStartDate, out DateOnly monday)
    {
        monday = default;
        if (!DateOnly.TryParseExact(
                weekStartDate,
                "yyyy-MM-dd",
                CultureInfo.InvariantCulture,
                DateTimeStyles.None,
                out var d))
            return false;
        if (d.DayOfWeek != DayOfWeek.Monday)
            return false;
        monday = d;
        return true;
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
        if (householdId == null)
            return new List<ulong>();

        return await _db.Medlemmer
            .Where(x => x.HusholdningId == householdId.Value)
            .Select(x => x.UserId)
            .ToListAsync();
    }

    private async Task<List<ulong>> GetVisibleRecipeOwnerIds(ulong userId)
    {
        var householdMemberIds = await GetHouseholdMemberIds(userId);
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

    private async Task<List<ulong>> GetHiddenRecipeIds(ulong userId)
    {
        return await _db.Skjuloppskrifter
            .Where(x => x.UserId == userId && x.Skjul)
            .Select(x => x.OppskriftId)
            .ToListAsync();
    }
}
