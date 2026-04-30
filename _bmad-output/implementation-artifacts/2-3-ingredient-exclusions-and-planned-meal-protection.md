# Story 2.3: Ingredient Exclusions and Planned Meal Protection

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a household member,
I want to exclude ingredients and safely remove planned meals,
so that the plan can reflect what we already have without damaging cooked history.

## Acceptance Criteria

1. **Ingredient exclusions are stored per planned meal**
   - **Given** a planned meal has ingredients
   - **When** the user marks an ingredient as already available
   - **Then** the exclusion is stored for that planned meal only
   - **And** it does not hide the ingredient globally for other planned meals.

2. **Excluded ingredients can be restored**
   - **Given** an ingredient is excluded
   - **When** the user restores it
   - **Then** the exclusion is removed for that planned meal
   - **And** the UI updates with visible non-color-only status feedback.

3. **Swipe behavior uses the shared row pattern with alternatives**
   - **Given** swipe behavior is used for exclusion or restore
   - **When** the row is rendered
   - **Then** it uses the shared `SwipeActionRow` pattern
   - **And** a tap or menu alternative is also available.

4. **Uncooked planned meals can be removed**
   - **Given** a planned meal has not become cooked history
   - **When** the user removes it
   - **Then** the meal is removed from the selected week.

5. **Cooked planned meals are protected from silent deletion**
   - **Given** a planned meal has become cooked history
   - **When** the user attempts to remove it
   - **Then** the backend prevents silent deletion with a 409 `{ message }` response
   - **And** the UI explains that cooked meals cannot be removed this way.

## Tasks / Subtasks

- [ ] **T1: Add exclusion and delete-protection persistence** (AC: 1, 2, 4, 5)
  - [ ] Add `PlanlagteMaaltidEkskludertIngrediens` to [database/schema.sql](../../database/schema.sql) and a targeted migration, e.g. `database/v2_3_planlagt_maaltid_ekskludert_ingrediens.sql`.
  - [ ] Use columns `planlagt_maaltid_id`, `ingrediens_id`, `created_at`; add `UNIQUE (planlagt_maaltid_id, ingrediens_id)`.
  - [ ] Add FKs to `PlanlagteMaaltider(id)` and `Ingredienser(id)` with cascade delete from planned meal to exclusions.
  - [ ] Add `planlagt_maaltid_id` and `purchased_at` to `Handleliste` if still absent so delete protection can detect cooked history later. Add `kilde` only if needed by the existing schema/migration direction; Epic 3 owns generation semantics.
  - [ ] Before editing [database/schema.sql](../../database/schema.sql), fix the current duplicated `PlanlagteMaaltider` table block if it is still present. Do not add a third copy.

- [ ] **T2: Add backend model, DTO fields, and controller endpoints** (AC: 1, 2, 4, 5)
  - [ ] Add `backend/Models/PlanlagtMaaltidEkskludertIngrediens.cs` and map it in [backend/Data/AppDbContext.cs](../../backend/Data/AppDbContext.cs).
  - [ ] Extend [backend/DTOs/PlannedMealDtos.cs](../../backend/DTOs/PlannedMealDtos.cs) so `PlannedMealDto` includes ingredient rows with `id`, `varetypeId`, `varetype`, `kvantitet`, `maaleenhetId`, `maaleenhet`, `type`, `valgfritt`, and `excluded`.
  - [ ] Update [backend/Controllers/PlanlagteMaaltiderController.cs](../../backend/Controllers/PlanlagteMaaltiderController.cs) `GET /api/planlagte-maaltider?weekStartDate=YYYY-MM-DD` to include recipe ingredients and per-meal exclusion state.
  - [ ] Add `POST /api/planlagte-maaltider/{id}/ekskluder` with body `{ ingrediensId }`.
  - [ ] Add `DELETE /api/planlagte-maaltider/{id}/ekskluder/{ingrediensId}`.
  - [ ] Add `DELETE /api/planlagte-maaltider/{id}` for removing uncooked planned meals.
  - [ ] For all endpoints, resolve household tenancy server-side through `Medlemmer`; do not trust JWT household claims or client-provided household ids.
  - [ ] Validate that the ingredient belongs to the planned meal's recipe before creating or deleting an exclusion. Return 404 `{ message }` for missing planned meal/ingredient, 400 `{ message }` for invalid ids, and 409 `{ message }` for protected deletes.
  - [ ] Delete protection: if any `Handleliste` row linked to the planned meal has `purchased_at IS NOT NULL`, return 409 `{ message }`. Otherwise delete the planned meal and any non-purchased generated rows linked to it if those columns exist.

