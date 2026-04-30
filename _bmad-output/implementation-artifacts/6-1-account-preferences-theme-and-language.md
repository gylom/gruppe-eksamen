# Story 6.1: Account Preferences, Theme, and Language

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want account context plus theme and language preferences,
so that the app reflects my household and display preferences.

## Acceptance Criteria

1. **Account shows household and user context**
   - **Given** a household member opens Account
   - **When** the account route renders
   - **Then** it shows user context, household name, member list, and relevant owner/non-owner controls
   - **And** it reuses the established app shell and account setting group patterns.

2. **Theme preference supports system, light, and dark**
   - **Given** the user chooses system, light, or dark theme
   - **When** the preference changes
   - **Then** the selected theme applies to the app shell, sheets, rows, controls, and status indicators
   - **And** the preference persists across reloads.

3. **Language preference supports Norwegian and English**
   - **Given** the user chooses Norwegian or English
   - **When** the preference changes
   - **Then** top-level navigation, common actions, form labels, validation messages, and core empty states use the selected language
   - **And** critical controls do not truncate at 360px.

4. **Owner-only account controls remain role-aware**
   - **Given** owner-only controls are present
   - **When** a non-owner opens Account
   - **Then** restricted controls are hidden or unavailable
   - **And** household context remains visible.

## Tasks / Subtasks

- [ ] **T1: Introduce a focused settings feature layer without moving shadcn primitives** (AC: 1, 2, 3, 4)
  - [ ] Add `frontend/app/features/settings/` for account-setting product components, option metadata, and preference helpers.
  - [ ] Keep `frontend/app/components/ui` for shadcn/base-ui primitives only.
  - [ ] If a new shadcn primitive is truly needed, install it with `pnpm dlx shadcn@latest add [component]`; otherwise compose existing `Button`, `DropdownMenu`, and semantic HTML.
  - [ ] Do not add backend endpoints for theme or language. These are per-browser display preferences for v1.

- [ ] **T2: Refine `/app/account` into account setting groups** (AC: 1, 4)
  - [ ] Update `frontend/app/routes/app/account.tsx`; preserve the route path and existing invite behavior.
  - [ ] Continue using `useMe()` and `useHousehold()` for account/household context; do not trust household ids from local storage, route params, or request bodies.
  - [ ] Show user identity from `me.data` (`brukernavn`, `email`) plus household name, current role, and member list.
  - [ ] Preserve existing owner-only invite generation, copy, replacement, revoke dialog, loading, and error states.
  - [ ] Hide or disable owner-only invite controls for non-owner members while keeping household/member context visible.
  - [ ] Use compact setting-group sections for household context, members, invite controls, language, theme, and logout if logout is present on Account.

- [ ] **T3: Wire theme controls to the existing theme implementation** (AC: 2)
  - [ ] Reuse `frontend/app/components/theme-provider.tsx`; do not replace it with `next-themes` unless there is a specific compatibility blocker.
  - [ ] Preserve `ThemeProvider`, `useTheme()`, `themeInitScript()`, and `THEME_STORAGE_KEY = "vite-ui-theme"`.
  - [ ] Preserve `frontend/app/root.tsx` behavior: inject `themeInitScript()` in `<head>`, keep `<html suppressHydrationWarning>`, and wrap the app with `<ThemeProvider defaultTheme="system">` inside the existing provider tree.
  - [ ] Update or reuse `frontend/app/components/mode-toggle.tsx` for Account. The control must expose all three choices: system, light, dark.
  - [ ] Show the current theme choice in text, not only with sun/moon icons or color.
  - [ ] Keep the base-ui dropdown `render` prop pattern for `DropdownMenuTrigger`; this project's shadcn variant does not use Radix `asChild`.
  - [ ] Show a concise toast after theme changes, using localized copy.
  - [ ] Verify app shell, sheets, rows, buttons, status indicators, dialogs, and toasts read from semantic tokens rather than hard-coded light-only colors.

