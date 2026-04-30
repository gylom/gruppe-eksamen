---
stepsCompleted: [step-01-init, step-02-discovery, step-02b-vision, step-02c-executive-summary, step-03-success, step-04-journeys, step-05-domain, step-06-innovation, step-07-project-type, step-08-scoping, step-09-functional, step-10-nonfunctional, step-11-polish, step-12-complete]
completedAt: 2026-04-30
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief-gruppe-eksamen-2026-04-30.md
  - docs/components.md
  - docs/frontend-architecture-decisions.md
  - docs/frontend-description.md
  - docs/ui-ux-screens.md
workflowType: 'prd'
documentCounts:
  productBriefs: 1
  research: 0
  brainstorming: 0
  projectDocs: 4
date: 2026-04-30
author: PaalA
project: gruppe-eksamen
classification:
  projectType: web_app
  domain: general_consumer_productivity_household_meal_planning
  complexity: low_domain_medium_implementation
  projectContext: brownfield
---

# Product Requirements Document - gruppe-eksamen

**Author:** PaalA
**Date:** 2026-04-30

## Executive Summary

ChopChopShop is a mobile-first household meal-planning web app that connects recipe browsing, weekly planning, shopping-list generation, shared shopping, and cookbook history into one coherent household workflow. It is built as a React/Vite SPA served by the existing .NET backend, using the current authentication, household, recipe, ingredient, shopping-list, and rating concepts where possible.

The product solves fragmented household meal coordination: plans live in memory, messages, notes, and disconnected grocery lists. ChopChopShop gives household members a shared view of planned meals, required groceries, purchased items, and meals worth repeating.

The v1 product is scoped around a reliable exam-demo loop: register or log in, create or join a household, browse recipes, add meals to a Monday-anchored week, generate shopping suggestions from planned meals, complete a shopping trip, and see cooked meals appear in household cookbook history.

### What Makes This Special

ChopChopShop's differentiator is the connection between planning and shopping. Instead of treating recipes, meal calendars, grocery lists, and saved meals as separate tools, the app turns a weekly household meal plan into a shopping workflow and turns completed shopping trips into food history.

The core insight is that shared households do not need a more complex recipe app; they need a lower-friction routine that reduces planning and shopping mental load. Ingredient exclusions, manual confirmation of generated shopping rows, swipe-to-purchase behavior, and per-user ratings over shared household history make the app feel practical rather than speculative.

Users should choose ChopChopShop because it answers the household's everyday food questions in one place: what are we eating, what do we need to buy, what has already been handled, and what should we cook again.

## Project Classification

ChopChopShop is a brownfield web app project. The frontend is a new mobile-first React/Vite SPA, while the backend is an existing C#/.NET application with established database concepts for users, households, recipes, ingredients, shopping lists, and ratings.

The domain is general consumer productivity and household meal planning. It is not a regulated or safety-critical domain, so domain complexity is low. Implementation complexity is medium because the core workflow crosses multiple shared system areas: authentication, household tenancy, recipe data, meal planning, generated shopping rows, purchase completion, cookbook history, i18n, theme support, and Railway deployment.

The PRD prioritizes scope discipline, backend reuse, demo reliability, and a coherent mobile-first workflow over broad feature expansion.

## Success Criteria

### User Success

Users are successful when they can complete the household meal-planning loop without instructions or workarounds: register or log in, create or join a household, browse recipes, add meals to a shared weekly plan, generate shopping-list suggestions, shop from the active list, complete the shopping trip, and see cooked meals appear in cookbook history.

The primary user success moment is when a planned week becomes a useful shopping list without manual copying. The secondary success moment is when completed shopping naturally creates a reusable household food history.

The app should feel successful if a household member can quickly answer: what are we eating, what do we need to buy, what has already been handled, and what should we cook again.

### Business Success

