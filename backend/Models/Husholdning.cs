using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DefaultNamespace.Models;

public class Husholdning
{
    [Key]
    [Column("id")]
    public ulong Id { get; set; }

    [Column("navn")]
    public string Navn { get; set; } = string.Empty;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    public ICollection<Medlem> Medlemmer { get; set; } = new List<Medlem>();
}
