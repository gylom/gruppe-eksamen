---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
lastStep: 14
workflowStatus: complete
completedAt: 2026-04-30
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/product-brief-gruppe-eksamen-2026-04-30.md
  - docs/components.md
  - docs/frontend-description.md
  - docs/frontend-architecture-decisions.md
  - docs/ui-ux-screens.md
date: 2026-04-30
author: PaalA
project: gruppe-eksamen
---

# UX Design Specification gruppe-eksamen

**Author:** PaalA
**Date:** 2026-04-30

---

<!-- UX design content will be appended sequentially through collaborative workflow steps -->

## Executive Summary

### Project Vision

ChopChopShop is a mobile-first household meal-planning web app that connects recipe browsing, weekly planning, shopping-list generation, shared grocery shopping, and cookbook history into one coherent routine. The UX should make the core loop feel simple: decide what to eat, generate what to buy, shop from the shared list, and remember what worked.

### Target Users

The primary users are shared households: families, couples, roommates, and student collectives who coordinate meals and groceries together. Key personas include the household planner who carries the mental load, the shopper who needs a clear grocery-trip view, and lighter participants who want visibility, occasional planning, and rating without owning the whole process.

### Key Design Challenges

- Keeping a multi-step workflow understandable on phone-sized screens.
- Making generated shopping suggestions feel trustworthy while still user-controlled.
- Supporting swipe-first interactions without making swipe the only accessible action.
- Preserving a coherent demo path across auth, onboarding, planning, shopping, and cookbook history.
- Designing around household state, ownership, invite codes, and per-user ratings without exposing backend complexity.

### Design Opportunities

- Turn the "planned meals become a shopping list" moment into the product's clearest value point.
- Reuse bottom sheets and swipe rows consistently so the app feels learnable fast.
- Make desktop behave like a polished centered mobile experience, not a separate dashboard.
- Use clear empty states to guide users through the first successful meal-planning loop.
- Let cookbook history feel like a natural reward after shopping, not a separate saved-recipes feature.

## Core User Experience

### Defining Experience

The defining experience is the household planning loop: browse recipes, add meals to a shared week, generate shopping suggestions, shop from the active list, and complete the trip so cooked meals become cookbook history.

The most important recurring user action is moving between "what are we eating?" and "what do we need to buy?" The app should make that transition feel direct, calm, and reliable rather than like copying ingredients from one place to another.

### Platform Strategy

ChopChopShop is a mobile-first authenticated web app. The primary experience is touch-based, designed for phone-sized screens, one-thumb navigation, bottom navigation, compact controls, and bottom sheets.

Desktop should preserve the mobile hierarchy by centering the app rather than turning it into a dashboard. The product does not require offline support in v1, native device capabilities, or SEO-driven authenticated pages.

### Effortless Interactions

The most effortless interactions should be:

- Adding a recipe to the current or next weekly plan.
- Adjusting day, meal type, and servings in one focused sheet.
- Generating shopping suggestions from planned meals.
- Confirming only the shopping rows the household actually wants.
- Swiping or tapping shopping rows as purchased.
- Restoring hidden or purchased rows without fear.
- Seeing cooked meals appear in cookbook history after purchase completion.

The app should reduce manual copying, duplicate checking, and household coordination work. Where automation exists, it should remain reviewable and reversible.

### Critical Success Moments

The first critical success moment is when a user generates shopping suggestions and sees that the list reflects planned meals, serving counts, optional ingredients, excluded ingredients, and existing shopping rows.

The second critical success moment is during shopping, when the active list stays focused as purchased items disappear and can still be restored if needed.

The third critical success moment is after purchase completion, when completed meals naturally appear in cookbook history and can be rated or planned again.

### Experience Principles

- Plan and shop from one source of truth.
- Keep every generated result user-confirmed and reversible.
- Make the mobile path obvious before adding extra power.
- Use sheets for focused decisions and routes for stable destinations.
- Treat empty states as guidance toward the next useful action.
- Keep household complexity visible only where it helps the user act.

## Desired Emotional Response

### Primary Emotional Goals

ChopChopShop should make users feel calm, oriented, and in control of the household food routine. The app should reduce the small daily stress of remembering meals, checking ingredients, coordinating shopping, and figuring out what has already been handled.

The strongest emotional response should be relief: the household has one shared place to see what is planned, what needs buying, what has been purchased, and what meals are worth repeating.

### Emotional Journey Mapping

When users first arrive, they should feel that setup is simple and contained: create a household or join with a code, then start using the app.

During recipe browsing and planning, users should feel curious and capable, not overwhelmed by too many options. Adding a meal should feel lightweight.

