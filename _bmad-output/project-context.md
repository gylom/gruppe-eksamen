---
project_name: 'gruppe-eksamen'
user_name: 'PaalA'
date: '2026-04-30'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'code_quality_rules', 'workflow_rules', 'critical_rules']
existing_patterns_found: 12
status: 'complete'
rule_count: 60
optimized_for_llm: true
source_documents:
  - _bmad-output/planning-artifacts/architecture.md
  - package.json
  - frontend/package.json
  - backend/backend.csproj
  - frontend/react-router.config.ts
  - frontend/vite.config.ts
  - frontend/tsconfig.json
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

- Backend: .NET 8 / ASP.NET Core Web API with controllers in `backend/Controllers`.
- Database: MySQL, accessed through EF Core 8.0.12 and Pomelo.EntityFrameworkCore.MySql 8.0.2.
- Database changes use SQL files in `database/`; do not introduce EF migrations unless explicitly requested.
- Frontend: React 19.2.4, React Router 7.13.1, Vite 7.3.1, TypeScript 5.9.3.
- React Router must stay in SPA/static mode with `frontend/react-router.config.ts` set to `ssr: false`.
- Styling: Tailwind CSS v4, shadcn/base-ui primitives, lucide-react icons.
- Server state: TanStack Query v5. Use query hooks and targeted invalidation instead of ad hoc fetch state.
- Production shape: same-origin deployment where the frontend build is copied to `backend/wwwroot`; API routes stay under `/api/*`.

## Critical Implementation Rules

### Language-Specific Rules

- TypeScript must remain strict. Do not bypass types with broad `any`; define feature DTOs in the relevant `types.ts`.
- Use the `~/*` alias for imports from `frontend/app/*`; avoid fragile deep relative paths when crossing feature/shared boundaries.
- All frontend API calls must use `apiFetch`; do not call `fetch` directly from routes or components.
- Backend route params that become `ulong` IDs must be validated before casting from `long`.
- Preserve C# nullable-reference discipline; model optional database fields as nullable instead of using sentinel values.
- Backend errors intended for users should return `{ message = "..." }`; do not introduce a new global API envelope.
- Dates crossing the API should be ISO/date strings. Week planning uses Monday `YYYY-MM-DD` keys.

### Framework-Specific Rules

- `frontend/` is the only active frontend. Do not add new work to `client-react/`.
- Keep React Router in SPA/static mode (`ssr: false`) so .NET can serve `wwwroot` and fall back to `index.html`.
- App data fetching should use TanStack Query hooks, not React Router loaders, for v1 app screens.
- Query keys must be stable tuple arrays; mutations should invalidate only affected feature keys.
- shadcn primitives belong in `frontend/app/components/ui`; install new shadcn components with `pnpm dlx shadcn@latest add ...`.
- Use lucide-react icons for icon buttons when available.
- Swipe actions must use `SwipeActionRow` and must include a tap/click alternative.
- ASP.NET controllers must keep routes under `/api/*` and return normal controller results; do not introduce GraphQL or a separate Node API.
- Household-scoped backend endpoints must derive membership from `Medlemmer` on the server side.

### Testing Rules

- There is no broad established test suite yet; do not invent large test infrastructure for small changes.
- When backend changes affect auth, household scoping, shopping generation, purchase completion, or planned-meal deletion, add focused tests if a suitable test harness exists or document the manual verification performed.
- For frontend changes, verify at least the affected route/component flow with `npm run typecheck --prefix frontend` when possible.
- For build/deployment-sensitive changes, run the root build path (`npm run build`) because it builds the frontend and copies output into `backend/wwwroot`.
- Do not rely on snapshot-style UI checks for core behavior; prefer behavior checks around API calls, query invalidation, disabled states, and route gating.
- Manual verification should cover mobile-width layouts for app screens, especially sheets, bottom navigation, swipe rows, and long Norwegian labels.

### Code Quality & Style Rules

- Keep changes surgical. Do not refactor adjacent brownfield code unless required by the task.
- Preserve Norwegian backend/domain naming for existing concepts: controllers, models, DTOs, routes, and SQL should match local naming style.
- SQL tables follow existing names such as `Brukere`, `Handleliste`, `PlanlagteMaaltider`; SQL columns use snake_case.
- C# models/DTOs use PascalCase properties; frontend TypeScript uses camelCase fields matching ASP.NET JSON output.
- Place backend code in the established folders: `Controllers`, `DTOs`, `Models`, `Data`.
- Place frontend feature hooks/types/components under `frontend/app/features/<feature>`; shared app components under `frontend/app/components`.
- Keep `components/ui` for shadcn primitives only.
- Add comments only for non-obvious business rules, security decisions, or idempotency behavior.
- Do not rewrite existing API response shapes into a global envelope; extend local shapes consistently.

### Development Workflow Rules

- Work only on branch `feature/frontend-rebuild` unless the user explicitly instructs otherwise.
- Do not create new branches on your own.
- Ignore `docs/_archive`, `docs/_prompts`, and `docs/_notes` when gathering project context.
- Use Context7 (`npx ctx7@latest ...`) before relying on current library, framework, SDK, API, CLI, or cloud-service documentation.
- Use shadcn CLI for shadcn components; do not hand-create shadcn primitive files from memory.
- Root `npm run build` is the deployment-shape check: it builds `frontend/` and copies static output to `backend/wwwroot`.
- Backend publish runs the frontend build through `backend.csproj` unless `SkipFrontendBuild=true`.
- Do not commit unless the user explicitly asks.

### Critical Don't-Miss Rules

- Household authorization is server-side only. Never trust household IDs from JWT claims, local storage, route params, or request bodies.
- JWT auth is v1 client-side bearer-token auth; do not introduce refresh tokens, HttpOnly-cookie BFF auth, or multi-household switching unless explicitly requested.
- Production must remain one .NET service plus MySQL: `/api/*` controllers, static SPA files in `wwwroot`, and SPA fallback for non-API routes.
- `client-react/` is deprecated. Do not modify it for active product work.
- Planned-week logic uses Monday `YYYY-MM-DD` keys. Reject or normalize non-Monday dates deliberately.
- Shopping generation must be manual-confirm and idempotent; do not write generated suggestions until confirmation.
- Purchase completion must be idempotent and must not duplicate cookbook history.
- Cookbook is derived from planned meals and purchased shopping rows; do not create a cookbook table unless the architecture changes.
- Ratings reuse `Skjuloppskrift`; do not add a separate ratings table for v1.
- Ingredient exclusions are per planned meal and must not mutate the recipe itself.
- Do not delete planned meals that already have purchased linked shopping rows; return 409 with `{ message }`.
- Every swipe-only interaction must have an accessible button/menu alternative.
- Deferred scope remains deferred: pantry management, unit conversion, recipe creation, image uploads, push notifications, and refresh tokens.

---

## Usage Guidelines

**For AI Agents:**

- Read this file before implementing code.
- Follow all rules exactly; when in doubt, choose the more restrictive project convention.
- Update this file only when new durable implementation patterns emerge.

**For Humans:**

- Keep this file lean and focused on agent needs.
- Update it when the technology stack, deployment shape, or core patterns change.
- Remove rules that become obsolete or obvious.

Last Updated: 2026-04-30
