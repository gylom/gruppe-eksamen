using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DefaultNamespace.Models;

public class Varetype
{
    [Key]
    [Column("id")]
    public ulong Id { get; set; }

    [Column("varetype")]
    public string Navn { get; set; } = string.Empty;

    [Column("kategori_id")]
    public ulong KategoriId { get; set; }

    public Varekategori? Kategori { get; set; }
    public ICollection<Vare> Varer { get; set; } = new List<Vare>();
}
