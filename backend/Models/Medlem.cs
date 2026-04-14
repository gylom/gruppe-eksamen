using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DefaultNamespace.Models;

public class Medlem
{
    [Key]
    [Column("id")]
    public ulong Id { get; set; }

    [Column("husholdning_id")]
    public ulong HusholdningId { get; set; }

    [Column("user_id")]
    public ulong UserId { get; set; }

    [Column("rolle")]
    public string Rolle { get; set; } = "medlem";

    public Husholdning? Husholdning { get; set; }
    public Bruker? Bruker { get; set; }
}
