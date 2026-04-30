# Story 5.1: Cookbook History, Search, Sorting, and Re-Planning

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a household member,
I want to find cooked meals and add them back to the plan,
so that the household can repeat meals that worked well.

## Acceptance Criteria

1. **Cookbook history is derived from completed shopping**
   - **Given** purchase completion archives purchased recipe-derived rows
   - **When** qualifying planned meals meet cookbook criteria
   - **Then** cookbook history exposes those meals through a derived read model
   - **And** no new cookbook table is created.

2. **Cookbook route shows cooked meal history**
   - **Given** the cookbook route loads
   - **When** cooked history exists
   - **Then** cookbook rows show recipe name, meal type, cooked count, and last cooked date.

3. **Search, filtering, and sorting update visible rows**
   - **Given** the user searches, filters, or sorts cookbook history
   - **When** data updates
   - **Then** visible rows reflect the chosen criteria
   - **And** results can prioritize the current user's ratings and recency.

4. **Cooked meals can be planned again**
   - **Given** a cookbook history row is visible
   - **When** the user chooses to plan it again
   - **Then** the add-to-plan flow opens with the recipe preselected
   - **And** the user can choose week, day, meal type, and servings.

5. **Empty cookbook state guides the next useful action**
   - **Given** no meals have been completed
   - **When** the cookbook route renders
   - **Then** an empty state guides the user to complete a shopping trip first.

## Tasks / Subtasks

- [x] **T1: Add cookbook DTOs and a derived backend read endpoint** (AC: 1, 2, 3)
  - [x] Add `backend/DTOs/CookbookDtos.cs` only if a separate DTO file keeps the contract clearer than extending `RecipeDtos.cs`.
  - [x] Add either a small `backend/Controllers/CookbookController.cs` at `/api/cookbook` or a narrow cookbook action in `OppskrifterController`; choose the smallest fit and keep routes under `/api/*`.
  - [x] Resolve the current user id from `ClaimTypes.NameIdentifier`; return 401 if it is missing.
  - [x] Resolve household membership server-side through `Medlemmer`; never accept household id from route, query string, request body, JWT household claims, or local storage.
  - [x] Query archived, purchased, recipe-derived shopping rows for the caller's household: `Handleliste.PurchasedAt != null`, `Handleliste.ArchivedAt != null`, and `Kilde == "plannedMeal"`.
  - [x] Include both direct `Handleliste.PlanlagtMaaltidId` and `HandlelistePlanlagteMaaltider.PlanlagtMaaltidId` links so aggregated shopping rows can contribute to every planned meal they came from.
  - [x] Join through `PlanlagteMaaltider`, `Oppskrifter`, and meal type/category data to return recipe name, recipe id, meal type, cooked count, and last cooked date.
  - [x] Join the current user's `Skjuloppskrift` preference for rating data used in Story 5.1 sorting. Do not implement rating mutation UI here; Story 5.2 owns rating writes.
  - [x] Do not create `Cookbook`, `CookbookHistory`, trip, pantry, analytics, or duplicate recipe-history tables.

- [x] **T2: Support search, meal-type filtering, and sorting in the API** (AC: 3)
  - [x] Accept narrow query params such as `search`, `mealTypeId`, and `sort`; use camelCase for new frontend-facing params.
  - [x] Search by recipe name and, if cheap with the existing query, meal type name. Keep search server-side so empty and filtered states reflect the source data.
  - [x] Filter by planning meal type ids used by the app (`1, 2, 3, 7, 8`) rather than unrelated recipe categories.
  - [x] Provide deterministic sorting options, at minimum recency and rating-aware recency. A practical default is current-user rating descending, then `lastCookedAt` descending, then recipe name.
  - [x] Return user-facing backend errors as `{ message = "..." }`; avoid adding a global API envelope.

