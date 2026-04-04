namespace DefaultNamespace.Models;

public class ProductType
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;

    public long CategoryId { get; set; }
    public ProductCategory? Category { get; set; }

    public ICollection<Product> Products { get; set; } = new List<Product>();
    public ICollection<RecipeIngredient> RecipeIngredients { get; set; } = new List<RecipeIngredient>();
}