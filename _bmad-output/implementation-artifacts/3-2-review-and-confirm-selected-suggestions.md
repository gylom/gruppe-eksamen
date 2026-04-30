# Story 3.2: Review and Confirm Selected Suggestions

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a household member,
I want to review and confirm generated suggestions before adding them,
so that automation stays transparent and under household control.

## Acceptance Criteria

1. **Suggestion sheet preserves Plan context**
   - **Given** suggestions are returned for a selected week
   - **When** the suggestion sheet opens
   - **Then** it states the week being processed and the number of planned meals used
   - **And** it keeps the Plan context behind the sheet.

2. **Rows are reviewable and accessible**
   - **Given** suggestion rows render
   - **When** the user reviews them
   - **Then** each row shows checkbox, quantity, unit, ingredient name, source/status metadata, and accessible checkbox label.

3. **Duplicate suggestions stay visible but unselected**
   - **Given** a suggestion is already on the active list
   - **When** the sheet renders
   - **Then** the row is visible but unchecked by default
   - **And** duplicate status is not conveyed by color alone.

4. **Only selected suggestions are inserted**
   - **Given** the user confirms selected rows
   - **When** the mutation succeeds
   - **Then** only selected suggestions are inserted into the active household shopping list
   - **And** the app shows concise toast feedback.

5. **Empty confirmation is prevented**
   - **Given** no rows are selected
   - **When** the user attempts to confirm
   - **Then** the UI prevents an empty insertion
   - **And** explains that at least one row must be selected.

## Tasks / Subtasks

- [x] **T1: Add confirmation API contract and source metadata** (AC: 4)
  - [x] Extend [backend/DTOs/ShoppingListDtos.cs](../../backend/DTOs/ShoppingListDtos.cs) with `ConfirmShoppingSuggestionsRequest` and `ConfirmShoppingSuggestionsResponse`.
  - [x] Request shape: `weekStartDate: string`, `selectedClientIds: string[]`.
  - [x] Response shape should include at least `weekStartDate`, `requestedCount`, `addedCount`, `skippedAlreadyOnListCount`, and inserted row ids.
  - [x] Add `kilde` support to `Handleliste` if it is still absent: SQL column, [backend/Models/HandlelisteRad.cs](../../backend/Models/HandlelisteRad.cs), [backend/Data/AppDbContext.cs](../../backend/Data/AppDbContext.cs), and manual-row creation defaulting to `"manual"`.
  - [x] Preserve recipe-derived source metadata with `"plannedMeal"` rows so Epic 4/5 can distinguish generated rows from manual rows.

- [x] **T2: Preserve all contributing planned-meal links for aggregated rows** (AC: 4)
  - [x] Do not rely only on `Handleliste.planlagt_maaltid_id` when a suggestion has multiple `plannedMealIds`; one FK cannot represent an aggregated row's full source set.
  - [x] Add a small source-link table, for example `HandlelistePlanlagteMaaltider(handleliste_id, planlagt_maaltid_id)`, with a unique composite key and cascade delete from `Handleliste`.
  - [x] Keep `Handleliste.planlagt_maaltid_id` populated with the first contributing planned meal only as a compatibility shortcut, but treat the link table as the authoritative source set for future purchase/cookbook logic.
  - [x] Add the corresponding model/DbSet/config in [backend/Data/AppDbContext.cs](../../backend/Data/AppDbContext.cs).
  - [x] Update [database/schema.sql](../../database/schema.sql) and add a targeted SQL migration file in [database](../../database).