When generating shopping suggestions, users should feel trust and control. The app can help automatically, but it should clearly show what will be added before anything changes.

During shopping, users should feel focused. The active list should get shorter as work gets done, while restore options prevent anxiety about mistakes.

After purchase completion, users should feel accomplished. The cookbook should make the completed trip feel useful beyond that one store visit.

When something goes wrong, users should feel guided rather than blamed. Errors and empty states should tell them what can be done next.

### Micro-Emotions

The most important micro-emotions are:

- Confidence over confusion.
- Trust over skepticism.
- Relief over mental load.
- Focus over clutter.
- Shared ownership over isolation.
- Satisfaction over surprise.

The product does not need to feel flashy. It should feel dependable, warm, and practical.

### Design Implications

To create confidence, screens should have one dominant purpose and clear next actions.

To create trust, generated shopping suggestions should be transparent, manually confirmed, and reversible.

To create relief, the app should remove duplicate work: no manual ingredient copying, no rechecking items already on the list, and no separate place to remember cooked meals.

To create focus, shopping should show active items first and move purchased items out of the main path.

To create shared ownership, household names, member initials, row attribution, and invite controls should appear where they support coordination.

### Emotional Design Principles

- Make the next useful action obvious.
- Prefer calm confirmation over hidden automation.
- Let completion visibly reduce clutter.
- Make mistakes reversible.
- Keep household collaboration present but lightweight.
- Reward completed routines with useful history.

## UX Pattern Analysis & Inspiration

### Inspiring Products Analysis

AnyList is the strongest reference for shared household shopping behavior. Its main lesson is that collaboration should feel invisible: multiple people can contribute to one list without the UI constantly explaining synchronization. Swipe-to-check behavior is one-handed, forgiving, and fast, which maps directly to ChopChopShop's shopping-trip mode. Its aisle/grouping behavior is also relevant as a future improvement for keeping longer lists scannable.

Mealime is the clearest reference for ChopChopShop's central differentiator: turning a meal plan into a grocery list. The important UX lesson is that planning and shopping should feel like two stages of one workflow, not two separate tools. Ingredient consolidation, recipe-derived grocery rows, and "already have it" exclusions should be shown transparently so users trust the generated list.

Things 3 is the tone reference for the weekly planning experience. It shows how a mobile-first productivity app can feel calm, structured, and premium without visual noise. Its restrained typography, generous touch targets, weekly rhythm, and consistent gesture vocabulary are useful models for ChopChopShop's low-friction routine.

Apple Reminders is a useful secondary reference for grouped lists and lightweight list capture. Its grouped-list pattern and simple add behavior are relevant for shopping-list and cookbook-history views, especially where users need to add or revisit items quickly.

### Transferable UX Patterns

- Shared list updates should feel ordinary and immediate, with attribution available where useful but not overemphasized.
- Swipe actions should be fast, reversible, and supported by tap/menu alternatives.
- Recipe ingredients should consolidate into shopping suggestions with clear quantities, source context, and duplicate handling.
- "Already have it" should be a simple exclusion action, not a separate pantry-management workflow.
- Weekly planning should use a calm Monday-anchored structure with clear day groupings and generous tap targets.
- Gesture direction should stay consistent: positive/progress actions should use the same direction across contexts, and removal/restoration patterns should not conflict.
- Lists should be visually grouped when grouping helps scanning, but not forced when it adds complexity.

### Anti-Patterns to Avoid

- Treating meal planning and shopping as separate modules that require users to mentally connect the dots.
- Generating shopping rows without showing what will be added first.
- Hiding purchased or excluded items so completely that users fear accidental mistakes.
- Making swipe gestures the only way to complete important actions.
- Overloading the weekly plan with calendar complexity that exceeds the MVP routine.
- Turning cookbook history into a generic recipe library instead of a record of meals actually cooked.
- Adding pantry, aisle, or categorization complexity before the core demo loop is reliable.

### Design Inspiration Strategy

ChopChopShop should adopt AnyList's sense of effortless shared list management, Mealime's transparent plan-to-grocery pipeline, and Things 3's calm weekly productivity tone.

The app should adapt these patterns to its own household workflow: shopping rows should show recipe source and member attribution where useful; generated suggestions should remain manually confirmed; weekly planning should stay compact and mobile-first; and cookbook history should serve as a natural continuation of completed shopping trips.

The design should avoid copying feature depth from these products too early. The MVP should stay focused on the connected loop: plan meals, generate a trusted list, shop together, complete the trip, and reuse meals from history.

## Design System Foundation

### 1.1 Design System Choice

ChopChopShop should use a themeable component foundation built from Tailwind v4 and shadcn/base-ui components, with custom product-level patterns for the meal-planning flow.

