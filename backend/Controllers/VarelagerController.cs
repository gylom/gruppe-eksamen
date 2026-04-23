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
[Route("api/varelager")]
public class VarelagerController : ControllerBase
{
    private readonly AppDbContext _db;
    public VarelagerController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var householdId = GetHouseholdId();
        if (householdId == null) return BadRequest(new { message = "Brukeren er ikke medlem av husholdning." });

        var rows = await _db.Varelager
            .Where(x => x.HusholdningId == householdId.Value)
            .Include(x => x.Vare)!.ThenInclude(x => x!.Varetype)!.ThenInclude(x => x!.Kategori)
            .Include(x => x.Maaleenhet)
            .Include(x => x.Plassering)
            .OrderBy(x => x.BestForDato)
            .ToListAsync();

        var settings = await _db.Husholdningsinnstillinger
            .Where(x => x.HusholdningId == householdId.Value)
            .Include(x => x.Varetype)!.ThenInclude(x => x!.Kategori)
            .ToListAsync();

        var grouped = rows.GroupBy(x => new
        {
            x.VareId,
            x.Vare!.Varenavn,
            x.Vare.VaretypeId,
            Varetype = x.Vare.Varetype!.Navn,
            Kategori = x.Vare.Varetype.Kategori!.Kategorinavn,
            x.MaaleenhetId,
            Enhet = x.Maaleenhet!.Enhet
        })
        .Select(g =>
        {
            var setting = settings.FirstOrDefault(s => s.VaretypeId == g.Key.VaretypeId);
            return new
            {
                vare_id = g.Key.VareId,
                varenavn = g.Key.Varenavn,
                varetype_id = g.Key.VaretypeId,
                varetype = g.Key.Varetype,
                kategori = g.Key.Kategori,
                antall_enheter = g.Count(),
                total_kvantitet = g.Sum(x => x.Kvantitet),
                maaleenhet_id = g.Key.MaaleenhetId,
                maaleenhet = g.Key.Enhet,
                minimumslager = setting?.Minimumslager ?? 0,
                beredskapslager = setting?.Beredskapslager ?? false,
                plasseringer = g.Where(x => x.Plassering != null).Select(x => x.Plassering!.Navn).Distinct().ToList(),
                varer = g.Select(x => new
                {
                    id = x.Id,
                    pris = x.Pris,
                    kvantitet = x.Kvantitet,
                    bestfordato = x.BestForDato,
                    kjopsdato = x.Kjopsdato,
                    plassering_id = x.PlasseringId,
                    plassering = x.Plassering != null ? x.Plassering.Navn : null,
                    maaleenhet_id = x.MaaleenhetId,
                    maaleenhet = x.Maaleenhet!.Enhet
                }).ToList()
            };
        }).ToList();

        var missingSettings = settings
            .Where(s => grouped.All(g => g.varetype_id != s.VaretypeId))
            .Select(s => new
            {
                vare_id = 0UL,
                varenavn = $"Ingen vare registrert for {s.Varetype!.Navn}",
                varetype_id = s.VaretypeId,
                varetype = s.Varetype.Navn,
                kategori = s.Varetype.Kategori!.Kategorinavn,
                antall_enheter = 0,
                total_kvantitet = 0m,
                maaleenhet_id = (ulong?)null,
                maaleenhet = (string?)null,
                minimumslager = s.Minimumslager ?? 0,
                beredskapslager = s.Beredskapslager ?? false,
                plasseringer = new List<string>(),
                varer = new List<object>()
            });

