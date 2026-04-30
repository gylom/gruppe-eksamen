---
stepsCompleted: [step-01-requirements-extracted, step-02-epic-list-approved, step-03-stories-generated]
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
---

# gruppe-eksamen - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for gruppe-eksamen, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Users can register for an account.
FR2: Users can log in with an existing account.
FR3: Authenticated users can remain signed in across page reloads until their session expires or they log out.
FR4: Users can log out and end their active session.
FR5: The system can identify the current authenticated user and their household membership status.
FR6: Users without a household can create a household.
FR7: Household owners can generate an invite code for their household.
FR8: Users without a household can join a household using a valid invite code.
FR9: Household owners can revoke or replace an active invite code.
FR10: Household members can view the household name and member list.
FR11: The system can distinguish household owners from non-owner members for household-management capabilities.
FR12: Users without household membership are prevented from entering household app areas.
FR13: Household members can browse available recipes.
FR14: Household members can search recipes.
FR15: Household members can filter recipes by meal type.
FR16: Household members can view recipe details, including ingredients, optional ingredients, portions, and instructions.
FR17: Household members can start meal planning from a recipe.
FR18: Household members can re-plan a cooked recipe from cookbook history.
FR19: Household members can view a shared weekly meal plan.
FR20: Household members can navigate between planning weeks.
FR21: Household members can add a recipe to a specific week, day, and meal type.
FR22: Household members can set servings for a planned meal.
FR23: Household members can edit servings for a planned meal.
FR24: Household members can remove a planned meal when it has not become cooked history.
FR25: Household members can mark ingredients on a planned meal as already available.
FR26: Household members can restore excluded ingredients on a planned meal.
FR27: The system can preserve ingredient exclusions per planned meal.
FR28: Household members can generate shopping-list suggestions from a selected week's planned meals.
FR29: The system can exclude optional ingredients from generated shopping suggestions.
FR30: The system can exclude ingredients marked already available for a planned meal.
FR31: The system can scale generated shopping suggestions based on planned servings.
FR32: The system can identify suggested items that already exist on the active shopping list.
FR33: Household members can manually confirm which generated suggestions are added to the shopping list.
FR34: Household members can view active household shopping-list rows.
FR35: Household members can add manual shopping-list rows.
FR36: Household members can edit manual or active shopping-list rows.
FR37: Household members can mark shopping-list rows as purchased.
FR38: Household members can view purchased or hidden shopping-list rows.
FR39: Household members can restore purchased or hidden rows to the active shopping list.
FR40: Household members can complete a shopping trip.
FR41: The system can archive purchased rows when a shopping trip is completed.
FR42: The system can add qualifying cooked planned meals to household cookbook history after purchase completion.
FR43: Household members can view cookbook history for their household.
FR44: Household members can search or filter cookbook history.
FR45: Household members can rate cooked recipes for their own account.
FR46: The system can sort cookbook history using the current user's ratings and recency.
FR47: The system can keep one member's rating independent from another member's rating.
FR48: Users can switch the app language between Norwegian and English.
FR49: Users can switch the app theme between system, light, and dark modes.
FR50: Users can view account and household context from an account area.
FR51: The system can support a complete demo path from authentication through cookbook history.
FR52: The system can show clear empty states when recipe, plan, shopping, or cookbook data is absent.
FR53: The system can recover users from expired or invalid sessions by returning them to authentication.
FR54: The system can preserve client-side app routes across browser refreshes.

### NonFunctional Requirements

NFR1: Top-level app navigation after initial load must update without a full page reload.
NFR2: User-triggered mutations in the core demo path should provide visible feedback within 1 second.
NFR3: Recipe browsing, planned meals, shopping list, and cookbook views should show localized loading or empty states rather than blocking the entire app shell.
NFR4: The mobile app shell must remain usable on 360px-wide phone viewports without layout jumps that interrupt the main workflow.
NFR5: Authenticated API requests must require a valid bearer token.
NFR6: Household data access must be scoped to the authenticated user's current household membership.
NFR7: Household membership must be resolved server-side rather than trusted only from client-provided data.
NFR8: Invalid or expired sessions must clear client auth state and return the user to authentication.
NFR9: Invite codes must be time-limited, single-use, and revocable.
NFR10: Users must not be able to access `/app/*` household screens without valid household membership.
NFR11: The core demo path from login through cookbook history must run without manual database edits or special one-off setup during evaluation.
NFR12: Repeating shopping-list generation must not create duplicate active rows for the same planned ingredients.
NFR13: Repeating purchase completion must not duplicate cookbook history.
NFR14: Planned meals that have become cooked history must not disappear silently through later plan edits.
NFR15: Client-side app routes must survive browser refreshes in production.
NFR16: Primary actions must be reachable through tap/click and keyboard interaction.
NFR17: Swipe gestures must have non-swipe alternatives for important actions.
NFR18: Form inputs must have accessible labels and visible validation feedback.
NFR19: Light and dark themes must maintain readable contrast for primary text, controls, and status indicators.
NFR20: Status changes such as purchased, excluded, active, hidden, and selected must not rely on color alone.
NFR21: The frontend must build into static assets that can be served by the .NET backend.
NFR22: Production must use a same-origin API and SPA deployment shape.
NFR23: The deployment must support Railway as the target environment with MySQL and the .NET service.
NFR24: The Vite development setup must allow frontend development against the backend API without production CORS assumptions leaking into deployment.
NFR25: New backend behavior should reuse existing controller, auth, household, shopping-list, and rating patterns where practical.
NFR26: Frontend server state should use consistent query keys and targeted invalidation.
NFR27: New v1 behavior should avoid introducing architecture needed only for deferred v2 features.
NFR28: DTO shapes used by frontend and backend should remain consistent across auth, household, recipe, meal planning, shopping, and cookbook flows.