- [x] **T3: Add cookbook frontend types and TanStack Query hook** (AC: 2, 3)
  - [x] Create `frontend/app/features/cookbook/types.ts` for the API DTOs.
  - [x] Create `frontend/app/features/cookbook/use-cookbook-history.ts` using `apiFetch`; do not call `fetch` directly.
  - [x] Use stable tuple query keys such as `["cookbook", filters]`; make filters serializable and stable.
  - [x] Preserve Story 4.3's invalidation target: completion already invalidates `["cookbook"]`, so the cookbook query key must share that prefix.
  - [x] Keep server state in TanStack Query and use local React state only for UI controls such as search text, selected filter, sort mode, and sheet visibility.

- [x] **T4: Replace the `/app/book` placeholder with the cookbook UI** (AC: 2, 3, 5)
  - [x] Update `frontend/app/routes/app/book.tsx`; keep the route name and bottom-nav destination intact.
  - [x] Add compact search input, meal-type filter chips or segmented controls, and a sort control that works at 360px width.
  - [x] Render cookbook rows with recipe name, meal type, cooked count, last cooked date, and current user's rating state if available.
  - [x] Use text/icon state cues; do not rely on color alone for rating, empty, filtered, or loading states.
  - [x] Add localized loading, error/retry, empty, and no-results states. The empty state should guide the user toward planning/shopping completion, not generic recipe browsing.
  - [x] Keep the desktop view as the centered mobile app shell, not a dashboard.

- [x] **T5: Reuse the existing add-to-plan flow for re-planning** (AC: 4)
  - [x] Reuse `DetailSheet` plus `AddToPlanPanel` from `frontend/app/features/planning/add-to-plan-panel.tsx`; do not create a second planning form.
  - [x] When a row's plan action is chosen, open the sheet with that recipe preselected and pass the recipe id and portions into `AddToPlanPanel`.
  - [x] If the cookbook endpoint does not include recipe portions, fetch recipe details through the existing recipe query before rendering `AddToPlanPanel`.
  - [x] On successful planning, toast concise feedback and invalidate only the affected `["planned-meals", weekStartDate]` query through the existing `useCreatePlannedMeal` hook.
  - [x] Preserve add-to-plan validation and conflict behavior from the planning endpoint, including 409 slot conflicts.

- [x] **T6: Verify backend and frontend behavior** (AC: 1, 2, 3, 4, 5)
  - [x] Run a backend build (`dotnet build backend/backend.csproj` or the established alternate output if `backend.exe` is locked).
  - [x] Run `npm run typecheck --prefix frontend`.
  - [x] Run the root `npm run build` if backend, frontend, or backend-served SPA output changes.
  - [ ] Manual/API smoke: complete a shopping trip with a recipe-derived row, call the cookbook endpoint, and confirm one row appears with the correct recipe, meal type, count, and last cooked date.
  - [ ] Manual/API smoke: complete a second trip for the same recipe and confirm `cookedCount` increments without a new table or duplicate row.
  - [ ] Manual/API smoke: verify another household cannot see the row.
  - [ ] Manual UI smoke at 360px and desktop-centered width: search, filters, sort, empty/no-results/error/loading states, and re-planning sheet do not overlap the bottom navigation or sticky controls.

### Review Findings

- [x] [Review][Patch] Hidden recipes can still appear in cookbook rows and fail re-planning [backend/Controllers/CookbookController.cs:97]
- [x] [Review][Patch] Invalid meal type filters are ignored instead of narrowing or rejecting the request [backend/Controllers/CookbookController.cs:126]

## Dev Notes

### What this story is and is not

This story makes the Book route useful by exposing cooked household meals after purchase completion. Cookbook history must be a derived read model over existing planned meals and archived purchased shopping rows. It is not a new persistence area.

This story may read the current user's rating so sorting can prioritize rated recipes, but it must not implement the per-user rating control or rating mutation UX. Story 5.2 owns rating writes and rating accessibility details.

### Prerequisite and current sprint caution

Story 5.1 depends on Story 4.3's archive state and provenance being present:

- `Handleliste.archived_at` must exist in the database.
- Archived recipe-derived rows must retain `Kilde = "plannedMeal"`, `PlanlagtMaaltidId`, and `HandlelistePlanlagteMaaltider` links.
- Story 4.3's manual QA items may still be pending in `sprint-status.yaml`. Verify the archive migration has been applied before testing cookbook history.

### Current state to preserve

Backend:

- `backend/Controllers/HandlelisteController.cs` already owns active shopping rows, purchased rows, purchase, restore, suggestion generation, suggestion confirmation, completion preview, and shopping completion.
- `GET /api/handleliste` returns household rows where `PurchasedAt == null && ArchivedAt == null`.
- `GET /api/handleliste/purchased` returns rows where `PurchasedAt != null && ArchivedAt == null`.
- `POST /api/handleliste/complete` sets `ArchivedAt` on purchased household rows and returns summary counts.
- `BuildCompletionSummaryAsync` and `CountDistinctCookbookMeals` already show the distinct planned-meal logic Story 5.1 should reuse or mirror for the derived read model.
- `backend/Controllers/PlanlagteMaaltiderController.cs` owns planning and already prevents deleting planned meals that have purchased linked shopping rows.
- `backend/Controllers/OppskrifterController.cs` owns recipe reads and current-user preference lookup through `Skjuloppskrift`.
- `backend/Models/HandlelisteRad.cs` has `PlanlagtMaaltidId`, `PurchasedAt`, `ArchivedAt`, `Kilde`, and `PlanlagteMaaltidLinker`.
- `backend/Models/HandlelistePlanlagtMaaltidLink.cs` maps aggregated shopping row provenance.
- `backend/Models/PlanlagtMaaltid.cs` links household, recipe, week, day, meal type, and servings.
- `backend/Models/Skjuloppskrift.cs` stores per-user `Karakter`; reuse it for rating-aware sorting rather than adding rating storage.
- `backend/Data/AppDbContext.cs` already maps `Handleliste`, `HandlelistePlanlagteMaaltider`, `PlanlagteMaaltider`, `Oppskrifter`, and `Skjuloppskrifter`.

Frontend:

- `frontend/app/routes/app/book.tsx` is currently a placeholder for Story 5.1.
- `frontend/app/routes/app/chef.tsx` demonstrates the existing recipe detail and add-to-plan sheet composition.
- `frontend/app/features/planning/add-to-plan-panel.tsx` is the reusable planning form. Use it for cookbook re-planning.
- `frontend/app/features/planning/use-planned-meals.ts` already provides `useCreatePlannedMeal` and invalidates `["planned-meals", weekStartDate]`.
- `frontend/app/features/recipes/use-recipes.ts` already provides recipe/category hooks that can be reused if the re-plan sheet needs full recipe details or planning category data.
- `frontend/app/features/shopping/use-complete-shopping-trip.ts` invalidates the future cookbook key prefix `["cookbook"]`.
- `frontend/app/components/detail-sheet.tsx` is the existing focused decision sheet wrapper.

### Suggested API contract

Prefer a compact endpoint:

| Method | Path | Purpose |
| ------ | ---- | ------- |
| `GET` | `/api/cookbook?search=&mealTypeId=&sort=` | Return derived cookbook rows for the caller's household |

Recommended response shape:

```json
{
  "items": [
    {
      "recipeId": 12,
      "recipeName": "Taco bowl",
      "mealTypeId": 3,
      "mealType": "Middag",
      "cookedCount": 2,
      "lastCookedAt": "2026-04-30T12:00:00Z",
      "currentUserRating": 8,
      "recipePortions": 4
    }
  ]
}
```

Notes:

- `lastCookedAt` should come from the latest relevant `ArchivedAt`, not `PurchasedAt`, because cookbook history becomes visible after completion.
- `cookedCount` should count distinct planned meal ids after expanding both direct and many-to-many provenance.
- `recipePortions` is optional but useful for reusing `AddToPlanPanel` without an extra recipe-detail request.
- If no household membership exists, return an empty item list or a user-facing 400 consistently with nearby endpoints; do not expose data.

