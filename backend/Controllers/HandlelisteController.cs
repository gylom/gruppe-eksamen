using DefaultNamespace.Data;
using DefaultNamespace.DTOs;
using DefaultNamespace.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Data;
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
        if (memberIds.Count == 0)
            return Ok(new ShoppingListGetResponse());

        var items = await _db.Handleliste
            .Where(x => memberIds.Contains(x.UserId) && x.PurchasedAt == null && x.ArchivedAt == null)
            .Include(x => x.Varetype)
            .Include(x => x.Vare)
            .Include(x => x.Maaleenhet)
            .Include(x => x.Bruker)
            .OrderByDescending(x => x.Endret ?? x.Opprettet)
            .Select(x => new ActiveShoppingListRowDto
            {
                Id = x.Id,
                VaretypeId = x.VaretypeId,
                Varetype = x.Varetype!.Navn,
                VareId = x.VareId,
                Varenavn = x.Vare != null ? x.Vare.Varenavn : null,
                Kvantitet = x.Kvantitet,
                MaaleenhetId = x.MaaleenhetId,
                Maaleenhet = x.Maaleenhet != null ? x.Maaleenhet.Enhet : null,
                UserId = x.UserId,
                Brukernavn = x.Bruker!.Brukernavn,
                Kilde = x.Kilde,
                PlanlagtMaaltidId = x.PlanlagtMaaltidId,
                PurchasedAt = x.PurchasedAt,
                Opprettet = x.Opprettet,
                Endret = x.Endret,
            })
            .ToListAsync();

        var householdId = await GetHouseholdId(userId.Value);
        var forslag = new List<ShoppingListStockSuggestionDto>();
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
                .Select(x => new ShoppingListStockSuggestionDto
                {
                    VaretypeId = x.varetypeId,
                    Varetype = x.varetype,
                    ForslagKvantitet = x.minimumslager - x.tilgjengelig,
                    Begrunnelse = "Under minimumslager",
                })
                .ToList();
        }

        return Ok(new ShoppingListGetResponse { Varer = items, Forslag = forslag });
    }

    [HttpGet("purchased")]
    public async Task<IActionResult> GetPurchased()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var memberIds = await GetHouseholdMemberIds(userId.Value);
        if (memberIds.Count == 0)
            return Ok(new ShoppingListPurchasedResponse());

        var items = await _db.Handleliste
            .Where(x => memberIds.Contains(x.UserId) && x.PurchasedAt != null && x.ArchivedAt == null)
            .Include(x => x.Varetype)
            .Include(x => x.Vare)
            .Include(x => x.Maaleenhet)
            .Include(x => x.Bruker)
            .OrderByDescending(x => x.PurchasedAt)
            .ThenByDescending(x => x.Endret ?? x.Opprettet)
            .Select(x => new ActiveShoppingListRowDto
            {
                Id = x.Id,
                VaretypeId = x.VaretypeId,
                Varetype = x.Varetype!.Navn,
                VareId = x.VareId,
                Varenavn = x.Vare != null ? x.Vare.Varenavn : null,
                Kvantitet = x.Kvantitet,
                MaaleenhetId = x.MaaleenhetId,
                Maaleenhet = x.Maaleenhet != null ? x.Maaleenhet.Enhet : null,
                UserId = x.UserId,
                Brukernavn = x.Bruker!.Brukernavn,
                Kilde = x.Kilde,
                PlanlagtMaaltidId = x.PlanlagtMaaltidId,
                PurchasedAt = x.PurchasedAt,
                Opprettet = x.Opprettet,
                Endret = x.Endret,
            })
            .ToListAsync();

        return Ok(new ShoppingListPurchasedResponse { Varer = items });
    }

    [HttpGet("completion-preview")]
    public async Task<IActionResult> GetCompletionPreview()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var memberIds = await GetHouseholdMemberIds(userId.Value);
        if (memberIds.Count == 0)
        {
            return Ok(new ShoppingListCompletionSummaryDto
            {
                ArchiveRowCount = 0,
                CookbookMealCount = 0,
                RemainingActiveRowCount = 0,
                ArchivedAt = null,
            });
        }

        var summary = await BuildCompletionSummaryAsync(memberIds, forWrite: false);
        return Ok(summary);
    }

    [HttpPost("complete")]
    public async Task<IActionResult> CompleteShopping()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var memberIds = await GetHouseholdMemberIds(userId.Value);
        if (memberIds.Count == 0)
        {
            return Ok(new ShoppingListCompletionSummaryDto
            {
                ArchiveRowCount = 0,
                CookbookMealCount = 0,
                RemainingActiveRowCount = 0,
                ArchivedAt = null,
            });
        }

        await using var tx = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable);
        var summary = await BuildCompletionSummaryAsync(memberIds, forWrite: true);
        await tx.CommitAsync();
        return Ok(summary);
    }

    [HttpPost("{id:long}/purchase")]
    public async Task<IActionResult> Purchase(long id)
    {
        if (id < 1) return BadRequest(new { message = "Ugyldig id." });
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var memberIds = await GetHouseholdMemberIds(userId.Value);
        var row = await _db.Handleliste.FirstOrDefaultAsync(x => x.Id == (ulong)id && memberIds.Contains(x.UserId));
        if (row == null) return NotFound(new { message = "Handleliste-rad ikke funnet." });

        if (row.ArchivedAt != null)
            return Conflict(new { message = "Arkivert vare kan ikke markeres som kjøpt på nytt." });

        if (row.PurchasedAt != null)
        {
            return Ok(new ShoppingListPurchaseRestoreResponse
            {
                Message = "Handleliste oppdatert.",
                Id = row.Id,
                PurchasedAt = row.PurchasedAt,
            });
        }

        row.PurchasedAt = DateTime.UtcNow;
        row.Endret = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new ShoppingListPurchaseRestoreResponse
        {
            Message = "Handleliste oppdatert.",
            Id = row.Id,
            PurchasedAt = row.PurchasedAt,
        });
    }

    [HttpPost("{id:long}/restore")]
    public async Task<IActionResult> Restore(long id)
    {
        if (id < 1) return BadRequest(new { message = "Ugyldig id." });
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var memberIds = await GetHouseholdMemberIds(userId.Value);
        var row = await _db.Handleliste.FirstOrDefaultAsync(x => x.Id == (ulong)id && memberIds.Contains(x.UserId));
        if (row == null) return NotFound(new { message = "Handleliste-rad ikke funnet." });

        if (row.ArchivedAt != null)
            return Conflict(new { message = "Arkivert vare kan ikke gjenopprettes her." });

        if (row.PurchasedAt == null)
        {
            return Ok(new ShoppingListPurchaseRestoreResponse
            {
                Message = "Handleliste oppdatert.",
                Id = row.Id,
                PurchasedAt = null,
            });
        }

        var activeDuplicate = await _db.Handleliste.AnyAsync(x =>
            memberIds.Contains(x.UserId) &&
            x.Id != row.Id &&
            x.VaretypeId == row.VaretypeId &&
            x.MaaleenhetId == row.MaaleenhetId &&
            x.PurchasedAt == null &&
            x.ArchivedAt == null);
        if (activeDuplicate)
            return Conflict(new { message = "Denne varen er allerede på handlelisten." });

        var now = DateTime.UtcNow;
        var restored = await _db.Handleliste
            .Where(x =>
                x.Id == row.Id &&
                memberIds.Contains(x.UserId) &&
                x.PurchasedAt != null &&
                x.ArchivedAt == null)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(x => x.PurchasedAt, (DateTime?)null)
                .SetProperty(x => x.Endret, now));
        if (restored == 0)
            return Conflict(new { message = "Arkivert vare kan ikke gjenopprettes her." });

        return Ok(new ShoppingListPurchaseRestoreResponse
        {
            Message = "Handleliste oppdatert.",
            Id = row.Id,
            PurchasedAt = null,
        });
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
        var generated = await BuildWeeklyShoppingSuggestionsAsync(householdId.Value, memberIds, monday);
        return Ok(generated);
    }

    /// <summary>
    /// Inserts selected server-regenerated suggestion rows into the active household shopping list.
    /// </summary>
    [HttpPost("confirm-suggestions")]
    public async Task<IActionResult> ConfirmSuggestions([FromBody] ConfirmShoppingSuggestionsRequest? body)
    {
        var raw = body?.WeekStartDate?.Trim() ?? string.Empty;
        if (!TryParseMonday(raw, out var monday))
            return BadRequest(new { message = "weekStartDate må være en mandag i formatet YYYY-MM-DD." });

        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var selectedClientIds = body?.SelectedClientIds ?? new List<string>();
        if (selectedClientIds.Count == 0)
            return BadRequest(new { message = "Velg minst én rad å legge til." });

        var householdId = await GetHouseholdId(userId.Value);
        if (householdId == null)
            return BadRequest(new { message = "Du er ikke medlem av en husholdning." });

        var memberIds = await GetHouseholdMemberIds(userId.Value);
        var generated = await BuildWeeklyShoppingSuggestionsAsync(householdId.Value, memberIds, monday);

        var byClientId = generated.Suggestions.ToDictionary(s => s.ClientId);
        foreach (var clientId in selectedClientIds)
        {
            if (!byClientId.ContainsKey(clientId))
            {
                return Conflict(new { message = "Forslagene er utdaterte. Generer handleforslag på nytt." });
            }
        }

        await using var tx = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable);

        var lockedMembers = await _db.Medlemmer
            .FromSqlInterpolated($"SELECT * FROM Medlemmer WHERE husholdning_id = {householdId.Value} FOR UPDATE")
            .ToListAsync();
        var lockedMemberIds = lockedMembers.Select(x => x.UserId).ToList();

        var addedIds = new List<ulong>();
        var skippedAlreadyOnListCount = 0;
        var addedCount = 0;
        var now = DateTime.UtcNow;

        foreach (var clientId in selectedClientIds)
        {
            var sug = byClientId[clientId];
            var key = (sug.VaretypeId, sug.MaaleenhetId);
            var alreadyOnList = await _db.Handleliste.AnyAsync(x =>
                lockedMemberIds.Contains(x.UserId) &&
                x.VaretypeId == key.VaretypeId &&
                x.MaaleenhetId == key.MaaleenhetId &&
                x.ArchivedAt == null);
            if (alreadyOnList)
            {
                skippedAlreadyOnListCount++;
                continue;
            }

            ulong? firstMealId = sug.PlannedMealIds.Count > 0 ? sug.PlannedMealIds[0] : null;

            var row = new HandlelisteRad
            {
                VaretypeId = sug.VaretypeId,
                VareId = null,
                UserId = userId.Value,
                Kvantitet = sug.Kvantitet,
                MaaleenhetId = sug.MaaleenhetId,
                Opprettet = now,
                Endret = now,
                PlanlagtMaaltidId = firstMealId,
                Kilde = "plannedMeal",
            };

            _db.Handleliste.Add(row);
            await _db.SaveChangesAsync();

            foreach (var pmId in sug.PlannedMealIds.OrderBy(id => id))
            {
                _db.HandlelistePlanlagteMaaltider.Add(new HandlelistePlanlagtMaaltidLink
                {
                    HandlelisteId = row.Id,
                    PlanlagtMaaltidId = pmId,
                });
            }

            await _db.SaveChangesAsync();

            addedIds.Add(row.Id);
            addedCount++;
        }

        await tx.CommitAsync();

        return Ok(new ConfirmShoppingSuggestionsResponse
        {
            WeekStartDate = monday.ToString("yyyy-MM-dd"),
            RequestedCount = selectedClientIds.Count,
            AddedCount = addedCount,
            SkippedAlreadyOnListCount = skippedAlreadyOnListCount,
            AddedIds = addedIds,
        });
    }

    /// <summary>
    /// Shared server-side suggestion pipeline for generate-from-week and confirm-suggestions.
    /// </summary>
    private async Task<GenerateShoppingSuggestionsResponse> BuildWeeklyShoppingSuggestionsAsync(
        ulong householdId,
        List<ulong> memberIds,
        DateOnly monday)
    {
        var plannedMeals = await _db.PlanlagteMaaltider
            .AsNoTracking()
            .Where(x =>
                x.HusholdningId == householdId &&
                x.UkeStartDato == monday &&
                x.RemovedFromPlanAt == null)
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
            .Where(x => memberIds.Contains(x.UserId) && x.ArchivedAt == null)
            .Select(x => new { x.VaretypeId, x.MaaleenhetId })
            .ToListAsync();

        var onListKeys = listKeySet
            .Select(x => (x.VaretypeId, x.MaaleenhetId))
            .ToHashSet();

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

        return new GenerateShoppingSuggestionsResponse
        {
            WeekStartDate = monday.ToString("yyyy-MM-dd"),
            PlannedMealCount = plannedMeals.Count(m => m.Oppskrift != null),
            Suggestions = suggestions
        };
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateShoppingListItemRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        if (request.VaretypeId < 1) return BadRequest(new { message = "Varetype er påkrevd." });
        if (request.Kvantitet.HasValue && request.Kvantitet.Value < 0)
            return BadRequest(new { message = "Mengde kan ikke være negativ." });

        var varetypeExists = await _db.Varetyper.AnyAsync(x => x.Id == request.VaretypeId);
        if (!varetypeExists) return NotFound(new { message = "Varetype ikke funnet." });

        if (request.MaaleenhetId.HasValue &&
            !await _db.Maaleenheter.AnyAsync(x => x.Id == request.MaaleenhetId.Value))
            return NotFound(new { message = "Måleenhet ikke funnet." });

        var householdId = await GetHouseholdId(userId.Value);
        if (householdId == null) return BadRequest(new { message = "Du er ikke medlem av en husholdning." });

        await using var tx = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable);

        var lockedMembers = await _db.Medlemmer
            .FromSqlInterpolated($"SELECT * FROM Medlemmer WHERE husholdning_id = {householdId.Value} FOR UPDATE")
            .ToListAsync();
        var memberIds = lockedMembers.Select(x => x.UserId).ToList();
        if (memberIds.Count == 0) return BadRequest(new { message = "Du er ikke medlem av en husholdning." });

        if (request.VareId.HasValue &&
            !await IsVareAvailableForType(request.VareId.Value, request.VaretypeId, memberIds))
            return NotFound(new { message = "Vare ikke funnet eller ikke tilgjengelig for valgt varetype." });

        var duplicate = await _db.Handleliste.AnyAsync(x =>
            memberIds.Contains(x.UserId) &&
            x.VaretypeId == request.VaretypeId &&
            x.MaaleenhetId == request.MaaleenhetId &&
            x.ArchivedAt == null);
        if (duplicate)
            return Conflict(new { message = "Denne varen er allerede på handlelisten." });

        var row = new HandlelisteRad
        {
            VaretypeId = request.VaretypeId,
            VareId = request.VareId,
            UserId = userId.Value,
            Kvantitet = request.Kvantitet,
            MaaleenhetId = request.MaaleenhetId,
            Opprettet = DateTime.UtcNow,
            Endret = DateTime.UtcNow,
            Kilde = "manual",
        };

        _db.Handleliste.Add(row);
        await _db.SaveChangesAsync();
        await tx.CommitAsync();
        return Ok(new { message = "Vare lagt til i handleliste.", id = row.Id });
    }

    [HttpPut("{id:long}")]
    public async Task<IActionResult> Update(long id, UpdateShoppingListItemRequest request)
    {
        if (id < 1) return BadRequest(new { message = "Ugyldig id." });
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        if (request.VaretypeId < 1) return BadRequest(new { message = "Varetype er påkrevd." });
        if (request.Kvantitet.HasValue && request.Kvantitet.Value < 0)
            return BadRequest(new { message = "Mengde kan ikke være negativ." });

        var varetypeExists = await _db.Varetyper.AnyAsync(x => x.Id == request.VaretypeId);
        if (!varetypeExists) return NotFound(new { message = "Varetype ikke funnet." });

        if (request.MaaleenhetId.HasValue &&
            !await _db.Maaleenheter.AnyAsync(x => x.Id == request.MaaleenhetId.Value))
            return NotFound(new { message = "Måleenhet ikke funnet." });

        var memberIds = await GetHouseholdMemberIds(userId.Value);
        var row = await _db.Handleliste.Include(x => x.Bruker)
            .FirstOrDefaultAsync(x => x.Id == (ulong)id && memberIds.Contains(x.UserId));
        if (row == null) return NotFound(new { message = "Handleliste-rad ikke funnet." });

        if (row.PurchasedAt != null)
            return Conflict(new { message = "Kjøpt vare kan ikke redigeres her." });

        if (request.VareId.HasValue &&
            !await IsVareAvailableForType(request.VareId.Value, request.VaretypeId, memberIds))
            return NotFound(new { message = "Vare ikke funnet eller ikke tilgjengelig for valgt varetype." });

        var keyTaken = await _db.Handleliste.AnyAsync(x =>
            memberIds.Contains(x.UserId) &&
            x.Id != row.Id &&
            x.VaretypeId == request.VaretypeId &&
            x.MaaleenhetId == request.MaaleenhetId &&
            x.PurchasedAt == null &&
            x.ArchivedAt == null);
        if (keyTaken)
            return Conflict(new { message = "Denne varen er allerede på handlelisten." });

        row.VaretypeId = request.VaretypeId;
        row.VareId = request.VareId;
        row.Kvantitet = request.Kvantitet;
        row.MaaleenhetId = request.MaaleenhetId;
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

        if (row.ArchivedAt != null)
            return Conflict(new { message = "Arkivert handleliste-rad kan ikke slettes." });

        var deleted = await _db.Handleliste
            .Where(x => x.Id == row.Id && memberIds.Contains(x.UserId) && x.ArchivedAt == null)
            .ExecuteDeleteAsync();
        if (deleted == 0)
            return Conflict(new { message = "Arkivert handleliste-rad kan ikke slettes." });

        return Ok(new { message = "Handleliste-rad slettet." });
    }

    private async Task<ShoppingListCompletionSummaryDto> BuildCompletionSummaryAsync(
        List<ulong> memberIds,
        bool forWrite)
    {
        var toArchive = await _db.Handleliste
            .Where(x => memberIds.Contains(x.UserId) && x.PurchasedAt != null && x.ArchivedAt == null)
            .Include(x => x.PlanlagteMaaltidLinker)
            .ToListAsync();

        var archiveRowCount = toArchive.Count;
        var cookbookMealCount = CountDistinctCookbookMeals(toArchive);
        DateTime? archivedAt = null;

        if (forWrite && archiveRowCount > 0)
        {
            var utc = DateTime.UtcNow;
            foreach (var row in toArchive)
            {
                row.ArchivedAt = utc;
                row.Endret = utc;
            }
            await _db.SaveChangesAsync();
            archivedAt = utc;
        }

        var remainingActiveRowCount = await _db.Handleliste.CountAsync(x =>
            memberIds.Contains(x.UserId) && x.PurchasedAt == null && x.ArchivedAt == null);

        return new ShoppingListCompletionSummaryDto
        {
            ArchiveRowCount = archiveRowCount,
            CookbookMealCount = cookbookMealCount,
            RemainingActiveRowCount = remainingActiveRowCount,
            ArchivedAt = archivedAt,
        };
    }

    private static int CountDistinctCookbookMeals(IEnumerable<HandlelisteRad> rows)
    {
        var ids = new HashSet<ulong>();
        foreach (var row in rows)
        {
            if (row.Kilde != "plannedMeal") continue;
            if (row.PlanlagtMaaltidId.HasValue)
                ids.Add(row.PlanlagtMaaltidId.Value);
            foreach (var link in row.PlanlagteMaaltidLinker)
                ids.Add(link.PlanlagtMaaltidId);
        }
        return ids.Count;
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

    private async Task<bool> IsVareAvailableForType(ulong vareId, ulong varetypeId, List<ulong> memberIds)
    {
        return await _db.Varer.AnyAsync(x =>
            x.Id == vareId &&
            x.VaretypeId == varetypeId &&
            (!x.Brukerdefinert || x.UserId == null || memberIds.Contains(x.UserId.Value)));
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