### Additional Requirements

- Epic 1 Story 1 must account for the selected starter: shadcn React Router/Vite preset initialized with `npx shadcn@latest init --preset b1sljUX6A --base base --template react-router`.
- Configure the canonical frontend in `frontend/`; do not add new work to deprecated `client-react/`.
- Set `frontend/react-router.config.ts` to `ssr: false` so the React Router app builds as a static SPA for the documented production model.
- Use the existing .NET backend as the production API and static SPA host.
- Serve production API routes under `/api/*`, serve frontend assets from backend `wwwroot`, and add SPA fallback so hard refreshes on `/app/*` routes load `index.html`.
- Deploy as one Railway .NET service with MySQL, without relying on production CORS or a separate frontend production host.
- Store new persistent state in MySQL using the existing versioned SQL migration pattern, not EF migrations.
- Add database support for planned meals, planned-meal ingredient exclusions, household invitations, and shopping-row metadata needed for source and purchase state.
- Keep cookbook history as a derived read model rather than adding a new cookbook table.
- Reuse `Skjuloppskrift.karakter` for per-user ratings, mapping UI stars to the stored rating scale.
- Resolve household tenancy server-side from `Medlemmer`; JWT household claims may only be treated as UI hints.
- Keep JWT bearer auth for v1 with client-side storage, token injection through a shared `apiFetch`, and no refresh-token or BFF layer.
- Implement `/api/auth/me` so the frontend app shell can identify current user and household state.
- Keep REST endpoints under `/api/*`, using existing Norwegian backend naming where appropriate.
- Return user-facing backend errors as `{ message: string }`; use HTTP 409 for business-rule conflicts such as deleting cooked planned meals.
- Use ISO strings for dates crossing the API and Monday `YYYY-MM-DD` semantics for week identifiers.
- Use TanStack Query for all frontend server state; do not use React Router loaders for v1 app data.
- Use targeted query invalidation for affected feature keys rather than broad cache resets.
- Use `react-hook-form` and `zod` for form handling and validation.
- Use `react-i18next`/`i18next` for Norwegian and English app chrome.
- Use `date-fns` for Monday-anchored week logic.
- Use `sonner` for toast feedback.
- Use shadcn/base-ui primitives for UI foundations and install shadcn components through the shadcn CLI.
- Use `react-swipeable-list` only through a project-level `SwipeActionRow` wrapper and import its stylesheet once at app level.
- Provide tap or menu alternatives for every swipe action.
- Keep generated shopping suggestions manual-confirm and idempotent.
- Keep purchase completion idempotent so repeating completion cannot duplicate cookbook history.
- Preserve existing backend controllers, DTOs, models, SQL schema files, seed files, auth behavior, recipe behavior, household behavior, shopping-list behavior, and rating storage unless the MVP requires targeted extension.
- Consider focused tests around household scoping, shopping-generation idempotency, purchase-complete idempotency, and the full exam demo loop.

### UX Design Requirements

