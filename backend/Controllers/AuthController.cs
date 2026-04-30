using DefaultNamespace.Data;
using DefaultNamespace.DTOs;
using DefaultNamespace.Models;
using Microsoft.AspNetCore.Authorization;
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
    private readonly AppDbContext _db;
    private readonly IPasswordHasher<Bruker> _passwordHasher;
    private readonly IConfiguration _configuration;

    public AuthController(AppDbContext db, IPasswordHasher<Bruker> passwordHasher, IConfiguration configuration)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _configuration = configuration;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Brukernavn) || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Passord))
            return BadRequest(new { message = "Brukernavn, email og passord er påkrevd." });

        if (await _db.Brukere.AnyAsync(x => x.Brukernavn == request.Brukernavn))
            return BadRequest(new { message = "Brukernavn er allerede i bruk." });

        if (await _db.Brukere.AnyAsync(x => x.Email == request.Email))
            return BadRequest(new { message = "Email er allerede i bruk." });

        await using var tx = await _db.Database.BeginTransactionAsync();

        var bruker = new Bruker
        {
            Brukernavn = request.Brukernavn.Trim(),
            Email = request.Email.Trim(),
            Rolle = false,
            CreatedAt = DateTime.UtcNow
        };
        bruker.PassordHash = _passwordHasher.HashPassword(bruker, request.Passord);

        _db.Brukere.Add(bruker);
        await _db.SaveChangesAsync();

        ulong? householdId = null;
        string householdName = string.Empty;

        if (!string.IsNullOrWhiteSpace(request.HouseholdName))
        {
            var husholdning = new Husholdning
            {
                Navn = request.HouseholdName.Trim(),
                CreatedAt = DateTime.UtcNow
            };
            _db.Husholdninger.Add(husholdning);
            await _db.SaveChangesAsync();

            _db.Medlemmer.Add(new Medlem
            {
                HusholdningId = husholdning.Id,
                UserId = bruker.Id,
                Rolle = "eier"
            });
            await _db.SaveChangesAsync();

            householdId = husholdning.Id;
            householdName = husholdning.Navn;
        }

        await tx.CommitAsync();
        return Ok(BuildAuthResponse(bruker, householdId, householdName));
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var identifier = request.BrukernavnEllerEmail.Trim();
        var bruker = await _db.Brukere.FirstOrDefaultAsync(x => x.Brukernavn == identifier || x.Email == identifier);
        if (bruker == null)
            return Unauthorized(new { message = "Ugyldig brukernavn/email eller passord." });

        var verify = _passwordHasher.VerifyHashedPassword(bruker, bruker.PassordHash, request.Passord);
        if (verify == PasswordVerificationResult.Failed)
            return Unauthorized(new { message = "Ugyldig brukernavn/email eller passord." });

        var membership = await _db.Medlemmer
            .Include(x => x.Husholdning)
            .FirstOrDefaultAsync(x => x.UserId == bruker.Id);

        return Ok(BuildAuthResponse(bruker, membership?.HusholdningId, membership?.Husholdning?.Navn ?? string.Empty));
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!ulong.TryParse(claim, out var userId))
            return Unauthorized();

        var bruker = await _db.Brukere.FirstOrDefaultAsync(x => x.Id == userId);
        if (bruker == null)
            return Unauthorized();

        var membership = await _db.Medlemmer
            .Include(x => x.Husholdning)
            .FirstOrDefaultAsync(x => x.UserId == userId);

        return Ok(new MeResponse
        {
            UserId = bruker.Id,
            Brukernavn = bruker.Brukernavn,
            Email = bruker.Email,
            HouseholdId = membership?.HusholdningId,
            HouseholdName = membership?.Husholdning?.Navn ?? string.Empty,
            HouseholdRole = membership?.Rolle
        });
    }

    private AuthResponse BuildAuthResponse(Bruker bruker, ulong? householdId, string householdName)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, bruker.Id.ToString()),
            new(ClaimTypes.Name, bruker.Brukernavn),
            new(ClaimTypes.Email, bruker.Email),
            new("rolle", bruker.Rolle ? "admin" : "user")
        };

        if (householdId.HasValue)
            claims.Add(new Claim("householdId", householdId.Value.ToString()));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds);

        return new AuthResponse
        {
            Token = new JwtSecurityTokenHandler().WriteToken(token),
            UserId = bruker.Id,
            Brukernavn = bruker.Brukernavn,
            Email = bruker.Email,
            HouseholdId = householdId,
            HouseholdName = householdName,
            FullName = string.IsNullOrWhiteSpace(bruker.Brukernavn) ? bruker.Email : bruker.Brukernavn
        };
    }
}
