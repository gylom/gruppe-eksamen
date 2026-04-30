# Story 5.2: Per-User Recipe Ratings

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a household member,
I want to rate cooked recipes for my own account,
so that my cookbook view reflects my preferences without changing other members' ratings.

## Acceptance Criteria

1. **Cookbook rows support rating from the current user**
   - **Given** a cookbook row is visible
   - **When** the user rates the recipe
   - **Then** the rating is stored for the current user using existing rating storage
   - **And** the UI maps 1-5 stars to the backend rating scale consistently.

2. **Ratings are independent per household member**
   - **Given** another household member rates the same recipe
   - **When** the current user views cookbook history
   - **Then** the current user's rating remains independent.

3. **Rating controls are accessible and not star-only**
   - **Given** a rating control renders
   - **When** assistive technology reads it
   - **Then** it is labelled as the current user's rating
   - **And** the rating is not conveyed by stars alone.

4. **Successful rating updates refresh cookbook state**
   - **Given** saving a rating succeeds
   - **When** the mutation completes
   - **Then** toast feedback confirms the update
   - **And** cookbook queries are invalidated or updated targetedly.

## Tasks / Subtasks

- [ ] **T1: Reuse existing backend preference storage for cookbook ratings** (AC: 1, 2)
  - [ ] Confirm `PUT /api/oppskrifter/{id}/preferanse` is sufficient for cookbook rating writes before adding backend code.
  - [ ] Send `karakter` using the established `Skjuloppskrift.Karakter` scale and `skjul: false`; do not expose hide/unhide behavior from the cookbook rating control.
  - [ ] Map visible 1-5 stars to backend values `2, 4, 6, 8, 10`. Do not send backend value `1` for a one-star cookbook rating.
  - [ ] Preserve existing comments/preferences by omitting `kommentar` unless the UI explicitly edits it; this story does not add comment editing.
  - [ ] Do not add a ratings table, cookbook table, household-level rating table, or rating summary table.

- [ ] **T2: Add a cookbook rating mutation hook** (AC: 1, 4)
  - [ ] Add a narrow hook in `frontend/app/features/cookbook/`, for example `use-save-cookbook-rating.ts`.
  - [ ] Use `apiFetch`; do not call `fetch` directly from the route or component.
  - [ ] Use TanStack Query `useMutation` and invalidate the existing cookbook prefix with `queryClient.invalidateQueries({ queryKey: ["cookbook"] })` on success.
  - [ ] If recipe detail/list rating data can be stale in the same visible workflow, also invalidate targeted recipe keys such as `["recipe", recipeId]` and `["recipes"]`; avoid broad cache clears.
  - [ ] Return/await invalidation in `onSuccess` so pending state can cover the refresh work.

- [ ] **T3: Replace the static cookbook rating display with an accessible rating control** (AC: 1, 3, 4)
  - [ ] Update `frontend/app/routes/app/book.tsx` where rows currently show `currentUserRating` as text only.
  - [ ] Keep the row compact at 360px width and preserve the existing recipe name, meal type, cooked count, last cooked date, and "Plan again" action.
  - [ ] Render five reachable rating buttons or an equivalent semantic grouped control per row.
  - [ ] Show a visible text state such as "Your rating: 4 of 5" or "Not rated yet"; do not rely on filled star icons or color alone.
  - [ ] Give each rating action an accessible label that includes the recipe name and selected value, for example "Rate Taco bowl 4 of 5".
  - [ ] Disable only the affected row's rating buttons while its save mutation is pending.
  - [ ] On success, show concise toast feedback such as "Rating saved".
  - [ ] On error, show a recoverable toast using the backend `{ message }` when available through `ApiError`.

- [ ] **T4: Keep rating-aware sorting and row state consistent** (AC: 2, 4)
  - [ ] Ensure the existing `ratingThenRecent` sort reflects the saved rating after invalidation/refetch.
  - [ ] Keep missing ratings sorted after rated rows in rating-aware sort.
  - [ ] Ensure one member's saved rating does not appear for another member by relying on the current-user `Skjuloppskrift` join already used by `GET /api/cookbook`.
  - [ ] Do not make rating optimistic unless the update and rollback path remains simple and row-scoped.

- [ ] **T5: Verify the rating flow** (AC: 1, 2, 3, 4)
  - [ ] Run `npm run typecheck --prefix frontend`.
  - [ ] Run the root `npm run build` if frontend or backend-served SPA output changes.
  - [ ] If backend code changes, run `dotnet build backend/backend.csproj` or the established compile-only alternate if `backend.exe` is locked.
  - [ ] Manual/API smoke: rate a cookbook row as user A and confirm `Skjuloppskrift` stores that user's recipe rating.
  - [ ] Manual/API smoke: log in as user B in the same household, rate the same recipe differently, and confirm user A's rating is unchanged.
  - [ ] Manual UI smoke at 360px and desktop-centered width: rating buttons, text state, toast, loading/disabled state, and plan-again action do not overlap.
  - [ ] Manual accessibility smoke: keyboard through all five rating options, confirm visible focus, and confirm the rating is understandable without color or star fill alone.

