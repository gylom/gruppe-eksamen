using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DefaultNamespace.Models;

public class Oppskriftskategori
{
    [Key]
    [Column("id")]
    public ulong Id { get; set; }

    [Column("navn")]
    public string Navn { get; set; } = string.Empty;

    public ICollection<Oppskrift> Oppskrifter { get; set; } = new List<Oppskrift>();
}