UX-DR1: Implement a mobile-first authenticated app shell with safe-area-aware content, stable bottom navigation, and a centered mobile-width layout on desktop.
UX-DR2: Keep top-level authenticated destinations as routes for Chef, Plan, Shop, Book, and Account.
UX-DR3: Hide bottom navigation until authentication and household onboarding are complete.
UX-DR4: Centralize auth and household gating so unauthenticated users go to login, authenticated users without households go to onboarding, and household users enter `/app/*`.
UX-DR5: Build onboarding as one focused screen with clear create-household and join-household paths.
UX-DR6: Show inline validation for household name and invite-code errors, including invalid active-code states.
UX-DR7: Auto-uppercase invite-code entry, reject ambiguous invite-code characters, and keep invite codes readable and copyable.
UX-DR8: Refetch current account state after household creation or invite join so the app transitions automatically into the household app.
UX-DR9: Use bottom sheets, not separate routes, for recipe detail, add-to-plan, edit meal, shopping suggestions, edit shopping row, and purchase completion decisions.
UX-DR10: Ensure sheets have labelled headings, focus management, close behavior, scrollable content when needed, and reachable primary actions.
UX-DR11: Provide a reusable Detail Sheet pattern for focused decision flows.
UX-DR12: Provide Recipe Card components with semantic tap targets, readable recipe metadata, and image or fallback thumbnail states.
UX-DR13: Provide a Week Navigator for Monday-anchored week movement with explicit previous-week and next-week labels.
UX-DR14: Provide Planned Meal Slot components for empty, planned, loading, cooked/locked, editable, and error states.
UX-DR15: Let recipe detail and add-to-plan flows support choosing week, day, meal type, and servings in one focused sheet.
UX-DR16: Show a visible "Generate shopping list" action from the selected weekly plan when planned meals exist.
UX-DR17: Implement a shopping suggestion sheet that states the week being processed and the number of planned meals used.
UX-DR18: Show each generated suggestion with checkbox, quantity, unit, ingredient name, source/status metadata, and accessible checkbox label.
UX-DR19: Show duplicate/already-on-list suggestions as visible but unchecked by default.
UX-DR20: Omit optional and excluded ingredients from the actionable suggestion list instead of showing disabled clutter.
UX-DR21: Require explicit confirmation before generated suggestions are inserted into the shared shopping list.
UX-DR22: Use toast feedback for successful low-risk mutations such as added to plan, shopping rows added, restored row, saved rating, language changed, theme changed, and invite generated.
UX-DR23: Use inline feedback for form validation and recoverable user errors.
UX-DR24: Use confirmation sheets for shared or historical state changes such as purchase complete and invite revocation.
UX-DR25: Build a reusable Swipe Action Row pattern for shopping purchase, hidden-item restore, and ingredient exclusion.
UX-DR26: Ensure every swipe action has a tap or menu equivalent and a visible state/status cue.
UX-DR27: Build Shopping List Row components that show quantity/unit, item name, source label, member attribution where useful, status, and edit/action affordances.
UX-DR28: Keep active shopping rows dense, tappable, one-thumb friendly, and stable during loading or mutation.
UX-DR29: Move purchased or hidden rows out of the active list while keeping them reachable through a hidden/purchased view.
UX-DR30: Allow hidden or purchased shopping rows to be restored without relying on swipe alone.
UX-DR31: Purchase completion must summarize archived rows, cookbook meals, and remaining rows before final confirmation.
UX-DR32: After purchase completion, cookbook history should make completed meals visible and support rating or replanning.
UX-DR33: Build Cookbook History Row components with recipe name, meal type, cooked count, last cooked date, and current user's rating state.
UX-DR34: Ensure ratings are labelled as the current user's rating and not conveyed by stars alone.
UX-DR35: Build Account Setting Group components for household context, invite controls, language, theme, and logout.
UX-DR36: Show owner-only invite controls only for household owners while keeping household context visible to non-owners.
UX-DR37: Use concrete, outcome-oriented button labels such as "Add to plan", "Add selected items", and "Purchase complete".
UX-DR38: Keep primary actions visually distinct with the app's muted primary accent, while reserving success colors for state feedback.
UX-DR39: Use empty states that guide the next useful action for Chef, Planned, Shopping, Cookbook, and Account invite states.
UX-DR40: Use localized skeletons or reserved row space so loading states do not block the app shell or cause disruptive layout shifts.
UX-DR41: Maintain practical WCAG AA alignment for contrast, focus states, labelled forms, keyboard access, and non-color-only status indicators.
UX-DR42: Support light, dark, and system themes with readable contrast for text, controls, status, sheets, and rows.
UX-DR43: Support Norwegian and English labels without truncating critical controls.
UX-DR44: Use mobile-first responsive targets around 360px, 390px, 768px, and 1024px+ while preserving the same route and workflow model.
UX-DR45: Keep desktop as a centered mobile app shell rather than a separate dashboard workflow.
UX-DR46: Respect `prefers-reduced-motion` for sheet transitions, swipe animations, and toast movement.
UX-DR47: Use semantic HTML first and ARIA only where native semantics are insufficient.
UX-DR48: Keep visual design calm, warm, practical, and compact, with cards reserved for repeated items or focused surfaces rather than every page section.
UX-DR49: Implement design tokens for warm-neutral backgrounds/surfaces, muted terracotta primary actions, sage success, amber warning, restrained red errors, readable text, spacing, radius, typography, and theme variants.
UX-DR50: Prioritize reusable app-level components for the core demo path before secondary UI polish.

### FR Coverage Map

