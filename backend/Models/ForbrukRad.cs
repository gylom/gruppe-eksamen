using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DefaultNamespace.Models;

public class ForbrukRad
{
    [Key]
    [Column("id")]
    public ulong Id { get; set; }

    [Column("user_id")]
    public ulong UserId { get; set; }

    [Column("vare_id")]
    public ulong VareId { get; set; }

    [Column("forbruksdato")]
    public DateTime? Forbruksdato { get; set; }

    [Column("innkjopspris")]
    public decimal? Innkjopspris { get; set; }

    [Column("maaleenhet_id")]
    public ulong? MaaleenhetId { get; set; }

    [Column("kvantitet")]
    public decimal? Kvantitet { get; set; }

    public Bruker? Bruker { get; set; }
    public Vare? Vare { get; set; }
    public Maaleenhet? Maaleenhet { get; set; }
}