Because this is a school exam project, business success means delivering a polished, coherent, demonstrable product rather than proving revenue, market growth, or retention. The product should clearly communicate its value in a short demo and show that the team can connect product thinking, UX design, frontend architecture, backend integration, database changes, and deployment.

The project succeeds if evaluators understand the product concept, observe the full demo loop, and see implementation choices supporting the intended user experience.

### Technical Success

Technical success means the v1 product works reliably as a brownfield extension of the existing system. The React/Vite frontend must use the documented mobile-first app shell, client-side routing, TanStack Query data access, JWT bearer auth, and same-origin API contract. The .NET backend must reuse existing authentication, household membership, recipe, shopping-list, and rating patterns where possible.

The app should build into static assets served from the .NET backend, run as a single Railway API/SPA service with MySQL, and support hard refreshes on client routes. Core workflows should avoid fragile manual setup during evaluation.

### Measurable Outcomes

The MVP is successful when a user can complete the following demo path end-to-end:

- Register or log in.
- Create or join a household.
- Browse recipes from the Chef screen.
- Add at least one recipe to a Monday-anchored weekly plan.
- Generate shopping-list suggestions from that plan.
- Confirm suggested shopping rows manually.
- Mark shopping rows as purchased.
- Complete the shopping trip.
- View the completed meal in cookbook history.
- Rate a cookbook meal using the per-user rating flow.
- Switch language and theme from the account screen.

Generated shopping suggestions must respect optional ingredients, per-meal ingredient exclusions, serving adjustments, and existing shopping-list rows. The mobile layout must remain usable on phone-sized viewports with bottom navigation, sheets, compact controls, and swipe-style row interactions.

## Product Scope

### MVP - Minimum Viable Product

The MVP includes authentication, household onboarding, a mobile-first app shell, recipe browsing, recipe detail sheets, weekly meal planning, ingredient exclusions, shopping-list generation, manual confirmation of suggested rows, shopping-list management, swipe-to-purchase behavior, purchase completion, cookbook history, per-user ratings, account settings, Norwegian/English UI text, light/dark/system theme selection, and Railway-ready deployment.

### Growth Features (Post-MVP)

Growth features include recipe creation and editing, recipe image uploads, pantry management, automatic pantry deduction, better recipe discovery, household-level rating insights, improved meal recommendations, account recovery, password changes, hidden-recipe management, and richer multi-week shopping semantics.

### Vision (Future)

The long-term vision is a shared household food assistant that keeps planning, shopping, cooking history, preferences, and practical grocery decisions connected. The future product can become more proactive over time, but the v1 must first prove the simple routine: plan meals, shop together, remember what worked.

## User Journeys

### Maren Plans the Week and Turns It Into a Shopping List

Maren lives in a shared household where meal planning usually happens through memory, short messages, and last-minute decisions. She is tired of carrying the question "what are we eating this week?" alone, especially when the grocery list does not match what the household actually plans to cook.

She registers, creates a household, and invites the others with a short invite code. Once inside the app, she opens Chef, searches recipes, opens recipe details in a bottom sheet, and adds several meals to the shared week. For each planned meal, she adjusts servings and excludes ingredients the household already has.

The value moment happens on the Planned screen when she generates shopping-list suggestions from the week. Instead of manually copying ingredients, she reviews suggested rows, sees that duplicates are already unchecked, confirms what should be added, and gets a usable shopping list. Maren feels relief because the plan and the grocery trip finally share the same source of truth.

This journey reveals requirements for household onboarding, recipe browsing, recipe detail sheets, add-to-plan flow, weekly plan state, ingredient exclusions, serving adjustments, suggestion generation, duplicate detection, and manual confirmation.

### Jonas Shops From the Shared List

Jonas does not manage the whole meal plan, but he often does the grocery trip. Before shopping, he opens the Shopping screen and sees one active household list with rows added from planned meals and manual items. Each row shows quantity, unit, source, and who added it.

At the store, Jonas swipes rows as items go into the cart. Purchased rows disappear from the active list, keeping the screen focused. If he swipes the wrong row, he opens hidden shopping items and restores it. When the trip is done, he taps Purchase complete, reviews the confirmation, and finishes the trip.