This is not a fully custom design system and not a heavy established framework like Material Design or Ant Design. The right foundation is a lightweight, themeable system that gives the team accessible primitives while leaving enough control to create a calm, food-routine-specific mobile experience.

### Rationale for Selection

Tailwind and shadcn/base-ui match the existing frontend architecture and support fast implementation without forcing the app into a generic enterprise visual language.

The project needs strong mobile-first interaction patterns: bottom navigation, bottom sheets, segmented controls, swipe rows, compact cards, steppers, toggles, and list states. A themeable component approach lets the team build these consistently while keeping the UI restrained and product-specific.

This choice also supports the exam-project constraints: limited time, clear implementation path, reusable components, light/dark/system theme support, and a design that can feel polished without requiring a fully bespoke component library.

### Implementation Approach

Use shadcn/base-ui components as the accessible primitive layer for dialogs, sheets, buttons, inputs, segmented controls, popovers, checkboxes, toggles, and toast behavior.

Use Tailwind design tokens for spacing, radius, color, typography, shadows, and light/dark themes. Product-specific components should sit above the primitive layer, including:

- App shell and bottom navigation.
- Recipe cards.
- Weekly plan day groups and meal slots.
- Add-to-plan sheet.
- Generated shopping suggestion rows.
- Swipe action row.
- Shopping list item rows.
- Cookbook history rows.
- Account and household settings sections.

### Customization Strategy

The visual direction should be calm, warm, practical, and mobile-native. Components should avoid oversized marketing styling and instead favor compact hierarchy, clear touch targets, and restrained typography.

Cards should be used for repeated items and focused surfaces, not for every page section. Bottom sheets should handle details and decisions. Routes should remain stable top-level destinations.

Theme customization should support light, dark, and system modes from the start. Component styling should preserve contrast, visible focus states, and non-color-only status indicators.

The system should prioritize a small set of polished reusable patterns over many one-off components. The most important custom pattern is the shared swipe row, reused across shopping rows, hidden-item restore, and ingredient exclusion.

## 2. Core User Experience

### 2.1 Defining Experience

The defining experience is converting a shared weekly meal plan into a trusted household shopping list.

Users browse recipes, add meals to a Monday-anchored week, adjust servings and exclusions, then generate shopping suggestions. The app shows exactly what will be added, what is already on the list, and what has been excluded. After confirmation, the list becomes the shared shopping source for the household.

If this interaction works well, ChopChopShop feels meaningfully better than notes, messages, recipe apps, or disconnected grocery lists.

### 2.2 User Mental Model

Users already think in familiar household concepts: meals for the week, ingredients needed, things already at home, and groceries to buy. They do not think in backend concepts like planned-meal IDs, generated rows, household tenancy, or recipe-derived list items.

Their expectation is simple: if a meal is planned, its needed ingredients should be available for shopping. If they already have an ingredient, they should be able to exclude it. If an item is already on the list, the app should not duplicate it.

The likely confusion points are duplicate generated rows, unclear serving scaling, hidden purchased items, ingredient exclusions that feel global instead of per meal, and cookbook history that appears disconnected from completed shopping.

### 2.3 Success Criteria

The core experience succeeds when:

- Users understand why each shopping suggestion appears.
- Existing shopping-list rows are recognized and not duplicated.
- Excluded and optional ingredients do not unexpectedly appear.
- Serving changes visibly affect suggested quantities.
- Users can confirm generated rows before they are added.
- Purchased rows leave the active list but remain restorable.
- Purchase completion clearly explains what will be archived and what will become cookbook history.

Users should feel that the app is doing useful coordination work while still leaving them in control.

### 2.4 Novel UX Patterns

The individual patterns are familiar: recipe browsing, weekly planning, shopping lists, checkboxes, sheets, swipes, and ratings.

The product's unique UX comes from combining these familiar patterns into one connected household routine. The novel part is not a new gesture; it is the trustworthy bridge between planned meals, generated shopping rows, completed trips, and cookbook history.

Because the patterns are mostly established, the UX should avoid heavy education. Empty states, labels, row source text, and confirmation sheets should teach the model in context.

### 2.5 Experience Mechanics

The defining interaction begins on the weekly plan screen. A visible "Generate shopping list" action appears after the user has planned meals for the selected week.

The suggestions sheet opens with a short summary: how many meals were used and what week is being processed. Each row shows quantity, unit, ingredient name, and status. Rows already on the active shopping list are unchecked by default and labeled. Optional or excluded ingredients are omitted rather than shown as disabled noise.

The user reviews the rows, adjusts checked items, then confirms. The app adds only selected rows and shows a short confirmation toast. The shopping screen then becomes the place to act on the generated list.

