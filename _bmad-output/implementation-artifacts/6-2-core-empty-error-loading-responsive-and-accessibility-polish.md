# Story 6.2: Core Empty, Error, Loading, Responsive, and Accessibility Polish

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a household member,
I want the app to remain clear and accessible across states and devices,
so that the household workflow works beyond the happy-path demo device.

## Acceptance Criteria

1. **Core empty states guide the next useful action**
   - **Given** Chef, Plan, Shop, or Cookbook has no data
   - **When** the route renders
   - **Then** the empty state guides the next useful action for that route
   - **And** the copy is localized through the existing i18n resources.

2. **Core load failures are recoverable and user-facing**
   - **Given** any core route fails to load
   - **When** an error state is shown
   - **Then** it uses recoverable language with retry where appropriate
   - **And** it avoids technical backend wording or raw exception text in normal production UI.

3. **Loading states are local, stable, and localized**
   - **Given** auth, onboarding, app shell, route content, lists, sheets, or lookup data are loading
   - **When** the UI renders
   - **Then** the app shell remains stable and only the affected content shows skeletons, reserved row space, or concise loading text
   - **And** loading labels are available to assistive technology where meaningful.

4. **Responsive layouts remain usable at target widths**
   - **Given** the app is tested at 360px, 390px, 768px, and desktop widths
   - **When** core routes and sheets render
   - **Then** text, controls, bottom navigation, and sticky actions do not overlap
   - **And** desktop remains a centered mobile app shell rather than a dashboard.

5. **Keyboard navigation reaches primary actions**
   - **Given** keyboard-only navigation is used
   - **When** the user moves through auth, onboarding, app shell, sheets, rows, and forms
   - **Then** all primary actions are reachable
   - **And** focus states are visible.

6. **Motion and status cues remain accessible**
   - **Given** reduced motion is preferred
   - **When** sheets, swipe animations, or toasts are displayed
   - **Then** transitions remain understandable without relying on motion-heavy behavior
   - **And** statuses such as purchased, excluded, duplicate, selected, loading, error, and active are not conveyed by color alone.

## Tasks / Subtasks

- [ ] **T1: Add or consolidate shared state presentation primitives** (AC: 1, 2, 3)
  - [ ] Create small product-level components only if they remove real duplication, likely under `frontend/app/components/`, such as `EmptyState`, `ErrorState`, or `ListSkeleton`.
  - [ ] Keep `frontend/app/components/ui` reserved for shadcn/base-ui primitives.
  - [ ] Do not hand-create new shadcn primitive files. If a new primitive is truly needed, install it with `pnpm dlx shadcn@latest add [component]`.
  - [ ] Use lucide-react icons only where an icon improves scanning; do not add decorative-only state art.
  - [ ] Keep cards limited to repeated items, focused state blocks, or route content surfaces. Do not wrap cards inside cards.

- [ ] **T2: Polish Chef empty, error, loading, and sheet states** (AC: 1, 2, 3, 4, 5, 6)
  - [ ] Update `frontend/app/routes/app/chef.tsx`.
  - [ ] Preserve search/filter behavior, `RecipeCard`, `RecipeDetailPanel`, `AddToPlanPanel`, `DetailSheet`, `useRecipes`, `useRecipe`, `useRecipeCategories`, and `useCreatePlannedMeal`.
  - [ ] Replace hard-coded user-facing route/sheet state copy with `t(...)` keys in `frontend/app/lib/i18n.ts`.
  - [ ] Ensure no-results state offers filter clearing when filters are active, and no-recipe state points to the correct next action or explains the absence without dead-end wording.
  - [ ] Keep recipe detail and add-to-plan loading/error states inside the sheet; do not block the route shell.
  - [ ] Verify recipe cards, filter chips, search field, sheet footer actions, and loading skeletons do not overflow at 360px.

