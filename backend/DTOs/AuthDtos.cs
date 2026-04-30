namespace DefaultNamespace.DTOs;

public class RegisterRequest
{
    public string Brukernavn { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Passord { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? HouseholdName { get; set; }
}

public class LoginRequest
{
    public string BrukernavnEllerEmail { get; set; } = string.Empty;
    public string Passord { get; set; } = string.Empty;
}

public class AuthResponse
{
    public string Token { get; set; } = string.Empty;
    public ulong UserId { get; set; }
    public string Brukernavn { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public ulong? HouseholdId { get; set; }
    public string HouseholdName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
}

public class MeResponse
{
    public ulong UserId { get; set; }
    public string Brukernavn { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public ulong? HouseholdId { get; set; }
    public string HouseholdName { get; set; } = string.Empty;
    public string? HouseholdRole { get; set; }
}
