# Story 3.1: Generate Deduplicated Suggestions from the Weekly Plan

Status: done
<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a household member,
I want the app to calculate shopping suggestions from a selected week,
so that I do not manually copy ingredients from planned meals or create duplicates.

## Acceptance Criteria

1. **Suggestions are generated without insertion**
   - **Given** a selected week contains planned meals
   - **When** the user requests shopping suggestions
   - **Then** the backend returns generated suggestion rows for recipe ingredients
   - **And** no shopping-list rows are inserted before user confirmation.

2. **Optional and excluded ingredients are omitted**
   - **Given** ingredients are optional or excluded for a specific planned meal
   - **When** suggestions are generated
   - **Then** those ingredients are omitted from the generated suggestions.

3. **Quantities are scaled by planned servings**
   - **Given** a planned meal uses a serving count different from the recipe default
   - **When** suggestions are generated
   - **Then** suggested quantities are scaled by planned servings where quantity data supports scaling.

4. **Existing active shopping rows are detected**
   - **Given** the active shopping list already contains a matching item
   - **When** suggestions are generated
   - **Then** the matching suggestion is marked as already on the list
   - **And** it is not selected by default for insertion.

5. **Repeated generation stays idempotent**
   - **Given** generation is repeated for the same selected week
   - **When** the backend compares planned ingredients and active rows
   - **Then** duplicate active rows are not created.

## Tasks / Subtasks

- [x] **T1: Add read-only generation API contract** (AC: 1, 4, 5)
  - [x] Extend [backend/DTOs/ShoppingListDtos.cs](../../backend/DTOs/ShoppingListDtos.cs) with request/response DTOs for generation.
  - [x] Add `GenerateShoppingSuggestionsRequest` with `weekStartDate`.
  - [x] Add `ShoppingSuggestionDto` fields: `clientId`, `varetypeId`, `varetype`, `kvantitet`, `maaleenhetId`, `maaleenhet`, `sourceCount`, `plannedMealIds`, `alreadyOnList`, and `selectedByDefault`.
  - [x] Add `GenerateShoppingSuggestionsResponse` fields: `weekStartDate`, `plannedMealCount`, and `suggestions`.
  - [x] Use camelCase JSON output from ASP.NET defaults; do not add a global envelope beyond this local response DTO.

- [x] **T2: Implement `POST /api/handleliste/generate-from-week`** (AC: 1, 2, 3, 4, 5)
  - [x] Update [backend/Controllers/HandlelisteController.cs](../../backend/Controllers/HandlelisteController.cs), reusing its existing `GetUserId`, `GetHouseholdId`, and household-member scoping pattern.
  - [x] Validate `weekStartDate` as a Monday `YYYY-MM-DD`; return `400 { message }` for invalid dates.
  - [x] If the user has no household, return an empty response with `plannedMealCount = 0` and no suggestions, matching existing household-list behavior.
  - [x] Load planned meals for the caller's household and selected week from `PlanlagteMaaltider`.
  - [x] Include each meal's recipe, recipe default `porsjoner`, ingredients, `Varetype`, `Maaleenhet`, and per-meal exclusions from `PlanlagteMaaltidEkskludertIngrediens`.
  - [x] Omit optional ingredients where `valgfritt == true`.
  - [x] Omit ingredients excluded for that specific `planlagt_maaltid_id`.
  - [x] Do not omit required ingredients with `kvantitet == null`; return them as reminder rows with null quantity.
  - [x] Scale numeric quantities by `plannedMeal.porsjoner / oppskrift.porsjoner` when recipe default portions are positive.
  - [x] If recipe default portions are zero or invalid, keep the original quantity and avoid divide-by-zero.
  - [x] Aggregate by exact `(varetypeId, maaleenhetId)`. Sum quantities only inside that exact key; different units stay separate.
  - [x] Do not perform unit conversion, pantry deduction, aisle grouping, or stock/minimum-lager deduction in this story.
  - [x] Compare generated keys against current active household `Handleliste` rows with the same `(varetypeId, maaleenhetId)`.
  - [x] For duplicates, set `alreadyOnList = true` and `selectedByDefault = false`; otherwise set `selectedByDefault = true`.
  - [x] Do not insert, update, hide, purchase, or delete any `Handleliste` rows in this endpoint.

