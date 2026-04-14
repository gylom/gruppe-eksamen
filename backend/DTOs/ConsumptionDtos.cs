namespace DefaultNamespace.DTOs;

public class CreateConsumptionRequest
{
    public ulong? VarelagerId { get; set; }
    public ulong? VareId { get; set; }
    public decimal Kvantitet { get; set; }
    public ulong? MaaleenhetId { get; set; }
    public DateTime? Forbruksdato { get; set; }
    public decimal? Innkjopspris { get; set; }
}
