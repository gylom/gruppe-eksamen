---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-04-30'
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/product-brief-gruppe-eksamen-2026-04-30.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - docs/ui-ux-screens.md
  - docs/frontend-description.md
  - docs/frontend-architecture-decisions.md
  - docs/components.md
workflowType: 'architecture'
project_name: 'gruppe-eksamen'
user_name: 'PaalA'
date: '2026-04-30'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
The PRD defines 54 functional requirements across authentication, household membership, recipe discovery, weekly meal planning, shopping-list generation, shopping-list management, cookbook history, ratings, settings, localization, and demo reliability.

Architecturally, this is a full-stack household workflow rather than a set of isolated screens. The main system boundary is the connected loop: authenticated household user -> planned meals -> generated shopping suggestions -> active shopping list -> purchase completion -> cookbook history.

**Non-Functional Requirements:**
The 28 NFRs emphasize same-origin SPA/API deployment, JWT bearer auth, server-side household tenancy, stable mobile layouts, targeted loading states, accessibility, idempotent generation/completion behavior, and Railway/MySQL deployment reliability.

The strongest architecture-shaping NFRs are household data isolation, hard-refresh support for `/app/*`, duplicate prevention in shopping generation, no duplicate cookbook graduation, and mobile usability at 360px.

**Scale & Complexity:**
This is a medium-complexity brownfield full-stack web app. Domain complexity is low to moderate, but implementation complexity is medium because the core workflow crosses auth, households, recipes, planning, shopping, ratings, migrations, frontend state, and deployment.

- Primary domain: authenticated household meal-planning web app
- Complexity level: medium
- Estimated architectural components: 11

### Technical Constraints & Dependencies

Known constraints from the loaded documents:

- Existing C#/.NET backend remains the API and production host.
- React/Vite SPA is built into backend `wwwroot`.
- Production uses same-origin routing: `/api/*` for API, SPA fallback for everything else.
- Railway + MySQL is the target deployment shape.
- Frontend uses React 19, React Router 7 in SPA mode, Vite, Tailwind v4, shadcn/base-ui, TanStack Query, react-hook-form/zod, sonner, date-fns, and react-i18next.
- Auth uses JWT bearer tokens in v1, stored client-side, with no refresh-token or BFF layer.
- Household tenancy must be resolved server-side from `Medlemmer`, not trusted from JWT claims.
- Database changes follow existing SQL migration patterns, not EF migrations.
- Cookbook history is derived, not a new table.
- Ratings reuse `Skjuloppskrift`.
- Pantry management, unit conversion, recipe creation, image uploads, multi-household switching, and refresh tokens are deferred.

### Cross-Cutting Concerns Identified

- Auth and session expiry across all app routes and API calls.
- Household tenancy and membership gating across backend endpoints.
- DTO consistency between backend controllers and TanStack Query clients.
- Query-key discipline and targeted invalidation after mutations.
- Idempotency for shopping-list generation and purchase completion.
- Mobile-first layout, sheets, bottom navigation, and swipe alternatives.
- Accessibility for forms, sheets, swipe rows, ratings, and status states.
- Localization for app chrome in Norwegian and English.
- Theme handling for light, dark, and system mode.
- Deployment consistency between Vite static output and .NET SPA fallback.
- Demo reliability with seed data and clear empty/error states.

## Starter Template Evaluation

### Primary Technology Domain

The project is a brownfield full-stack web app: an existing C#/.NET backend with a new mobile-first React frontend served as static assets from the backend in production.

The starter decision is already made. The frontend was scaffolded from a shadcn React Router template with a preset, rather than a generic Vite-only template.

### Starter Options Considered

**shadcn React Router/Vite starter - selected**
This starter matches the documented frontend direction: React Router, Vite, Tailwind CSS v4, shadcn component conventions, Base UI primitives, lucide icons, TypeScript, and a component-oriented app structure.

**Plain Vite React starter - not selected**
A plain Vite React starter is simpler, but it would leave more decisions open: routing conventions, component primitives, shadcn setup, Tailwind integration, and app organization.

**React Router default starter - partially applicable**
React Router's own starter is relevant because the app uses React Router framework tooling. However, its default assumptions can include server rendering or deploy targets that do not directly match the .NET-served SPA/API deployment shape.

