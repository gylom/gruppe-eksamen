namespace DefaultNamespace.DTOs;

public class CreateInventoryRequest
{
    public ulong VareId { get; set; }
    public decimal Kvantitet { get; set; }
    public decimal? Pris { get; set; }
    public DateOnly? BestForDato { get; set; }
    public DateTime? Kjopsdato { get; set; }
    public ulong? PlasseringId { get; set; }
    public ulong? MaaleenhetId { get; set; }
}

public class UpdateInventoryRequest
{
    public decimal? Kvantitet { get; set; }
    public decimal? Pris { get; set; }
    public DateOnly? BestForDato { get; set; }
    public DateTime? Kjopsdato { get; set; }
    public ulong? PlasseringId { get; set; }
    public ulong? MaaleenhetId { get; set; }
    public decimal? Minimumslager { get; set; }
    public bool? Beredskapslager { get; set; }
}

public class TakeFromInventoryRequest
{
    public decimal Kvantitet { get; set; }
}

public class UpsertHouseholdSettingRequest
{
    public ulong VaretypeId { get; set; }
    public decimal? Minimumslager { get; set; }
    public bool? Beredskapslager { get; set; }
}
