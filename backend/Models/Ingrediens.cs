using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DefaultNamespace.Models;

public class Ingrediens
{
    [Key]
    [Column("id")]
    public ulong Id { get; set; }

    [Column("oppskrift_id")]
    public ulong OppskriftId { get; set; }

    [Column("varetype_id")]
    public ulong VaretypeId { get; set; }

    [Column("kvantitet")]
    public decimal? Kvantitet { get; set; }

    [Column("maaleenhet_id")]
    public ulong? MaaleenhetId { get; set; }

    [Column("type")]
    public string? Type { get; set; }

    [Column("valgfritt")]
    public bool? Valgfritt { get; set; }

    public Oppskrift? Oppskrift { get; set; }
    public Varetype? Varetype { get; set; }
    public Maaleenhet? Maaleenhet { get; set; }
}
