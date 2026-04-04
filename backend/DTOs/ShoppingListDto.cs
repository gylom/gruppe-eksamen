namespace DefaultNamespace.DTOs;

public class CreateShoppingListItemRequest
{
    public long ProductTypeId { get; set; }
    public decimal Quantity { get; set; }
    public long? MeasurementUnitId { get; set; }
    public string? Note { get; set; }
}

public class UpdateShoppingListItemRequest
{
    public decimal Quantity { get; set; }
    public long? MeasurementUnitId { get; set; }
    public bool Completed { get; set; }
    public string? Note { get; set; }
}