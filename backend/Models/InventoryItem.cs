namespace DefaultNamespace.Models;

public class InventoryItem
{
    public long Id { get; set; }

    public int HouseholdId { get; set; }
    public Household? Household { get; set; }

    public long ProductId { get; set; }
    public Product? Product { get; set; }

    public decimal Quantity { get; set; }

    public long? MeasurementUnitId { get; set; }
    public MeasurementUnit? MeasurementUnit { get; set; }

    public DateTime? ExpiryDate { get; set; }

    public string? AddedByUserId { get; set; }
    public User? AddedByUser { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}