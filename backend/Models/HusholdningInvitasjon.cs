using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DefaultNamespace.Models;

public class HusholdningInvitasjon
{
    [Key]
    [Column("id")]
    public ulong Id { get; set; }

    [Column("husholdning_id")]
    public ulong HusholdningId { get; set; }

    [Column("kode")]
    [MaxLength(6)]
    public string Kode { get; set; } = string.Empty;

    [Column("created_by_user_id")]
    public ulong CreatedByUserId { get; set; }

    [Column("used_by_user_id")]
    public ulong? UsedByUserId { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("expires_at")]
    public DateTime ExpiresAt { get; set; }

    [Column("revoked_at")]
    public DateTime? RevokedAt { get; set; }

    [Column("used_at")]
    public DateTime? UsedAt { get; set; }

    public Husholdning? Husholdning { get; set; }
    public Bruker? CreatedByBruker { get; set; }
    public Bruker? UsedByBruker { get; set; }
}
