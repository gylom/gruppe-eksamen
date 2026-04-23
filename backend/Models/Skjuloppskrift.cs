using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DefaultNamespace.Models;

public class Skjuloppskrift
{
    [Key]
    [Column("id")]
    public ulong Id { get; set; }

    [Column("oppskrift_id")]
    public ulong OppskriftId { get; set; }

    [Column("user_id")]
    public ulong UserId { get; set; }

    [Column("begrunnelse")]
    public string? Begrunnelse { get; set; }

    [Column("kommentar")]
    public string? Kommentar { get; set; }

    [Column("skjul")]
    public bool Skjul { get; set; } = true;

    [Column("karakter")]
    public int? Karakter { get; set; }

    public Oppskrift? Oppskrift { get; set; }
    public Bruker? Bruker { get; set; }
}
