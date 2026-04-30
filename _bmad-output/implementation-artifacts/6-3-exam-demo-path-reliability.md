# Story 6.3: Exam Demo Path Reliability

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As the project demonstrator,
I want the full core workflow to be reliable with known data,
so that evaluators can understand the product without manual setup or fragile workarounds.

## Acceptance Criteria

1. **Full demo loop works from a clean or known environment**
   - **Given** a clean or known demo environment
   - **When** the demonstrator runs the core path
   - **Then** they can register or log in, create or join a household, browse recipes, plan a meal, generate suggestions, confirm shopping rows, purchase items, complete the trip, view cookbook history, rate a meal, and switch language/theme.

2. **Demo data is prepared without manual database edits**
   - **Given** seed or demo data is required
   - **When** the app is prepared for evaluation
   - **Then** recipe and household workflow data exists without manual database edits during the demo.

3. **Production-like client routes survive refresh**
   - **Given** the production-like app serves client routes
   - **When** the demonstrator hard-refreshes `/app/*`
   - **Then** the route recovers through SPA fallback.

4. **Smoke checks identify the broken demo step**
   - **Given** the demo path is verified
   - **When** automated or manual smoke checks run
   - **Then** failures identify the broken step clearly enough for the team to fix before evaluation.

## Tasks / Subtasks

- [ ] **T1: Define and document the exact exam demo script** (AC: 1, 4)
  - [ ] Add or update a concise demo checklist in an appropriate existing project doc or script output. Do not place it under `docs/_archive`, `docs/_prompts`, or `docs/_notes`.
  - [ ] Include concrete credentials for seeded users already documented in `database/Brukere-seed.sql`: `ola / ola123`, `kari / kari123`, `per / per123`, and `admin / admin123`.
  - [ ] Include the register/create-household path as a separate smoke path from the seeded login path, so both onboarding modes are covered.
  - [ ] List the exact route/action order: login/register -> onboarding if needed -> Chef -> Plan -> generate suggestions -> confirm selected rows -> Shop -> purchase rows -> purchase complete -> Book -> rate -> Account language/theme.
  - [ ] Keep the script operational and short. Avoid product-marketing copy; this is for exam reliability.

- [ ] **T2: Make demo data deterministic enough for the full loop** (AC: 1, 2)
  - [ ] Review `database/schema.sql`, existing `*-seed.sql` files, and the reset scripts before changing data.
  - [ ] Ensure a reset database has users, households, membership, recipe categories, recipes, ingredients, measurement units, and shopping-compatible ingredient data needed for generation.
  - [ ] Add a small explicit demo seed file only if the current seeds do not reliably support the full path. Prefer append-only deterministic inserts with stable IDs or guarded inserts over editing many unrelated seed files.
  - [ ] If adding a new seed file, include it in both `scripts/setup-db.ps1` and `scripts/setup-db.sh` in the correct dependency order.
  - [ ] Do not add pantry management, unit conversion, recipe creation, image upload, or new v2 demo features.
  - [ ] Do not create a cookbook table. Cookbook history must remain derived from purchased/archived recipe-derived shopping rows.

- [ ] **T3: Verify database reset and migration shape** (AC: 2, 4)
  - [ ] Confirm `npm run db:reset:win` or `npm run db:reset:linux` creates all tables currently expected by the backend, including `HusholdningInvitasjon`, `PlanlagteMaaltider`, `PlanlagteMaaltidEkskludertIngrediens`, `HandlelistePlanlagteMaaltider`, and the current `Handleliste` metadata columns.
  - [ ] Decide whether the existing versioned SQL files are only historical migrations or must also be applied in a deployed database update path. Document the decision in the demo/release notes if needed.
  - [ ] Verify seed imports use `utf8mb4` and do not introduce broken Norwegian display text in newly touched SQL.
  - [ ] Preserve the current SQL convention: Norwegian table names, snake_case columns, no EF migrations unless explicitly requested.

- [ ] **T4: Verify production static SPA hosting and hard refreshes** (AC: 3)
  - [ ] Preserve `frontend/react-router.config.ts` with `ssr: false`; do not re-enable React Router runtime SSR.
  - [ ] Preserve the root build path: `npm run build` must run `npm run build --prefix frontend` and `scripts/copy-frontend-to-wwwroot.mjs`.
  - [ ] Verify `frontend/build/client` is copied into `backend/wwwroot` and contains an `index.html`.
  - [ ] Verify `backend/Program.cs` serves static files and maps non-API fallback to `index.html` while leaving `/api/*` requests handled by controllers or normal API 404s.
  - [ ] Smoke hard refreshes for `/`, `/login`, `/register`, `/onboarding`, `/app/chef`, `/app/plan`, `/app/shop`, `/app/book`, and `/app/account` against the backend-served app, not only the Vite dev server.