FR1: Epic 1 - Account registration.
FR2: Epic 1 - Login with existing account.
FR3: Epic 1 - Session persistence across reloads.
FR4: Epic 1 - Logout and session end.
FR5: Epic 1 - Current authenticated user and household membership identification.
FR6: Epic 1 - Household creation for users without a household.
FR7: Epic 1 - Household owner invite-code generation.
FR8: Epic 1 - Invite-code household join.
FR9: Epic 1 - Invite-code revocation or replacement.
FR10: Epic 1 - Household name and member-list visibility.
FR11: Epic 1 - Owner versus non-owner capability distinction.
FR12: Epic 1 - Household-gated app access.
FR13: Epic 2 - Recipe browsing.
FR14: Epic 2 - Recipe search.
FR15: Epic 2 - Meal-type filtering.
FR16: Epic 2 - Recipe detail view.
FR17: Epic 2 - Start meal planning from a recipe.
FR18: Epic 5 - Re-plan cooked recipes from cookbook history.
FR19: Epic 2 - Shared weekly meal-plan view.
FR20: Epic 2 - Week navigation.
FR21: Epic 2 - Add recipe to week, day, and meal type.
FR22: Epic 2 - Set planned-meal servings.
FR23: Epic 2 - Edit planned-meal servings.
FR24: Epic 2 - Remove planned meals before cooked history.
FR25: Epic 2 - Mark planned-meal ingredients as already available.
FR26: Epic 2 - Restore excluded planned-meal ingredients.
FR27: Epic 2 - Preserve exclusions per planned meal.
FR28: Epic 3 - Generate shopping-list suggestions from a selected week.
FR29: Epic 3 - Exclude optional ingredients from suggestions.
FR30: Epic 3 - Exclude planned-meal ingredients marked already available.
FR31: Epic 3 - Scale suggestions by planned servings.
FR32: Epic 3 - Detect suggestions already on the active shopping list.
FR33: Epic 3 - Manually confirm generated suggestions before insertion.
FR34: Epic 4 - Active household shopping-list row view.
FR35: Epic 4 - Manual shopping-list row creation.
FR36: Epic 4 - Manual or active shopping-list row editing.
FR37: Epic 4 - Mark shopping rows as purchased.
FR38: Epic 4 - Purchased or hidden shopping-row view.
FR39: Epic 4 - Restore purchased or hidden rows.
FR40: Epic 4 - Complete a shopping trip.
FR41: Epic 4 - Archive purchased rows on completion.
FR42: Epic 5 - Add qualifying cooked planned meals to cookbook history.
FR43: Epic 5 - Household cookbook-history view.
FR44: Epic 5 - Cookbook search or filtering.
FR45: Epic 5 - Per-user cooked-recipe rating.
FR46: Epic 5 - Cookbook sorting by current user's ratings and recency.
FR47: Epic 5 - Independent ratings per household member.
FR48: Epic 6 - Norwegian and English language switching.
FR49: Epic 6 - System, light, and dark theme switching.
FR50: Epic 6 - Account and household context display.
FR51: Epic 6 - Complete demo path support from authentication through cookbook history.
FR52: Epic 6 - Clear empty states when recipe, plan, shopping, or cookbook data is absent.
FR53: Epic 1 - Expired or invalid session recovery.
FR54: Epic 1 - Client-side app route refresh preservation.

## Epic List

### Epic 1: App Foundation, Authentication & Household Entry
Users can enter the app reliably, stay signed in, recover from expired sessions, and create or join the correct household before accessing household features.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR9, FR10, FR11, FR12, FR50, FR53, FR54.

### Epic 2: Recipe Discovery & Meal Planning
Household members can browse recipes, inspect details, and build a shared Monday-anchored weekly plan with servings and ingredient exclusions.
**FRs covered:** FR13, FR14, FR15, FR16, FR17, FR19, FR20, FR21, FR22, FR23, FR24, FR25, FR26, FR27, FR52.

### Epic 3: Generated Shopping Suggestions
Household members can turn a selected weekly plan into transparent, manually confirmed shopping-list suggestions without duplicates.
**FRs covered:** FR28, FR29, FR30, FR31, FR32, FR33.

### Epic 4: Shared Shopping Trip
Household members can manage active/manual shopping rows, mark items purchased, restore hidden rows, and complete a shopping trip.
**FRs covered:** FR34, FR35, FR36, FR37, FR38, FR39, FR40, FR41.

### Epic 5: Cookbook History & Personal Ratings
Household members can see meals that became cooked history, search/filter them, re-plan cooked meals, and rate recipes independently per user.
**FRs covered:** FR18, FR42, FR43, FR44, FR45, FR46, FR47.

### Epic 6: Account Preferences, Localization & Demo Readiness
Users can manage household/account context, switch language/theme, and rely on polished states that support the full exam demo path.
**FRs covered:** FR48, FR49, FR50, FR51, FR52.

## Epic 1: App Foundation, Authentication & Household Entry

Users can enter the app reliably, stay signed in, recover from expired sessions, and create or join the correct household before accessing household features.

### Story 1.1: SPA Foundation, Starter Setup, and Production Hosting

As an app user,
I want the web app to load reliably on direct visits and refreshes,
So that I can enter ChopChopShop without route errors or deployment-specific workarounds.

**Requirements:** FR54; NFR1, NFR4, NFR15, NFR21, NFR22, NFR23, NFR24; UX-DR1, UX-DR44, UX-DR45.

**Acceptance Criteria:**

**Given** the architecture-selected starter is the shadcn React Router/Vite preset
**When** the canonical frontend foundation is verified or initialized
**Then** it uses `npx shadcn@latest init --preset b1sljUX6A --base base --template react-router`
**And** any starter adaptation remains compatible with the brownfield .NET-hosted SPA model.

**Given** the canonical frontend exists in `frontend/`
**When** the app is built for production
**Then** React Router is configured for SPA/static mode with `ssr: false`
**And** new frontend work is not added to deprecated `client-react/`.

**Given** the backend serves the production app
**When** a user requests a client route such as `/app/chef` directly
**Then** the .NET backend serves `index.html` through SPA fallback
**And** `/api/*` routes continue to resolve to API controllers.

**Given** the frontend build completes
**When** production assets are prepared
**Then** static frontend output can be served from backend `wwwroot`
**And** the deployment shape remains one .NET service serving both API and SPA.

### Story 1.2: Auth Session API, Registration, Login, Logout, and Recovery

As a new or returning user,
I want account access and session recovery to behave predictably,
So that I can securely enter and leave the app without stale state.

