namespace DefaultNamespace.Models;

public class Product
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;

    public long ProductTypeId { get; set; }
    public ProductType? ProductType { get; set; }

    public string? Brand { get; set; }
    public decimal? StandardQuantity { get; set; }

    public long? MeasurementUnitId { get; set; }
    public MeasurementUnit? MeasurementUnit { get; set; }

    public string? Ean { get; set; }
}