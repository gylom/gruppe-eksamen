> **Note:** This is a rough sketch of the original product idea, kept here for context. The authoritative specs are [docs/frontend-architecture-decisions.md](../frontend-architecture-decisions.md) and [docs/ui-ux-screens.md](../ui-ux-screens.md).

# Meal Planner — Rough Sketch

A mobile-first, multi-tenant meal planner for households that plan and shop together. Daily-use app. Built on the existing C# backend with minimal additions; React/Vite frontend; both deployed to Railway as one .NET service that serves the SPA from `wwwroot/`.

## What the backend already gives us

- Auth, users, households (`Brukere`, `Husholdning`, `Medlemmer`).
- Recipes, ingredients, meal-type categories (`Oppskrifter`, `Ingredienser`, `Oppskriftskategorier`).
- Shopping list rows with the `forslag` auto-suggest pattern (`Handleliste`, `HandlelisteController`).
- Per-user rating store via `Skjuloppskrift.karakter` (1–10, unique per user/recipe).

## What we're adding

- `PlanlagteMaaltider` — weekly meal plan, per household, Monday-anchored, day + meal type slots.
- `PlanlagteMaaltidEkskludertIngrediens` — per-meal "I already have this" exclusions, household-shared.
- `HusholdningInvitasjon` — 6-char invite codes (no I/O/0/1, 7-day expiry, single-use).
- A few columns on `Handleliste`: `kilde`, `planlagt_maaltid_id`, `purchased_at`.
- **Recipe-to-shopping-list logic** (`POST /api/handleliste/generate-from-week`): walks the week's planned meals, pulls their ingredients, skips optional ones, skips ingredients excluded via swipe, sums quantities only when `(varetypeId, maaleenhetId)` match exactly, and proposes new `Handleliste` rows. Reuses the existing `forslag` auto-suggest + manual-confirm pattern from `HandlelisteController`. Idempotent — items already on the list are pre-unchecked rather than duplicated.
- Other endpoints: purchase-complete, invite create/join, `/auth/me`, plus a `?kategoriId=` filter on recipes.
- Cookbook is **not** a new table — it's a derived query over `PlanlagteMaaltider` + purchased `Handleliste` rows.

## Routes

- `/`, `/login`, `/register`, `/onboarding` — public + onboarding.
- `/app/chef` — recipe browser & search.
- `/app/planned` — weekly plan.
- `/app/shopping` — active shopping list, swipe-to-purchase.
- `/app/cookbook` — household history, sorted by my own ratings.
- `/app/account` — user + household + invite code + theme/language.

## UI principles

- Mobile-first, one-thumb. Desktop is "mobile centered with margins."
- Routes for skeleton, bottom sheets for detail/editing.
- Bottom nav (Chef · Plan · Shop · Book · Account) inside `/app/*`.
- Swipe gestures shared across shopping rows and recipe ingredients (the same component handles both).
- i18n (Norwegian + English) and light/dark theme.

## Stack

React 19, React Router 7 in SPA mode (`ssr: false`), Vite, Tailwind v4, shadcn (base-ui), TanStack Query for server state, react-hook-form + zod, sonner for toasts, date-fns for Monday-anchored weeks. JWT bearer auth, no refresh tokens in v1.
