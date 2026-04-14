using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DefaultNamespace.Models;

public class VarelagerRad
{
    [Key]
    [Column("id")]
    public ulong Id { get; set; }

    [Column("vare_id")]
    public ulong VareId { get; set; }

    [Column("husholdning_id")]
    public ulong HusholdningId { get; set; }

    [Column("pris")]
    public decimal? Pris { get; set; }

    [Column("kvantitet")]
    public decimal Kvantitet { get; set; }

    [Column("bestfordato")]
    public DateOnly? BestForDato { get; set; }

    [Column("plassering_id")]
    public ulong? PlasseringId { get; set; }

    [Column("kjopsdato")]
    public DateTime? Kjopsdato { get; set; }

    [Column("maaleenhet_id")]
    public ulong MaaleenhetId { get; set; }

    public Vare? Vare { get; set; }
    public Husholdning? Husholdning { get; set; }
    public Plassering? Plassering { get; set; }
    public Maaleenhet? Maaleenhet { get; set; }
}