        return Ok(grouped.Cast<object>().Concat(missingSettings.Cast<object>()));
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateInventoryRequest request)
    {
        var householdId = GetHouseholdId();
        if (householdId == null) return BadRequest(new { message = "Brukeren er ikke medlem av husholdning." });

        var householdMemberIds = await _db.Medlemmer
            .Where(x => x.HusholdningId == householdId.Value)
            .Select(x => x.UserId)
            .ToListAsync();

        var vare = await _db.Varer.FirstOrDefaultAsync(x =>
            x.Id == request.VareId &&
            (!x.Brukerdefinert || x.UserId == null || householdMemberIds.Contains(x.UserId.Value)));
        if (vare == null) return NotFound(new { message = "Vare ikke funnet eller ikke tilgjengelig for husholdningen." });

        var row = new VarelagerRad
        {
            VareId = request.VareId,
            HusholdningId = householdId.Value,
            Pris = request.Pris,
            Kvantitet = request.Kvantitet,
            BestForDato = request.BestForDato,
            Kjopsdato = request.Kjopsdato,
            PlasseringId = request.PlasseringId,
            MaaleenhetId = request.MaaleenhetId ?? vare.MaaleenhetId
        };

        _db.Varelager.Add(row);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Vare lagt til i varelager.", id = row.Id });
    }

    [HttpPut("{id:long}")]
    public async Task<IActionResult> Update(ulong id, UpdateInventoryRequest request)
    {
        var householdId = GetHouseholdId();
        if (householdId == null) return BadRequest(new { message = "Brukeren er ikke medlem av husholdning." });

        var row = await _db.Varelager.Include(x => x.Vare)
            .FirstOrDefaultAsync(x => x.Id == id && x.HusholdningId == householdId.Value);
        if (row == null) return NotFound(new { message = "Varelager-rad ikke funnet." });

        if (request.Kvantitet.HasValue) row.Kvantitet = request.Kvantitet.Value;
        if (request.Pris.HasValue) row.Pris = request.Pris.Value;
        if (request.BestForDato.HasValue) row.BestForDato = request.BestForDato.Value;
        if (request.Kjopsdato.HasValue) row.Kjopsdato = request.Kjopsdato.Value;
        if (request.PlasseringId.HasValue) row.PlasseringId = request.PlasseringId.Value;
        if (request.MaaleenhetId.HasValue) row.MaaleenhetId = request.MaaleenhetId.Value;

        if (request.Minimumslager.HasValue || request.Beredskapslager.HasValue)
        {
            var setting = await _db.Husholdningsinnstillinger.FirstOrDefaultAsync(x => x.HusholdningId == householdId.Value && x.VaretypeId == row.Vare!.VaretypeId);
            if (setting == null)
            {
                setting = new Husholdningsinnstilling
                {
                    HusholdningId = householdId.Value,
                    VaretypeId = row.Vare.VaretypeId,
                    Minimumslager = request.Minimumslager,
                    Beredskapslager = request.Beredskapslager
                };
                _db.Husholdningsinnstillinger.Add(setting);
            }
            else
            {
                if (request.Minimumslager.HasValue) setting.Minimumslager = request.Minimumslager.Value;
                if (request.Beredskapslager.HasValue) setting.Beredskapslager = request.Beredskapslager.Value;
            }
        }

        await _db.SaveChangesAsync();
        return Ok(new { message = "Varelager oppdatert." });
    }

    [HttpPost("{id:long}/taut")]
    public async Task<IActionResult> TakeOut(ulong id, TakeFromInventoryRequest request)
    {
        var householdId = GetHouseholdId();
        if (householdId == null) return BadRequest(new { message = "Brukeren er ikke medlem av husholdning." });

        var row = await _db.Varelager.FirstOrDefaultAsync(x => x.Id == id && x.HusholdningId == householdId.Value);
        if (row == null) return NotFound(new { message = "Varelager-rad ikke funnet." });
        if (request.Kvantitet <= 0) return BadRequest(new { message = "Kvantitet må være større enn 0." });

        row.Kvantitet -= request.Kvantitet;
        if (row.Kvantitet <= 0)
            _db.Varelager.Remove(row);

        await _db.SaveChangesAsync();
        return Ok(new { message = "Vare tatt ut av varelager." });
    }

    [HttpPost("innstillinger")]
    public async Task<IActionResult> UpsertSetting(UpsertHouseholdSettingRequest request)
    {
        var householdId = GetHouseholdId();
        if (householdId == null) return BadRequest(new { message = "Brukeren er ikke medlem av husholdning." });

        var setting = await _db.Husholdningsinnstillinger
            .FirstOrDefaultAsync(x => x.HusholdningId == householdId.Value && x.VaretypeId == request.VaretypeId);

        if (setting == null)
        {
            setting = new Husholdningsinnstilling
            {
                HusholdningId = householdId.Value,
                VaretypeId = request.VaretypeId,
                Minimumslager = request.Minimumslager,
                Beredskapslager = request.Beredskapslager
            };
            _db.Husholdningsinnstillinger.Add(setting);
        }
        else
        {
            setting.Minimumslager = request.Minimumslager;
            setting.Beredskapslager = request.Beredskapslager;
        }

        await _db.SaveChangesAsync();
        return Ok(new { message = "Husholdningsinnstillinger lagret." });
    }

    private ulong? GetHouseholdId()
    {
        var claim = User.FindFirstValue("householdId");
        return ulong.TryParse(claim, out var id) ? id : null;
    }
}