During shopping, users swipe or tap rows as purchased. Purchased rows leave the active list, but hidden/purchased items remain available through a reveal view. Purchase completion opens a confirmation sheet that explains the result before finalizing.

After completion, the cookbook shows meals that were actually cooked, creating a sense that the routine produced useful household memory.

## Visual Design Foundation

### Color System

ChopChopShop should use a warm-neutral color foundation with a muted practical accent. The palette should feel calm, domestic, and useful rather than corporate or decorative.

The base palette should lean warm-neutral: soft off-white, warm stone, gentle taupe borders, and deep warm charcoal text in light mode. Dark mode should use warm near-black and dark stone surfaces rather than cool slate or blue-gray.

Recommended accent direction: muted terracotta as the primary accent, supported by sage and warm amber as secondary semantic accents.

Suggested semantic mapping:

- Background: warm off-white in light mode, warm near-black in dark mode.
- Surface: soft stone/cream in light mode, dark warm stone in dark mode.
- Border: muted taupe with enough contrast for cards, sheets, and list rows.
- Primary/accent: muted terracotta for primary actions, active navigation, selected chips, and key progress states.
- Success: muted sage for purchased, restored, completed, or positive states.
- Warning: warm amber for expiring invite codes, duplicate suggestions, or caution states.
- Error: restrained red for destructive actions and validation.
- Text: warm charcoal/light cream with clear contrast in both themes.

Color should be used sparingly. The UI should not become a one-note terracotta or beige interface; accent color should guide action and state, while structure comes from spacing, typography, and hierarchy.

### Typography System

The typography should feel modern, calm, and highly readable on small screens. The app should avoid oversized marketing typography inside the authenticated experience.

Use the default shadcn/Tailwind sans-serif stack unless the implementation later adopts a known production font. The type system should prioritize scan speed: clear screen titles, compact section labels, readable row text, and strong numeric readability for quantities and servings.

Recommended hierarchy:

- App screen titles: confident but compact.
- Section labels: small, slightly emphasized, useful for grouping.
- Body text: readable at mobile sizes, no cramped line height.
- Row metadata: smaller and quieter, but still accessible.
- Buttons and chips: short labels, stable sizing, no text overflow.
- Numeric controls: clear, centered, and easy to tap.

Typography should support Norwegian and English labels without layout breakage.

### Spacing & Layout Foundation

The layout should be mobile-first, one-thumb, and routine-oriented. It should feel organized and calm, not sparse for its own sake.

Use an 8px spacing rhythm with 4px allowed for fine internal adjustments. Repeated list rows, cards, and controls should have stable dimensions so gestures, loading states, icons, and labels do not shift the layout.

Layout principles:

- Center the mobile app shell on desktop rather than redesigning as a wide dashboard.
- Keep bottom navigation sticky inside `/app/*` with safe-area padding.
- Use bottom sheets for focused decisions and details.
- Use cards for repeated items, not as wrappers around whole page sections.
- Keep primary actions near the bottom of sheets or within the natural thumb zone.
- Preserve clear spacing between tappable rows so shopping and planning remain usable in motion.

### Accessibility Considerations

The color system must meet practical contrast requirements in light and dark mode. Status must never rely on color alone: purchased, hidden, selected, excluded, duplicate, and destructive states need labels, icons, or structural changes.

Swipe actions must always have non-swipe alternatives through tap controls, menus, or buttons. Focus states should be visible across inputs, buttons, chips, rows, and navigation.

Touch targets should be generous enough for phone use, especially shopping rows, bottom navigation, week controls, steppers, and confirmation buttons.

Light, dark, and system theme support should be implemented through semantic tokens, not hard-coded component colors.

## Design Direction Decision

### Design Directions Explored

Six visual directions were explored in `_bmad-output/planning-artifacts/ux-design-directions.html`:

- Warm Routine: balanced weekly planning, warm-neutral surfaces, muted terracotta actions.
- Shared Market: shopping-first grouped list behavior inspired by AnyList.
- Weekly Notebook: warmer planner-like tone with a more domestic visual texture.
- Dark Kitchen: warm dark-mode expression using the same semantic token model.
- Trip Mode: dense, practical shopping-trip layout with visible progress.
- Food Memory: cookbook-forward treatment that makes completed meals feel rewarding.

### Chosen Direction

The recommended direction is Warm Routine as the primary MVP foundation.

Trip Mode should influence `/app/shopping`, where the user needs denser rows, progress clarity, and fast one-handed action. Food Memory should influence `/app/cookbook`, where the app should make completed meals feel useful and worth returning to.

### Design Rationale

Warm Routine best supports the product's emotional goals: calm, practical, warm, and trustworthy. It keeps the weekly plan central without over-styling the app into a notebook metaphor or making it feel like a generic shopping-list tool.

