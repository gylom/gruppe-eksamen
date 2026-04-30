using System.ComponentModel.DataAnnotations.Schema;

namespace DefaultNamespace.Models;

/// <summary>
/// Many-to-many: which planned meals contributed to a shopping-list row (aggregated suggestions).
/// </summary>
[Table("HandlelistePlanlagteMaaltider")]
public class HandlelistePlanlagtMaaltidLink
{
    [Column("handleliste_id")]
    public ulong HandlelisteId { get; set; }

    [Column("planlagt_maaltid_id")]
    public ulong PlanlagtMaaltidId { get; set; }

    public HandlelisteRad Handleliste { get; set; } = null!;
    public PlanlagtMaaltid PlanlagtMaaltid { get; set; } = null!;
}
