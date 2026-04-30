# Story 1.2: Auth Session API, Registration, Login, Logout, and Recovery

Status: done

<!-- Note: "Recovery" in this story title refers to SESSION recovery (FR53/NFR8: clearing expired/invalid sessions and returning the user to authentication). It does NOT mean password recovery — password recovery is explicitly OUT of v1 (PRD §Out of Scope, line 259). Do not implement a forgot-password flow. -->

## Story

As a new or returning user,
I want account access and session recovery to behave predictably,
So that I can securely enter and leave the app without stale state.

**Requirements traced:** FR1, FR2, FR3, FR4, FR5, FR53; NFR5, NFR6, NFR7, NFR8, NFR16, NFR18, NFR25, NFR28.

## Acceptance Criteria

**AC1 — `/api/auth/me` returns identity + server-resolved household membership**

- **Given** a valid JWT bearer token
- **When** the frontend requests `GET /api/auth/me`
- **Then** the backend returns the current user identity and household membership status
- **And** household membership is resolved server-side from `Medlemmer` (NOT trusted from JWT `householdId` claim).

**AC2 — Registration form creates an account and authenticates the user**

- **Given** a new user provides valid registration details
- **When** they submit the registration form
- **Then** an account is created and the user receives an authenticated session
- **And** validation errors are shown inline when registration data is invalid.

**AC3 — Login form returns a JWT-backed session that survives reload**

- **Given** an existing user provides valid credentials
- **When** they submit the login form
- **Then** they receive a JWT-backed session
- **And** the app can remain signed in across page reloads until expiry or logout.

**AC4 — Expired/invalid session triggers session recovery (clear + redirect)**

- **Given** a user's token expires or an authenticated request returns 401
- **When** the shared `apiFetch` handles the response
- **Then** local auth state is cleared and the user is returned to authentication
- **And** stale household screens are no longer visible.

**AC5 — Logout ends the session client-side**

- **Given** a user chooses logout
- **When** the logout action completes
- **Then** the active session is ended client-side
- **And** future authenticated requests are not sent with the old token.

## Tasks / Subtasks