**Next.js or other full-stack starters - not selected**
These would conflict with the existing backend and deployment model. The backend is already .NET, and the frontend should not introduce a second full-stack server architecture.

### Selected Starter: shadcn React Router Preset

**Rationale for Selection:**
The selected starter gives the project a modern React frontend foundation while staying compatible with the brownfield backend. It provides a strong UI/component baseline for the mobile-first UX, without forcing the app into Next.js, SSR, or a separate Node production server.

The starter is a good fit because ChopChopShop needs polished authenticated app screens, sheets, forms, list rows, theme support, icons, and reusable UI primitives more than public SEO or server-rendered pages.

**Initialization Command:**

```bash
npx shadcn@latest init --preset b1sljUX6A --base base --template react-router
```

### Architectural Decisions Provided by Starter

**Language & Runtime:**
TypeScript-first React application using React 19 and React Router 7.

**Styling Solution:**
Tailwind CSS v4 through `@tailwindcss/vite`, shadcn CSS variables, Base UI primitives, and lucide icons.

**Build Tooling:**
Vite with React Router framework tooling. The production architecture must ensure the frontend build can be copied into the .NET backend `wwwroot` and served as a same-origin SPA.

**Routing Foundation:**
React Router file/framework conventions are available. For v1, app data fetching remains client-side through TanStack Query rather than route loaders.

**Component System:**
shadcn/base-ui provides the primitive layer for buttons, inputs, sheets, dialogs, menus, segmented controls, toasts, and other reusable UI components.

**Development Experience:**
The scaffold provides fast Vite development, React Router type generation, TypeScript checking, Tailwind formatting support, and shadcn CLI-based component installation.

### Required Starter Adaptations

The starter should be treated as a foundation, not an untouched architecture.

Required adaptations:

- Set React Router to SPA/static mode for the documented deployment shape.
- Keep production deployment as .NET serving static frontend assets from `wwwroot`.
- Use same-origin `/api/*` calls rather than a separate frontend production host.
- Add TanStack Query, react-hook-form, zod, i18n, sonner, and date-fns as app-level architecture choices.
- Keep shadcn components installed through the CLI.
- Remove or ignore the deprecated `client-react/` app once the canonical `frontend/` path is fully established.

### Important Local Configuration Note

The current local `frontend/react-router.config.ts` has `ssr: true`, while the planning documents require SPA/static deployment with `ssr: false`.

This should be resolved as an explicit architecture decision before implementation continues, because SSR would imply a different hosting model than the documented .NET-served SPA.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions:**
- Use the existing .NET backend as the production API and static SPA host.
- Use MySQL with versioned SQL migrations, not EF migrations.
- Use the shadcn React Router/Vite frontend as the canonical app in `frontend/`.
- Configure React Router for SPA/static deployment with `ssr: false`.
- Use REST endpoints under `/api/*`.
- Resolve household tenancy server-side from `Medlemmer`.
- Use JWT bearer auth for v1, with no refresh-token or BFF layer.
- Use TanStack Query for frontend server state.
- Use `react-swipeable-list` through a project-level `SwipeActionRow` wrapper.

**Important Decisions:**
- Use react-hook-form + zod for forms and validation.
- Use react-i18next/i18next for Norwegian and English chrome text.
- Use date-fns for Monday-anchored week logic.
- Use sonner for toast feedback.
- Use shadcn/base-ui primitives and CLI-installed shadcn components.
- Keep cookbook as a derived read model, not a new persistent table.
- Reuse `Skjuloppskrift` for per-user ratings.

**Deferred Decisions:**
- Refresh tokens, HttpOnly cookie/BFF auth, pantry management, unit conversion, recipe creation, image upload, multi-household switching, push notifications, and household-level ratings remain post-MVP.

### Data Architecture

The backend remains the source of truth. New state is stored in MySQL using the existing versioned SQL migration pattern.

Core data additions:
- `PlanlagteMaaltider`
- `PlanlagteMaaltidEkskludertIngrediens`
- `HusholdningInvitasjon`
- `Handleliste` columns for `kilde`, `planlagt_maaltid_id`, and `purchased_at`

Cookbook history is derived from planned meals with purchased recipe-derived shopping rows. It is not a separate table.

Ratings reuse `Skjuloppskrift.karakter`, with the UI mapping 1-5 stars to stored values 2-10.

### Authentication & Security

