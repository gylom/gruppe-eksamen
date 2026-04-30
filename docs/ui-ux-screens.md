# UI/UX Screens — Meal Planner

A human-readable companion to `frontend-architecture-decisions.md`, focused on what each screen looks like and feels like. ASCII mockups are mobile-portrait, roughly 40 characters wide. They are not pixel-perfect; they show what content lives where and what the user can do.

---

## Design Principles

- **Mobile-first.** Every screen designed for one thumb. Desktop is "mobile centered with margins".
- **Routes for skeleton, sheets for detail.** Top-level views are real URLs. Editing, picking, and confirming happens in bottom sheets and popovers.
- **One primary action per screen.** Secondary actions live in headers, swipes, or sheets.
- **Honest empty states.** Every list shows the user what to do next, not just "nothing here yet".
- **The bottom nav is always visible inside `/app/*`.** It disappears in onboarding and auth.

---

## Common UI Elements

### Bottom navigation (visible inside `/app/*`)

```
+----------------------------------------+
|  [Chef]  [Plan]  [Shop]  [Book]  [PA]  |
|    *                                   |
+----------------------------------------+
```

- 5 items: Chef · Planned · Shopping · Cookbook · Account.
- Active item shows accent color and filled icon.
- Account icon shows the user's initials (e.g. `PA`) in a colored circle, not a generic person icon.
- Sticky bottom, with safe-area padding for iPhones.

### Bottom sheet pattern

Used for recipe detail, add-to-plan, edit-shopping-row, generate suggestions, etc.

```
                                          
                                          
                                          
       +----------------------------+     
       |  ===                       |     
       |                            |     
       |  Sheet title               |     
       |                            |     
       |  Content                   |     
       |                            |     
       |  [ Primary action ]        |     
       +----------------------------+     
```

- Drag handle at top, dismiss by drag-down or tapping outside.
- Primary action pinned to the bottom.

### Swipe-to-remove row (shared component)

A single reusable list-row component handles swipe gestures across the app. Used in:

- **Shopping active list** — swipe right → mark purchased (green flash, row disappears).
- **Shopping hidden view** — swipe left → restore to active list.
- **Recipe detail sheet** — swipe right on an ingredient → exclude it from the shopping list (e.g. "I already have this"). Excluded ingredients are visually dimmed and tagged "already have"; swipe left to restore.

The same component is reused so the gesture, animation, and accessibility affordances stay consistent. Excluded-state and purchased-state are both "row hidden from primary list, restorable", just rendered with different labels.

### Toasts

- Short confirmations bottom of screen (sonner). Used for "Added to plan", "Purchase complete", "Session expired", etc.

---

## Public Screens

### `/` — Landing (logged-out)

Minimal. App name, one-line value pitch, two buttons. Logged-in users get redirected to `/app/chef`.

```
+----------------------------------------+
|                                        |
|                                        |
|             Meal Planner               |
|                                        |
|        Plan meals together,            |
|        shop together.                  |
|                                        |
|                                        |
|        +------------------+            |
|        |   Log in         |            |
|        +------------------+            |
|                                        |
|        +------------------+            |
|        |   Register       |            |
|        +------------------+            |
|                                        |
|                                        |
|         Norsk  /  English              |
+----------------------------------------+
```

### `/login`

```
+----------------------------------------+
|  <-                                    |
|                                        |
|  Welcome back                          |
|                                        |
|  Username or email                     |
|  [_________________________________]   |
|                                        |
|  Password                              |
|  [_________________________________]   |
|                                        |
|  +----------------------------------+  |
|  |          Log in                  |  |
|  +----------------------------------+  |
|                                        |
|  No account yet?  Register             |
+----------------------------------------+
```

- Empty fields disable the primary CTA.
- On 401 → inline error above the form.

### `/register`

```
+----------------------------------------+
|  <-                                    |
|                                        |
|  Create your account                   |
|                                        |
|  Username                              |
|  [_________________________________]   |
|                                        |
|  Email                                 |
|  [_________________________________]   |
|                                        |
|  Password                              |
|  [_________________________________]   |
|                                        |
|  +----------------------------------+  |
|  |        Create account            |  |
|  +----------------------------------+  |
|                                        |
|  Already have an account?  Log in      |
+----------------------------------------+
```

- Household is **not** asked for here. New users land on `/onboarding` after registering.

---

## Onboarding

