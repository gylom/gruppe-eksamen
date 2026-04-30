# Story 2.2: Weekly Plan View, Navigation, and Meal Scheduling

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a household member,
I want to view a shared week and schedule recipes into it,
so that the household has a clear Monday-anchored meal plan.

## Acceptance Criteria

1. **Plan route shows a shared Monday-anchored week**
   - **Given** a household member opens the Plan route
   - **When** the selected week loads
   - **Then** planned meals are shown in a Monday-anchored weekly structure
   - **And** empty day or meal slots invite the user to add meals.

2. **Week navigation uses stable Monday date semantics**
   - **Given** the user changes weeks
   - **When** they use previous or next week controls
   - **Then** the week identifier uses Monday `YYYY-MM-DD` semantics
   - **And** planned-meal queries are keyed by the selected week.

3. **Recipe detail can save a planned meal**
   - **Given** the user opens add-to-plan from a recipe
   - **When** they select week, day, meal type, and servings
   - **Then** the planned meal can be saved for the household
   - **And** success feedback appears when the plan updates.

4. **Serving edits persist without broad cache resets**
   - **Given** a planned meal already exists
   - **When** the user edits servings
   - **Then** the updated serving count is persisted
   - **And** dependent plan queries are invalidated without resetting unrelated data.

## Tasks / Subtasks

- [ ] **T1: Add planned-meal persistence to the database** (AC: 1, 2, 3, 4)
  - [ ] Add `PlanlagteMaaltider` to [database/schema.sql](../../database/schema.sql) and a targeted migration file, e.g. `database/v2_2_planlagte_maaltider.sql`.
  - [ ] Use columns for `id`, `husholdning_id`, `oppskrift_id`, `uke_start_dato`, `dag`, `maaltidstype_id`, `porsjoner`, `created_at`, and `updated_at`.
  - [ ] Add FKs to `Husholdning`, `Oppskrifter`, and `Oppskriftskategorier`.
  - [ ] Enforce the v1 duplicate rule with a unique key on household, week-start date, day, and meal-type id. A slot can hold one meal; the same recipe can appear in multiple different slots.
  - [ ] Keep `porsjoner` constrained to 1-20 at API validation level even if the database engine cannot enforce the check consistently.

- [ ] **T2: Add backend model, DTOs, and controller for weekly planning** (AC: 1, 2, 3, 4)
  - [ ] Create `backend/Models/PlanlagtMaaltid.cs` and add a `DbSet` plus EF mapping in [backend/Data/AppDbContext.cs](../../backend/Data/AppDbContext.cs).
  - [ ] Create `backend/DTOs/PlannedMealDtos.cs` for list, create, and update-servings request/response shapes.
  - [ ] Create `backend/Controllers/PlanlagteMaaltiderController.cs` at route `/api/planlagte-maaltider`.
  - [ ] Implement `GET /api/planlagte-maaltider?weekStartDate=YYYY-MM-DD` returning only the caller's household rows for that Monday.
  - [ ] Implement `POST /api/planlagte-maaltider` to save recipe, week, day, meal type, and servings for the caller's household.
  - [ ] Implement `PUT /api/planlagte-maaltider/{id}/servings` or `PATCH /api/planlagte-maaltider/{id}` for servings edits. Pick one route and keep the frontend DTOs aligned.
  - [ ] Resolve household tenancy server-side through `Medlemmer`, following `HandlelisteController.GetHouseholdId(userId)`. Do not trust a JWT `householdId` claim or any client-provided household id.
  - [ ] Validate that the recipe and meal-type ids exist before saving. Return 404 `{ message }` for missing recipe/meal type and 400 `{ message }` for invalid week/day/servings input.
  - [ ] On same-slot conflicts, return 409 `{ message }` instead of silently overwriting.

- [ ] **T3: Add frontend planning feature hooks and date helpers** (AC: 1, 2, 3, 4)
  - [ ] Create `frontend/app/lib/dates.ts` if it does not exist, with local-date helpers for Monday start, `YYYY-MM-DD` formatting, seven-day week expansion, and +/- week navigation.
  - [ ] Create `frontend/app/features/planning/types.ts` matching the backend camelCase JSON payload.
  - [ ] Create `frontend/app/features/planning/use-planned-meals.ts` using [frontend/app/lib/api-fetch.ts](../../frontend/app/lib/api-fetch.ts) and TanStack Query.
  - [ ] Use query keys shaped like `["planned-meals", weekStartDate]`.
  - [ ] Mutations must invalidate the specific selected week key. If a mutation can affect another week, invalidate both the source and target week keys, not the entire query cache.

