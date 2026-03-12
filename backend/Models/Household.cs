using System.ComponentModel.DataAnnotations;

namespace DefaultNamespace.Models;

public class Household
{
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public ICollection<User> Users { get; set; } = new List<User>();
}