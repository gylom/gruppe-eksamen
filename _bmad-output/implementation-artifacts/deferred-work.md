# Deferred Work

## Deferred from: code review of story 2-1-recipe-discovery-and-detail-sheets (2026-04-30)

- **`kategoriId=0`/unknown ids return empty list silently** — `backend/Controllers/OppskrifterController.cs` GetAll. No validation against existing categories; indistinguishable from "no recipes match".
- **`sok` LIKE wildcards (`%`, `_`) not escaped** — `backend/Controllers/OppskrifterController.cs` GetAll. User-typed wildcards match unintended results; pre-existing pattern.
- **No max length on `sok`** — `backend/Controllers/OppskrifterController.cs` GetAll. Long paste runs `LIKE '%…%'` over arbitrary strings; latency/DOS risk.
- **`Recommended` returns 400 when household missing** — inconsistent with `GetAll`/`GetOne` which degrade gracefully for users without a household. UX gap during onboarding.
- **Hardcoded `EXCLUDED_FILTER_CATEGORY_IDS = {4,5,6}`** — `frontend/app/routes/app/chef.tsx`. Brittle if seed ids shift across environments; prefer name-based filter or backend flag.
- **Detail title shows previous recipe's `navn` during refetch** — `frontend/app/routes/app/chef.tsx`/`detail-sheet.tsx`. Brief stale label when clicking another card while sheet is still mounted.
- **`returnFocusRef` may point to unmounted card** — `frontend/app/routes/app/chef.tsx`. If filters change while sheet is open and the originating card is filtered out, focus falls back to `<body>`.
- **`hasActiveFilters` flicker after `clearFilters()`** — `frontend/app/routes/app/chef.tsx`. Debounced search lag (~300 ms) keeps "Nullstill" CTA visible after clear.
- **`useDebouncedValue` first render returns initial value uncondounced** — `frontend/app/features/recipes/use-recipes.ts`. Cosmetic; first keystroke skips debounce.
- **No `AbortSignal` plumbed into `queryFn`** — `frontend/app/features/recipes/use-recipes.ts`. In-flight requests not cancelled on filter change/unmount; minor optimisation.

## Deferred from: code review of story 1-4-household-onboarding-invites-and-member-context (2026-04-30)

- **`minRolle` returned as raw DB value without case normalization** — `backend/Controllers/HusholdningController.cs:91`. UI assumes lowercase `"eier"|"medlem"`; defensively normalize on the server.
- **No verify-household-exists in `/join`** — `backend/Controllers/HusholdningController.cs:100-141`. FK cascade currently makes phantom-household state impossible; revisit if soft-delete is introduced.
- **`GenerateInvitasjon` doesn't return the new code in the response** — `backend/Controllers/HusholdningController.cs:188`. Owner UI must wait for the `["household"]` invalidation round-trip; eliminates one fetch if endpoint returns the new code directly.
- **Frontend/backend disagree on whitespace stripping (NBSP, tab, zero-width)** — `backend/Controllers/HusholdningController.cs:253-257` only strips space/dash; frontend drops anything outside the alphabet. Align both to the same set.
- **Caret jumps to end on mid-string edit in invite input** — `frontend/app/routes/onboarding.tsx`. Controller field is replaced on each keystroke; user cannot edit mid-string. Minor UX.
- **`enabled: getToken()` is non-reactive and SSR-fragile** — `frontend/app/features/household/use-household.ts:15`. App is currently SPA-only, but future SSR or token rotation will hit hydration-mismatch bugs.
- **Nullable navigation `CreatedByBruker?` on non-nullable FK; user-delete blocked by RESTRICT** — `backend/Models/HusholdningInvitasjon.cs`, `AppDbContext.cs:84-86`. Account deletion isn't a v1 flow; revisit when it becomes one.
- **`schema.sql` and `v1_4_household_invites.sql` define the same table with different constraint syntax** — pre-existing repo convention; consider consolidating both into a single source of truth long-term.
- **Onboarding error UI parses backend message strings** — `frontend/app/routes/onboarding.tsx:80-87`. Switch to structured error codes when localization arrives (Story 6.1).
- **Account `isOwner` check is case-sensitive vs server's case-insensitive comparison** — `frontend/app/routes/app/account.tsx:18`. Current DB seed always stores lowercase `eier`, so this is latent.
- **Expiry boundary `<=` vs `>` mismatch by milliseconds** — `backend/Controllers/HusholdningController.cs:51, 170`. Both sides treat `now == ExpiresAt` as expired; cosmetic.
- **Clipboard fallback for non-secure contexts** — `frontend/app/routes/app/account.tsx:821-828`. App ships over HTTPS in production; localhost over HTTP shows a generic toast.
- **Confirm dialog can close mid-mutation via Esc / click-outside** — `frontend/app/routes/app/account.tsx:955`. Mutation still completes; consider blocking close while pending.
- **Composite index `(husholdning_id, revoked_at, used_at, expires_at)` adds little over the unique `kode` index** — `database/v1_4_household_invites.sql:13`. Correct but mostly redundant; review during DB tuning pass.
- **Four distinct refusal messages let attackers enumerate code lifecycle state** — `backend/Controllers/HusholdningController.cs:151-174`. Information leak; partly mitigated once rate-limit lands.
- **Generate-invite returns `BadRequest` for users without membership** — should be 401/403; rolled into the join-endpoint status-code patch but not applied to generate-invite in this round.

## Deferred from: code review of story 1-3-authenticated-app-shell-and-route-gating (2026-04-30)

- **Multi-tab logout / `getToken()` is non-reactive** — `frontend/app/routes/app/layout.tsx:10`, `frontend/app/routes/onboarding.tsx:12`. Another tab clearing `localStorage` does not re-render the current tab; stale auth UI persists until next interaction triggers a refetch + 401. Out of v1 AC scope. Future hardening: `storage` event listener or a reactive token signal hook.
- **`useLogout` does not invalidate the `["me"]` query cache** — `frontend/app/features/auth/use-logout.ts`. Lives outside the Story 1.3 diff. After logout-then-login as a different user in the same tab, the layout consumes the previous user's cached household state on first render. Add `queryClient.clear()` (or `invalidateQueries(["me"])`) inside `useLogout`.
- **`home.tsx` redirect chain `/ → /app → /onboarding` for tokened-but-householdless users** — `frontend/app/routes/home.tsx:8-13`. Three hops with `replace` produce a brief AppShell skeleton flash before landing on `/onboarding`. Low-impact UX; acceptable for v1.
- **`logout` passed directly as `onClick` forwards the MouseEvent** — `frontend/app/routes/onboarding.tsx:65`. Depends on `useLogout()` return contract, not in this diff. Wrap as `onClick={() => logout()}` when the hook contract is reviewed.
- **AppShell main padding-bottom + `reserveNav` placeholder double-reserves vertical space** — `frontend/app/components/AppShell.tsx:14-23`. Both candidate fixes break things: conditional `pb` on `reserveNav` causes a 4rem layout jump between loading and ready (violates AC4); unconditional removal deviates from the spec's literal `pb` rule (architecture line 215). Revisit only if T7 360px smoke shows excessive bottom dead space.