- [ ] **T3: Polish Plan route states, meal slots, suggestions, and ingredient controls** (AC: 1, 2, 3, 4, 5, 6)
  - [ ] Update `frontend/app/routes/app/plan.tsx`.
  - [ ] Preserve Monday `YYYY-MM-DD` week semantics, week navigation, `usePlannedMeals`, planning mutations, shopping suggestion generation/confirmation, and `SwipeActionRow` ingredient alternatives.
  - [ ] Localize remaining hard-coded strings, including empty slots, edit-sheet actions, ingredient labels, remove confirmation, shopping suggestion sheet copy, duplicate status, quantity warning, and toast copy where touched.
  - [ ] Make the empty week state more actionable and consistent with other empty states, pointing to Chef without hiding the weekly structure.
  - [ ] Keep the "Generate shopping suggestions" action visible only when planned meals exist, and keep generation failure as toast or inline recoverable feedback without inserting rows.
  - [ ] Ensure suggestion rows have accessible checkbox labels that include item and status, and duplicate/already-on-list status includes text/icon, not color alone.
  - [ ] Ensure servings steppers, remove confirmation, ingredient exclude/restore fallback buttons, and sheet footer actions are keyboard reachable and visibly focused.

- [ ] **T4: Polish Shop route active/purchased states and completion sheet** (AC: 1, 2, 3, 4, 5, 6)
  - [ ] Update `frontend/app/routes/app/shop.tsx`.
  - [ ] Preserve `useShoppingList`, purchased list, manual add/edit, purchase/restore, completion preview, completion mutation, `DetailSheet`, and `SwipeActionRow`.
  - [ ] Localize remaining hard-coded copy through `frontend/app/lib/i18n.ts`, including tabs, active/purchased subtitles, empty states, form labels/errors, purchase/restore labels, completion preview, and toasts where touched.
  - [ ] Keep active empty state actionable with both manual add and Plan navigation.
  - [ ] Keep purchased empty state explanatory and reversible: it should tell users purchased rows appear here after they check off items.
  - [ ] Ensure load errors use friendly retry text rather than exposing raw backend wording.
  - [ ] Verify add/edit sheet form controls have labels, validation feedback, and stable footer buttons at 360px.
  - [ ] Verify purchase and restore are available through both swipe and the fallback button.

- [ ] **T5: Polish Cookbook route empty/error/loading/filter/rating states** (AC: 1, 2, 3, 4, 5, 6)
  - [ ] Update `frontend/app/routes/app/book.tsx`.
  - [ ] Preserve cookbook search/filter/sort, `useCookbookHistory`, `useSaveCookbookRating`, re-plan sheet, `AddToPlanPanel`, and per-user rating semantics.
  - [ ] Localize remaining hard-coded copy through `frontend/app/lib/i18n.ts`, including no-results, empty cookbook, sorting labels, last-cooked metadata, re-plan copy, sheet actions, and toasts where touched.
  - [ ] Keep empty cookbook guidance tied to completing a shopping trip, with a secondary path back to Plan or Chef when helpful.
  - [ ] Ensure rating controls remain labelled as the current user's rating and are not conveyed by stars alone.
  - [ ] Ensure filter/sort controls wrap cleanly at 360px and remain keyboard reachable.

- [ ] **T6: Polish auth, onboarding, app shell, bottom nav, and root fallback states** (AC: 2, 3, 4, 5, 6)
  - [ ] Review `frontend/app/features/auth/login-form.tsx`, `frontend/app/features/auth/register-form.tsx`, `frontend/app/routes/login.tsx`, `frontend/app/routes/register.tsx`, and `frontend/app/routes/onboarding.tsx`.
  - [ ] Preserve existing `react-hook-form`, `zod`, `apiFetch`, auth token, and `/api/auth/me` patterns.
  - [ ] Ensure validation messages, top-level form errors, loading/submitting labels, and onboarding errors are localized and recoverable.
  - [ ] Review `frontend/app/components/AppShell.tsx` and `frontend/app/components/BottomNav.tsx`; preserve the centered mobile shell and bottom navigation.
  - [ ] Ensure bottom navigation labels in Norwegian and English fit at 360px without overlap and active state is not color-only.
  - [ ] Review `frontend/app/root.tsx` route `ErrorBoundary`; avoid dev stack traces outside `import.meta.env.DEV`, and keep production copy friendly/localized.

