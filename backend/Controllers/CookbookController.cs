using DefaultNamespace.Data;
using DefaultNamespace.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace DefaultNamespace.Controllers;

[ApiController]
[Authorize]
public class CookbookController : ControllerBase
{
    /// <summary>Måltidstype-kategori brukt i ukesplan (v1).</summary>
    private static readonly ulong[] PlanningMealTypeIds = [1, 2, 3, 7, 8];

    private readonly AppDbContext _db;

    public CookbookController(AppDbContext db) => _db = db;

    [HttpGet("api/cookbook")]
    public async Task<IActionResult> GetHistory(
        [FromQuery] string? search,
        [FromQuery] ulong? mealTypeId,
        [FromQuery] string? sort)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var householdId = await GetHouseholdId(userId.Value);
        if (householdId == null)
            return Ok(new CookbookHistoryResponseDto { Items = [] });

        if (mealTypeId.HasValue && !PlanningMealTypeIds.Contains(mealTypeId.Value))
            return BadRequest(new { message = "Måltidstypen kan ikke brukes i kokeboken." });

        var memberIds = await GetHouseholdMemberIds(userId.Value);

        var rows = await _db.Handleliste
            .Where(x => memberIds.Contains(x.UserId)
                        && x.PurchasedAt != null
                        && x.ArchivedAt != null
                        && x.Kilde == "plannedMeal")
            .Include(x => x.PlanlagteMaaltidLinker)
            .AsSplitQuery()
            .ToListAsync();

        var pmArchivedPairs = new List<(ulong PmId, DateTime ArchivedAt)>();
        foreach (var row in rows)
        {
            var archived = row.ArchivedAt!.Value;
            if (row.PlanlagtMaaltidId is { } directPm)
                pmArchivedPairs.Add((directPm, archived));
            foreach (var link in row.PlanlagteMaaltidLinker)
                pmArchivedPairs.Add((link.PlanlagtMaaltidId, archived));
        }

        if (pmArchivedPairs.Count == 0)
            return Ok(new CookbookHistoryResponseDto { Items = [] });

        var pmIds = pmArchivedPairs.Select(x => x.PmId).Distinct().ToList();

        var meals = await _db.PlanlagteMaaltider
            .Where(pm => pmIds.Contains(pm.Id) && pm.HusholdningId == householdId.Value)
            .Include(pm => pm.Oppskrift)
            .Include(pm => pm.Maaltidstype)
            .AsSplitQuery()
            .ToListAsync();

        var mealById = meals.ToDictionary(m => m.Id);

        var enriched = new List<(
            ulong PmId,
            DateTime ArchivedAt,
            ulong RecipeId,
            ulong MealTypeId,
            string RecipeName,
            string MealTypeName,
            int Portions)>();

        foreach (var (pmId, archivedAt) in pmArchivedPairs)
        {
            if (!mealById.TryGetValue(pmId, out var pm)) continue;
            if (!PlanningMealTypeIds.Contains(pm.MaaltidstypeId)) continue;
            if (pm.Oppskrift == null || pm.Maaltidstype == null) continue;

            enriched.Add((
                pmId,
                archivedAt,
                pm.OppskriftId,
                pm.MaaltidstypeId,
                pm.Oppskrift.Navn,
                pm.Maaltidstype.Navn,
                pm.Oppskrift.Porsjoner));
        }

        if (enriched.Count == 0)
            return Ok(new CookbookHistoryResponseDto { Items = [] });

        var recipeIds = enriched.Select(x => x.RecipeId).Distinct().ToList();
        var ratingRows = await _db.Skjuloppskrifter
            .Where(s => s.UserId == userId.Value && recipeIds.Contains(s.OppskriftId))
            .ToListAsync();
        var preferenceByRecipe = ratingRows.ToDictionary(s => s.OppskriftId);

        var groups = enriched.GroupBy(x => (x.RecipeId, x.MealTypeId));

        var items = new List<CookbookHistoryItemDto>();
        foreach (var g in groups)
        {
            var first = g.First();
            var distinctPmCount = g.Select(x => x.PmId).Distinct().Count();
            var lastCooked = g.Max(x => x.ArchivedAt);
            preferenceByRecipe.TryGetValue(g.Key.RecipeId, out var preference);
            if (preference?.Skjul == true) continue;

            items.Add(new CookbookHistoryItemDto
            {
                RecipeId = g.Key.RecipeId,
                RecipeName = first.RecipeName,
                MealTypeId = g.Key.MealTypeId,
                MealType = first.MealTypeName,
                CookedCount = distinctPmCount,
                LastCookedAt = lastCooked,
                CurrentUserRating = preference?.Karakter,
                RecipePortions = first.Portions,
            });
        }

        if (mealTypeId.HasValue)
            items = items.Where(x => x.MealTypeId == mealTypeId.Value).ToList();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.Trim().ToLowerInvariant();
            items = items.Where(x =>
                    x.RecipeName.ToLowerInvariant().Contains(q)
                    || x.MealType.ToLowerInvariant().Contains(q))
                .ToList();
        }

        var sortMode = (sort ?? "ratingThenRecent").Trim().ToLowerInvariant();
        items = sortMode switch
        {
            "recent" => items
                .OrderByDescending(x => x.LastCookedAt)
                .ThenBy(x => x.RecipeName, StringComparer.OrdinalIgnoreCase)
                .ToList(),
            _ => items
                .OrderByDescending(x => x.CurrentUserRating.HasValue)
                .ThenByDescending(x => x.CurrentUserRating ?? int.MinValue)
                .ThenByDescending(x => x.LastCookedAt)
                .ThenBy(x => x.RecipeName, StringComparer.OrdinalIgnoreCase)
                .ToList(),
        };

        return Ok(new CookbookHistoryResponseDto { Items = items });
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
        if (householdId == null) return [];
        return await _db.Medlemmer.Where(x => x.HusholdningId == householdId.Value).Select(x => x.UserId).ToListAsync();
    }
}