- [ ] **T5: Verify same-origin API and deployment assumptions** (AC: 1, 3)
  - [ ] Confirm production-like frontend API calls use relative `/api/*` paths through `apiFetch`, not hard-coded Vite or localhost URLs.
  - [ ] Keep Vite proxy settings development-only in `frontend/vite.config.ts`.
  - [ ] Do not introduce a separate Node production server or production CORS dependency.
  - [ ] Check `backend/backend.csproj` frontend publish behavior and use `SkipFrontendBuild=true` only when intentionally bypassing frontend build during backend publish.
  - [ ] If Railway-specific config is added or changed, use Context7 first for current Railway/.NET deployment guidance and document the exact commands or variables used.

- [ ] **T6: Add a focused smoke-check harness if it lowers demo risk** (AC: 1, 4)
  - [ ] Prefer a small script or documented command sequence over broad new test infrastructure.
  - [ ] The smoke check should report step names clearly, for example `auth login`, `me`, `recipes`, `create planned meal`, `generate suggestions`, `confirm suggestions`, `purchase row`, `complete shopping`, `cookbook history`, and `rating`.
  - [ ] Use existing endpoints and seeded credentials. Do not bypass the app by writing directly to MySQL as the verification path.
  - [ ] Keep secrets out of scripts. Use local demo credentials only when they are already public seed data.
  - [ ] If UI automation is added, keep it scoped to the core demo loop and production-like backend-served app.

- [ ] **T7: Run final demo-readiness verification** (AC: 1, 2, 3, 4)
  - [ ] Run `npm run typecheck --prefix frontend`.
  - [ ] Run root `npm run build`.
  - [ ] Run the database reset path used by the team on the current OS.
  - [ ] Run or manually execute the smoke path from login/register through Account language/theme.
  - [ ] Serve the built backend app and hard-refresh `/app/*` routes.
  - [ ] Record any manual verification gaps in the story's Dev Agent Record rather than marking unverified steps complete.

## Dev Notes

### Scope boundaries

This story is about operational reliability for the exam demo path. It may touch seed data, reset scripts, build/copy scripts, backend static hosting, minimal demo documentation, and focused smoke checks.

It should not add new product features, new persistent preference storage, a new frontend app, a new API architecture, a cookbook table, broad UI polish, or deferred v2 capabilities. Story 6.2 owns core empty/error/loading/responsive/accessibility polish; reuse its results rather than reworking UI states here.

### Current state to preserve

- Branch must remain `feature/frontend-rebuild`.
- `frontend/` is the canonical frontend; do not modify deprecated `client-react/`.
- `frontend/react-router.config.ts` already sets `ssr: false` for static SPA mode.
- Root `package.json` already defines `npm run build` as frontend build plus `scripts/copy-frontend-to-wwwroot.mjs`.
- `scripts/copy-frontend-to-wwwroot.mjs` copies `frontend/build/client` into `backend/wwwroot` and fails clearly if the frontend build output is missing.
- `backend/backend.csproj` runs the root build before publish unless `SkipFrontendBuild=true`.
- `backend/Program.cs` currently uses static files and maps a non-API fallback to `index.html`.
- Vite dev proxy points `/api` to `http://localhost:5188`; production should still use same-origin relative `/api/*` calls.
- The database baseline in `database/schema.sql` already includes planned meals, ingredient exclusions, household invites, shopping metadata, and cookbook-related link tables.
- Existing reset scripts import `schema.sql` and seed files, but they do not import the versioned migration files separately. Treat that as a deliberate baseline-vs-migration question to verify, not as a reason to duplicate schema changes blindly.
- Current seed data includes known users and passwords in `database/Brukere-seed.sql`, households in `database/Husholdning-seed.sql`, memberships in `database/Medlemmer-seed.sql`, recipes in `database/Oppskrifter-seed.sql`, and ingredients in `database/Ingredienser-seed.sql`.
- No current seed file inserts `PlanlagteMaaltider`, `HandlelistePlanlagteMaaltider`, or pre-archived cookbook history. The intended demo can still create those through the app path; add seed rows only if the team wants a known partially prepared state.

### Implementation guidance

- Prefer verifying the real app path over creating artificial backdoors. The exam path should prove that frontend, API, database, and backend-served SPA routing agree.
- Keep demo data small and boring. A reliable two-user household and a few recipes with ordinary ingredient rows are more valuable than a large scenario.
- If adding a demo seed file, make it clear whether it is loaded by default reset scripts or only by an explicit demo command.
- Keep generated shopping suggestions manual-confirm and idempotent. Re-running generation or confirmation should not create duplicate active rows.
- Keep purchase completion idempotent. Repeating completion should not duplicate cookbook history.
- Maintain household authorization server-side through `Medlemmer`; never use demo shortcuts that trust household IDs from the client.
- Use existing API hooks and `apiFetch`; do not add direct frontend `fetch` calls for smoke-only functionality.
- New scripts should be cross-platform when practical. If separate PowerShell and Bash paths are needed, keep their step order equivalent.
- If a smoke script calls HTTP endpoints, make each failure include the step name, URL, status code, and short response body. Avoid dumping tokens or sensitive config.
- Do not let Swagger/development-only behavior become part of the production exam path.