- [ ] **T4: Add app-level i18n and language preference controls** (AC: 3)
  - [ ] Install missing i18n runtime packages in `frontend/` if they are still absent: `i18next` and `react-i18next`.
  - [ ] Add `frontend/app/lib/i18n.ts` with inline resources for `nb` and `en`, `fallbackLng` matching the current Norwegian-first app direction, and `interpolation.escapeValue = false`.
  - [ ] Import the i18n module once from `frontend/app/root.tsx` before route rendering.
  - [ ] Persist the selected language in local storage, for example `chopchopshop-language`, and call `i18n.changeLanguage(nextLanguage)` from the Account language control.
  - [ ] Keep the language control semantic and keyboard reachable. A labelled two-option button group, radiogroup, or CLI-installed segmented primitive is acceptable if it remains stable at 360px.
  - [ ] Update `document.documentElement.lang` when language changes (`nb` or `en`) so screen readers receive the selected language.
  - [ ] Translate top-level navigation, Account route copy, common actions (`Retry`, `Cancel`, `Copy`, `Generate`, `Replace`, `Revoke`), common loading/error text, form labels/validation messages, and existing core empty states that are already visible in the demo path.
  - [ ] Do not attempt a full content rewrite outside the core app shell/common/demo-path copy. Story 6.2 owns broader empty/error/loading/accessibility polish.

- [ ] **T5: Keep mobile layout, accessibility, and feedback reliable** (AC: 1, 2, 3, 4)
  - [ ] Test Account and bottom navigation at 360px and 390px. Norwegian and English labels must fit without truncating critical controls.
  - [ ] Keep desktop as the centered mobile app shell from `AppShell`; do not introduce a dashboard layout or side navigation.
  - [ ] Ensure all theme/language controls have visible labels, keyboard focus, and selected-state text or icons that do not rely on color alone.
  - [ ] Keep loading skeletons local to Account content; do not block or resize the whole app shell.
  - [ ] Use toast feedback for successful theme/language changes and inline/retry feedback for recoverable account loading errors.

- [ ] **T6: Verify the preference flow** (AC: 1, 2, 3, 4)
  - [ ] Run `npm run typecheck --prefix frontend`.
  - [ ] Run the root `npm run build` because frontend provider/root changes affect backend-served SPA output.
  - [ ] Manual smoke: switch system/light/dark, hard-refresh `/app/account`, and confirm the chosen theme persists without a visible flash.
  - [ ] Manual smoke: switch Norwegian/English, navigate Chef/Plan/Shop/Book/Account, and confirm bottom nav plus common route states update.
  - [ ] Manual smoke: log in as owner and non-owner, confirm invite controls remain role-aware.
  - [ ] Manual UI smoke at 360px and desktop-centered width: Account sections, dropdowns/option groups, dialogs, toasts, and bottom navigation do not overlap.
  - [ ] Manual accessibility smoke: keyboard through Account controls and confirm visible focus plus text labels for selected theme/language.

### Review Findings

- [x] [Review][Patch] Tracked npm lockfile is not updated for the new i18n dependencies, and the root build currently fails [frontend/package.json:27]
- [x] [Review][Patch] Persisted English language can diverge from the hard-coded `html lang="nb"` first document render [frontend/app/root.tsx:22]
- [x] [Review][Patch] Core demo-path copy remains hard-coded Norwegian after adding the language preference [frontend/app/routes/app/chef.tsx:175]
- [x] [Review][Patch] Account retry handles household failures but not `me` query failures [frontend/app/routes/app/account.tsx:96]
- [x] [Review][Patch] `ModeToggle` still lacks visible current theme text and theme-change toast behavior [frontend/app/components/mode-toggle.tsx:14]
- [x] [Review][Patch] Language preference toast reports success before `changeLanguage` completes [frontend/app/features/settings/language-preference-control.tsx:14]

## Dev Notes

### Scope boundaries

