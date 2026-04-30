# Story 1.1: SPA Foundation, Starter Setup, and Production Hosting

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an app user,
I want the web app to load reliably on direct visits and refreshes,
So that I can enter ChopChopShop without route errors or deployment-specific workarounds.

**Requirements traced:** FR54; NFR1, NFR4, NFR15, NFR21, NFR22, NFR23, NFR24; UX-DR1, UX-DR44, UX-DR45.

## Acceptance Criteria

**AC1 — Starter is the documented shadcn React Router preset**

- **Given** the architecture-selected starter is the shadcn React Router/Vite preset
- **When** the canonical frontend foundation is verified or initialized
- **Then** it uses `npx shadcn@latest init --preset b1sljUX6A --base base --template react-router`
- **And** any starter adaptation remains compatible with the brownfield .NET-hosted SPA model.

**AC2 — Canonical frontend is `frontend/` and runs in SPA/static mode**

- **Given** the canonical frontend exists in `frontend/`
- **When** the app is built for production
- **Then** React Router is configured for SPA/static mode with `ssr: false`
- **And** new frontend work is not added to deprecated `client-react/`.

**AC3 — Backend serves SPA fallback for client routes; `/api/*` keeps resolving**

- **Given** the backend serves the production app
- **When** a user requests a client route such as `/app/chef` directly
- **Then** the .NET backend serves `index.html` through SPA fallback
- **And** `/api/*` routes continue to resolve to API controllers.

**AC4 — Build output ships from `backend/wwwroot` as one .NET service**

- **Given** the frontend build completes
- **When** production assets are prepared
- **Then** static frontend output can be served from backend `wwwroot`
- **And** the deployment shape remains one .NET service serving both API and SPA.

## Tasks / Subtasks

- [x] **T1: Verify starter, lock SPA mode** (AC: 1, 2)
  - [x] Confirm `frontend/package.json` already reflects the shadcn React Router preset (React 19, React Router 7.13.1, Tailwind v4, Base UI, lucide, shadcn 4.6.0). No re-init needed unless the preset signature is missing — re-running `npx shadcn@latest init --preset b1sljUX6A --base base --template react-router` would clobber `frontend/`. Treat AC1 as "verify" in this brownfield repo, not "re-run".
  - [x] Edit [frontend/react-router.config.ts](frontend/react-router.config.ts): change `ssr: true` → `ssr: false`. This is the documented "first implementation priority" from architecture §Implementation Handoff.
  - [x] Do NOT touch [client-react/](client-react/). It is deprecated; leave it in place untouched.

- [x] **T2: Produce a static SPA build artifact** (AC: 2, 4)
  - [x] Run `npm run build` inside `frontend/`. With `ssr: false`, React Router 7 emits a static SPA into `frontend/build/client/` (containing `index.html`, hashed JS/CSS, and `assets/`). There is no longer a usable `frontend/build/server/` for production hosting.
  - [x] The existing `start` script (`react-router-serve ./build/server/index.js`) and the `@react-router/serve` dependency are obsolete in SPA mode. Leave them untouched in this story unless a follow-up cleanup is requested — do not remove dependencies as scope creep.
  - [x] [frontend/Dockerfile](frontend/Dockerfile) ships a Node-only frontend container. It conflicts with the documented one-service .NET deployment shape. Do NOT use it for production. Leave the file in place this story; a later story may remove it. Add a one-line note about this in completion notes if it stays.

