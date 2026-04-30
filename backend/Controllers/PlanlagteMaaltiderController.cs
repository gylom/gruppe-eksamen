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
            .Include(x => x.Oppskrift)
            .Include(x => x.Maaltidstype)
            .OrderBy(x => x.Dag)
            .ThenBy(x => x.MaaltidstypeId)
            .ToListAsync();

        var dto = rows.Select(MapToDto).ToList();
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

        await _db.Entry(entity).Reference(x => x.Oppskrift).LoadAsync();
        await _db.Entry(entity).Reference(x => x.Maaltidstype).LoadAsync();

        return Ok(MapToDto(entity));
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
            .Include(x => x.Oppskrift)
            .Include(x => x.Maaltidstype)
            .FirstOrDefaultAsync(x => x.Id == (ulong)id && x.HusholdningId == householdId.Value);

        if (entity == null)
            return NotFound(new { message = "Planlagt måltid ikke funnet." });

        entity.Porsjoner = request.Servings;
        entity.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(MapToDto(entity));
    }

    private static PlannedMealDto MapToDto(PlanlagtMaaltid x)
    {
        return new PlannedMealDto
        {
            Id = x.Id,
            WeekStartDate = x.UkeStartDato.ToString("yyyy-MM-dd"),
            Day = x.Dag,
            MealTypeId = x.MaaltidstypeId,
            MealType = x.Maaltidstype?.Navn ?? string.Empty,
            OppskriftId = x.OppskriftId,
            OppskriftNavn = x.Oppskrift?.Navn ?? string.Empty,
            Servings = x.Porsjoner
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