- [x] **T3: Keep generation dedupe explicit and deterministic** (AC: 3, 4, 5)
  - [x] Build a stable `clientId` from the generated key, e.g. `varetypeId:maaleenhetIdOrNone`, so Story 3.2 can use it as a checkbox key.
  - [x] Sort suggestions by ingredient name, then unit, then id, or another deterministic rule documented in code.
  - [x] Track `plannedMealIds` for every aggregated suggestion so Story 3.2 can preserve planned-meal source metadata during confirmation.
  - [x] `sourceCount` should count contributing ingredient rows or planned meals consistently; choose one and keep the DTO name/copy clear.
  - [x] Existing active row comparison should ignore purchased/hidden rows once Epic 4 introduces that state; for now, current rows returned by `GET /api/handleliste` are active enough because purchase behavior is not implemented.

- [x] **T4: Add frontend shopping generation types and hook boundary** (AC: 1, 4)
  - [x] Create `frontend/app/features/shopping/types.ts` for shopping-list and suggestion DTOs.
  - [x] Create `frontend/app/features/shopping/use-shopping-suggestions.ts` or a similarly scoped hook file.
  - [x] The hook must call `apiFetch` rather than direct `fetch`.
  - [x] Use a mutation for generation because the backend endpoint is `POST`, but treat returned suggestions as transient UI state, not persisted server state.
  - [x] Do not invalidate `["shopping-list"]` or `["planned-meals", weekStartDate]` after generation because generation writes nothing.
  - [x] Export types that Story 3.2 can reuse for the suggestion sheet.

- [x] **T5: Add a minimal Plan-route trigger only if needed for integration** (AC: 1)
  - [x] If implementation needs an entry point now, update [frontend/app/routes/app/plan.tsx](../../frontend/app/routes/app/plan.tsx) with a visible "Generate shopping list" action when the selected week has planned meals.
  - [x] Keep UI minimal for Story 3.1: triggering generation may log/hold transient data or show a simple count, but the full review/checkbox sheet belongs to Story 3.2.
  - [x] Do not insert selected suggestions from the Plan route in this story.
  - [x] Preserve current servings edit, ingredient exclusion, restore, and planned-meal removal behavior.

- [x] **T6: Verify generation behavior** (AC: 1, 2, 3, 4, 5)
  - [x] Run `dotnet build backend/backend.csproj`.
  - [x] Run `npm run typecheck --prefix frontend` if frontend hook/types are added.
  - [x] Run `npm run build` if frontend source changes affect the compiled SPA.
  - [ ] Manual/API smoke: generate suggestions for a week with one planned meal and confirm no `Handleliste` row count changes.
  - [ ] Manual/API smoke: mark one ingredient excluded on a planned meal, generate, and confirm it is omitted only for that planned meal.
  - [ ] Manual/API smoke: plan a recipe at a different serving count and confirm returned quantities scale.
  - [ ] Manual/API smoke: add an active shopping row with the same `varetypeId` and `maaleenhetId`, generate, and confirm the suggestion returns `alreadyOnList: true` and `selectedByDefault: false`.
  - [ ] Manual/API smoke: repeat generation and confirm the response is stable and no duplicate active rows are created.

## Dev Notes

### What this story is and is not

This story creates the read-only generation engine for Epic 3. It turns a selected weekly plan into deduplicated shopping suggestions and reports which suggestions already exist on the active household shopping list.

It is not:

- The full suggestion review sheet with checkboxes. Story 3.2 owns that UI.
- Confirming selected suggestions into `Handleliste`. Story 3.2 owns insertion and the final confirmation mutation.
- Shopping-list row purchase/restore/edit behavior. Epic 4 owns active shopping-list management.
- Purchase completion or cookbook history. Epics 4 and 5 own those flows.
- Pantry deduction, unit conversion, aisle grouping, recipe creation, image upload, or multi-week shopping semantics.

