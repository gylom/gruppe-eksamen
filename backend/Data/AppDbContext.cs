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
    public DbSet<HusholdningInvitasjon> HusholdningInvitasjoner => Set<HusholdningInvitasjon>();
    public DbSet<Varekategori> Varekategorier => Set<Varekategori>();
    public DbSet<Varetype> Varetyper => Set<Varetype>();
    public DbSet<Maaleenhet> Maaleenheter => Set<Maaleenhet>();
    public DbSet<Vare> Varer => Set<Vare>();
    public DbSet<Butikk> Butikker => Set<Butikk>();
    public DbSet<Butikkpris> Butikkpriser => Set<Butikkpris>();
    public DbSet<Husholdningsinnstilling> Husholdningsinnstillinger => Set<Husholdningsinnstilling>();
    public DbSet<Plassering> Plasseringer => Set<Plassering>();
    public DbSet<VarelagerRad> Varelager => Set<VarelagerRad>();
    public DbSet<HandlelisteRad> Handleliste => Set<HandlelisteRad>();
    public DbSet<HandlelistePlanlagtMaaltidLink> HandlelistePlanlagteMaaltider => Set<HandlelistePlanlagtMaaltidLink>();
    public DbSet<ForbrukRad> Forbruk => Set<ForbrukRad>();
    public DbSet<Oppskrift> Oppskrifter => Set<Oppskrift>();
    public DbSet<Oppskriftskategori> Oppskriftskategorier => Set<Oppskriftskategori>();
    public DbSet<Ingrediens> Ingredienser => Set<Ingrediens>();
    public DbSet<Skjuloppskrift> Skjuloppskrifter => Set<Skjuloppskrift>();
    public DbSet<PlanlagtMaaltid> PlanlagteMaaltider => Set<PlanlagtMaaltid>();
    public DbSet<PlanlagtMaaltidEkskludertIngrediens> PlanlagteMaaltidEkskluderteIngredienser =>
        Set<PlanlagtMaaltidEkskludertIngrediens>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Bruker>().ToTable("Brukere");
        modelBuilder.Entity<Husholdning>().ToTable("Husholdning");
        modelBuilder.Entity<Medlem>().ToTable("Medlemmer");
        modelBuilder.Entity<HusholdningInvitasjon>().ToTable("HusholdningInvitasjon");
        modelBuilder.Entity<Varekategori>().ToTable("Varekategori");
        modelBuilder.Entity<Varetype>().ToTable("Varetyper");
        modelBuilder.Entity<Maaleenhet>().ToTable("Maaleenheter");
        modelBuilder.Entity<Vare>().ToTable("Varer");
        modelBuilder.Entity<Butikk>().ToTable("Butikker");
        modelBuilder.Entity<Butikkpris>().ToTable("Butikkpriser");
        modelBuilder.Entity<Husholdningsinnstilling>().ToTable("Husholdningsinnstillinger");
        modelBuilder.Entity<Plassering>().ToTable("Plassering");
        modelBuilder.Entity<VarelagerRad>().ToTable("Varelager");
        modelBuilder.Entity<HandlelisteRad>().ToTable("Handleliste");
        modelBuilder.Entity<ForbrukRad>().ToTable("Forbruk");
        modelBuilder.Entity<Oppskrift>().ToTable("Oppskrifter");
        modelBuilder.Entity<Oppskriftskategori>().ToTable("Oppskriftskategorier");
        modelBuilder.Entity<Ingrediens>().ToTable("Ingredienser");
        modelBuilder.Entity<Skjuloppskrift>().ToTable("Skjuloppskrift");
        modelBuilder.Entity<Skjuloppskrift>().HasIndex(x => new { x.UserId, x.OppskriftId }).IsUnique();

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

        modelBuilder.Entity<Medlem>()
            .HasIndex(x => x.UserId)
            .IsUnique();

        modelBuilder.Entity<HusholdningInvitasjon>()
            .HasOne(x => x.Husholdning)
            .WithMany()
            .HasForeignKey(x => x.HusholdningId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<HusholdningInvitasjon>()
            .HasOne(x => x.CreatedByBruker)
            .WithMany()
            .HasForeignKey(x => x.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<HusholdningInvitasjon>()
            .HasOne(x => x.UsedByBruker)
            .WithMany()
            .HasForeignKey(x => x.UsedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<HusholdningInvitasjon>()
            .HasIndex(x => x.Kode)
            .IsUnique();

        modelBuilder.Entity<HusholdningInvitasjon>()
            .HasIndex(x => x.HusholdningId);

        modelBuilder.Entity<HusholdningInvitasjon>()
            .HasIndex(x => new { x.HusholdningId, x.RevokedAt, x.UsedAt, x.ExpiresAt });

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

        modelBuilder.Entity<Vare>()
            .HasOne(x => x.Bruker)
            .WithMany()
            .HasForeignKey(x => x.UserId);
        modelBuilder.Entity<Butikk>()
    .Property(x => x.Butikknavn)
    .HasColumnName("butikknavn");

        modelBuilder.Entity<Butikkpris>()
            .Property(x => x.VareId)
            .HasColumnName("vare_id");

        modelBuilder.Entity<Butikkpris>()
            .Property(x => x.ButikkId)
            .HasColumnName("butikk_id");

        modelBuilder.Entity<Butikkpris>()
            .Property(x => x.Pris)
            .HasColumnName("pris");

        modelBuilder.Entity<Butikkpris>()
            .Property(x => x.Datopris)
            .HasColumnName("datopris");

        modelBuilder.Entity<Butikkpris>()
            .Property(x => x.Tilbudspris)
            .HasColumnName("tilbudspris");

        modelBuilder.Entity<Butikkpris>()
            .Property(x => x.Tilbudfradato)
            .HasColumnName("tilbudfradato");

        modelBuilder.Entity<Butikkpris>()
            .Property(x => x.Tilbudtildato)
            .HasColumnName("tilbudtildato");

        modelBuilder.Entity<Butikkpris>()
            .HasOne(x => x.Vare)
            .WithMany(x => x.Butikkpriser)
            .HasForeignKey(x => x.VareId);

        modelBuilder.Entity<Butikkpris>()
            .HasOne(x => x.Butikk)
            .WithMany(x => x.Butikkpriser)
            .HasForeignKey(x => x.ButikkId);

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

        modelBuilder.Entity<HandlelisteRad>()
            .HasOne(x => x.Varetype)
            .WithMany()
            .HasForeignKey(x => x.VaretypeId);

        modelBuilder.Entity<HandlelisteRad>()
            .HasOne(x => x.Vare)
            .WithMany()
            .HasForeignKey(x => x.VareId);

        modelBuilder.Entity<HandlelisteRad>()
            .HasOne(x => x.Bruker)
            .WithMany()
            .HasForeignKey(x => x.UserId);

        modelBuilder.Entity<HandlelisteRad>()
            .HasOne(x => x.Maaleenhet)
            .WithMany()
            .HasForeignKey(x => x.MaaleenhetId);

        modelBuilder.Entity<ForbrukRad>()
            .HasOne(x => x.Bruker)
            .WithMany()
            .HasForeignKey(x => x.UserId);

        modelBuilder.Entity<ForbrukRad>()
            .HasOne(x => x.Vare)
            .WithMany()
            .HasForeignKey(x => x.VareId);

        modelBuilder.Entity<ForbrukRad>()
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

        modelBuilder.Entity<PlanlagtMaaltid>().ToTable("PlanlagteMaaltider");

        modelBuilder.Entity<PlanlagtMaaltid>()
            .HasOne(x => x.Husholdning)
            .WithMany()
            .HasForeignKey(x => x.HusholdningId);

        modelBuilder.Entity<PlanlagtMaaltid>()
            .HasOne(x => x.Oppskrift)
            .WithMany()
            .HasForeignKey(x => x.OppskriftId);

        modelBuilder.Entity<PlanlagtMaaltid>()
            .HasOne(x => x.Maaltidstype)
            .WithMany()
            .HasForeignKey(x => x.MaaltidstypeId);

        modelBuilder.Entity<PlanlagtMaaltid>()
            .HasIndex(x => new { x.HusholdningId, x.UkeStartDato, x.Dag, x.MaaltidstypeId })
            .IsUnique();

        modelBuilder.Entity<PlanlagtMaaltidEkskludertIngrediens>().ToTable("PlanlagteMaaltidEkskludertIngrediens");

        modelBuilder.Entity<PlanlagtMaaltidEkskludertIngrediens>()
            .HasOne(x => x.PlanlagtMaaltid)
            .WithMany(x => x.EkskluderteIngredienser)
            .HasForeignKey(x => x.PlanlagtMaaltidId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<PlanlagtMaaltidEkskludertIngrediens>()
            .HasOne(x => x.Ingrediens)
            .WithMany()
            .HasForeignKey(x => x.IngrediensId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<PlanlagtMaaltidEkskludertIngrediens>()
            .HasIndex(x => new { x.PlanlagtMaaltidId, x.IngrediensId })
            .IsUnique();

        modelBuilder.Entity<HandlelisteRad>()
            .HasOne(x => x.PlanlagtMaaltid)
            .WithMany()
            .HasForeignKey(x => x.PlanlagtMaaltidId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<HandlelistePlanlagtMaaltidLink>()
            .ToTable("HandlelistePlanlagteMaaltider")
            .HasKey(x => new { x.HandlelisteId, x.PlanlagtMaaltidId });

        modelBuilder.Entity<HandlelistePlanlagtMaaltidLink>()
            .HasOne(x => x.Handleliste)
            .WithMany(x => x.PlanlagteMaaltidLinker)
            .HasForeignKey(x => x.HandlelisteId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<HandlelistePlanlagtMaaltidLink>()
            .HasOne(x => x.PlanlagtMaaltid)
            .WithMany()
            .HasForeignKey(x => x.PlanlagtMaaltidId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
