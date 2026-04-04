namespace DefaultNamespace.Models;

public class HiddenRecipe
{
    public long Id { get; set; }

    public long RecipeId { get; set; }
    public Recipe? Recipe { get; set; }

    public string UserId { get; set; } = string.Empty;
    public User? User { get; set; }

    public string? Reason { get; set; }
    public string? Comment { get; set; }
}