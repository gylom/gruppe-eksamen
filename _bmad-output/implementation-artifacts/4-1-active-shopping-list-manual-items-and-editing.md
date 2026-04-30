# Story 4.1: Active Shopping List, Manual Items, and Editing

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a household member,
I want to view, add, and edit shopping rows,
so that recipe-generated and ad hoc grocery needs live in one shared list.

## Acceptance Criteria

1. **Active rows are visible and scan-friendly**
   - **Given** the user opens the Shop route
   - **When** active rows exist
   - **Then** rows show quantity/unit, item name, source label, and member attribution where useful
   - **And** the layout is dense, tappable, and one-thumb friendly.

2. **Manual rows can be added**
   - **Given** the user adds a manual shopping row
   - **When** they provide valid item data
   - **Then** the row appears on the active household list
   - **And** it is distinguishable from recipe-derived rows.

3. **Manual or active rows can be edited**
   - **Given** the user edits a manual or active shopping row
   - **When** they save valid row changes
   - **Then** the shopping list updates
   - **And** source metadata needed for cookbook generation is preserved where applicable.

4. **Empty list guides the next useful action**
   - **Given** the shopping list is empty
   - **When** the route renders
   - **Then** an empty state guides the user to plan meals or add a manual item.

## Tasks / Subtasks

- [ ] **T1: Make the backend active-list contract explicit** (AC: 1, 2, 3)
  - [ ] Extend `backend/DTOs/ShoppingListDtos.cs` with typed list-row DTOs instead of relying on anonymous `GET /api/handleliste` response shapes.
  - [ ] Include at least: `id`, `varetypeId`, `varetype`, `vareId`, `varenavn`, `kvantitet`, `maaleenhetId`, `maaleenhet`, `userId`, `brukernavn`, `kilde`, `planlagtMaaltidId`, `purchasedAt`, `opprettet`, and `endret`.
  - [ ] In `backend/Controllers/HandlelisteController.cs`, keep `GET /api/handleliste` household-scoped through `Medlemmer`.
  - [ ] Treat the active list as rows with `PurchasedAt == null`; do not build the purchased/hidden view in this story.
  - [ ] Preserve the existing minimum-stock `forslag` response in `GET /api/handleliste`; do not remove or repurpose it.
  - [ ] Return recipe-derived rows with `kilde = "plannedMeal"` and manual rows with `kilde = "manual"` so the frontend can show source labels.

- [ ] **T2: Preserve source metadata during create and edit** (AC: 2, 3)
  - [ ] Keep manual `POST /api/handleliste` setting `Kilde = "manual"`.
  - [ ] For `PUT /api/handleliste/{id}`, allow editing item, quantity, and unit without clearing `Kilde`, `PlanlagtMaaltidId`, or `HandlelistePlanlagteMaaltider`.
  - [ ] Fix or avoid the current nullable-field ambiguity in `UpdateShoppingListItemRequest`: omitted nullable fields are indistinguishable from explicit `null` today, so a partial update can accidentally clear `VareId`/`MaaleenhetId`. Use a full replacement payload from the frontend or adjust the DTO contract deliberately.
  - [ ] Do not allow edits to convert a recipe-derived row into a manual row or drop planned-meal provenance.
  - [ ] Keep backend errors user-facing as `{ message = "..." }`.

- [ ] **T3: Add frontend shopping list hooks and types** (AC: 1, 2, 3)
  - [ ] Extend `frontend/app/features/shopping/types.ts` with active shopping row, create request, update request, and lookup DTO types.
  - [ ] Add `useShoppingList` under `frontend/app/features/shopping` using `useQuery({ queryKey: ["shopping-list"] })`.
  - [ ] Add `useCreateShoppingItem` and `useUpdateShoppingItem` mutations using `apiFetch`; do not call `fetch` directly.
  - [ ] On create/update success, invalidate only `["shopping-list"]`.
  - [ ] Add lightweight lookup hooks for existing `GET /api/varetyper` and `GET /api/maaleenheter` if the add/edit sheet needs selectors.
  - [ ] Keep generation/confirmation hooks from Epic 3 intact.

