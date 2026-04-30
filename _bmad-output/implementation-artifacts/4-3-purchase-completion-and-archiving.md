# Story 4.3: Purchase Completion and Archiving

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a household shopper,
I want to complete a shopping trip intentionally,
so that purchased rows are archived and the household routine can continue into cookbook history.

## Acceptance Criteria

1. **Completion requires explicit confirmation**
   - **Given** the active list has purchased rows
   - **When** the user taps "Purchase complete"
   - **Then** a confirmation sheet summarizes archived rows, cookbook meals, and remaining rows
   - **And** no archive action happens until the user confirms.

2. **Purchased rows are archived without clearing active rows**
   - **Given** the user confirms purchase completion
   - **When** the backend processes the request
   - **Then** purchased rows are archived
   - **And** remaining active rows stay available for later shopping.

3. **Completion is idempotent**
   - **Given** purchase completion is repeated or retried
   - **When** the backend receives the request
   - **Then** the operation remains idempotent
   - **And** it does not duplicate cookbook history.

4. **Successful completion refreshes affected app state**
   - **Given** completion succeeds
   - **When** the mutation finishes
   - **Then** the user sees success feedback
   - **And** shopping and cookbook-related query keys are invalidated.

## Tasks / Subtasks

- [ ] **T1: Add persistent archive state to shopping rows** (AC: 2, 3)
  - [ ] Add a nullable `archived_at` column to `Handleliste` through a SQL migration in `database/`; do not use EF migrations.
  - [ ] Update `database/schema.sql` so new installs include `archived_at DATETIME NULL`.
  - [ ] Add `ArchivedAt` to `backend/Models/HandlelisteRad.cs` mapped to `archived_at`.
  - [ ] Keep existing `PurchasedAt` semantics intact: purchased rows remain the prerequisite for archiving and cookbook derivation.
  - [ ] Do not delete shopping rows to archive them; archived recipe-derived rows must remain queryable for Story 5.1 cookbook history.

- [ ] **T2: Keep active and restorable purchased queries scoped correctly** (AC: 2)
  - [ ] Keep `GET /api/handleliste` returning only active rows where `PurchasedAt == null`.
  - [ ] Update `GET /api/handleliste/purchased` to return only purchased, not-yet-archived rows: `PurchasedAt != null && ArchivedAt == null`.
  - [ ] Preserve the existing DTO shape under `varer`; add `archivedAt` only if the frontend needs it for completion feedback.
  - [ ] Update shopping-row duplicate checks so archived rows count as history, not current list occupancy.
  - [ ] In manual create, suggestion generation, and suggestion confirmation, treat only unarchived rows (`ArchivedAt == null`) as already on the current shopping list.
  - [ ] Preserve household scoping through `Medlemmer`; never accept household ids from the client.

- [ ] **T3: Add preview and completion backend endpoints** (AC: 1, 2, 3)
  - [ ] Add a preview endpoint, preferably `GET /api/handleliste/completion-preview`, that returns counts for `archiveRowCount`, `cookbookMealCount`, and `remainingActiveRowCount`.
  - [ ] Compute `archiveRowCount` from household rows where `PurchasedAt != null && ArchivedAt == null`.
  - [ ] Compute `cookbookMealCount` from distinct planned-meal ids linked to those purchased recipe-derived rows, using both `Handleliste.PlanlagtMaaltidId` and `HandlelistePlanlagteMaaltider`.
  - [ ] Add a completion endpoint, preferably `POST /api/handleliste/complete`, that sets `ArchivedAt = DateTime.UtcNow` only for household rows where `PurchasedAt != null && ArchivedAt == null`.
  - [ ] Return a response with the same summary fields after completion.
  - [ ] Make repeat calls successful and harmless: when no unarchived purchased rows remain, return zero newly archived rows instead of creating duplicate history or failing.
  - [ ] Return user-facing errors as `{ message = "..." }`.

- [ ] **T4: Preserve cookbook derivation boundary for Story 5.1** (AC: 2, 3)
  - [ ] Do not create a cookbook table.
  - [ ] Do not implement cookbook search, sorting, re-planning, or rating UI in this story.
  - [ ] Leave `frontend/app/routes/app/book.tsx` as a placeholder unless a minimal invalidation target is needed.
  - [ ] Ensure archived purchased recipe-derived rows keep `Kilde`, `PlanlagtMaaltidId`, and `HandlelistePlanlagteMaaltider` provenance.
  - [ ] Keep `PlanlagteMaaltiderController.DeletePlannedMeal` protection working for purchased/archived recipe-derived rows.

