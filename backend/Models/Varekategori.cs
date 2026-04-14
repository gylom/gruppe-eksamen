using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DefaultNamespace.Models;

public class Varekategori
{
    [Key]
    [Column("id")]
    public ulong Id { get; set; }

    [Column("kategorinavn")]
    public string Kategorinavn { get; set; } = string.Empty;

    [Column("parent_id")]
    public ulong? ParentId { get; set; }

    public Varekategori? Parent { get; set; }
    public ICollection<Varekategori> Children { get; set; } = new List<Varekategori>();
    public ICollection<Varetype> Varetyper { get; set; } = new List<Varetype>();
}
