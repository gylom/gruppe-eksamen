namespace DefaultNamespace.DTOs;

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