The direction uses the agreed visual foundation: warm-neutral base colors, muted terracotta for primary actions, sage for positive completion states, and amber for caution or duplicate states.

### Implementation Approach

Implement a shared semantic token system first, then build the app around a small set of reusable mobile-first patterns: app shell, bottom navigation, bottom sheets, recipe cards, weekly day groups, shopping rows, suggestion rows, and cookbook rows.

Use Warm Routine as the default style across the app. Apply screen-specific emphasis only where it improves workflow clarity: Trip Mode for shopping and Food Memory for cookbook history.

## User Journey Flows

### Household Onboarding Flow

A new or returning user must reach the right household state before entering the main app. This flow should feel short, binary, and recoverable.

```mermaid
flowchart TD
  A[Open app] --> B{Authenticated?}
  B -- No --> C[Login or register]
  C --> D[Fetch /auth/me]
  B -- Yes --> D[Fetch /auth/me]
  D --> E{Has household?}
  E -- Yes --> F[/app/chef]
  E -- No --> G[/onboarding]
  G --> H{Create or join?}
  H -- Create --> I[Enter household name]
  I --> J{Valid?}
  J -- No --> I
  J -- Yes --> K[Create household]
  H -- Join --> L[Enter invite code]
  L --> M{Valid active code?}
  M -- No --> L
  M -- Yes --> N[Join household]
  K --> O[Refetch /auth/me]
  N --> O
  O --> F
```

Key UX requirements:

- Keep onboarding to one screen with two clear paths.
- Show inline validation for invite-code errors.
- Hide bottom navigation until household setup is complete.
- Refetch account state after create/join so the transition feels automatic.

### Weekly Plan to Shopping List Flow

This is the defining ChopChopShop journey: planned meals become a trusted shared list.

```mermaid
flowchart TD
  A[/app/chef] --> B[Search or filter recipes]
  B --> C[Open recipe detail sheet]
  C --> D[Add to plan]
  D --> E[Choose week, day, meal type, servings]
  E --> F[Confirm planned meal]
  F --> G[Toast: Added to plan]
  G --> H[/app/planned]
  H --> I[Review selected week]
  I --> J[Generate shopping list]
  J --> K[Suggestions sheet]
  K --> L{Review rows}
  L --> M[Rows already on list pre-unchecked]
  L --> N[Optional/excluded ingredients omitted]
  L --> O[User checks/unchecks rows]
  O --> P[Confirm selected rows]
  P --> Q[Rows added to active shopping list]
  Q --> R[/app/shopping]
```

Key UX requirements:

- Recipe detail and add-to-plan should be sheet-based, not separate routes.
- The suggestions sheet must explain what week and planned meals were used.
- Duplicate rows should be visible but unchecked.
- Exclusions should be reflected by omission, not clutter.
- Confirmation should happen before generated rows are inserted.

### Shopping Trip to Cookbook Flow

The shopper needs a fast active list, reversible purchase actions, and a clear completion moment.

```mermaid
flowchart TD
  A[/app/shopping] --> B[View active rows]
  B --> C{Item in cart?}
  C -- Yes --> D[Swipe or tap purchased]
  D --> E[Row leaves active list]
  E --> F{Mistake?}
  F -- Yes --> G[Open hidden items]
  G --> H[Restore row]
  H --> B
  F -- No --> I[Continue shopping]
  I --> C
  C -- Done --> J[Tap Purchase complete]
  J --> K[Confirmation sheet]
  K --> L{Confirm?}
  L -- No --> B
  L -- Yes --> M[Archive purchased rows]
  M --> N[Graduate qualifying planned meals]
  N --> O[Toast: Purchase complete]
  O --> P[/app/cookbook]
  P --> Q[Rate or add cooked meal to plan]
```

Key UX requirements:

- Active shopping rows should be dense, tappable, and one-thumb friendly.
- Swipe must have a tap/menu alternative.
- Hidden/purchased rows must be restorable.
- Purchase completion must summarize archived items, cookbook meals, and remaining rows.
- Cookbook should feel like a reward for completing the shopping routine.

### Journey Patterns

Across journeys, ChopChopShop should standardize these patterns:

- Route for main destination, sheet for focused decision.
- Inline validation for forms and invite codes.
- Toast confirmation for successful mutations.
- Reversible state changes for swipe actions.
- Short summaries before destructive or state-changing confirmations.
- Empty states that point users to the next useful route or action.
- Refetch or invalidate server state after membership, planning, shopping, and rating changes.

### Flow Optimization Principles

