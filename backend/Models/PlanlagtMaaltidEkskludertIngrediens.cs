using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DefaultNamespace.Models;

public class PlanlagtMaaltidEkskludertIngrediens
{
    [Key]
    [Column("id")]
    public ulong Id { get; set; }

    [Column("planlagt_maaltid_id")]
    public ulong PlanlagtMaaltidId { get; set; }

    [Column("ingrediens_id")]
    public ulong IngrediensId { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    public PlanlagtMaaltid? PlanlagtMaaltid { get; set; }
    public Ingrediens? Ingrediens { get; set; }
}