Use JWT bearer auth for v1. Tokens are stored client-side and injected by a shared `apiFetch` wrapper.

Authorization rules:
- API endpoints require authenticated users.
- Household data access is scoped server-side through `Medlemmer`.
- JWT household claims are UI hints only, not authorization truth.
- `/app/*` routes are gated by the app shell using `/api/auth/me`.
- Invalid or expired sessions clear local auth state and redirect to login.

### API & Communication Patterns

Use REST endpoints under `/api/*`.

API design rules:
- Frontend calls the backend through same-origin paths in production.
- DTOs stay flat and consistent with existing backend shapes.
- Mutations return enough data or status for targeted TanStack Query invalidation.
- Shopping generation is auto-suggest/manual-confirm.
- Generation and purchase completion must be idempotent.
- Business-rule conflicts, such as deleting a cooked planned meal, return clear 409 responses.

### Frontend Architecture

The canonical frontend is `frontend/`. `client-react/` is deprecated.

Use React Router for route structure and TanStack Query for all server state. Route loaders are not used for app data in v1.

Use React Router SPA/static mode:
- Set `frontend/react-router.config.ts` to `ssr: false`.
- Build static assets and serve them from the .NET backend.
- Use .NET SPA fallback so `/app/*` survives hard refresh.

Use shadcn/base-ui primitives for reusable UI. Components are installed through the shadcn CLI.

Use `react-swipeable-list` for swipeable row interactions.

Implementation rule:
- Wrap the library in a project-level `SwipeActionRow` component.
- Import `react-swipeable-list/dist/styles.css` once.
- Use it for shopping purchase, hidden-item restore, and ingredient exclusion.
- Provide tap/menu alternatives for every swipe action.

### Infrastructure & Deployment

Production deployment is one Railway .NET service plus MySQL.

Deployment shape:
- Vite/React Router frontend builds first.
- Static frontend output is copied into `backend/wwwroot`.
- .NET serves `/api/*` through controllers.
- .NET serves SPA assets and falls back to `index.html` for client routes.
- No production CORS dependency.

### Decision Impact Analysis

**Implementation Sequence:**
1. Normalize frontend deployment mode: set React Router `ssr: false`.
2. Install missing frontend architecture dependencies.
3. Establish `apiFetch`, auth provider, `/api/auth/me`, and route gating.
4. Add SQL migrations for planning, exclusions, invites, and shopping-row metadata.
5. Implement household-scoped backend endpoints.
6. Build TanStack Query hooks and mutation invalidation patterns.
7. Build shared UI primitives: app shell, sheets, rows, forms, and `SwipeActionRow`.
8. Implement the core demo loop vertically.

**Cross-Component Dependencies:**
- Auth and household membership affect every `/app/*` route and backend controller.
- Planned meals feed shopping-list generation.
- Purchased shopping rows feed cookbook history.
- Ratings affect cookbook sorting but not household-shared history.
- React Router SPA mode affects build/deployment and hard-refresh reliability.

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**
The main conflict points are database naming, API response shapes, endpoint naming, frontend folder structure, query-key naming, date formats, auth handling, loading/error states, and swipe-row behavior.

### Naming Patterns

**Database Naming Conventions:**
- Keep existing database style: Norwegian table names with PascalCase/plural where already used, e.g. `Brukere`, `Handleliste`, `PlanlagteMaaltider`.
- Use snake_case for SQL columns, e.g. `husholdning_id`, `created_at`, `planlagt_maaltid_id`.
- Foreign keys use `{referenced_concept}_id`.
- New SQL should match the existing schema rather than introducing English table names.

**API Naming Conventions:**
- Use lowercase REST paths under `/api/*`, matching current controllers.
- Use Norwegian resource names where the backend already does, e.g. `/api/handleliste`.
- Use route params as ASP.NET route params, e.g. `[HttpPut("{id:long}")]`.
- Query parameters use camelCase when they are new frontend-facing API, e.g. `weekStartDate`, unless matching an existing endpoint.

**Code Naming Conventions:**
- C# models and DTOs use PascalCase classes and properties.
- TypeScript uses camelCase variables/functions and PascalCase React components.
- Frontend route/component files use kebab-case or route names where React Router requires them.
- Shared frontend components use PascalCase exports, e.g. `SwipeActionRow`.

### Structure Patterns

