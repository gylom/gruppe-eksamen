using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DefaultNamespace.Models;

public class PlanlagtMaaltid
{
    [Key]
    [Column("id")]
    public ulong Id { get; set; }

    [Column("husholdning_id")]
    public ulong HusholdningId { get; set; }

    [Column("oppskrift_id")]
    public ulong OppskriftId { get; set; }

    [Column("uke_start_dato", TypeName = "date")]
    public DateOnly UkeStartDato { get; set; }

    [Column("dag")]
    public int Dag { get; set; }

    [Column("maaltidstype_id")]
    public ulong MaaltidstypeId { get; set; }

    [Column("porsjoner")]
    public int Porsjoner { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }

    public Husholdning? Husholdning { get; set; }
    public Oppskrift? Oppskrift { get; set; }
    public Oppskriftskategori? Maaltidstype { get; set; }

    public ICollection<PlanlagtMaaltidEkskludertIngrediens> EkskluderteIngredienser { get; set; } =
        new List<PlanlagtMaaltidEkskludertIngrediens>();
}