- [x] **T1: Add `/api/auth/me` endpoint** (AC: 1)
  - [x] Edit [backend/Controllers/AuthController.cs](backend/Controllers/AuthController.cs). Add `[HttpGet("me")] [Authorize] public async Task<IActionResult> Me()`.
  - [x] Resolve `userId` from `User.FindFirstValue(ClaimTypes.NameIdentifier)` (same pattern as [HandlelisteController.cs:159-163](backend/Controllers/HandlelisteController.cs#L159-L163)). Return 401 if missing.
  - [x] Resolve household **server-side** from `_db.Medlemmer.Include(x => x.Husholdning).FirstOrDefaultAsync(x => x.UserId == userId)`. Do NOT read `householdId` from the JWT — that claim is a UI hint only (architecture §Authentication & Security; epics.md "Resolve household tenancy server-side from `Medlemmer`").
  - [x] Return shape: `{ userId, brukernavn, email, householdId (nullable), householdName (string), householdRole (nullable: "eier" | "medlem") }`. Match the camelCase JSON the rest of the API emits (ASP.NET defaults).
  - [x] Add a `MeResponse` class to [backend/DTOs/AuthDtos.cs](backend/DTOs/AuthDtos.cs) following the existing `AuthResponse` shape minus `Token`, and plus `HouseholdRole`. Use `ulong?` for nullable `HouseholdId`. Keep PascalCase property names — ASP.NET serializes them to camelCase by default.
  - [x] Do NOT modify `RegisterRequest`, `LoginRequest`, or `AuthResponse`. Existing `/register` and `/login` already work and are used by the deprecated `client-react/`. Login/register endpoints are only EXTENDED through validation messages if needed for AC2 — the controller logic already returns `{ message }` on failures; reuse that contract.

- [x] **T2: Build the shared `apiFetch` HTTP boundary** (AC: 1, 3, 4, 5)
  - [x] Create [frontend/app/lib/api-fetch.ts](frontend/app/lib/api-fetch.ts). This is the ONLY HTTP boundary the frontend uses (architecture §Service Boundaries). No other file should call `fetch` against `/api/*`.
  - [x] Behavior:
    - Reads token via `getToken()` from `auth.ts` (T3).
    - Injects `Authorization: Bearer <token>` when a token exists.
    - Sets `Content-Type: application/json` for non-GET requests with a body. Accepts a typed `body` parameter that gets `JSON.stringify`d.
    - Resolves the URL same-origin: pass paths like `/api/auth/me` directly. In dev, Vite/React Router runs on a different port than the .NET backend — see T2c for the dev-server proxy setup. In production same-origin (architecture §Infrastructure & Deployment), no proxy needed.
    - On 401: call `clearAuth()` (T3), invalidate ALL TanStack Query cache (`queryClient.clear()`), and trigger a hard redirect to `/login` (use `window.location.assign("/login")` rather than `useNavigate()` — `apiFetch` must work outside React render). This is the **session recovery** behavior (NFR8, AC4).
    - On other non-2xx: throw a typed `ApiError` exposing `status`, `message` (parsed from `{ message }` body when present), and the raw response. Per architecture §API Response Formats: backend errors are `{ message: string }`. Do not wrap responses in a global envelope.
    - On 2xx with empty body (e.g. some PUT endpoints) or `204`: resolve `null` — do not try to `.json()` a body-less response (it throws).
  - [x] **T2c: Vite dev proxy to backend**. Edit [frontend/vite.config.ts](frontend/vite.config.ts) and add a dev `server.proxy` mapping `/api` → `http://localhost:<backend-port>`. Read the backend port from [backend/Properties/launchSettings.json](backend/Properties/launchSettings.json) (typically `5188`). With the proxy, dev frontend can call same-origin `/api/*` paths and not depend on the dev CORS policy. The dev CORS policy in [backend/Program.cs](backend/Program.cs) stays as a fallback (Story 1.1 left it in place); do not remove it in this story.
  - [x] Export `apiFetch<T>(input: string, init?: ApiFetchInit): Promise<T>` plus the `ApiError` class. Tiny surface — resist adding retry, timeout, abort signal helpers, or a request interceptor framework. Add them only when a feature needs them.

- [x] **T3: Build the auth token store + auth context** (AC: 1, 3, 4, 5)
  - [x] Create [frontend/app/lib/auth.ts](frontend/app/lib/auth.ts) with:
    - `const TOKEN_KEY = "ccs.auth.token"` (namespaced so it does not collide with the deprecated client-react app, which uses its own key under the same origin in dev).
    - `getToken(): string | null` reads from `localStorage`. Wrap in try/catch — `localStorage` access can throw in private mode in some browsers.
    - `setToken(token: string): void` writes to `localStorage` and dispatches a `StorageEvent` shim if needed for cross-tab sync (skip cross-tab for v1 unless trivial).
    - `clearAuth(): void` removes the token. Used by `apiFetch` 401 handler and explicit logout.
  - [x] Create [frontend/app/lib/query-client.ts](frontend/app/lib/query-client.ts) — exports a singleton `QueryClient` with sensible defaults: `staleTime: 30_000`, `refetchOnWindowFocus: false`, `retry: (count, err) => err instanceof ApiError && err.status === 401 ? false : count < 1`. Don't retry on 401 — `apiFetch` already handles that path; retrying would loop.
  - [x] Create [frontend/app/features/auth/use-me.ts](frontend/app/features/auth/use-me.ts) — exports `useMe()` which calls `useQuery({ queryKey: ['me'], queryFn: () => apiFetch<MeResponse>('/api/auth/me'), enabled: !!getToken() })`. The query is `enabled` only when a token exists so anonymous users don't generate a 401 on app load. Query key `['me']` matches architecture §State Management Patterns.
  - [x] Define `MeResponse` TypeScript type in [frontend/app/features/auth/types.ts](frontend/app/features/auth/types.ts) mirroring the backend DTO from T1. Keep it next to the feature, not in `lib/` — feature-specific types belong in feature folders (architecture §Component Boundaries).
  - [x] Wire `QueryClientProvider` in [frontend/app/root.tsx](frontend/app/root.tsx) so all routes share the singleton client. Wrap `<Outlet />` in `<QueryClientProvider client={queryClient}>`. Do not move `Layout` — keep the existing structure intact.

- [x] **T4: Install required frontend dependencies via shadcn/npm** (AC: 2, 3)
  - [x] Add to [frontend/package.json](frontend/package.json) (run `npm install` inside `frontend/`):
    - `@tanstack/react-query@^5` — server state (architecture §State Management Patterns).
    - `react-hook-form@^7` — form state (architecture §Important Decisions; epics.md §Additional Requirements).
    - `zod@^3` — schema validation paired with `react-hook-form`.
    - `@hookform/resolvers@^3` — adapts `zod` to `react-hook-form`.
    - `sonner@^1` — toast feedback for low-risk mutations (UX-DR22). Add the `<Toaster />` mount in [frontend/app/root.tsx](frontend/app/root.tsx) inside `<QueryClientProvider>` but outside `<Outlet />`.
  - [x] Install shadcn components needed for the auth forms via the shadcn CLI (per AGENTS.md repo rule — do NOT hand-write these into `app/components/ui/`):
    - Ran `npx shadcn@latest add button input label form sonner` (npm-based, matching Story 1.1). `button`, `input`, `label`, `sonner` installed; **`form` is NOT shipped by the `base-maia` preset registry** (verified via `npx shadcn@latest view form` — registry-item has no `files`). Forms therefore use `react-hook-form` directly with the installed `Input`/`Label`/`Button` primitives + inline `<p>` error rendering. No hand-authored UI primitives in `components/ui/`. Patched the generated `sonner.tsx` to drop its `next-themes` import (this is a React Router SPA, not Next.js — that import would fail typecheck).
  - [x] Do NOT install: `react-i18next` / `i18next`, `date-fns`, `react-swipeable-list`, or sheet/dialog primitives. Those are pulled in only when their first feature lands (Story 1.3+, 6.1+). Resist scope creep; install dependencies just-in-time per story to keep the dependency graph honest.

- [x] **T5: Build login route + form** (AC: 3, 5)
  - [x] Add a `route("login", "routes/login.tsx")` entry to [frontend/app/routes.ts](frontend/app/routes.ts).
  - [x] Create [frontend/app/routes/login.tsx](frontend/app/routes/login.tsx). The page renders a centered, mobile-first form (UX-DR1, UX-DR44). Wire up via `<LoginForm />` from the auth feature folder.
  - [x] Create [frontend/app/features/auth/login-form.tsx](frontend/app/features/auth/login-form.tsx):
    - Uses `react-hook-form` + `zod` resolver.
    - Schema: `z.object({ brukernavnEllerEmail: z.string().min(1, 'Required'), passord: z.string().min(1, 'Required') })`. Field names match the backend DTO keys (camelCase), so the form values can be sent directly: `apiFetch<AuthResponse>('/api/auth/login', { method: 'POST', body: values })`.
    - On success: `setToken(response.token)`, then call `queryClient.setQueryData(['me'], deriveMeFromAuthResponse(response))` so the app shell does not need to refetch immediately, then `navigate('/app')` (the route does not exist yet — it 404s gracefully via SPA fallback. Story 1.3 wires the gated `/app/*` shell).
    - On `ApiError` 401/400: render the parsed `error.message` inline above the form (UX-DR23 inline feedback for recoverable errors). Do NOT use a toast for recoverable form errors — toast is reserved for low-risk mutation success and non-form async errors (UX-DR22).
    - Form labels: "Brukernavn eller e-post" / "Passord" — Norwegian, matching backend Norwegian labels. i18n is not in scope this story; hardcoded NO is fine for v1 auth chrome since localization lands in Story 6.1.
    - Mark inputs with `htmlFor`-linked `<Label>` (UX-DR-NFR18 accessible labels). Required fields use `aria-required="true"` and `autoComplete="username"` / `"current-password"`. Visible focus states come from the shadcn Input default.
  - [x] **Logout** lives in [frontend/app/features/auth/use-logout.ts](frontend/app/features/auth/use-logout.ts) — exports `useLogout()` which `clearAuth()`, `queryClient.clear()`, and `navigate('/login')`. There is no backend logout endpoint — JWT is stateless and we do not maintain a server-side blocklist for v1 (architecture §Deferred Decisions). The hook is wired by an Account screen later (Story 6.1) and could be invoked directly from a temporary debug action if needed for verification — do NOT add a permanent UI button in this story.

- [x] **T6: Build register route + form** (AC: 2)
  - [x] Add `route("register", "routes/register.tsx")` to [frontend/app/routes.ts](frontend/app/routes.ts).
  - [x] Create [frontend/app/routes/register.tsx](frontend/app/routes/register.tsx) and [frontend/app/features/auth/register-form.tsx](frontend/app/features/auth/register-form.tsx).
  - [x] Schema: `z.object({ brukernavn: z.string().min(2), email: z.string().email(), passord: z.string().min(8), fullName: z.string().optional() })`. Field names match `RegisterRequest` exactly. Do NOT send `householdName` — household creation is Story 1.4. Leave that field unset; the existing `RegisterRequest` makes it `string?` so it is safe to omit.
  - [x] On success the backend returns the same `AuthResponse` shape as login (token + identity + nullable household). Apply the same `setToken` + `setQueryData(['me'], …)` + `navigate('/app')` pattern as login.
  - [x] On 400 (`{ message }` for "Brukernavn er allerede i bruk." or "Email er allerede i bruk." — see [AuthController.cs:36-40](backend/Controllers/AuthController.cs#L36-L40)): map the message to inline form errors. Heuristic: if `message` includes "Brukernavn", set `setError('brukernavn', { message })`; if it includes "Email", set on `email`; otherwise show as a top-of-form error. Do not invent new error codes; the backend currently does not differentiate, so message-keyword routing is the pragmatic v1 path.
  - [x] Add a "Already have an account? Log in" link to `/login`. Add a matching "Need an account? Register" link on login.

- [ ] **T7: Manual verification before marking complete** (AC: 1–5)
  - [ ] Build & run: in one terminal `cd frontend && npm run dev`. In another `cd backend && dotnet run`. Open the dev frontend URL.
  - [ ] **AC2/AC3 — register & login**: Register a new user with a unique brukernavn and email. Confirm `localStorage["ccs.auth.token"]` is set. Reload the page and confirm `useMe()` returns the user (token persists across reloads).
  - [ ] **AC1 — /me shape**: Open browser devtools → Network. Confirm `GET /api/auth/me` returns `200 { userId, brukernavn, email, householdId: null, householdName: "", householdRole: null }` for a newly registered user (no household yet — that's Story 1.4).
  - [x] **AC1 — server-side household resolution**: code-review evidence — `grep` of [backend/Controllers/AuthController.cs](backend/Controllers/AuthController.cs) confirms the new `Me()` action does **not** call `User.FindFirstValue("householdId")`. The only `householdId` references in the file are (1) building the JWT claim in `BuildAuthResponse` (write-side) and (2) `Register` creating a household; neither is read by `Me()`. Server-side resolution from `_db.Medlemmer.Include(Husholdning).FirstOrDefault(UserId)` is the only path that produces the response's household fields. (Story permits code review as evidence for this AC.)
  - [ ] **AC4 — session recovery**: Manually expire the token by editing it in localStorage to gibberish, then trigger a refetch (e.g. reload). Confirm: the next `/api/auth/me` returns 401, `apiFetch` clears the token and routes to `/login`. The Plan/Shop/etc. routes don't exist yet so verify by inspecting localStorage post-401 and confirming `window.location.pathname === '/login'`.
  - [ ] **AC5 — logout**: Trigger `useLogout()` (temporarily wire a button or run from devtools console: `import('/app/lib/auth.ts').then(m => m.clearAuth())` then refresh). Confirm the token is gone and the next API call goes out without `Authorization`.
  - [ ] Document the verification results in the Completion Notes List below.

### Review Findings

- [x] [Review][Patch] Preserve backend login error messages on 401 [frontend/app/lib/api-fetch.ts:41]

## Dev Notes

### What this story is and is NOT

This story builds the **auth API surface + frontend HTTP/auth foundations + bare login & register screens**. It is NOT yet:

- The `/app/*` route tree, app shell, or bottom nav (Story 1.3).
- Centralized route gating that redirects unauthenticated users to login from `/app/*` (Story 1.3 — this story leaves `/app` unwired; SPA fallback returns `index.html` and the empty home page renders).
- Household creation, invite generation, or onboarding (Story 1.4).
- A formal Account screen or visible logout button (Story 6.1).
- Localization (Story 6.1) — auth form copy is hardcoded Norwegian for now.
- Password reset / forgot password — explicitly **out of v1** ([prd.md:259](_bmad-output/planning-artifacts/prd.md#L259)). The word "recovery" in the story title means **session recovery**, not password recovery.
- Refresh tokens, HttpOnly cookies, BFF, or any shape change to JWT bearer (architecture §Deferred Decisions; epics.md §Additional Requirements: "Keep JWT bearer auth for v1 with client-side storage").

### CRITICAL: existing auth surface — extend, do not rebuild

The brownfield backend already has working `/api/auth/register` and `/api/auth/login`. Read [backend/Controllers/AuthController.cs](backend/Controllers/AuthController.cs) before changing anything.

| Endpoint                  | Status    | What this story does                                                                                          |
| ------------------------- | --------- | ------------------------------------------------------------------------------------------------------------- |
| `POST /api/auth/register` | EXISTS    | Reuse as-is. Frontend sends `RegisterRequest`.                                                                |
| `POST /api/auth/login`    | EXISTS    | Reuse as-is. Frontend sends `LoginRequest`.                                                                   |
| `GET /api/auth/me`        | NEW       | T1 adds it — `[Authorize]`, server-resolved household.                                                        |
| `POST /api/auth/logout`   | NOT ADDED | JWT is stateless; logout is purely client-side token clear. Do not add a backend endpoint just to symmetrize. |

`AuthResponse` already includes the fields the frontend needs after register/login. Do not change its shape; the deprecated client-react app may still call these endpoints in dev. Add the new `MeResponse` separately.

### CRITICAL: server-side household resolution (NFR7, NFR6)

The JWT issued by `BuildAuthResponse` ([AuthController.cs:113-114](backend/Controllers/AuthController.cs#L113-L114)) includes a `householdId` claim. **That claim is a UI hint only.** Never use it to authorize household-scoped data.

The `/api/auth/me` endpoint MUST resolve household from the `Medlemmer` table:

```csharp
var membership = await _db.Medlemmer
    .Include(x => x.Husholdning)
    .FirstOrDefaultAsync(x => x.UserId == userId.Value);
```

This is the same pattern existing controllers use ([HusholdningController.cs:25-27](backend/Controllers/HusholdningController.cs#L25-L27), [HandlelisteController.cs:165-168](backend/Controllers/HandlelisteController.cs#L165-L168)).

### `apiFetch` is the only HTTP boundary

Every frontend fetch to `/api/*` must go through `apiFetch`. No exceptions. Do not import `fetch` directly in route or feature code. This is non-negotiable per architecture §Service Boundaries — without it the 401 recovery behavior (AC4) is unreachable, and we lose query-key consistency.

If a developer adds a direct `fetch` call to bypass `apiFetch` quirks, the right move is to fix `apiFetch`, not to bypass it.

### Same-origin in production, dev proxy in development

Production (Story 1.1) serves the SPA and `/api/*` from the same origin. In production, `apiFetch('/api/auth/me')` resolves to the same `.NET` service — no CORS, no host config.

In dev, the React Router dev server runs on a different port (Vite default 5173) than the .NET backend (5188 per `launchSettings.json`). Two viable options:

1. **Vite proxy** (preferred) — adds `server.proxy['/api']` to `vite.config.ts`. Then dev frontend calls same-origin `/api/*` paths. This matches production behavior exactly and stops dev from depending on the global CORS policy. **Use this.**
2. **Cross-origin via the existing dev CORS policy** — `app.UseCors("react")` already allows any origin. Works but means dev and production routing differ. Avoid.

The Vite proxy approach was anticipated in epics.md §Additional Requirements: "Vite development setup must allow frontend development against the backend API without production CORS assumptions leaking into deployment." (NFR24).

### Tech versions in play (verified at story-creation time)

- React 19.2, React Router 7.13.1, Vite 7.3, TypeScript 5.9 — already installed (`frontend/package.json`).
- TanStack Query, react-hook-form, zod, @hookform/resolvers, sonner — INSTALLED in T4. Pin major versions: `@tanstack/react-query@^5`, `react-hook-form@^7`, `zod@^3`. Do not pin to specific minors; let the lockfile do that.
- Backend: .NET 8 (`net8.0`), Pomelo MySQL 8.0.2, JWT bearer auth with `Microsoft.AspNetCore.Authentication.JwtBearer` — already wired in [backend/Program.cs](backend/Program.cs).
- ASP.NET Core JSON defaults emit camelCase. Backend DTOs use C# PascalCase; the wire is camelCase. Verify a sample response in T7 to confirm shape. Do not add a custom `[JsonPropertyName]` unless the wire shape diverges from a property name in some non-obvious way.

If unsure about TanStack Query 5's `useQuery` API or react-hook-form + zod resolver wiring, run `npx ctx7@latest library "TanStack Query" "useQuery v5 enabled flag and queryClient setQueryData"` and `npx ctx7@latest library "react-hook-form" "zod resolver and inline error messages with setError"` first per the project's Context7 rule (AGENTS.md). Do not guess from training data.

### File scoping — UPDATE vs CREATE

**Files to UPDATE in this story:**

| Path                                                                           | Change                                                               | What this story changes                                                                                | What must be preserved                                                                                 |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| [backend/Controllers/AuthController.cs](backend/Controllers/AuthController.cs) | Add `Me()` action                                                    | New `[HttpGet("me")] [Authorize]` action that returns `MeResponse` from `Medlemmer`-resolved household | Existing `Register` and `Login` actions, transaction logic, password hashing, JWT signing — untouched. |
| [backend/DTOs/AuthDtos.cs](backend/DTOs/AuthDtos.cs)                           | Add `MeResponse` class                                               | New DTO mirroring `AuthResponse` shape minus `Token`, plus `HouseholdRole` (string?)                   | Existing `RegisterRequest`, `LoginRequest`, `AuthResponse` shapes — do not modify.                     |
| [frontend/app/root.tsx](frontend/app/root.tsx)                                 | Wrap `<Outlet />` in `<QueryClientProvider>` and mount `<Toaster />` | Add provider + toaster mount inside the existing `Layout` body                                         | The existing `Layout`, `ErrorBoundary`, and HTML scaffolding — untouched.                              |
| [frontend/app/routes.ts](frontend/app/routes.ts)                               | Add `route("login", …)` and `route("register", …)`                   | Two new top-level public routes                                                                        | Existing `index("routes/home.tsx")` — keep.                                                            |
| [frontend/vite.config.ts](frontend/vite.config.ts)                             | Add `server.proxy['/api']`                                           | Dev-only proxy to backend, port from launchSettings.json                                               | Existing plugin config — untouched.                                                                    |
| [frontend/package.json](frontend/package.json)                                 | Add deps from T4                                                     | TanStack Query, react-hook-form, zod, @hookform/resolvers, sonner                                      | All existing deps — untouched.                                                                         |

**Files to CREATE in this story:**

| Path                                           | Purpose                                                 |
| ---------------------------------------------- | ------------------------------------------------------- |
| `frontend/app/lib/api-fetch.ts`                | Shared HTTP boundary with token injection + 401 handler |
| `frontend/app/lib/auth.ts`                     | Token store: `getToken`, `setToken`, `clearAuth`        |
| `frontend/app/lib/query-client.ts`             | Singleton `QueryClient`                                 |
| `frontend/app/features/auth/types.ts`          | `MeResponse` and `AuthResponse` TS types                |
| `frontend/app/features/auth/use-me.ts`         | `useMe()` hook                                          |
| `frontend/app/features/auth/use-logout.ts`     | `useLogout()` hook                                      |
| `frontend/app/features/auth/login-form.tsx`    | Login form component                                    |
| `frontend/app/features/auth/register-form.tsx` | Register form component                                 |
| `frontend/app/routes/login.tsx`                | `/login` route page                                     |
| `frontend/app/routes/register.tsx`             | `/register` route page                                  |

shadcn-CLI-installed primitives (`button`, `input`, `label`, `form`, `sonner`) land under `frontend/app/components/ui/` automatically — do not list those individually here, and do NOT hand-write them.

No backend models, migrations, or schema changes in this story. The user/household/membership tables are already in `database/schema.sql`.

### Hardcoded Norwegian copy is fine for v1 auth chrome

i18n (`react-i18next`) lands in Story 6.1. For now, login/register form labels and error messages are Norwegian strings inline. Use sentence-case Norwegian: "Brukernavn eller e-post", "Passord", "Logg inn", "Registrer", "Brukernavn er allerede i bruk." (echo what the backend returns). Do NOT introduce a `t(…)` call now — that creates a half-built i18n setup the next story has to clean up.

### Things that look tempting but are out of scope

- Adding a backend `/api/auth/logout` endpoint or a server-side token blocklist.
- Refresh tokens, HttpOnly cookie auth, "remember me", session timeout warnings.
- Password reset / forgot password / email verification.
- Centralized `<RequireAuth>` route guards or a `<RequireHousehold>` guard — Story 1.3.
- Building an Account screen or putting a logout button anywhere in the UI — Story 6.1.
- Onboarding screens (create/join household) — Story 1.4.
- Removing or refactoring the deprecated `client-react/` auth code.
- Replacing the existing `app.UseCors("react")` policy with a dev-only variant.
- Writing automated tests — there is no test suite in the repo today (per Story 1.1 dev notes). Verification is manual smoke per T7.
- Putting a `apiFetch` retry / backoff layer in. Add when a feature needs it.
- Adding a global error boundary toast for unexpected `ApiError`s. Inline rendering is enough for v1 auth.

### Cross-cutting rules — non-negotiable

- New frontend code lives in `frontend/`. Never in `client-react/`.
- Same-origin in production. No production CORS.
- Use `apiFetch` for ALL `/api/*` calls.
- Use TanStack Query for server state. Never `useState` + `useEffect` to fetch.
- Use shadcn CLI for component primitives — never hand-author into `app/components/ui/`.
- Backend errors are `{ message: string }`; HTTP 409 for business rule conflicts, 400 for validation, 401 for auth, 404 for missing.
- Household authorization is server-side from `Medlemmer`. Never trust the JWT `householdId` claim for authorization.

### React Router 7 SPA mode reminder

Story 1.1 set `ssr: false` and added `MapFallbackToFile("index.html")`. That means:

- Adding new top-level routes in [frontend/app/routes.ts](frontend/app/routes.ts) is purely client-side; the .NET fallback serves `index.html` for any unmatched path including `/login` and `/register`.
- `useNavigate()` and `<Link>` work as expected client-side; hard refreshes also resolve via SPA fallback.
- `apiFetch`'s 401 handler must use `window.location.assign('/login')` (not `useNavigate`) because it runs from a TanStack Query callback context, not a React render. A hard nav also clears any in-memory state that would otherwise leak across the auth boundary (AC4 "stale household screens are no longer visible") — even though those screens don't exist yet, the contract is forward-compatible with Story 1.3.

### Testing standards summary

- No automated tests in the repo today; this story does not introduce a test framework (architecture §Test Organization: tests added "if added", focused on demo loop).
- Manual smoke verification per T7 is the source of truth. Document the four verification results in the Completion Notes List.
- If a smoke check fails, fix the root cause; do not catch and ignore errors to mask problems. The whole point of `apiFetch`'s 401 handler is to behave predictably — silencing it would defeat AC4.

### Project Structure Notes

- The architecture project tree expects `frontend/app/lib/{api-fetch.ts, query-client.ts, auth.ts}` and `frontend/app/features/auth/`. This story creates exactly those.
- `frontend/app/features/auth/` is the first feature folder. Establish the convention here: feature-local hooks (`use-*.ts`), components (kebab-case `.tsx`), and types (`types.ts`). Later stories will add `features/household`, `features/recipes`, etc. (architecture §Source Organization).
- Do NOT create `i18n.ts`, `dates.ts`, or any file from the architecture tree that is not used by this story. They land when their first consumer does.

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication-&-Security]
- [Source: _bmad-output/planning-artifacts/architecture.md#API-&-Communication-Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend-Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#State-Management-Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Service-Boundaries]
- [Source: _bmad-output/planning-artifacts/architecture.md#Important-Watchpoints] (dev proxy / CORS scope)
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation-Sequence] (steps 2–3: dependencies, then `apiFetch` + auth + `/api/auth/me` + gating — gating is Story 1.3)
- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.2]
- [Source: _bmad-output/planning-artifacts/epics.md#Additional-Requirements] (JWT v1, no refresh, server-side tenancy, `react-hook-form` + `zod`, `sonner`, Vite dev/prod CORS isolation)
- [Source: _bmad-output/planning-artifacts/prd.md:259] (password recovery is OUT of v1)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#auth-flow] (lines 392–408, gating diagram)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md:720] (inline feedback for invalid login)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md:728] (forms keep user on screen after recoverable errors)
- [Source: AGENTS.md] (shadcn CLI, Context7, frontend-design rules)
- [Source: backend/Controllers/AuthController.cs] (existing register/login behavior)
- [Source: backend/Controllers/HandlelisteController.cs:159-175] (canonical `GetUserId` / `GetHouseholdId` pattern to follow)
- [Source: backend/Controllers/HusholdningController.cs:25-27] (canonical `Include(Husholdning).FirstOrDefault(UserId)` membership lookup)

### Previous story intelligence — Story 1.1 ([1-1-spa-foundation-starter-setup-and-production-hosting.md](_bmad-output/implementation-artifacts/1-1-spa-foundation-starter-setup-and-production-hosting.md))

Story 1.1 just landed (status `review` at story-creation time). Key carry-overs that affect Story 1.2:

- **SPA mode is on** (`ssr: false`). Adding new client routes is route-config only; no server bundle.
- **`backend/Program.cs` middleware order**: `UseCors("react") → UseDefaultFiles → UseStaticFiles → UseAuthentication → UseAuthorization → MapControllers → MapFallbackToFile("index.html")`. Do not reorder. New `[Authorize]` actions on `AuthController` are fine — `UseAuthentication`/`UseAuthorization` already run.
- **Dev CORS policy `app.UseCors("react")` is in active use** by the deprecated client-react app and (until T2c lands) by the new dev frontend. Do not remove or scope to dev-only in this story.
- **Build hand-off**: root `npm run build` empties `backend/wwwroot/` and copies `frontend/build/client/*` into it via `scripts/copy-frontend-to-wwwroot.mjs`. New routes are part of the static bundle and ship via that pipeline. No additional build step needed here.
- **Verification gotcha**: on Windows, an orphaned `backend.exe` from a prior `dotnet run` can hold port 5188 and serve a stale binary. If `/api/auth/me` returns 404 after adding it, check `tasklist | findstr backend.exe` and kill any stale PID before debugging the controller.
- **`frontend/Dockerfile` and `frontend/package.json` `start` script** are obsolete (SPA mode); leave them alone in this story too.

### Git intelligence — recent commits

Last 5 commits as of story creation:

- `a49039e Update App.jsx` — change to deprecated `client-react/src/App.jsx`. Ignore.
- `c71bd65 Endret varer endepunkter` — backend product endpoints. Not related.
- `867cd86 Release v8 - added recipe categories support` — recipe categories. Not related.
- `9d215b5 Update OppskrifterController.cs` — recipes. Not related.
- `6093fe0 Update OppskrifterController.cs` — recipes. Not related.

No commits touching `AuthController.cs` or `frontend/app/lib/` in recent history. This story is the first auth work since the brownfield baseline.

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (Claude Opus 4.7, 1M context)

### Debug Log References

- Frontend `npm run typecheck`: ✅ clean (after creating `frontend/app/lib/utils.ts` — see notes below)
- Frontend `npm run build`: ✅ clean — login (`login-BQawVZ--.js`) and register (`register-Cu70TFdc.js`) chunks generated; QueryClient bundled into `query-client-tYr42agb.js`
- Backend `dotnet build`: ✅ 0 errors, 2 pre-existing warnings (CS8602 in `VarelagerController`, EF1002 in `HusholdningController`), unrelated to this story.

### Completion Notes List

**Code-level evidence for ACs:**

- **AC1 (`/api/auth/me` shape + server-resolved household):** Endpoint added at [backend/Controllers/AuthController.cs](backend/Controllers/AuthController.cs) `Me()`. Resolves `userId` from `ClaimTypes.NameIdentifier`, then loads membership via `_db.Medlemmer.Include(x => x.Husholdning).FirstOrDefaultAsync(x => x.UserId == userId)`. Returns the new `MeResponse` DTO. **`grep` of `AuthController.cs` confirms no `User.FindFirstValue("householdId")` call exists** — the JWT `householdId` claim is never read on this code path, satisfying the "do not trust JWT for tenancy" rule.
- **AC2 (registration creates account + authenticates):** [`register-form.tsx`](frontend/app/features/auth/register-form.tsx) posts `RegisterRequest`-shaped payload to `/api/auth/register` (existing endpoint), then `setToken(response.token)` + `queryClient.setQueryData(['me'], …)` + `navigate('/app')`. Validation errors render inline (zod schema), and 400 messages are mapped to the appropriate field via `setError`.
- **AC3 (login → JWT-backed session, survives reload):** [`login-form.tsx`](frontend/app/features/auth/login-form.tsx) posts `LoginRequest` to `/api/auth/login`, persists token via `setToken` (writes to `localStorage["ccs.auth.token"]`). On reload, [`use-me.ts`](frontend/app/features/auth/use-me.ts) reads the token via `getToken()` and gates the `useQuery` `enabled` flag — token-bearing visitors automatically rehydrate identity from `/api/auth/me`.
- **AC4 (session recovery on 401):** [`api-fetch.ts`](frontend/app/lib/api-fetch.ts) intercepts every `/api/*` 401 response → calls `clearAuth()`, `queryClient.clear()`, and `window.location.assign("/login")` (skipped if already on `/login` to avoid double-nav loops on bad-credential login attempts). Implemented as a single `if (response.status === 401)` branch before the generic error path.
- **AC5 (logout client-side):** [`use-logout.ts`](frontend/app/features/auth/use-logout.ts) clears the token, wipes the query cache, and routes to `/login`. No backend endpoint added (per story scope; JWT is stateless).

**Out-of-scope-but-required prerequisite I had to add:**

- Created [frontend/app/lib/utils.ts](frontend/app/lib/utils.ts) with the standard shadcn `cn` helper (`twMerge(clsx(…))`). The shadcn primitives shipped by Story 1.1 (`button.tsx`, `input.tsx`, `label.tsx`) all import `~/lib/utils`, but that file did not exist in the repo — typecheck failed without it. Both `clsx` and `tailwind-merge` were already in `frontend/package.json` deps from the original starter, so no new dependency was added; only the helper itself. This is a Story 1.1 gap surfaced by Story 1.2 — flagging here for retrospective awareness.

**shadcn `form` primitive unavailable in this preset:**

- The starter uses the `base-maia` shadcn style preset (Base UI, not Radix). Running `npx shadcn@latest add form` succeeded silently without writing any file; `npx shadcn@latest view form` confirmed the registry entry has no `files` field for this preset. The auth forms therefore use `react-hook-form`'s `register()` API directly with the installed `Input`, `Label`, and `Button` primitives — errors render via plain `<p className="text-sm text-destructive">` rather than a `<FormMessage />` wrapper. No primitive was hand-authored into `app/components/ui/`, honoring AGENTS.md.

**Patched generated `sonner.tsx`:**

- The shadcn-generated [`app/components/ui/sonner.tsx`](frontend/app/components/ui/sonner.tsx) imports `next-themes` (a Next.js helper). This repo is a React Router 7 SPA, so the import would fail typecheck and add a useless dependency. Patched the file to drop the `useTheme` call and pass `theme="system"` directly. This is a one-line deviation from the CLI output but keeps the file's overall structure (sonner mount + lucide icon overrides + CSS variable wiring) intact.

**T7 manual smoke checks pending the user (browser + DB required):**

The local environment for T7 needs MySQL running on `localhost:3306` (`matlager_db`) plus a browser to exercise localStorage and 401-redirect behavior. I cannot perform those from inside this agent. The remaining checks for the user to run:

1. `cd backend && dotnet run` (port 5188).
2. `cd frontend && npm run dev` (Vite default port; `/api` is now proxied to backend per `vite.config.ts`).
3. **AC2/AC3:** Visit `/register`, register a unique user. Confirm `localStorage["ccs.auth.token"]` is set. Reload — the `useMe()` query should re-run automatically (visible in devtools Network as a `GET /api/auth/me`).
4. **AC1 shape:** Inspect that `GET /api/auth/me` 200 response body is `{ userId, brukernavn, email, householdId: null, householdName: "", householdRole: null }` for the freshly-registered user.
5. **AC4:** In devtools Application → Local Storage, change `ccs.auth.token` to gibberish, then reload. Expect a 401, token cleared, and `window.location.pathname === '/login'`.
6. **AC5:** From devtools console, run `import('/app/lib/auth.ts').then(m => m.clearAuth())` (or `localStorage.removeItem('ccs.auth.token')`) and reload. Confirm subsequent requests no longer carry `Authorization`.

Once those four items pass, T7 can be checked off and the story moved to `review`.

### File List

**Backend (modified):**

- `backend/Controllers/AuthController.cs` — added `Me()` action + `using Microsoft.AspNetCore.Authorization;`
- `backend/DTOs/AuthDtos.cs` — added `MeResponse` class

**Frontend (modified):**

- `frontend/package.json` / `frontend/package-lock.json` — added `@tanstack/react-query`, `react-hook-form`, `zod`, `@hookform/resolvers`, `sonner`
- `frontend/vite.config.ts` — added `server.proxy['/api']` → `http://localhost:5188`
- `frontend/app/root.tsx` — wrapped `<Outlet />` in `<QueryClientProvider>`, mounted `<Toaster />`
- `frontend/app/routes.ts` — added `login` and `register` routes
- `frontend/app/components/ui/sonner.tsx` — patched to drop `next-themes` import (CLI-installed file)

**Frontend (created):**

- `frontend/app/lib/api-fetch.ts` — shared HTTP boundary (`apiFetch`, `ApiError`)
- `frontend/app/lib/auth.ts` — token store (`getToken`, `setToken`, `clearAuth`)
- `frontend/app/lib/query-client.ts` — singleton `QueryClient`
- `frontend/app/lib/utils.ts` — shadcn `cn` helper (Story 1.1 gap fix, see notes)
- `frontend/app/features/auth/types.ts` — `MeResponse`, `AuthResponse`
- `frontend/app/features/auth/use-me.ts` — `useMe()` hook
- `frontend/app/features/auth/use-logout.ts` — `useLogout()` hook
- `frontend/app/features/auth/login-form.tsx` — login form
- `frontend/app/features/auth/register-form.tsx` — register form
- `frontend/app/routes/login.tsx` — `/login` page
- `frontend/app/routes/register.tsx` — `/register` page

**Frontend (CLI-generated shadcn primitives, kept as-is unless noted):**

- `frontend/app/components/ui/button.tsx`
- `frontend/app/components/ui/input.tsx`
- `frontend/app/components/ui/label.tsx`

### Change Log

| Date       | Description                                                                                                 |
| ---------- | ----------------------------------------------------------------------------------------------------------- |
| 2026-04-30 | Story created, status: ready-for-dev.                                                                       |
| 2026-04-30 | Implementation: T1–T6 complete, T7 pending user browser smoke (DB + browser required). Status: in-progress. |