The value moment happens when the list becomes clean and the completed trip graduates planned meals into cookbook history. Jonas does not need to understand meal-planning mechanics; he only needs a reliable list that reflects the household plan.

This journey reveals requirements for shopping-list display, row attribution, manual item management, swipe-to-purchase, hidden item restoration, purchase-complete confirmation, archiving purchased rows, and cookbook graduation.

### Nora Joins Later and Participates Lightly

Nora is a household member who does not plan every meal but wants visibility and a low-effort way to contribute. She registers, enters the invite code from Maren, and reaches the app without needing to understand backend concepts like household membership.

She checks the weekly plan before dinner, browses Chef when she has an idea, and occasionally adds a recipe to the week. After a meal has been cooked, she opens Cookbook and rates it. Her rating changes her own sort order without changing how other members rate the same meal.

The value moment is low-friction participation: Nora can see what is happening, add one useful thing, and rate meals without becoming the household planner.

This journey reveals requirements for invite-code join, forced onboarding for users without households, shared household visibility, lightweight recipe-to-plan contribution, cookbook history, and per-user ratings.

### Paal Demonstrates the Product for Evaluation

Paal is preparing the exam demo and needs the system to communicate product quality quickly. He starts from a clean or known demo state, logs in, shows household onboarding, demonstrates recipe browsing, adds meals to a weekly plan, generates shopping rows, completes a shopping trip, and opens cookbook history.

The risk is demo fragility: auth failures, hard-refresh route failures, missing seed data, unclear empty states, or backend/frontend mismatch would make the product feel unfinished even if individual pieces work. The demo succeeds when evaluators can follow the product story without extra explanation.

The value moment is a coherent full-stack loop: product concept, mobile UX, frontend architecture, backend endpoints, database changes, and deployment all support the same household workflow.

This journey reveals requirements for stable seed/demo data, reliable auth and household gating, Railway-compatible deployment, same-origin SPA/API routing, hard-refresh fallback, clear empty states, and end-to-end demo reliability.

### Household Owner Manages Access

The household owner opens Account to see household members and manage invite access. They generate a 6-character invite code, share it outside the app, and can revoke or replace it if needed. Non-owner members can see household context but do not get invite-management controls.

The value moment is trust and control: joining a household is simple, but membership is still intentional.

This journey reveals requirements for household member display, owner/non-owner role handling, invite-code generation, invite expiry, single-use invite consumption, invite revocation, and account-level household controls.

### Journey Requirements Summary

The journeys reveal five main capability areas:

1. Household access: authentication, create household, join household, invite codes, membership display, owner controls.
2. Planning: recipe browsing, recipe details, add-to-plan, Monday-anchored weeks, meal type, servings, ingredient exclusions.
3. Shopping: generated suggestions, duplicate handling, manual confirmation, active shopping rows, manual items, swipe purchase, hidden restore.
4. Cookbook: purchase-complete graduation, derived household history, per-user rating, re-planning from cooked meals.
5. Demo and operations: reliable seed data, route fallback, deployment consistency, mobile-first layout, clear empty/error states, and coherent end-to-end behavior.

## Web App Specific Requirements

### Project-Type Overview

ChopChopShop is a mobile-first authenticated web app delivered as a React/Vite SPA. React Router provides client-side routing, while the existing .NET backend serves both `/api/*` endpoints and the built frontend assets from `wwwroot/`.

The app is not SEO-driven. Public pages are minimal, and the primary product experience lives behind authentication inside `/app/*`. The main web-app requirement is therefore reliable authenticated workflow execution, not public content discovery.

### Technical Architecture Considerations

The frontend must build as static assets served by the .NET backend as a same-origin SPA/API application. Production routing must support hard refreshes on client routes through static-file serving and `MapFallbackToFile("index.html")`.