- [ ] **T5: Add frontend completion types and hooks** (AC: 1, 4)
  - [ ] Extend `frontend/app/features/shopping/types.ts` with preview/completion response types.
  - [ ] Add a preview query hook under `frontend/app/features/shopping`, using a stable key such as `["shopping-list", "completion-preview"]` and enabling it only while the confirmation sheet is open.
  - [ ] Add a completion mutation hook under `frontend/app/features/shopping` using `apiFetch`; do not call `fetch` directly.
  - [ ] On completion success, invalidate `["shopping-list"]`, `["shopping-list", "purchased"]`, `["shopping-list", "completion-preview"]`, and the future cookbook key `["cookbook"]`.
  - [ ] Use TanStack Query v5 `useQueryClient()` plus `queryClient.invalidateQueries({ queryKey })`; use `Promise.all` when invalidating multiple keys.

- [ ] **T6: Add the purchase-complete confirmation UI in `/app/shop`** (AC: 1, 4)
  - [ ] Keep the flow in `frontend/app/routes/app/shop.tsx`; do not add a new route.
  - [ ] Add a visible "Purchase complete" action when purchased rows exist or from the purchased view, and disable it when no unarchived purchased rows are available.
  - [ ] Open a `DetailSheet` confirmation sheet before mutation.
  - [ ] Show the preview summary: rows to archive, cookbook meals unlocked for later history, and active rows that will remain on the list.
  - [ ] Make the confirm button explicit, pending-safe, and keyboard reachable.
  - [ ] Show concise success feedback after completion and let query invalidation move archived rows out of the purchased view.
  - [ ] Keep product screen copy Norwegian and compact.

- [ ] **T7: Verify the story** (AC: 1, 2, 3, 4)
  - [ ] Run `dotnet build backend/backend.csproj` or the established alternate output build if the normal backend executable is locked.
  - [ ] Run `npm run typecheck --prefix frontend`.
  - [ ] Run `npm run build` because this changes frontend source, backend code, database schema, and the backend-served SPA output.
  - [ ] Manual/API smoke: purchase one manual row, open preview, confirm counts, complete, and confirm the purchased endpoint no longer returns it.
  - [ ] Manual/API smoke: purchase one recipe-derived row linked to at least one planned meal, complete, and confirm its provenance remains in the database with `archived_at` set.
  - [ ] Manual/API smoke: call completion twice and confirm the second response does not archive additional rows or duplicate cookbook-derived data.
  - [ ] Manual UI smoke at 360px and desktop-centered width: confirmation sheet content, pending state, disabled state, success toast, long labels, and bottom navigation do not overlap.

## Dev Notes

### What this story is and is not

This story turns the purchased/restorable holding area from Story 4.2 into a deliberate completion moment. Purchased rows should be archived only after explicit confirmation. Archiving means marking rows as completed in-place, not deleting them.

This story is not the full cookbook feature. It must preserve enough durable data for Story 5.1 to expose cookbook history as a derived read model, but search, sorting, re-planning, and rating stay in Epic 5.

### Current state to preserve

Backend:

- `backend/Controllers/HandlelisteController.cs` already has `[Authorize]`, household-scoped active list, purchased-list, purchase, restore, suggestion generation, suggestion confirmation, manual create/update/delete, and helper methods for current user and household membership.
- `GET /api/handleliste` returns active rows where `PurchasedAt == null`.
- `GET /api/handleliste/purchased` returns purchased rows where `PurchasedAt != null`.
- `POST /api/handleliste/{id}/purchase` sets `PurchasedAt` idempotently.
- `POST /api/handleliste/{id}/restore` clears `PurchasedAt` idempotently and prevents restoring a duplicate active row.
- `backend/DTOs/ShoppingListDtos.cs` contains the current row, purchased-list, purchase/restore, generated suggestion, and confirmation DTOs.
- `backend/Models/HandlelisteRad.cs` contains `PlanlagtMaaltidId`, `PurchasedAt`, `Kilde`, and `PlanlagteMaaltidLinker`.
- `backend/Models/HandlelistePlanlagtMaaltidLink.cs` maps the aggregated suggestion provenance table.
- `backend/Data/AppDbContext.cs` maps `Handleliste`, `PlanlagteMaaltider`, and `HandlelistePlanlagteMaaltider`.
- `backend/Controllers/PlanlagteMaaltiderController.cs` blocks deletion when a planned meal has purchased linked shopping rows. Archived rows must not bypass this protection.

Frontend:

- `frontend/app/routes/app/shop.tsx` owns the active/purchased tabs, add/edit sheet, active-row purchase action, purchased-row restore action, localized empty/error/loading states, and toast feedback.
- `frontend/app/features/shopping/use-shopping-list.ts` uses query key `["shopping-list"]`.
- `frontend/app/features/shopping/use-purchased-shopping-list.ts` uses query key `["shopping-list", "purchased"]`.
- `frontend/app/features/shopping/use-purchase-shopping-item.ts` and `use-restore-shopping-item.ts` already invalidate active and purchased shopping queries on success.
- `frontend/app/components/SwipeActionRow.tsx` remains for row actions only; purchase completion should use an explicit button plus confirmation sheet, not a swipe gesture.
- `frontend/app/components/detail-sheet.tsx` is the existing sheet wrapper for focused decisions.
- `frontend/app/routes/app/book.tsx` is currently a placeholder saying the cookbook arrives in Story 5.1.

### Suggested API contract

Add narrow endpoints to the existing shopping controller:

| Method | Path | Purpose |
| ------ | ---- | ------- |
| `GET` | `/api/handleliste/completion-preview` | Summarize the current household's unarchived purchased rows before confirmation |
| `POST` | `/api/handleliste/complete` | Archive the current household's unarchived purchased rows |

Recommended response shape for both endpoints:

```json
{
  "archiveRowCount": 3,
  "cookbookMealCount": 2,
  "remainingActiveRowCount": 4,
  "archivedAt": "2026-04-30T12:00:00Z"
}
```

For preview, `archivedAt` should be `null`. For a repeat completion with nothing new to archive, return counts based on the operation, not historical totals, so `archiveRowCount` should be `0`.

### Backend implementation guardrails

- Resolve household membership from `Medlemmer` on the server side.
- Query shopping rows by household member IDs, matching existing `HandlelisteController` patterns.
- Add `ArchivedAt` rather than overloading `PurchasedAt`; `PurchasedAt` means the row was checked off, `ArchivedAt` means it was included in a completed trip.
- Archive only rows with `PurchasedAt != null && ArchivedAt == null`.
- Use one database transaction for completion so preview counts and archived rows cannot drift during the write.
- Prefer `DateTime.UtcNow` once per completion operation and apply the same timestamp to all archived rows.
- Include both direct `PlanlagtMaaltidId` and many-to-many `HandlelistePlanlagteMaaltider` links when counting qualifying cookbook meals.
- Count distinct planned meals, not shopping rows, for `cookbookMealCount`.
- Manual rows may be archived but do not count as cookbook meals.
- Do not create trip, archive, cookbook, inventory, pantry, or analytics tables unless the implementation discovers a hard blocker and documents it before expanding scope.
- Existing duplicate prevention in generation/create currently checks household shopping rows broadly. After `ArchivedAt` exists, current-list duplicate checks must ignore archived rows so the household can shop for the same ingredient in a later trip. Keep duplicate checks for active and unarchived purchased rows so repeating generation before completion still cannot add duplicates.

### Frontend implementation guardrails

- Use `apiFetch` for all new HTTP calls.
- Use TanStack Query hooks instead of local ad hoc fetch state.
- Keep the completion action in `/app/shop`; do not create `/app/shop/complete`.
- Enable the preview query only when the sheet opens so the summary reflects the latest purchased/active state.
- Disable the confirm button when preview shows `archiveRowCount === 0`.
- Keep row-level purchase/restore pending state from Story 4.2 intact.
- After completion succeeds, archived rows should disappear from the purchased tab through invalidation/refetch, not through manual local list surgery.
- Invalidate future `["cookbook"]` even though Story 5.1 will create the visible cookbook implementation.
- Current TanStack Query v5 guidance from Context7: invalidate related queries in mutation `onSuccess` with `queryClient.invalidateQueries({ queryKey })`; use `Promise.all` for multiple keys and await/return the promise so pending state can cover refresh work. [Source: TanStack Query docs, invalidations from mutations]

### UX requirements

- Purchase completion is a confirmation-sheet action because it changes shared/historical state.
- The sheet must summarize three outcomes before confirmation: rows archived, cookbook meals available for history, and active rows that remain.
- The action should feel like the end of a shopping routine, not a destructive cleanup.
- Do not rely on color alone for completed/archived states; include text labels and clear button states.
- Keep loading localized to the sheet/action and affected lists. The app shell and bottom navigation stay usable.
- Desktop remains the centered mobile app shell, not a dashboard.

### Previous story intelligence

Story 4.2 established the reversible purchased state this story consumes:

