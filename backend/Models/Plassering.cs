using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DefaultNamespace.Models;

public class Plassering
{
    [Key]
    [Column("id")]
    public ulong Id { get; set; }

    [Column("husholdning_id")]
    public ulong HusholdningId { get; set; }

    [Column("plassering")]
    public string Navn { get; set; } = string.Empty;

    public Husholdning? Husholdning { get; set; }
}
