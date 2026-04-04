namespace DefaultNamespace.Models;

public class Recipe
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Instructions { get; set; } = string.Empty;
    public int Servings { get; set; }

    public string? CreatedByUserId { get; set; }
    public User? CreatedByUser { get; set; }

    public string? ImageUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<RecipeIngredient> Ingredients { get; set; } = new List<RecipeIngredient>();
    public ICollection<HiddenRecipe> HiddenByUsers { get; set; } = new List<HiddenRecipe>();
}