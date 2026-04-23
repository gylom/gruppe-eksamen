using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DefaultNamespace.Models;

public class Vare
{
    [Key]
    [Column("id")]
    public ulong Id { get; set; }

    [Column("varenavn")]
    public string Varenavn { get; set; } = string.Empty;

    [Column("varetype_id")]
    public ulong VaretypeId { get; set; }

    [Column("merke")]
    public string Merke { get; set; } = string.Empty;

    [Column("kvantitet")]
    public decimal Kvantitet { get; set; }

    [Column("maaleenhet_id")]
    public ulong MaaleenhetId { get; set; }

    [Column("ean")]
    public string? Ean { get; set; }

    [Column("user_id")]
    public ulong? UserId { get; set; }

    [Column("brukerdefinert")]
    public bool Brukerdefinert { get; set; }

    public Varetype? Varetype { get; set; }
    public Maaleenhet? Maaleenhet { get; set; }
    public Bruker? Bruker { get; set; }
}
