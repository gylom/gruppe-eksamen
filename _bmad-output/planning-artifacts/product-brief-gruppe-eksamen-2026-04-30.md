---
stepsCompleted: [1, 2, 3, 4, 5, 6]
completedAt: 2026-04-30
inputDocuments:
  - docs/frontend-description.md
  - docs/frontend-architecture-decisions.md
  - docs/ui-ux-screens.md
  - docs/components.md
date: 2026-04-30
author: PaalA
project: gruppe-eksamen
productName: ChopChopShop
workflowConfigAssumptions:
  project_name: gruppe-eksamen
  output_folder: docs
  planning_artifacts: docs
  user_name: PaalA
  communication_language: English
  document_output_language: English
  user_skill_level: unknown
---

# Product Brief: ChopChopShop

<!-- Content will be appended sequentially through collaborative workflow steps -->

## Executive Summary

ChopChopShop is a mobile-first household meal planner that helps people plan meals, build shopping lists, shop together, and preserve a shared history of meals they actually cooked. The product is designed for everyday household use, with a React/Vite frontend served by the existing .NET backend and deployed as a single Railway service.

The core value is reducing the friction between deciding what to eat, remembering what ingredients are needed, coordinating shopping, and reusing successful meals later. Instead of treating recipes, meal plans, shopping lists, and ratings as separate tools, the app connects them into one household workflow.

---

## Core Vision

### Problem Statement

Households that cook and shop together often plan meals informally across memory, messages, notes, and grocery lists. This makes it easy to forget planned meals, duplicate ingredients, buy things already at home, or lose track of meals the household liked.

### Problem Impact

When meal planning is fragmented, everyday food routines become more stressful than they need to be. Household members may not share the same view of the week, shopping trips become less efficient, and good meals are not captured in a useful history for future planning.

### Why Existing Solutions Fall Short

Many solutions focus on only one part of the workflow: recipe browsing, grocery lists, or meal calendars. The gap is the connection between a household meal plan and a practical shopping trip. Existing tools also often lack shared household context, swipe-first mobile interaction, and a cookbook based on what was actually cooked rather than just saved.

### Proposed Solution

Build a mobile-first meal planning app where households can browse recipes, add meals to a shared weekly plan, generate shopping-list suggestions from planned meals, mark items as purchased with swipe gestures, and complete shopping trips that turn cooked meals into household cookbook history.

The app should keep the workflow simple: top-level routes provide the main structure, while bottom sheets handle details like recipe viewing, meal planning, shopping suggestions, and editing. The backend should reuse existing auth, household, recipe, ingredient, shopping-list, and rating structures where possible.

### Key Differentiators

- Household-first planning rather than individual-only meal tracking.
- Shopping-list generation from actual planned meals, with manual confirmation.
- Swipe-based interactions reused across shopping and ingredient exclusion.
- Cookbook history derived from completed shopping trips, not a separate saved-recipes feature.
- Per-user ratings over shared household history.
- Minimal backend expansion by building on existing C#/.NET tables and controller patterns.
- Mobile-first UX with desktop treated as a centered mobile layout.

## Target Users

### Primary Users

**Shared Household Meal Planners**

The primary users are people living in shared households who need to coordinate meals and shopping with others. This can include families, couples, roommates, student collectives, or any household where more than one person participates in deciding what to eat, buying groceries, or cooking.

A typical primary user is someone like **Maren**, who lives with other people and often ends up asking, "What are we eating this week?" or "Do we already have this ingredient?" She may not be the only person cooking, but she often carries the mental load of remembering plans, checking ingredients, and making sure the shopping list matches what the household actually intends to cook.

Their goal is not advanced meal optimization. They want an easy shared routine: pick meals, know what needs buying, shop without confusion, and remember which meals worked well.

**Household Shoppers**

Another primary user is someone like **Jonas**, who may not plan every meal but often does the grocery trip. He needs a clear, current shopping list that reflects the household's plan. He benefits from swipe-to-purchase interactions, source labels showing whether an item came from a planned meal or was added manually, and a simple "purchase complete" moment that closes the trip.

For this user, success means walking into the store with confidence, avoiding duplicate purchases, and not having to decode scattered messages or notes.

