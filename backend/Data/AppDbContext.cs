using DefaultNamespace.Models;
using Microsoft.EntityFrameworkCore;

namespace DefaultNamespace.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Bruker> Brukere => Set<Bruker>();
    public DbSet<Husholdning> Husholdninger => Set<Husholdning>();
    public DbSet<Medlem> Medlemmer => Set<Medlem>();
    public DbSet<Varekategori> Varekategorier => Set<Varekategori>();
    public DbSet<Varetype> Varetyper => Set<Varetype>();
    public DbSet<Maaleenhet> Maaleenheter => Set<Maaleenhet>();
    public DbSet<Vare> Varer => Set<Vare>();
    public DbSet<Husholdningsinnstilling> Husholdningsinnstillinger => Set<Husholdningsinnstilling>();
    public DbSet<Plassering> Plasseringer => Set<Plassering>();
    public DbSet<VarelagerRad> Varelager => Set<VarelagerRad>();
    public DbSet<Oppskrift> Oppskrifter => Set<Oppskrift>();
    public DbSet<Ingrediens> Ingredienser => Set<Ingrediens>();
    public DbSet<Skjuloppskrift> Skjuloppskrifter => Set<Skjuloppskrift>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Bruker>().ToTable("Brukere");
        modelBuilder.Entity<Husholdning>().ToTable("Husholdning");
        modelBuilder.Entity<Medlem>().ToTable("Medlemmer");
        modelBuilder.Entity<Varekategori>().ToTable("Varekategori");
        modelBuilder.Entity<Varetype>().ToTable("Varetyper");
        modelBuilder.Entity<Maaleenhet>().ToTable("Maaleenheter");
        modelBuilder.Entity<Vare>().ToTable("Varer");
        modelBuilder.Entity<Husholdningsinnstilling>().ToTable("Husholdningsinnstillinger");
        modelBuilder.Entity<Plassering>().ToTable("Plassering");
        modelBuilder.Entity<VarelagerRad>().ToTable("Varelager");
        modelBuilder.Entity<Oppskrift>().ToTable("Oppskrifter");
        modelBuilder.Entity<Ingrediens>().ToTable("Ingredienser");
        modelBuilder.Entity<Skjuloppskrift>().ToTable("Skjuloppskrift");

        modelBuilder.Entity<Varekategori>()
            .HasOne(x => x.Parent)
            .WithMany(x => x.Children)
            .HasForeignKey(x => x.ParentId);

        modelBuilder.Entity<Medlem>()
            .HasOne(x => x.Husholdning)
            .WithMany(x => x.Medlemmer)
            .HasForeignKey(x => x.HusholdningId);

        modelBuilder.Entity<Medlem>()
            .HasOne(x => x.Bruker)
            .WithMany(x => x.Medlemskap)
            .HasForeignKey(x => x.UserId);

        modelBuilder.Entity<Varetype>()
            .HasOne(x => x.Kategori)
            .WithMany(x => x.Varetyper)
            .HasForeignKey(x => x.KategoriId);

        modelBuilder.Entity<Vare>()
            .HasOne(x => x.Varetype)
            .WithMany(x => x.Varer)
            .HasForeignKey(x => x.VaretypeId);

        modelBuilder.Entity<Vare>()
            .HasOne(x => x.Maaleenhet)
            .WithMany()
            .HasForeignKey(x => x.MaaleenhetId);

        modelBuilder.Entity<Husholdningsinnstilling>()
            .HasOne(x => x.Husholdning)
            .WithMany()
            .HasForeignKey(x => x.HusholdningId);

        modelBuilder.Entity<Husholdningsinnstilling>()
            .HasOne(x => x.Varetype)
            .WithMany()
            .HasForeignKey(x => x.VaretypeId);

        modelBuilder.Entity<Plassering>()
            .HasOne(x => x.Husholdning)
            .WithMany()
            .HasForeignKey(x => x.HusholdningId);

        modelBuilder.Entity<VarelagerRad>()
            .HasOne(x => x.Vare)
            .WithMany()
            .HasForeignKey(x => x.VareId);

        modelBuilder.Entity<VarelagerRad>()
            .HasOne(x => x.Husholdning)
            .WithMany()
            .HasForeignKey(x => x.HusholdningId);

        modelBuilder.Entity<VarelagerRad>()
            .HasOne(x => x.Plassering)
            .WithMany()
            .HasForeignKey(x => x.PlasseringId);

        modelBuilder.Entity<VarelagerRad>()
            .HasOne(x => x.Maaleenhet)
            .WithMany()
            .HasForeignKey(x => x.MaaleenhetId);

        modelBuilder.Entity<Oppskrift>()
            .HasOne(x => x.Bruker)
            .WithMany()
            .HasForeignKey(x => x.UserId);

        modelBuilder.Entity<Ingrediens>()
            .HasOne(x => x.Oppskrift)
            .WithMany(x => x.Ingredienser)
            .HasForeignKey(x => x.OppskriftId);

        modelBuilder.Entity<Ingrediens>()
            .HasOne(x => x.Varetype)
            .WithMany()
            .HasForeignKey(x => x.VaretypeId);

        modelBuilder.Entity<Ingrediens>()
            .HasOne(x => x.Maaleenhet)
            .WithMany()
            .HasForeignKey(x => x.MaaleenhetId);

        modelBuilder.Entity<Skjuloppskrift>()
            .HasOne(x => x.Oppskrift)
            .WithMany()
            .HasForeignKey(x => x.OppskriftId);

        modelBuilder.Entity<Skjuloppskrift>()
            .HasOne(x => x.Bruker)
            .WithMany()
            .HasForeignKey(x => x.UserId);
    }
}
