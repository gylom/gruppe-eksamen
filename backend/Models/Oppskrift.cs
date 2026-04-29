using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DefaultNamespace.Models;

public class Oppskrift
{
    [Key]
    [Column("id")]
    public ulong Id { get; set; }

    [Column("navn")]
    public string Navn { get; set; } = string.Empty;

    [Column("instruksjoner")]
    public string Instruksjoner { get; set; } = string.Empty;

    [Column("porsjoner")]
    public int Porsjoner { get; set; }

    [Column("user_id")]
    public ulong UserId { get; set; }

    [Column("bilde")]
    public string? Bilde { get; set; }
    
    [Column("kategori_id")]
    public ulong? KategoriId { get; set; }

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; }

    public Bruker? Bruker { get; set; }
    public ICollection<Ingrediens> Ingredienser { get; set; } = new List<Ingrediens>();
    public Oppskriftskategori? Kategori { get; set; }
}
