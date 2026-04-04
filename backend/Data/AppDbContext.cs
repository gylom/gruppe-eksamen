using DefaultNamespace.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace DefaultNamespace.Data;

public class AppDbContext : IdentityDbContext<User>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Household> Households => Set<Household>();
    public DbSet<ProductCategory> ProductCategories => Set<ProductCategory>();
    public DbSet<ProductType> ProductTypes => Set<ProductType>();
    public DbSet<MeasurementUnit> MeasurementUnits => Set<MeasurementUnit>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<InventoryItem> InventoryItems => Set<InventoryItem>();
    public DbSet<ShoppingListItem> ShoppingListItems => Set<ShoppingListItem>();
    public DbSet<Recipe> Recipes => Set<Recipe>();
    public DbSet<RecipeIngredient> RecipeIngredients => Set<RecipeIngredient>();
    public DbSet<HiddenRecipe> HiddenRecipes => Set<HiddenRecipe>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Household>()
            .HasMany(h => h.Users)
            .WithOne(u => u.Household)
            .HasForeignKey(u => u.HouseholdId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<ProductCategory>()
            .HasOne(x => x.Parent)
            .WithMany(x => x.Children)
            .HasForeignKey(x => x.ParentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Product>()
            .Property(x => x.StandardQuantity)
            .HasPrecision(10, 2);

        builder.Entity<InventoryItem>()
            .Property(x => x.Quantity)
            .HasPrecision(10, 2);

        builder.Entity<ShoppingListItem>()
            .Property(x => x.Quantity)
            .HasPrecision(10, 2);

        builder.Entity<RecipeIngredient>()
            .Property(x => x.Quantity)
            .HasPrecision(10, 2);
    }
}