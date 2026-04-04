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
[Route("api")]
public class ShoppingListController : ControllerBase
{
    private readonly AppDbContext _db;

    public ShoppingListController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("handleliste")]
    public async Task<IActionResult> GetShoppingList()
    {
        var householdId = GetHouseholdId();
        if (householdId == null)
            return BadRequest(new { message = "User is not connected to a household." });

        var items = await _db.ShoppingListItems
            .Where(x => x.HouseholdId == householdId.Value)
            .Include(x => x.ProductType)
            .Include(x => x.MeasurementUnit)
            .OrderBy(x => x.Completed)
            .ThenByDescending(x => x.CreatedAt)
            .Select(x => new
            {
                x.Id,
                x.ProductTypeId,
                ProductTypeName = x.ProductType!.Name,
                x.Quantity,
                Unit = x.MeasurementUnit != null ? x.MeasurementUnit.UnitName : null,
                x.Completed,
                x.Note
            })
            .ToListAsync();

        return Ok(items);
    }

    [HttpPost("handleliste")]
    public async Task<IActionResult> AddShoppingListItem(CreateShoppingListItemRequest request)
    {
        var householdId = GetHouseholdId();
        var userId = GetUserId();

        if (householdId == null || userId == null)
            return BadRequest(new { message = "Missing user context." });

        var exists = await _db.ProductTypes.AnyAsync(x => x.Id == request.ProductTypeId);
        if (!exists)
            return NotFound(new { message = "Product type not found." });

        var item = new ShoppingListItem
        {
            HouseholdId = householdId.Value,
            ProductTypeId = request.ProductTypeId,
            Quantity = request.Quantity,
            MeasurementUnitId = request.MeasurementUnitId,
            Note = request.Note,
            CreatedByUserId = userId
        };

        _db.ShoppingListItems.Add(item);
        await _db.SaveChangesAsync();

        return Ok(item);
    }

    [HttpPut("handleliste/{id:long}")]
    public async Task<IActionResult> UpdateShoppingListItem(long id, UpdateShoppingListItemRequest request)
    {
        var householdId = GetHouseholdId();
        if (householdId == null)
            return BadRequest(new { message = "User is not connected to a household." });

        var item = await _db.ShoppingListItems.FirstOrDefaultAsync(x => x.Id == id && x.HouseholdId == householdId.Value);
        if (item == null)
            return NotFound(new { message = "Shopping list item not found." });

        item.Quantity = request.Quantity;
        item.MeasurementUnitId = request.MeasurementUnitId;
        item.Completed = request.Completed;
        item.Note = request.Note;

        await _db.SaveChangesAsync();

        return Ok(item);
    }

    [HttpGet("handlelisteforslag")]
    public async Task<IActionResult> GetSuggestions()
    {
        var householdId = GetHouseholdId();
        var userId = GetUserId();

        if (householdId == null || userId == null)
            return BadRequest(new { message = "Missing user context." });

        var inventoryTypeIds = await _db.InventoryItems
            .Where(x => x.HouseholdId == householdId.Value)
            .Select(x => x.Product!.ProductTypeId)
            .Distinct()
            .ToListAsync();

        var hiddenRecipeIds = await _db.HiddenRecipes
            .Where(x => x.UserId == userId)
            .Select(x => x.RecipeId)
            .ToListAsync();

        var suggestions = await _db.RecipeIngredients
            .Where(x =>
                !inventoryTypeIds.Contains(x.ProductTypeId) &&
                !hiddenRecipeIds.Contains(x.RecipeId) &&
                (x.Recipe!.CreatedByUserId == null || x.Recipe.CreatedByUserId == userId))
            .Include(x => x.ProductType)
            .GroupBy(x => new { x.ProductTypeId, x.ProductType!.Name })
            .Select(g => new
            {
                ProductTypeId = g.Key.ProductTypeId,
                ProductTypeName = g.Key.Name,
                SuggestedCount = g.Count()
            })
            .OrderByDescending(x => x.SuggestedCount)
            .Take(10)
            .ToListAsync();

        return Ok(suggestions);
    }

    private int? GetHouseholdId()
    {
        var value = User.FindFirstValue("householdId");
        return int.TryParse(value, out var id) ? id : null;
    }

    private string? GetUserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier);
    }
}