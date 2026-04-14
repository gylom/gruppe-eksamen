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

    public Varetype? Varetype { get; set; }
    public Vare? Vare { get; set; }
    public Bruker? Bruker { get; set; }
    public Maaleenhet? Maaleenhet { get; set; }
}