- [ ] **T7: Add reduced-motion and focus/contrast polish without broad restyling** (AC: 4, 5, 6)
  - [ ] Update `frontend/app/app.css` only where needed for global focus, reduced-motion, or semantic token fixes.
  - [ ] Preserve the existing light/dark semantic CSS variables and theme provider behavior from Story 6.1.
  - [ ] Add or verify `prefers-reduced-motion` handling for animations that are under project CSS control, especially pulse skeletons and app-level transitions.
  - [ ] Do not remove `react-swipeable-list/dist/styles.css`; it is imported once in `frontend/app/root.tsx`.
  - [ ] Ensure focus rings remain visible on buttons, links, inputs, bottom navigation, tab-like controls, row fallback buttons, sheet close buttons, and dialog controls.
  - [ ] Do not introduce a one-note palette or broad visual redesign.

- [ ] **T8: Verify the polish pass end-to-end** (AC: 1, 2, 3, 4, 5, 6)
  - [ ] Run `npm run typecheck --prefix frontend`.
  - [ ] Run root `npm run build` because app shell/root/styles/i18n changes affect backend-served SPA output.
  - [ ] Manual route smoke: Chef, Plan, Shop, Book, Account, login, register, and onboarding render normal, empty, loading, and recoverable error states where practical.
  - [ ] Manual viewport smoke at 360px, 390px, 768px, and desktop-centered width: no overlap between text, controls, bottom navigation, sheet footers, or sticky headers.
  - [ ] Manual keyboard smoke: auth forms, onboarding paths, bottom nav, Chef filters/cards/sheet, Plan week/actions/sheets, Shop tabs/rows/sheets, Book filters/ratings/re-plan, Account settings.
  - [ ] Manual reduced-motion smoke: enable reduced motion in the browser/OS and confirm animations are subdued while state changes remain understandable.
  - [ ] Manual language smoke: switch Norwegian/English and confirm newly polished states use translations and still fit.
  - [ ] Manual theme smoke: light/dark/system preserve readable contrast for empty/error/loading/status states.

### Review Findings

- [x] [Review][Patch] Stored language preference applies too late and root errors can render in the wrong language [frontend/app/lib/i18n.ts:769]
- [x] [Review][Patch] Add-to-plan sheets still contain hard-coded Norwegian and raw save errors [frontend/app/features/planning/add-to-plan-panel.tsx:93]
- [x] [Review][Patch] Root ErrorBoundary can expose production `statusText` instead of friendly localized copy [frontend/app/root.tsx:65]
- [x] [Review][Patch] Protected meal removal displays raw API message inline [frontend/app/routes/app/plan.tsx:263]
- [x] [Review][Patch] Shopping add/edit lookup failure disables saving without a retry path [frontend/app/routes/app/shop.tsx:525]
- [x] [Review][Patch] Shopping form marks quantity invalid for unrelated type/unit errors [frontend/app/routes/app/shop.tsx:597]

## Dev Notes

### Scope boundaries

This story is frontend-only polish for the core app surfaces. It should not add backend endpoints, database tables, new routing architecture, demo seed data, analytics, a new design system, or a desktop dashboard layout.

Story 6.3 owns exam demo data and production/demo reliability. Story 6.2 may improve the clarity of states that support the demo path, but it should not solve seed data, Railway, or SPA fallback work unless a tiny frontend-only issue is discovered while verifying.

### Current state to preserve