- [ ] **T4: Replace the Plan placeholder with the weekly plan UI** (AC: 1, 2)
  - [ ] Update [frontend/app/routes/app/plan.tsx](../../frontend/app/routes/app/plan.tsx), which is currently only the Story 2.2 placeholder.
  - [ ] Keep the route path `/app/plan`; older docs mention `/app/planned`, but the live React Router config and bottom nav use `/app/plan`.
  - [ ] Render previous/next week icon buttons with accessible labels and a visible week title.
  - [ ] Render seven Monday-anchored day groups. Each planned slot must show meal type, recipe name, and servings.
  - [ ] Empty states must be visible per empty day/slot and include an add entry point.
  - [ ] Keep the app shell and bottom nav visible while plan data loads or fails. Use inline retry for load failures.
  - [ ] Do not implement the Epic 3 "Generate shopping list" sheet in this story. It may be absent or disabled/staged, but must not create shopping rows.

- [ ] **T5: Wire recipe detail "Add to plan" to a real add-to-plan sheet** (AC: 3)
  - [ ] Update [frontend/app/routes/app/chef.tsx](../../frontend/app/routes/app/chef.tsx) so the existing `Legg i plan` action opens an add-to-plan flow instead of the Story 2.2 toast placeholder.
  - [ ] Reuse [frontend/app/components/detail-sheet.tsx](../../frontend/app/components/detail-sheet.tsx) or the existing sheet primitive instead of adding a separate modal pattern.
  - [ ] The sheet must let the user choose this week/next week or equivalent week navigation, day, meal type, and servings.
  - [ ] Default week to the current Monday-anchored week; default day to today if it is in the selected week, otherwise the next future day; default meal type to `Middag` when available; default servings to household member count when available, otherwise the recipe portions or 4.
  - [ ] Clamp servings to 1-20 with stepper/buttons and a labelled numeric value.
  - [ ] On successful save, show a toast, close the sheet, and invalidate `["planned-meals", weekStartDate]`.
  - [ ] Keep focus return behavior from the recipe detail sheet intact.

- [ ] **T6: Add an edit-servings sheet for planned meals** (AC: 4)
  - [ ] Tapping a planned meal opens a compact edit sheet showing day, meal type, recipe name, and current servings.
  - [ ] Persist serving changes through the planned-meal mutation hook.
  - [ ] Disable only the submitting controls while saving and show mutation errors in a recoverable way.
  - [ ] Do not add removal, exclusion, cooked/locked behavior, or shopping-row cleanup here. Story 2.3 owns those rules.

- [ ] **T7: Verify the story end to end** (AC: 1, 2, 3, 4)
  - [ ] Run `npm run typecheck --prefix frontend`.
  - [ ] Run `dotnet build backend/backend.csproj` or the repo's normal backend build command.
  - [ ] Run `npm run build` from the repo root if source changes affect the compiled SPA.
  - [ ] Manual smoke: authenticated household member opens `/app/plan`, navigates previous/next week, sees Monday `YYYY-MM-DD` behavior, adds a recipe from Chef, edits servings, refreshes, and sees persisted data.
  - [ ] Manual smoke at 360px width and keyboard-only through week navigation, add-to-plan sheet, empty slot action, planned meal button, and edit servings.

### Review Findings

- [x] [Review][Patch] Delete planned meals when deleting a recipe [backend/Controllers/OppskrifterController.cs:181]
- [x] [Review][Patch] `database/schema.sql` creates `PlanlagteMaaltider` twice [database/schema.sql:277]
- [x] [Review][Patch] Planned meal creation accepts globally existing recipes instead of caller-visible recipes [backend/Controllers/PlanlagteMaaltiderController.cs:64]
- [x] [Review][Patch] Planned meal creation accepts meal type categories the plan UI never renders [backend/Controllers/PlanlagteMaaltiderController.cs:68]
- [x] [Review][Patch] Concurrent same-slot creates can return 500 instead of 409 [backend/Controllers/PlanlagteMaaltiderController.cs:72]
- [x] [Review][Patch] `weekStartDate` parsing is culture-sensitive instead of exact `YYYY-MM-DD` [backend/Controllers/PlanlagteMaaltiderController.cs:149]
- [x] [Review][Patch] Add-to-plan servings default does not update when household data finishes loading [frontend/app/features/planning/add-to-plan-panel.tsx:53]

## Dev Notes

### What this story is and is not

