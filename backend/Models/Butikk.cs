using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DefaultNamespace.Models;

public class Butikk
{
    public ulong Id { get; set; }
    public string Butikknavn { get; set; } = string.Empty;

    public ICollection<Butikkpris> Butikkpriser { get; set; } = new List<Butikkpris>();
}