**Backend Organization:**
- Controllers stay in `backend/Controllers`.
- DTOs stay grouped by feature in `backend/DTOs`.
- Models stay in `backend/Models`.
- Database changes stay in `database/` SQL files.
- Reuse existing helper patterns for `GetUserId()` and household lookup until a shared service is intentionally extracted.

**Frontend Organization:**
- Canonical app is `frontend/`; do not add new work to `client-react/`.
- shadcn primitives stay under `frontend/app/components/ui`.
- Product components go under `frontend/app/components`.
- Shared API helpers go under `frontend/app/lib`.
- Server-state hooks should be grouped by feature, e.g. `frontend/app/features/shopping` or equivalent, once feature folders are introduced.

### Format Patterns

**API Response Formats:**
- Existing endpoints may return direct objects or `{ message }`; do not wrap everything in a new global envelope.
- New list endpoints should return named top-level collections when useful, e.g. `{ varer, forslag }`.
- Error responses use `{ message: string }`.
- Business-rule conflicts use HTTP 409 with `{ message }`.
- Validation/user errors use 400, missing resources use 404, auth failures use 401.

**Data Exchange Formats:**
- JSON fields are camelCase as emitted by ASP.NET defaults.
- Dates/times crossing the API use ISO strings.
- Week identifiers use Monday `DATE` semantics and are passed as `YYYY-MM-DD`.
- Required null quantities remain `null`, not `0`.

### Communication Patterns

**State Management Patterns:**
- Use TanStack Query for server state.
- Use local React state only for transient UI state: open sheets, selected tabs, checked suggestion rows, pending form fields.
- Query keys use tuple arrays: `['me']`, `['recipes', filters]`, `['planned-meals', weekStartDate]`, `['shopping-list']`, `['cookbook']`.
- Mutations invalidate targeted keys, not the entire cache by default.

**Swipe Interaction Patterns:**
- Use `react-swipeable-list` only through a shared `SwipeActionRow` wrapper.
- Every swipe action must have a tap/menu alternative.
- Use the same gesture vocabulary for purchase, restore, and ingredient exclusion.
- Import `react-swipeable-list/dist/styles.css` once at app level.

### Process Patterns

**Error Handling Patterns:**
- `apiFetch` owns token injection, 401 handling, auth clearing, and redirect to login.
- User-facing errors should be short and recoverable.
- Backend errors should avoid leaking implementation details.
- Frontend screens use inline retry for load failures and toast for mutation failures where appropriate.

**Loading State Patterns:**
- Keep the app shell visible while route content loads.
- Use localized skeletons or reserved space for lists and sheets.
- Disable only the submitting form/action, not the whole screen, unless the transition requires it.

### Enforcement Guidelines

**All AI Agents MUST:**
- Preserve the existing backend naming style.
- Keep household authorization server-side.
- Use `frontend/` as the only active frontend.
- Use TanStack Query for server state.
- Use shadcn CLI for new shadcn components.
- Use the shared `SwipeActionRow` for swipe behavior.
- Keep swipe actions accessible through non-swipe controls.
- Keep generated shopping suggestions manual-confirm and idempotent.

**Pattern Enforcement:**
- Check new endpoints for `{ message }` error shape and household scoping.
- Check new frontend API calls go through `apiFetch`.
- Check query invalidation is targeted to affected feature keys.
- Check new swipe interactions use the shared wrapper.
- Document intentional deviations in the architecture document before implementation.

### Pattern Examples

**Good Examples:**
- `POST /api/handleliste/generate-from-week`
- `GET /api/planlagte-maaltider?weekStartDate=2026-04-27`
- `return Conflict(new { message = "This planned meal has already been cooked." });`
- `queryClient.invalidateQueries({ queryKey: ['shopping-list'] })`
- `SwipeActionRow` wrapping `SwipeableListItem`

**Anti-Patterns:**
- Adding a second frontend app.
- Trusting `householdId` from the JWT for authorization.
- Introducing GraphQL or a new API envelope.
- Creating a cookbook table.
- Using direct `fetch` calls outside `apiFetch`.
- Implementing one-off swipe gestures per screen.
- Adding pantry or unit-conversion behavior in v1.

## Project Structure & Boundaries

### Brownfield Structure Principle

