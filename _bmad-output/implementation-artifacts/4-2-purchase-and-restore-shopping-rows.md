# Story 4.2: Purchase and Restore Shopping Rows

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a shopper,
I want to mark rows as purchased and restore mistakes,
so that the active list stays focused while shopping remains reversible.

## Acceptance Criteria

1. **Active rows can be marked purchased**
   - **Given** an active shopping row is visible
   - **When** the user swipes or uses the tap/menu alternative to mark it purchased
   - **Then** the row leaves the active list
   - **And** purchased status is stored with purchase metadata.

2. **Swipe behavior reuses the shared wrapper**
   - **Given** swipe behavior is available
   - **When** rows render
   - **Then** they use the shared `SwipeActionRow` wrapper
   - **And** the same gesture vocabulary is reused consistently.

3. **Purchased rows are shown separately**
   - **Given** rows have been purchased or hidden
   - **When** the user opens the hidden/purchased view
   - **Then** those rows are shown separately from active rows
   - **And** the active list remains focused on remaining items.

4. **Purchased rows can be restored**
   - **Given** a purchased or hidden row is visible
   - **When** the user restores it
   - **Then** it returns to the active shopping list
   - **And** purchase or hidden state is cleared as appropriate.

## Tasks / Subtasks

- [ ] **T1: Extend the backend shopping contract for purchased rows** (AC: 1, 3, 4)
  - [ ] Keep `GET /api/handleliste` returning only active rows where `PurchasedAt == null`; do not break the Story 4.1 active-list contract or its `forslag` payload.
  - [ ] Add a household-scoped purchased/hidden read endpoint, preferably `GET /api/handleliste/purchased`, returning the same row DTO shape under `varer`.
  - [ ] Treat the current v1 hidden state as `PurchasedAt != null`; do not add a separate hidden table/column unless implementation discovers a real existing schema hook.
  - [ ] Include purchased rows created manually and from planned meals.
  - [ ] Preserve `Kilde`, `PlanlagtMaaltidId`, `PlanlagteMaaltidLinker`, creator `UserId`, item/unit fields, and timestamps when moving rows between active and purchased states.

- [ ] **T2: Add purchase and restore mutations** (AC: 1, 4)
  - [ ] Add a household-scoped endpoint to mark a row purchased, e.g. `POST /api/handleliste/{id}/purchase`.
  - [ ] Add a household-scoped endpoint to restore a row, e.g. `POST /api/handleliste/{id}/restore`.
  - [ ] Validate route ids before casting from `long` to `ulong`.
  - [ ] Purchase sets `PurchasedAt = DateTime.UtcNow` only when currently null; if already purchased, return a successful idempotent response with no destructive change.
  - [ ] Restore clears `PurchasedAt`; if already active, return a successful idempotent response.
  - [ ] Do not overwrite `UserId` when a different household member purchases or restores a row; `UserId` remains row creator/owner attribution in the current schema.
  - [ ] Return user-facing backend errors as `{ message = "..." }`.
  - [ ] Do not implement purchase completion, archiving, inventory/stock changes, or cookbook graduation in this story.

- [ ] **T3: Add frontend shopping types and hooks** (AC: 1, 3, 4)
  - [ ] Extend `frontend/app/features/shopping/types.ts` only as needed for purchased-list and mutation responses.
  - [ ] Add a purchased rows query hook, using a stable query key such as `["shopping-list", "purchased"]`.
  - [ ] Add `usePurchaseShoppingItem` and `useRestoreShoppingItem` mutations using `apiFetch`; do not call `fetch` directly.
  - [ ] On purchase/restore success, invalidate `["shopping-list"]` and `["shopping-list", "purchased"]`.
  - [ ] Keep Story 4.1 create/update hooks and Epic 3 suggestion hooks intact.

- [ ] **T4: Update the Shop route for active purchase actions** (AC: 1, 2)
  - [ ] Wrap active rows in `SwipeActionRow`; use a consistent gesture direction for progress/purchase actions.
  - [ ] Keep the fallback tap button visible and keyboard reachable with an explicit aria label.
  - [ ] While a row purchase mutation is pending, disable only that row's purchase/edit actions.
  - [ ] When purchase succeeds, show concise toast feedback and let query invalidation remove the row from the active list.
  - [ ] Keep quantity/unit, item name, source label, and member attribution visible on active rows.
  - [ ] Preserve row stability and wrapping at 360px; long item names must not overlap edit or purchase controls.

