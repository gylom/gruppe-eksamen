using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations.Schema;

namespace DefaultNamespace.Models;

public class User : IdentityUser
{
    public int? HouseholdId { get; set; }

    [ForeignKey(nameof(HouseholdId))]
    public Household? Household { get; set; }

    public string FullName { get; set; } = string.Empty;
}