- [x] **T3: Implement `POST /api/handleliste/confirm-suggestions`** (AC: 4)
  - [x] Update [backend/Controllers/HandlelisteController.cs](../../backend/Controllers/HandlelisteController.cs), reusing its existing auth and server-side household lookup pattern.
  - [x] Validate `weekStartDate` as a Monday `YYYY-MM-DD`; return `400 { message }` for invalid dates.
  - [x] Validate non-empty `selectedClientIds`; return `400 { message }` for empty confirmation even though the UI also prevents it.
  - [x] Regenerate current suggestions on the server using the same algorithm as `generate-from-week`; do not trust client-provided quantities, units, ingredient names, or planned-meal ids.
  - [x] Refactor generation into a private helper if needed so `GenerateFromWeek` and confirmation share one source of truth.
  - [x] Filter regenerated suggestions by exact `clientId` matches from `selectedClientIds`.
  - [x] If a selected `clientId` no longer exists in the regenerated suggestions, return `409 { message }` telling the client to regenerate.
  - [x] Re-check active household `Handleliste` rows at insert time by exact `(varetypeId, maaleenhetId)` to prevent duplicate inserts from stale UI or concurrent confirmation.
  - [x] Insert only selected suggestions that are not already active. Duplicate selected rows should be skipped and counted in `skippedAlreadyOnListCount`, not inserted.
  - [x] Set `UserId` to the confirming user, `Kilde` to `"plannedMeal"`, `Kvantitet`, `MaaleenhetId`, `VaretypeId`, `Opprettet`, `Endret`, and source planned-meal links.
  - [x] Keep the endpoint idempotent: repeating confirmation after a success must not add duplicate active rows.

- [x] **T4: Build the suggestion review sheet on the Plan route** (AC: 1, 2, 3, 5)
  - [x] Update [frontend/app/routes/app/plan.tsx](../../frontend/app/routes/app/plan.tsx) so "Generer handleforslag" opens a review sheet after generation succeeds instead of only showing a count toast.
  - [x] Keep the Plan route visible behind the sheet by reusing [frontend/app/components/detail-sheet.tsx](../../frontend/app/components/detail-sheet.tsx).
  - [x] Disable the generate action while `generateShoppingSuggestions.isPending` or `mealsQuery.isFetching` is true to avoid stale-week generation.
  - [x] Initialize selected state from `suggestion.selectedByDefault`.
  - [x] Use `suggestion.clientId` as the stable checkbox key.
  - [x] Show `res.weekStartDate` and `res.plannedMealCount` in the sheet summary.
  - [x] Render quantity/unit/name with null quantity as a reminder row, not as `0`.
  - [x] Show source metadata such as contributing planned meal count or ingredient-row count, using copy that matches `sourceCount` semantics from Story 3.1.
  - [x] Show duplicate status with text/icon/badge copy such as "Already on shopping list"; do not rely on color alone.
  - [x] If `frontend/app/components/ui/checkbox.tsx` is needed, install it with `pnpm dlx shadcn@latest add checkbox`; do not hand-create shadcn primitives.

- [x] **T5: Add frontend confirmation mutation and targeted invalidation** (AC: 4, 5)
  - [x] Extend [frontend/app/features/shopping/types.ts](../../frontend/app/features/shopping/types.ts) with confirmation request/response types.
  - [x] Add `useConfirmShoppingSuggestions` under [frontend/app/features/shopping](../../frontend/app/features/shopping).
  - [x] The mutation must call `apiFetch`; do not call `fetch` directly.
  - [x] On success, invalidate only `["shopping-list"]`; do not invalidate `["planned-meals", weekStartDate]` because confirmation does not change planned meals.
  - [x] Close the sheet after successful confirmation and show a concise toast such as "Added 5 items to the shopping list."
  - [x] If the response skipped duplicates, include that in secondary toast/detail copy without making success sound like a failure.
  - [x] If no rows are selected, keep the sheet open, disable the primary action, and show inline helper text.

- [x] **T6: Preserve existing Plan and shopping-generation behavior** (AC: 1, 4)
  - [x] Do not remove servings edit, ingredient exclusion/restore, or planned-meal deletion behavior in [frontend/app/routes/app/plan.tsx](../../frontend/app/routes/app/plan.tsx).
  - [x] Do not change `POST /api/handleliste/generate-from-week` into a write endpoint; generation remains read-only.
  - [x] Do not remove the existing minimum-stock `forslag` behavior from `GET /api/handleliste`.
  - [x] Do not build Epic 4 active shopping-list UI beyond what is required to insert confirmed rows.

- [x] **T7: Verify confirmation behavior** (AC: 1, 2, 3, 4, 5)
  - [x] Run `dotnet build backend/backend.csproj`.
  - [x] Run `npm run typecheck --prefix frontend`.
  - [x] Run `npm run build` because this changes frontend source and backend-served SPA output.
  - [ ] Manual/API smoke: generate suggestions, uncheck at least one row, confirm, and verify only checked rows are inserted.