### Current state to preserve

Current backend state:

- [backend/Controllers/HandlelisteController.cs](../../backend/Controllers/HandlelisteController.cs) already implements:
  - `GET /api/handleliste`, returning `{ varer, forslag }`.
  - `POST /api/handleliste`, creating manual rows.
  - `PUT /api/handleliste/{id}` and `DELETE /api/handleliste/{id}`.
  - Household scoping through `Medlemmer` and member ids; keep this pattern.
- Existing `GET /api/handleliste` also has a minimum-stock `forslag` concept based on `Husholdningsinnstillinger` and `Varelager`. Do not remove or rewrite it for recipe-derived suggestions.
- [backend/DTOs/ShoppingListDtos.cs](../../backend/DTOs/ShoppingListDtos.cs) currently only contains create/update manual row DTOs.
- [backend/Models/HandlelisteRad.cs](../../backend/Models/HandlelisteRad.cs) has `planlagt_maaltid_id` and `purchased_at`, but no `kilde` column/model property yet.
- [database/schema.sql](../../database/schema.sql) likewise has `Handleliste.planlagt_maaltid_id` and `purchased_at`, but no `kilde`.
- Because this story writes no shopping rows, it does not need to add `kilde`; add that in Story 3.2 if confirmation needs to persist recipe-derived source metadata.

Current planning state:

- [backend/Controllers/PlanlagteMaaltiderController.cs](../../backend/Controllers/PlanlagteMaaltiderController.cs) already returns planned meals with `ingredients` and per-ingredient `excluded`.
- Planned meals use Monday `YYYY-MM-DD` week keys and `DateOnly` storage in `PlanlagteMaaltider.uke_start_dato`.
- Ingredient exclusions are stored in `PlanlagteMaaltidEkskludertIngrediens` and are per planned meal, not global recipe edits.
- [frontend/app/routes/app/plan.tsx](../../frontend/app/routes/app/plan.tsx) is the live Plan route. Older docs mention `/app/planned`, but the current route is `/app/plan`.
- [frontend/app/features/planning/use-planned-meals.ts](../../frontend/app/features/planning/use-planned-meals.ts) uses query keys shaped like `["planned-meals", weekStartDate]`.

Current frontend shopping state:

- [frontend/app/routes/app/shop.tsx](../../frontend/app/routes/app/shop.tsx) is only a placeholder for Story 4.1.
- No `frontend/app/features/shopping` folder exists yet.
- Use `apiFetch` from [frontend/app/lib/api-fetch.ts](../../frontend/app/lib/api-fetch.ts); it owns bearer token injection, 401 handling, and `{ message }` errors.
- Use TanStack Query v5 for hooks. Do not introduce React Router loaders for this flow.

### Backend algorithm guardrails

Implement generation as a read-only calculation:

1. Resolve `userId` from the authenticated claim.
2. Resolve household id server-side from `Medlemmer`.
3. Parse `weekStartDate` as a Monday `YYYY-MM-DD`.
4. Fetch planned meals for `(householdId, weekStartDate)`.
5. For every planned meal, inspect recipe ingredients.
6. Skip `valgfritt == true`.
7. Skip exclusions matching `(plannedMealId, ingrediensId)`.
8. Scale numeric quantities by planned servings relative to recipe default servings.
9. Aggregate by exact `(varetypeId, maaleenhetId)`.
10. Compare against active household `Handleliste` rows by exact `(varetypeId, maaleenhetId)`.
11. Return suggestions with duplicate metadata.
12. Write nothing.

Important edge cases:

- Required null-quantity ingredients must survive generation as reminder rows.
- Different units for the same ingredient type must remain separate rows.
- If a planned meal has the same ingredient twice with the same unit, aggregate it once.
- If the same recipe is planned twice in the week, both planned meals should contribute.
- If one planned meal excludes an ingredient and another planned meal includes it, the included meal still contributes.
- If the existing list has the same `varetypeId` but a different `maaleenhetId`, do not mark it as duplicate.
- If the existing list has `maaleenhetId == null`, only match generated rows with `maaleenhetId == null`.
- Keep decimal quantities as decimals; do not round aggressively unless display/UI later requires it.