- `frontend/app/routes/app/chef.tsx` already has recipe search/filtering, route-level skeletons, empty/no-results state, recipe detail sheet, add-to-plan sheet flow, and `RecipeCard` reuse.
- `frontend/app/routes/app/plan.tsx` already has Monday week navigation, planned meal slots, edit servings sheet, ingredient exclude/restore through `SwipeActionRow`, generated shopping suggestions, and confirmation before insertion.
- `frontend/app/routes/app/shop.tsx` already has active/purchased tabs, manual add/edit sheet, purchase/restore rows through `SwipeActionRow`, empty states, and purchase completion preview/confirmation.
- `frontend/app/routes/app/book.tsx` already has cookbook search/filter/sort, per-user rating controls with text plus stars, empty/no-results states, and re-plan sheet.
- `frontend/app/routes/app/account.tsx` is being shaped by Story 6.1 and already uses `SettingSection`, `LanguagePreferenceControl`, `ThemePreferenceControl`, `useMe()`, `useHousehold()`, invite controls, dialogs, and localized copy.
- `frontend/app/components/AppShell.tsx` owns the centered mobile shell with max width `480px`, safe-area-aware bottom padding, and bottom navigation placement.
- `frontend/app/components/BottomNav.tsx` owns Chef/Plan/Shop/Book/Account navigation labels and active-route indication.
- `frontend/app/components/detail-sheet.tsx` owns sheet title/description/footer structure, scrollable content, safe-area footer padding, max width, and return focus behavior.
- `frontend/app/components/SwipeActionRow.tsx` already wraps `react-swipeable-list` and provides a real fallback `Button`; extend carefully rather than making per-route swipe variants.
- `frontend/app/lib/i18n.ts` already initializes `i18next`/`react-i18next`, persists `chopchopshop-language`, updates `document.documentElement.lang`, and contains existing `nb`/`en` resource groups.
- `frontend/app/root.tsx` imports i18n once, injects `themeInitScript()`, wraps the app with `ThemeProvider` and `QueryClientProvider`, imports swipe styles once, and includes the route `ErrorBoundary`.
- `frontend/app/app.css` defines Tailwind v4, shadcn tokens, semantic light/dark color variables, font setup, and base focus outline token application.

### Implementation guidance

- Prefer tightening existing route states over inventing a large state framework. A small shared component is useful only if it reduces repeated empty/error/skeleton markup across routes.
- Keep state copy outcome-oriented. Empty states should answer "what can I do next?" Error states should answer "how do I recover?"
- Avoid raw technical errors in route UI. It is fine to keep detailed stack output in the root error boundary only under `import.meta.env.DEV`.
- Localize all newly touched user-facing copy in `frontend/app/lib/i18n.ts`; do not add scattered string maps.
- Keep route data fetching in TanStack Query hooks; do not move app data into React Router loaders.
- Use `apiFetch` for any API call. This story should not need new API calls.
- Preserve targeted query invalidation in existing hooks; state polish should not change server-state semantics.
- Preserve shadcn/base-ui composition patterns already in the project. In this codebase, dropdown/menu trigger composition may use base-ui `render`, not Radix `asChild`.
- For loading states, reserve stable dimensions with fixed heights, min heights, or row skeleton shapes so app content does not jump.
- For responsive text, wrap or shorten labels before shrinking fonts. Do not scale font size with viewport width.
- For bottom nav and compact controls, prefer icon plus short label, stable min dimensions, and wrapping-safe text.
- For status cues, combine text and icons/badges where useful. Do not rely on color alone for purchased, excluded, duplicate, selected, or active states.
- For reduced motion, use CSS media queries and component props already available in local primitives where possible. Do not replace libraries solely for motion support.

### Responsive and accessibility guardrails

- 360px is the primary stress viewport. Test long Norwegian labels there, not only English.
- Desktop must remain a centered mobile app shell. Do not introduce a side nav, table dashboard, multi-column route rewrite, or marketing-style layout.
- All primary actions must be reachable with keyboard: submit forms, retry, clear filters, open recipe, add to plan, edit planned meal, change servings, remove planned meal, generate suggestions, select suggestions, confirm suggestions, add/edit shopping item, purchase/restore row, complete shopping trip, rate cookbook item, re-plan item, switch language/theme, generate/copy/revoke invite, and logout.
- Focus must be visible on interactive elements. Do not remove outlines without an equivalent visible focus style.
- `DetailSheet` and dialogs should have labelled headings and return focus to the triggering control when closed where a trigger exists.
- Swipe actions must keep tap/click/keyboard alternatives through `SwipeActionRow`.
- Forms must have labels, validation text, and `aria-invalid` where errors are present.
- Loading regions should use `aria-busy` or descriptive labels where they communicate meaningful state; avoid noisy announcements for purely decorative skeletons.

### Previous story intelligence

Story 6.1 is the immediate predecessor and may still be in uncommitted implementation work at story creation time:

