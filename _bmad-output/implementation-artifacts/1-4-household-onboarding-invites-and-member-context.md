# Story 1.4: Household Onboarding, Invites, and Member Context

Status: done

<!-- Completion note: Ultimate context engine analysis completed - comprehensive developer guide created. -->

## Story

As an authenticated household user,
I want to create or join a household and manage invite/member context where allowed,
so that shared access is simple but still controlled.

**Requirements traced:** FR6, FR7, FR8, FR9, FR10, FR11, FR12, FR50; NFR6, NFR7, NFR9, NFR10, NFR16, NFR18; UX-DR5, UX-DR6, UX-DR7, UX-DR8, UX-DR35, UX-DR36.

## Acceptance Criteria

**AC1 - Onboarding shows create and join paths without app navigation**

- **Given** a user has no household
- **When** they reach `/onboarding`
- **Then** they see one focused screen with create-household and join-household paths
- **And** bottom navigation remains hidden until setup is complete.

**AC2 - Create or join establishes membership and refetches current user state**

- **Given** the user submits a valid household name or invite code
- **When** the backend accepts the create or join request
- **Then** the user receives the correct household membership
- **And** the frontend refetches `/api/auth/me` before entering `/app/*`.

**AC3 - Invite-code input normalizes safely and reports invalid states inline**

- **Given** the user enters an invite code
- **When** they type or paste it
- **Then** the input auto-uppercase normalizes the code and rejects ambiguous characters
- **And** invalid-code feedback is displayed inline.

**AC4 - Owners can generate, revoke, and replace invite codes**

- **Given** a household owner manages invites
- **When** they generate, revoke, or replace an invite code
- **Then** invite codes are time-limited, single-use, and revocable
- **And** non-owner members cannot access owner-only invite controls.

**AC5 - Household context shows member data and remains server-authorized**

- **Given** a member opens household context
- **When** account or household data renders
- **Then** household name and member list are visible
- **And** all household-scoped endpoints authorize through server-side membership.

## Tasks / Subtasks

- [x] **T1: Add persistent invite-code support** (AC: 3, 4)
  - [x] Create `backend/Models/HusholdningInvitasjon.cs` mapped to table `HusholdningInvitasjon`.
  - [x] Add `DbSet<HusholdningInvitasjon>` and EF relationships in [backend/Data/AppDbContext.cs](../../backend/Data/AppDbContext.cs).
  - [x] Add SQL for the table in a new migration file, for example `database/v1_4_household_invites.sql`. Also update [database/schema.sql](../../database/schema.sql) if the repo still uses it as the clean-database baseline.
  - [x] Table shape must support: `husholdning_id`, `kode`, `created_by_user_id`, nullable `used_by_user_id`, `created_at`, `expires_at`, nullable `revoked_at`, nullable `used_at`.
  - [x] Add indexes for `kode`, `husholdning_id`, and active invite lookup. `kode` must be unique.
  - [x] Do not use EF migrations. This project uses SQL files for schema evolution.

- [x] **T2: Extend `HusholdningController` with invite endpoints** (AC: 2, 3, 4, 5)
  - [x] Update [backend/Controllers/HusholdningController.cs](../../backend/Controllers/HusholdningController.cs); do not create a second household controller.
  - [x] Preserve current endpoints and response behavior, especially `GET /api/husholdning`, `POST /api/husholdning`, `GET /api/husholdning/medlemmer`, and the existing `plasseringer` payload.
  - [x] Add owner-only `POST /api/husholdning/invitasjon` to generate or replace the active invite. Existing active invites for the household must be revoked before creating the new one.
  - [x] Add owner-only `DELETE /api/husholdning/invitasjon` to revoke the current active invite.
  - [x] Add `POST /api/husholdning/join` with body `{ code: string }` for authenticated users without household membership.
  - [x] All endpoints must resolve the current user's membership from `Medlemmer`. Never authorize by trusting a JWT `householdId` claim.
  - [x] Return user-facing errors as `{ message: string }`; use 409 for business-rule conflicts such as "already member" or attempting to join a used/revoked/expired code.