The app shell must centralize auth gating and household gating. Unauthenticated users are redirected to login, authenticated users without a household are redirected to onboarding, and authenticated household users enter the `/app/*` layout with bottom navigation.

Server state must be handled with TanStack Query. React Router is responsible for route structure only; v1 should not depend on server loaders for app data.

### Browser Matrix

The MVP should support current evergreen mobile and desktop browsers, with priority on mobile Safari and mobile Chrome because the product is designed for phone-sized daily use.

Desktop support should preserve the mobile-first experience by centering the app layout rather than redesigning the product as a desktop dashboard. The desktop view is for comfortable demonstration and fallback use, not a separate primary experience.

### Responsive Design

The app must be designed mobile-first. Core screens should work on phone-sized viewports with one-thumb navigation, sticky bottom navigation, compact controls, bottom sheets, and swipe-oriented row interactions.

Desktop layouts should avoid introducing separate workflows. The same route and component model should scale up by constraining content width and preserving the mobile interaction hierarchy.

### Performance Targets

The app should feel responsive during demo and daily-use flows. Navigation between top-level app routes should be immediate after initial load, query loading states should be localized to the affected screen or sheet, and mutations should provide clear feedback through optimistic UI where safe or fast toast confirmation where appropriate.

The build should remain simple enough for Railway deployment: frontend static build copied into backend `wwwroot/`, then .NET publish as the deployed service.

### SEO Strategy

SEO is not a v1 priority. The public landing page only needs to explain the product briefly and route users to login or registration. Authenticated app content does not need indexing.

### Accessibility Level

The MVP should meet practical accessibility expectations for a school demo and daily household use: keyboard-reachable controls, visible focus states, semantic buttons and form labels, sufficient color contrast in light and dark themes, non-color-only status indicators, and accessible fallbacks for swipe actions.

Swipe interactions must not be the only way to complete important actions. Purchased rows, hidden restoration, and ingredient exclusions should also be possible through tap or menu controls.

### Implementation Considerations

The implementation skips native device features and CLI-oriented requirements. ChopChopShop is a browser app, not a native mobile app or developer tool.

The most important implementation risks are auth/session handling, household tenancy correctness, hard-refresh route support, mobile layout consistency, and frontend/backend DTO alignment. These risks should be handled before lower-priority UI polish or v2 feature expansion.

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Experience MVP. The first release must prove that ChopChopShop can make a household meal-planning and shopping routine feel coherent, useful, and demo-ready.

**Resource Requirements:** The MVP requires frontend implementation, backend/API changes, database migrations, seed/demo data, and deployment work. The team needs enough capacity to cover React/Vite UI, .NET controller and query work, SQL schema changes, and end-to-end verification.

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**

Phase 1 supports the full Maren, Jonas, Nora, Paal, and household-owner journeys documented above. The MVP must allow users to join or create a household, plan meals, generate shopping rows, shop from the list, complete a purchase, and see cooked meals in cookbook history.

**Must-Have Capabilities:**

- Authentication and session handling with JWT bearer auth.
- Forced household onboarding for users without membership.
- Household creation, invite-code generation, invite-code join, and basic member display.
- Mobile-first `/app/*` shell with bottom navigation.
- Recipe browsing, search, meal-type filtering, and recipe detail sheets.
- Weekly meal planning with Monday-anchored weeks, day, meal type, recipe, and servings.
- Per-planned-meal ingredient exclusions.
- Shopping-list generation from planned meals with optional ingredient skipping, serving scaling, exclusion filtering, duplicate detection, and manual confirmation.
- Active shopping list with manual rows, generated rows, row attribution, source labels, edit/add flow, swipe-to-purchase, hidden/purchased restore, and purchase-complete confirmation.
- Cookbook history derived from completed shopping trips.
- Per-user recipe ratings using the existing rating storage.
- Account screen with household context, invite controls where allowed, language switch, theme switch, and logout.
- Norwegian and English chrome text.
- Light, dark, and system theme support.
- Railway-ready deployment as one .NET service serving the SPA and API.
- Reliable demo data and clear empty/error states.

