using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DefaultNamespace.Models;

public class HandlelisteRad
{
    [Key]
    [Column("id")]
    public ulong Id { get; set; }

    [Column("varetype_id")]
    public ulong VaretypeId { get; set; }

    [Column("vare_id")]
    public ulong? VareId { get; set; }

    [Column("user_id")]
    public ulong UserId { get; set; }

    [Column("kvantitet")]
    public decimal? Kvantitet { get; set; }

    [Column("maaleenhet_id")]
    public ulong? MaaleenhetId { get; set; }

    [Column("opprettet")]
    public DateTime? Opprettet { get; set; }

    [Column("endret")]
    public DateTime? Endret { get; set; }

    [Column("planlagt_maaltid_id")]
    public ulong? PlanlagtMaaltidId { get; set; }

    [Column("purchased_at")]
    public DateTime? PurchasedAt { get; set; }

    [Column("archived_at")]
    public DateTime? ArchivedAt { get; set; }

    /// <summary>e.g. manual, plannedMeal</summary>
    [Column("kilde")]
    public string Kilde { get; set; } = "manual";

    public Varetype? Varetype { get; set; }
    public Vare? Vare { get; set; }
    public Bruker? Bruker { get; set; }
    public Maaleenhet? Maaleenhet { get; set; }

    public PlanlagtMaaltid? PlanlagtMaaltid { get; set; }

    public ICollection<HandlelistePlanlagtMaaltidLink> PlanlagteMaaltidLinker { get; set; } =
        new List<HandlelistePlanlagtMaaltidLink>();
}