- [x] **T3: Wire static-file hosting + SPA fallback into the .NET backend** (AC: 3, 4)
  - [x] Edit [backend/Program.cs](backend/Program.cs). After `app.MapControllers();` add:
    - `app.UseDefaultFiles();` (so `/` serves `index.html` from wwwroot)
    - `app.UseStaticFiles();` (so hashed JS/CSS/asset paths under `wwwroot` resolve)
    - `app.MapFallbackToFile("index.html");` (so unmatched non-API routes return the SPA shell — this is the SPA-fallback for hard refreshes on `/app/*`)
  - [x] Order matters in ASP.NET Core. The fallback must come AFTER `MapControllers()` so `/api/*` routes still match controllers first. The static-file middleware should sit before `UseAuthentication()` is fine — but for clarity place `UseDefaultFiles`/`UseStaticFiles` near the other middleware (after `UseCors`), and place `MapFallbackToFile` at the end of the routing pipeline.
  - [x] Confirm controllers all live under `/api/*` (existing controllers use `[Route("api/...")]` — verify with a quick scan of `backend/Controllers/*.cs`). The fallback only kicks in for unmatched requests, but a misrouted controller would silently fall through to `index.html` and confuse the dev. If any controller is found without an `api/` prefix, flag it in completion notes — do not refactor it in this story.

- [x] **T4: Make the `wwwroot` build hand-off concrete** (AC: 4)
  - [x] Create `backend/wwwroot/` if it does not exist. The folder currently does not exist in the repo (verified). It must exist before `UseStaticFiles()` runs against it; `UseStaticFiles` will throw on startup if the path is missing.
  - [x] Add a step that copies `frontend/build/client/*` into `backend/wwwroot/` for production builds. Pick the simplest option that fits the current root scripts pattern in [package.json](package.json):
    - Add a root `build` script: `cd frontend && npm run build && node -e "..."` (or use `cpy-cli`/`shx` if you prefer a cross-platform tool — but no new global deps; install dev-only at the root if needed).
    - Cross-platform note: `cp -r` does not exist on Windows PowerShell. The user dev environment is Windows 11 (verified). Prefer Node's `fs.cpSync` via a small inline `node -e` invocation, or add `shx` as a root devDependency if the inline form gets unwieldy. Keep the change tiny.
    - Wwwroot must be **emptied** before copy so stale hashed bundles do not pile up. Either `rm -rf` equivalent or `shx rm -rf backend/wwwroot/*` then copy.
  - [x] Add a `.gitignore` rule so built assets do not get committed: append `backend/wwwroot/*` and `!backend/wwwroot/.gitkeep` to the root `.gitignore`. Add an empty `backend/wwwroot/.gitkeep` so the folder is preserved.
  - [x] Wwwroot is a build output, not a source. Do not commit any built artifact in this story.

- [x] **T5: Verify dev mode still works (no production CORS dependency)** (AC: 3)
  - [x] Dev flow stays as today: `npm run dev` at root runs backend (`dotnet run` on its own port) and frontend (`react-router dev` Vite on its own port) concurrently. The frontend hits the backend across origins in dev only. The existing dev-only CORS policy in [backend/Program.cs](backend/Program.cs) (`AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()`) is acceptable for development. Do not extend its use to production routing assumptions — production is same-origin (NFR22, NFR24).
  - [x] Do NOT remove or rename `app.UseCors("react")` in this story. It is in active use by the dev frontend. A later story may scope it to development-only.

- [x] **T6: Manual verification before marking complete** (AC: 1, 2, 3, 4)
  - [x] Run `npm run build` inside `frontend/`. Confirm `frontend/build/client/index.html` exists and references hashed `/assets/*.js` paths (not absolute external URLs).
  - [x] Run the build hand-off (T4) and confirm `backend/wwwroot/index.html` and `backend/wwwroot/assets/` exist.
  - [x] Run `dotnet run` from `backend/`. Hit:
    - `GET /` → returns `index.html` (200, `text/html`).
    - `GET /assets/<known-hashed-file>.js` → returns the JS bundle (200, `application/javascript`).
    - `GET /app/chef` directly (no client navigation) → returns `index.html` (200, `text/html`). This proves SPA fallback. Even though `/app/chef` is not yet a client route in [frontend/app/routes.ts](frontend/app/routes.ts), the fallback must still serve `index.html` rather than 404.
    - `GET /api/oppskrifter` (or any existing controller path) → still routes to the controller, NOT to `index.html`. The expected response is whatever the controller normally returns (200 JSON, 401 if JWT-gated, etc.). The signal that proves correctness is `Content-Type: application/json` (or a 401 with no HTML body) — anything returning `text/html` with the SPA shell means the fallback ate the API route.
  - [x] Document the four results in the Completion Notes List below.