- [ ] **T4: Build the Shop route active-list UI** (AC: 1, 4)
  - [ ] Replace the placeholder in `frontend/app/routes/app/shop.tsx`.
  - [ ] Show localized loading, error/retry, empty, and populated states without blocking the app shell.
  - [ ] Render active rows with quantity/unit first, then item name/type, then source label and member attribution.
  - [ ] Use non-color-only labels for source/status, e.g. "From plan" and "Manual".
  - [ ] Keep rows compact and stable on 360px mobile; text must wrap cleanly without overlapping actions.
  - [ ] Empty state should offer both "Plan meals" navigation and an "Add item" action.

- [ ] **T5: Build add/edit row sheet** (AC: 2, 3)
  - [ ] Use `DetailSheet` for add and edit flows; do not create a new route.
  - [ ] Use labelled controls with inline validation. Quantity may be nullable for reminder-style rows; invalid negative quantities should be rejected.
  - [ ] Use existing shadcn/base-ui primitives already in `frontend/app/components/ui`; if a new shadcn primitive is needed, install it with `pnpm dlx shadcn@latest add <component>`.
  - [ ] Use `react-hook-form` and `zod` if the form complexity warrants it; keep the implementation simple if controlled local state is clearer for this small form.
  - [ ] Save add/edit through the shopping mutations and show concise success/error feedback with `sonner`.
  - [ ] Preserve focus behavior and close behavior through `DetailSheet`.

- [ ] **T6: Guard scope for later Epic 4 stories** (AC: 1, 3)
  - [ ] Do not implement purchase marking, purchased/hidden restoration, or purchase completion here; Story 4.2 and 4.3 own those.
  - [ ] Do not add pantry management, aisle grouping, unit conversion, recipe creation, image upload, or multi-week shopping semantics.
  - [ ] Do not change generation confirmation from Epic 3 except where this story needs active-list display compatibility.

- [ ] **T7: Verify the story** (AC: 1, 2, 3, 4)
  - [ ] Run `dotnet build backend/backend.csproj`.
  - [ ] Run `npm run typecheck --prefix frontend`.
  - [ ] Run `npm run build` because this changes frontend source and backend-served SPA output.
  - [ ] Manual UI smoke at 360px and desktop-centered width: active rows, empty state, add sheet, edit sheet, long item names, and bottom nav do not overlap.
  - [ ] Manual/API smoke: confirm suggestions from Plan, open Shop, and verify recipe-derived rows display with source metadata.
  - [ ] Manual/API smoke: add a manual item and verify it appears as manual for all household members.
  - [ ] Manual/API smoke: edit a recipe-derived row and verify its `kilde` and planned-meal links remain intact.

## Dev Notes

### What this story is and is not

This story turns `/app/shop` from a placeholder into the active shared shopping-list screen. It exposes active household rows created manually or through Epic 3's suggestion confirmation, and it lets users add/edit list rows.

This story is not purchase behavior. It should prepare for `PurchasedAt` by showing only active rows, but it must not implement mark purchased, restore hidden/purchased rows, purchase completion, cookbook graduation, or archive behavior.

### Current state to preserve

Backend:

- `backend/Controllers/HandlelisteController.cs` already has `[Authorize]`, `GET /api/handleliste`, manual `POST/PUT/DELETE`, `POST /api/handleliste/generate-from-week`, and `POST /api/handleliste/confirm-suggestions`.
- `GET /api/handleliste` currently returns `{ varer, forslag }` using anonymous objects. It includes item/unit/member basics, but it does not expose `kilde`, `planlagtMaaltidId`, or `purchasedAt` yet.
- `GET /api/handleliste` also returns minimum-stock `forslag` from `Husholdningsinnstillinger` + `Varelager`. That is pre-existing inventory behavior; keep it.
- `CreateShoppingListItemRequest` supports `varetypeId`, optional `vareId`, optional `kvantitet`, and optional `maaleenhetId`.
- `UpdateShoppingListItemRequest` currently has nullable optional fields. Be careful: as implemented, omitted nullable fields can behave like explicit null and may clear data unless the frontend sends a full replacement payload or the API contract is corrected.
- `HandlelisteRad` now has `Kilde`, `PlanlagtMaaltidId`, `PurchasedAt`, and `PlanlagteMaaltidLinker`.
- `HandlelistePlanlagteMaaltider` is the authoritative planned-meal provenance table for aggregated recipe-derived rows. Do not delete these links while editing row display fields.
- `PlanlagteMaaltiderController.DeletePlannedMeal` already checks both direct `PlanlagtMaaltidId` and `HandlelistePlanlagteMaaltider` links when protecting purchased rows and cleaning up non-purchased generated rows.