**Requirements:** FR1, FR2, FR3, FR4, FR5, FR53; NFR5, NFR6, NFR7, NFR8, NFR16, NFR18, NFR25, NFR28.

**Acceptance Criteria:**

**Given** a valid JWT bearer token
**When** the frontend requests `/api/auth/me`
**Then** the backend returns the current user identity and household membership status
**And** household membership is resolved server-side from `Medlemmer`.

**Given** a new user provides valid registration details
**When** they submit the registration form
**Then** an account is created and the user receives an authenticated session
**And** validation errors are shown inline when registration data is invalid.

**Given** an existing user provides valid credentials
**When** they submit the login form
**Then** they receive a JWT-backed session
**And** the app can remain signed in across page reloads until expiry or logout.

**Given** a user's token expires or an authenticated request returns 401
**When** the shared `apiFetch` handles the response
**Then** local auth state is cleared and the user is returned to authentication
**And** stale household screens are no longer visible.

**Given** a user chooses logout
**When** the logout action completes
**Then** the active session is ended client-side
**And** future authenticated requests are not sent with the old token.

### Story 1.3: Authenticated App Shell and Route Gating

As a household member,
I want the app to guide me to the right area based on my auth and household state,
So that I never land in a broken or unauthorized household screen.

**Requirements:** FR5, FR12, FR50, FR54; NFR1, NFR3, NFR4, NFR10, NFR15; UX-DR1, UX-DR2, UX-DR3, UX-DR4.

**Acceptance Criteria:**

**Given** a user is unauthenticated
**When** they request `/app/*`
**Then** the app redirects them to authentication
**And** household navigation is not rendered.

**Given** a user is authenticated but has no household
**When** they request `/app/*`
**Then** the app redirects them to onboarding
**And** bottom navigation remains hidden until onboarding is complete.

**Given** a user is authenticated and belongs to a household
**When** they enter `/app/*`
**Then** the mobile-first app shell renders top-level destinations for Chef, Plan, Shop, Book, and Account
**And** active route state is visible without relying on color alone.

**Given** the app shell is loading auth state
**When** route content waits for `/api/auth/me`
**Then** the shell uses reserved or localized loading states
**And** it avoids disruptive layout jumps on mobile.

### Story 1.4: Household Onboarding, Invites, and Member Context

As an authenticated household user,
I want to create or join a household and manage invite/member context where allowed,
So that shared access is simple but still controlled.

**Requirements:** FR6, FR7, FR8, FR9, FR10, FR11, FR12, FR50; NFR6, NFR7, NFR9, NFR10, NFR16, NFR18; UX-DR5, UX-DR6, UX-DR7, UX-DR8, UX-DR35, UX-DR36.

**Acceptance Criteria:**

**Given** a user has no household
**When** they reach onboarding
**Then** they see one focused screen with create-household and join-household paths
**And** bottom navigation remains hidden until setup is complete.

**Given** the user submits a valid household name or invite code
**When** the backend accepts the create or join request
**Then** the user receives the correct household membership
**And** the frontend refetches `/api/auth/me` before entering `/app/*`.

**Given** the user enters an invite code
**When** they type or paste it
**Then** the input auto-uppercase normalizes the code and rejects ambiguous characters
**And** invalid-code feedback is displayed inline.

**Given** a household owner manages invites
**When** they generate, revoke, or replace an invite code
**Then** invite codes are time-limited, single-use, and revocable
**And** non-owner members cannot access owner-only invite controls.

**Given** a member opens household context
**When** account or household data renders
**Then** household name and member list are visible
**And** all household-scoped endpoints authorize through server-side membership.

## Epic 2: Recipe Discovery & Meal Planning

Household members can browse recipes, inspect details, and build a shared Monday-anchored weekly plan with servings and ingredient exclusions.

### Story 2.1: Recipe Discovery and Detail Sheets

As a household member,
I want to browse, search, filter, and inspect recipes in context,
So that I can quickly find meals worth planning.

**Requirements:** FR13, FR14, FR15, FR16, FR17, FR52; NFR3, NFR16, NFR18, NFR26; UX-DR9, UX-DR10, UX-DR11, UX-DR12, UX-DR39, UX-DR40.

**Acceptance Criteria:**

**Given** a household member opens Chef
**When** recipes are available
**Then** the app shows recipe cards with name, meal type, and image or fallback thumbnail
**And** each recipe card is a semantic tap target with readable metadata.

**Given** a user searches or filters by meal type
**When** the recipe list updates
**Then** results reflect the active query and filters
**And** query keys include filter state for targeted caching.

**Given** a user selects a recipe
**When** the detail opens
**Then** it opens in a labelled bottom sheet rather than a separate route
**And** ingredients, optional ingredients, portions, and instructions are visible.

**Given** no recipes match the current filters
**When** the list renders
**Then** an empty state guides the user to clear filters or search again.

### Story 2.2: Weekly Plan View, Navigation, and Meal Scheduling

As a household member,
I want to view a shared week and schedule recipes into it,
So that the household has a clear Monday-anchored meal plan.

**Requirements:** FR19, FR20, FR21, FR22, FR23, FR52; NFR2, NFR3, NFR4, NFR18, NFR26, NFR28; UX-DR9, UX-DR10, UX-DR13, UX-DR14, UX-DR15, UX-DR22, UX-DR23, UX-DR39, UX-DR40.

