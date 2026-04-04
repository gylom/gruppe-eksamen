namespace DefaultNamespace.Models;

public class ShoppingListItem
{
    public long Id { get; set; }

    public int HouseholdId { get; set; }
    public Household? Household { get; set; }

    public long ProductTypeId { get; set; }
    public ProductType? ProductType { get; set; }

    public decimal Quantity { get; set; }

    public long? MeasurementUnitId { get; set; }
    public MeasurementUnit? MeasurementUnit { get; set; }

    public bool Completed { get; set; } = false;
    public string? Note { get; set; }

    public string? CreatedByUserId { get; set; }
    public User? CreatedByUser { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}