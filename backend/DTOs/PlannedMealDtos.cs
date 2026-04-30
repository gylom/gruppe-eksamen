namespace DefaultNamespace.DTOs;

public class PlannedMealIngredientDto
{
    public ulong Id { get; set; }
    public ulong VaretypeId { get; set; }
    public string Varetype { get; set; } = string.Empty;
    public decimal? Kvantitet { get; set; }
    public ulong? MaaleenhetId { get; set; }
    public string? Maaleenhet { get; set; }
    public string? Type { get; set; }
    public bool? Valgfritt { get; set; }
    public bool Excluded { get; set; }
}

public class PlannedMealDto
{
    public ulong Id { get; set; }
    public string WeekStartDate { get; set; } = string.Empty;
    public int Day { get; set; }
    public ulong MealTypeId { get; set; }
    public string MealType { get; set; } = string.Empty;
    public ulong OppskriftId { get; set; }
    public string OppskriftNavn { get; set; } = string.Empty;
    public int Servings { get; set; }
    public List<PlannedMealIngredientDto> Ingredients { get; set; } = new();
}

public class CreatePlannedMealRequest
{
    public ulong OppskriftId { get; set; }
    public string WeekStartDate { get; set; } = string.Empty;
    public int Day { get; set; }
    public ulong MealTypeId { get; set; }
    public int Servings { get; set; }
}

public class UpdatePlannedMealServingsRequest
{
    public int Servings { get; set; }
}

public class ExcludeIngredientRequest
{
    public ulong IngrediensId { get; set; }
}