Frontend:

- `frontend/app/routes/app/shop.tsx` is only a placeholder.
- `frontend/app/features/shopping/types.ts`, `use-shopping-suggestions.ts`, and `use-confirm-shopping-suggestions.ts` exist from Epic 3. Extend them; do not replace them.
- `frontend/app/routes/app/plan.tsx` already opens the suggestion review sheet and invalidates `["shopping-list"]` after confirmation.
- `frontend/app/components/detail-sheet.tsx` is the shared bottom-sheet wrapper. Use it for add/edit shopping rows.
- `frontend/app/components/SwipeActionRow.tsx` exists, but this story does not need swipe for purchase. Save swipe purchase/restore for Story 4.2.
- `frontend/app/lib/api-fetch.ts` owns token injection, JSON bodies, `{ message }` errors, 401 handling, auth clearing, and redirect to login. All frontend HTTP in this story must use it.

### Suggested API contract

Keep the existing endpoint path unless implementation discovers a hard conflict:

| Method | Path | Purpose |
| ------ | ---- | ------- |
| `GET` | `/api/handleliste` | Return active household rows and existing minimum-stock suggestions |
| `POST` | `/api/handleliste` | Add a manual row |
| `PUT` | `/api/handleliste/{id}` | Edit an existing household row |

Recommended active-row shape inside `varer`:

```json
{
  "id": 42,
  "varetypeId": 12,
  "varetype": "Pasta",
  "vareId": null,
  "varenavn": null,
  "kvantitet": 500,
  "maaleenhetId": 3,
  "maaleenhet": "g",
  "userId": 7,
  "brukernavn": "maren",
  "kilde": "plannedMeal",
  "planlagtMaaltidId": 21,
  "purchasedAt": null,
  "opprettet": "2026-04-30T12:00:00Z",
  "endret": "2026-04-30T12:00:00Z"
}
```

Frontend display should prefer `varenavn` when present, otherwise `varetype`. Source label should come from `kilde`, not from guessed fields.

### Frontend implementation guardrails

- Query key: `["shopping-list"]`.
- Mutations: `useCreateShoppingItem` and `useUpdateShoppingItem`.
- Current TanStack Query v5 guidance from Context7: use `useQueryClient()` and call `queryClient.invalidateQueries({ queryKey: ["shopping-list"] })` in mutation `onSuccess`; awaiting invalidation keeps mutation pending until refresh work completes. [Source: TanStack Query docs, invalidations from mutations]
- Loading states should reserve row space or use compact skeleton rows.
- Error state should offer retry and avoid raw backend wording where possible.
- Add/edit sheet primary action should be reachable at 360px and not be covered by bottom nav or safe-area padding.
- Use lucide-react icons for clear action buttons if icons are added.
- Keep visible text outcome-oriented: "Add item", "Save item", "Plan meals".

### Backend implementation guardrails

- All shopping rows must remain household-scoped server-side through `Medlemmer`; never accept household id from the client.
- Validate route ids before casting to `ulong`.
- Preserve user-facing errors as `{ message = "..." }`.
- Preserve existing Norwegian backend/domain naming.
- Do not introduce EF migrations; database changes, if any become necessary, use SQL files under `database/`.
- Prefer extending existing `HandlelisteController`/DTOs over adding a new service layer for this narrow story.
- If `GET /api/handleliste` filters active rows with `PurchasedAt == null`, make sure Story 4.2 can later add a separate purchased/hidden query without breaking this contract.

### UX requirements

- Shop is a top-level authenticated app destination in the existing bottom nav.
- Use a route for the list and sheets for focused add/edit decisions.
- Active rows should be dense, tappable, one-thumb friendly, and stable during loading/mutation.
- Shopping list row content: quantity/unit, item name/type, source label, member attribution where useful, edit affordance.
- Empty state should guide to the next useful action: add a manual item or plan meals.
- Status/source cannot rely on color alone.
- Forms need accessible labels and visible validation feedback.
- Desktop remains the centered mobile app shell; do not build a dashboard layout.