This is a brownfield project. The architecture does not require rebuilding the existing backend or replacing working code. Existing controllers, DTOs, models, SQL schema files, seed files, auth behavior, recipe behavior, household behavior, shopping-list behavior, and rating storage should be preserved and extended only where the MVP requires it.

The project tree below describes the existing structure plus targeted additions. Files marked as new are expected additions only when the feature cannot be cleanly added to an existing file.

### Complete Project Directory Structure

```text
gruppe-eksamen/
├── backend/
│   ├── Controllers/
│   │   ├── AuthController.cs                         # existing, extend with /me
│   │   ├── HusholdningController.cs                  # existing, extend for invites
│   │   ├── OppskrifterController.cs                  # existing, extend filtering/rating/cookbook if appropriate
│   │   ├── HandlelisteController.cs                  # existing, extend generation and purchase completion
│   │   ├── PlanlagteMaaltiderController.cs           # new
│   │   └── existing inventory/product controllers     # keep
│   ├── DTOs/
│   │   ├── AuthDtos.cs                               # existing
│   │   ├── HouseholdDtos.cs                          # existing, extend if practical
│   │   ├── RecipeDtos.cs                             # existing, extend if practical
│   │   ├── ShoppingListDtos.cs                       # existing, extend for generated rows
│   │   ├── PlannedMealDtos.cs                        # new
│   │   └── CookbookDtos.cs                           # new only if cookbook needs separate DTOs
│   ├── Models/
│   │   ├── Bruker.cs                                 # existing
│   │   ├── Husholdning.cs                            # existing
│   │   ├── Medlem.cs                                 # existing
│   │   ├── Oppskrift.cs                              # existing
│   │   ├── Ingrediens.cs                             # existing
│   │   ├── HandlelisteRad.cs                         # existing, extend
│   │   ├── Skjuloppskrift.cs                         # existing, reuse for ratings
│   │   ├── PlanlagtMaaltid.cs                        # new
│   │   ├── PlanlagtMaaltidEkskludertIngrediens.cs    # new
│   │   └── HusholdningInvitasjon.cs                  # new
│   ├── Data/
│   │   └── AppDbContext.cs                           # existing, add DbSets/model config
│   ├── wwwroot/                                     # built frontend output
│   ├── Program.cs                                   # existing, extend static SPA hosting
│   └── backend.csproj
├── frontend/
│   ├── app/
│   │   ├── components/
│   │   │   ├── ui/                                  # shadcn primitives
│   │   │   ├── AppShell.tsx                         # new
│   │   │   ├── BottomNav.tsx                        # new
│   │   │   ├── DetailSheet.tsx                      # new
│   │   │   └── SwipeActionRow.tsx                   # new
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── household/
│   │   │   ├── recipes/
│   │   │   ├── planning/
│   │   │   ├── shopping/
│   │   │   ├── cookbook/
│   │   │   └── settings/
│   │   ├── lib/
│   │   │   ├── api-fetch.ts                         # new
│   │   │   ├── query-client.ts                      # new
│   │   │   ├── auth.ts                              # new
│   │   │   ├── dates.ts                             # new
│   │   │   ├── i18n.ts                              # new
│   │   │   └── utils.ts                             # existing
│   │   ├── routes/
│   │   ├── root.tsx
│   │   ├── routes.ts
│   │   └── app.css
│   ├── components.json
│   ├── react-router.config.ts
│   ├── vite.config.ts
│   └── package.json
├── database/
│   ├── schema.sql                                  # existing baseline schema
│   ├── *-seed.sql                                  # existing seeds, extend only where needed
│   └── v_next_chopchopshop.sql                     # new targeted migration file
├── docs/
├── _bmad-output/
├── scripts/
├── docker-compose.yml
├── package.json
└── README.md
```

### Architectural Boundaries

**API Boundaries:**
- `/api/auth/*` owns registration, login, and `/me`.
- `/api/husholdning/*` owns household creation, member display, invite generation, invite revocation, and invite join.
- `/api/oppskrifter/*` owns recipe browsing, detail, meal-type filtering, rating behavior if kept near recipes, and cookbook read queries if no separate cookbook controller is created.
- `/api/planlagte-maaltider/*` owns weekly planning, servings, removal, and ingredient exclusions.
- `/api/handleliste/*` owns active list rows, generated suggestions, confirmation, purchase state, restore, and purchase completion.
- All household-scoped endpoints resolve household membership server-side.