- Reduce the number of screens between intent and value.
- Keep generated automation reviewable before it changes shared data.
- Use the same row and sheet behaviors across planning, shopping, and cookbook.
- Prefer contextual labels over explanatory onboarding.
- Keep the bottom navigation stable inside authenticated household routes.

## Component Strategy

### Design System Components

ChopChopShop should use shadcn/base-ui primitives for common accessible UI behavior:

- Button
- Input
- Form field
- Checkbox
- Dialog
- Sheet
- Popover
- Toast
- Tabs or segmented controls
- Toggle group
- Dropdown/menu
- Tooltip
- Badge
- Separator
- Skeleton/loading states

These should provide accessibility, keyboard behavior, focus handling, and base composition. Product-specific styling should come from Tailwind tokens and app-level components.

### Custom Components

#### App Shell

**Purpose:** Own authenticated household layout, bottom navigation, safe-area spacing, and desktop mobile-centering.

**Usage:** All `/app/*` routes.

**Anatomy:** Header area, route content area, sticky bottom navigation, account initials affordance.

**States:** Loading auth, unauthenticated redirect, no-household redirect, household ready, session expired.

**Accessibility:** Bottom navigation uses semantic nav, active route state, visible focus, and text labels.

#### Bottom Navigation

**Purpose:** Provide stable access to Chef, Plan, Shop, Book, and Account.

**Usage:** Visible only inside authenticated household routes.

**Anatomy:** Five icon+label items, active state, account initials item.

**States:** Active, inactive, pressed, focus, disabled during auth loading.

**Accessibility:** Each item has a clear route label and active-route indication not based on color alone.

#### Recipe Card

**Purpose:** Let users scan and open recipes from Chef or cookbook contexts.

**Usage:** Recipe browser grid/list and cookbook detail entry points.

**Anatomy:** Image or fallback thumbnail, recipe name, meal type, optional rating or metadata, tap target.

**States:** Default, loading image, selected/opened, empty image fallback.

**Accessibility:** Entire card is a semantic button/link with readable name and metadata.

#### Detail Sheet

**Purpose:** Reusable sheet shell for recipe detail, add-to-plan, edit meal, shopping suggestions, edit row, and purchase complete.

**Usage:** All focused detail and decision flows.

**Anatomy:** Drag handle, title, content region, optional close button, sticky primary action.

**States:** Open, closing, loading, submitting, error.

**Accessibility:** Focus trap, Escape/close behavior, labelled heading, keyboard-reachable primary action.

#### Week Navigator

**Purpose:** Control Monday-anchored week selection on the planned screen.

**Usage:** `/app/planned` and shopping suggestion context.

**Anatomy:** Previous button, week title, next button, optional date-picker trigger.

**States:** Current week, past week, future week, loading.

**Accessibility:** Buttons have explicit labels such as "Previous week" and "Next week."

#### Planned Meal Slot

**Purpose:** Show planned or empty day/meal-type slots and provide edit/add entry points.

**Usage:** Weekly plan view.

**Anatomy:** Day label, meal type, recipe name, servings, empty-state action.

**States:** Empty, planned, loading, cooked/locked, editable, error.

**Accessibility:** Empty and planned slots are keyboard reachable with descriptive labels.

#### Swipe Action Row

**Purpose:** Reusable row behavior for purchased shopping rows, restoring hidden rows, and ingredient exclusions.

**Usage:** Shopping list, hidden items, recipe ingredients.

**Anatomy:** Foreground row content, hidden action background, optional status badge, fallback menu/action button.

**States:** Default, swiping, action threshold reached, completed, restored, disabled.

**Accessibility:** Every swipe action has a tap or menu equivalent; status changes are announced or confirmed visibly.

#### Shopping Suggestion Row

**Purpose:** Let users review generated rows before adding them to the list.

**Usage:** Generate shopping list sheet.

**Anatomy:** Checkbox, quantity, unit, ingredient name, source/status metadata.

**States:** Checked, unchecked, already-on-list, disabled, loading.

**Accessibility:** Checkbox label includes ingredient and status, not just visual text.

#### Shopping List Row

**Purpose:** Support fast grocery-trip interaction.

**Usage:** Active and hidden shopping views.

**Anatomy:** Quantity/unit, item name, source label, member initials, status/action affordance.

**States:** Active, purchased/hidden, restoring, editing, manual, planned-meal source.

**Accessibility:** Swipe and tap alternatives, clear status labels, focusable edit action.

#### Cookbook History Row

**Purpose:** Show household meals that were actually cooked and invite rating/re-planning.

**Usage:** `/app/cookbook`.

**Anatomy:** Recipe name, meal type, cooked count, last cooked date, current user rating.

**States:** Rated, unrated, loading, filtered, opened.

