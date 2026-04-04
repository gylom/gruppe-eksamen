namespace DefaultNamespace.Models;

public class ProductCategory
{
    public long Id { get; set; }
    public string CategoryName { get; set; } = string.Empty;

    public long? ParentId { get; set; }
    public ProductCategory? Parent { get; set; }
    public ICollection<ProductCategory> Children { get; set; } = new List<ProductCategory>();

    public ICollection<ProductType> ProductTypes { get; set; } = new List<ProductType>();
}