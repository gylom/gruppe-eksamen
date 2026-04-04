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
public class InventoryController : ControllerBase
{
    private readonly AppDbContext _db;

    public InventoryController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetInventory()
    {
        var householdId = GetHouseholdId();
        if (householdId == null)
            return BadRequest(new { message = "User is not connected to a household." });

        var items = await _db.InventoryItems
            .Where(x => x.HouseholdId == householdId.Value)
            .Include(x => x.Product)
                .ThenInclude(p => p!.ProductType)
            .Include(x => x.MeasurementUnit)
            .OrderBy(x => x.ExpiryDate)
            .Select(x => new
            {
                x.Id,
                x.ProductId,
                ProductName = x.Product!.Name,
                ProductTypeName = x.Product.ProductType!.Name,
                x.Quantity,
                Unit = x.MeasurementUnit != null ? x.MeasurementUnit.UnitName : null,
                x.ExpiryDate,
                x.CreatedAt
            })
            .ToListAsync();

        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> AddInventoryItem(CreateInventoryItemRequest request)
    {
        var householdId = GetHouseholdId();
        var userId = GetUserId();

        if (householdId == null || userId == null)
            return BadRequest(new { message = "Missing user context." });

        var productExists = await _db.Products.AnyAsync(x => x.Id == request.ProductId);
        if (!productExists)
            return NotFound(new { message = "Product not found." });

        var item = new InventoryItem
        {
            HouseholdId = householdId.Value,
            ProductId = request.ProductId,
            Quantity = request.Quantity,
            MeasurementUnitId = request.MeasurementUnitId,
            ExpiryDate = request.ExpiryDate,
            AddedByUserId = userId
        };

        _db.InventoryItems.Add(item);
        await _db.SaveChangesAsync();

        return Ok(item);
    }

    [HttpPut("{id:long}")]
    public async Task<IActionResult> UpdateInventoryItem(long id, UpdateInventoryItemRequest request)
    {
        var householdId = GetHouseholdId();
        if (householdId == null)
            return BadRequest(new { message = "User is not connected to a household." });

        var item = await _db.InventoryItems.FirstOrDefaultAsync(x => x.Id == id && x.HouseholdId == householdId.Value);
        if (item == null)
            return NotFound(new { message = "Inventory item not found." });

        item.Quantity = request.Quantity;
        item.MeasurementUnitId = request.MeasurementUnitId;
        item.ExpiryDate = request.ExpiryDate;

        await _db.SaveChangesAsync();

        return Ok(item);
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