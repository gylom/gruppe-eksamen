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
[Route("api/handleliste")]
public class HandlelisteController : ControllerBase
{
    private readonly AppDbContext _db;
    public HandlelisteController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var memberIds = await GetHouseholdMemberIds(userId.Value);
        if (memberIds.Count == 0) return Ok(new { varer = Array.Empty<object>(), forslag = Array.Empty<object>() });

        var items = await _db.Handleliste
            .Where(x => memberIds.Contains(x.UserId))
            .Include(x => x.Varetype)
            .Include(x => x.Vare)
            .Include(x => x.Maaleenhet)
            .Include(x => x.Bruker)
            .OrderByDescending(x => x.Endret ?? x.Opprettet)
            .Select(x => new
            {
                id = x.Id,
                varetypeId = x.VaretypeId,
                varetype = x.Varetype!.Navn,
                vareId = x.VareId,
                varenavn = x.Vare != null ? x.Vare.Varenavn : null,
                kvantitet = x.Kvantitet,
                maaleenhetId = x.MaaleenhetId,
                maaleenhet = x.Maaleenhet != null ? x.Maaleenhet.Enhet : null,
                userId = x.UserId,
                brukernavn = x.Bruker!.Brukernavn,
                opprettet = x.Opprettet,
                endret = x.Endret
            })
            .ToListAsync();

        var householdId = await GetHouseholdId(userId.Value);
        var forslag = new List<object>();
        if (householdId != null)
        {
            var settings = await _db.Husholdningsinnstillinger
                .Where(x => x.HusholdningId == householdId.Value && x.Minimumslager != null)
                .Include(x => x.Varetype)
                .ToListAsync();

            var stockByType = await _db.Varelager
                .Where(x => x.HusholdningId == householdId.Value)
                .Include(x => x.Vare)
                .GroupBy(x => x.Vare!.VaretypeId)
                .Select(g => new { varetypeId = g.Key, total = g.Sum(x => x.Kvantitet) })
                .ToListAsync();

            forslag = settings
                .Select(s => new
                {
                    varetypeId = s.VaretypeId,
                    varetype = s.Varetype!.Navn,
                    minimumslager = s.Minimumslager ?? 0,
                    tilgjengelig = stockByType.FirstOrDefault(x => x.varetypeId == s.VaretypeId)?.total ?? 0,
                })
                .Where(x => x.tilgjengelig < x.minimumslager)
                .Select(x => (object)new
                {
                    varetypeId = x.varetypeId,
                    varetype = x.varetype,
                    forslagKvantitet = x.minimumslager - x.tilgjengelig,
                    begrunnelse = "Under minimumslager"
                })
                .ToList();
        }

