# Repo instructions

## Frontend-design skill

Always use frontend-design skill whenever implementing UI.

## Shadcn CLI

Always install shadcn components via CLI, e.g. **pnpm dlx shadcn@latest add [component]**

## Context 7

Always use Context7 when I need library/API documentation, code generation, setup or configuration steps without me having to explicitly ask.

## Git branching

**Only use `feature/frontend-rebuild` for ongoing work.** Do not create new branches (story branches, sub-feature branches, etc.) unless I explicitly ask. If you find yourself on a different branch with uncommitted changes, stop and ask before committing — never commit to or create a new branch on your own initiative.

## Language translations

All user-facing strings must be added to **both** `nb` and `en` translation objects in `frontend/app/lib/i18n.ts`. Never add a key to one language without adding it to the other.

## No markdown files context polution

Ignore everything in:

- `docs/_archive`
- `docs/_prompts`
- `docs/_notes`

---

# Behavioral guidelines

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## 5. Runtime Debugging Anti-Spiral

**Verify the runtime before changing code. One hypothesis at a time.**

When a local app suddenly returns 404/405/500, proxy errors, stale UI, or connection failures:

- First identify what is actually running: check listening ports, process IDs, start times, and command/workspace paths.
- Confirm the browser/dev server is using this repo, not an old checkout or sibling folder.
- Probe the failing endpoint directly and through the frontend proxy; compare status codes before editing code.
- Capture backend/frontend logs for the failing request before restarting repeatedly.
- Restart only the stale or duplicate process you can name. Do not kill broad process groups unless the user asks.
- After each restart, verify the expected route/port with a minimal request before trying the full UI again.
- If two attempts do not move the error closer to a concrete cause, stop and summarize known facts, unknowns, and the next diagnostic step.

The test: avoid "restart, retry, patch, retry" loops. A good debugging step should either confirm the active runtime, expose a concrete exception, or rule out one specific hypothesis.