- [ ] **T5: Add the hidden/purchased view and restore UI** (AC: 3, 4)
  - [ ] Add an in-route view switch, segmented control, tab, or compact toggle for Active vs Purchased/hidden rows; keep `/app/shop` as the route.
  - [ ] Show purchased rows separately with quantity/unit, item name, source label, member attribution, and a non-color-only purchased status/timestamp where available.
  - [ ] Use `SwipeActionRow` for restore if swipe is offered, and always provide a tap fallback.
  - [ ] Restore success should show toast feedback and move the row back to active through query invalidation.
  - [ ] Purchased rows should not open the edit sheet until restored; keep the data model simple and avoid editing hidden state directly.
  - [ ] Empty purchased view should explain that purchased items will appear there after shopping, without implying archive/completion has happened.

- [ ] **T6: Guard the boundary with Story 4.3** (AC: 1, 3, 4)
  - [ ] Do not add an archive flag, completed-trip model, cookbook endpoint, inventory deduction, or purchase-complete confirmation sheet here.
  - [ ] Do not delete rows to simulate purchase. Purchased rows must remain restorable and available for Story 4.3 completion.
  - [ ] Do not create a cookbook table.
  - [ ] Do not change generated-suggestion confirmation behavior unless it is required to keep the active/purchased split coherent.

- [ ] **T7: Verify the story** (AC: 1, 2, 3, 4)
  - [ ] Run `dotnet build backend/backend.csproj`.
  - [ ] Run `npm run typecheck --prefix frontend`.
  - [ ] Run `npm run build` because this changes frontend source and backend-served SPA output.
  - [ ] Manual/API smoke: mark a manual active row purchased, confirm `GET /api/handleliste` excludes it and the purchased endpoint includes it.
  - [ ] Manual/API smoke: restore that row and confirm it returns to the active list.
  - [ ] Manual/API smoke: mark a recipe-derived row purchased and confirm `kilde`, `planlagtMaaltidId`, and planned-meal link behavior remain intact.
  - [ ] Manual/API smoke: after marking a recipe-derived row purchased, trying to delete its planned meal should still return the existing 409 protection.
  - [ ] Manual UI smoke at 360px and desktop-centered width: active rows, purchased view, swipe fallback buttons, long names, pending states, and bottom nav do not overlap.

## Dev Notes

### What this story is and is not

This story makes shopping reversible while keeping the active list focused. Purchased rows leave the active list but stay reachable in a separate purchased/hidden view, where users can restore mistakes.

This story is not purchase completion. Purchased rows must remain in `Handleliste` for Story 4.3 to archive them and derive cookbook history. Do not implement trip completion, archiving, cookbook history, inventory consumption, or new pantry behavior here.

### Current state to preserve

Backend:

- `backend/Controllers/HandlelisteController.cs` already has `[Authorize]`, household-scoped `GET /api/handleliste`, manual create/update/delete, generated suggestion read, and suggestion confirmation.
- Current `GET /api/handleliste` filters active rows with `PurchasedAt == null` and returns `ShoppingListGetResponse { Varer, Forslag }`.
- `backend/DTOs/ShoppingListDtos.cs` has `ActiveShoppingListRowDto`, `ShoppingListGetResponse`, create/update request DTOs, and generated suggestion DTOs.
- `backend/Models/HandlelisteRad.cs` already has `PlanlagtMaaltidId`, `PurchasedAt`, `Kilde`, and `PlanlagteMaaltidLinker`.
- `backend/Models/HandlelistePlanlagtMaaltidLink.cs` and `backend/Data/AppDbContext.cs` map the many-to-many provenance table for generated rows.
- `backend/Controllers/PlanlagteMaaltiderController.cs` already protects deletion when a planned meal has purchased linked shopping rows. Preserve that protection.
- `DELETE /api/handleliste/{id}` physically removes a row today. Do not use it for purchase or restore.

Frontend:

