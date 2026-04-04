namespace DefaultNamespace.DTOs;

public class CreateInventoryItemRequest
{
    public long ProductId { get; set; }
    public decimal Quantity { get; set; }
    public long? MeasurementUnitId { get; set; }
    public DateTime? ExpiryDate { get; set; }
}

public class UpdateInventoryItemRequest
{
    public decimal Quantity { get; set; }
    public long? MeasurementUnitId { get; set; }
    public DateTime? ExpiryDate { get; set; }
}