### Review Findings

- [x] [Review][Patch] Shared mutation state can re-enable a still-pending row save [frontend/app/routes/app/book.tsx:45]

## Dev Notes

### Scope boundaries

This story adds per-user rating writes from the cookbook. It does not add household averages, rating analytics, comments, recipe hiding UI, recipe creation, image upload, pantry behavior, or a new persistence model.

The safest implementation is likely frontend-only because `OppskrifterController.SavePreference` already upserts `Skjuloppskrift` rows for `(UserId, OppskriftId)`. Add backend code only if the existing endpoint cannot satisfy the acceptance criteria after inspection.

### Current backend state to preserve

- `backend/Controllers/CookbookController.cs` already derives cookbook rows from archived, purchased, recipe-derived shopping rows.
- `GET /api/cookbook` resolves the current user from `ClaimTypes.NameIdentifier`, resolves household membership from `Medlemmer`, and never accepts household id from the client.
- Cookbook rows already include `CurrentUserRating = preference?.Karakter` from `Skjuloppskrift` for the current user only.
- Cookbook rows with `preference?.Skjul == true` are skipped. A cookbook rating control must not accidentally hide a recipe.
- `backend/Controllers/OppskrifterController.cs` has `PUT /api/oppskrifter/{id:long}/preferanse`.
- `RecipePreferenceRequest` has `Skjul`, `Karakter`, and `Kommentar`.
- `SavePreference` validates `Karakter` is between 1 and 10, creates a `Skjuloppskrift` row if missing, and saves it for the current `UserId`.
- `backend/Models/Skjuloppskrift.cs` stores `OppskriftId`, `UserId`, `Skjul`, `Karakter`, `Kommentar`, and `Begrunnelse`.
- `backend/Data/AppDbContext.cs` maps `Skjuloppskrift` and enforces a unique index on `(UserId, OppskriftId)`, which is the independence guarantee for AC2.

### Current frontend state to preserve

- `frontend/app/features/cookbook/types.ts` defines `currentUserRating: number | null` on `CookbookHistoryItem`.
- `frontend/app/features/cookbook/use-cookbook-history.ts` uses the stable cookbook prefix `["cookbook", ...]`.
- `frontend/app/routes/app/book.tsx` already owns search, meal-type filtering, rating-aware sort selection, empty/no-results/error/loading states, and the re-plan sheet.
- The Book route currently displays rating as `currentUserRating` out of 10 or "Not rated yet"; replace this display with a control without disturbing the rest of the row.
- `frontend/app/lib/api-fetch.ts` already injects auth, serializes JSON request bodies, reads backend `{ message }` errors, and handles 401 session expiry.
- `frontend/app/components/ui/button.tsx` is a Base UI button wrapper and is suitable for rating buttons if no new primitive is needed.

### Suggested API contract

Prefer reusing the existing endpoint:

| Method | Path | Body | Purpose |
| ------ | ---- | ---- | ------- |
| `PUT` | `/api/oppskrifter/{recipeId}/preferanse` | `{ "karakter": 8, "skjul": false }` | Save the current user's rating for a recipe |

Expected response from the existing endpoint:

```json
{
  "message": "Oppskriftpreferanse lagret.",
  "karakter": 8,
  "skjul": false,
  "kommentar": null
}
```

Rating mapping:

| UI stars | Backend `karakter` |
| -------- | ------------------ |
| 1 | 2 |
| 2 | 4 |
| 3 | 6 |
| 4 | 8 |
| 5 | 10 |

When rendering stored values back to the five-star UI, map `2 -> 1`, `4 -> 2`, `6 -> 3`, `8 -> 4`, and `10 -> 5`. If older data contains odd values, display the nearest sensible half-up star count only if the UI supports that clearly; otherwise round to the nearest whole star for display while preserving the stored value until the user saves.

### Implementation guidance

- Keep the rating control row-scoped. A pending save for one cookbook row should not disable search, filtering, sorting, or re-planning for other rows.
- Use lucide `Star` icons if using icons, but pair them with visible text and accessible labels.
- Prefer `aria-pressed` buttons or a labelled radiogroup-style control. Each option must be keyboard reachable and understandable.
- Keep the selected state visible with icon fill plus text or badge/label, not color alone.
- Use localized Norwegian UI copy consistent with the current route, unless the app's i18n story has already introduced translation helpers by implementation time.
- Keep desktop as the centered mobile app shell. Do not turn Cookbook into a dashboard.
- Do not add new shadcn primitives unless needed. If needed, install them through `pnpm dlx shadcn@latest add ...`.

### Previous story intelligence

Story 5.1 created the cookbook read model and UI surface this story extends:

- Cookbook history is derived; there is no cookbook table.
- Rows group by recipe plus meal type and expose `currentUserRating`.
- `ratingThenRecent` sort already prioritizes the current user's rating, then `lastCookedAt`, then recipe name.
- Shopping completion invalidates `["cookbook"]`, so the rating mutation should use the same prefix discipline.
- The Book route already reuses `DetailSheet` and `AddToPlanPanel` for re-planning. Do not create a second planning form while adding ratings.
- Manual smoke checks from 5.1 may still be pending; if cookbook data is unavailable locally, verify the rating flow against seeded or manually prepared cooked history.

Earlier Epic learnings still apply:

- Household authorization remains server-side only.
- Add-to-plan uses Monday `YYYY-MM-DD` week semantics and existing conflict handling.
- Swipe-only interactions require alternatives, but this rating flow should be direct tap/click/keyboard rather than swipe.

### Git intelligence

Current branch at story creation time is `feature/frontend-rebuild`, matching the project rule.

Recent relevant commits:

- `299ec37 feat(shopping): complete shopping trip and archive list`
- `59da867 feat(shopping): purchase, restore, and archive shopping rows`
- `d3f7986 feat(shopping): active shopping list with manual items and editing`
- `268c225 feat(shopping): confirm suggestions and link to planned meals`
- `826398a feat(shopping): generate deduplicated suggestions from weekly plan`

The working tree already contains Story 5.1 cookbook files and sprint-status edits. Treat them as current project state and do not revert them.

### Latest technical information

Context7 was used for current TanStack Query guidance. For React Query v5, mutation `onSuccess` can call `queryClient.invalidateQueries({ queryKey })`. Multiple invalidations can be awaited with `Promise.all`, and awaiting them keeps the mutation pending until related refetch/invalidation work is complete.

No new runtime library should be needed for Story 5.2. If implementation needs fresh docs for React, Base UI, React Router, ASP.NET Core, EF Core, shadcn, or another library/API, run Context7 before relying on memory.

### Testing standards summary

There is no broad established automated test suite for this flow yet. Keep verification focused on the rating write, current-user independence, query invalidation, and accessibility.

Minimum verification:

- Frontend typecheck catches route, hook, and DTO issues.
- Root build confirms backend-served SPA output still compiles if frontend code changes.
- Backend build/compile runs if backend code changes.
- Manual/API smoke proves ratings are stored in `Skjuloppskrift` per user and recipe.
- Manual UI smoke proves rating controls remain usable at 360px and desktop-centered widths.
- Manual accessibility smoke proves keyboard users can understand and change the rating.

## References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-5.2]
- [Source: _bmad-output/planning-artifacts/prd.md#Cookbook-&-Ratings]
- [Source: _bmad-output/planning-artifacts/architecture.md#Core-Architectural-Decisions]
- [Source: _bmad-output/planning-artifacts/architecture.md#API-&-Communication-Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure-&-Boundaries]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Shopping-Trip-to-Cookbook-Flow]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component-Strategy]
- [Source: _bmad-output/project-context.md]
- [Source: _bmad-output/implementation-artifacts/5-1-cookbook-history-search-sorting-and-re-planning.md]
- [Source: backend/Controllers/CookbookController.cs]
- [Source: backend/Controllers/OppskrifterController.cs]
- [Source: backend/DTOs/CookbookDtos.cs]
- [Source: backend/Models/Skjuloppskrift.cs]
- [Source: backend/Data/AppDbContext.cs]
- [Source: frontend/app/features/cookbook/types.ts]
- [Source: frontend/app/features/cookbook/use-cookbook-history.ts]
- [Source: frontend/app/routes/app/book.tsx]
- [Source: frontend/app/lib/api-fetch.ts]
- [Source: frontend/app/components/ui/button.tsx]
- [Source: TanStack Query docs via Context7, /tanstack/query, invalidations from mutations]

## Story Completion Status

Ultimate context engine analysis completed - comprehensive developer guide created.

## Dev Agent Record

### Agent Model Used

Composer (agentic)

### Debug Log References

### Completion Notes List

- Reused `PUT /api/oppskrifter/{id}/preferanse` with `{ karakter: 2|4|6|8|10, skjul: false }` (no backend changes).
- Added `use-save-cookbook-rating.ts` with TanStack Query mutation; `onSuccess` awaits `invalidateQueries` for `["cookbook"]`, `["recipe", id]`, and `["recipes"]`.
- Book route: per-row accessible fieldset + text state (`Din vurdering: N av 5` / `Ikke vurdert ennå`), five `aria-pressed` buttons with recipe-scoped labels, row-scoped `disabled` while pending, Sonner toasts for success/error (`ApiError.message` when available).
- Verified: `npm run typecheck --prefix frontend` and root `npm run build` pass.

### File List

- `frontend/app/features/cookbook/use-save-cookbook-rating.ts` (new)
- `frontend/app/routes/app/book.tsx`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/5-2-per-user-recipe-ratings.md`