This story creates the shared weekly plan foundation: backend persistence, weekly query, add-to-plan, Plan route display, week navigation, and serving edits.

It is not:

- Per-planned-meal ingredient exclusions. Story 2.3 owns `PlanlagteMaaltidEkskludertIngrediens` and swipe/tap exclusion persistence.
- Planned-meal deletion and cooked-history protection. Story 2.3 owns removal behavior and 409 protection for cooked meals.
- Shopping-list suggestion generation, confirmation, or the suggestions sheet. Epic 3 owns `/api/handleliste/generate-from-week` and manual confirmation.
- Cookbook history graduation, purchase completion, or ratings.
- Recipe creation/editing, image uploads, pantry deduction, unit conversion, or multi-household switching.

### Current state to preserve

Current frontend state:

- [frontend/app/routes/app/plan.tsx](../../frontend/app/routes/app/plan.tsx) is a placeholder: "Ukeplan kommer i Story 2.2."
- [frontend/app/routes.ts](../../frontend/app/routes.ts) maps the live route as `/app/plan`, not `/app/planned`.
- [frontend/app/components/BottomNav.tsx](../../frontend/app/components/BottomNav.tsx) links the Plan tab to `/app/plan`.
- [frontend/app/routes/app/layout.tsx](../../frontend/app/routes/app/layout.tsx) already gates `/app/*` behind auth and household membership. Do not duplicate route guards inside Plan or Chef.
- [frontend/app/components/AppShell.tsx](../../frontend/app/components/AppShell.tsx) owns the mobile shell and bottom-nav spacing.
- [frontend/app/lib/api-fetch.ts](../../frontend/app/lib/api-fetch.ts) injects bearer tokens, handles 401, clears auth, and reads `{ message }` errors.
- [frontend/app/lib/query-client.ts](../../frontend/app/lib/query-client.ts) defines app-wide TanStack Query defaults.
- [frontend/app/components/detail-sheet.tsx](../../frontend/app/components/detail-sheet.tsx) is the reusable bottom sheet from Story 2.1. Reuse it for add/edit flows unless implementation proves it cannot fit.
- [frontend/app/features/recipes/use-recipes.ts](../../frontend/app/features/recipes/use-recipes.ts) already exposes `useRecipes`, `useRecipe`, and `useRecipeCategories`.
- [frontend/app/routes/app/chef.tsx](../../frontend/app/routes/app/chef.tsx) currently has an `addToPlanHint()` toast placeholder. Replace that placeholder with real planning UI; do not regress search/filter/detail behavior.

Current backend state:

- [backend/Controllers/HandlelisteController.cs](../../backend/Controllers/HandlelisteController.cs) contains the household membership lookup pattern this story must reuse: get the user id from `ClaimTypes.NameIdentifier`, find their `Medlemmer` row, and scope data to that household.
- [backend/Data/AppDbContext.cs](../../backend/Data/AppDbContext.cs) maps existing tables and needs a planned-meal `DbSet` plus relationships.
- [backend/Models/Oppskrift.cs](../../backend/Models/Oppskrift.cs), [backend/Models/Ingrediens.cs](../../backend/Models/Ingrediens.cs), and the odd filename [backend/Models/Oppskriftskategori'.cs](../../backend/Models/Oppskriftskategori'.cs) are the existing recipe/category models. Do not rename the category file as part of this story unless the implementation cannot compile without it.
- [backend/Controllers/OppskriftskategorierController.cs](../../backend/Controllers/OppskriftskategorierController.cs) returns meal type/category options ordered by id.
- [database/Oppskriftskategorier-seed.sql](../../database/Oppskriftskategorier-seed.sql) includes ids 1-3 for `Frokost`, `Lunsj`, `Middag`, plus 7 `Kveldsmat` and 8 `Mellommaltid`. Existing Forrett/Dessert/Snacks rows can remain; frontend planning should show the v1 meal types only.

### Backend API contract

Use these endpoint shapes unless implementation discovers a hard conflict:

| Method | Path | Purpose | Notes |
| --- | --- | --- | --- |
| `GET` | `/api/planlagte-maaltider?weekStartDate=YYYY-MM-DD` | Fetch household planned meals for a Monday-start week | Auth required; `weekStartDate` must already be a Monday date. |
| `POST` | `/api/planlagte-maaltider` | Add a recipe to a week/day/meal-type slot | Auth required; body includes `oppskriftId`, `weekStartDate`, `day`, `mealTypeId`, `servings`. |
| `PUT` or `PATCH` | `/api/planlagte-maaltider/{id}/servings` | Edit servings for one planned meal | Auth required; only rows in caller's household can be edited. |