**Accessibility:** Rating is labelled as the current user's rating and is not conveyed by stars alone.

#### Account Setting Group

**Purpose:** Organize household, invite, language, theme, and logout controls.

**Usage:** `/app/account`.

**Anatomy:** Section heading, settings rows, segmented controls, owner-only invite controls.

**States:** Owner, non-owner, saving, expired invite, no active invite.

**Accessibility:** Form controls have labels and visible focus; destructive actions require clear labels.

### Component Implementation Strategy

Build custom components on top of shadcn/base-ui primitives and Tailwind semantic tokens. Keep styling centralized through tokens rather than hard-coded colors.

Prioritize components that serve the core demo path before secondary polish. The same component should be reused when behavior is the same, especially sheets, rows, chips, toasts, steppers, and segmented controls.

### Implementation Roadmap

Phase 1 core components:

- App Shell
- Bottom Navigation
- Detail Sheet
- Recipe Card
- Week Navigator
- Planned Meal Slot
- Shopping Suggestion Row
- Shopping List Row

Phase 2 interaction components:

- Swipe Action Row
- Hidden/Purchased Items View
- Purchase Complete Sheet
- Add-to-Plan Sheet
- Edit Shopping Row Sheet
- Servings Stepper

Phase 3 supporting components:

- Cookbook History Row
- Rating Control
- Account Setting Group
- Invite Code Panel
- Empty State
- Error/Retry State
- Theme and language segmented controls

## UX Consistency Patterns

### Button Hierarchy

Primary actions should represent the main next step for the current screen or sheet. Examples: "Add to plan," "Generate shopping list," "Add selected items," and "Purchase complete."

Secondary actions should support navigation, cancellation, restoration, filtering, or optional changes. Destructive actions should be visually distinct, labelled plainly, and placed away from positive confirmation where possible.

Primary buttons should use the muted terracotta accent. Success or completion should not automatically turn primary buttons green; sage should be reserved for state feedback such as purchased, restored, or completed.

Button labels should be concrete and outcome-oriented. Prefer "Add to Wed Apr 29," "Add 5 items," and "Purchase complete" over vague labels like "Submit" or "OK."

### Feedback Patterns

Use toast feedback for successful, low-risk mutations: added to plan, shopping rows added, item restored, rating saved, language changed, theme changed, invite generated.

Use inline feedback for form validation and recoverable user errors: invalid login, invalid invite code, missing household name, invalid quantity, failed search retry.

Use confirmation sheets for actions that change shared or historical state: purchase complete, revoke invite code, leave household, log out if needed, remove planned meal when generated rows exist.

Use localized loading states near the affected content rather than blocking the whole app shell. The app shell should remain stable while route content, sheets, or lists load.

### Form Patterns

Forms should be short, labelled, and optimized for mobile input. Auth and onboarding forms should show validation in place and keep the user on the same screen after recoverable errors.

Invite code input should auto-uppercase, reject ambiguous characters, and support grouped visual display without requiring the user to type separators.

Numeric controls such as servings and quantities should use steppers where possible, with direct input only when useful. Servings should clearly show min/max behavior.

Form submission should disable only the affected form controls, not the entire screen, unless the action requires a blocking transition.

### Navigation Patterns

Top-level destinations are routes: Chef, Plan, Shop, Book, Account. The bottom navigation is visible only inside authenticated household routes.

Focused decisions use sheets, not new routes. Recipe detail, add-to-plan, edit meal, suggestions, edit shopping row, and purchase completion should all use bottom sheets.

The app should redirect users through centralized auth and household gating:

- Unauthenticated users go to login.
- Authenticated users without households go to onboarding.
- Authenticated household users enter `/app/*`.

Desktop should keep the same route and navigation model while centering the mobile shell.

### Sheet and Overlay Patterns

Sheets should have one clear purpose, a labelled title, a close affordance, and a primary action pinned near the bottom when content is long.

Sheets should preserve context. Opening a recipe detail or edit sheet should not make users feel they left the current route.

Long sheets should scroll internally while the primary action remains reachable. Destructive actions inside sheets should be separated from the primary action.

### Generated Suggestion Patterns

Generated shopping suggestions must be reviewable before insertion. The suggestion sheet should show:

- Week being processed.
- Number of planned meals used.
- Suggested item quantity, unit, and name.
- Already-on-list status where applicable.
- Checked/unchecked state before confirmation.

The app should omit optional and excluded ingredients from the suggestion list rather than showing them as disabled rows. This keeps the sheet focused on actionable choices.

### List and Row Patterns

Rows should be stable, tappable, and scan-friendly. Shopping rows need quantity/unit first, then item name, then source and attribution metadata.