**Acceptance Criteria:**

**Given** a household member opens the Plan route
**When** the selected week loads
**Then** planned meals are shown in a Monday-anchored weekly structure
**And** empty day or meal slots invite the user to add meals.

**Given** the user changes weeks
**When** they use previous or next week controls
**Then** the week identifier uses Monday `YYYY-MM-DD` semantics
**And** planned-meal queries are keyed by the selected week.

**Given** the user opens add-to-plan from a recipe
**When** they select week, day, meal type, and servings
**Then** the planned meal can be saved for the household
**And** success feedback appears when the plan updates.

**Given** a planned meal already exists
**When** the user edits servings
**Then** the updated serving count is persisted
**And** dependent plan queries are invalidated without resetting unrelated data.

### Story 2.3: Ingredient Exclusions and Planned Meal Protection

As a household member,
I want to exclude ingredients and safely remove planned meals,
So that the plan can reflect what we already have without damaging cooked history.

**Requirements:** FR24, FR25, FR26, FR27; NFR14, NFR16, NFR17, NFR18, NFR20, NFR25; UX-DR23, UX-DR24, UX-DR25, UX-DR26, UX-DR39, UX-DR40.

**Acceptance Criteria:**

**Given** a planned meal has ingredients
**When** the user marks an ingredient as already available
**Then** the exclusion is stored for that planned meal only
**And** it does not hide the ingredient globally for other planned meals.

**Given** an ingredient is excluded
**When** the user restores it
**Then** the exclusion is removed for that planned meal
**And** the UI updates with visible non-color-only status feedback.

**Given** swipe behavior is used for exclusion or restore
**When** the row is rendered
**Then** it uses the shared `SwipeActionRow` pattern
**And** a tap or menu alternative is also available.

**Given** a planned meal has not become cooked history
**When** the user removes it
**Then** the meal is removed from the selected week.

**Given** a planned meal has become cooked history
**When** the user attempts to remove it
**Then** the backend prevents silent deletion with a 409 `{ message }` response
**And** the UI explains that cooked meals cannot be removed this way.

## Epic 3: Generated Shopping Suggestions

Household members can turn a selected weekly plan into transparent, manually confirmed shopping-list suggestions without duplicates.

### Story 3.1: Generate Deduplicated Suggestions from the Weekly Plan

As a household member,
I want the app to calculate shopping suggestions from a selected week,
So that I do not manually copy ingredients from planned meals or create duplicates.

**Requirements:** FR28, FR29, FR30, FR31, FR32; NFR12, NFR25, NFR27, NFR28.

**Acceptance Criteria:**

**Given** a selected week contains planned meals
**When** the user requests shopping suggestions
**Then** the backend returns generated suggestion rows for recipe ingredients
**And** no shopping-list rows are inserted before user confirmation.

**Given** ingredients are optional or excluded for a specific planned meal
**When** suggestions are generated
**Then** those ingredients are omitted from the generated suggestions.

**Given** a planned meal uses a serving count different from the recipe default
**When** suggestions are generated
**Then** suggested quantities are scaled by planned servings where quantity data supports scaling.

**Given** the active shopping list already contains a matching item
**When** suggestions are generated
**Then** the matching suggestion is marked as already on the list
**And** it is not selected by default for insertion.

**Given** generation is repeated for the same selected week
**When** the backend compares planned ingredients and active rows
**Then** duplicate active rows are not created.

### Story 3.2: Review and Confirm Selected Suggestions

As a household member,
I want to review and confirm generated suggestions before adding them,
So that automation stays transparent and under household control.

**Requirements:** FR28, FR29, FR30, FR31, FR32, FR33; NFR2, NFR12, NFR16, NFR18, NFR20, NFR26; UX-DR16, UX-DR17, UX-DR18, UX-DR19, UX-DR20, UX-DR21, UX-DR22.

**Acceptance Criteria:**

**Given** suggestions are returned for a selected week
**When** the suggestion sheet opens
**Then** it states the week being processed and the number of planned meals used
**And** it keeps the Plan context behind the sheet.

**Given** suggestion rows render
**When** the user reviews them
**Then** each row shows checkbox, quantity, unit, ingredient name, source/status metadata, and accessible checkbox label.

**Given** a suggestion is already on the active list
**When** the sheet renders
**Then** the row is visible but unchecked by default
**And** duplicate status is not conveyed by color alone.

**Given** the user confirms selected rows
**When** the mutation succeeds
**Then** only selected suggestions are inserted into the active household shopping list
**And** the app shows concise toast feedback.

**Given** no rows are selected
**When** the user attempts to confirm
**Then** the UI prevents an empty insertion
**And** explains that at least one row must be selected.

## Epic 4: Shared Shopping Trip

Household members can manage active/manual shopping rows, mark items purchased, restore hidden rows, and complete a shopping trip.

### Story 4.1: Active Shopping List, Manual Items, and Editing

As a household member,
I want to view, add, and edit shopping rows,
So that recipe-generated and ad hoc grocery needs live in one shared list.