### `/onboarding` — Create or Join

Two cards, single screen. The user must pick one path before reaching `/app/*`.

```
+----------------------------------------+
|                                        |
|  Hi, paal                              |
|  Let's set up your household.          |
|                                        |
|  +----------------------------------+  |
|  |  Create a new household          |  |
|  |                                  |  |
|  |  Household name                  |  |
|  |  [____________________________]  |  |
|  |                                  |  |
|  |  +----------------------------+  |  |
|  |  |        Create              |  |  |
|  |  +----------------------------+  |  |
|  +----------------------------------+  |
|                                        |
|  +----------------------------------+  |
|  |  Join with invite code           |  |
|  |                                  |  |
|  |  Code                            |  |
|  |  [ K 7 M  -  2 P 9 ]             |  |
|  |                                  |  |
|  |  +----------------------------+  |  |
|  |  |        Join                |  |  |
|  |  +----------------------------+  |  |
|  +----------------------------------+  |
|                                        |
|  Log out                               |
+----------------------------------------+
```

- Code field auto-uppercases and ignores ambiguous chars (no I/O/0/1).
- Invalid code → inline error inside the card.
- Bottom nav is hidden on this screen.

---

## `/app/chef` — Recipe Browser

The "what shall we cook?" screen. Browse, search, filter, tap to add to plan.

```
+----------------------------------------+
|  Chef                            [PA]  |
|                                        |
|  [ Search recipes...               ]   |
|                                        |
|  Meal type:                            |
|  [Frokost] [*Lunsj*] [Middag] [more]   |
|                                        |
|  +-------------+  +-------------+      |
|  |             |  |             |      |
|  |  pasta.jpg  |  |  taco.jpg   |      |
|  |             |  |             |      |
|  | Spaghetti   |  | Tacos       |      |
|  | bolognese   |  |             |      |
|  | Middag      |  | Middag      |      |
|  +-------------+  +-------------+      |
|                                        |
|  +-------------+  +-------------+      |
|  |             |  |             |      |
|  |  curry.jpg  |  |  salad.jpg  |      |
|  |             |  |             |      |
|  | Linsekarri  |  | Cæsarsalat  |      |
|  | Middag      |  | Lunsj       |      |
|  +-------------+  +-------------+      |
|                                        |
|  +----------------------------------+  |
|  |  [Chef]  Plan  Shop  Book  [PA]  |  |
|  +----------------------------------+  |
+----------------------------------------+
```

- Search is debounced ~300 ms, server-side via `?sok=`.
- Filter chips combine with AND. Tapping the active chip clears it.
- Tap a recipe card → opens recipe detail sheet (below).
- **Empty state** ("no recipes match"): "Nothing matches *X*. Clear filters to start over."

### Recipe detail sheet (from `/app/chef`)

```
+----------------------------------------+
|  ===                              x    |
|                                        |
|  +----------------------------------+  |
|  |          pasta.jpg               |  |
|  +----------------------------------+  |
|                                        |
|  Spaghetti bolognese                   |
|  Middag                                |
|  4 portions                            |
|                                        |
|  Ingredienser                          |
|  (swipe right to exclude an ingredient |
|   you already have)                    |
|  - 400 g kjøttdeig                     |
|  - 1 boks hermetiske tomater           |
|  - 1 løk                               |
|  - 2 fedd hvitløk         already have |
|  - Salt (etter smak)                   |
|  - Pepper (valgfritt)                  |
|                                        |
|  Fremgangsmåte                         |
|  1. Brun kjøttdeig...                  |
|  2. Tilsett løk og hvitløk...          |
|  3. ...                                |
|                                        |
|  +----------------------------------+  |
|  |        Add to plan               |  |
|  +----------------------------------+  |
+----------------------------------------+
```

- Optional ingredients (Pepper) marked clearly.
- Null-quantity ingredients (Salt) show "etter smak", not "0 g".
- Swipe right on an ingredient to mark it "already have" — it will be excluded when this meal contributes to the shopping list. Swipe left on an excluded row to restore. Exclusions persist for this planned meal instance, not globally.
- Same swipe-row component as `/app/shopping`.
- "Add to plan" opens the next sheet.

### Add-to-plan sheet

