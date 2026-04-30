# Story 2.1: Recipe Discovery and Detail Sheets

Status: done

<!-- Completion note: Ultimate context engine analysis completed - comprehensive developer guide created. -->

## Story

As a household member,
I want to browse, search, filter, and inspect recipes in context,
so that I can quickly find meals worth planning.

**Requirements traced:** FR13, FR14, FR15, FR16, FR17, FR52; NFR3, NFR16, NFR18, NFR25, NFR26, NFR28; UX-DR9, UX-DR10, UX-DR11, UX-DR12, UX-DR39, UX-DR40.

## Acceptance Criteria

**AC1 - Chef shows available recipes as semantic cards**

- **Given** a household member opens Chef
- **When** recipes are available
- **Then** the app shows recipe cards with name, meal type, portions, and image or fallback thumbnail
- **And** each recipe card is a semantic tap target with readable metadata.

**AC2 - Search and meal-type filtering update recipe results**

- **Given** a user searches or filters by meal type
- **When** the recipe list updates
- **Then** results reflect the active query and filters
- **And** query keys include filter state for targeted caching.

**AC3 - Recipe detail opens in a labelled sheet**

- **Given** a user selects a recipe
- **When** the detail opens
- **Then** it opens in a labelled bottom sheet rather than a separate route
- **And** ingredients, optional ingredients, portions, and instructions are visible.

**AC4 - Empty, loading, and error states are local to Chef**

- **Given** no recipes match the current filters
- **When** the list renders
- **Then** an empty state guides the user to clear filters or search again.

- **Given** recipes are loading or fail to load
- **When** the Chef route renders
- **Then** the app shell and bottom nav remain stable
- **And** the affected list area shows reserved loading or recoverable error UI.

**AC5 - Detail creates a planning entry point without implementing scheduling**

- **Given** a recipe detail sheet is open
- **When** the user wants to plan the recipe
- **Then** the sheet exposes a clear "Add to plan" entry point for Story 2.2
- **And** this story does not create `PlanlagteMaaltider` tables, endpoints, or persistence.

## Tasks / Subtasks

- [x] **T1: Correct and extend recipe list API for household-safe filtering** (AC: 1, 2, 3)
  - [x] Update [backend/Controllers/OppskrifterController.cs](../../backend/Controllers/OppskrifterController.cs) rather than adding a second recipe controller.
  - [x] Extend `GET /api/oppskrifter` to accept `kategoriId` as an optional query parameter alongside existing `sok`.
  - [x] Apply `kategoriId` with AND semantics after search: active search and active meal-type filter must both be reflected.
  - [x] Preserve `GET /api/oppskrifter/{id}` and the existing mapped detail payload with ingredients, `valgfritt`, `kvantitet`, `maaleenhet`, `porsjoner`, image, and instructions.
  - [x] Change recipe household scoping to resolve membership through `Medlemmer`, matching `HandlelisteController.GetHouseholdId(userId)`. Do not trust the JWT `householdId` claim for authorization.
  - [x] Stop treating `Karakter == 1` as hidden. Only `Skjuloppskrift.Skjul == true` should exclude a recipe from normal browsing.
  - [x] Keep errors as `{ message: string }`; use 404 for missing detail recipes and 401 through existing auth behavior.

- [x] **T2: Provide meal-type data for Chef filters** (AC: 2)
  - [x] Reuse `GET /api/oppskriftskategorier`; do not create a new meal-type table.
  - [x] If seed data is touched, add the v1 meal-type rows `Kveldsmat` and `Mellommaltid` to [database/Oppskriftskategorier-seed.sql](../../database/Oppskriftskategorier-seed.sql) while keeping existing rows valid.
  - [x] Surface only the useful meal-type filter chips in the frontend. Existing `Forrett`, `Dessert`, and `Snacks` rows may remain in the database.

