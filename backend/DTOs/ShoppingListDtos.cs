namespace DefaultNamespace.DTOs;

public class CreateShoppingListItemRequest
{
    public ulong VaretypeId { get; set; }
    public ulong? VareId { get; set; }
    public decimal? Kvantitet { get; set; }
    public ulong? MaaleenhetId { get; set; }
}

public class UpdateShoppingListItemRequest
{
    public ulong? VaretypeId { get; set; }
    public ulong? VareId { get; set; }
    public decimal? Kvantitet { get; set; }
    public ulong? MaaleenhetId { get; set; }
}