- `frontend/app/routes/app/shop.tsx` currently owns the active list UI, add/edit sheet, lookup loading, and row display.
- `frontend/app/features/shopping/use-shopping-list.ts` uses query key `["shopping-list"]`.
- `frontend/app/features/shopping/use-create-shopping-item.ts` and `use-update-shopping-item.ts` invalidate `["shopping-list"]` on success.
- `frontend/app/components/SwipeActionRow.tsx` already wraps `react-swipeable-list` and provides a button fallback.
- `frontend/app/root.tsx` imports `react-swipeable-list/dist/styles.css` once at app level. Do not re-import the stylesheet in the route.
- `frontend/app/components/detail-sheet.tsx` is still the shared sheet wrapper for add/edit; no new route is needed for purchased rows.

### Suggested API contract

Keep active list compatibility and add narrow endpoints:

| Method | Path | Purpose |
| ------ | ---- | ------- |
| `GET` | `/api/handleliste` | Active household rows plus existing stock suggestions |
| `GET` | `/api/handleliste/purchased` | Purchased/hidden household rows only |
| `POST` | `/api/handleliste/{id}/purchase` | Mark a row purchased by setting `PurchasedAt` |
| `POST` | `/api/handleliste/{id}/restore` | Restore a row by clearing `PurchasedAt` |

Recommended mutation response:

```json
{
  "message": "Handleliste oppdatert.",
  "id": 42,
  "purchasedAt": "2026-04-30T12:00:00Z"
}
```

For restore, `purchasedAt` should be `null`.

### Backend implementation guardrails

- Resolve household membership from `Medlemmer` on the server side; never accept household id from the client.
- Query by household member IDs for both active and purchased rows.
- Keep row DTO field names consistent with ASP.NET camelCase JSON consumed by the frontend.
- Mark purchase/restore idempotent so retries do not corrupt state.
- Use `DateTime.UtcNow` for purchase metadata.
- Do not change row creator attribution. The current schema has no `purchasedByUserId`, so do not overload `UserId` for purchaser.
- If implementation decides purchaser attribution is mandatory, add it deliberately through SQL migration, model, DTO, and UI labels; do not sneak it into existing fields.
- Preserve generated-row provenance so Story 4.3 can derive cookbook history later.
- Keep route ids guarded with `if (id < 1) return BadRequest(...)` before `(ulong)id`.

### Frontend implementation guardrails

- Use `apiFetch` for all new HTTP calls.
- Use TanStack Query hooks instead of local ad hoc fetch state.
- Use `["shopping-list"]` for active rows and `["shopping-list", "purchased"]` for purchased rows.
- Current TanStack Query v5 guidance from Context7: use `useQueryClient()` and call `queryClient.invalidateQueries({ queryKey })` in mutation `onSuccess`; awaiting invalidation keeps mutation pending until refresh work completes. [Source: TanStack Query docs, invalidations from mutations]
- Keep the active and purchased views in `/app/shop`; do not add a separate route.
- Keep purchase and restore available by tap/click and keyboard, not swipe only.
- Non-color-only status labels are required: use text such as "Purchased" / "Restored" or Norwegian product labels, plus icon/color if useful.
- Use lucide-react icons for icon buttons if icons are added.
- Keep visible text outcome-oriented and compact. The app currently uses Norwegian labels on product screens.

### UX requirements

- Active shopping rows should stay dense, tappable, and one-thumb friendly.
- Purchased rows should leave the active list immediately after mutation success/refetch.
- The purchased/hidden view should reduce anxiety about mistakes: rows are visible, restorable, and clearly separate from active rows.
- Swipe direction and fallback vocabulary should match the existing `SwipeActionRow` behavior from the Plan ingredient exclusion UI.
- Status changes such as purchased/restored must not rely on color alone.
- Loading should be localized to the affected list or row; the app shell stays visible.
- Desktop remains the centered mobile app shell, not a dashboard.

### Previous story intelligence

Story 4.1 established the active shopping-list surface this story extends:

- Active rows come from `GET /api/handleliste` where `PurchasedAt == null`.
- `ShoppingListGetResponse.varer` is the frontend source for active rows.
- Manual rows use `Kilde = "manual"` and generated rows use `Kilde = "plannedMeal"`.
- Editing rows must preserve source metadata and planned-meal links.
- The Shop route already has add/edit sheet state, lookup hooks, active-row display, and empty/error/loading states.
- Current working tree has uncommitted 4.1 implementation files. Treat those as current project state; do not revert or rewrite them while implementing 4.2.

Earlier Epic 3 shopping-generation lessons still matter:

- Confirmed suggestions insert `Handleliste` rows with planned-meal provenance.
- Aggregated recipe-derived rows store all source planned meals in `HandlelistePlanlagteMaaltider`.
- Suggestion confirmation invalidates `["shopping-list"]`.
- Duplicate prevention currently checks existing household rows. Do not loosen this casually; purchased rows are still pending completion until Story 4.3 archives them.

### Git intelligence

Recent relevant commits:

- `268c225 feat(shopping): confirm suggestions and link to planned meals`
- `826398a feat(shopping): generate deduplicated suggestions from weekly plan`
- `0a21e29 feat(planning): per-meal ingredient exclusion and meal removal`
- `e4920f7 feat(planning): add weekly meal planning feature`
- `07207c4 Add branching rule: stay on feature/frontend-rebuild`

Actionable patterns:

- Extend existing controllers/DTOs before adding new backend layers.
- Keep frontend feature code under `frontend/app/features/shopping`.
- Use `apiFetch`, TanStack Query hooks, and targeted invalidation.
- Keep swipe behavior behind `SwipeActionRow`.
- Verify planned-meal deletion protection whenever purchased recipe-derived rows are involved.

### Latest technical information

Context7 was used for current TanStack Query documentation. Use the v5 mutation invalidation pattern already present in this codebase: `useQueryClient()`, `useMutation`, and `queryClient.invalidateQueries({ queryKey })` in `onSuccess`.

No new runtime library should be needed for this story. If implementation needs fresh docs for React Hook Form, Zod, Base UI/shadcn, ASP.NET Core, EF Core, or `react-swipeable-list`, run Context7 before relying on memory.

### Testing standards summary

There is no broad established automated test suite for this flow yet. Keep verification focused on the purchase/restore state transition and provenance preservation.

Minimum verification:

- Backend build catches controller/DTO/model errors.
- Frontend typecheck catches route, hook, and DTO errors.
- Root build confirms the backend-served SPA still compiles.
- Manual API/UI smoke proves active rows move to purchased, purchased rows restore to active, and generated-row metadata survives.
- Manual UI smoke covers mobile width, desktop-centered shell, swipe fallback buttons, row pending states, and long labels.

## References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-4.2]
- [Source: _bmad-output/planning-artifacts/prd.md#Shopping-List-Generation-&-Shopping]
- [Source: _bmad-output/planning-artifacts/prd.md#Accessibility]
- [Source: _bmad-output/planning-artifacts/architecture.md#API-&-Communication-Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure-&-Boundaries]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Shopping-Trip-to-Cookbook-Flow]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#List-and-Row-Patterns]
- [Source: _bmad-output/implementation-artifacts/4-1-active-shopping-list-manual-items-and-editing.md]
- [Source: backend/Controllers/HandlelisteController.cs]
- [Source: backend/Controllers/PlanlagteMaaltiderController.cs]
- [Source: backend/DTOs/ShoppingListDtos.cs]
- [Source: backend/Models/HandlelisteRad.cs]
- [Source: backend/Models/HandlelistePlanlagtMaaltidLink.cs]
- [Source: backend/Data/AppDbContext.cs]
- [Source: database/schema.sql]
- [Source: frontend/app/routes/app/shop.tsx]
- [Source: frontend/app/features/shopping/types.ts]
- [Source: frontend/app/features/shopping/use-shopping-list.ts]
- [Source: frontend/app/lib/api-fetch.ts]
- [Source: frontend/app/components/SwipeActionRow.tsx]
- [Source: frontend/app/components/detail-sheet.tsx]
- [Source: frontend/app/root.tsx]
- [Source: https://github.com/tanstack/query/blob/main/docs/framework/react/guides/invalidations-from-mutations.md]

## Story Completion Status

Ultimate context engine analysis completed - comprehensive developer guide created.

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