### Derived query guidance

The tricky part is expanding provenance before grouping:

1. Start from household member ids resolved via `Medlemmer`.
2. Select `Handleliste` rows with `PurchasedAt != null`, `ArchivedAt != null`, `Kilde == "plannedMeal"`, and `UserId` in the household member ids.
3. Expand planned meal ids from both `PlanlagtMaaltidId` and `PlanlagteMaaltidLinker`.
4. De-duplicate by planned meal id before grouping cookbook rows.
5. Join planned meals to recipes and meal types.
6. Group rows by the UI row identity. For v1, grouping by recipe plus meal type is a reasonable fit because rows must show one meal type.
7. For each group, compute `cookedCount` and `lastCookedAt`.
8. Join the current user's `Skjuloppskrift` row for `currentUserRating`.

Do not let manual shopping rows count as cookbook meals. Do not let purchased but unarchived rows count as cookbook history.

### Frontend UX guardrails

- The Book route should feel like completed meal history, not a generic saved-recipes library.
- Use the route for browsing/searching history and a sheet for the add-to-plan decision.
- Row actions must be tap/click and keyboard reachable.
- Keep controls compact and stable on 360px width. Avoid long labels inside narrow controls; use icons with accessible labels where appropriate.
- Empty state copy should point to the shopping completion routine because that is how history is created.
- Use localized skeletons or reserved row height so the app shell and bottom navigation do not jump.
- If showing ratings before Story 5.2, label them as the current user's rating and treat missing ratings as "not rated" in text, not stars alone.

### Previous story intelligence

Story 4.3 established the archive boundary this story consumes:

- Purchase completion archives rows in place by setting `ArchivedAt`; it does not delete shopping rows.
- Completion is idempotent and should not create duplicate cookbook history.
- Completion preview counts distinct planned meals using both direct and many-to-many links.
- Manual rows may be archived but do not count as cookbook meals.
- Archived rows are excluded from active and purchased shopping views.
- Future cookbook invalidation already uses `["cookbook"]`.
- There are pending manual/API smoke checks around archive provenance and repeat completion; run or repeat them before trusting cookbook output.

Earlier Epic 2 and 3 learnings still matter:

- Planned weeks use Monday `YYYY-MM-DD` keys.
- Add-to-plan already validates meal type, day, servings, recipe visibility, and slot conflicts.
- Generated shopping suggestions may aggregate multiple planned meals into one shopping row, so `HandlelistePlanlagteMaaltider` is essential for cookbook completeness.
- Planned-meal deletion protection uses purchased links; cookbook implementation must not weaken or bypass that historical protection.

### Git intelligence

Current branch at story creation time is `feature/frontend-rebuild`, matching the project rule.

Recent relevant commits:

- `59da867 feat(shopping): purchase, restore, and archive shopping rows`
- `d3f7986 feat(shopping): active shopping list with manual items and editing`
- `268c225 feat(shopping): confirm suggestions and link to planned meals`
- `826398a feat(shopping): generate deduplicated suggestions from weekly plan`
- `0a21e29 feat(planning): per-meal ingredient exclusion and meal removal`

The working tree already contains Story 4.3 files and pending review/manual QA state. Treat that as project state and do not revert it while implementing Story 5.1.

### Latest technical information

Context7 was used for current TanStack Query guidance. For React Query v5, mutation `onSuccess` can call `queryClient.invalidateQueries({ queryKey })`, and multiple invalidations can be awaited with `Promise.all`. Returning or awaiting the promise keeps mutation pending state active until invalidation work completes. Use that pattern for any cookbook-affecting mutations or re-plan success behavior.

No new runtime library should be needed for Story 5.1. If implementation needs fresh docs for ASP.NET Core, EF Core, React Router, shadcn/base-ui, or another library, run Context7 before relying on memory.

