namespace DefaultNamespace.DTOs;

public class CreateShoppingListItemRequest
{
    public ulong VaretypeId { get; set; }
    public ulong? VareId { get; set; }
    public decimal? Kvantitet { get; set; }
    public ulong? MaaleenhetId { get; set; }
}

/// <summary>
/// Full replacement of editable fields for a row. Server preserves <c>Kilde</c>, <c>PlanlagtMaaltidId</c>,
/// and <c>HandlelistePlanlagteMaaltider</c> links.
/// </summary>
public class UpdateShoppingListItemRequest
{
    public ulong VaretypeId { get; set; }
    public ulong? VareId { get; set; }
    public decimal? Kvantitet { get; set; }
    public ulong? MaaleenhetId { get; set; }
}

public class ActiveShoppingListRowDto
{
    public ulong Id { get; set; }
    public ulong VaretypeId { get; set; }
    public string Varetype { get; set; } = string.Empty;
    public ulong? VareId { get; set; }
    public string? Varenavn { get; set; }
    public decimal? Kvantitet { get; set; }
    public ulong? MaaleenhetId { get; set; }
    public string? Maaleenhet { get; set; }
    public ulong UserId { get; set; }
    public string Brukernavn { get; set; } = string.Empty;
    public string Kilde { get; set; } = string.Empty;
    public ulong? PlanlagtMaaltidId { get; set; }
    public DateTime? PurchasedAt { get; set; }
    public DateTime? Opprettet { get; set; }
    public DateTime? Endret { get; set; }
}

public class ShoppingListStockSuggestionDto
{
    public ulong VaretypeId { get; set; }
    public string Varetype { get; set; } = string.Empty;
    public decimal ForslagKvantitet { get; set; }
    public string Begrunnelse { get; set; } = string.Empty;
}

public class ShoppingListGetResponse
{
    public List<ActiveShoppingListRowDto> Varer { get; set; } = new();
    public List<ShoppingListStockSuggestionDto> Forslag { get; set; } = new();
}

public class GenerateShoppingSuggestionsRequest
{
    public string WeekStartDate { get; set; } = string.Empty;
}

public class GenerateShoppingSuggestionsResponse
{
    public string WeekStartDate { get; set; } = string.Empty;
    public int PlannedMealCount { get; set; }
    public List<ShoppingSuggestionDto> Suggestions { get; set; } = new();
}

/// <summary>
/// Deduped suggestion row from the weekly plan.
/// <see cref="SourceCount"/> = total recipe ingredient rows contributing to this key (may exceed <see cref="PlannedMealIds"/>.Count
/// when one recipe has multiple ingredient rows with the same varetype+unit).
/// </summary>
public class ShoppingSuggestionDto
{
    public string ClientId { get; set; } = string.Empty;
    public ulong VaretypeId { get; set; }
    public string Varetype { get; set; } = string.Empty;
    public decimal? Kvantitet { get; set; }
    public ulong? MaaleenhetId { get; set; }
    public string? Maaleenhet { get; set; }

    /// <summary>Total recipe ingredient rows aggregated into this suggestion (not the number of distinct meals; use PlannedMealIds.Count for that).</summary>
    public int SourceCount { get; set; }

    public List<ulong> PlannedMealIds { get; set; } = new();
    public bool AlreadyOnList { get; set; }
    public bool SelectedByDefault { get; set; }
}

public class ConfirmShoppingSuggestionsRequest
{
    public string WeekStartDate { get; set; } = string.Empty;
    public List<string> SelectedClientIds { get; set; } = new();
}

public class ConfirmShoppingSuggestionsResponse
{
    public string WeekStartDate { get; set; } = string.Empty;
    public int RequestedCount { get; set; }
    public int AddedCount { get; set; }
    public int SkippedAlreadyOnListCount { get; set; }
    public List<ulong> AddedIds { get; set; } = new();
}
