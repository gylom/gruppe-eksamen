using DefaultNamespace.Data;
using DefaultNamespace.DTOs;
using DefaultNamespace.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace DefaultNamespace.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<User> _userManager;
    private readonly AppDbContext _db;
    private readonly IConfiguration _configuration;

    public AuthController(UserManager<User> userManager, AppDbContext db, IConfiguration configuration)
    {
        _userManager = userManager;
        _db = db;
        _configuration = configuration;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        if (await _userManager.FindByEmailAsync(request.Email) != null)
            return BadRequest(new { message = "Email already in use." });

        int? householdId = request.HouseholdId;

        if (householdId == null && !string.IsNullOrWhiteSpace(request.HouseholdName))
        {
            var household = new Household { Name = request.HouseholdName.Trim() };
            _db.Households.Add(household);
            await _db.SaveChangesAsync();
            householdId = household.Id;
        }

        var user = new User
        {
            UserName = request.Email,
            Email = request.Email,
            FullName = request.FullName,
            EmailConfirmed = true,
            HouseholdId = householdId
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            return BadRequest(result.Errors);

        await _userManager.AddToRoleAsync(user, "User");

        return Ok(BuildAuthResponse(user));
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var user = await _userManager.Users.FirstOrDefaultAsync(x => x.Email == request.Email);
        if (user == null)
            return Unauthorized(new { message = "Invalid email or password." });

        var valid = await _userManager.CheckPasswordAsync(user, request.Password);
        if (!valid)
            return Unauthorized(new { message = "Invalid email or password." });

        return Ok(BuildAuthResponse(user));
    }

    private AuthResponse BuildAuthResponse(User user)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Name, user.FullName ?? user.Email ?? ""),
            new(ClaimTypes.Email, user.Email ?? "")
        };

        if (user.HouseholdId.HasValue)
            claims.Add(new Claim("householdId", user.HouseholdId.Value.ToString()));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds
        );

        return new AuthResponse
        {
            Token = new JwtSecurityTokenHandler().WriteToken(token),
            UserId = user.Id,
            Email = user.Email ?? "",
            HouseholdId = user.HouseholdId,
            FullName = user.FullName
        };
    }
}