This story is frontend-focused. It adds display preferences and improves the Account route. It does not add user-profile editing, password changes, push notifications, multi-household switching, backend-persisted preferences, or new auth/session architecture.

Theme and language are local browser preferences for v1. Household/account context remains server-derived through existing authenticated queries.

### Current state to preserve

- `frontend/app/routes/app/account.tsx` already shows household name, member list, owner-only invite code controls, copy-to-clipboard, revoke dialog, skeleton loading, and retry error state.
- `frontend/app/features/auth/use-me.ts` exposes `useMe()` with query key `["me"]` and `/api/auth/me`.
- `frontend/app/features/auth/types.ts` exposes `brukernavn`, `email`, `householdId`, `householdName`, and `householdRole`.
- `frontend/app/features/household/use-household.ts` exposes `useHousehold()`, `useGenerateInvite()`, and `useRevokeInvite()` with query key `["household"]`.
- `frontend/app/features/household/types.ts` has the household/member/invite DTOs Account already needs.
- `frontend/app/lib/api-fetch.ts` owns auth headers, JSON bodies, backend `{ message }` errors, 401 auth clearing, and redirect to `/login`.
- `frontend/app/components/AppShell.tsx` owns the centered mobile shell and bottom-nav safe-area spacing.
- `frontend/app/components/BottomNav.tsx` owns top-level labels for Chef, Plan, Shop, Book, Account. Translate here rather than duplicating nav labels in routes.
- `frontend/app/components/theme-provider.tsx` already implements localStorage-backed light/dark/system support and OS-level system-mode reactivity.
- `frontend/app/root.tsx` already injects `themeInitScript()` before hydration and wraps the app in `ThemeProvider` and `QueryClientProvider`.
- `frontend/app/components/mode-toggle.tsx` already uses base-ui `DropdownMenuTrigger render={<Button ... />}` and should be extended/reused, not reinvented.
- `frontend/app/components/ui/sonner.tsx` already reads `useTheme()` and forwards the theme to Sonner.
- There is no current `frontend/app/lib/i18n.ts`, no `frontend/app/features/settings`, and `frontend/package.json` does not currently list `i18next` or `react-i18next`.

### Implementation guidance

- Prefer a small translation resource file over scattered string maps. Keep keys grouped by area, such as `nav`, `common`, `account`, `auth`, `onboarding`, `states`, and `preferences`.
- Use `useTranslation()` in components that render user-facing copy. Do not pass translation functions through many layers unless a component is intentionally presentational.
- Keep date formatting deliberate. Existing code uses `nb-NO` in several places; if language-specific formatting is touched, choose `nb-NO` for Norwegian and `en-US` or `en-GB` consistently for English.
- If adding a preference helper, keep it tiny and browser-safe. Guard localStorage access when code can run outside the browser.
- Keep route data fetching in TanStack Query hooks, not React Router loaders.
- Keep TypeScript strict. Add settings/i18n types where useful instead of using broad `any`.
- Do not hand-create new shadcn primitive files. Use the CLI if a primitive is needed.
- Avoid broad restyling of `app.css`; theme support should use the existing semantic CSS variables and `.dark` token set.

### Account UX guardrails

- Account should feel like a settings surface, not a marketing page.
- Use compact section headings, rows, and controls. Avoid nested cards; repeated setting groups may be individual cards/sections, but do not wrap cards inside cards.
- Language and theme controls should be close to the household/account context because this is the only settings route in v1.
- Long Norwegian and English labels must wrap or use shorter labels before they overflow controls.
- Owner/non-owner behavior must be obvious without exposing unavailable owner actions as confusing failures.

### Previous story intelligence

Story 5.2 completed per-user cookbook ratings immediately before this story:

- The Book route and cookbook hooks are active project state. Do not revert `frontend/app/routes/app/book.tsx` or the new cookbook rating hook.
- Story 5.2 reused existing backend preference storage and kept changes frontend-focused. Apply the same discipline here: reuse the Account/household/theme surfaces already present before adding new abstractions.
- Recent story verification used `npm run typecheck --prefix frontend` and root `npm run build`; keep those checks as the baseline for this frontend-root change.
- The working tree at story creation time already had uncommitted Story 5.2/sprint-status edits. Treat them as user/current project state and do not overwrite unrelated work.

Earlier epic learnings still apply:

- Household authorization is server-side only.
- App screens are mobile-first and remain centered on desktop.
- All direct frontend HTTP calls go through `apiFetch`.
- Toasts are suitable for low-risk preference changes.
- Swipe-only interactions require alternatives, but preference controls should be direct tap/click/keyboard controls.

### Git intelligence

Current branch at story creation time is `feature/frontend-rebuild`, matching the project rule.

Recent relevant commits:

- `cb37137 feat(cookbook): history search, sorting, and re-planning from book route`
- `299ec37 feat(shopping): complete shopping trip and archive list`
- `59da867 feat(shopping): purchase, restore, and archive shopping rows`
- `d3f7986 feat(shopping): active shopping list with manual items and editing`
- `268c225 feat(shopping): confirm suggestions and link to planned meals`

### Latest technical information

Context7 was used for current `react-i18next` guidance (`/i18next/react-i18next`). Relevant implementation points:

- Initialize i18next with `initReactI18next`.
- Set `interpolation.escapeValue = false` because React escapes rendered values.
- Use `useTranslation()` for component copy and `i18n.changeLanguage(...)` for switching languages.
- Use `Trans` only for complex translations that need embedded React elements; most Account/common labels should use simple `t(...)` calls.

If implementation needs current docs for React Router, shadcn/base-ui, Tailwind v4, Sonner, or another library/API, run Context7 before relying on memory.

### Testing standards summary

There is no broad established automated test suite for this flow yet. Keep verification focused on root/provider correctness, preference persistence, role-aware Account behavior, translation coverage for visible core copy, and mobile accessibility.

Minimum verification:

- Frontend typecheck catches provider, hook, route, and translation typing issues.
- Root build confirms static SPA output still compiles and copies for the .NET host.
- Manual theme smoke confirms persisted light/dark/system and no visible theme flash after refresh.
- Manual language smoke confirms selected copy on navigation, common actions, Account, and core visible empty/loading/error states.
- Manual owner/non-owner smoke confirms account invite controls are role-aware.
- Manual mobile/accessibility smoke covers 360px, desktop-centered width, keyboard focus, and non-color-only selected states.

## References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-6.1]
- [Source: _bmad-output/planning-artifacts/prd.md#Settings-Localization-&-Display-Preferences]
- [Source: _bmad-output/planning-artifacts/prd.md#Non-Functional-Requirements]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure-&-Boundaries]
- [Source: _bmad-output/planning-artifacts/architecture.md#Requirements-to-Structure-Mapping]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Account-Setting-Group]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Feedback-Patterns]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Responsive-Design-&-Accessibility]
- [Source: _bmad-output/project-context.md]
- [Source: _bmad-output/implementation-artifacts/5-2-per-user-recipe-ratings.md]
- [Source: frontend/app/routes/app/account.tsx]
- [Source: frontend/app/components/theme-provider.tsx]
- [Source: frontend/app/components/mode-toggle.tsx]
- [Source: frontend/app/root.tsx]
- [Source: frontend/app/components/ui/sonner.tsx]
- [Source: frontend/app/components/AppShell.tsx]
- [Source: frontend/app/components/BottomNav.tsx]
- [Source: frontend/app/features/auth/use-me.ts]
- [Source: frontend/app/features/auth/types.ts]
- [Source: frontend/app/features/household/use-household.ts]
- [Source: frontend/app/features/household/types.ts]
- [Source: frontend/app/lib/api-fetch.ts]
- [Source: react-i18next docs via Context7, /i18next/react-i18next]

## Story Completion Status

Ultimate context engine analysis completed - comprehensive developer guide created.

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