```
+----------------------------------------+
|  ===                              x    |
|                                        |
|  Add Spaghetti bolognese               |
|                                        |
|  Week                                  |
|  [*This week*] [Next week] [Custom]    |
|  Mon Apr 27 - Sun May 3                |
|                                        |
|  Day                                   |
|  [Mon] [Tue] [*Wed*] [Thu] [Fri]       |
|  [Sat] [Sun]                           |
|                                        |
|  Meal type                             |
|  [Frokost] [Lunsj] [*Middag*] [Kvelds] |
|                                        |
|  Servings                              |
|       [-]    4    [+]                  |
|       (default = household size)       |
|                                        |
|  +----------------------------------+  |
|  |  Add to Wed Apr 29               |  |
|  +----------------------------------+  |
+----------------------------------------+
```

- Default day = today, or next future day in the selected week.
- Servings default = household member count, capped 1–20.
- On confirm: toast "Added to plan", sheet closes, user lands back on `/app/chef`.

---

## `/app/planned` — Weekly Plan

The shared week view. Edit servings, swap meals, remove slots. Trigger shopping-list generation from here.

```
+----------------------------------------+
|  Planned                         [PA]  |
|                                        |
|  <    Week of Mon Apr 27         >     |
|       (tap title to pick week)         |
|                                        |
|  Mon Apr 27                            |
|  +----------------------------------+  |
|  |  Middag  -  Tacos                |  |
|  |  4 portions                      |  |
|  +----------------------------------+  |
|                                        |
|  Tue Apr 28                            |
|  +----------------------------------+  |
|  |  No meal planned              +  |  |
|  +----------------------------------+  |
|                                        |
|  Wed Apr 29                            |
|  +----------------------------------+  |
|  |  Middag  -  Spaghetti bolognese  |  |
|  |  4 portions                      |  |
|  +----------------------------------+  |
|                                        |
|  Thu Apr 30                            |
|  +----------------------------------+  |
|  |  No meal planned              +  |  |
|  +----------------------------------+  |
|                                        |
|  ...                                   |
|                                        |
|  +----------------------------------+  |
|  |   Generate shopping list         |  |
|  +----------------------------------+  |
|                                        |
|  +----------------------------------+  |
|  |  Chef  [Plan]  Shop  Book  [PA]  |  |
|  +----------------------------------+  |
+----------------------------------------+
```

- Tap a meal slot → edit-meal sheet (change servings, remove, swap recipe).
- Tap empty slot's `+` → opens `/app/chef` filtered to that meal type so the user can add directly.
- "Generate shopping list" opens the suggestions sheet.

### Edit planned meal sheet

```
+----------------------------------------+
|  ===                              x    |
|                                        |
|  Wed Apr 29  -  Middag                 |
|  Spaghetti bolognese                   |
|                                        |
|  Servings                              |
|       [-]    4    [+]                  |
|                                        |
|  +----------------------------------+  |
|  |        Save changes              |  |
|  +----------------------------------+  |
|                                        |
|  +----------------------------------+  |
|  |   Remove from plan        (red)  |  |
|  +----------------------------------+  |
+----------------------------------------+
```

- Removing the meal also removes its **non-purchased** generated shopping rows.
- Purchased rows stay, cookbook history (if any) stays.

### Generate shopping list sheet

```
+----------------------------------------+
|  ===                              x    |
|                                        |
|  Suggestions for week of Apr 27        |
|                                        |
|  Based on 3 planned meals.             |
|                                        |
|  [x] 800 g  kjøttdeig                  |
|  [x] 2 bks  hermetiske tomater         |
|  [x] 2      løk                        |
|  [x] 4 fedd hvitløk                    |
|  [x]        Salt (etter smak)          |
|  [ ] 500 g  pasta                      |
|       (already on shopping list)       |
|                                        |
|  +----------------------------------+  |
|  |  Add 5 items to shopping list    |  |
|  +----------------------------------+  |
+----------------------------------------+
```

- Items already on the shopping list pre-uncheck themselves.
- Ingredients excluded via swipe in the recipe detail sheet do not appear here at all.
- Confirming adds the checked items, attributed to the user who pressed the button.

---

## `/app/shopping` — Shopping List

The grocery-trip view. Swipe to mark purchased; reveal hidden items to restore. Finish with "Purchase complete".

### Active list