### Testing standards summary

There is no broad established automated test suite for this flow yet. Keep verification focused on household scoping, derivation correctness, duplicate prevention, query invalidation, and the re-plan UX.

Minimum verification:

- Backend build catches controller/DTO/query issues.
- Frontend typecheck catches route, hook, and DTO issues.
- Root build confirms the backend-served SPA still compiles if frontend/backend code changes.
- Manual/API smoke proves cookbook history appears only after archived purchase completion.
- Manual/API smoke proves repeat completion does not duplicate cookbook rows.
- Manual/API smoke proves cookbook rows are household-scoped.
- Manual UI smoke covers 360px, desktop-centered width, search, filter, sort, empty state, error state, loading state, and re-planning sheet.

## References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-5.1]
- [Source: _bmad-output/planning-artifacts/prd.md#Cookbook-&-Ratings]
- [Source: _bmad-output/planning-artifacts/architecture.md#Core-Architectural-Decisions]
- [Source: _bmad-output/planning-artifacts/architecture.md#API-&-Communication-Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure-&-Boundaries]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Shopping-Trip-to-Cookbook-Flow]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component-Strategy]
- [Source: _bmad-output/project-context.md]
- [Source: _bmad-output/implementation-artifacts/4-3-purchase-completion-and-archiving.md]
- [Source: backend/Controllers/HandlelisteController.cs]
- [Source: backend/Controllers/PlanlagteMaaltiderController.cs]
- [Source: backend/Controllers/OppskrifterController.cs]
- [Source: backend/DTOs/ShoppingListDtos.cs]
- [Source: backend/DTOs/PlannedMealDtos.cs]
- [Source: backend/Models/HandlelisteRad.cs]
- [Source: backend/Models/HandlelistePlanlagtMaaltidLink.cs]
- [Source: backend/Models/PlanlagtMaaltid.cs]
- [Source: backend/Models/Skjuloppskrift.cs]
- [Source: backend/Data/AppDbContext.cs]
- [Source: frontend/app/routes/app/book.tsx]
- [Source: frontend/app/routes/app/chef.tsx]
- [Source: frontend/app/features/planning/add-to-plan-panel.tsx]
- [Source: frontend/app/features/planning/use-planned-meals.ts]
- [Source: frontend/app/features/recipes/use-recipes.ts]
- [Source: frontend/app/components/detail-sheet.tsx]
- [Source: TanStack Query docs via Context7, /tanstack/query, invalidations from mutations]

## Story Completion Status

Ultimate context engine analysis completed - comprehensive developer guide created.

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

- Implemented derived cookbook read model via `GET /api/cookbook` (household-scoped from `Medlemmer`, expands direct + `HandlelistePlanlagteMaaltider` links, groups by recipe + måltidstype, `lastCookedAt` from `ArchivedAt`).
- Frontend: `useCookbookHistory` with query key prefix `["cookbook", …]` so shopping completion invalidation matches; `/app/book` uses search, måltid-filter (1,2,3,7,8), sort (Anbefalt / Nyeste), empty/no-results/error states, and `DetailSheet` + `AddToPlanPanel` for «Planlegg på nytt».
- Verification: `npm run typecheck --prefix frontend` OK; root `npm run build` OK (SPA copied to `backend/wwwroot`). Full `dotnet build` failed locally only because `backend.exe` was locked by a running process; `dotnet msbuild … /t:CoreCompile` succeeded.
- Manual/API smoke checks in T6 (trip completion, cross-household, 360px UI) remain for you when DB + server are available.

### File List

- `backend/DTOs/CookbookDtos.cs`
- `backend/Controllers/CookbookController.cs`
- `frontend/app/features/cookbook/types.ts`
- `frontend/app/features/cookbook/use-cookbook-history.ts`
- `frontend/app/routes/app/book.tsx`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/5-1-cookbook-history-search-sorting-and-re-planning.md`