### Review Findings

- [x] [Review][Patch] Prevent SPA fallback from handling `/api/*` misses [backend/Program.cs:85]
- [x] [Review][Patch] Make the canonical `frontend/` source reproducible from the root repository [frontend/.git]
- [x] [Review][Patch] Wire the frontend build hand-off into the production publish/deploy path [backend/backend.csproj:1]
- [x] [Review][Patch] Resolve the Story 1.1 scope mismatch around preset UI/lib files [frontend/app/routes/home.tsx:1]

## Dev Notes

### What this story is and is NOT

This story is the **deployment-shape foundation**. It guarantees that the frontend builds as a static SPA and that the .NET backend serves it correctly on hard refresh. It is NOT yet:

- The app shell, bottom nav, or `/app/*` route tree (Story 1.3).
- TanStack Query, react-hook-form, zod, sonner, react-i18next, date-fns, or `react-swipeable-list` setup. Those are app-level dependencies installed when the first feature actually needs them — do **not** install them all up-front in this story.
- Auth providers, `apiFetch`, or `/api/auth/me` (Story 1.2).
- Any database migrations or backend feature work.

Resist scope creep. The architecture document explicitly orders these in §Implementation Sequence. Story 1.1 is step 1 only.

### Tech versions in play (from `frontend/package.json`, verified at story-creation time)

- React 19.2, React Router 7.13.1, Vite 7.3, TypeScript 5.9
- Tailwind CSS v4.2 via `@tailwindcss/vite`
- shadcn 4.6, Base UI 1.4, lucide-react 1.14, `@fontsource-variable/geist`
- Backend: .NET 8 (`net8.0`), Pomelo MySQL 8.0.2, JWT bearer auth already wired

These match the architecture's selected stack. Do not bump versions in this story.

### React Router 7 SPA mode — what `ssr: false` actually does

When `ssr: false` is set in `react-router.config.ts`, `react-router build` produces a single-page client build only:

- Output goes to `frontend/build/client/`
- `index.html` is the SPA shell that loads the hashed JS/CSS bundles
- No server bundle is produced under `frontend/build/server/`
- React Router still generates type-safe routes (`react-router typegen`) and supports the file-based route convention defined in [frontend/app/routes.ts](frontend/app/routes.ts)
- Client-only loaders and actions still work; server loaders/actions become unsupported (which is fine — the architecture requires TanStack Query for server state, not loaders).

### Hosting model — same-origin, one .NET service

Architecture §Infrastructure & Deployment defines the model exactly:

```
Frontend (Vite/React Router build)
   └── static output → backend/wwwroot/
                            ├── index.html           (SPA shell)
                            ├── assets/...           (hashed JS/CSS)
                            └── ...

.NET service (Railway):
   /api/*                   → controllers
   /assets/*, /favicon.ico  → UseStaticFiles
   /                        → UseDefaultFiles → index.html
   /app/* and other client routes
                            → MapFallbackToFile("index.html")
```

Production has **no** CORS dependency (NFR22). Dev keeps cross-origin via the existing `react` CORS policy.

### Existing repo state — verified at story-creation time

- [frontend/](frontend/) exists, scaffolded from the shadcn React Router preset.
- [frontend/react-router.config.ts](frontend/react-router.config.ts) currently has `ssr: true` — must be flipped (this is the "important watchpoint" called out in architecture §Gap Analysis).
- [frontend/app/routes.ts](frontend/app/routes.ts) contains only `index("routes/home.tsx")`. That is fine for this story — `/app/*` routes are added in Story 1.3. The SPA fallback test does not need a real `/app/chef` route to pass; it only needs `index.html` to be returned for unmatched paths.
- [frontend/app/components/](frontend/app/components/) only contains `ui/` (empty so far). No shadcn components have been installed yet. Do not install any in this story — components come on a per-feature basis through the shadcn CLI (per AGENTS.md repo instruction).
- [backend/Program.cs](backend/Program.cs) currently has no static-file or SPA fallback wiring — confirmed.
- `backend/wwwroot/` does **not** yet exist — confirmed. Must be created (T4).
- [client-react/](client-react/) is deprecated and must be left untouched. The most recent commit (`a49039e Update App.jsx`) is a change to `client-react/src/App.jsx`. Ignore client-react going forward.