- [ ] **T3: Add shared swipe row infrastructure** (AC: 3)
  - [ ] Install `react-swipeable-list` in `frontend/` if it is still missing from [frontend/package.json](../../frontend/package.json).
  - [ ] Import `react-swipeable-list/dist/styles.css` exactly once at app level, preferably [frontend/app/root.tsx](../../frontend/app/root.tsx) or [frontend/app/app.css](../../frontend/app/app.css).
  - [ ] Create `frontend/app/components/SwipeActionRow.tsx` as the only wrapper around `react-swipeable-list`.
  - [ ] The wrapper must support a visible row body, one leading/trailing action, disabled/loading state, and a non-swipe fallback action rendered as a real button.
  - [ ] Keep swipe action labels text/icon based; excluded/restored state must not rely on color alone.

- [ ] **T4: Add planning hooks and DTO types for exclusions and removal** (AC: 1, 2, 4, 5)
  - [ ] Extend [frontend/app/features/planning/types.ts](../../frontend/app/features/planning/types.ts) with `PlannedMealIngredientDto`.
  - [ ] Extend [frontend/app/features/planning/use-planned-meals.ts](../../frontend/app/features/planning/use-planned-meals.ts) with mutations for exclude, restore, and delete.
  - [ ] Invalidate only the affected selected week key: `["planned-meals", weekStartDate]`.
  - [ ] Surface `ApiError.status === 409` distinctly enough that the UI can show the cooked-history protection copy.

- [ ] **T5: Update the Plan edit meal sheet** (AC: 1, 2, 3, 4, 5)
  - [ ] Update [frontend/app/routes/app/plan.tsx](../../frontend/app/routes/app/plan.tsx) rather than creating a new route; live route is `/app/plan`.
  - [ ] Keep the existing servings edit flow and add an ingredient section inside the planned-meal sheet.
  - [ ] Render ingredient rows from the planned meal DTO. Show quantity/unit/name, optional status where relevant, and an explicit "Already have" or "Included" state.
  - [ ] Use `SwipeActionRow` for exclude/restore and provide a tap/menu button alternative for the same action.
  - [ ] Add a remove action for planned meals, using a confirmation sheet or equivalent focused confirmation before deleting shared state.
  - [ ] On successful exclude/restore/delete, keep the app shell stable, invalidate the selected week, and show concise toast feedback.
  - [ ] If delete returns 409, keep the sheet open and show inline recoverable copy explaining that cooked meals cannot be removed this way.
  - [ ] Do not persist ingredient exclusions from the unplanned Chef recipe detail sheet; per-meal exclusions require a `plannedMealId`.

- [ ] **T6: Verify story behavior end to end** (AC: 1, 2, 3, 4, 5)
  - [ ] Run `npm run typecheck --prefix frontend`.
  - [ ] Run `dotnet build backend/backend.csproj`.
  - [ ] Run `npm run build` from the repo root if source changes affect the compiled SPA.
  - [ ] Manual smoke: add the same recipe to two different slots, exclude an ingredient on one planned meal, confirm the other planned meal still includes it, restore it, refresh, and confirm state persists.
  - [ ] Manual smoke: remove an uncooked planned meal and confirm the selected week updates.
  - [ ] Manual/API smoke: create or simulate a linked purchased `Handleliste` row, attempt planned-meal delete, and confirm 409 `{ message }`.
  - [ ] Manual UI smoke at 360px and keyboard-only through edit sheet, exclude/restore fallback button, swipe row, remove confirmation, and 409 error state.

### Review Findings

- [x] [Review][Patch] Make exclusion POST idempotent under concurrent duplicate requests [backend/Controllers/PlanlagteMaaltiderController.cs:212]
- [x] [Review][Patch] Make the Story 2.3 migration safe when columns/index already exist [database/v2_3_planlagt_maaltid_ekskludert_ingrediens.sql:17]
- [x] [Review][Patch] Let `SwipeActionRow` support either leading or trailing actions [frontend/app/components/SwipeActionRow.tsx:39]

