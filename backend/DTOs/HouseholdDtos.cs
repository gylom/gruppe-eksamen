namespace DefaultNamespace.DTOs;

public class CreateHouseholdRequest
{
    public string Navn { get; set; } = string.Empty;
}

public class UpdateHouseholdRequest
{
    public string Navn { get; set; } = string.Empty;
}

public class AddMemberRequest
{
    public ulong? UserId { get; set; }
    public string? BrukernavnEllerEmail { get; set; }
    public string Rolle { get; set; } = "medlem";
}

public class CreatePlacementRequest
{
    public string Plassering { get; set; } = string.Empty;
}

public class UpdatePlacementRequest
{
    public string Plassering { get; set; } = string.Empty;
}