### Secondary Users

**Household Members Who Participate Occasionally**

Secondary users are household members who do not own the planning process but still benefit from visibility and lightweight participation. They may add a recipe, join a household with an invite code, rate meals in the cookbook, or check the weekly plan before dinner.

They need the app to feel simple and low-commitment. Their most important experience is being able to understand the plan quickly and contribute without learning a complex system.

**Future Maintainers or Evaluators**

Because this is a school project built on an existing C# backend and a new React/Vite frontend, another secondary audience is technical evaluators or maintainers. They benefit from a clear architecture, minimal backend additions, reuse of existing database structures, and a product flow that demonstrates coherent full-stack behavior.

### User Journey

**Discovery**

A household starts using ChopChopShop because meal planning and shopping have become scattered across memory, chat messages, and ad hoc grocery notes. One member creates an account, creates a household, and invites others with a short invite code.

**Onboarding**

New users register or log in, then either create a household or join one with an invite code. Once they belong to a household, they enter the main app through the recipe browser.

**Core Usage**

During the week, household members browse recipes, add meals to the shared weekly plan, adjust servings, and exclude ingredients they already have. When the plan is ready, they generate shopping-list suggestions from the week's meals and manually confirm which items should be added.

At the store, the shopper uses the active shopping list, swipes items as purchased, restores hidden items if needed, and finishes the trip with "Purchase complete."

**Success Moment**

The first strong success moment happens when a planned week turns into a useful shopping list without manual copying. The second happens after shopping, when completed meals naturally appear in the cookbook history and can be rated or reused later.

**Long-Term Routine**

Over time, ChopChopShop becomes the household's shared food memory. The weekly plan shows what is coming, the shopping list shows what needs buying, and the cookbook shows what the household actually cooked and liked.

## Success Metrics

ChopChopShop succeeds when it can be demonstrated as a coherent, useful, mobile-first household meal planning app. For this project, success is less about commercial growth and more about showing a complete, believable product flow that works end-to-end and supports the exam evaluation.

The most important success signal is that a user can understand the app quickly, complete the core household workflow, and see why the product would be useful in real life.

### User Success

Users are successful when they can:

- Register or log in and reach the correct household flow.
- Create or join a household.
- Browse recipes on a mobile-first interface.
- Add recipes to a shared weekly plan.
- Generate shopping-list suggestions from planned meals.
- Use the shopping list while shopping, including swipe-style purchase behavior.
- Complete a shopping trip and see cooked meals represented in cookbook history.
- Navigate the app comfortably through the bottom navigation without needing explanation.

The app should feel successful if a household member can say: "I can see what we are eating, what we need to buy, and what we have cooked before."

### Business Objectives

Because this is a school/exam project, the primary objective is not revenue or market adoption. The objective is to deliver a polished, working demo that clearly communicates the product idea and demonstrates full-stack implementation quality.

Primary project objectives:

- Pass the exam with a product that feels complete, coherent, and demonstrable.
- Show a strong connection between product concept, UX design, frontend architecture, backend integration, and database changes.
- Demonstrate that the app is mobile-first in both layout and interaction model.
- Build on the existing C# backend without unnecessary rewrites.
- Present a useful, realistic household workflow rather than a collection of disconnected screens.

### Key Performance Indicators

The project should be evaluated against these practical indicators:

- **Core demo completion:** A user can complete the flow from authentication/onboarding to meal planning, shopping-list generation, purchase completion, and cookbook history.
- **Mobile-first usability:** The main app views work well on a phone-sized viewport, with bottom navigation, one-thumb actions, sheets, and swipe-oriented interactions.
- **Perceived usefulness:** A viewer can understand within a short demo how ChopChopShop helps a shared household plan meals and shop together.
- **Architecture alignment:** The frontend follows the documented React/Vite/React Router/TanStack Query architecture and is served by the .NET backend as planned.
- **Backend integration:** New features reuse existing backend concepts where possible, especially auth, households, recipes, shopping-list rows, and ratings.
- **Demo reliability:** The app can be run and demonstrated without fragile manual setup during evaluation.
- **Scope discipline:** The delivered v1 focuses on meal planning, shopping, cookbook history, household onboarding, i18n, and theme support, while deferring lower-priority features such as recipe creation, pantry management, avatar uploads, and push notifications.