### Post-MVP Features

**Phase 2 (Post-MVP):**

- Recipe creation and editing.
- Recipe image upload or managed image hosting.
- Pantry management and stock-aware shopping suggestions.
- Account recovery and password changes.
- Hidden-recipes management.
- Improved recipe discovery and recommendations.
- Household-level rating summaries.
- More detailed shopping-trip history.

**Phase 3 (Expansion):**

- Multi-household membership and household switching.
- Push or in-app reminders.
- More advanced meal recommendations.
- Automatic unit conversion for shopping-list aggregation.
- Richer cookbook analytics and household preference modeling.
- More proactive food-planning assistant behavior.

### Risk Mitigation Strategy

**Technical Risks:** The highest technical risks are household tenancy correctness, generated-shopping idempotency, purchase-complete semantics, cookbook derivation, auth/session behavior, and frontend/backend DTO mismatch. Mitigate these by implementing the core loop vertically first, keeping endpoint shapes simple, reusing existing backend patterns, and verifying each workflow against seeded demo data.

**Market Risks:** The main market risk is not whether meal planning exists, but whether this specific connected loop feels simpler than notes, messages, and ad hoc grocery lists. The MVP validates this by demonstrating the moment where planned meals become a shopping list and completed shopping becomes cookbook history.

**Resource Risks:** If time tightens, preserve the core demo loop and cut expansion features first. Recipe creation, pantry behavior, image upload, password recovery, push notifications, and multi-household switching should remain out of v1. Polish should focus on the screens in the main demo path, not broad secondary surfaces.

## Functional Requirements

### User Accounts & Sessions

- FR1: Users can register for an account.
- FR2: Users can log in with an existing account.
- FR3: Authenticated users can remain signed in across page reloads until their session expires or they log out.
- FR4: Users can log out and end their active session.
- FR5: The system can identify the current authenticated user and their household membership status.

### Household Access & Membership

- FR6: Users without a household can create a household.
- FR7: Household owners can generate an invite code for their household.
- FR8: Users without a household can join a household using a valid invite code.
- FR9: Household owners can revoke or replace an active invite code.
- FR10: Household members can view the household name and member list.
- FR11: The system can distinguish household owners from non-owner members for household-management capabilities.
- FR12: Users without household membership are prevented from entering household app areas.

### Recipe Discovery & Recipe Detail

- FR13: Household members can browse available recipes.
- FR14: Household members can search recipes.
- FR15: Household members can filter recipes by meal type.
- FR16: Household members can view recipe details, including ingredients, optional ingredients, portions, and instructions.
- FR17: Household members can start meal planning from a recipe.
- FR18: Household members can re-plan a cooked recipe from cookbook history.

### Meal Planning

- FR19: Household members can view a shared weekly meal plan.
- FR20: Household members can navigate between planning weeks.
- FR21: Household members can add a recipe to a specific week, day, and meal type.
- FR22: Household members can set servings for a planned meal.
- FR23: Household members can edit servings for a planned meal.
- FR24: Household members can remove a planned meal when it has not become cooked history.
- FR25: Household members can mark ingredients on a planned meal as already available.
- FR26: Household members can restore excluded ingredients on a planned meal.
- FR27: The system can preserve ingredient exclusions per planned meal.

### Shopping List Generation & Shopping

- FR28: Household members can generate shopping-list suggestions from a selected week's planned meals.
- FR29: The system can exclude optional ingredients from generated shopping suggestions.
- FR30: The system can exclude ingredients marked already available for a planned meal.
- FR31: The system can scale generated shopping suggestions based on planned servings.
- FR32: The system can identify suggested items that already exist on the active shopping list.
- FR33: Household members can manually confirm which generated suggestions are added to the shopping list.
- FR34: Household members can view active household shopping-list rows.
- FR35: Household members can add manual shopping-list rows.
- FR36: Household members can edit manual or active shopping-list rows.
- FR37: Household members can mark shopping-list rows as purchased.
- FR38: Household members can view purchased or hidden shopping-list rows.
- FR39: Household members can restore purchased or hidden rows to the active shopping list.
- FR40: Household members can complete a shopping trip.
- FR41: The system can archive purchased rows when a shopping trip is completed.