- [x] **T3: Implement invite-code generation, normalization, and consumption rules** (AC: 3, 4)
  - [x] Generate 6-character codes using a non-ambiguous uppercase alphabet. Recommended alphabet: `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (excludes I, L, O, 0, and 1).
  - [x] Normalize input server-side by trimming, removing spaces and hyphens, and uppercasing before validation.
  - [x] Reject any code that is not exactly 6 characters after normalization or contains characters outside the allowed alphabet.
  - [x] Time-limit invites. Use `expires_at = DateTime.UtcNow.AddDays(7)` unless the team already has a config value.
  - [x] Single-use means successful join sets both `used_at` and `used_by_user_id` in the same transaction that inserts the `Medlem` row.
  - [x] Revoked, expired, or used codes must never create membership.
  - [x] If generated code collides with an existing `kode`, retry a bounded number of times and return `{ message }` if generation somehow fails.

- [x] **T4: Keep/create-household behavior scoped and idempotency-safe** (AC: 1, 2, 5)
  - [x] Reuse `POST /api/husholdning` for create-household from onboarding; do not revive `RegisterRequest.HouseholdName`.
  - [x] Keep create-household transactional: create `Husholdning`, then add current user as `Medlem` with role `eier`.
  - [x] If the user already belongs to a household, return a conflict-style `{ message }` and do not create another household.
  - [x] Ensure create/join paths leave `/api/auth/me` returning `householdId`, `householdName`, and `householdRole` based on `Medlemmer`.

- [x] **T5: Build the frontend household API feature layer** (AC: 2, 4, 5)
  - [x] Create `frontend/app/features/household/types.ts` for household, member, and invite DTOs.
  - [x] Create query/mutation hooks under `frontend/app/features/household/` using the existing [frontend/app/lib/api-fetch.ts](../../frontend/app/lib/api-fetch.ts).
  - [x] Suggested hooks: `useHousehold()`, `useCreateHousehold()`, `useJoinHousehold()`, `useGenerateInvite()`, `useRevokeInvite()`.
  - [x] Query keys should stay targeted: `["household"]` for household context and `["me"]` for current-user identity.
  - [x] On create-household and join success, await `queryClient.invalidateQueries({ queryKey: ["me"] })` and navigate to `/app` only after the current user query has been refreshed/refetched.
  - [x] On invite generate/revoke, invalidate only `["household"]` unless `["me"]` is genuinely affected.

- [x] **T6: Replace the `/onboarding` stub with the real create/join screen** (AC: 1, 2, 3)
  - [x] Update [frontend/app/routes/onboarding.tsx](../../frontend/app/routes/onboarding.tsx). Keep its existing auth and already-has-household redirects.
  - [x] Render one focused mobile-first screen with two paths: create household by name and join household by invite code.
  - [x] Keep bottom navigation hidden. `/onboarding` must remain outside the `/app` layout.
  - [x] Use `react-hook-form` and `zod` for both forms; do not hand-roll form state.
  - [x] Keep validation inline. Household name should reject empty/whitespace input. Invite code should normalize while typing/pasting and show invalid-code feedback inline.
  - [x] On successful create/join, show concise success feedback, refetch `["me"]`, then navigate to `/app`.
  - [x] Keep a logout escape on onboarding for users who registered/logged in with the wrong account.
  - [x] Use the frontend-design skill for the UI styling pass. Keep the screen compact, calm, and mobile-first; no landing-page hero.

- [x] **T7: Replace the Account placeholder with household context and owner invite controls** (AC: 4, 5)
  - [x] Update [frontend/app/routes/app/account.tsx](../../frontend/app/routes/app/account.tsx) to show household name and member list.
  - [x] Non-owner members can see household context and members, but must not see generate/revoke/replace controls.
  - [x] Owners can see the active invite if one exists, copy it, generate/replace it, and revoke it.
  - [x] Invite code display must be readable and copyable. Group visually if helpful, but preserve the underlying code string.
  - [x] Revocation should use a confirmation surface. If a shadcn dialog/sheet primitive is needed, install it through the shadcn CLI only.
  - [x] Do not implement language/theme settings here; Story 6.1 owns preferences.

- [x] **T8: Verification** (AC: 1-5)
  - [x] `npm run typecheck --prefix frontend`
  - [x] `dotnet build backend/backend.csproj --no-restore`
  - [x] `npm run build`
  - [ ] Manual smoke: registered user without household reaches `/onboarding` and sees no bottom nav.
  - [ ] Manual smoke: create-household path creates owner membership, refetches `/api/auth/me`, and enters `/app/chef`.
  - [ ] Manual smoke: owner generates an invite; another user joins with it; the same code cannot be reused.
  - [ ] Manual smoke: owner revoke/replace makes the old code invalid.
  - [ ] Manual smoke: non-owner account screen shows household/member context but no invite-management controls.
  - [ ] Manual smoke at 360px and keyboard-only through onboarding forms, account member list, copy/generate/revoke controls.

## Dev Notes

### What this story is and is not

This story completes Epic 1's household entry surface: onboarding create/join, invite generation/revocation/replacement, and basic household/member context.

It is not:

- Recipe browsing or planning (Epic 2).
- Shopping suggestion generation or list management (Epics 3-4).
- Full Account preferences, theme/language switching, or final logout placement (Story 6.1).
- Multi-household switching, pantry behavior, password recovery, or refresh-token auth.
- A rewrite of the existing household controller. Extend the current brownfield code.

### Existing state to preserve

Current backend household behavior already exists in [backend/Controllers/HusholdningController.cs](../../backend/Controllers/HusholdningController.cs):

- `GET /api/husholdning` resolves current membership from `Medlemmer`, returns `household`, `medlemmer`, and `plasseringer`.
- `POST /api/husholdning` creates a household and inserts the current user as `eier`.
- `GET /api/husholdning/medlemmer` lists members in the current household.
- Older owner-managed member add/remove/leave endpoints exist. Do not delete them unless the story explicitly needs a targeted change.

The frontend currently has:

- `frontend/app/routes/onboarding.tsx` as a guarded stub with logout.
- `frontend/app/routes/app/account.tsx` as a placeholder.
- `useMe()` at `frontend/app/features/auth/use-me.ts` with query key `["me"]`.
- `apiFetch()` as the only frontend HTTP boundary.
- App gating in `frontend/app/routes/app/layout.tsx`: authenticated users with `householdId === null` go to `/onboarding`; users with a household enter `/app/*`.

### Backend API contract

Use these endpoint shapes unless implementation discovers a hard conflict:

| Method | Path | Purpose | Auth/role |
| --- | --- | --- | --- |
| `GET` | `/api/husholdning` | Household, members, placements, and owner-only active invite context | member |
| `POST` | `/api/husholdning` | Create household for current user | authenticated without household |
| `POST` | `/api/husholdning/join` | Join household by invite code | authenticated without household |
| `POST` | `/api/husholdning/invitasjon` | Generate or replace active invite | owner |
| `DELETE` | `/api/husholdning/invitasjon` | Revoke active invite | owner |

Recommended response additions for `GET /api/husholdning`:

```ts
{
  household: { id: number; navn: string; minRolle: "eier" | "medlem" } | null
  medlemmer: Array<{ userId: number; brukernavn: string; email: string; rolle: "eier" | "medlem"; erMeg: boolean }>
  plasseringer: Array<{ id: number; plassering: string }>
  activeInvite?: { code: string; expiresAt: string } | null
}
```

Only owners should receive `activeInvite`. Non-owners should receive `null` or no field; they must not see invite controls or code data.

### Database guardrails

`HusholdningInvitasjon` is the only new persistent concept for this story. Suggested C# properties:

- `Id: ulong`
- `HusholdningId: ulong`
- `Kode: string`
- `CreatedByUserId: ulong`
- `UsedByUserId: ulong?`
- `CreatedAt: DateTime`
- `ExpiresAt: DateTime`
- `RevokedAt: DateTime?`
- `UsedAt: DateTime?`
- navigation properties for `Husholdning`, creator user, and optional used-by user if useful.

Use UTC timestamps. Do not add a generic invitations service or multi-household abstraction; one table and controller-local helper methods are enough for v1.

### Security and tenancy rules

- Every invite endpoint is `[Authorize]` through the controller.
- Owner checks come from `Medlemmer.Rolle == "eier"` for the current user's membership.
- Join must refuse users already present in `Medlemmer`.
- Join must consume the invite and insert membership in one DB transaction.
- Invite lookup should never cross household boundaries through client-provided household IDs; the code identifies the invite, then the server inserts membership for that invite's household.
- Do not expose active invite codes to non-owners.
- Do not trust JWT `householdId` for authorization. Story 1.2 intentionally made JWT household data a UI hint only.

### Frontend implementation guardrails

- New frontend code belongs in `frontend/app/features/household/`, plus route updates in `routes/onboarding.tsx` and `routes/app/account.tsx`.
- Use `apiFetch` for every `/api/*` call.
- Use TanStack Query for server state. Do not use `useEffect + fetch`.
- Use `react-hook-form` and `zod` for onboarding forms.
- Use installed shadcn primitives (`Button`, `Input`, `Label`) where enough. Install additional primitives only through the shadcn CLI.
- Do not add i18n infrastructure now; Story 6.1 owns localization. Current Norwegian copy is acceptable for this story.
- Keep create/join forms on one screen and show recoverable failures inline.

### Invite-code UX requirements

- Normalize while typing/pasting: uppercase, remove spaces and hyphens.
- Reject ambiguous characters visibly before submit when possible.
- Keep the code readable and copyable. A visual grouping such as `ABC 234` is fine if the copied value remains the actual six-character code.
- Invalid, expired, revoked, used, and already-member states must be recoverable inline errors, not only toasts.
- Successful generate/revoke/create/join may use toast feedback.

### Previous story intelligence

Story 1.3 is currently `review`, not `done`, and it left live browser/DB gating smoke checks pending. Its implementation nevertheless establishes the routes this story replaces/extends:

- `/onboarding` is outside `/app/*`, so bottom nav remains hidden there.
- `/app/account` exists only as a placeholder and is safe for this story to replace with household context.
- `/app/layout.tsx` redirects `householdId === null` users to onboarding, so this story must refetch `["me"]` after membership changes before navigating into `/app`.
- Hard refresh fallback and SPA mode were already handled by Story 1.1/1.3; do not revisit routing architecture in this story.

Story 1.2 contracts still apply:

- `useMe()` returns `householdId`, `householdName`, and `householdRole`; use `householdId === null` for no-household checks.
- `apiFetch` clears auth on 401 and redirects to `/login`.
- `RegisterForm` intentionally omits `householdName`; household creation happens only on onboarding.

### Git intelligence

Recent commit `e531076 Add React Router 7 frontend rebuild and supporting setup` contains the React Router app, auth foundation, app shell, onboarding/account placeholders, and generated build assets. Older commits mostly touch deprecated `client-react` or recipe/product controllers. For Story 1.4, ignore `client-react/` and build only in `frontend/`.

Current worktree note: `backend/wwwroot/` is untracked/generated. Do not treat it as source for this story unless running `npm run build` refreshes it.

### Latest technical information

Context7 lookup for TanStack Query resolved `/tanstack/query` (High source reputation, v5 available). Current React Query v5 docs show mutation `onSuccess` handlers invalidating targeted query keys through `queryClient.invalidateQueries({ queryKey: [...] })`; invalidating one key can match queries with that key prefix. Use this for `["me"]` and `["household"]` rather than clearing the whole cache.

### Testing standards summary

There is no established automated test project for these flows. Do not invent a broad test stack in this story. At minimum, verify with frontend typecheck, backend build, root build, and manual browser/DB smoke for create, join, single-use, revoke/replace, owner-only controls, 360px layout, and keyboard access.

If a lightweight backend test harness already exists by implementation time, prioritize tests for invite code consumption being single-use and revoked/expired codes refusing membership.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.4]
- [Source: _bmad-output/planning-artifacts/epics.md#Additional-Requirements]
- [Source: _bmad-output/planning-artifacts/prd.md#Household-Access-&-Membership]
- [Source: _bmad-output/planning-artifacts/prd.md#Security-&-Privacy]
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication-&-Security]
- [Source: _bmad-output/planning-artifacts/architecture.md#API-&-Communication-Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Database-Naming-Conventions]
- [Source: _bmad-output/planning-artifacts/architecture.md#Requirements-to-Structure-Mapping]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Household-Onboarding-Flow]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Form-Patterns]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Account-Setting-Group]
- [Source: _bmad-output/implementation-artifacts/1-2-auth-session-api-registration-login-logout-and-recovery.md]
- [Source: _bmad-output/implementation-artifacts/1-3-authenticated-app-shell-and-route-gating.md]
- [Source: backend/Controllers/HusholdningController.cs]
- [Source: backend/Controllers/AuthController.cs]
- [Source: backend/Data/AppDbContext.cs]
- [Source: frontend/app/routes/onboarding.tsx]
- [Source: frontend/app/routes/app/account.tsx]
- [Source: frontend/app/routes/app/layout.tsx]
- [Source: frontend/app/features/auth/use-me.ts]
- [Source: frontend/app/lib/api-fetch.ts]
- [Source: Context7 /tanstack/query React invalidations-from-mutations docs]

### Review Findings

_Code review completed 2026-04-30. Three parallel reviewers: Blind Hunter (diff-only adversarial), Edge Case Hunter (branch/boundary walk), Acceptance Auditor (spec compliance)._

#### Decision Needed

- [x] [Review][Decision] **Out-of-scope edits to `home.tsx` and `BottomNav.tsx`** — Resolved 2026-04-30: kept as intentional polish; added to File List and Change Log.

#### Patches (apply during this review)

- [x] [Review][Patch] **HIGH — Race: duplicate `Medlem` rows possible from concurrent `/join`** [backend/Controllers/HusholdningController.cs:143-146; backend/Data/AppDbContext.cs] — "User already has membership" check runs OUTSIDE the serializable transaction, and there is no UNIQUE constraint on `Medlemmer.UserId`. Two concurrent `POST /join` from one user can both pass the check, both insert membership rows. **Fix:** add `HasIndex(m => m.UserId).IsUnique()` (or composite unique) and move the membership pre-check inside the serializable transaction; catch `DbUpdateException` and translate to 409.
- [x] [Review][Patch] **HIGH — Race: two simultaneous active invites possible from concurrent `POST /invitasjon`** [backend/Controllers/HusholdningController.cs:204-217] — `revoke prior` + `insert new` runs at default isolation. Two concurrent owner POSTs both see zero actives and both insert. **Fix:** wrap the entire generate flow (including the `actives` SELECT) in a serializable transaction or explicit `SELECT ... FOR UPDATE`.
- [x] [Review][Patch] **HIGH — Generate/Revoke mutations show no error UI** [frontend/app/routes/app/account.tsx:927-948, 967-980; frontend/app/features/household/use-household.ts:38-62] — `void mutateAsync().then(success)` swallows rejections. 403/500/network failures produce no toast and the revoke dialog stays open with no message. **Fix:** add `onError` handlers (or wrap in try/catch) showing an error toast and (for revoke) inline error in dialog.
- [x] [Review][Patch] **HIGH — No rate limit on `POST /api/husholdning/join`** [backend/Controllers/HusholdningController.cs:86-142] — 6-char codes from a 31-char alphabet (~887M space, ~30 bits) are enumerable via brute force, especially since `(husholdning_id, revoked_at, used_at, expires_at)` makes lookups cheap. **Fix:** add ASP.NET Core rate limiter on the join endpoint (e.g., 10 req/min per user/IP).
- [x] [Review][Patch] **MEDIUM — Invite RNG mod-bias** [backend/Controllers/HusholdningController.cs:233-240] — `bytes[i] % 31` over uniform 0–255 bytes is biased (256 mod 31 = 8, so 8 letters are ~3% more frequent). **Fix:** rejection sampling — discard byte values ≥ `(256 / 31) * 31 = 248` and redraw.
- [x] [Review][Patch] **MEDIUM — `Forbid()` returns 401-or-403 with no `{ message }` body** [backend/Controllers/HusholdningController.cs:154, 206] — Violates project-wide error contract ("Return user-facing errors as `{ message: string }`") and yields empty toast text on the client. **Fix:** replace `Forbid()` with `StatusCode(403, new { message = "..." })`.
- [x] [Review][Patch] **MEDIUM — `/join` returns 409 for malformed/empty/missing codes** [backend/Controllers/HusholdningController.cs:92-93, 103-107] — Spec reserves 409 for business-rule conflicts. Format failures should be 400; non-existent code is best as 404. **Fix:** return 400 from `TryNormalizeInviteCode` failures, 404 when `invite == null`, keep 409 only for used/revoked/expired/already-member.
- [x] [Review][Patch] **MEDIUM — Owner check uses `FirstOrDefault` without filtering by household/role** [backend/Controllers/HusholdningController.cs:150, 198, 202] — Code assumes one membership per user but doesn't enforce or scope. Combined with the missing UNIQUE constraint above, can pick a non-deterministic membership. **Fix:** addressed by the unique-constraint fix above; also ensure controller uses `.Single` or scopes the query explicitly.
- [x] [Review][Patch] **MEDIUM — Serialization-failure exception leaks 500** [backend/Controllers/HusholdningController.cs:148-189] — When two users redeem the same code concurrently and InnoDB raises a serialization conflict, the `DbUpdateException` is uncaught and produces a 500. **Fix:** wrap in try/catch and translate to 409 `{ message = "Invitasjonskoden er allerede brukt" }`.
- [x] [Review][Patch] **MEDIUM — Frontend silently truncates pasted invite codes longer than 6 chars** [frontend/app/features/household/invite-input.ts:13-14] — `if (out.length >= 6) break;` drops extra valid characters. Pasting `ABCDEFG` accepts `ABCDEF`. **Fix:** keep all valid chars and let zod's `length(6)` reject; or surface "exactly 6 characters" inline when input length differs.
- [x] [Review][Patch] **MEDIUM — `refetchQueries` rejection blocks navigation** [frontend/app/routes/onboarding.tsx:67-72] — If `/api/auth/me` returns 5xx after a successful create/join, the unhandled rejection prevents `navigate("/app")`. User sees no feedback. **Fix:** wrap `refetchQueries` in try/catch (or use `Promise.allSettled`); navigate regardless and rely on layout gating.
- [x] [Review][Patch] **MEDIUM — `Husholdning.Navn` has no length cap** [backend/Controllers/HusholdningController.cs:104, 114] — Only `IsNullOrWhiteSpace` check. **Fix:** enforce max length (e.g., 80 chars) on the create endpoint and add a matching DB column constraint.
- [x] [Review][Patch] **MEDIUM — Generate and Revoke buttons clickable simultaneously** [frontend/app/routes/app/account.tsx:923-936, 955-980] — `disabled` only checks each mutation's own `isPending`. Clicking generate then revoke within ~100ms produces a "no active invite" 404 mid-generation. **Fix:** disable both controls when either mutation is pending.
- [x] [Review][Patch] **MEDIUM — Onboarding/Layout redirect race after invalidate** [frontend/app/routes/app/layout.tsx:13; frontend/app/features/household/use-household.ts:13-17] — During `["me"]` refetch, `me.data` can be transiently `null` or stale, causing flicker between `/onboarding` and `/app`. **Fix:** also gate on `me.isFetching === false` (or use a `status === 'success'` check) before computing `hasNoHousehold`.
- [x] [Review][Patch] **MEDIUM — `activeInvite` stays in cache after server-side expiry** [frontend/app/routes/app/account.tsx:819, 900] — Open Account page across the 7-day expiry boundary still shows the stale code; copying it leads to "utløpt" for joiners. **Fix:** add `refetchInterval` on `useHousehold` (e.g., 60s) when `activeInvite` is present, or compute remaining-time on the client and refresh near expiry.
- [x] [Review][Patch] **MEDIUM — Account renders owner-only controls when role flips server-side** [frontend/app/routes/app/account.tsx:817-819] — Stale `me` (still `eier`) + fresh `household` (no `activeInvite`) lets a demoted user click generate → server returns 403, no inline message. **Fix:** combined with the `Forbid()` `{ message }` fix above and the `onError` toast fix; also consider hiding owner block when `activeInvite === undefined` and `me.householdRole === "eier"` while `household.isFetching`.
- [x] [Review][Patch] **MEDIUM — `useCreateHousehold` / `useJoinHousehold` lack `onSuccess` invalidations** [frontend/app/features/household/use-household.ts:21-44] — Spec says "On create-household and join success, await `invalidateQueries({ queryKey: ["me"] })`." Currently the route calls invalidate manually; hook-level invalidation is more reusable and matches `useGenerateInvite`/`useRevokeInvite`. **Fix:** add `onSuccess: () => queryClient.invalidateQueries({ queryKey: ["me"] })` (and optionally `["household"]`) to both hooks; keep the route's awaited refetch for ordering.

#### Deferred (low-severity, pre-existing, or polish)

- [x] [Review][Defer] **`minRolle` returned as raw DB value without case normalization** [backend/Controllers/HusholdningController.cs:91] — deferred, low-priority data hygiene
- [x] [Review][Defer] **No verify-household-exists in `/join`** [backend/Controllers/HusholdningController.cs:100-141] — deferred, FK cascade currently makes this safe
- [x] [Review][Defer] **`GenerateInvitasjon` doesn't return the new code** [backend/Controllers/HusholdningController.cs:188] — deferred, UX nit (works after refetch)
- [x] [Review][Defer] **Frontend/backend disagree on whitespace stripping (NBSP, tab, zero-width)** [backend/Controllers/HusholdningController.cs:253-257; frontend/app/features/household/invite-input.ts] — deferred, rare paste sources
- [x] [Review][Defer] **Caret jumps to end on mid-string edit** [frontend/app/routes/onboarding.tsx onChange paths] — deferred, minor UX
- [x] [Review][Defer] **`enabled: getToken()` is non-reactive and SSR-fragile** [frontend/app/features/household/use-household.ts:15] — deferred, app is SPA-only
- [x] [Review][Defer] **Nullable navigation `CreatedByBruker?` on non-nullable FK; user-delete blocked by RESTRICT** [backend/Models/HusholdningInvitasjon.cs; AppDbContext.cs:84-86] — deferred, account deletion not a v1 flow
- [x] [Review][Defer] **`schema.sql` and `v1_4_household_invites.sql` define the same table with different constraint syntax** [database/schema.sql; database/v1_4_household_invites.sql] — deferred, pre-existing repo convention
- [x] [Review][Defer] **Onboarding error UI parses backend message strings** [frontend/app/routes/onboarding.tsx:80-87] — deferred, switch to error codes when localization arrives (Story 6.1)
- [x] [Review][Defer] **Account `isOwner` check is case-sensitive vs server's case-insensitive comparison** [frontend/app/routes/app/account.tsx:18] — deferred, current DB seed always lowercases `eier`
- [x] [Review][Defer] **Expiry boundary `<=` vs `>` mismatch by milliseconds** [backend/Controllers/HusholdningController.cs:51, 170] — deferred, both sides treat `now == ExpiresAt` as expired
- [x] [Review][Defer] **Clipboard fallback for non-secure contexts** [frontend/app/routes/app/account.tsx:821-828] — deferred, app is HTTPS in production
- [x] [Review][Defer] **Confirm dialog can close mid-mutation via Esc/click-outside** [frontend/app/routes/app/account.tsx:955] — deferred, mutation still completes correctly
- [x] [Review][Defer] **Composite index `(husholdning_id, revoked_at, used_at, expires_at)` adds little over the unique `kode` index** [database/v1_4_household_invites.sql:13] — deferred, correct but mostly unused
- [x] [Review][Defer] **Four distinct refusal messages let attackers enumerate code lifecycle state** [backend/Controllers/HusholdningController.cs:151-174] — deferred, low risk; addressed when rate-limit lands
- [x] [Review][Defer] **Generate-invite `BadRequest` for users without membership** [backend/Controllers/HusholdningController.cs] — deferred, subsumed by status-code fix above



### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

- Applied SQL migration script `database/v1_4_household_invites.sql` locally or on deploy; updated `database/schema.sql` baseline.
- `POST /api/husholdning` returns **409 Conflict** when the user already has a membership (was 400).
- Automated: `npm run typecheck --prefix frontend`, `npm run build --prefix frontend`, backend `dotnet build` to alternate output folder (avoid file lock when `dotnet run` is active).

### File List

- `backend/Models/HusholdningInvitasjon.cs`
- `backend/Data/AppDbContext.cs`
- `backend/Controllers/HusholdningController.cs`
- `backend/DTOs/HouseholdDtos.cs` (`JoinHouseholdRequest`)
- `database/v1_4_household_invites.sql`
- `database/schema.sql`
- `frontend/app/features/household/types.ts`
- `frontend/app/features/household/invite-input.ts`
- `frontend/app/features/household/use-household.ts`
- `frontend/app/components/ui/dialog.tsx` (shadcn)
- `frontend/app/routes/onboarding.tsx`
- `frontend/app/routes/app/account.tsx`
- `frontend/app/routes/app/layout.tsx` (redirect-race guard)
- `frontend/app/routes/home.tsx` (hide marketing page for tokened users)
- `frontend/app/components/BottomNav.tsx` (focus style polish)
- `backend/Program.cs` (rate limiter for invite-join, code-review patch)
- `database/v1_4_household_invites.sql` (Medlemmer unique-on-user_id, Husholdning.navn length, code-review patch)
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Change Log

| Date | Description |
| --- | --- |
| 2026-04-30 | Story created, status: ready-for-dev. |
| 2026-04-30 | Implementation complete; status: review. Household invites API, onboarding UI, account context. |
| 2026-04-30 | Code review: 1 decision-needed resolved (out-of-scope edits kept), 17 patches and 16 deferrals recorded. |
| 2026-04-30 | All 17 patches applied; backend build + frontend typecheck/build verified clean. Status: done. |
