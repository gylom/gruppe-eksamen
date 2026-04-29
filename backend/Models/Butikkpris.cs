using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DefaultNamespace.Models;

public class Butikkpris
{
    public ulong Id { get; set; }

    public ulong VareId { get; set; }
    public Vare Vare { get; set; } = null!;

    public ulong ButikkId { get; set; }
    public Butikk Butikk { get; set; } = null!;

    public decimal Pris { get; set; }
    public DateOnly Datopris { get; set; }

    public decimal? Tilbudspris { get; set; }
    public DateOnly? Tilbudfradato { get; set; }
    public DateOnly? Tilbudtildato { get; set; }
}