### Suggested API contract

Use this endpoint unless implementation discovers a hard conflict:

| Method | Path | Purpose | Writes |
| ------ | ---- | ------- | ------ |
| `POST` | `/api/handleliste/generate-from-week` | Generate read-only shopping suggestions for one Monday-start week | No |

Request:

```json
{
  "weekStartDate": "2026-04-27"
}
```

Response:

```json
{
  "weekStartDate": "2026-04-27",
  "plannedMealCount": 3,
  "suggestions": [
    {
      "clientId": "12:3",
      "varetypeId": 12,
      "varetype": "Pasta",
      "kvantitet": 500,
      "maaleenhetId": 3,
      "maaleenhet": "g",
      "sourceCount": 2,
      "plannedMealIds": [21, 24],
      "alreadyOnList": false,
      "selectedByDefault": true
    }
  ]
}
```

Recommended C# DTO sketch:

```csharp
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

public class ShoppingSuggestionDto
{
    public string ClientId { get; set; } = string.Empty;
    public ulong VaretypeId { get; set; }
    public string Varetype { get; set; } = string.Empty;
    public decimal? Kvantitet { get; set; }
    public ulong? MaaleenhetId { get; set; }
    public string? Maaleenhet { get; set; }
    public int SourceCount { get; set; }
    public List<ulong> PlannedMealIds { get; set; } = new();
    public bool AlreadyOnList { get; set; }
    public bool SelectedByDefault { get; set; }
}
```

### Query and cache guidance

- Generation should be a `useMutation` because it is a `POST`, but its result is transient and read-only.
- Do not invalidate `["shopping-list"]` after generation because no rows changed.
- Do not invalidate `["planned-meals", weekStartDate]` after generation because no plan data changed.
- Story 3.2 can store returned suggestions in component state for the review sheet and perform invalidation only after confirmation inserts rows.

### Previous story intelligence

Story 2.3 established the exact data foundation this story must reuse:

- Planned meal ingredients are now available through the planned-meal endpoint with `excluded`.
- Ingredient exclusions are per planned meal and must not mutate recipes.
- `Handleliste.planlagt_maaltid_id` and `purchased_at` already exist for future shopping/cookbook semantics.
- Planned-meal deletion removes non-purchased linked shopping rows and blocks deletion with 409 once purchased rows exist.
- `SwipeActionRow` exists for UI interactions, but this story should not build the full suggestion-sheet interaction.

Story 2.2 established:

- Monday `YYYY-MM-DD` week semantics.
- Live Plan route is `/app/plan`.
- Planning code lives under `frontend/app/features/planning`.
- Targeted invalidation should use exact feature keys, not broad cache resets.

### Git intelligence

Recent relevant commits:

- `0a21e29 feat(planning): per-meal ingredient exclusion and meal removal`
- `e4920f7 feat(planning): add weekly meal planning feature`
- `c0ec30e Refine household invites, recipe details, and onboarding UX`
- `5f7f235 feat(household): invites, onboarding create/join, account context (1.4)`

Actionable pattern:

- Extend existing controllers and DTO files before creating new service layers.
- Keep frontend feature code under `frontend/app/features/*`.
- Keep backend errors as `{ message }`.
- Preserve the brownfield .NET API plus React SPA deployment shape.

### Latest technical information

No new external library is required for this story. Use the current project stack and local APIs:

- .NET 8 / ASP.NET Core controllers.
- EF Core 8 and Pomelo MySQL provider.
- React 19, React Router 7 SPA/static mode, TypeScript strict mode.
- TanStack Query v5 and `apiFetch` for frontend server interactions.

If implementation needs fresh API details for ASP.NET, EF Core, React Router, or TanStack Query, use Context7 before relying on memory.

### Testing standards summary

