using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DefaultNamespace.Models;

public class OppskriftVurdering
{
    [Key]
    [Column("id")]
    public ulong Id { get; set; }

    [Column("oppskrift_id")]
    public ulong OppskriftId { get; set; }

    [Column("husholdning_id")]
    public ulong HusholdningId { get; set; }

    [Column("rating")]
    public string Rating { get; set; } = "C";

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    public Oppskrift? Oppskrift { get; set; }
    public Husholdning? Husholdning { get; set; }
}
