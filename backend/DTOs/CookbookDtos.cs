namespace DefaultNamespace.DTOs;

public class CookbookHistoryResponseDto
{
    public List<CookbookHistoryItemDto> Items { get; set; } = [];
}

public class CookbookHistoryItemDto
{
    public ulong RecipeId { get; set; }
    public string RecipeName { get; set; } = string.Empty;
    public ulong MealTypeId { get; set; }
    public string MealType { get; set; } = string.Empty;
    public int CookedCount { get; set; }
    public DateTime LastCookedAt { get; set; }
    public int? CurrentUserRating { get; set; }
    public int RecipePortions { get; set; }
    public string? Bilde { get; set; }
    public ulong? KategoriId { get; set; }
    public string? Kategori { get; set; }
}