        return Ok(new { varer = items, forslag });
    }

    /// <summary>
    /// Read-only: aggregate planned-meal ingredients for a week. Does not insert handleliste rows.
    /// Suggestions are sorted by ingredient name, unit label, varetype id, maaleenhet id (deterministic).
    /// </summary>
    [HttpPost("generate-from-week")]
    public async Task<IActionResult> GenerateFromWeek([FromBody] GenerateShoppingSuggestionsRequest? body)
    {
        var raw = body?.WeekStartDate?.Trim() ?? string.Empty;
        if (!TryParseMonday(raw, out var monday))
            return BadRequest(new { message = "weekStartDate må være en mandag i formatet YYYY-MM-DD." });

        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var householdId = await GetHouseholdId(userId.Value);
        if (householdId == null)
        {
            return Ok(new GenerateShoppingSuggestionsResponse
            {
                WeekStartDate = monday.ToString("yyyy-MM-dd"),
                PlannedMealCount = 0,
                Suggestions = new List<ShoppingSuggestionDto>()
            });
        }

        var memberIds = await GetHouseholdMemberIds(userId.Value);

        var plannedMeals = await _db.PlanlagteMaaltider
            .AsNoTracking()
            .Where(x => x.HusholdningId == householdId.Value && x.UkeStartDato == monday)
            .Include(x => x.Oppskrift!)
            .ThenInclude(o => o.Ingredienser)
            .ThenInclude(i => i.Varetype)
            .Include(x => x.Oppskrift!)
            .ThenInclude(o => o.Ingredienser)
            .ThenInclude(i => i.Maaleenhet)
            .AsSplitQuery()
            .ToListAsync();

        var mealIds = plannedMeals.Select(m => m.Id).ToList();
        var exclusionRows = await _db.PlanlagteMaaltidEkskluderteIngredienser
            .AsNoTracking()
            .Where(e => mealIds.Contains(e.PlanlagtMaaltidId))
            .Select(e => new { e.PlanlagtMaaltidId, e.IngrediensId })
            .ToListAsync();

        var exclusionMap = exclusionRows
            .GroupBy(e => e.PlanlagtMaaltidId)
            .ToDictionary(g => g.Key, g => g.Select(x => x.IngrediensId).ToHashSet());

        var listKeySet = await _db.Handleliste
            .AsNoTracking()
            .Where(x => memberIds.Contains(x.UserId))
            .Select(x => new { x.VaretypeId, x.MaaleenhetId })
            .ToListAsync();

        var onListKeys = listKeySet
            .Select(x => (x.VaretypeId, x.MaaleenhetId))
            .ToHashSet();

        // Aggregate by exact (varetypeId, maaleenhetId); null unit only matches null.
        var buckets = new Dictionary<(ulong Vt, ulong? Me), ShoppingSuggestionAccumulator>();

        foreach (var meal in plannedMeals)
        {
            var recipe = meal.Oppskrift;
            if (recipe?.Ingredienser == null) continue;

            var excluded = exclusionMap.TryGetValue(meal.Id, out var ex) ? ex : new HashSet<ulong>();

            decimal scale = 1m;
            if (recipe.Porsjoner > 0 && meal.Porsjoner > 0)
                scale = (decimal)meal.Porsjoner / recipe.Porsjoner;

            foreach (var ing in recipe.Ingredienser)
            {
                if (ing.Valgfritt == true) continue;
                if (excluded.Contains(ing.Id)) continue;

                var key = (ing.VaretypeId, ing.MaaleenhetId);
                if (!buckets.TryGetValue(key, out var acc))
                {
                    acc = new ShoppingSuggestionAccumulator
                    {
                        Varetype = ing.Varetype?.Navn ?? string.Empty,
                        Maaleenhet = ing.Maaleenhet?.Enhet
                    };
                    buckets[key] = acc;
                }

                decimal? scaledQty = null;
                if (ing.Kvantitet.HasValue)
                    scaledQty = ing.Kvantitet.Value * scale;

                acc.AddMeal(meal.Id, scaledQty);
            }
        }

        var suggestions = buckets
            .Select(pair =>
            {
                var ((vtId, meId), acc) = pair;
                var onList = onListKeys.Contains((vtId, meId));
                return new ShoppingSuggestionDto
                {
                    ClientId = $"{vtId}:{(meId.HasValue ? meId.Value.ToString(CultureInfo.InvariantCulture) : "none")}",
                    VaretypeId = vtId,
                    Varetype = acc.Varetype,
                    Kvantitet = acc.AggregatedQuantity,
                    MaaleenhetId = meId,
                    Maaleenhet = acc.Maaleenhet,
                    SourceCount = acc.SourceCount,
                    PlannedMealIds = acc.PlannedMealIds.OrderBy(id => id).ToList(),
                    AlreadyOnList = onList,
                    SelectedByDefault = !onList
                };
            })
            .OrderBy(s => s.Varetype, StringComparer.OrdinalIgnoreCase)
            .ThenBy(s => s.Maaleenhet ?? "\uFFFF")
            .ThenBy(s => s.VaretypeId)
            .ThenBy(s => s.MaaleenhetId ?? ulong.MaxValue)
            .ToList();

        return Ok(new GenerateShoppingSuggestionsResponse
        {
            WeekStartDate = monday.ToString("yyyy-MM-dd"),
            PlannedMealCount = plannedMeals.Count(m => m.Oppskrift != null),
            Suggestions = suggestions
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateShoppingListItemRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var varetypeExists = await _db.Varetyper.AnyAsync(x => x.Id == request.VaretypeId);
        if (!varetypeExists) return NotFound(new { message = "Varetype ikke funnet." });

        var memberIds = await GetHouseholdMemberIds(userId.Value);
        if (request.VareId.HasValue && !await _db.Varer.AnyAsync(x =>
                x.Id == request.VareId.Value &&
                (!x.Brukerdefinert || x.UserId == null || memberIds.Contains(x.UserId.Value))))
            return NotFound(new { message = "Vare ikke funnet eller ikke tilgjengelig for husholdningen." });

        var row = new HandlelisteRad
        {
            VaretypeId = request.VaretypeId,
            VareId = request.VareId,
            UserId = userId.Value,
            Kvantitet = request.Kvantitet,
            MaaleenhetId = request.MaaleenhetId,
            Opprettet = DateTime.UtcNow,
            Endret = DateTime.UtcNow
        };

        _db.Handleliste.Add(row);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Vare lagt til i handleliste.", id = row.Id });
    }

    [HttpPut("{id:long}")]
    public async Task<IActionResult> Update(long id, UpdateShoppingListItemRequest request)
    {
        if (id < 1) return BadRequest(new { message = "Ugyldig id." });
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var memberIds = await GetHouseholdMemberIds(userId.Value);
        var row = await _db.Handleliste.Include(x => x.Bruker)
            .FirstOrDefaultAsync(x => x.Id == (ulong)id && memberIds.Contains(x.UserId));
        if (row == null) return NotFound(new { message = "Handleliste-rad ikke funnet." });

        if (request.VaretypeId.HasValue) row.VaretypeId = request.VaretypeId.Value;
        if (request.VareId.HasValue || request.VareId == null) row.VareId = request.VareId;
        if (request.Kvantitet.HasValue) row.Kvantitet = request.Kvantitet.Value;
        if (request.MaaleenhetId.HasValue || request.MaaleenhetId == null) row.MaaleenhetId = request.MaaleenhetId;
        row.Endret = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(new { message = "Handleliste oppdatert." });
    }

    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Delete(long id)
    {
        if (id < 1) return BadRequest(new { message = "Ugyldig id." });
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var memberIds = await GetHouseholdMemberIds(userId.Value);
        var row = await _db.Handleliste.FirstOrDefaultAsync(x => x.Id == (ulong)id && memberIds.Contains(x.UserId));
        if (row == null) return NotFound(new { message = "Handleliste-rad ikke funnet." });

        _db.Handleliste.Remove(row);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Handleliste-rad slettet." });
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
        if (householdId == null) return new List<ulong>();
        return await _db.Medlemmer.Where(x => x.HusholdningId == householdId.Value).Select(x => x.UserId).ToListAsync();
    }

    /// <summary>
    /// One aggregated bucket.
    /// <see cref="SourceCount"/> = total recipe ingredient rows contributed (may exceed <see cref="PlannedMealIds"/>.Count
    /// when one recipe has multiple rows with the same varetype+unit key).
    /// Quantity is null if any contributing ingredient row lacked a numeric amount.
    /// </summary>
    private sealed class ShoppingSuggestionAccumulator
    {
        public required string Varetype { get; init; }
        public string? Maaleenhet { get; init; }

        public int SourceCount { get; private set; }
        public HashSet<ulong> PlannedMealIds { get; } = new();

        private bool _anyNullQuantityLine;
        private decimal _numericSum;

        public void AddMeal(ulong plannedMealId, decimal? scaledQuantity)
        {
            SourceCount++;
            PlannedMealIds.Add(plannedMealId);
            if (!scaledQuantity.HasValue)
                _anyNullQuantityLine = true;
            else
                _numericSum += scaledQuantity.Value;
        }

        public decimal? AggregatedQuantity => _anyNullQuantityLine ? null : _numericSum;
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
}