- Reuse Story 6.1's i18n layer. Do not create another language provider, storage key, or translation system.
- Reuse Story 6.1's theme layer. Do not replace `ThemeProvider`, `themeInitScript()`, `useTheme()`, or `THEME_STORAGE_KEY = "vite-ui-theme"`.
- Account settings belong in `frontend/app/features/settings`; shared state polish belongs in `frontend/app/components` only when product-level and reusable.
- Story 6.1 intentionally limited translation scope to app chrome/common/demo-path copy. Story 6.2 owns broader state copy coverage across core routes.
- Preserve any uncommitted Story 6.1 changes in `account.tsx`, `BottomNav.tsx`, `mode-toggle.tsx`, `root.tsx`, `i18n.ts`, `features/settings`, and auth forms. Treat them as current project state.

Earlier story learnings still apply:

- Household authorization remains server-side only.
- The app is mobile-first and centered on desktop.
- All frontend HTTP calls go through `apiFetch`.
- TanStack Query hooks own server state.
- Toasts are suitable for low-risk mutation success/failure, while load errors should provide inline retry when practical.
- Swipe-only interactions require accessible alternatives.
- Root `npm run build` is the deployment-shape verification because the frontend is served from the .NET backend output.

### Git intelligence

Current branch at story creation time is `feature/frontend-rebuild`, matching the project rule.

Recent relevant commits:

- `cb37137 feat(cookbook): history search, sorting, and re-planning from book route`
- `299ec37 feat(shopping): complete shopping trip and archive list`
- `59da867 feat(shopping): purchase, restore, and archive shopping rows`
- `d3f7986 feat(shopping): active shopping list with manual items and editing`
- `268c225 feat(shopping): confirm suggestions and link to planned meals`

Working tree note at story creation time: several Story 6.1/frontend files and `sprint-status.yaml` already had uncommitted changes. Do not revert unrelated work while implementing Story 6.2.

### Latest technical information

No new library setup is required by this story. Use the libraries already selected by the project: React 19, React Router 7 SPA/static mode, Tailwind CSS v4, shadcn/base-ui primitives, lucide-react, TanStack Query v5, react-hook-form, zod, sonner, react-i18next/i18next, and react-swipeable-list through `SwipeActionRow`.

If implementation needs current syntax, setup, or migration guidance for React, React Router, Tailwind, shadcn/base-ui, Sonner, TanStack Query, i18next, or react-swipeable-list, run Context7 first with the full implementation question before relying on memory.

### Testing standards summary

There is no broad established automated test suite for this polish pass. Verification should focus on type safety, build integrity, responsive layout, keyboard access, localization coverage, theme contrast, and reduced-motion behavior.

Minimum verification:

- `npm run typecheck --prefix frontend`
- `npm run build`
- Manual viewport checks at 360px, 390px, 768px, and desktop-centered width.
- Manual keyboard traversal through auth, onboarding, app shell, sheets, rows, forms, and settings.
- Manual Norwegian/English language checks for newly polished state copy.
- Manual light/dark/system theme checks for empty/error/loading/status states.
- Manual reduced-motion check for skeletons, sheets, swipe rows, and toasts.

## References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-6.2]
- [Source: _bmad-output/planning-artifacts/prd.md#Functional-Requirements]
- [Source: _bmad-output/planning-artifacts/prd.md#Non-Functional-Requirements]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend-Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#Process-Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure-&-Boundaries]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Empty,-Error,-and-Loading-States]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Responsive-Design-&-Accessibility]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component-Strategy]
- [Source: _bmad-output/project-context.md]
- [Source: _bmad-output/implementation-artifacts/6-1-account-preferences-theme-and-language.md]
- [Source: frontend/app/routes/app/chef.tsx]
- [Source: frontend/app/routes/app/plan.tsx]
- [Source: frontend/app/routes/app/shop.tsx]
- [Source: frontend/app/routes/app/book.tsx]
- [Source: frontend/app/routes/app/account.tsx]
- [Source: frontend/app/components/AppShell.tsx]
- [Source: frontend/app/components/BottomNav.tsx]
- [Source: frontend/app/components/detail-sheet.tsx]
- [Source: frontend/app/components/SwipeActionRow.tsx]
- [Source: frontend/app/lib/i18n.ts]
- [Source: frontend/app/root.tsx]
- [Source: frontend/app/app.css]

## Story Completion Status

Ultimate context engine analysis completed - comprehensive developer guide created.

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
