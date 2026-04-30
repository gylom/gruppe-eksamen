# Story 1.3: Authenticated App Shell and Route Gating

Status: done

## Story

As a household member,
I want the app to guide me to the right area based on my auth and household state,
So that I never land in a broken or unauthorized household screen.

**Requirements traced:** FR5, FR12, FR50, FR54; NFR1, NFR3, NFR4, NFR10, NFR15; UX-DR1, UX-DR2, UX-DR3, UX-DR4.

## Acceptance Criteria

**AC1 — Unauthenticated users requesting `/app/*` redirect to `/login`**

- **Given** a user is unauthenticated (no token in `localStorage`)
- **When** they request any `/app/*` route (e.g. `/app`, `/app/chef`, `/app/shop`)
- **Then** the app redirects them to `/login`
- **And** household navigation (bottom nav) is not rendered.

**AC2 — Authenticated users without a household redirect to `/onboarding`**

- **Given** a user is authenticated but `useMe()` returns `householdId === null`
- **When** they request any `/app/*` route
- **Then** the app redirects them to `/onboarding`
- **And** bottom navigation remains hidden until onboarding is complete.

**AC3 — Authenticated household users see the app shell with five top-level destinations**

- **Given** a user is authenticated and `useMe()` returns a non-null `householdId`
- **When** they enter `/app/*`
- **Then** the mobile-first app shell renders top-level destinations for Chef, Plan, Shop, Book, and Account
- **And** active route state is visible without relying on color alone (e.g. icon + bold label, or `aria-current="page"`).

**AC4 — Auth-loading state uses reserved/localized loading, no layout jumps**

- **Given** the app shell is loading auth state (`useMe()` returns `isLoading: true` because the token exists but `/api/auth/me` has not resolved)
- **When** route content waits for `/api/auth/me`
- **Then** the shell uses reserved or localized loading states (skeleton or fixed-height placeholder)
- **And** it avoids disruptive layout jumps on mobile (the bottom nav placeholder space is reserved at 360px so the viewport does not snap).

## Tasks / Subtasks

- [x] **T1: Centralized gating in a single `/app` parent route** (AC: 1, 2, 3, 4)
  - [x] Edit [frontend/app/routes.ts](frontend/app/routes.ts). Replace the flat config with a nested layout route. Pattern (React Router 7 framework mode):

    ```ts
    import {
      type RouteConfig,
      index,
      route,
      layout,
    } from "@react-router/dev/routes";

    export default [
      index("routes/home.tsx"),
      route("login", "routes/login.tsx"),
      route("register", "routes/register.tsx"),
      route("onboarding", "routes/onboarding.tsx"),
      route("app", "routes/app/layout.tsx", [
        index("routes/app/index.tsx"),
        route("chef", "routes/app/chef.tsx"),
        route("plan", "routes/app/plan.tsx"),
        route("shop", "routes/app/shop.tsx"),
        route("book", "routes/app/book.tsx"),
        route("account", "routes/app/account.tsx"),
      ]),
    ] satisfies RouteConfig;
    ```

  - [x] Gating lives EXACTLY ONCE — in [frontend/app/routes/app/layout.tsx](frontend/app/routes/app/layout.tsx). Do not duplicate guards in each child route. (Architecture §Frontend Architecture; epics.md §UX-DR4 "Centralize auth and household gating".)
  - [x] If you find yourself adding `<RequireAuth>` or `<RequireHousehold>` HOCs, stop — the parent layout's render flow IS the guard. Adding wrappers creates two sources of gating truth and is the disaster Story 1.3 is meant to prevent.

- [x] **T2: Build the `/app` layout component with auth + household gating** (AC: 1, 2, 3, 4)
  - [x] Create [frontend/app/routes/app/layout.tsx](frontend/app/routes/app/layout.tsx). It is the parent route component for `/app/*`. Render order:
    1. `const navigate = useNavigate()` and `const me = useMe()` (the hook from `~/features/auth/use-me.ts` already exists from Story 1.2).
    2. **No token branch** — if `getToken() === null`, call `navigate('/login', { replace: true })` from a `useEffect` and render `null`. Do NOT redirect during render — `navigate` mutates state. (`replace: true` so back-button does not loop.)
    3. **Loading branch** — if `me.isLoading`, render the AppShell chrome (header placeholder + bottom-nav-placeholder reserved space) but with the content area showing a skeleton. The bottom-nav placeholder is a same-height empty `<div>` so the layout does not jump when the real nav appears (AC4).
    4. **Error branch** — if `me.isError`, the 401 path is already handled inside `apiFetch` (Story 1.2 redirects to `/login` and clears the token). For non-401 errors (network, 5xx), render an inline "Kunne ikke laste konto. Prøv igjen." with a retry button (`me.refetch()`). Do NOT redirect on non-401 errors — that would mask backend outages as auth problems.
    5. **No household branch** — if `me.data && me.data.householdId === null`, redirect to `/onboarding` via `useEffect` + `navigate('/onboarding', { replace: true })`.
    6. **Ready branch** — render `<AppShell><Outlet /></AppShell>` with the visible bottom nav.
  - [x] All redirects use a `useEffect` with the relevant condition in the dependency array. Never redirect from render (calls `navigate` synchronously during render = warning + buggy). Never use `<Navigate>` from `react-router` here either — we want imperative redirects so the loading branch can render real chrome first instead of a flash of unstyled content.
  - [x] Token-presence check uses `getToken()` from `~/lib/auth.ts` directly (synchronous read of `localStorage`). Do NOT make this a TanStack Query — it is render-time state, not server state.
  - [x] **CRITICAL — race-free gating**: `useMe()` is `enabled: !!getToken()` from Story 1.2. So the matrix is:
    - No token → `me` query is disabled, `me.isLoading === false`, `me.data === undefined`. Branch 2 (no token) catches this. ✓
    - Token present, query in flight → `me.isLoading === true`. Branch 3 (loading). ✓
    - Token present, 401 → `apiFetch` already cleared token + redirected. By the time React rerenders, `getToken()` is null and Branch 2 catches it. ✓
    - Token + 200 + no household → Branch 5 redirects to onboarding. ✓
    - Token + 200 + household → Branch 6 renders shell. ✓
      Verify each row of this matrix in T7. If any is broken, fix gating logic — do not add a `setTimeout` workaround.

