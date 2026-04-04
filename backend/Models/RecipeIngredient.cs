namespace DefaultNamespace.Models;

public class RecipeIngredient
{
    public long Id { get; set; }

    public long RecipeId { get; set; }
    public Recipe? Recipe { get; set; }

    public long ProductTypeId { get; set; }
    public ProductType? ProductType { get; set; }

    public decimal Quantity { get; set; }

    public long? MeasurementUnitId { get; set; }
    public MeasurementUnit? MeasurementUnit { get; set; }

    public string Type { get; set; } = "ingredient";
    public bool Optional { get; set; } = false;
}