```
+----------------------------------------+
|  Shopping                        [PA]  |
|                                        |
|  6 items   added by Paal, Maren        |
|                                        |
|  +----------------------------------+  |
|  |  800 g  kjøttdeig          (PA)  |  |
|  |  from Spaghetti bolognese        |  |
|  +----------------------------------+  |
|                                        |
|  +----------------------------------+  |
|  |  2 bks  hermetiske tomater (PA)  |  |
|  +----------------------------------+  |
|                                        |
|  +----------------------------------+  |
|  |  1 L    melk               (M)   |  |
|  |  manual                          |  |
|  +----------------------------------+  |
|                                        |
|  +----------------------------------+  |
|  |  +  Add item                     |  |
|  +----------------------------------+  |
|                                        |
|  Show hidden shopping items (3)        |
|                                        |
|  +----------------------------------+  |
|  |   Purchase complete              |  |
|  +----------------------------------+  |
|                                        |
|  +----------------------------------+  |
|  |  Chef  Plan  [Shop]  Book  [PA]  |  |
|  +----------------------------------+  |
+----------------------------------------+
```

- Swipe right on a row → mark purchased, row disappears from active list.
- Tap a row → edit sheet (quantity, unit, attribution stays).
- "Add item" → small sheet with varetype + quantity + unit.
- Source pill shows whether the row came from a planned meal or was added manually.
- Initials chip on each row shows attribution.

### Hidden / purchased view

```
+----------------------------------------+
|  Shopping  -  Hidden items             |
|  <  Back to active list                |
|                                        |
|  +----------------------------------+  |
|  |  500 g  pasta              (PA)  |  |
|  |  purchased                       |  |
|  +----------------------------------+  |
|                                        |
|  +----------------------------------+  |
|  |  3       løk               (M)   |  |
|  |  purchased                       |  |
|  +----------------------------------+  |
|                                        |
|  Swipe left to restore.                |
+----------------------------------------+
```

### Purchase complete confirmation

```
+----------------------------------------+
|  ===                              x    |
|                                        |
|  Finish shopping?                      |
|                                        |
|  - 5 purchased items will be archived. |
|  - 2 planned meals will move to        |
|    your cookbook.                      |
|  - 1 unchecked item stays on the list. |
|                                        |
|  +----------------------------------+  |
|  |       Purchase complete          |  |
|  +----------------------------------+  |
|                                        |
|       Cancel                           |
+----------------------------------------+
```

- Only weeks ≤ current week graduate to cookbook.
- Confirmation prevents accidental presses.

---

## `/app/cookbook` — Household History

What you actually cooked, sorted by your own ratings. Each member sees the same rows but their own ranking.

```
+----------------------------------------+
|  Cookbook                        [PA]  |
|                                        |
|  [ Search...                       ]   |
|  [Frokost] [Lunsj] [*Middag*] [more]   |
|                                        |
|  +----------------------------------+  |
|  |  Spaghetti bolognese       *5    |  |
|  |  Middag - cooked 5 times         |  |
|  |  Last: Wed Apr 29                |  |
|  +----------------------------------+  |
|                                        |
|  +----------------------------------+  |
|  |  Tacos                     *4    |  |
|  |  Middag - cooked 3 times         |  |
|  |  Last: Mon Apr 27                |  |
|  +----------------------------------+  |
|                                        |
|  +----------------------------------+  |
|  |  Linsekarri                *3    |  |
|  |  Middag - cooked 2 times         |  |
|  |  Last: Sun Apr 19                |  |
|  +----------------------------------+  |
|                                        |
|  +----------------------------------+  |
|  |  Cæsarsalat                * -   |  |
|  |  Lunsj - cooked 1 time           |  |
|  |  Last: Sat Apr 18                |  |
|  +----------------------------------+  |
|                                        |
|  +----------------------------------+  |
|  |  Chef  Plan  Shop  [Book]  [PA]  |  |
|  +----------------------------------+  |
+----------------------------------------+
```

- Stars are **my** rating. Other household members see different sort orders.
- Unrated meals (`* -`) appear at the bottom, ordered by recency.
- Tap a row → recipe detail sheet (same component as `/app/chef`) with a star widget at the top for rating.
- A 1-star rating does **not** hide the recipe (v1 fix).

### Rating from cookbook detail

```
+----------------------------------------+
|  ===                              x    |
|                                        |
|  Linsekarri                            |
|  Middag                                |
|                                        |
|  Your rating                           |
|     *  *  *  o  o                      |
|                                        |
|  Cooked 2 times by your household.     |
|  Last: Sun Apr 19                      |
|                                        |
|  Ingredienser                          |
|  ...                                   |
|                                        |
|  +----------------------------------+  |
|  |        Add to plan               |  |
|  +----------------------------------+  |
+----------------------------------------+
```