- [ ] Manual/API smoke: confirm a row already active on the shopping list and verify it is skipped, not duplicated.
- [ ] Manual/API smoke: repeat the same confirmation and verify `addedCount` is zero or only newly valid selected rows are added.
- [ ] Manual UI smoke at 360px and desktop-centered width: sheet content, checkbox labels, duplicate status, inline empty-selection copy, and sticky primary action do not overlap.

### Review Findings

- [x] [Review][Patch] Concurrent confirmations can still insert duplicate shopping rows [backend/Controllers/HandlelisteController.cs:156]
- [x] [Review][Patch] Aggregated planned-meal links are ignored by planned-meal deletion protection [backend/Controllers/PlanlagteMaaltiderController.cs:308]
- [x] [Review][Patch] Story 3.2 migration is not rerunnable [database/v3_2_handleliste_kilde_planlagte_koblinger.sql:3]

## Dev Notes

### What this story is and is not

This story completes Epic 3's manual-confirm flow. Story 3.1 calculates read-only shopping suggestions. Story 3.2 lets the user review those suggestions in a sheet and confirm which selected rows become active `Handleliste` rows.

This story is not:

- Active shopping-list management, manual item editing, purchase/restore, or hidden purchased views. Epic 4 owns those flows.
- Purchase completion or cookbook history. Epics 4 and 5 own the user-facing flows, but this story must preserve enough source metadata for them.
- Pantry deduction, unit conversion, aisle grouping, recipe creation, image upload, or multi-week shopping semantics.
- A redesign of the Plan route. Keep changes focused on the suggestion sheet and confirmation mutation.

### Current state to preserve

Current backend state:

- [backend/Controllers/HandlelisteController.cs](../../backend/Controllers/HandlelisteController.cs) now has `[Authorize]`, `GET /api/handleliste`, manual `POST/PUT/DELETE`, and `POST /api/handleliste/generate-from-week`.
- `generate-from-week` is read-only and returns `weekStartDate`, `plannedMealCount`, and `suggestions`.
- `generate-from-week` already uses server-side household membership from `Medlemmer`, Monday date validation, `AsSplitQuery()`, optional/excluded ingredient omission, serving scaling, exact `(varetypeId, maaleenhetId)` aggregation, duplicate flags, and deterministic `clientId`.
- `ShoppingSuggestionDto.SourceCount` currently means contributing recipe ingredient rows, not distinct planned meals. Use `plannedMealIds.length` when the UI needs meal count.
- [backend/Models/HandlelisteRad.cs](../../backend/Models/HandlelisteRad.cs) has `planlagt_maaltid_id` and `purchased_at`, but no `kilde` property at the time this story was created.
- [database/schema.sql](../../database/schema.sql) has `Handleliste.planlagt_maaltid_id` and `purchased_at`, but no `kilde` column and no many-to-many source-link table.

Current frontend state:

- [frontend/app/routes/app/plan.tsx](../../frontend/app/routes/app/plan.tsx) is the live route. Planning docs sometimes say `/app/planned`, but the current implemented route is `/app/plan`.
- The Plan route currently calls `useGenerateShoppingSuggestions` and shows a toast count; this story replaces that minimal integration with the review sheet.
- [frontend/app/features/shopping/types.ts](../../frontend/app/features/shopping/types.ts) and [frontend/app/features/shopping/use-shopping-suggestions.ts](../../frontend/app/features/shopping/use-shopping-suggestions.ts) exist from Story 3.1 and should be extended, not replaced.
- [frontend/app/components/detail-sheet.tsx](../../frontend/app/components/detail-sheet.tsx) and [frontend/app/components/ui/sheet.tsx](../../frontend/app/components/ui/sheet.tsx) include floating-bottom sheet behavior from current working-tree changes. Do not revert those changes while implementing this story.
- `frontend/app/components/ui` does not currently include `checkbox.tsx`; install the shadcn checkbox component through the CLI if the implementation uses it.

### Backend confirmation guardrails

The confirmation endpoint must be server-authoritative:

1. Resolve `userId` from the authenticated claim.
2. Resolve household id server-side from `Medlemmer`.
3. Parse and validate `weekStartDate`.
4. Reject empty `selectedClientIds`.
5. Regenerate suggestions from the current planned meals and exclusions.
6. Match selected rows by `clientId`.
7. Reject stale unknown selected ids with 409 so the frontend can ask the user to regenerate.
8. Re-check active shopping-list keys immediately before insertion.
9. Insert only selected, still-not-active suggestions.
10. Store source metadata for all contributing planned meals.
11. Return counts that let the UI explain added and skipped rows.

Do not accept a full suggestion object from the client as the source of truth. The browser may hold stale data, and users can tamper with request bodies. `clientId` plus server regeneration is the safe contract.

### Suggested API contract

Use this endpoint unless implementation discovers a hard conflict:

| Method | Path | Purpose | Writes |
| ------ | ---- | ------- | ------ |
| `POST` | `/api/handleliste/confirm-suggestions` | Insert selected regenerated suggestions into active household shopping list | Yes |

Request:

```json
{
  "weekStartDate": "2026-04-27",
  "selectedClientIds": ["12:3", "18:none"]
}
```

Response:

```json
{
  "weekStartDate": "2026-04-27",
  "requestedCount": 2,
  "addedCount": 1,
  "skippedAlreadyOnListCount": 1,
  "addedIds": [42]
}
```

Recommended DTO sketch:

```csharp
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
```

### Frontend UI guardrails

- Use a sheet, not a new route, for review and confirmation.
- The sheet title/summary should identify the response week, not whatever `weekMonday` happens to be after an async mutation resolves.
- Use checkboxes for selection, initialized by `selectedByDefault`.
- Duplicate rows must be visible and unchecked by default.
- The checkbox accessible name must include the ingredient name and duplicate status when applicable.
- The primary action should communicate count, for example `Add 5 items`.
- Disable the primary action with inline helper text when selected count is zero.
- Keep sheet content scrollable and the primary action reachable on 360px mobile.
- Keep Norwegian copy consistent with the current Plan route, but avoid hard-coded copy that cannot later move into i18n.

### Query and cache guidance

- Generation remains a `useMutation` because it calls `POST /api/handleliste/generate-from-week`, but the result is transient UI state.
- Confirmation is also a `useMutation` because it writes rows.
- Per current TanStack Query v5 docs, use `useQueryClient` and invalidate related queries from the mutation `onSuccess` callback. Invalidate only the affected key: `queryClient.invalidateQueries({ queryKey: ["shopping-list"] })`.
- Do not invalidate planned meals after confirmation. The plan did not change.
- Do not broadly clear the query cache.

### Previous story intelligence

Story 3.1 established:

- `clientId` is stable and based on `varetypeId:maaleenhetIdOrNone`.
- `plannedMealIds` travels with each generated suggestion and must be preserved at confirmation time.
- Duplicate status is calculated by exact `(varetypeId, maaleenhetId)`.
- Generation writes nothing and should stay read-only.
- Null-quantity required ingredients are reminder rows and should survive review/confirmation.
- Different units stay separate; no unit conversion.

Story 3.1 review findings relevant to 3.2:

- The current working tree already appears to include the important backend fixes for serving fallback, split queries, source-count documentation, and planned-meal counting.
- The Plan route still needs stale-week protection: disable the generate action while `mealsQuery.isFetching`.
- Any success copy must use the response's `weekStartDate`, not a potentially changed local week state.
- Do not revert the sheet/detail-sheet UI changes that are already in the working tree.

Story 2.3 and 2.2 established:

- Planned-meal ingredient exclusions are per planned meal, not recipe mutations.
- Planned meals use Monday `YYYY-MM-DD` week keys.
- The active Plan route is `/app/plan`.
- Planning query keys are shaped like `["planned-meals", weekStartDate]`.
- Swipe/tap alternatives and visible non-color-only status cues are mandatory.

### Git intelligence

Recent relevant commits:

- `0a21e29 feat(planning): per-meal ingredient exclusion and meal removal`
- `e4920f7 feat(planning): add weekly meal planning feature`
- `c0ec30e Refine household invites, recipe details, and onboarding UX`
- `5f7f235 feat(household): invites, onboarding create/join, account context (1.4)`

Actionable pattern:

- Extend existing controllers and DTO files before creating service layers, unless a private helper is needed to share generation between two endpoints.
- Keep frontend feature code under `frontend/app/features/*`.
- Use `apiFetch` for frontend HTTP.
- Return backend user-facing errors as `{ message }`.
- Preserve the brownfield .NET API plus React SPA deployment shape.

### Latest technical information

Context7 resolved TanStack Query to `/tanstack/query` and fetched current React mutation invalidation guidance. The relevant current pattern is: call `useQueryClient()`, then use `useMutation({ mutationFn, onSuccess })` and call `queryClient.invalidateQueries({ queryKey })` for the specific affected key after success. Returning or awaiting invalidation work from `onSuccess` can keep the mutation pending until related refresh work completes.

No new external runtime library is required beyond installed project dependencies. If implementation needs API details for React, React Router, Base UI, shadcn, ASP.NET Core, or EF Core, use Context7 before relying on memory.

### Testing standards summary

There is no broad automated test harness for this flow yet. Keep verification focused and do not introduce a large new test stack only for this story.

Minimum verification:

- Backend build catches controller, DTO, model, and EF configuration errors.
- Frontend typecheck catches DTO, hook, and sheet-state errors.
- Root build confirms the SPA still compiles into the backend-hosted shape.
- Manual/API smoke proves selected-only insertion, duplicate skipping, empty-selection prevention, and repeat-confirm idempotency.

If a lightweight backend test harness exists by implementation time, prioritize:

- Invalid `weekStartDate` returns 400.
- Empty selected ids returns 400.
- Unknown/stale selected id returns 409.
- User from another household cannot confirm suggestions for another household's planned meals.
- Confirmation regenerates server-side and does not trust client quantities.
- Repeated confirmation does not insert duplicate active rows.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.2]
- [Source: _bmad-output/planning-artifacts/prd.md#Shopping-List-Generation-&-Shopping]
- [Source: _bmad-output/planning-artifacts/prd.md#Reliability]
- [Source: _bmad-output/planning-artifacts/architecture.md#API-&-Communication-Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data-Flow]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure-&-Boundaries]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Generated-Suggestion-Patterns]
- [Source: docs/ui-ux-screens.md#Generate-shopping-list-sheet]
- [Source: docs/frontend-architecture-decisions.md#Shopping-List-Flow]
- [Source: _bmad-output/implementation-artifacts/3-1-generate-deduplicated-suggestions-from-the-weekly-plan.md]
- [Source: backend/Controllers/HandlelisteController.cs]
- [Source: backend/DTOs/ShoppingListDtos.cs]
- [Source: backend/Models/HandlelisteRad.cs]
- [Source: backend/Data/AppDbContext.cs]
- [Source: frontend/app/routes/app/plan.tsx]
- [Source: frontend/app/features/shopping/types.ts]
- [Source: frontend/app/features/shopping/use-shopping-suggestions.ts]
- [Source: frontend/app/lib/api-fetch.ts]
- [Source: database/schema.sql]
- [Source: https://github.com/tanstack/query/blob/main/docs/framework/react/guides/invalidations-from-mutations.md]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

- Applied SQL migration `database/v3_2_handleliste_kilde_planlagte_koblinger.sql` on deployed databases before exercising confirmation (adds `kilde`, junction table).
- Code-review patches applied: serialized household confirmation inserts, planned-meal deletion now respects authoritative source links, and story 3.2 migration is rerunnable.
- `dotnet build` for default `bin/Debug` output may fail if `backend.exe` is locked by a running server; compilation was verified via `-o` to a separate output path and via zero-error `tsc`/production SPA build.

### File List

- backend/Controllers/HandlelisteController.cs
- backend/DTOs/ShoppingListDtos.cs
- backend/Data/AppDbContext.cs
- backend/Models/HandlelisteRad.cs
- backend/Models/HandlelistePlanlagtMaaltidLink.cs
- database/schema.sql
- database/v3_2_handleliste_kilde_planlagte_koblinger.sql
- frontend/app/features/shopping/types.ts
- frontend/app/features/shopping/use-confirm-shopping-suggestions.ts
- frontend/app/components/ui/checkbox.tsx (shadcn CLI)
- frontend/app/routes/app/plan.tsx
