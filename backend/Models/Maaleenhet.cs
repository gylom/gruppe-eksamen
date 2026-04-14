using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DefaultNamespace.Models;

public class Maaleenhet
{
    [Key]
    [Column("id")]
    public ulong Id { get; set; }

    [Column("enhet")]
    public string Enhet { get; set; } = string.Empty;

    [Column("type")]
    public string Type { get; set; } = string.Empty;
}
