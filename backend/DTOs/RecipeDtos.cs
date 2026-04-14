namespace DefaultNamespace.DTOs;

public class RecipeIngredientInput
{
    public ulong VaretypeId { get; set; }
    public decimal? Kvantitet { get; set; }
    public ulong? MaaleenhetId { get; set; }
    public string? Type { get; set; }
    public bool? Valgfritt { get; set; }
}

public class CreateRecipeRequest
{
    public string Navn { get; set; } = string.Empty;
    public string Instruksjoner { get; set; } = string.Empty;
    public int Porsjoner { get; set; }
    public string? Bilde { get; set; }
    public List<RecipeIngredientInput> Ingredienser { get; set; } = new();
}