## Dev Notes

### What this story is and is not

This story completes the Epic 2 planning foundation by adding per-planned-meal ingredient exclusions and safe planned-meal removal.

It is not:

- Shopping suggestion generation or confirmation. Epic 3 owns `POST /api/handleliste/generate-from-week` and the suggestions sheet.
- Purchase/restore shopping rows or purchase completion. Epic 4 owns active shopping-list purchase state and completion.
- Cookbook history UI. Epic 5 owns cookbook queries and rating/re-planning.
- Pantry behavior, unit conversion, recipe creation, image upload, or multi-household switching.

### Current state to preserve

Current backend state:

- [backend/Controllers/PlanlagteMaaltiderController.cs](../../backend/Controllers/PlanlagteMaaltiderController.cs) already implements week GET, create, and servings update at `/api/planlagte-maaltider`.
- Planned meals are household-scoped by resolving `Medlemmer` from the authenticated user id. Keep that pattern for new endpoints.
- [backend/DTOs/PlannedMealDtos.cs](../../backend/DTOs/PlannedMealDtos.cs) currently returns planned-meal summary fields only; it does not yet return ingredients or exclusions.
- [backend/Models/PlanlagtMaaltid.cs](../../backend/Models/PlanlagtMaaltid.cs) has no exclusion navigation collection yet.
- [backend/Models/Ingrediens.cs](../../backend/Models/Ingrediens.cs) already exposes recipe ingredient id, `varetype_id`, quantity, unit id, `type`, and `valgfritt`.
- [backend/Controllers/HandlelisteController.cs](../../backend/Controllers/HandlelisteController.cs) currently scopes shopping rows by household member ids. It does not yet have planned-meal source metadata or purchase timestamps.

Current frontend state:

- [frontend/app/routes/app/plan.tsx](../../frontend/app/routes/app/plan.tsx) shows the weekly plan and a `DetailSheet` for editing servings.
- [frontend/app/features/planning/use-planned-meals.ts](../../frontend/app/features/planning/use-planned-meals.ts) uses TanStack Query keys shaped like `["planned-meals", weekStartDate]`.
- [frontend/app/features/planning/types.ts](../../frontend/app/features/planning/types.ts) has only summary planned-meal DTOs.
- [frontend/app/components/detail-sheet.tsx](../../frontend/app/components/detail-sheet.tsx) is the reusable bottom sheet pattern; reuse it for edit/remove confirmation unless a small focused component is cleaner.
- `react-swipeable-list` is not currently present in [frontend/package.json](../../frontend/package.json), and no `SwipeActionRow` exists yet.
- [frontend/app/root.tsx](../../frontend/app/root.tsx) is a good app-level stylesheet import point if the library CSS is installed.

Worktree caution:

- Story 2.2 files are still modified/untracked in the working tree even though [sprint-status.yaml](./sprint-status.yaml) marks story 2.2 done. Do not revert or reformat unrelated Story 2.2 work.
- [database/schema.sql](../../database/schema.sql) currently contains duplicate `PlanlagteMaaltider` blocks. If still present during implementation, fix that as part of the database edit before adding the exclusion table.

### Backend API contract

Use these endpoint shapes unless implementation discovers a hard conflict:

| Method   | Path                                                     | Purpose                                               | Notes                                                              |
| -------- | -------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------ |
| `GET`    | `/api/planlagte-maaltider?weekStartDate=YYYY-MM-DD`      | Fetch household planned meals for a Monday-start week | Extend existing response with ingredients and `excluded`.          |
| `POST`   | `/api/planlagte-maaltider/{id}/ekskluder`                | Mark one planned-meal ingredient as already available | Body: `{ "ingrediensId": 123 }`. Idempotent success is acceptable. |
| `DELETE` | `/api/planlagte-maaltider/{id}/ekskluder/{ingrediensId}` | Restore one excluded planned-meal ingredient          | Idempotent success is acceptable.                                  |
| `DELETE` | `/api/planlagte-maaltider/{id}`                          | Remove an uncooked planned meal                       | Return 409 `{ message }` if cooked/purchased rows exist.           |

Recommended DTO addition:

