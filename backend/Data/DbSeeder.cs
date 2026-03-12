using DefaultNamespace.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace DefaultNamespace.Data;

public static class DbSeeder
{
    public static async Task SeedRolesAndAdminAsync(IServiceProvider serviceProvider)
    {
        var context = serviceProvider.GetRequiredService<AppDbContext>();
        var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = serviceProvider.GetRequiredService<UserManager<User>>();

        string[] roles = { "GlobalAdmin", "HouseholdAdmin", "User" };

        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
            }
        }

        // Global admin
        var globalAdminEmail = "admin@matlager.no";
        var globalAdmin = await userManager.FindByEmailAsync(globalAdminEmail);

        if (globalAdmin == null)
        {
            globalAdmin = new User
            {
                UserName = globalAdminEmail,
                Email = globalAdminEmail,
                FullName = "System Admin",
                EmailConfirmed = true,
                HouseholdId = null
            };

            var result = await userManager.CreateAsync(globalAdmin, "Admin123!");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(globalAdmin, "GlobalAdmin");
            }
        }

        // Sample households
        var hansenHousehold = await context.Households.FirstOrDefaultAsync(h => h.Name == "Hansen Family");
        if (hansenHousehold == null)
        {
            hansenHousehold = new Household
            {
                Name = "Hansen Family"
            };
            context.Households.Add(hansenHousehold);
        }

        var bergHousehold = await context.Households.FirstOrDefaultAsync(h => h.Name == "Berg Household");
        if (bergHousehold == null)
        {
            bergHousehold = new Household
            {
                Name = "Berg Household"
            };
            context.Households.Add(bergHousehold);
        }

        await context.SaveChangesAsync();

        // Household admin - Hansen
        await CreateUserIfNotExists(
            userManager,
            email: "ola@hansen.no",
            fullName: "Ola Hansen",
            password: "Password123!",
            householdId: hansenHousehold.Id,
            role: "HouseholdAdmin"
        );

        // Regular user - Hansen
        await CreateUserIfNotExists(
            userManager,
            email: "kari@hansen.no",
            fullName: "Kari Hansen",
            password: "Password123!",
            householdId: hansenHousehold.Id,
            role: "User"
        );

        // Household admin - Berg
        await CreateUserIfNotExists(
            userManager,
            email: "per@berg.no",
            fullName: "Per Berg",
            password: "Password123!",
            householdId: bergHousehold.Id,
            role: "HouseholdAdmin"
        );

        // Regular user - Berg
        await CreateUserIfNotExists(
            userManager,
            email: "anne@berg.no",
            fullName: "Anne Berg",
            password: "Password123!",
            householdId: bergHousehold.Id,
            role: "User"
        );
    }

    private static async Task CreateUserIfNotExists(
        UserManager<User> userManager,
        string email,
        string fullName,
        string password,
        int householdId,
        string role)
    {
        var existingUser = await userManager.FindByEmailAsync(email);
        if (existingUser != null)
            return;

        var user = new User
        {
            UserName = email,
            Email = email,
            FullName = fullName,
            EmailConfirmed = true,
            HouseholdId = householdId
        };

        var result = await userManager.CreateAsync(user, password);
        if (result.Succeeded)
        {
            await userManager.AddToRoleAsync(user, role);
        }
    }
}