### Cookbook & Ratings

- FR42: The system can add qualifying cooked planned meals to household cookbook history after purchase completion.
- FR43: Household members can view cookbook history for their household.
- FR44: Household members can search or filter cookbook history.
- FR45: Household members can rate cooked recipes for their own account.
- FR46: The system can sort cookbook history using the current user's ratings and recency.
- FR47: The system can keep one member's rating independent from another member's rating.

### Settings, Localization & Display Preferences

- FR48: Users can switch the app language between Norwegian and English.
- FR49: Users can switch the app theme between system, light, and dark modes.
- FR50: Users can view account and household context from an account area.

### Demo & Operational Capabilities

- FR51: The system can support a complete demo path from authentication through cookbook history.
- FR52: The system can show clear empty states when recipe, plan, shopping, or cookbook data is absent.
- FR53: The system can recover users from expired or invalid sessions by returning them to authentication.
- FR54: The system can preserve client-side app routes across browser refreshes.

## Non-Functional Requirements

### Performance

- NFR1: Top-level app navigation after initial load must update without a full page reload.
- NFR2: User-triggered mutations in the core demo path should provide visible feedback within 1 second.
- NFR3: Recipe browsing, planned meals, shopping list, and cookbook views should show localized loading or empty states rather than blocking the entire app shell.
- NFR4: The mobile app shell must remain usable on 360px-wide phone viewports without layout jumps that interrupt the main workflow.

### Security & Privacy

- NFR5: Authenticated API requests must require a valid bearer token.
- NFR6: Household data access must be scoped to the authenticated user's current household membership.
- NFR7: Household membership must be resolved server-side rather than trusted only from client-provided data.
- NFR8: Invalid or expired sessions must clear client auth state and return the user to authentication.
- NFR9: Invite codes must be time-limited, single-use, and revocable.
- NFR10: Users must not be able to access `/app/*` household screens without valid household membership.

### Reliability

- NFR11: The core demo path from login through cookbook history must run without manual database edits or special one-off setup during evaluation.
- NFR12: Repeating shopping-list generation must not create duplicate active rows for the same planned ingredients.
- NFR13: Repeating purchase completion must not duplicate cookbook history.
- NFR14: Planned meals that have become cooked history must not disappear silently through later plan edits.
- NFR15: Client-side app routes must survive browser refreshes in production.

### Accessibility

- NFR16: Primary actions must be reachable through tap/click and keyboard interaction.
- NFR17: Swipe gestures must have non-swipe alternatives for important actions.
- NFR18: Form inputs must have accessible labels and visible validation feedback.
- NFR19: Light and dark themes must maintain readable contrast for primary text, controls, and status indicators.
- NFR20: Status changes such as purchased, excluded, active, hidden, and selected must not rely on color alone.

### Integration & Deployment

- NFR21: The frontend must build into static assets that can be served by the .NET backend.
- NFR22: Production must use a same-origin API and SPA deployment shape.
- NFR23: The deployment must support Railway as the target environment with MySQL and the .NET service.
- NFR24: The Vite development setup must allow frontend development against the backend API without production CORS assumptions leaking into deployment.

### Maintainability

- NFR25: New backend behavior should reuse existing controller, auth, household, shopping-list, and rating patterns where practical.
- NFR26: Frontend server state should use consistent query keys and targeted invalidation.
- NFR27: New v1 behavior should avoid introducing architecture needed only for deferred v2 features.
- NFR28: DTO shapes used by frontend and backend should remain consistent across auth, household, recipe, meal planning, shopping, and cookbook flows.