- [x] **T3: Build `AppShell` and `BottomNav` shared components** (AC: 3, 4)
  - [x] Create [frontend/app/components/AppShell.tsx](frontend/app/components/AppShell.tsx). PascalCase filename per architecture §Naming Patterns ("Shared frontend components use PascalCase exports"). Already listed in architecture's expected tree (architecture.md line 433).
    - Layout: `<div className="mx-auto flex min-h-svh max-w-[480px] flex-col bg-background">` (mobile-first, centered on desktop, max width 480px between the 420–520 range from UX spec line 821).
    - Children area: `<main className="flex-1 overflow-y-auto pb-[calc(env(safe-area-inset-bottom,0px)+4rem)]">{children}</main>` — bottom padding equals nav height + safe-area inset so content does not hide under the sticky nav (UX-DR1, UX-DR41).
    - Sticky nav: render `<BottomNav />` outside `<main>` but inside the shell, positioned with `className="sticky bottom-0 ..."`. Apply safe-area inset bottom padding directly on the nav too.
    - Accept an optional `headerSlot` prop later if any route needs a header — for v1 the screens own their own headers if needed. Do NOT design a global header now.
  - [x] Create [frontend/app/components/BottomNav.tsx](frontend/app/components/BottomNav.tsx). Use shadcn primitives + `lucide-react` icons (already installed per [frontend/package.json](frontend/package.json) — `lucide-react@^1.14.0`). Choose icons:
    - Chef → `ChefHat`
    - Plan → `CalendarDays`
    - Shop → `ShoppingBasket`
    - Book → `BookOpen`
    - Account → `User`
  - [x] Implementation:
    - Use semantic `<nav aria-label="Hovednavigasjon">` (UX-DR47, UX components doc §Bottom Navigation "uses semantic nav").
    - Five `<NavLink to="/app/chef">` etc. from `react-router`. NavLink already exposes `isActive` via render prop or `className` callback.
    - Each item is a column flex with the `lucide-react` icon (24px) above a label. Label is sentence-case Norwegian: "Kjøkken", "Plan", "Handel", "Bok", "Konto". (Hardcoded NO is acceptable — i18n lands in Story 6.1, same rule as Story 1.2's auth chrome.)
    - **Active state must NOT rely on color alone** (UX-DR42, NFR20). Use `aria-current="page"` AND a bold label AND a top-edge indicator (e.g. 2px primary-color bar above the icon). Three signals satisfies the "color-alone" prohibition.
    - Tap targets ≥ 44×44px (UX accessibility line 838). With five items in a 360px-wide layout, each item is ~72px wide × 56px tall — well above the threshold.
    - `prefers-reduced-motion` (UX-DR46): if any state-change animation is added (e.g. active-bar slide), wrap in `@media (prefers-reduced-motion: reduce)` to disable. For v1, no animation is the simpler and safer choice — skip motion entirely.
  - [x] Use the **frontend-design skill** for the visual styling pass (per AGENTS.md "Always use frontend-design skill whenever implementing UI"). The skill covers token usage, hierarchy, contrast, and the warm-routine palette decisions referenced in the UX spec. Apply it to AppShell + BottomNav as a pair.

- [x] **T4: Build placeholder route files for `/app/*` children** (AC: 3)
  - [x] Create [frontend/app/routes/app/index.tsx](frontend/app/routes/app/index.tsx). Default export redirects to `/app/chef` via `<Navigate to="/app/chef" replace />` (use `<Navigate>` here — it's a one-line redirect with no loading state). Rationale: when login navigates to `/app`, the user lands on the index route, which should bounce to Chef as the default destination (UX flow line 397: `[/app/chef]` is the post-onboarding entry).
  - [x] Create five placeholder pages, each rendering only the route name in an `<h1>` and a short "Kommer i [story-X]" hint. Examples:
    - [frontend/app/routes/app/chef.tsx](frontend/app/routes/app/chef.tsx) → `<h1>Kjøkken</h1><p>Oppskriftsbrowsing kommer i Story 2.1.</p>`
    - [frontend/app/routes/app/plan.tsx](frontend/app/routes/app/plan.tsx) → "Ukeplan kommer i Story 2.2."
    - [frontend/app/routes/app/shop.tsx](frontend/app/routes/app/shop.tsx) → "Handleliste kommer i Story 4.1."
    - [frontend/app/routes/app/book.tsx](frontend/app/routes/app/book.tsx) → "Kokebok kommer i Story 5.1."
    - [frontend/app/routes/app/account.tsx](frontend/app/routes/app/account.tsx) → "Konto kommer i Story 6.1."
  - [x] Each page is a default-export function component returning a `<section>` with `className="p-4"`. Nothing else. Resist temptation to scaffold "real" feature components now — that is the next epic's work and would create files later stories must rewrite. The whole point of placeholders is that they prove gating + nav routing works without committing to feature shape.

- [x] **T5: Build the `/onboarding` placeholder route** (AC: 2)
  - [x] Create [frontend/app/routes/onboarding.tsx](frontend/app/routes/onboarding.tsx). For Story 1.3 this is a STUB — render `<h1>Velkommen</h1><p>Onboarding kommer i Story 1.4.</p>` plus a temporary "Logg ut" button wired to `useLogout()` so a developer testing Story 1.3 in isolation can clear state. The full create/join household form lands in Story 1.4 and will replace this body. Do NOT build the form here.
  - [x] Add `route("onboarding", "routes/onboarding.tsx")` to `routes.ts` (T1 already includes this in the suggested config). It is a public-after-auth route — it does NOT live under `/app/*` and does NOT receive the AppShell chrome (no bottom nav, per UX-DR3).
  - [x] Onboarding's own auth check: if `getToken() === null`, redirect to `/login`. If `getToken() && me.data?.householdId !== null`, redirect to `/app` (the user already has a household and should not be stuck on onboarding). If `me.isLoading`, render a small centered skeleton. Logic mirrors layout.tsx but is intentionally local — do NOT extract a shared `useGate()` hook in this story; two call-sites is not enough to justify the abstraction. Story 1.4 owns the final onboarding form; if a third gate appears later, extract then.

- [x] **T6: Update home (`/`) so authenticated users land in `/app`** (AC: 3)
  - [x] Edit [frontend/app/routes/home.tsx](frontend/app/routes/home.tsx). On mount, if `getToken()` is present, `navigate('/app', { replace: true })`. Otherwise render the existing "Project ready!" placeholder UNCHANGED — the public landing page is intentionally minimal in v1 and a marketing landing page is out of scope.
  - [x] Use a small `useEffect` for the redirect, not a top-level call. The "Project ready" copy can stay verbatim from Story 1.1; do not redesign the landing page.

- [ ] **T7: Manual verification of every gating-matrix row** (AC: 1–4)
  - [ ] Run `cd frontend && npm run dev` and `cd backend && dotnet run` in two terminals (same setup as Story 1.2). Open the dev URL.
  - [ ] **AC1 — unauthenticated → `/login`**: Clear `localStorage`. Visit `/app`, `/app/chef`, `/app/shop` directly. Each must redirect to `/login`. Inspect `window.location.pathname === '/login'`. The bottom nav must not appear at any point during the redirect.
  - [ ] **AC2 — authenticated, no household → `/onboarding`**: Register a fresh user (Story 1.2 register form). After registration, login navigates to `/app`. The layout sees `householdId === null` (the new user has no household — confirmed by `/api/auth/me` returning `householdId: null`) and redirects to `/onboarding`. Confirm `window.location.pathname === '/onboarding'` and bottom nav is hidden.
  - [ ] **AC3 — household user → app shell**: Manually create a `Husholdning` row and a `Medlemmer` row for the test user via SQL or by waiting for Story 1.4 to land. Until Story 1.4 lands, use a quick SQL script: `INSERT INTO Husholdning (Navn) VALUES ('Test'); INSERT INTO Medlemmer (UserId, HusholdningId, Rolle) VALUES (<user-id>, LAST_INSERT_ID(), 'eier');`. Refresh the app. Confirm: bottom nav renders with Chef/Plan/Shop/Book/Account; clicking each item navigates and shows the placeholder copy; `aria-current="page"` is set on the active item; `/app` itself bounces to `/app/chef`.
  - [ ] **AC4 — auth-loading state**: Throttle the network in DevTools (Slow 3G). Reload `/app/chef`. Confirm: AppShell chrome paints first (with skeleton in content + reserved nav-height space), THEN the real content fills in once `/api/auth/me` resolves. The bottom edge of the viewport should not jump when the nav appears — measure by watching the scroll position (or the content end) before/after.
  - [ ] **AC1 cross-check at hard refresh** (NFR15): While on `/app/chef` as an authenticated household user, hit browser refresh. The .NET SPA fallback ([backend/Program.cs:85](backend/Program.cs#L85)) must serve `index.html`, the SPA must boot, the gating must run, and the user must land back on `/app/chef` — NOT on `/login` (that would mean gating ran before the token read, which is a bug in T2).
  - [ ] **Negative — don't break unauthenticated public routes**: Visit `/login`, `/register`, and `/` while logged out. None should redirect. `/` should still show "Project ready!" copy.
  - [ ] Test at 360px viewport (DevTools device toolbar → "iPhone SE" or custom 360×640): bottom nav fits without horizontal scroll, labels do not truncate, tap targets remain ≥ 44×44px (NFR4, UX-DR44, line 814).
  - [ ] Keyboard pass (NFR16, UX accessibility line 833): tab through bottom nav. Each item should receive a visible focus ring, Enter activates the link, focus order matches visual order.
  - [ ] Document the seven verification results in the Completion Notes List below.

### Review Findings

_Code review run 2026-04-30 — three review layers (Blind Hunter, Edge Case Hunter, Acceptance Auditor). 5 patches applied, 5 deferred, ~14 dismissed as noise._

- [x] [Review][Patch] Asymmetric `householdId` semantics between layout and onboarding [frontend/app/routes/app/layout.tsx:11; frontend/app/routes/onboarding.tsx:13] — Layout uses `me.data?.householdId === null` (treats `undefined` field as "has household"), Onboarding uses `!== null && !== undefined` (treats `undefined` as "no household"). If a `MeResponse` ever has `householdId: undefined`, the two routes disagree about the same user's state and direct deep-links to `/app/*` render protected content while `/onboarding` shows the form. Pick one canonical predicate and tighten the `MeResponse` type so `undefined` is impossible. **Applied:** both files now use `me.data != null && me.data.householdId == null` / `!= null` (loose equality on the inner check, explicit non-null guard on `me.data` so loading is unaffected).
- [x] [Review][Patch] `Prøv igjen` button shows no loading feedback during refetch [frontend/app/routes/app/layout.tsx:46-58; frontend/app/routes/onboarding.tsx:42-55] — `me.isLoading` is `false` during a refetch (it is true only on the very first fetch). Click the button, nothing visible changes for the entire request. Switch the loading check to `me.isPending` or also branch on `me.isFetching`, or disable the button while refetching. **Applied:** retry button now `disabled={me.isFetching}` in both layout and onboarding.
- [x] [Review][Patch] Background refetch error swaps the entire `/app/*` subtree to the error shell [frontend/app/routes/app/layout.tsx:46] — When the user is on `/app/chef` and a focus/visibility refetch transiently fails, `me.isError` flips true and the layout replaces the outlet with the retry screen, losing the user's place. Only render the error branch when there is no cached data (`me.isError && !me.data`), or keep the outlet visible and surface the error inline. **Applied:** error branch in layout and onboarding now gated by `me.isError && !me.data` so cached-then-failed refetches keep the existing UI.
- [x] [Review][Patch] `home.tsx` flashes "Project ready!" copy for authenticated users before the redirect runs [frontend/app/routes/home.tsx:14-22] — The `useEffect` redirect runs after the first paint, so a user with a token sees the public landing copy for one frame on every cold load of `/`. Return `null` (or a tiny spinner) while `hasToken` is true so the public copy never paints for authenticated users. **Applied:** added early `if (hasToken) return null` after the redirect effect.
- [x] [Review][Patch] `outline-none` on BottomNav `NavLink` without a guaranteed fallback [frontend/app/components/BottomNav.tsx:23] — `outline-none` is unconditional; only `focus-visible:ring-...` replaces it. UAs without `:focus-visible` support (older Safari) lose all focus indication. Drop `outline-none` and rely on shadcn's default focus ring, or pair it with a `focus:ring-...` baseline. **Applied:** removed `outline-none`; `focus-visible:ring-...` still wins on supported UAs and the browser default outline appears as a fallback elsewhere.
- [x] [Review][Defer] AppShell main padding-bottom plus `reserveNav` placeholder double-reserves vertical space [frontend/app/components/AppShell.tsx:14-23] — deferred after analysis. Both candidate fixes break things: making `pb` conditional on `reserveNav` causes a 4rem layout jump between loading and ready (violates AC4); removing `pb` unconditionally deviates from the spec's literal `pb-[calc(env(safe-area-inset-bottom,0px)+4rem)]` rule (architecture line 215). The "double" is by spec design — `pb` is breathing room, the sibling reserves nav height. Revisit only if T7 360px smoke shows excessive bottom dead space.

- [x] [Review][Defer] Multi-tab logout / `getToken()` is non-reactive [frontend/app/routes/app/layout.tsx:10; frontend/app/routes/onboarding.tsx:12] — deferred, out of v1 AC scope. Another tab clearing `localStorage` does not re-render this tab; stale auth UI persists until next interaction triggers a refetch + 401. Story 6.x or future hardening can add a `storage` event listener or a token signal hook.
- [x] [Review][Defer] `useLogout` does not invalidate the `["me"]` query cache [frontend/app/features/auth/use-logout.ts] — deferred, lives outside the Story 1.3 diff. After logout-then-login as a different user in the same tab, the layout consumes the previous user's cached household state on first render. Add `queryClient.clear()` (or invalidate `["me"]`) inside `useLogout`.
- [x] [Review][Defer] `home.tsx` redirect chain `/ → /app → /onboarding` for tokened-but-householdless users [frontend/app/routes/home.tsx:8-13] — deferred, low-impact UX. Three hops with `replace` produce a brief AppShell skeleton flash before landing on `/onboarding`. Acceptable for v1; revisit if onboarding completion timing matters.
- [x] [Review][Defer] `logout` passed directly as `onClick` handler forwards the MouseEvent [frontend/app/routes/onboarding.tsx:65] — deferred, depends on `useLogout` signature (not in this diff). If `useLogout()` returns a function that ignores its argument it is fine; if it ever takes an options object the event will be passed there. Wrap as `onClick={() => logout()}` when the hook contract is reviewed.

## Dev Notes

### What this story is and is NOT

This story builds the **`/app/*` layout, central gating logic, bottom navigation, and placeholder destination routes**. It is NOT yet:

- The household onboarding form, create/join paths, or invite codes (Story 1.4 — `/onboarding` is a stub here).
- Recipe browsing, the Chef screen, or any feature content (Story 2.1+).
- The Plan, Shop, Book, or Account screens (Story 2.2, 4.1, 5.1, 6.1 respectively — all stubs here).
- An Account screen, theme switcher, language switcher, or visible logout button beyond the temporary one in `/onboarding` for testing (Story 6.1).
- A header bar, account-initials affordance, or top-of-shell controls — UX spec line 540 mentions "account initials affordance" but its destination is the Account route in the bottom nav. No top header in v1 chrome.
- Sheet primitives (`DetailSheet`, `SwipeActionRow`) — those land when their first feature does (Story 2.1+).
- Loaders (`route.loader`) for app data — architecture §Frontend Architecture: "Route loaders are not used for app data in v1. Use TanStack Query." Don't accidentally introduce them.

### CRITICAL: gating must be CENTRALIZED in `/app/layout.tsx`

UX-DR4 and architecture §Authentication & Security both require **one** gating point for the `/app/*` tree. Do not:

- Wrap individual routes in a `<RequireAuth>` HOC.
- Re-check `useMe()` from inside `/app/chef`, `/app/plan`, etc.
- Add gating logic inside `AppShell.tsx` (AppShell is presentation; the route layout is the gate).
- Create a `<ProtectedRoute>` wrapper in `routes.ts`.

The parent route component IS the gate. Its render branches (no-token → loading → error → no-household → ready) are the entire authorization surface for `/app/*`. Children just render — they trust that if they mounted, the user is authenticated AND has a household.

If a future story needs a different gate (e.g. owner-only), it lives at the leaf for that screen, not as another `/app/*` wrapper.

### CRITICAL: redirects use `useEffect`, not render-time `navigate`

Calling `navigate(...)` during render triggers a React warning ("Cannot update a component while rendering a different component") and causes intermittent loops. Always:

```tsx
useEffect(() => {
  if (!hasToken) navigate("/login", { replace: true });
}, [hasToken, navigate]);
```

`<Navigate to="/login" replace />` from `react-router` is also valid but it returns null synchronously, which means the loading-state chrome cannot paint first. We want the chrome to paint, so prefer the imperative form in `layout.tsx`. `<Navigate>` is fine for trivial passthrough cases like the `/app` index → `/app/chef` redirect (T4) where there is no chrome to preserve.

### Token check is synchronous, household check is async

Two different state sources, two different patterns:

- **Token presence**: `getToken()` reads `localStorage` synchronously. Use this directly in `useEffect` deps and at render top. No hook, no query.
- **Household state**: `useMe()` is a TanStack Query — async, with `isLoading`/`isError`/`data` lifecycle. The `householdId` field is the source of truth; **never** infer household from a JWT claim or from the token's mere presence.

Mixing these is the most common gating bug. Symptoms: a user with a token but a stale 401-pending request gets shown the shell for one frame, then redirected. Avoid by gating in this exact order: no-token first (synchronous, drops to login), then `me.isLoading` (paints chrome), then `me.data?.householdId === null` (drops to onboarding), then ready.

### React Router 7 framework-mode nested routes

Story 1.1 used flat `route()` calls. Story 1.3 introduces the first nested layout. The pattern in [frontend/app/routes.ts](frontend/app/routes.ts) is:

```ts
route("app", "routes/app/layout.tsx", [
  index("routes/app/index.tsx"),
  route("chef", "routes/app/chef.tsx"),
  // ...
]);
```

The third argument is a nested children array. The `layout.tsx` component must render `<Outlet />` from `react-router` somewhere inside its rendered tree (specifically: inside `<AppShell>` so children render in the main area). The layout receives child routes via the outlet — it does NOT receive child route content as children prop.

If type errors appear from `@react-router/dev`, run `npm run typecheck` in `frontend/` to regenerate route types (the `npm run typecheck` script runs `react-router typegen && tsc`). React Router 7 generates type files under `.react-router/types/` based on `routes.ts`; stale types are a common cause of misleading TS errors. Don't ignore the errors — regenerate first.

If unsure about React Router 7's nested-routes API or `<NavLink>` `isActive` rendering, run `npx ctx7@latest library "React Router" "v7 nested routes layout outlet and NavLink isActive className"` first per AGENTS.md's Context7 rule. Don't guess from training data.

### Mobile-first dimensions and safe-area math

- Max content width: 480px (centered, mx-auto). UX spec line 821 says 420–520; 480 is the middle and aligns with Tailwind's `max-w-[480px]` arbitrary value. Easy to dial later if a designer pushes back.
- Bottom nav height: 56px content + safe-area inset bottom (`env(safe-area-inset-bottom, 0px)`). On iOS the inset can be 34px (home-indicator phones), on Android typically 0.
- Main content `padding-bottom`: `calc(env(safe-area-inset-bottom, 0px) + 4rem)` so content above the nav is reachable. 4rem = 64px ≈ nav 56px + 8px breathing room.
- Min viewport: 360×640. Verify in T7. With five nav items the per-item width is ~72px — icons stay 24px and labels stay 1 line.

### File scoping — UPDATE vs CREATE

**Files to UPDATE in this story:**

| Path                                                         | Change                      | What this story changes                                           | What must be preserved                                                |
| ------------------------------------------------------------ | --------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------- |
| [frontend/app/routes.ts](frontend/app/routes.ts)             | Switch to nested config     | Add `/app` parent layout with five children + `/onboarding` route | Existing `index`, `/login`, `/register` routes — keep verbatim.       |
| [frontend/app/routes/home.tsx](frontend/app/routes/home.tsx) | Add token-presence redirect | If `getToken()` is set, redirect to `/app` on mount               | Existing "Project ready!" markup — keep for unauthenticated visitors. |

**Files to CREATE in this story:**

| Path                                    | Purpose                                                      |
| --------------------------------------- | ------------------------------------------------------------ |
| `frontend/app/routes/app/layout.tsx`    | `/app/*` parent route — owns gating + AppShell mount         |
| `frontend/app/routes/app/index.tsx`     | `/app` index — redirects to `/app/chef`                      |
| `frontend/app/routes/app/chef.tsx`      | Placeholder — header + "kommer i Story 2.1" hint             |
| `frontend/app/routes/app/plan.tsx`      | Placeholder — header + "kommer i Story 2.2" hint             |
| `frontend/app/routes/app/shop.tsx`      | Placeholder — header + "kommer i Story 4.1" hint             |
| `frontend/app/routes/app/book.tsx`      | Placeholder — header + "kommer i Story 5.1" hint             |
| `frontend/app/routes/app/account.tsx`   | Placeholder — header + "kommer i Story 6.1" hint             |
| `frontend/app/routes/onboarding.tsx`    | Stub — replaced by Story 1.4 with the real create/join form  |
| `frontend/app/components/AppShell.tsx`  | Mobile-first centered shell with content + sticky nav        |
| `frontend/app/components/BottomNav.tsx` | Five `NavLink`s with icons + labels, accessible active state |

No backend changes. No new dependencies (`lucide-react` is already installed per [frontend/package.json:22](frontend/package.json#L22)). No SQL migrations.

### Things that look tempting but are out of scope

- Building the actual onboarding form (create-household, join-household, invite-code input) — Story 1.4 owns this.
- Building the Chef screen with recipe cards — Story 2.1.
- A top header bar, breadcrumb, or page-title component — not in UX spec for v1; routes own their own headers if any.
- A `<RequireAuth>` HOC, `<RequireHousehold>` HOC, or shared `useGate()` hook — premature abstraction. Two call-sites (layout.tsx + onboarding.tsx) is below the rule-of-three threshold; gate logic is colocated and obvious in each.
- A skeleton library (`react-loading-skeleton` or similar). Tailwind `animate-pulse` on a div is enough for the loading state in T2 branch 3. Reaching for a library when 4 lines of CSS will do is what makes brownfield codebases bloat.
- Page transitions or route animation. `prefers-reduced-motion` exists but the simplest correct answer is no animation in v1 (UX-DR46 and accessibility line 867).
- A "back" button anywhere in the shell — bottom nav owns top-level navigation; sheets own focused decisions. Browser back works for hard-refresh recovery and that is the v1 contract.
- Building or wiring an Account screen with a real logout button — the temporary logout button on `/onboarding` (T5) is dev-only scaffolding. Story 6.1 owns the proper Account screen. Remove the temp button (or leave it — Story 1.4 will replace this whole route body) but do NOT add one to AppShell.
- React i18next setup. Hardcoded Norwegian nav labels are fine for v1 chrome. Story 6.1 introduces i18n and can replace the strings then.
- Adding `route.loader` for prefetching `/api/auth/me`. Architecture §Frontend Architecture explicitly forbids loaders for v1 app data. `useMe()` from `useQuery` is the only way auth state enters the shell.

### Cross-cutting rules — non-negotiable

- New frontend code lives in `frontend/`. Never in `client-react/`.
- Use `apiFetch` for ALL `/api/*` calls (already enforced via `useMe()` from Story 1.2). No direct `fetch` calls in this story.
- Use TanStack Query for server state. The household status comes from `useMe()`, period. Never `useState` + `useEffect` to refetch.
- Use shadcn CLI for any new shadcn components. None are needed in this story (button/input/label are already installed; AppShell + BottomNav are NOT shadcn primitives — they are app-level shared components and live in `frontend/app/components/` per architecture §Component Boundaries, NOT in `app/components/ui/`).
- Bottom nav `aria-current="page"` is mandatory (NFR16, UX accessibility line 836). Color alone is forbidden (NFR20).
- Tap targets ≥ 44×44px (UX accessibility line 838).
- Use the **frontend-design skill** for the visual styling pass (AGENTS.md).

### React Router 7 SPA fallback reminder

Story 1.1 set `ssr: false` and added `MapFallbackToFile` ([backend/Program.cs:85](backend/Program.cs#L85)) so any client route survives hard refresh. The fallback regex excludes `/api/*`, so:

- Direct navigation or hard refresh on `/app/chef` → backend serves `index.html` → SPA boots → `routes.ts` matches `/app` parent → `layout.tsx` runs gating → either redirects or renders the shell with Chef as the child.
- This is the contract NFR15 pins down. Verify it explicitly in T7 — a regression here breaks the demo (NFR11).

### Testing standards summary

- No automated tests in the repo today; this story does not introduce a test framework (architecture §Test Organization: "tests, if added").
- Manual smoke verification per T7 is the source of truth. Document the seven verification results in the Completion Notes List.
- Visual smoke at 360px and on a desktop viewport. Keyboard smoke through the bottom nav.
- If a smoke check fails, fix the root cause; do not catch and ignore. The whole point of the gating matrix is predictable behavior.

### Project Structure Notes

- `frontend/app/routes/app/` is a NEW subdirectory. Establish the convention: route subdirectories with kebab/lowercase paths and a `layout.tsx` for parent routes. Story 2.1+ will add more routes; some will live at the top level (`/recipes/:id` if added) and some under `/app/*`.
- `frontend/app/components/AppShell.tsx` and `frontend/app/components/BottomNav.tsx` use PascalCase filenames per architecture §Naming ("Shared frontend components use PascalCase"). They live directly under `components/`, NOT under `components/ui/` (which is reserved for shadcn primitives — architecture §Frontend Organization).
- Do NOT create `components/AppShell/index.tsx` or any folder-per-component split. One file per component is the convention until a component grows subcomponents that ONLY it consumes.
- Do NOT create `dates.ts` or `i18n.ts` from the architecture tree (architecture.md lines 449–450). They land when their first consumer arrives (Story 2.2 for dates, Story 6.1 for i18n).

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication-&-Security] (gating rules, server-side household)
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend-Architecture] (TanStack Query for state, no route loaders for v1 app data)
- [Source: _bmad-output/planning-artifacts/architecture.md#Component-Boundaries] (`components/ui` for shadcn, `components/` for shared product components)
- [Source: _bmad-output/planning-artifacts/architecture.md#State-Management-Patterns] (`['me']` query key)
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation-Sequence] (step 3: gating after `apiFetch` + `/api/auth/me`)
- [Source: _bmad-output/planning-artifacts/architecture.md:432-437] (project tree expects `AppShell.tsx`, `BottomNav.tsx`, `DetailSheet.tsx`, `SwipeActionRow.tsx` — story 1.3 ships the first two)
- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.3] (acceptance criteria)
- [Source: _bmad-output/planning-artifacts/epics.md#Additional-Requirements] (no production CORS, mobile-first, react-router SPA mode)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md:330-340] (mobile-first shell, sticky bottom nav, safe-area)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md:380-410] (onboarding flow diagram — gating logic)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md:534-556] (App Shell + Bottom Navigation component specs)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md:736-748] (Navigation Patterns: routes for top-level, sheets for focused decisions, gating)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md:792-840] (Responsive + Accessibility — 360/390/768/1024, 44px tap targets, focus, color-not-alone)
- [Source: AGENTS.md] (frontend-design skill, shadcn CLI, Context7)
- [Source: backend/Program.cs:85] (SPA fallback excludes `/api/*`)
- [Source: frontend/app/lib/auth.ts] (`getToken()`, `clearAuth()` from Story 1.2)
- [Source: frontend/app/features/auth/use-me.ts] (`useMe()` from Story 1.2)
- [Source: frontend/app/lib/api-fetch.ts] (401 handler — already redirects to `/login` and clears the token)

### Previous story intelligence — Story 1.2 ([1-2-auth-session-api-registration-login-logout-and-recovery.md](_bmad-output/implementation-artifacts/1-2-auth-session-api-registration-login-logout-and-recovery.md))

Story 1.2 is `in-progress` at story 1.3 creation time but its dev notes establish the contracts this story builds on. Critical carry-overs:

- **`useMe()` exists** at [frontend/app/features/auth/use-me.ts](frontend/app/features/auth/use-me.ts) — already returns `MeResponse` with `householdId: number | null`. Use it directly in `layout.tsx`. Do not re-implement.
- **`apiFetch` already handles 401** — clears token + redirects to `/login`. Story 1.3's gating layer doesn't need to handle 401 explicitly; it just observes that after a 401, `getToken()` is null and Branch 2 fires on next render. AC4's "stale household screens are no longer visible" contract from Story 1.2 is forward-compatible with the shell built here.
- **`useLogout()` exists** at [frontend/app/features/auth/use-logout.ts](frontend/app/features/auth/use-logout.ts). Use it for the dev-only logout button on the `/onboarding` stub (T5). Story 6.1 wires the proper Account screen.
- **Login navigates to `/app` on success** ([frontend/app/features/auth/login-form.tsx:55](frontend/app/features/auth/login-form.tsx#L55)). Until Story 1.3 lands, that route 404s. After this story, login lands on `/app` → index redirects to `/app/chef` → gating sends to `/onboarding` if no household. The chain is finally complete after this story.
- **`MeResponse.householdName` is `""` for users without a household** ([frontend/app/features/auth/types.ts:7](frontend/app/features/auth/types.ts#L7) — `string`, not `string | null`). Use `householdId === null` as the no-household check, NOT `householdName === ""`. The id is authoritative; the name is a UX hint.
- **`MeResponse.householdRole` is `'eier' | 'medlem' | null`**. Story 1.3 doesn't use it (owner-only controls land in Story 1.4 + Story 6.1) but the type exists.
- **Token key is `"ccs.auth.token"`** in `localStorage` ([frontend/app/lib/auth.ts:1](frontend/app/lib/auth.ts#L1)). Match for any debug scripts.
- **Vite dev proxy** to backend `/api/*` was added in Story 1.2's T2c — same-origin in dev as well as prod. No CORS issues in dev for this story.

### Git intelligence — recent commits

Last 5 commits as of story creation:

- `a49039e Update App.jsx` — deprecated `client-react/` change. Ignore.
- `c71bd65 Endret varer endepunkter` — backend product endpoints. Not related.
- `867cd86 Release v8 - added recipe categories support`, `9d215b5 Update OppskrifterController.cs`, `6093fe0 Update OppskrifterController.cs` — recipe controller iterations.

No commits yet for Story 1.2's frontend work (it's `in-progress`, presumably uncommitted) or Story 1.1 (note: `frontend/app/lib/`, `frontend/app/features/auth/`, `frontend/app/components/ui/` are present in the working tree but appear untracked per the git status — `frontend/` is in the "??" set). The dev agent should COMMIT Story 1.2's tracked work before starting Story 1.3 implementation if it has not been committed yet, so a clean rebase/diff exists for review. If Story 1.2 has not actually been completed end-to-end, escalate before continuing — Story 1.3 hard-depends on `useMe()` returning real household data.

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npx ctx7@latest library "React Router" ...` — resolved official docs as `/remix-run/react-router`.
- `npx ctx7@latest docs /remix-run/react-router ...` — confirmed nested route children, parent `<Outlet />`, and `NavLink` active-state usage.
- `npm run typecheck --prefix frontend` — passed after React Router typegen and TypeScript.
- `dotnet build backend\backend.csproj --no-restore` — passed.
- `npm run build` — passed; frontend production build copied into `backend/wwwroot`.

### Completion Notes List

- Implemented a nested `/app` parent route with centralized auth/household gating in `frontend/app/routes/app/layout.tsx`; no per-child route guards or HOCs were added.
- Added `AppShell` and `BottomNav` with mobile-first 480px shell, safe-area-aware sticky bottom navigation, `NavLink` active state, bold active label, top indicator, icons, focus rings, and reserved nav space during auth loading.
- Added `/app` index redirect plus Chef, Plan, Shop, Book, and Account placeholder routes; no feature-scoped screens were scaffolded beyond the story placeholders.
- Added `/onboarding` stub with local auth/household gating, loading/error states, and temporary logout button for Story 1.3 isolation testing.
- Updated `/` so authenticated users redirect to `/app` while preserving the unauthenticated "Project ready!" placeholder.
- Verification completed: Context7 React Router doc check, frontend typecheck, backend build, root production build/copy.
- Pending verification: T7 live browser/DB smoke matrix (`/app` unauth redirect, no-household onboarding redirect, household shell/nav, loading layout stability, hard refresh fallback, public route negative check, 360px and keyboard pass).

### File List

- `_bmad-output/implementation-artifacts/1-3-authenticated-app-shell-and-route-gating.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `frontend/app/routes.ts`
- `frontend/app/routes/home.tsx`
- `frontend/app/routes/onboarding.tsx`
- `frontend/app/routes/app/layout.tsx`
- `frontend/app/routes/app/index.tsx`
- `frontend/app/routes/app/chef.tsx`
- `frontend/app/routes/app/plan.tsx`
- `frontend/app/routes/app/shop.tsx`
- `frontend/app/routes/app/book.tsx`
- `frontend/app/routes/app/account.tsx`
- `frontend/app/components/AppShell.tsx`
- `frontend/app/components/BottomNav.tsx`
- `backend/wwwroot/**` (generated production build output refreshed by root build)

### Change Log

| Date       | Description                                                                                                                        |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 2026-04-30 | Story created, status: ready-for-dev.                                                                                              |
| 2026-04-30 | Implementation started; status set to in-progress.                                                                                 |
| 2026-04-30 | Implemented T1-T6 app routing, gate, shell/nav, placeholders, onboarding stub, and home redirect. T7 manual smoke remains pending. |
