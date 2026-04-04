namespace DefaultNamespace.DTOs;

public class CreateRecipeRequest
{
    public string Name { get; set; } = string.Empty;
    public string Instructions { get; set; } = string.Empty;
    public int Servings { get; set; }
    public string? ImageUrl { get; set; }

    public List<CreateRecipeIngredientRequest> Ingredients { get; set; } = new();
}

public class CreateRecipeIngredientRequest
{
    public long ProductTypeId { get; set; }
    public decimal Quantity { get; set; }
    public long? MeasurementUnitId { get; set; }
    public string Type { get; set; } = "ingredient";
    public bool Optional { get; set; } = false;
}