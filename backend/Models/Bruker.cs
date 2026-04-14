using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DefaultNamespace.Models;

public class Bruker
{
    [Key]
    [Column("id")]
    public ulong Id { get; set; }

    [Column("brukernavn")]
    public string Brukernavn { get; set; } = string.Empty;

    [Column("passord_hash")]
    public string PassordHash { get; set; } = string.Empty;

    [Column("email")]
    public string Email { get; set; } = string.Empty;

    [Column("rolle")]
    public bool Rolle { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    public ICollection<Medlem> Medlemskap { get; set; } = new List<Medlem>();
}