- Same "Add to plan" CTA as `/app/chef`. Cookbook is a re-entry point into planning.

---

## `/app/account` — User & Household Settings

```
+----------------------------------------+
|  Account                               |
|                                        |
|        +-------+                       |
|        |  PA   |     paal              |
|        +-------+     paal@example.com  |
|                                        |
|  ----  Husholdning  -----------------  |
|                                        |
|  Kollektivet                           |
|                                        |
|  Members                               |
|  - Paal Aleks      (eier)              |
|  - Maren           (medlem)            |
|  - Jonas           (medlem)            |
|                                        |
|  Invite code (owner only)              |
|  +----------------------------------+  |
|  |  K 7 M 2 P 9                     |  |
|  |  Expires in 5 days, 4 hours      |  |
|  |                                  |  |
|  |  Revoke   |   Generate new       |  |
|  +----------------------------------+  |
|                                        |
|  +----------------------------------+  |
|  |   Leave household           (red)|  |
|  +----------------------------------+  |
|                                        |
|  ----  Innstillinger  ---------------  |
|                                        |
|  Language       [ Norsk  | English ]   |
|  Theme          [ System | Light  | Dark ] |
|                                        |
|  ----  -----------------------------   |
|                                        |
|  +----------------------------------+  |
|  |        Log out             (red) |  |
|  +----------------------------------+  |
|                                        |
|  +----------------------------------+  |
|  |  Chef  Plan  Shop  Book  [PA]*   |  |
|  +----------------------------------+  |
+----------------------------------------+
```

- Non-owners see members + their role + Leave household, but not invite code controls.
- Generating a new invite code revokes the previous one (confirmation toast).
- Leave household routes back to `/onboarding`.
- Log out clears the JWT, clears the React Query cache, redirects to `/`.

---

## Key Flows (text)

### First-time user joins existing household

```
/register
  -> /onboarding (no household)
       -> tap "Join with invite code"
            -> enter K7M2P9
                 -> /app/chef
```

### First weekly planning session

```
/app/chef
  -> tap "Spaghetti bolognese"
       -> recipe detail sheet
            -> "Add to plan"
                 -> add-to-plan sheet (Wed, Middag, 4 portions)
                      -> toast "Added to plan"
                           -> back on /app/chef
                                -> repeat for other meals

/app/planned
  -> review week
       -> "Generate shopping list"
            -> suggestions sheet
                 -> confirm 5 of 6 suggestions

/app/shopping
  -> swipe each row as it goes in the cart
       -> "Purchase complete"
            -> confirmation
                 -> 2 planned meals graduate to cookbook
                      -> /app/shopping is empty for next trip
```

### Rating after cooking

```
/app/cookbook
  -> tap "Linsekarri"
       -> rate 4 stars
            -> sort updates next time the cookbook query refetches
```

### Session expiry

```
Any /app/* page
  -> backend returns 401
       -> apiFetch clears JWT + cache
            -> redirect to /login
                 -> toast "Session expired, please log in again"
```

---

## Empty / Error States Quick Reference

| Screen          | Empty                                                | On error                          |
|-----------------|------------------------------------------------------|-----------------------------------|
| `/app/chef`     | "No recipes match X. Clear filters."                 | Inline retry                      |
| `/app/planned`  | "Nothing planned for this week. Browse recipes ->"  | Inline retry                      |
| `/app/shopping` | "Your shopping list is empty. Plan meals to start."  | Toast + retry                     |
| `/app/cookbook` | "No history yet. Complete a shopping trip first."    | Inline retry                      |
| `/app/account`  | n/a                                                  | Toast on settings save failure    |
| Recipe detail   | "Recipe not found."                                  | Toast + close sheet               |
| Onboarding code | "Invalid or expired code."                           | Inline error inside the join card |

---

## What's deliberately NOT in v1

- Recipe creation, image uploads, recipe authoring UI.
- Pantry/`Varelager` UI and "you have X on hand" hints.
- Hidden recipes management ("show hidden" toggle).
- Avatar uploads (initials only).
- Push or in-app notifications.
- Household switching (one household per user in v1).
- Cuisine filter dimension (meal type only).
- Password change.
- Per-household rating averages.