### Cross-cutting rules — non-negotiable from architecture

- New frontend code lives in `frontend/`. Never in `client-react/`.
- Same-origin in production. No production CORS rules.
- Existing controllers, DTOs, models, SQL files, and seed data are preserved. This story only adds middleware to `Program.cs`.
- No EF migrations. No new DB work in this story at all.
- Do not introduce a second frontend, a Node production server, or SSR.

### Files to UPDATE (not create) in this story

| Path | Change |
|---|---|
| [frontend/react-router.config.ts](frontend/react-router.config.ts) | Flip `ssr: true` → `ssr: false` |
| [backend/Program.cs](backend/Program.cs) | Add `UseDefaultFiles`, `UseStaticFiles`, `MapFallbackToFile("index.html")` |
| [package.json](package.json) (root) | Add a root `build` script that runs the frontend build and copies `frontend/build/client/*` → `backend/wwwroot/`. Cross-platform aware. |
| `.gitignore` (root) | Ignore `backend/wwwroot/*` except `.gitkeep` |

### Files to CREATE in this story

| Path | Purpose |
|---|---|
| `backend/wwwroot/.gitkeep` | Preserve empty wwwroot in git |

No other files are created. Specifically: no new components, no new routes, no `app/lib/*` files, no providers. Those belong to later stories.

### Things that look tempting but are out of scope

- Removing `@react-router/serve` and `@react-router/node` from `frontend/package.json` — leave for a later cleanup.
- Deleting `frontend/Dockerfile` — leave for a later cleanup.
- Adding `app.UseHttpsRedirection()`, security headers, response compression, or production logging — none requested. Add separately when prioritized.
- Adding any TanStack Query / auth provider scaffolding to `frontend/app/root.tsx` — Story 1.2/1.3.
- Touching the dev CORS policy — leave alone.

### Testing standards summary

There is no formal frontend or backend test suite in the repo today. This story does not add one. Verification is manual smoke testing per Task T6. Record the four `curl`/browser results in Completion Notes.

If a smoke check fails, fix the root cause; do not add error swallowing or fallbacks to mask routing problems. The whole point of this story is for routing to be obviously correct.

### Project Structure Notes