Recommended DTO shape:

```csharp
public class PlannedMealDto
{
    public ulong Id { get; set; }
    public string WeekStartDate { get; set; } = string.Empty;
    public int Day { get; set; }
    public ulong MealTypeId { get; set; }
    public string MealType { get; set; } = string.Empty;
    public ulong OppskriftId { get; set; }
    public string OppskriftNavn { get; set; } = string.Empty;
    public int Servings { get; set; }
}

public class CreatePlannedMealRequest
{
    public ulong OppskriftId { get; set; }
    public string WeekStartDate { get; set; } = string.Empty;
    public int Day { get; set; }
    public ulong MealTypeId { get; set; }
    public int Servings { get; set; }
}

public class UpdatePlannedMealServingsRequest
{
    public int Servings { get; set; }
}
```

Frontend DTO names can be English, but JSON field names should remain camelCase as emitted by ASP.NET defaults. Do not invent a nested API envelope unless the backend and frontend are changed together.

### Date and slot semantics

- `weekStartDate` is a local calendar date string in `YYYY-MM-DD` format and must represent Monday.
- Avoid JavaScript `Date.toISOString()` for display/date-key generation because timezone conversion can shift local dates around midnight. Build local date keys from `getFullYear()`, `getMonth() + 1`, and `getDate()`.
- Store day as a stable integer. Recommended: `1 = Monday` through `7 = Sunday`. If implementation chooses `0 = Monday`, document it in the DTO and keep backend/frontend consistent.
- A slot is household + week + day + meal type. The v1 UI can show one planned meal per slot.
- Same recipe in different slots is allowed.
- Same exact slot conflict should return 409 `{ message }`; the UI should explain that the slot already has a meal and let the user pick another slot.

### UI and accessibility guardrails

- This is authenticated app UI. Use the `frontend-design` skill during implementation and keep the screen compact, practical, and mobile-first.
- Use lucide icons for previous/next week buttons and visible text for the current week.
- Buttons need accessible names such as "Previous week", "Next week", "Add dinner on Wednesday", and "Edit Taco servings".
- Empty slots and planned slots must be keyboard reachable. Do not use clickable `div`s.
- Loading states should reserve list/slot space and must not hide the bottom nav.
- Error states should be inline with retry for `GET` failures and toast or inline sheet feedback for mutations.
- Text must fit at 360px. Prefer short labels inside controls and move supporting details outside buttons.
- Use the existing warm, token-based product styling. Do not introduce a landing-page hero, decorative gradients, nested cards, or one-off color palettes.

### Query and cache guidance

Use feature hooks rather than calling `apiFetch` directly from route components:

```ts
useQuery({
  queryKey: ["planned-meals", weekStartDate],
  queryFn: () => apiFetch<PlannedMealDto[]>(`/api/planlagte-maaltider?weekStartDate=${weekStartDate}`),
})
```

For create/update mutations:

```ts
const queryClient = useQueryClient()

useMutation({
  mutationFn: createPlannedMeal,
  onSuccess: async (_data, variables) => {
    await queryClient.invalidateQueries({
      queryKey: ["planned-meals", variables.weekStartDate],
    })
  },
})
```

Context7 lookup for TanStack Query resolved `/tanstack/query` with high source reputation. Current docs show invalidating related queries in `useMutation` `onSuccess`, and query matching can target either a prefix key or a more specific key. For this story, prefer the specific `["planned-meals", weekStartDate]` key after create/update, and avoid `queryClient.clear()` or broad app-wide invalidation.

### Previous story intelligence

Story 2.1 created the recipe discovery context this story builds on, but [sprint-status.yaml](./sprint-status.yaml) currently marks `2-1-recipe-discovery-and-detail-sheets` as `review`, not `done`. Treat the recipe feature files and Chef route as active local work that may be completed before or alongside this story; do not revert them.

Actionable carryover:

- Recipe browsing uses `frontend/app/features/recipes/` hooks and DTOs. Planning should mirror that pattern with `frontend/app/features/planning/`.
- The recipe detail sheet already has focus return behavior. Preserve it when adding the planning sheet or nested planning state.
- `useMe()` and app layout already handle session/no-household redirects, so planning endpoints still need backend membership checks but frontend route code does not need a second auth gate.
- Backend household scoping must resolve through `Medlemmer`, matching Story 2.1's warning about not trusting the JWT household claim.
- New shadcn primitives, if needed, must be installed with the shadcn CLI per repo rules. Existing `Button`, `Input`, `Label`, `Dialog`, `Sheet`, `DropdownMenu`, and `Sonner` may already cover this story.