### Previous story intelligence

Story 3.2 established the source metadata this story must surface:

- Confirmed suggestions insert `Handleliste` rows with `Kilde = "plannedMeal"`.
- Aggregated recipe-derived rows store all source planned meals in `HandlelistePlanlagteMaaltider`.
- Confirmation invalidates `["shopping-list"]`, so the Shop route should refresh when it is mounted or active.
- Null-quantity rows are valid reminder rows and should display gracefully.
- Duplicate prevention still depends on active list keys `(varetypeId, maaleenhetId)`.

Important caution: the Story 3.2 artifact still lists review findings as unchecked, but the current working tree appears to include fixes for serializable confirmation, planned-meal deletion protection through the link table, and rerunnable migration structure. Verify those behaviors during implementation rather than assuming the story text is fully synchronized.

### Git intelligence

Recent relevant commits:

- `826398a feat(shopping): generate deduplicated suggestions from weekly plan`
- `0a21e29 feat(planning): per-meal ingredient exclusion and meal removal`
- `e4920f7 feat(planning): add weekly meal planning feature`
- `07207c4 Add branching rule: stay on feature/frontend-rebuild`
- `c0ec30e Refine household invites, recipe details, and onboarding UX`

Actionable patterns:

- Extend existing controllers/DTOs first.
- Keep frontend feature code under `frontend/app/features/*`.
- Use `apiFetch` and TanStack Query hooks for server state.
- Keep status updates and invalidation targeted.
- Build UI inside the existing mobile shell and `DetailSheet` pattern.

### Latest technical information

Context7 was used for TanStack Query current docs. Use the v5 pattern already present in the project: `useQuery` for `["shopping-list"]`, `useMutation` for create/update, and `queryClient.invalidateQueries({ queryKey: ["shopping-list"] })` on success.

No new runtime library is required for this story. If implementation needs fresh docs for React Hook Form, Zod, Base UI/shadcn, ASP.NET Core, or EF Core, run Context7 before relying on memory.

### Testing standards summary

There is no broad established automated test suite for this flow yet. Keep verification focused.

Minimum verification:

- Backend build catches DTO/controller/EF errors.
- Frontend typecheck catches DTO/hook/form errors.
- Root build confirms the backend-served SPA still compiles.
- Manual UI smoke covers mobile width, desktop-centered shell, loading/error/empty states, add/edit sheets, and long labels.
- Manual API/UI smoke proves household-scoped rows display, manual rows are distinguishable, and editing generated rows preserves source metadata.

## References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-4.1]
- [Source: _bmad-output/planning-artifacts/prd.md#Shopping-List-Generation-&-Shopping]
- [Source: _bmad-output/planning-artifacts/prd.md#Accessibility]
- [Source: _bmad-output/planning-artifacts/architecture.md#API-&-Communication-Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure-&-Boundaries]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Shopping-Trip-to-Cookbook-Flow]
- [Source: docs/ui-ux-screens.md#/app/shopping---Shopping-List]
- [Source: docs/frontend-architecture-decisions.md#Shopping-List-Flow]
- [Source: backend/Controllers/HandlelisteController.cs]
- [Source: backend/DTOs/ShoppingListDtos.cs]
- [Source: backend/Models/HandlelisteRad.cs]
- [Source: backend/Models/HandlelistePlanlagtMaaltidLink.cs]
- [Source: backend/Data/AppDbContext.cs]
- [Source: frontend/app/routes/app/shop.tsx]
- [Source: frontend/app/features/shopping/types.ts]
- [Source: frontend/app/lib/api-fetch.ts]
- [Source: frontend/app/components/detail-sheet.tsx]
- [Source: frontend/app/components/SwipeActionRow.tsx]
- [Source: https://github.com/tanstack/query/blob/main/docs/framework/react/guides/invalidations-from-mutations.md]

## Story Completion Status

Ultimate context engine analysis completed - comprehensive developer guide created.

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