- The architecture project tree shows `backend/wwwroot/` as the build target. This story creates that directory.
- The architecture tree implies a `frontend/app/lib/api-fetch.ts`, `query-client.ts`, etc. Those belong to **Story 1.2**, not 1.1. Do not create them in this story.
- The architecture tree implies `frontend/app/components/AppShell.tsx`, `BottomNav.tsx`, `DetailSheet.tsx`, `SwipeActionRow.tsx`. Those belong to **Story 1.3** and feature stories. Do not create them in this story.

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Selected-Starter:-shadcn-React-Router-Preset]
- [Source: _bmad-output/planning-artifacts/architecture.md#Required-Starter-Adaptations]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend-Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure-&-Deployment]
- [Source: _bmad-output/planning-artifacts/architecture.md#Important-Local-Configuration-Note]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation-Handoff] (first implementation priority is `ssr: false`)
- [Source: _bmad-output/planning-artifacts/epics.md#Additional-Requirements] (deployment + SPA model rules)
- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.1] (acceptance criteria)
- [Source: AGENTS.md] (shadcn CLI rule, Context7 rule, frontend-design rule)
- [React Router 7 SPA mode docs] — verify with Context7 if any detail is unclear before changing config

## Dev Agent Record

### Agent Model Used

claude-opus-4-7[1m]

### Debug Log References

- Initial smoke test (round 1) returned 404 on `/`, `/assets/*`, `/app/chef`. Root cause: an orphaned backend.exe (PID 4572) from a prior `dotnet run` attempt was still bound to port 5188 and serving the OLD `Program.cs` (no static-file middleware). Killed via `taskkill /F /PID 4572`, then restarted `dotnet run`. Round 2 returned the expected 200/200/200/401 sequence. Lesson: when iterating on `Program.cs` on Windows, the previous run's `backend.exe` can hold the port and binary lock; verify the running PID matches the latest build before troubleshooting middleware.

### Completion Notes List

**Manual verification results (T6):**

| Request | Status | Content-Type | Notes |
|---|---|---|---|
| `GET /` | 200 | `text/html` | SPA shell (`index.html`) returned, references `/assets/manifest-e820d268.js` and other hashed bundles. |
| `GET /assets/entry.client-CEf5XKd0.js` | 200 | `text/javascript` | 190,541 bytes — hashed JS bundle served by `UseStaticFiles` from `backend/wwwroot/assets/`. |
| `GET /app/chef` | 200 | `text/html` | SPA fallback works: unmatched non-API path returns `index.html` (no client route exists yet — that's Story 1.3). |
| `GET /api/oppskrifter` | 401 | _empty_ | Controller hit, NOT swallowed by SPA fallback. JWT bearer challenge. No HTML body — proves `/api/*` resolves to controllers first. |

**Other notes:**

- All existing controllers were verified to use `[Route("api/...")]` prefixes (10/10) — no risk of an API path leaking through the SPA fallback. No refactor needed.
- `frontend/Dockerfile` is left untouched. It is a Node-only frontend container that conflicts with the documented one-service .NET deployment shape; do not use it for production. A later cleanup story may remove it.
- `frontend/package.json` `start` script (`react-router-serve`) and the `@react-router/serve` / `@react-router/node` dependencies are now obsolete in SPA mode but left in place per story scope. A later cleanup story may remove them.
- Dev CORS policy `app.UseCors("react")` left untouched — still required for cross-origin dev frontend. Production is same-origin and does not depend on CORS.
- Out of scope (deferred to later stories per Dev Notes): TanStack Query, react-hook-form, zod, sonner, react-i18next, date-fns, react-swipeable-list, app shell / bottom nav, `apiFetch`, `/api/auth/me`, `/app/*` route tree.

### File List

- `frontend/react-router.config.ts` — modified (`ssr: true` → `ssr: false`)
- `backend/Program.cs` — modified (added `UseDefaultFiles`, `UseStaticFiles`, constrained `MapFallbackToFile("index.html")` so `/api/*` misses stay 404)
- `backend/backend.csproj` — modified (runs root `npm run build` before publish unless `SkipFrontendBuild=true`)
- `package.json` — modified (added root `build` script)
- `.gitignore` — modified (ignore `backend/wwwroot/*` except `.gitkeep`, ignore `frontend/build/` and `frontend/.react-router/`)
- `backend/wwwroot/.gitkeep` — created (preserves empty wwwroot in git)
- `scripts/copy-frontend-to-wwwroot.mjs` — created (cross-platform Node script that empties `backend/wwwroot/` and copies `frontend/build/client/*` into it)
- `frontend/.git` — removed (root repository now owns the canonical frontend source tree)
- `frontend/app/routes/home.tsx` — modified (removed starter Button usage)
- `frontend/app/components/ui/button.tsx` — removed (out of Story 1.1 scope)
- `frontend/app/lib/utils.ts` — removed (out of Story 1.1 scope)

### Change Log

| Date | Description |
|---|---|
| 2026-04-30 | Initial implementation: SPA build mode, static-file hosting, SPA fallback, wwwroot build hand-off. Manual verification passed all four smoke checks. Status: review. |
| 2026-04-30 | Code review patches: exclude `/api/*` misses from SPA fallback, make frontend root-repo reproducible, wire frontend build into backend publish, remove out-of-scope starter UI/lib files. Status: done. |