## MVP Scope

### Core Features

The MVP should deliver the full ChopChopShop demo loop: authentication, household setup, recipe browsing, weekly meal planning, shopping-list generation, shopping completion, and cookbook history. The goal is not to build every possible meal-planning feature, but to prove the core household workflow in a polished, mobile-first way.

Core MVP features:

- **Authentication:** Users can register, log in, stay authenticated with JWT bearer auth, and be redirected correctly when unauthenticated.
- **Household onboarding:** Users without a household must create one or join with a 6-character invite code before entering the main app.
- **App shell:** Authenticated household users access the main app through a mobile-first `/app/*` layout with bottom navigation for Chef, Plan, Shop, Book, and Account.
- **Recipe browser:** Users can browse, search, and filter existing recipes by meal type.
- **Recipe detail:** Users can open recipe details in a bottom sheet, inspect ingredients and instructions, and start the add-to-plan flow.
- **Weekly meal plan:** Users can add recipes to a Monday-anchored household week, choose day, meal type, and servings, and review planned meals by week.
- **Ingredient exclusions:** Users can mark planned-meal ingredients as already available so they are excluded from shopping-list generation.
- **Shopping-list generation:** Users can generate suggested shopping rows from planned meals, manually confirm the rows they want, and avoid duplicate insertion for items already on the list.
- **Shopping list:** Users can view active household shopping rows, add or edit manual items, swipe items as purchased, reveal hidden/purchased items, and restore them when needed.
- **Purchase complete:** Users can complete a shopping trip, archive purchased rows, and graduate qualifying planned meals into cookbook history.
- **Cookbook history:** Users can view meals the household has actually cooked, sort by their own ratings, and rate meals with the existing per-user rating storage.
- **Account screen:** Users can see household members, manage invite codes where appropriate, switch language, switch theme, and log out.
- **Internationalization and theme:** The app supports Norwegian and English chrome text, plus system/light/dark theme selection.
- **Deployment shape:** The React/Vite SPA builds into static assets served by the .NET backend from `wwwroot/`, with Railway as the target deployment environment.

### Out of Scope for MVP

The MVP intentionally excludes features that would add implementation cost without strengthening the core exam demo.

Out of scope for v1:

- Recipe creation or editing UI.
- Recipe image upload and image hosting.
- Pantry or `Varelager` management.
- Automatic pantry deduction from generated shopping suggestions.
- Multi-household membership or household switching.
- Refresh tokens or HttpOnly cookie/BFF auth.
- Avatar uploads or external avatar providers.
- Push notifications or post-meal rating prompts.
- Password change or account recovery flows.
- Cuisine as a separate filter dimension.
- Hidden-recipes management UI.
- Per-household rating averages.
- Advanced multi-week shopping-trip semantics.
- Unit conversion during shopping-list aggregation.

### MVP Success Criteria

The MVP is successful when it can be demonstrated as a reliable, coherent mobile-first product during the exam.

Success criteria:

- A user can complete the full flow from registration/login through household onboarding and into the main app.
- A user can plan meals for a week and generate a shopping list from that plan.
- Generated shopping suggestions respect optional ingredients, ingredient exclusions, serving adjustments, and existing shopping rows.
- A user can shop from the active list, mark items as purchased, and complete the trip.
- Completed shopping trips create visible cookbook history.
- The app feels designed for phone-sized use, with bottom navigation, sheets, compact layouts, and swipe-style interactions.
- The frontend and backend integration works consistently enough for a live demo.
- The scope feels useful and complete without requiring deferred v2 features to explain the product.

### Future Vision

If the MVP succeeds, ChopChopShop can evolve from a focused household meal-planning demo into a richer shared food-planning platform.

Future improvements could include recipe creation, pantry management, image uploads, household switching, better recipe discovery, meal recommendations, push reminders, household-level rating insights, and more advanced shopping intelligence such as unit conversion or stock-aware suggestions.

The long-term vision is a household food assistant that keeps planning, shopping, cooking history, preferences, and practical grocery decisions connected in one simple daily-use app.
