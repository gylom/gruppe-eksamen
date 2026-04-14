using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DefaultNamespace.Models;

public class Husholdningsinnstilling
{
    [Key]
    [Column("id")]
    public ulong Id { get; set; }

    [Column("husholdning_id")]
    public ulong HusholdningId { get; set; }

    [Column("varetype_id")]
    public ulong VaretypeId { get; set; }

    [Column("minimumslager")]
    public decimal? Minimumslager { get; set; }

    [Column("beredskapslager")]
    public bool? Beredskapslager { get; set; }

    public Husholdning? Husholdning { get; set; }
    public Varetype? Varetype { get; set; }
}