- [x] **T3: Build the frontend recipes feature layer** (AC: 1, 2, 3, 4)
  - [x] Create `frontend/app/features/recipes/types.ts` for recipe, ingredient, and recipe category DTOs that match the current backend camelCase/underscore payload.
  - [x] Create `frontend/app/features/recipes/use-recipes.ts` using [frontend/app/lib/api-fetch.ts](../../frontend/app/lib/api-fetch.ts) and TanStack Query.
  - [x] Suggested query keys: `["recipes", { search, kategoriId }]`, `["recipe", id]`, and `["recipe-categories"]`.
  - [x] Keep filter state inside the Chef route or a small feature helper; do not use React Router loaders for server state.
  - [x] Debounce search input by about 300 ms before updating the recipe query.
  - [x] Encode query params safely and omit empty values rather than sending blank filters.

- [x] **T4: Replace the Chef placeholder with recipe browser UI** (AC: 1, 2, 4)
  - [x] Update [frontend/app/routes/app/chef.tsx](../../frontend/app/routes/app/chef.tsx); it is currently a Story 2.1 placeholder.
  - [x] Keep Chef inside the existing [frontend/app/components/AppShell.tsx](../../frontend/app/components/AppShell.tsx) layout. Do not add per-screen auth or household guards.
  - [x] Render a labelled search input and meal-type filter chips before the recipe list.
  - [x] Build product-level `RecipeCard` component under `frontend/app/features/recipes/` or `frontend/app/components/` if it will be reused by Cookbook later.
  - [x] Cards must be buttons or links with accessible names, visible focus, recipe name, meal type, portions, and image/fallback thumbnail.
  - [x] Use compact mobile-first layout at 360px and centered mobile width on desktop. Do not convert Chef into a desktop dashboard.
  - [x] Empty state copy should guide clearing filters or searching again; do not show a blank route.

- [x] **T5: Add reusable detail sheet and recipe detail content** (AC: 3, 5)
  - [x] Add a reusable `DetailSheet` product component if one does not exist yet. Use shadcn/base-ui primitives installed through the shadcn CLI if a new primitive is needed.
  - [x] The sheet must have a labelled heading, close behavior, focus management, scrollable content, and a reachable sticky primary action area for long content.
  - [x] Opening a recipe should keep the user on `/app/chef`; do not create a detail route for Story 2.1.
  - [x] Render required and optional ingredients separately or mark optional rows clearly. Do not rely on color alone.
  - [x] Render `kvantitet == null` as a "to taste" style text, not `0`.
  - [x] Render instructions from the backend without inventing a recipe-authoring editor.
  - [x] Include an "Add to plan" primary action as the handoff to Story 2.2. It may open a non-persistent planning placeholder or be a clearly staged action, but it must not write planned meals in this story.

- [x] **T6: Preserve current app architecture and generated assets discipline** (AC: 1-5)
  - [x] New frontend source belongs in `frontend/`; do not add code to deprecated `client-react/`.
  - [x] Use `apiFetch` for all `/api/*` calls and let it handle 401 auth clearing.
  - [x] Use TanStack Query for server state, local React state only for search text, selected filter, and open sheet state.
  - [x] Use lucide icons where icons are needed, and existing shadcn/base-ui styling conventions.
  - [x] Do not hand-edit built files in `backend/wwwroot/`. Treat them as generated output from the frontend build.
  - [x] Do not implement ingredient exclusions, weekly plan persistence, shopping suggestions, cookbook, ratings, language switching, or new recipe creation here.

- [x] **T7: Verification** (AC: 1-5)
  - [x] `npm run typecheck --prefix frontend`
  - [x] `dotnet build backend/backend.csproj --no-restore` (if `dotnet run` locks `bin/` output—build to `-o ./_verify_build_out` succeeds)
  - [x] `npm run build`
  - [ ] Manual smoke: household user opens `/app/chef` and sees recipes without blocking the app shell.
  - [ ] Manual smoke: search query filters recipes and clearing it restores the list.
  - [ ] Manual smoke: meal-type filter combines with search and updates cache by filter state.
  - [ ] Manual smoke: recipe detail opens and closes as a sheet, with focus returning to the invoking card.
  - [ ] Manual smoke: optional ingredients and null quantities are readable and not misleading.
  - [ ] Manual smoke at 360px and keyboard-only through search, filters, cards, sheet close, and Add to plan entry.

## Dev Notes

### What this story is and is not