**Requirements:** FR34, FR35, FR36, FR52; NFR3, NFR4, NFR18, NFR26, NFR28; UX-DR9, UX-DR10, UX-DR23, UX-DR27, UX-DR28, UX-DR39, UX-DR40.

**Acceptance Criteria:**

**Given** the user opens the Shop route
**When** active rows exist
**Then** rows show quantity/unit, item name, source label, and member attribution where useful
**And** the layout is dense, tappable, and one-thumb friendly.

**Given** the user adds a manual shopping row
**When** they provide valid item data
**Then** the row appears on the active household list
**And** it is distinguishable from recipe-derived rows.

**Given** the user edits a manual or active shopping row
**When** they save valid row changes
**Then** the shopping list updates
**And** source metadata needed for cookbook generation is preserved where applicable.

**Given** the shopping list is empty
**When** the route renders
**Then** an empty state guides the user to plan meals or add a manual item.

### Story 4.2: Purchase and Restore Shopping Rows

As a shopper,
I want to mark rows as purchased and restore mistakes,
So that the active list stays focused while shopping remains reversible.

**Requirements:** FR37, FR38, FR39; NFR2, NFR16, NFR17, NFR20, NFR26; UX-DR25, UX-DR26, UX-DR27, UX-DR28, UX-DR29, UX-DR30.

**Acceptance Criteria:**

**Given** an active shopping row is visible
**When** the user swipes or uses the tap/menu alternative to mark it purchased
**Then** the row leaves the active list
**And** purchased status is stored with purchase metadata.

**Given** swipe behavior is available
**When** rows render
**Then** they use the shared `SwipeActionRow` wrapper
**And** the same gesture vocabulary is reused consistently.

**Given** rows have been purchased or hidden
**When** the user opens the hidden/purchased view
**Then** those rows are shown separately from active rows
**And** the active list remains focused on remaining items.

**Given** a purchased or hidden row is visible
**When** the user restores it
**Then** it returns to the active shopping list
**And** purchase or hidden state is cleared as appropriate.

### Story 4.3: Purchase Completion and Archiving

As a household shopper,
I want to complete a shopping trip intentionally,
So that purchased rows are archived and the household routine can continue into cookbook history.

**Requirements:** FR40, FR41; NFR2, NFR13, NFR25, NFR26; UX-DR24, UX-DR31.

**Acceptance Criteria:**

**Given** the active list has purchased rows
**When** the user taps "Purchase complete"
**Then** a confirmation sheet summarizes archived rows, cookbook meals, and remaining rows
**And** no archive action happens until the user confirms.

**Given** the user confirms purchase completion
**When** the backend processes the request
**Then** purchased rows are archived
**And** remaining active rows stay available for later shopping.

**Given** purchase completion is repeated or retried
**When** the backend receives the request
**Then** the operation remains idempotent
**And** it does not duplicate cookbook history.

**Given** completion succeeds
**When** the mutation finishes
**Then** the user sees success feedback
**And** shopping and cookbook-related query keys are invalidated.

## Epic 5: Cookbook History & Personal Ratings

Household members can see meals that became cooked history, search/filter them, re-plan cooked meals, and rate recipes independently per user.

### Story 5.1: Cookbook History, Search, Sorting, and Re-Planning

As a household member,
I want to find cooked meals and add them back to the plan,
So that the household can repeat meals that worked well.

**Requirements:** FR18, FR42, FR43, FR44, FR46, FR52; NFR3, NFR4, NFR6, NFR7, NFR13, NFR18, NFR26; UX-DR9, UX-DR10, UX-DR15, UX-DR32, UX-DR33, UX-DR39, UX-DR40, UX-DR43.

**Acceptance Criteria:**

**Given** purchase completion archives purchased recipe-derived rows
**When** qualifying planned meals meet cookbook criteria
**Then** cookbook history exposes those meals through a derived read model
**And** no new cookbook table is created.

**Given** the cookbook route loads
**When** cooked history exists
**Then** cookbook rows show recipe name, meal type, cooked count, and last cooked date.

**Given** the user searches, filters, or sorts cookbook history
**When** data updates
**Then** visible rows reflect the chosen criteria
**And** results can prioritize the current user's ratings and recency.

**Given** a cookbook history row is visible
**When** the user chooses to plan it again
**Then** the add-to-plan flow opens with the recipe preselected
**And** the user can choose week, day, meal type, and servings.

**Given** no meals have been completed
**When** the cookbook route renders
**Then** an empty state guides the user to complete a shopping trip first.

### Story 5.2: Per-User Recipe Ratings

As a household member,
I want to rate cooked recipes for my own account,
So that my cookbook view reflects my preferences without changing other members' ratings.

**Requirements:** FR45, FR47; NFR2, NFR16, NFR20, NFR26; UX-DR22, UX-DR34.

**Acceptance Criteria:**

**Given** a cookbook row is visible
**When** the user rates the recipe
**Then** the rating is stored for the current user using existing rating storage
**And** the UI maps 1-5 stars to the backend rating scale consistently.

**Given** another household member rates the same recipe
**When** the current user views cookbook history
**Then** the current user's rating remains independent.

**Given** a rating control renders
**When** assistive technology reads it
**Then** it is labelled as the current user's rating
**And** the rating is not conveyed by stars alone.