### Suggested smoke path

Use this as the minimum full-loop script, whether manual or automated:

1. Reset database and start backend plus frontend or backend-served build.
2. Log in as seeded owner `ola / ola123` or register a new user.
3. If using a new user, create a household and confirm `/api/auth/me` reports membership.
4. Browse Chef and open a recipe with ingredients.
5. Add the recipe to the current Monday-anchored week with servings.
6. Open Plan, generate shopping suggestions, and confirm at least one non-duplicate selected row.
7. Open Shop, mark the row purchased, and confirm purchase completion.
8. Open Book and confirm cookbook history contains the completed meal.
9. Save a per-user rating for that meal.
10. Open Account and switch language and theme.
11. Hard-refresh `/app/chef`, `/app/plan`, `/app/shop`, `/app/book`, and `/app/account` in the backend-served build.

### Previous story intelligence

Story 6.2 is the immediate predecessor and may still have uncommitted implementation work:

- Story 6.2 owns UI state clarity, localization coverage, responsiveness, keyboard access, reduced motion, and route-level polish.
- Do not revert or overwrite in-progress Story 6.2 files such as `frontend/app/lib/i18n.ts`, route files under `frontend/app/routes/app`, `frontend/package.json`, `frontend/package-lock.json`, or newly added state components.
- Build on Story 6.2's translated copy and error handling. Story 6.3 should verify the demo path, not duplicate the polish pass.

Story 6.1 and earlier epic learnings still apply:

- Reuse the existing theme and language providers; do not add another settings system.
- Account preferences are local browser preferences for v1.
- All app screens remain mobile-first and centered on desktop.
- All frontend HTTP calls go through `apiFetch`.
- TanStack Query owns server state and targeted invalidation.
- Root `npm run build` is the deployment-shape verification because the frontend is served from the .NET backend output.

### Git intelligence

Current branch at story creation time is `feature/frontend-rebuild`, matching the project rule.

Recent relevant commits:

- `17afae9 feat(polish): ratings, i18n, settings, empty/error/loading states, a11y`
- `cb37137 feat(cookbook): history search, sorting, and re-planning from book route`
- `299ec37 feat(shopping): complete shopping trip and archive list`
- `59da867 feat(shopping): purchase, restore, and archive shopping rows`
- `d3f7986 feat(shopping): active shopping list with manual items and editing`

Working tree note at story creation time: frontend i18n/route/package files already had uncommitted changes, `frontend/pnpm-lock.yaml` was deleted, and `frontend/app/components/route-error-retry.tsx` was untracked. Treat these as current user or in-progress work and do not revert them.

### Latest technical information

Context7 was used for current React Router documentation (`/remix-run/react-router`) around SPA/static deployment:

- `ssr: false` in `react-router.config.ts` disables runtime server rendering.
- With `ssr: false`, React Router pre-renders a static `index.html` and bundles assets for SPA deployment.
- The project already matches this requirement in `frontend/react-router.config.ts`.

If implementation changes ASP.NET Core static-file hosting, Railway deployment config, React Router build config, Vite, or any library/API setup, run Context7 first with the full implementation question before relying on memory.

### Testing standards summary

Minimum verification:

- `npm run typecheck --prefix frontend`
- `npm run build`
- Database reset on the team's current OS.
- Backend-served build smoke, not only Vite dev server smoke.
- Hard refresh on `/app/*` routes.
- Full manual or scripted demo loop from auth through cookbook rating and Account language/theme.

## References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-6.3]
- [Source: _bmad-output/planning-artifacts/prd.md#Demo-&-Operational-Capabilities]
- [Source: _bmad-output/planning-artifacts/prd.md#Reliability]
- [Source: _bmad-output/planning-artifacts/prd.md#Integration-&-Deployment]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend-Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure-&-Deployment]
- [Source: _bmad-output/planning-artifacts/architecture.md#Development-Workflow-Integration]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Testing-Strategy]
- [Source: _bmad-output/project-context.md]
- [Source: _bmad-output/implementation-artifacts/6-2-core-empty-error-loading-responsive-and-accessibility-polish.md]
- [Source: package.json]
- [Source: frontend/react-router.config.ts]
- [Source: frontend/vite.config.ts]
- [Source: scripts/copy-frontend-to-wwwroot.mjs]
- [Source: scripts/setup-db.ps1]
- [Source: scripts/setup-db.sh]
- [Source: backend/Program.cs]
- [Source: backend/backend.csproj]
- [Source: database/schema.sql]
- [Source: database/Brukere-seed.sql]
- [Source: database/Husholdning-seed.sql]
- [Source: database/Medlemmer-seed.sql]
- [Source: database/Oppskrifter-seed.sql]
- [Source: database/Ingredienser-seed.sql]
- [Source: React Router docs via Context7, /remix-run/react-router]

## Story Completion Status

Ultimate context engine analysis completed - comprehensive developer guide created.

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