**Component Boundaries:**
- Routes own screen-level layout and query composition.
- Feature folders own feature-specific hooks, DTO types, and components.
- `components/ui` contains shadcn primitives only.
- Shared product components such as `AppShell`, `DetailSheet`, and `SwipeActionRow` are reused across features.

**Service Boundaries:**
- `apiFetch` is the only frontend HTTP boundary.
- TanStack Query hooks are the only server-state boundary used by components.
- Backend controllers may query through `AppDbContext`; shared household/auth helpers can be extracted only when duplication becomes painful.

**Data Boundaries:**
- MySQL is the source of truth.
- TanStack Query cache is a frontend read cache, not a second source of truth.
- Cookbook is a derived read model.
- Shopping generation writes nothing until confirmation.

### Requirements to Structure Mapping

**Authentication and sessions:** `AuthController.cs`, `AuthDtos.cs`, `frontend/app/features/auth`, `api-fetch.ts`.

**Household onboarding and invites:** `HusholdningController.cs`, `HouseholdDtos.cs`, `HusholdningInvitasjon.cs`, `frontend/app/features/household`.

**Recipe discovery:** `OppskrifterController.cs`, `RecipeDtos.cs`, `frontend/app/features/recipes`.

**Weekly planning:** `PlanlagteMaaltiderController.cs`, `PlannedMealDtos.cs`, planning models, `frontend/app/features/planning`.

**Shopping generation and list:** `HandlelisteController.cs`, `ShoppingListDtos.cs`, updated `HandlelisteRad.cs`, `frontend/app/features/shopping`, `SwipeActionRow.tsx`.

**Cookbook and ratings:** cookbook query/controller, `Skjuloppskrift.cs`, `CookbookDtos.cs` if needed, `frontend/app/features/cookbook`.

**Theme, language, account:** `frontend/app/features/settings`, `i18n.ts`, app shell providers.

### Integration Points

**Internal Communication:**
Frontend route -> feature query hook -> `apiFetch` -> `/api/*` controller -> `AppDbContext` -> MySQL.

**External Integrations:**
No third-party runtime services in v1 beyond npm libraries and Railway/MySQL infrastructure.

**Data Flow:**
Planned meals produce generated suggestions. Confirmed suggestions create `Handleliste` rows. Purchased rows feed purchase completion. Purchase completion makes cookbook history visible through derived queries. Ratings update `Skjuloppskrift`.

### File Organization Patterns

**Configuration Files:**
Root scripts coordinate development. Backend configuration remains in `backend/appsettings*.json`. Frontend configuration remains in `frontend/vite.config.ts`, `frontend/react-router.config.ts`, and `frontend/components.json`.

**Source Organization:**
Backend source remains controller/DTO/model oriented. Frontend source should grow feature folders inside `frontend/app/features` while keeping shared primitives in `frontend/app/components`.

**Test Organization:**
Backend tests, if added, should target controller/service behavior around household scoping and idempotency. Frontend tests, if added, should sit near feature code or in a clear `frontend/app/__tests__` structure. End-to-end tests should focus on the demo loop rather than broad UI snapshots.

**Asset Organization:**
Static frontend assets remain under `frontend/public` during development and are emitted into the frontend build output for copying to `backend/wwwroot`.

### Development Workflow Integration

**Development Server Structure:**
The root scripts run backend and frontend together. Frontend development uses Vite/React Router dev tooling and calls the backend API.

**Build Process Structure:**
The frontend builds first. Its static output is copied into `backend/wwwroot`. The backend publishes as the deployed service.

**Deployment Structure:**
Railway runs the .NET service with MySQL. In production, .NET serves controllers under `/api/*`, static frontend assets, and SPA fallback for client routes.

## Architecture Validation Results

### Coherence Validation

**Decision Compatibility:**
The architecture is coherent. The selected shadcn React Router/Vite frontend works with the brownfield .NET backend as long as React Router is configured for SPA/static deployment with `ssr: false`.

The stack choices support each other:
- React Router owns routes.
- TanStack Query owns server state.
- `apiFetch` owns HTTP/auth behavior.
- .NET owns API, auth validation, household tenancy, and production static hosting.
- MySQL remains the source of truth.
- `react-swipeable-list` is isolated behind `SwipeActionRow`.

