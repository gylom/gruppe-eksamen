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
[Route("api/oppskrifter")]
public class RecipesController : ControllerBase
{
    private readonly AppDbContext _db;

    public RecipesController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAvailableRecipes()
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized();

        var hiddenIds = await _db.HiddenRecipes
            .Where(x => x.UserId == userId)
            .Select(x => x.RecipeId)
            .ToListAsync();

        var recipes = await _db.Recipes
            .Where(x => (x.CreatedByUserId == null || x.CreatedByUserId == userId) && !hiddenIds.Contains(x.Id))
            .Include(x => x.Ingredients)
                .ThenInclude(i => i.ProductType)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new
            {
                x.Id,
                x.Name,
                x.Instructions,
                x.Servings,
                x.ImageUrl,
                x.CreatedAt,
                x.CreatedByUserId,
                Ingredients = x.Ingredients.Select(i => new
                {
                    i.Id,
                    i.ProductTypeId,
                    ProductTypeName = i.ProductType!.Name,
                    i.Quantity,
                    i.MeasurementUnitId,
                    i.Type,
                    i.Optional
                })
            })
            .ToListAsync();

        return Ok(recipes);
    }

    [HttpGet("bruker/{brukerId}")]
    public async Task<IActionResult> GetRecipesByUser(string brukerId)
    {
        var recipes = await _db.Recipes
            .Where(x => x.CreatedByUserId == brukerId)
            .Include(x => x.Ingredients)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        return Ok(recipes);
    }

    [HttpGet("husholdning/{husholdningId:int}")]
    public async Task<IActionResult> GetRecipesByHousehold(int husholdningId)
    {
        var householdUserIds = await _db.Users
            .Where(x => x.HouseholdId == husholdningId)
            .Select(x => x.Id)
            .ToListAsync();

        var recipes = await _db.Recipes
            .Where(x => x.CreatedByUserId != null && householdUserIds.Contains(x.CreatedByUserId))
            .Include(x => x.Ingredients)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        return Ok(recipes);
    }

    [HttpPost]
    public async Task<IActionResult> CreateRecipe(CreateRecipeRequest request)
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized();

        var recipe = new Recipe
        {
            Name = request.Name,
            Instructions = request.Instructions,
            Servings = request.Servings,
            ImageUrl = request.ImageUrl,
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow
        };

        foreach (var ingredient in request.Ingredients)
        {
            recipe.Ingredients.Add(new RecipeIngredient
            {
                ProductTypeId = ingredient.ProductTypeId,
                Quantity = ingredient.Quantity,
                MeasurementUnitId = ingredient.MeasurementUnitId,
                Type = ingredient.Type,
                Optional = ingredient.Optional
            });
        }

        _db.Recipes.Add(recipe);
        await _db.SaveChangesAsync();

        return Ok(recipe);
    }

    [HttpPost("{id:long}/skjul")]
    public async Task<IActionResult> HideRecipe(long id)
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized();

        var exists = await _db.HiddenRecipes.AnyAsync(x => x.RecipeId == id && x.UserId == userId);
        if (exists)
            return Ok(new { message = "Recipe already hidden." });

        _db.HiddenRecipes.Add(new HiddenRecipe
        {
            RecipeId = id,
            UserId = userId
        });

        await _db.SaveChangesAsync();

        return Ok(new { message = "Recipe hidden." });
    }

    [HttpDelete("{id:long}/skjul")]
    public async Task<IActionResult> UnhideRecipe(long id)
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized();

        var hidden = await _db.HiddenRecipes.FirstOrDefaultAsync(x => x.RecipeId == id && x.UserId == userId);
        if (hidden == null)
            return NotFound(new { message = "Hidden recipe not found." });

        _db.HiddenRecipes.Remove(hidden);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Recipe unhidden." });
    }

    private string? GetUserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier);
    }
}