**Given** saving a rating succeeds
**When** the mutation completes
**Then** toast feedback confirms the update
**And** cookbook queries are invalidated or updated targetedly.

## Epic 6: Account Preferences, Localization & Demo Readiness

Users can manage household/account context, switch language/theme, and rely on polished states that support the full exam demo path.

### Story 6.1: Account Preferences, Theme, and Language

As a user,
I want account context plus theme and language preferences,
So that the app reflects my household and display preferences.

**Requirements:** FR48, FR49, FR50; NFR3, NFR16, NFR18, NFR19, NFR20; UX-DR22, UX-DR35, UX-DR36, UX-DR38, UX-DR40, UX-DR42, UX-DR43, UX-DR49.

**Acceptance Criteria:**

**Given** a household member opens Account
**When** the account route renders
**Then** it shows user context, household name, member list, and relevant owner/non-owner controls
**And** it reuses the established app shell and account setting group patterns.

**Given** the user chooses system, light, or dark theme
**When** the preference changes
**Then** the selected theme applies to the app shell, sheets, rows, controls, and status indicators
**And** the preference persists across reloads.

**Implementation Notes (Theme Switching):**

- Theme is implemented per the shadcn Vite dark-mode pattern, adapted for React Router v7's SSR-style root document.
- `frontend/app/components/theme-provider.tsx` exports `ThemeProvider`, `useTheme()`, and `themeInitScript()`. Provider state is `"light" | "dark" | "system"`; `system` resolves via `prefers-color-scheme`. Selection is persisted to `localStorage` under key `vite-ui-theme`.
- `frontend/app/root.tsx` injects `<script>{themeInitScript()}</script>` into `<head>` so the `dark`/`light` class is set on `<html>` **before** hydration, preventing FOUC. `<html suppressHydrationWarning>` is required because the script mutates the element pre-hydration.
- `<ThemeProvider defaultTheme="system">` wraps the app inside `QueryClientProvider`.
- `frontend/app/components/mode-toggle.tsx` provides the Light/Dark/System dropdown for the Account screen. Uses base-ui's `render` prop on `DropdownMenuTrigger` (this project's shadcn variant is base-ui, not Radix — `asChild` is not available).
- `frontend/app/components/ui/sonner.tsx` consumes `useTheme()` and forwards `theme={theme}` to Sonner so toasts follow the user's choice.
- A `MediaQueryList` listener inside `ThemeProvider` keeps `system` mode reactive to OS-level changes without a reload.

**Given** the user chooses Norwegian or English
**When** the preference changes
**Then** top-level navigation, common actions, form labels, validation messages, and core empty states use the selected language
**And** critical controls do not truncate at 360px.

**Given** owner-only controls are present
**When** a non-owner opens Account
**Then** restricted controls are hidden or unavailable
**And** household context remains visible.

### Story 6.2: Core Empty, Error, Loading, Responsive, and Accessibility Polish

As a household member,
I want the app to remain clear and accessible across states and devices,
So that the household workflow works beyond the happy-path demo device.

**Requirements:** FR52; NFR3, NFR4, NFR16, NFR17, NFR18, NFR19, NFR20; UX-DR23, UX-DR37, UX-DR39, UX-DR40, UX-DR41, UX-DR44, UX-DR45, UX-DR46, UX-DR47, UX-DR48, UX-DR50.

**Acceptance Criteria:**

**Given** Chef, Plan, Shop, or Cookbook has no data
**When** the route renders
**Then** the empty state guides the next useful action for that route.

**Given** any core route fails to load
**When** an error state is shown
**Then** it uses recoverable language with retry where appropriate
**And** it avoids technical backend wording.

**Given** the app is tested at 360px, 390px, 768px, and desktop widths
**When** core routes and sheets render
**Then** text, controls, bottom navigation, and sticky actions do not overlap
**And** desktop remains a centered mobile app shell rather than a dashboard.

**Given** keyboard-only navigation is used
**When** the user moves through auth, onboarding, app shell, sheets, rows, and forms
**Then** all primary actions are reachable
**And** focus states are visible.

**Given** reduced motion is preferred
**When** sheets, swipe animations, or toasts are displayed
**Then** transitions remain understandable without relying on motion-heavy behavior.

### Story 6.3: Exam Demo Path Reliability

As the project demonstrator,
I want the full core workflow to be reliable with known data,
So that evaluators can understand the product without manual setup or fragile workarounds.

**Requirements:** FR51, FR54; NFR11, NFR15, NFR21, NFR22, NFR23.

**Acceptance Criteria:**

**Given** a clean or known demo environment
**When** the demonstrator runs the core path
**Then** they can register or log in, create or join a household, browse recipes, plan a meal, generate suggestions, confirm shopping rows, purchase items, complete the trip, view cookbook history, rate a meal, and switch language/theme.

**Given** seed or demo data is required
**When** the app is prepared for evaluation
**Then** recipe and household workflow data exists without manual database edits during the demo.

**Given** the production-like app serves client routes
**When** the demonstrator hard-refreshes `/app/*`
**Then** the route recovers through SPA fallback.

**Given** the demo path is verified
**When** automated or manual smoke checks run
**Then** failures identify the broken step clearly enough for the team to fix before evaluation.