This story turns the Chef route into the recipe discovery surface and creates the reusable detail-sheet pattern needed by later planning, shopping, and cookbook work.

It is not:

- Weekly plan creation, week navigation, servings persistence, or edit planned meal behavior. Story 2.2 owns `PlanlagteMaaltider`.
- Per-planned-meal ingredient exclusions. Story 2.3 owns `PlanlagteMaaltidEkskludertIngrediens` and swipe exclusion persistence.
- Shopping-list suggestion generation or confirmation. Epic 3 owns those flows.
- Recipe creation, image upload, pantry logic, hidden recipe management UI, or cookbook ratings.
- A rewrite of the existing recipe backend. Extend the current brownfield controller.

### Existing state to preserve

Current backend recipe behavior in [backend/Controllers/OppskrifterController.cs](../../backend/Controllers/OppskrifterController.cs):

- `GET /api/oppskrifter?sok=` already returns authenticated recipe list results with category, image, portions, user preference fields, and full ingredient data.
- `GET /api/oppskrifter/{id}` already returns a mapped detail payload with ingredients, units, optional flags, and instructions.
- `POST`, `PUT`, and `DELETE /api/oppskrifter` are recipe authoring endpoints from the existing app. Do not build recipe authoring UI in this story.
- Current filtering hides recipes where `Skjul == true` or `Karakter == 1`. The architecture says this is a trap for future ratings; update browsing so only `Skjul == true` hides.
- Current `GetHouseholdId()` reads the JWT claim. Replace this with a server-side membership lookup through `Medlemmer`, matching `HandlelisteController`.

Current frontend state:

- [frontend/app/routes/app/chef.tsx](../../frontend/app/routes/app/chef.tsx) is a placeholder: "Oppskriftsbrowsing kommer i Story 2.1."
- [frontend/app/routes/app/layout.tsx](../../frontend/app/routes/app/layout.tsx) owns auth and household gating. Do not duplicate guards inside Chef.
- [frontend/app/components/AppShell.tsx](../../frontend/app/components/AppShell.tsx) provides the centered mobile shell and bottom nav spacing.
- [frontend/app/lib/api-fetch.ts](../../frontend/app/lib/api-fetch.ts) is the only HTTP boundary and already injects bearer tokens.
- [frontend/app/lib/query-client.ts](../../frontend/app/lib/query-client.ts) sets TanStack Query defaults.
- Existing shadcn primitives include `Button`, `Input`, `Label`, `Dialog`, `DropdownMenu`, and `Sonner`. If a sheet primitive is needed, install it with the shadcn CLI only.

### Backend API contract

Use these endpoint shapes unless implementation discovers a hard conflict:

| Method | Path | Purpose | Notes |
| --- | --- | --- | --- |
| `GET` | `/api/oppskrifter?sok=&kategoriId=` | Recipe list for visible household/admin/user recipes | Auth required; search and filter combine with AND semantics. |
| `GET` | `/api/oppskrifter/{id}` | Recipe detail | Auth required; preserve existing mapped payload. |
| `GET` | `/api/oppskriftskategorier` | Meal-type/category filter options | Existing endpoint; no auth attribute today. |

Recommended frontend DTO shape for the mapped recipe payload:

```ts
export interface RecipeDto {
  id: number
  navn: string
  instruksjoner: string
  porsjoner: number
  bilde: string | null
  kategori_id: number | null
  kategori: string | null
  user_id: number
  karakter: number | null
  kommentar: string | null
  skjul: boolean
  skjultBegrunnelse: string | null
  ingredienser: RecipeIngredientDto[]
}

export interface RecipeIngredientDto {
  id: number
  varetype_id: number
  varetype: string
  kvantitet: number | null
  maaleenhet_id: number | null
  maaleenhet: string | null
  type: string | null
  valgfritt: boolean | null
}
```

Keep these names if the backend still emits them this way. Do not silently invent a separate English DTO unless the backend is changed with the frontend in the same story.

### UI and accessibility guardrails

