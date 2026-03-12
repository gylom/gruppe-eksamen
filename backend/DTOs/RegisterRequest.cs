namespace DefaultNamespace.DTOs;

public class RegisterRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;

    public string? HouseholdName { get; set; }
    public int? HouseholdId { get; set; }
}