No conflicting architecture decisions remain. The known local mismatch, `frontend/react-router.config.ts` currently using `ssr: true`, is already identified as the first implementation correction.

**Pattern Consistency:**
The implementation patterns support the decisions. Naming rules preserve existing Norwegian backend/domain conventions while giving frontend agents clear TypeScript and feature-folder rules.

API response, error, date, query-key, loading, and swipe patterns are specific enough to prevent agents from inventing incompatible conventions.

**Structure Alignment:**
The project structure supports a brownfield implementation. Existing backend files are extended where practical, while new files are limited to genuinely new concepts such as planned meals, meal ingredient exclusions, and invite codes.

### Requirements Coverage Validation

**Feature Coverage:**
All main feature groups from the PRD are architecturally supported:
- Auth and sessions
- Household onboarding and invites
- Recipe browsing and detail
- Weekly meal planning
- Ingredient exclusions
- Shopping suggestion generation
- Shopping list management
- Purchase completion
- Cookbook history
- Per-user ratings
- Theme and language settings
- Railway deployment and SPA fallback

**Functional Requirements Coverage:**
The 54 FRs are covered by the architecture through existing controllers plus targeted additions. The core end-to-end loop is structurally supported: login/onboarding -> recipes -> planning -> generation -> shopping -> purchase completion -> cookbook -> rating.

**Non-Functional Requirements Coverage:**
The NFRs are covered by explicit decisions:
- Security: JWT bearer auth and server-side household tenancy.
- Reliability: idempotent generation and purchase completion.
- Deployment: same-origin .NET API/static SPA on Railway.
- Accessibility: swipe actions require tap/menu alternatives.
- Maintainability: TanStack Query keys, DTO consistency, brownfield extension rules.
- Mobile usability: app shell, sheets, bottom nav, `SwipeActionRow`.

### Implementation Readiness Validation

**Decision Completeness:**
Critical decisions are documented and actionable. The starter, deployment shape, auth approach, data ownership, API style, frontend state strategy, swipe library, and brownfield boundaries are all explicit.

**Structure Completeness:**
The structure is complete enough for implementation. It maps existing files, targeted additions, and feature ownership without implying a full rewrite.

**Pattern Completeness:**
The consistency rules cover the main conflict points: naming, API format, file placement, query keys, error handling, loading states, and swipe behavior.

### Gap Analysis Results

**Critical Gaps:**
None.

**Important Watchpoints:**
- `frontend/react-router.config.ts` must be changed from `ssr: true` to `ssr: false`.
- `backend/Program.cs` must be extended for production static-file hosting and SPA fallback.
- Missing frontend dependencies must be installed before implementing the planned architecture.
- The exact cookbook endpoint location should be chosen during implementation: either extend `OppskrifterController` or add a small cookbook controller.
- SQL migration naming should follow whatever convention the team chooses for the next database change, while preserving `database/schema.sql` as the baseline.

**Nice-to-Have Improvements:**
- Add a short backend helper/service for household lookup if controller duplication grows.
- Add focused tests around shopping-generation idempotency and purchase-complete idempotency.
- Add an e2e smoke test for the exam demo loop.

### Validation Issues Addressed

The main issue found during validation was brownfield scope ambiguity in the project tree. This has already been corrected in Step 6 by explicitly stating that the project should preserve and extend existing files rather than rebuild the backend.

The second issue is the current React Router SSR mismatch. This is documented as the first implementation priority.

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High

**Key Strengths:**
- Strong brownfield discipline.
- Clear same-origin deployment model.
- Explicit auth and household tenancy rules.
- Well-defined core product loop.
- Good consistency rules for future AI agents.
- Swipe interaction library and wrapper pattern decided.
- Deferred scope is clearly separated from MVP.

**Areas for Future Enhancement:**
- Shared backend household helper if repeated across many controllers.
- More formal test structure once implementation begins.
- More detailed deployment script once the frontend build output path is finalized.

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented.
- Extend existing brownfield backend files where practical.
- Do not rebuild working backend areas.
- Use implementation patterns consistently across all components.
- Respect project structure and boundaries.
- Refer to this document for all architectural questions.

**First Implementation Priority:**
Set `frontend/react-router.config.ts` to `ssr: false`, then configure the frontend build/static-copy path and .NET SPA fallback so the selected deployment shape is real before building feature depth.