### Git intelligence

Recent commits:

- `5f7f235 feat(household): invites, onboarding create/join, account context (1.4)` - establishes feature-hook patterns, owner/member household context, and frontend route replacement style.
- `e531076 Add React Router 7 frontend rebuild and supporting setup` - establishes the React Router app, app shell, auth foundation, and source-vs-generated frontend distinction.

Current worktree notes:

- There are modified files from prior work in backend controllers, schema files, account/onboarding routes, and recipe UI.
- `frontend/app/features/recipes/`, `frontend/app/components/detail-sheet.tsx`, `frontend/app/components/ui/sheet.tsx`, and `backend/wwwroot/` are currently untracked/generated or active local outputs.
- Do not revert unrelated local changes. Source changes belong under `frontend/`, `backend/`, and `database/`; `backend/wwwroot/` is generated build output.

### Testing standards summary

There is no broad automated test harness for this flow yet. Keep verification focused and do not introduce a new test stack only for weekly planning.

Minimum verification:

- Frontend typecheck catches DTO/hook/component errors.
- Backend build catches controller, EF mapping, and DTO issues.
- Root build confirms the SPA still compiles and copies into backend static assets.
- Manual browser smoke covers `/app/plan`, week navigation, add-to-plan from Chef, serving edit persistence, loading/empty/error states, 360px layout, and keyboard access.

If a lightweight backend test harness exists by implementation time, prioritize:

- `GET /api/planlagte-maaltider?weekStartDate=...` rejects non-Monday or malformed dates with 400 `{ message }`.
- Planned meals are scoped by `Medlemmer` household membership.
- Same-slot conflict returns 409 `{ message }`.
- Serving update only changes rows in the caller's household and enforces 1-20.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.2]
- [Source: _bmad-output/planning-artifacts/prd.md#Meal-Planning]
- [Source: _bmad-output/planning-artifacts/prd.md#Non-Functional-Requirements]
- [Source: _bmad-output/planning-artifacts/architecture.md#API-&-Communication-Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure-&-Boundaries]
- [Source: _bmad-output/planning-artifacts/architecture.md#Requirements-to-Structure-Mapping]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Week-Navigator]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Planned-Meal-Slot]
- [Source: docs/ui-ux-screens.md#Add-to-plan-sheet]
- [Source: docs/ui-ux-screens.md#appplanned---Weekly-Plan]
- [Source: docs/frontend-architecture-decisions.md#Meal-Planning]
- [Source: docs/frontend-architecture-decisions.md#Backend-Changes-Required]
- [Source: frontend/app/routes/app/plan.tsx]
- [Source: frontend/app/routes/app/chef.tsx]
- [Source: frontend/app/components/detail-sheet.tsx]
- [Source: frontend/app/lib/api-fetch.ts]
- [Source: frontend/app/lib/query-client.ts]
- [Source: backend/Controllers/HandlelisteController.cs]
- [Source: backend/Data/AppDbContext.cs]
- [Source: database/schema.sql]
- [Source: Context7 /tanstack/query invalidations-from-mutations and query-invalidation docs]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

- Implemented `PlanlagteMaaltider` table (schema + `database/v2_2_planlagte_maaltider.sql`), EF model, `/api/planlagte-maaltider` GET/POST + servings PUT with household scoping via `Medlemmer`, Monday validation, 409 slot conflicts.
- Frontend: `~/lib/dates` Monday-first helpers, TanStack Query hooks with keyed invalidation, `/app/plan` weekly grid + servings sheet, Chef add-to-plan form in `DetailSheet`.
- Production build: explicit `~` alias in `frontend/vite.config.ts` so `react-router build` resolves imports under paths with spaces.

### File List

- `database/schema.sql`, `database/v2_2_planlagte_maaltider.sql`
- `backend/Models/PlanlagtMaaltid.cs`, `backend/DTOs/PlannedMealDtos.cs`, `backend/Controllers/PlanlagteMaaltiderController.cs`, `backend/Data/AppDbContext.cs`
- `frontend/app/lib/dates.ts`, `frontend/app/features/planning/*`, `frontend/app/routes/app/plan.tsx`, `frontend/app/routes/app/chef.tsx`, `frontend/vite.config.ts`

### Change Log

| Date | Description |
| --- | --- |
| 2026-04-30 | Story created, status: ready-for-dev. |
| 2026-04-30 | Implemented Story 2.2 (weekly plan API + UI); status: done. |