```csharp
public class PlannedMealIngredientDto
{
    public ulong Id { get; set; }
    public ulong VaretypeId { get; set; }
    public string Varetype { get; set; } = string.Empty;
    public decimal? Kvantitet { get; set; }
    public ulong? MaaleenhetId { get; set; }
    public string? Maaleenhet { get; set; }
    public string? Type { get; set; }
    public bool? Valgfritt { get; set; }
    public bool Excluded { get; set; }
}
```

`PlannedMealDto` should expose `List<PlannedMealIngredientDto> Ingredients`. Frontend JSON fields should be camelCase as emitted by ASP.NET defaults; do not introduce a nested response envelope.

### Deletion and cooked-history semantics

Cookbook history is intended to be a derived read model from planned meals plus purchased recipe-derived shopping rows. That means deleting a planned meal after purchase would erase the only durable parent for cookbook history.

Implementation rule:

- If no linked `Handleliste` row has `purchased_at IS NOT NULL`, delete the planned meal.
- If linked non-purchased generated shopping rows exist, delete those with the planned meal to avoid orphaned suggestions.
- If any linked row has `purchased_at IS NOT NULL`, return 409 `{ message }` and leave the planned meal intact.

This rule may require adding nullable `Handleliste.planlagt_maaltid_id` and `Handleliste.purchased_at` now even though Epic 3/4 will use them more fully later. Keep the addition minimal and do not implement shopping generation in this story.

### UI and accessibility guardrails

- Use the `frontend-design` skill during implementation because this story changes authenticated app UI.
- Ingredient exclusion belongs in the planned-meal context, where a `plannedMealId` exists. The Chef recipe detail sheet can continue showing raw recipe ingredients.
- Use `SwipeActionRow` for swipe behavior. Do not implement one-off pointer/touch handling in `plan.tsx`.
- Every swipe action needs a keyboard/tap alternative with a real `<button>`.
- Excluded state must include text or icon+label, e.g. "Already have", not just dimming or color.
- Keep rows stable at 360px. Quantity/unit/name/status must not overlap; wrap details instead of shrinking text with viewport units.
- Keep the bottom nav visible while plan data loads or mutations run.
- Disable only the affected row/action while an exclusion/restore/delete mutation is pending.
- Use inline error copy for 409 protected delete; use toasts only for successful low-risk changes.

### Query and cache guidance

All new planning mutations should reuse the existing feature hook boundary in [frontend/app/features/planning/use-planned-meals.ts](../../frontend/app/features/planning/use-planned-meals.ts).

Use targeted invalidation:

```ts
await queryClient.invalidateQueries({
  queryKey: ["planned-meals", variables.weekStartDate],
});
```

Do not call `queryClient.clear()` or invalidate unrelated recipe/auth/shopping keys for this story.

### Previous story intelligence

Story 2.2 established:

- Monday `YYYY-MM-DD` week semantics and `day = 1..7`.
- `GET /api/planlagte-maaltider`, `POST /api/planlagte-maaltider`, and `PUT /api/planlagte-maaltider/{id}/servings`.
- Plan route lives at `/app/plan`; older docs mention `/app/planned`, but the live route and bottom nav use `/app/plan`.
- `DetailSheet` is the sheet pattern for focused decisions.
- Planning hooks and DTOs live under `frontend/app/features/planning/`.
- Mutation success invalidates `["planned-meals", weekStartDate]`.

Build on these files instead of introducing a second planning feature boundary.

### Git intelligence

Recent commits:

- `07207c4 Add branching rule: stay on feature/frontend-rebuild`
- `c0ec30e Refine household invites, recipe details, and onboarding UX`
- `5f7f235 feat(household): invites, onboarding create/join, account context (1.4)`
- `e531076 Add React Router 7 frontend rebuild and supporting setup`

Actionable pattern:

- Continue feature-folder frontend code under `frontend/app/features/*`.
- Continue extending the existing .NET controllers and DTOs rather than adding a separate service layer unless duplication becomes painful.
- Do not create another frontend app or route namespace.

### Latest technical information

Context7 lookup was attempted for `react-swipeable-list` three times on 2026-04-30:

- `react-swipeable-list`
- `sandstreamdev react-swipeable-list`
- `react-swipeable-list npm`

