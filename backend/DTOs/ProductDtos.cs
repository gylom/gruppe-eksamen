namespace DefaultNamespace.DTOs;

public class CreateProductRequest
{
    public string Varenavn { get; set; } = string.Empty;
    public ulong VaretypeId { get; set; }
    public string? Merke { get; set; }
    public decimal? Kvantitet { get; set; }
    public ulong MaaleenhetId { get; set; }
    public string? Ean { get; set; }
    public ulong? ButikkId { get; set; }
    public decimal? Pris { get; set; }
    public DateOnly? Datopris { get; set; }

    public decimal? Tilbudspris { get; set; }
    public DateOnly? TilbudFra { get; set; }
    public DateOnly? TilbudTil { get; set; }
}