Swipe behavior should be consistent and reversible. Important swipe actions must also have tap or menu alternatives.

Purchased or hidden rows should leave the active list to reduce clutter, but must remain reachable from a hidden/purchased view.

### Empty, Error, and Loading States

Empty states should guide the next useful action:

- Chef: clear filters or search again.
- Planned: browse recipes to add meals.
- Shopping: plan meals or add a manual item.
- Cookbook: complete a shopping trip first.
- Account invite: generate an invite code if owner.

Errors should explain what happened and how to recover. Avoid technical backend wording in user-facing errors.

Loading states should preserve layout shape using skeletons or reserved row space to prevent jarring shifts.

## Responsive Design & Accessibility

### Responsive Strategy

ChopChopShop should be designed mobile-first for phone-sized daily use. The primary interaction model assumes touch, one-thumb navigation, bottom navigation, bottom sheets, swipe rows, and compact list scanning.

Mobile screens should prioritize one main task per route:

- Chef: find and open recipes.
- Plan: review the selected week and generate shopping suggestions.
- Shop: act on the current list quickly.
- Book: revisit cooked meals and rate/re-plan.
- Account: manage household and preferences.

Tablet should use the same touch-first layout with slightly more breathing room. It can widen sheets and list rows, but should not introduce a separate workflow.

Desktop should center the mobile app shell with margins. Extra width should improve comfort and demo presentation, not create a dashboard or side navigation. The authenticated product remains route-first with bottom navigation.

### Breakpoint Strategy

Use mobile-first responsive rules with standard Tailwind breakpoints, but design the core layout around the smallest practical supported width.

Recommended practical targets:

- 360px: primary mobile usability target.
- 390px: common modern phone target.
- 768px: tablet and large-screen touch layout.
- 1024px+: centered desktop shell.

The app shell should have a maximum content width on desktop, likely around 420px to 520px for the authenticated mobile app. Public auth/onboarding pages may use slightly wider centered layouts if useful, but should still feel mobile-compatible.

Avoid layout changes that alter the workflow between mobile and desktop. Responsive behavior should mostly adjust width, spacing, sheet size, and list density.

### Accessibility Strategy

The MVP should target practical WCAG AA alignment.

Key requirements:

- Normal text contrast should meet at least 4.5:1.
- Large text and icon+label controls should maintain readable contrast in light and dark themes.
- All primary actions must be keyboard reachable.
- Swipe interactions must have non-swipe alternatives.
- Forms must have visible labels, validation text, and programmatic relationships.
- Focus states must be visible on buttons, links, inputs, chips, rows, bottom navigation, and sheet controls.
- Status must not rely on color alone.
- Touch targets should be at least 44x44px where possible.
- Sheets and dialogs must manage focus correctly.
- Route changes and session-expiry redirects should not trap keyboard or screen-reader users.

Product-specific accessibility concerns:

- Purchased, hidden, excluded, duplicate, selected, and active states need text/icon cues.
- Star ratings need accessible labels such as "Your rating: 4 of 5."
- Quantity and serving steppers need clear increment/decrement labels.
- Invite codes should be readable as grouped characters but still copyable/input-friendly.
- Norwegian and English labels must both fit without truncating critical controls.

### Testing Strategy

Responsive testing should cover at least:

- 360px mobile viewport.
- 390px mobile viewport.
- 768px tablet viewport.
- 1024px+ desktop viewport with centered shell.
- Mobile Safari and mobile Chrome behavior.
- Hard refresh on `/app/*` routes in production-like serving.

Accessibility testing should include:

- Keyboard-only navigation through auth, onboarding, app shell, sheets, and forms.
- Screen-reader spot checks for bottom navigation, sheets, generated suggestions, shopping rows, and rating controls.
- Automated checks with an accessibility tool during frontend verification.
- Light and dark theme contrast checks.
- Reduced-motion behavior for swipe/transition-heavy interactions.

Core demo-path testing should include the full loop from login/register to household setup, recipe planning, suggestion generation, shopping completion, cookbook history, rating, language switch, and theme switch.

### Implementation Guidelines

Use semantic HTML first, then ARIA only where native semantics are not enough.

Build layout with mobile-first CSS and stable dimensions for rows, nav items, steppers, chips, and sheet controls. Avoid viewport-scaled font sizes. Use semantic Tailwind tokens for color and spacing rather than hard-coded values.

Use safe-area padding for the bottom navigation and sheet actions. Ensure fixed or sticky controls do not cover content.

Reserve space for loading states to prevent layout jumps. Keep the app shell visible while route content loads.

Respect `prefers-reduced-motion` for swipe animations, sheet transitions, and toast movement. Reduced motion should keep state changes understandable without relying on animation.