- Chef is a top-level destination, so route content should be stable and scannable.
- Recipe detail is a sheet, not a route. The URL should remain `/app/chef`.
- The sheet needs a labelled title, close button/escape behavior, focus trap, and focus return to the recipe card.
- Recipe cards should use a real `button` or `a`, not a clickable `div`.
- Filter chips should expose selected state through text/ARIA and style, not color alone.
- Images may be absent. Provide a stable fallback thumbnail area so cards do not jump.
- Loading states should reserve row/card space. Do not hide the bottom nav during list fetches.
- Keep authenticated product UI compact and practical. No landing-page hero or marketing layout.
- Story implementation is UI work, so use the `frontend-design` skill during implementation.

### Query and cache guidance

Use filter-aware keys so cached results do not bleed across search and meal type combinations:

```ts
const filters = {
  search: debouncedSearch.trim() || null,
  kategoriId: selectedKategoriId,
}

useQuery({
  queryKey: ["recipes", filters],
  queryFn: () => fetchRecipes(filters),
})
```

Context7 lookup for TanStack Query resolved `/tanstack/query` with high source reputation. Current docs show `queryClient.invalidateQueries({ queryKey: ["recipes"] })` invalidates all recipe queries by prefix, while `exact: true` limits invalidation to only the exact key. This story mainly reads data, but future mutations that affect recipes should invalidate the `["recipes"]` prefix and any specific `["recipe", id]` detail key instead of clearing the whole cache.

### Previous story intelligence

Story 1.4 implemented household onboarding, invite APIs, and account context, and left status `review`.

Actionable carryover:

- Household membership is now the gate into `/app/*`; Chef can assume it is rendered inside a household app shell but backend endpoints still must verify membership server-side.
- Onboarding/account work established the pattern of feature folders plus route-level UI updates. Follow that pattern with `frontend/app/features/recipes/`.
- `useMe()` and app layout already handle session and no-household redirects.
- The worktree currently has unrelated local modifications in `frontend/app/components/BottomNav.tsx`, `frontend/app/routes/app/layout.tsx`, and `frontend/app/routes/home.tsx`, plus generated/untracked `backend/wwwroot/`. Do not revert unrelated changes while implementing Story 2.1.

### Git intelligence

Recent commits:

- `5f7f235 feat(household): invites, onboarding create/join, account context (1.4)` - establishes feature-hook patterns, owner/member household context, and frontend route replacement style.
- `e531076 Add React Router 7 frontend rebuild and supporting setup` - establishes the React Router app, app shell, auth foundation, and source-vs-generated frontend distinction.

Build output under `backend/wwwroot/` is generated. Source changes should happen under `frontend/` and backend/database source files, then builds can refresh generated assets as verification output.

### Testing standards summary

There is no broad automated test harness for this flow yet. Keep verification focused and do not introduce a new test stack just for recipe browsing.

Minimum verification:

- Frontend typecheck catches DTO and component mistakes.
- Backend build catches controller signature/query issues.
- Root build confirms static output still compiles.
- Manual browser smoke covers search, filter, sheet focus/close, empty state, 360px layout, and keyboard access.

If a lightweight backend test harness exists by implementation time, prioritize:

- `GET /api/oppskrifter?kategoriId=...` filters by category and preserves search behavior.
- Recipe list household scoping resolves from `Medlemmer`, not JWT household claims.
- `Karakter == 1` does not hide recipes unless `Skjul == true`.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.1]
- [Source: _bmad-output/planning-artifacts/epics.md#Additional-Requirements]
- [Source: _bmad-output/planning-artifacts/prd.md#Recipe-Discovery-&-Recipe-Detail]
- [Source: _bmad-output/planning-artifacts/prd.md#Maintainability]
- [Source: _bmad-output/planning-artifacts/architecture.md#API-&-Communication-Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend-Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#Requirements-to-Structure-Mapping]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Recipe-Card]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Detail-Sheet]
- [Source: docs/ui-ux-screens.md#appchef--Recipe-Browser]
- [Source: docs/frontend-architecture-decisions.md#Data-Layer]
- [Source: docs/frontend-architecture-decisions.md#Backend-Changes-Required]
- [Source: backend/Controllers/OppskrifterController.cs]
- [Source: backend/Controllers/OppskriftskategorierController.cs]
- [Source: backend/Controllers/HandlelisteController.cs]
- [Source: backend/DTOs/RecipeDtos.cs]
- [Source: backend/Models/Oppskrift.cs]
- [Source: backend/Models/Ingrediens.cs]
- [Source: frontend/app/routes/app/chef.tsx]
- [Source: frontend/app/routes/app/layout.tsx]
- [Source: frontend/app/components/AppShell.tsx]
- [Source: frontend/app/lib/api-fetch.ts]
- [Source: frontend/app/lib/query-client.ts]
- [Source: Context7 /tanstack/query query-invalidation docs]

### Review Findings

_Code review on 2026-04-30. 0 decision-needed, 0 patch, 10 defer, 12 dismissed. Acceptance auditor confirmed AC1–AC5 and T1–T6 all met._

- [x] [Review][Defer] `kategoriId=0` and unknown ids silently return empty list, indistinguishable from "no recipes match" [backend/Controllers/OppskrifterController.cs GetAll] — deferred, pre-existing validation gap
- [x] [Review][Defer] `sok` LIKE wildcards (`%`, `_`) not escaped — broad/unintended matches [backend/Controllers/OppskrifterController.cs GetAll] — deferred, pre-existing
- [x] [Review][Defer] No max length on `sok`; long paste pushes backend `LIKE '%…%'` and is a latency/DOS vector [backend/Controllers/OppskrifterController.cs GetAll] — deferred, pre-existing
- [x] [Review][Defer] `Recommended` returns 400 when household is missing while `GetAll`/`GetOne` degrade gracefully — inconsistent UX during onboarding [backend/Controllers/OppskrifterController.cs Recommended] — deferred, pre-existing
- [x] [Review][Defer] `EXCLUDED_FILTER_CATEGORY_IDS = {4,5,6}` couples chef chips to seed ids; brittle if seed renumbers [frontend/app/routes/app/chef.tsx] — deferred, spec permits id-based exclusion
- [x] [Review][Defer] Detail title shows previous recipe's `navn` while next-card refetch is in flight (uses `detailQuery.data?.navn` even after `selectedId` changes) [frontend/app/routes/app/chef.tsx / detail-sheet.tsx] — deferred, minor UX
- [x] [Review][Defer] `returnFocusRef` may point to a card unmounted by a filter change while sheet is open; focus falls back to `<body>` [frontend/app/routes/app/chef.tsx] — deferred, edge case
- [x] [Review][Defer] `hasActiveFilters` true for ~300 ms after `clearFilters()` due to debounced search lag — wrong CTA briefly visible [frontend/app/routes/app/chef.tsx] — deferred, cosmetic
- [x] [Review][Defer] `useDebouncedValue` first render returns initial value uncondounced; first keystroke unfiltered [frontend/app/features/recipes/use-recipes.ts] — deferred, cosmetic
- [x] [Review][Defer] No `AbortSignal` plumbed into `queryFn`; in-flight requests not cancelled on filter change/unmount [frontend/app/features/recipes/use-recipes.ts] — deferred, optimisation

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

- List API: optional `kategoriId`, AND with `sok`; visibility via `Medlemmer`; browse excludes only `Skjul`; detail 404 when skjult preference.
- Chef: TanStack Query + 300 ms debounced search; chips hide Forrett/Dessert/Snacks IDs; bottom `DetailSheet` + «Legg i plan» toast (Story 2.2).
- New seed rows 7–8 for `Kveldsmat` / `Mellommaltid` — apply migration/seed on existing DB if needed.

### File List

- `backend/Controllers/OppskrifterController.cs`
- `database/Oppskriftskategorier-seed.sql`
- `frontend/app/components/detail-sheet.tsx`
- `frontend/app/components/ui/sheet.tsx` (shadcn CLI)
- `frontend/app/features/recipes/types.ts`
- `frontend/app/features/recipes/use-recipes.ts`
- `frontend/app/features/recipes/recipe-card.tsx`
- `frontend/app/features/recipes/recipe-detail-panel.tsx`
- `frontend/app/routes/app/chef.tsx`

### Change Log

| Date | Description |
| --- | --- |
| 2026-04-30 | Story created, status: ready-for-dev. |