Context7 returned unrelated libraries (`react-native-swipeable-item` or `react-swipeable-views`) and did not provide a valid `/org/project` id for the web `react-swipeable-list` package. Do not cite those results as documentation. During implementation, inspect the installed package types/examples locally after adding the dependency, or use the package's official docs if available outside Context7.

### Testing standards summary

There is no broad automated test harness for this flow yet. Keep verification focused and do not introduce a new test stack only for this story.

Minimum verification:

- Frontend typecheck catches DTO/hook/component issues.
- Backend build catches controller, EF mapping, and DTO issues.
- Root build confirms the SPA still compiles and copies into backend static assets.
- Manual smoke covers per-meal exclusion isolation, restore, delete, 409 protection, 360px layout, and keyboard/tap alternatives.

If a lightweight backend test harness exists by implementation time, prioritize:

- Excluding an ingredient fails if the planned meal is not in the caller's household.
- Excluding an ingredient fails if the ingredient belongs to another recipe.
- Duplicate exclude requests do not create duplicate rows.
- Restore is scoped to the caller's household.
- Delete returns 409 when linked purchased shopping rows exist.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.3]
- [Source: _bmad-output/planning-artifacts/prd.md#Meal-Planning]
- [Source: _bmad-output/planning-artifacts/prd.md#Reliability]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend-Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#Communication-Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure-&-Boundaries]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Swipe-Action-Row]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Planned-Meal-Slot]
- [Source: docs/frontend-architecture-decisions.md#Meal-Planning]
- [Source: docs/frontend-architecture-decisions.md#Cookbook-History]
- [Source: docs/frontend-architecture-decisions.md#Backend-Changes-Required]
- [Source: docs/ui-ux-screens.md#Recipe-detail-sheet-from-appchef]
- [Source: docs/ui-ux-screens.md#Edit-planned-meal-sheet]
- [Source: frontend/app/routes/app/plan.tsx]
- [Source: frontend/app/features/planning/use-planned-meals.ts]
- [Source: frontend/app/features/planning/types.ts]
- [Source: frontend/app/components/detail-sheet.tsx]
- [Source: backend/Controllers/PlanlagteMaaltiderController.cs]
- [Source: backend/DTOs/PlannedMealDtos.cs]
- [Source: backend/Models/PlanlagtMaaltid.cs]
- [Source: backend/Models/Ingrediens.cs]
- [Source: backend/Controllers/HandlelisteController.cs]
- [Source: database/schema.sql]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

- Per-meal exclusions: table `PlanlagteMaaltidEkskludertIngrediens`, API POST/DELETE `ekskluder`, extended week GET with `ingredients` and `excluded`.
- Delete protection: `Handleliste.planlagt_maaltid_id`, `Handleliste.purchased_at`; DELETE planned meal returns 409 when any linked row has `purchased_at` set.
- UI: `SwipeActionRow` wraps `react-swipeable-list` (IOS-style trailing action plus fallback button); plan edit sheet lists ingredients, remove flow with confirmation and inline 409 copy.
- Apply `database/v2_3_planlagt_maaltid_ekskludert_ingrediens.sql` on existing databases; canonical `schema.sql` places planned meals and exclusions before `Handleliste` so the FK is valid on fresh installs.
- Production bundle adds `prop-types` because `react-swipeable-list` ESM imports it.

### File List

- `database/schema.sql`, `database/v2_3_planlagt_maaltid_ekskludert_ingrediens.sql`
- `backend/Models/PlanlagtMaaltidEkskludertIngrediens.cs`, `backend/Models/PlanlagtMaaltid.cs`, `backend/Models/HandlelisteRad.cs`
- `backend/Data/AppDbContext.cs`, `backend/DTOs/PlannedMealDtos.cs`, `backend/Controllers/PlanlagteMaaltiderController.cs`
- `frontend/app/root.tsx`, `frontend/app/components/SwipeActionRow.tsx`, `frontend/app/features/planning/types.ts`, `frontend/app/features/planning/use-planned-meals.ts`, `frontend/app/routes/app/plan.tsx`
- `frontend/package.json`, `frontend/package-lock.json`

### Change Log

| Date       | Description                                                             |
| ---------- | ----------------------------------------------------------------------- |
| 2026-04-30 | Story created, status: ready-for-dev.                                   |
| 2026-04-30 | Implemented exclusions, delete protection, plan sheet UI; status: done. |