There is no broad automated test harness for this flow yet. Keep verification focused and do not introduce a new test stack only for this story.

Minimum verification:

- Backend build catches controller/DTO/EF query errors.
- Frontend typecheck catches DTO and hook errors if frontend code is added.
- Root build confirms the SPA still compiles into the backend-hosted shape when frontend source changes.
- Manual/API smoke covers no-write generation, optional/excluded omission, serving scaling, duplicate marking, and repeated generation.

If a lightweight backend test harness exists by implementation time, prioritize:

- Invalid `weekStartDate` returns 400.
- User from another household cannot generate suggestions from the caller's household.
- Optional ingredients are omitted.
- Excluded ingredients are omitted only for the matching planned meal.
- Duplicate detection matches exact `(varetypeId, maaleenhetId)` only.
- Endpoint does not insert `Handleliste` rows.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.1]
- [Source: _bmad-output/planning-artifacts/prd.md#Shopping-List-Generation-&-Shopping]
- [Source: _bmad-output/planning-artifacts/prd.md#Reliability]
- [Source: _bmad-output/planning-artifacts/architecture.md#Communication-Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure-&-Boundaries]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Generated-Suggestion-Patterns]
- [Source: docs/frontend-architecture-decisions.md#Shopping-List-Flow]
- [Source: docs/frontend-description.md#What-we're-adding]
- [Source: docs/ui-ux-screens.md#Generate-shopping-list-sheet]
- [Source: backend/Controllers/HandlelisteController.cs]
- [Source: backend/DTOs/ShoppingListDtos.cs]
- [Source: backend/Models/HandlelisteRad.cs]
- [Source: backend/Controllers/PlanlagteMaaltiderController.cs]
- [Source: backend/DTOs/PlannedMealDtos.cs]
- [Source: backend/Models/PlanlagtMaaltid.cs]
- [Source: backend/Models/Ingrediens.cs]
- [Source: backend/Data/AppDbContext.cs]
- [Source: frontend/app/lib/api-fetch.ts]
- [Source: frontend/app/routes/app/plan.tsx]
- [Source: frontend/app/routes/app/shop.tsx]
- [Source: database/schema.sql]

### Review Findings

- [ ] [Review][Patch] `meal.Porsjoner <= 0` produces `scale = 0m`, silently zeroing all scaled quantities — clamp: if `meal.Porsjoner <= 0` use `scale = 1m` as fallback. [`backend/Controllers/HandlelisteController.cs` ~L161]
- [x] [Review][Patch] `meal.Porsjoner <= 0` produces `scale = 0m`, silently zeroing all scaled quantities — clamp: if `meal.Porsjoner <= 0` use `scale = 1m` as fallback. [`backend/Controllers/HandlelisteController.cs` ~L161]
- [x] [Review][Patch] EF Core double-Include cartesian explosion — `Include(Oppskrift).ThenInclude(Ingredienser).ThenInclude(Varetype)` + `Include(Oppskrift).ThenInclude(Ingredienser).ThenInclude(Maaleenhet)` may emit a cartesian-product warning and materialize a wide result set. Add `.AsSplitQuery()` before `.ToListAsync()`. [`backend/Controllers/HandlelisteController.cs` ~L115]
- [x] [Review][Patch] `SourceCount` can diverge from `PlannedMealIds.Count` within a single recipe — if one recipe has multiple ingredient rows sharing the same `(varetypeId, maaleenhetId)`, `AddMeal()` is called twice for the same `plannedMealId`, incrementing `SourceCount` to 2 while the `HashSet` keeps `PlannedMealIds.Count` at 1. This is misleading to Story 3.2 consumers. [`backend/Controllers/HandlelisteController.cs` accumulator `AddMeal`]
- [x] [Review][Patch] Orphaned planned meals (`Oppskrift == null`) are silently skipped in aggregation but still counted in `plannedMealCount`, inflating the toast and response count. Filter them from the count or explicitly exclude them. [`backend/Controllers/HandlelisteController.cs` ~L295 `plannedMeals.Count`]
- [x] [Review][Patch] Button remains visible for the previous week's data while TanStack Query resolves the new week — disable the "Generer handleforslag" button while `mealsQuery.isFetching` is `true` to prevent firing a generation request for the new week against stale visibility state. [`frontend/app/routes/app/plan.tsx`]
- [x] [Review][Patch] Success toast does not include the week reference — if the user navigates weeks while a `mutateAsync` is in flight, the toast resolves against an ambiguous week. Include `res.weekStartDate` in the message. [`frontend/app/routes/app/plan.tsx` `runGenerateShoppingSuggestions`]
- [x] [Review][Patch] Changes to `frontend/app/components/ui/sheet.tsx` and `frontend/app/components/detail-sheet.tsx` (floating-bottom variant, overlay opacity/blur) are not in this story's file list and are out of scope — accepted as part of Story 3.1 delivery; file list updated. [`frontend/app/components/ui/sheet.tsx`, `frontend/app/components/detail-sheet.tsx`]
- [x] [Review][Defer] `ulong` IDs serialized to JSON `number` — pre-existing pattern across all controllers; no JS safe-integer violation at current DB scale. [`backend/DTOs/ShoppingListDtos.cs`] — deferred, pre-existing
- [x] [Review][Defer] `GetHouseholdMemberIds` internally calls `GetHouseholdId`, adding a redundant DB round-trip per request — pre-existing helper design. [`backend/Controllers/HandlelisteController.cs` ~L303] — deferred, pre-existing
- [x] [Review][Defer] `listKeySet` loads all `Handleliste` rows for all household members into memory before filtering — pre-existing pattern; optimize with a server-side key filter when list size warrants it. [`backend/Controllers/HandlelisteController.cs` ~L136] — deferred, pre-existing
- [x] [Review][Defer] `[Authorize]` not visible at controller-class level — auth falls back to `GetUserId()` null-check returning `Unauthorized()`; pre-existing for all endpoints in this controller. [`backend/Controllers/HandlelisteController.cs`] — deferred, pre-existing
- [x] [Review][Defer] `toast.success` fires even when 0 suggestions are returned (all meals had only optional/excluded ingredients) — minor UX; consider `toast.info` for empty results. [`frontend/app/routes/app/plan.tsx`] — deferred, pre-existing
- [x] [Review][Defer] Generic error toast for non-`ApiError` exceptions swallows network aborts and navigation-induced cancellations — minor UX. [`frontend/app/routes/app/plan.tsx`] — deferred, pre-existing
- [x] [Review][Defer] Sheet overlay opacity (`bg-black/80 → bg-black/55`) and backdrop-blur change is global — affects all dialogs, not just the new floating-bottom variant; intentional polish bundled with this story. [`frontend/app/components/ui/sheet.tsx`] — deferred, pre-existing

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Debug Log References

(None)

### Completion Notes List

- `POST /api/handleliste/generate-from-week`: read-only aggregation; `sourceCount` counts contributing ingredient rows per dedupe key; quantities null if any merged line had null amount (reminder rows).
- Household scoping matches `PlanlagteMaaltider`; invalid week returns 400 with `{ message }`; no household → empty suggestions + `plannedMealCount: 0`.
- Plan route: “Generer handleforslag” + toast with counts; mutation does not invalidate planned-meals or shopping-list queries.
- Automated verification: backend `dotnet build -c Release` (Debug output was locked by a running backend), frontend `npm run typecheck`, `npm run build`. Manual/API smoke scenarios in story T6 should be run against a live API/database when convenient.

### File List

- `backend/DTOs/ShoppingListDtos.cs`
- `backend/Controllers/HandlelisteController.cs`
- `frontend/app/features/shopping/types.ts`
- `frontend/app/features/shopping/use-shopping-suggestions.ts`
- `frontend/app/routes/app/plan.tsx`
- `frontend/app/components/ui/sheet.tsx` (floating-bottom + center side variants added)
- `frontend/app/components/detail-sheet.tsx` (switched to floating-bottom positioning)
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