- Purchased rows are stored by setting `PurchasedAt`.
- Active list excludes purchased rows.
- Purchased rows remain visible and restorable until completion.
- The purchased tab uses `["shopping-list", "purchased"]`.
- Purchase/restore mutations invalidate active and purchased shopping-list query keys.
- `UserId` remains creator/member attribution; there is no purchaser field.
- Generated rows preserve `Kilde = "plannedMeal"`, `PlanlagtMaaltidId`, and all `HandlelistePlanlagteMaaltider` links.
- Review patched restore/add flows to guard against active duplicates and patched row pending state to track per-row ids.

Earlier Epic 3 and planning lessons still matter:

- Suggestion confirmation inserts generated rows with planned-meal provenance.
- Aggregated recipe-derived rows can link to multiple planned meals through `HandlelistePlanlagteMaaltider`.
- Planned-meal deletion must remain protected when purchased linked rows exist.
- Weekly plan keys use Monday `YYYY-MM-DD` strings, but this completion story should not require the user to pick a week.

### Git intelligence

Current branch is `feature/frontend-rebuild`, matching the project rule.

Recent relevant commits:

- `d3f7986 feat(shopping): active shopping list with manual items and editing`
- `268c225 feat(shopping): confirm suggestions and link to planned meals`
- `826398a feat(shopping): generate deduplicated suggestions from weekly plan`
- `0a21e29 feat(planning): per-meal ingredient exclusion and meal removal`
- `e4920f7 feat(planning): add weekly meal planning feature`

Current working tree already contains Story 4.2 changes. Treat them as project state; do not revert them while implementing 4.3.

### Latest technical information

Context7 was used for current TanStack Query documentation. Use the v5 mutation invalidation pattern already present in this codebase: `useQueryClient()`, `useMutation`, and `queryClient.invalidateQueries({ queryKey })` from `onSuccess`.

No new runtime library should be needed for this story. If implementation needs fresh docs for ASP.NET Core, EF Core, React Router, shadcn/base-ui, or another library, run Context7 before relying on memory.

### Testing standards summary

There is no broad established automated test suite for this flow yet. Keep verification focused on archive semantics, idempotency, provenance, and UI confirmation behavior.

Minimum verification:

- Backend build catches controller/DTO/model/schema mapping errors.
- Frontend typecheck catches route, hook, and DTO errors.
- Root build confirms the backend-served SPA still compiles.
- Manual API smoke proves only purchased, unarchived household rows get archived.
- Manual API smoke proves repeated completion is harmless.
- Manual DB/API smoke proves archived recipe-derived rows retain planned-meal provenance needed for cookbook history.
- Manual UI smoke covers mobile width, desktop-centered shell, confirmation sheet, pending state, disabled state, and localized success/error feedback.

## References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-4.3]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-5.1]
- [Source: _bmad-output/planning-artifacts/prd.md#MVP-Scope]
- [Source: _bmad-output/planning-artifacts/prd.md#Functional-Requirements]
- [Source: _bmad-output/planning-artifacts/architecture.md#Core-Architectural-Decisions]
- [Source: _bmad-output/planning-artifacts/architecture.md#API-&-Communication-Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure-&-Boundaries]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Shopping-Trip-to-Cookbook-Flow]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Feedback-and-Confirmation-Patterns]
- [Source: _bmad-output/project-context.md]
- [Source: _bmad-output/implementation-artifacts/4-2-purchase-and-restore-shopping-rows.md]
- [Source: backend/Controllers/HandlelisteController.cs]
- [Source: backend/Controllers/PlanlagteMaaltiderController.cs]
- [Source: backend/Controllers/OppskrifterController.cs]
- [Source: backend/DTOs/ShoppingListDtos.cs]
- [Source: backend/Models/HandlelisteRad.cs]
- [Source: backend/Models/HandlelistePlanlagtMaaltidLink.cs]
- [Source: backend/Data/AppDbContext.cs]
- [Source: database/schema.sql]
- [Source: database/v3_2_handleliste_kilde_planlagte_koblinger.sql]
- [Source: frontend/app/routes/app/shop.tsx]
- [Source: frontend/app/routes/app/book.tsx]
- [Source: frontend/app/features/shopping/types.ts]
- [Source: frontend/app/features/shopping/use-shopping-list.ts]
- [Source: frontend/app/features/shopping/use-purchased-shopping-list.ts]
- [Source: frontend/app/features/shopping/use-purchase-shopping-item.ts]
- [Source: frontend/app/features/shopping/use-restore-shopping-item.ts]
- [Source: frontend/app/lib/api-fetch.ts]
- [Source: frontend/app/components/detail-sheet.tsx]
- [Source: https://github.com/tanstack/query/blob/main/docs/framework/react/guides/invalidations-from-mutations.md]

## Story Completion Status

Ultimate context engine analysis completed - comprehensive developer guide created.

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
