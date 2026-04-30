# Frontend Architecture Decisions

## Summary

Mobile-first SPA in `frontend/` using React Router 7 with `ssr: false`, served by the .NET backend from `wwwroot/`, deployed with MySQL on Railway. Auth uses JWT bearer tokens, while household tenancy is resolved server-side from `Medlemmer`. Frontend data uses TanStack Query. The core product flow is planning meals, generating shopping suggestions, maintaining a swipe-first shopping list, completing a purchase, and graduating recipes into cookbook history.

`client-react/` is deprecated and will be removed. `frontend/` is canonical.

## Architecture

- **Stack:** React 19, React Router 7 (framework mode flipped to SPA via `ssr: false` in `react-router.config.ts`), Vite, Tailwind v4, shadcn (base-ui).
- **Why SPA, not SSR:** authenticated household productivity app, not SEO-driven. Backend issues JWT in JSON; keeping SSR would force a BFF/session-cookie layer we have not designed. SSR template was an install accident, not an architectural choice.
- **Routing conventions** stay (RR7's file-based routes), but data fetching is client-side. No server loaders for app data in v1.
- **Static deployment:** `npm run build` produces static assets, copied into `backend/wwwroot/`. .NET serves them with `UseStaticFiles()` + `MapFallbackToFile("index.html")` so client-side routes survive hard refreshes.
- **Same-origin contract:** API at `/api/*`, SPA at every other path. No CORS in production.

## Routing

```
/                 minimal public landing (logged-in users redirect to /app/chef)
/login
/register
/onboarding       create or join household (forced for users without one)
/app/chef         browse/search/select recipes
/app/planned      selected weekly meals
/app/shopping     active shopping list
/app/cookbook     household history of purchased meals
/app/account      user + household settings
```

- `/app/*` is a layout route that owns auth gating, household gating, and the bottom navigation.
- Detail/edit flows inside the app routes use popovers/sheets, not new routes. Routes are the skeleton; popovers are the interaction pattern.
- Centralized guard: `/app/*` shell fetches `useQuery(['me'])`. No user → `/login`. User without household → `/onboarding`. No per-screen guards.
- Onboarding is one screen with two cards: "Create household" and "Join with invite code".

## Auth & Tenancy

- **JWT bearer**, stored in `localStorage`, mirrored in a React `AuthProvider` for reactive UI.
- **`apiFetch` wrapper** injects `Authorization: Bearer <token>` on every call. On 401, it clears auth state, removes the token, redirects to `/login`, and shows a "session expired" toast.
- **One auth DTO shape** across `POST /api/auth/login`, `POST /api/auth/register`, and `GET /api/auth/me` — matches the existing `AuthResponse` (flat `userId`, `brukernavn`, `email`, `fullName`, `householdId`, `householdName`). No nested `{ user, household }` envelope; the frontend stores this once on auth and refetches via `/me` when membership might have changed (e.g. after joining via invite).
- **No refresh tokens in v1.** Backend issues 7-day tokens; on expiry, user re-logs in.
- **Household tenancy is resolved server-side from `Medlemmer` per request (B2)**, not from the JWT `householdId` claim. The claim becomes a UI hint, not an authorization decision. This is what `HandlelisteController` already does; `OppskrifterController` must be brought into line.
- **One household per user in v1.** Backend uses `FirstOrDefaultAsync` on `Medlemmer`; we accept this as a v1 constraint.
- **JWT contents are user identity only.** Membership changes are reflected on next request without forcing re-login.

## Data Layer

- **TanStack Query for all server state.** RR7 handles routing only; loaders are not used.
- **Stable query keys**, e.g. `['me']`, `['recipes', filters]`, `['planned-meals', weekStartDate]`, `['shopping-list']`, `['cookbook']`. Mutations invalidate targeted keys.
- **Forms:** `react-hook-form` + `zod` via `@hookform/resolvers/zod`. Zod errors are localized via `zod-i18n-map`.
- **Toasts:** `sonner` (shadcn default).
- **Dates:** `date-fns`, with Monday-anchored weeks (`startOfWeek({ weekStartsOn: 1 })`).

## Meal Planning

- New table `PlanlagteMaaltider` with composite key intent `(householdId, weekStartDate, day, mealType, recipeId)`.
  - **Per household**, not per user.
  - **Week identifier:** Monday-anchored `DATE` (avoids ISO-week edge cases).
  - **Slot granularity:** day + mealType (calendar/grid model from day one).
  - **Duplicates allowed across the week, not within the same exact slot.**
  - **Servings per slot:** stored on the planned meal, default = household member count, override allowed (1–20).
- `mealTypeId` FKs to the existing `Oppskriftskategori` table, which we redefine as the v1 MealType vocabulary: Frokost / Lunsj / Middag / Kveldsmat / Mellommåltid. No separate `MealType` table.
- **Cuisine dropped from v1.** A single category dimension (meal type) is enough; revisit if cuisine filtering becomes a graded requirement.
- **Add-to-plan sheet:** week selector (This week / Next week / Custom), 7 day pills, meal-type chips, servings stepper. Defaults: this week, today (or next future day), Middag, household member count.
- **Week navigation on `/app/planned`:** prev/next chevrons + week title + tap-to-pick date.
- **Per-meal ingredient exclusions** (the swipe-to-exclude in the recipe detail sheet) are stored household-wide so they sync between members. New table `PlanlagteMaaltidEkskludertIngrediens(planlagt_maaltid_id, ingrediens_id)`, `UNIQUE` on the pair, FK cascades when the planned meal is deleted. The `generate-from-week` endpoint joins this table and filters those `(planlagtMaaltidId, ingrediensId)` pairs out before aggregation. Endpoints: `POST /api/planlagte-maaltider/{id}/ekskluder` and `DELETE /api/planlagte-maaltider/{id}/ekskluder/{ingrediensId}`.

## Shopping List Flow

- Shopping list is a **maintainable household list**, not a generated artifact. Generation is assistive.
- **Recipe-to-shopping-list generation is auto-suggest, manual-confirm.** Reuses the existing `forslag` pattern in `HandlelisteController`. The endpoint is `POST /api/handleliste/generate-from-week` (item 5 in the backend list).
- **Generation algorithm.** Given a `weekStartDate` and the caller's household:
  1. Fetch all `PlanlagteMaaltider` rows for `(husholdningId, weekStartDate)`.
  2. Join `Ingredienser` for each meal's `oppskriftId`.
  3. Drop ingredients where `valgfritt = TRUE` (optional).
  4. Drop ingredients listed in `PlanlagteMaaltidEkskludertIngrediens` for that planned meal (the swipe-to-exclude state).
  5. Scale `kvantitet` by `planlagt.servings / oppskrift.porsjoner` so changing serving count on the planned meal flows through.
  6. Aggregate by `(varetypeId, maaleenhetId)` — sum quantities only when both match. Different units stay as separate lines. No unit conversion in v1.
  7. Required ingredients with `kvantitet IS NULL` (salt, pepper to taste) become reminder rows with no number.
  8. Compare against current `Handleliste` rows for the household. Items already present (same `varetypeId` + `maaleenhetId`) are returned to the client **flagged** as already-on-list so the suggestions sheet can pre-uncheck them — they are not re-inserted.
  9. The endpoint returns the suggested rows; **nothing is written until the client confirms** (manual-confirm). On confirmation, rows are inserted with `kilde = 'plannedMeal'`, `planlagt_maaltid_id` set, attributed to the user who pressed the button.
  - Idempotent: pressing Generate twice with no changes returns the same suggestions and inserts nothing on the second confirm because the items are already on the list.
- **Generated rows live in `Handleliste`** with new columns:
  - `kilde`: `manual` | `plannedMeal`
  - `planlagt_maaltid_id`: nullable FK
  - Optional state for purchased/hidden.
- `HandlelisteRad.UserId` stays non-nullable. Each row is attributed to whoever added it; household members all see all rows.
- **Aggregation rule:** sum quantities only when `(varetypeId, maaleenhetId)` match exactly. Different units stay as separate lines. No unit conversion in v1.
- **Optional ingredients are skipped** during generation. **Required ingredients with null quantity** (e.g. salt to taste) appear as reminder rows with no number.
- **Pantry deduction is dropped from v1** because there is no pantry UI to keep `Varelager` populated. The `forslag` minimum-stock path stays where it already exists, but recipe-derived suggestions do not subtract on-hand stock.
- **Mobile-first interaction:** swipe an item to mark purchased/hidden. Active list shows only unpurchased rows. A "Show hidden shopping items" toggle reveals purchased rows for restoration.
- **Purchase complete** archives hidden purchased rows and graduates planned meals to cookbook (see below).
- **Concurrency:** last-write-wins on completion, duplicate manual rows allowed (both attributed). No locking, no dedup in v1.

## Cookbook History

- **Cookbook = household-shared history of meals that actually made it into a completed shopping trip.** Not a recipe catalog.
- **Graduation rule on Purchase complete:**
  - A planned meal graduates if **at least one** of its recipe-derived rows was marked purchased/hidden during the trip.
  - **Only weeks ≤ current week graduate.** Future weeks stay planned even if their rows were on the list.
  - Idempotent: pressing Purchase complete again should not double-write history.
- **Plan edits clean up:** deleting a planned meal removes its non-purchased generated shopping rows. Purchased rows are untouched.
- **Cookbook is derived from `PlanlagteMaaltider` rows that have at least one purchased `Handleliste` row.** Because cookbook history lives only in `PlanlagteMaaltider`, **a planned meal cannot be hard-deleted once purchase-complete has graduated it.** The `DELETE` endpoint must:
  - Allow delete if no related `Handleliste` row has `purchased_at IS NOT NULL` → cascade non-purchased rows as above.
  - Reject (or no-op with a 409) if any related row is purchased. Frontend hides the "Remove from plan" button for those slots, or shows it disabled with a tooltip ("This meal has been cooked").
  This avoids the contradiction of "purchased rows untouched" while cookbook entries silently disappear with their parent.
- **Ratings are per user**, not per household. Each member sees the same household history sorted by their own grades. **Stored in the existing `Skjuloppskrift` table**: it already has `karakter INT NULL CHECK (karakter BETWEEN 1 AND 10)`, `UNIQUE (user_id, oppskrift_id)`, and a `skjul BOOLEAN`. No new rating table. The 1–5 star UI maps to the 1–10 column with the canonical formula **`stored = stars * 2`** (so 1★=2, 2★=4, 3★=6, 4★=8, 5★=10). Display reads `round(karakter / 2)`. **The rating endpoint must only `UPDATE` when the new stored value differs from the current one** — never write on idempotent taps — otherwise legacy rows with odd `karakter` values would silently shift on the first tap. Use UPSERT semantics on `(user_id, oppskrift_id)`, set `karakter` without touching `skjul` or `begrunnelse`/`kommentar`.
- **Rating is always available** in the cookbook (card or detail sheet). No prompts, no notifications in v1.
- **Sort:** rated meals first → my rating descending → most recently completed → recipe name. Unrated meals appear at the bottom, ordered by recency.
- **1-star auto-hide trap fix:** backend must stop filtering out recipes for `Karakter == 1` in `OppskrifterController`. Only `skjul = true` should hide. `Skjuloppskrift` rows where `karakter` is set but `skjul = false` are pure ratings.

## Onboarding & Household Invites

- **Forced create-or-join screen.** Users with no household cannot reach `/app/*` views.
- **Invite codes** replace the current "owner unilaterally claims any user" flow.
  - Format: 6-char uppercase alphanumeric, ambiguous chars excluded (no I/O/0/1).
  - Expiry: 7 days.
  - Single-use.
  - At most one active code per household; generating a new one revokes the previous.
  - Owner has an explicit revoke button.
- New table `HusholdningInvitasjon`: `code`, `householdId`, `createdByUserId`, `expiresAt`, `usedAt`.
- New endpoints: `POST /api/husholdning/invitasjon` (create), `POST /api/husholdning/join` (consume).
- **Avatars are initials in colored circles** for v1. No upload, no Gravatar, no `AvatarUrl` column.

## i18n & Theme

- **Chrome-only i18n.** UI labels translate; user-generated content (recipe names, member names, units, error message strings stored in DB) stays as-is.
- **Library:** `react-i18next` / `i18next`.
- **Locales:** `nb-NO` (primary) and `en` (fallback/demo).
- **Persistence:** browser language detection, then explicit choice in `localStorage`. No `Bruker.Sprak` column in v1.
- **Theme:** Tailwind `dark` class on `<html>`, persisted in `localStorage`, default from `prefers-color-scheme`. Toggle in `/app/account` between system / light / dark.

## Build & Deployment

- **Topology:** MySQL service + .NET API service on Railway. The .NET API serves the SPA from `wwwroot/`. Same origin, no CORS.
- **Build pipeline:**
  1. `npm ci && npm run build` in `frontend/`
  2. Copy build output into `backend/wwwroot/`
  3. `dotnet publish backend.csproj -c Release`
  4. Runtime: `app.UseStaticFiles()` before `MapControllers()`, `app.MapFallbackToFile("index.html")` so `/app/*` survives hard refresh.
- **API base URL:** `VITE_API_BASE_URL` is build-time. For same-origin deploys it can be empty; the `apiFetch` wrapper just calls `/api/...`.
- **Dev workflow:** Vite dev server proxies `/api/*` → `http://localhost:5000`. No CORS in dev either.
- **Migrations:** keep the existing pattern of versioned SQL files in `database/`. No EF Core migrations.

## Backend Changes Required

**Guiding rule:** adapt the frontend to existing backend patterns where possible. New endpoints mirror the shape and conventions already established in `AuthController` and `HandlelisteController`. Reused tables and helpers are called out explicitly so we don't double-build.

### New tables

1. **`PlanlagteMaaltider`** + CRUD endpoints. Per-household, week-anchored Monday `DATE`, day, mealType FK → `Oppskriftskategorier`, recipeId FK → `Oppskrifter`, servings. New controller. Use `HandlelisteController.GetHouseholdId(userId)` pattern verbatim for tenancy.
2. **`HusholdningInvitasjon`** + `POST /api/husholdning/invitasjon` + `POST /api/husholdning/join`. Columns: `code`, `husholdning_id`, `created_by_user_id`, `expires_at`, `used_at`.
3. **`PlanlagteMaaltidEkskludertIngrediens`** join table (see Meal Planning). Plus two endpoints to add/remove an exclusion. FK cascade-delete when the parent planned meal is deleted.

### Schema additions

4. `Handleliste` adds: `kilde` (`'manual' | 'plannedMeal'`), `planlagt_maaltid_id` (nullable FK), `purchased_at` (nullable DATETIME — replaces a separate hidden flag, "hidden" = `purchased_at IS NOT NULL`).

### New endpoints

5. `POST /api/handleliste/generate-from-week`. Reuse the existing `forslag` pattern in [HandlelisteController.cs:53-85](backend/Controllers/HandlelisteController.cs#L53-L85). Joins `PlanlagteMaaltidEkskludertIngrediens` and skips excluded ingredients before aggregation. Idempotent.
6. `POST /api/handleliste/purchase-complete`. Marks rows purchased, archives, graduates qualifying planned meals to cookbook (read-side query — see item 10). Idempotent.
7. Plan-edit cascade in `PlanlagteMaaltider DELETE`: reject if any related `Handleliste` row has `purchased_at IS NOT NULL` (returns 409); otherwise `DELETE FROM Handleliste WHERE planlagt_maaltid_id = :id AND purchased_at IS NULL`. Cascade also drops rows in `PlanlagteMaaltidEkskludertIngrediens`.
8. `GET /api/oppskrifter` accepts `?kategoriId=` filter.
9. `GET /api/auth/me`. **Mirrors the existing `AuthResponse` shape** returned by `AuthController.BuildAuthResponse()` — flat fields, not a nested object — so the frontend uses one DTO across login, register, and `/me`:
    ```json
    {
      "userId": 1,
      "brukernavn": "paal",
      "email": "paal@example.com",
      "fullName": "paal",
      "householdId": 10,
      "householdName": "Kollektivet"
    }
    ```
    `householdId` is `null` when the user has no membership. Implementation = the `BuildAuthResponse` helper extracted/called against the JWT user, **without** issuing a new token.

### Reused, no schema changes

10. **Cookbook is a derived view, not a new table.** It is the join of `PlanlagteMaaltider` (for week ≤ current) where at least one related `Handleliste` row has `purchased_at IS NOT NULL`. Read-side query inside `OppskrifterController` or a new `KookbokController`. No new persistent table. Combined with item 7 (block hard-delete after purchase), this means cookbook history can never silently disappear.
11. **Ratings reuse `Skjuloppskrift`.** `karakter INT (1–10)` is already there with `UNIQUE (user_id, oppskrift_id)`. No new table, no rename. UI shows 1–5 stars; canonical mapping is `stored = stars * 2`. The endpoint must skip the write when the new stored value equals the current one (avoids silently mutating legacy odd-numbered ratings).

### Bug fixes / one-liners

12. `OppskrifterController.GetHouseholdId()` → copy the helper from `HandlelisteController` that reads `Medlemmer.FirstOrDefaultAsync(x => x.UserId == userId)`. Drop the JWT-claim path.
13. Remove the `Karakter == 1` filter in `OppskrifterController` recipe-list queries. Only `Skjuloppskrift.skjul = true` should exclude.
14. Seed: add **Kveldsmat** and **Mellommåltid** to `Oppskriftskategorier-seed.sql`. Frokost/Lunsj/Middag are already seeded; existing Forrett/Dessert/Snacks rows can stay (the frontend just doesn't surface them as meal-type chips).

## Deferred to V2

- Multi-household per user / household switching (backend uses `FirstOrDefaultAsync` today).
- Refresh tokens.
- HttpOnly cookie auth / BFF layer.
- Avatar uploads (initials only in v1).
- Recipe creation UI and image hosting.
- Pantry / `Varelager` UI and pantry-deduction in shopping suggestions.
- Hidden recipes UI ("show hidden" toggle, explicit hide action).
- Household-aggregated ratings (v1 = my rating only).
- Password change.
- Account-level locale persistence (`Bruker.Sprak`).
- Cuisine as a second filter dimension on `/app/chef`.
- Multi-week shopping trip semantics beyond "weeks ≤ current week graduate".
- Push/in-app notifications, including post-meal "how was it?" rating prompts.
