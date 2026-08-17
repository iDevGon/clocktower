# Edition Role Interactions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the three base editions’ role interactions and Storyteller controls agree with the official rules and server authority.

**Architecture:** Keep `GameManager` as the authoritative state machine, keep role metadata and night order in `@clocktower/shared`, and use typed Socket.io callbacks for Storyteller-only decisions. Each defect is covered by a failing unit or E2E test before the smallest production change.

**Tech Stack:** TypeScript, Vitest, Socket.io, React Native/Expo, Turborepo, Biome.

---

## Files and responsibilities

- Modify `packages/shared/src/roles.ts`: edition night-order data and role metadata only.
- Test `packages/shared/src/__tests__/roles.test.ts`: edition/order/action invariants.
- Modify `apps/server/src/game.ts`: authoritative role, death, vote, alignment, and win-condition state transitions.
- Test `apps/server/src/__tests__/game.test.ts`: deterministic state-machine regressions.
- Modify `apps/server/src/handlers/storyteller.ts`: Storyteller-only interaction events and phase integration.
- Modify `apps/server/src/handlers/player.ts`: player-triggered events that need new server results.
- Modify `packages/shared/src/events.ts`: only the typed event contracts required by the server/UI changes.
- Test `apps/server/src/__tests__/e2e/*.test.ts`: socket-level edition and Storyteller-control flows.
- Modify `apps/storyteller/app/game/grimoire.tsx`, `apps/storyteller/src/components/NightPanel.tsx`, `apps/storyteller/src/components/NightActionLog.tsx`, and `apps/storyteller/src/hooks/useGameActions.ts`: expose valid controls and apply local completion only after success.
- Test `apps/storyteller/src/components/__tests__/*.test.ts`: source-level wiring contracts for controls and edition selection.

### Task 1: Lock edition night-order invariants

**Files:**
- Modify: `packages/shared/src/__tests__/roles.test.ts`
- Modify: `packages/shared/src/roles.ts`

- [ ] **Step 1: Add a failing test for BMR first-night-only Traveller ordering.**

Assert that `BMR_FIRST_NIGHT_ORDER` contains `apprentice` and `BMR_OTHER_NIGHT_ORDER` does not contain it. Also assert the BMR order contains the official recurring roles in the current sequence.

- [ ] **Step 2: Run the focused shared test and confirm it fails because `apprentice` is in the later-night order.**

Run: `pnpm --filter @clocktower/shared test -- roles.test.ts`

- [ ] **Step 3: Remove `apprentice` from `BMR_OTHER_NIGHT_ORDER` without changing unrelated order entries.**

- [ ] **Step 4: Run the focused shared test and the complete shared test package.**

Run: `pnpm --filter @clocktower/shared test`

- [ ] **Step 5: Commit.**

```bash
git add packages/shared/src/roles.ts packages/shared/src/__tests__/roles.test.ts
git commit -m "fix: align BMR night order with first-night traveller rules"
```

### Task 2: Correct core win conditions and role-transition state

**Files:**
- Modify: `apps/server/src/__tests__/game.test.ts`
- Modify: `apps/server/src/game.ts`

- [ ] **Step 1: Add failing tests for Vortox first-day no-execution victory and poisoned Scarlet Woman non-promotion.**

Use the existing test helpers to start a game on day 2 after the first night, leave `executionToday` false, and assert `checkVortoxNoExecutionWin()` returns an evil result. Create a living Scarlet Woman with a poison status, remove the Demon, and assert no promotion occurs.

- [ ] **Step 2: Run only those tests and verify both fail against the current guards.**

Run: `pnpm --filter @clocktower/server test -- game.test.ts -t "Vortox first day|poisoned Scarlet Woman"`

- [ ] **Step 3: Implement the minimal condition changes.**

Remove the first-day exclusion from the Vortox transition path and use the existing `isPoisonedOrDrunk` helper for Scarlet Woman eligibility.

- [ ] **Step 4: Add failing tests for Barber swap and Pit Hag role change alignment.**

After a good/evil role swap, assert effective alignment follows the new role. After Pit Hag changes a townsfolk into a Demon, assert the new player is evil and the old role-specific once-per-game marker does not block the new role.

- [ ] **Step 5: Implement role-transition normalization.**

When a player receives a new character, derive the normal alignment from that character unless the role is a Traveller with explicit alignment. Clear old character-specific spent markers and retain only independent effects such as current poison/drunk markers.

- [ ] **Step 6: Run the focused and complete server unit tests.**

Run: `pnpm --filter @clocktower/server test -- game.test.ts`

Run: `pnpm --filter @clocktower/server test`

- [ ] **Step 7: Commit.**

```bash
git add apps/server/src/game.ts apps/server/src/__tests__/game.test.ts
git commit -m "fix: preserve alignment and victory rules across role changes"
```

### Task 3: Make BMR death resolution and Pit Hag demon creation explicit

**Files:**
- Modify: `packages/shared/src/events.ts`
- Modify: `apps/server/src/game.ts`
- Modify: `apps/server/src/handlers/storyteller.ts`
- Modify: `apps/storyteller/src/hooks/useGameActions.ts`
- Modify: `apps/storyteller/app/game/grimoire.tsx`
- Modify: `apps/storyteller/src/components/NightActionLog.tsx`
- Test: `apps/server/src/__tests__/game.test.ts`
- Test: `apps/server/src/__tests__/e2e/bmrAdjudication.test.ts`
- Test: `apps/storyteller/src/components/__tests__/nightActionLogSource.test.ts`

- [ ] **Step 1: Add failing unit tests for Demon attacks against Monk protection and for Pit Hag Demon creation requesting an unpredictable death.**

The first test should use an automatic BMR death resolver and assert a `protected` target survives. The second should change a target into a Demon and assert a pending Storyteller decision is returned rather than silently completing.

- [ ] **Step 2: Run the focused tests and verify the missing protection/pending-death behavior.**

Run: `pnpm --filter @clocktower/server test -- game.test.ts -t "Monk protection|Pit Hag Demon"`

- [ ] **Step 3: Implement method-aware protection checks and a single pending Pit Hag death state.**

The death method must distinguish Demon attacks from Assassin’s unconditional kill and from non-Demon deaths. The pending state must be cleared on resolution, reset with a new game, and reject duplicate or invalid Storyteller submissions.

- [ ] **Step 4: Add the typed Storyteller event/callback and server handler for resolving or skipping the Pit Hag death.**

Broadcast the pending state, apply the selected death through the same death-trigger pipeline, and emit the updated state only after a successful resolution.

- [ ] **Step 5: Add the Storyteller control and source test.**

The Pit Hag action log must expose a death decision after a successful role change; failed callbacks must leave the control open and successful callbacks must mark it processed.

- [ ] **Step 6: Run focused server/storyteller tests and commit.**

```bash
pnpm --filter @clocktower/server test -- game.test.ts bmrAdjudication.test.ts
pnpm --filter @clocktower/storyteller test -- nightActionLogSource.test.ts
git add packages/shared/src/events.ts apps/server/src/game.ts apps/server/src/handlers/storyteller.ts apps/storyteller/src/hooks/useGameActions.ts apps/storyteller/app/game/grimoire.tsx apps/storyteller/src/components/NightActionLog.tsx apps/server/src/__tests__/game.test.ts apps/server/src/__tests__/e2e/bmrAdjudication.test.ts apps/storyteller/src/components/__tests__/nightActionLogSource.test.ts
git commit -m "feat: expose BMR death decisions to the storyteller"
```

### Task 4: Make vote validation transactional

**Files:**
- Modify: `apps/server/src/game.ts`
- Test: `apps/server/src/__tests__/game.test.ts`

- [ ] **Step 1: Add failing tests showing a rejected Butler vote does not consume a Beggar token or dead vote.**

Set up a restricted Butler and a Beggar/dead voter, attempt the rejected vote, and assert the token/dead-vote state is unchanged.

- [ ] **Step 2: Run the focused tests and confirm the current mutation-before-validation failure.**

Run: `pnpm --filter @clocktower/server test -- game.test.ts -t "rejected vote preserves"`

- [ ] **Step 3: Move all vote eligibility checks before token/dead-vote mutations.**

- [ ] **Step 4: Run the complete server unit suite and commit.**

```bash
pnpm --filter @clocktower/server test
git add apps/server/src/game.ts apps/server/src/__tests__/game.test.ts
git commit -m "fix: make rejected votes side-effect free"
```

### Task 5: Audit Storyteller controls and cross-edition candidates

**Files:**
- Modify: `apps/storyteller/app/game/grimoire.tsx`
- Modify: `apps/storyteller/src/components/NightPanel.tsx`
- Modify: `apps/storyteller/src/components/NightActionLog.tsx`
- Modify: `apps/storyteller/src/hooks/useGameActions.ts`
- Modify: `apps/storyteller/src/components/feedback/useGameEditionRoles.ts`
- Test: `apps/storyteller/src/components/__tests__/grimoireAbilityWarningSource.test.ts`
- Test: `apps/storyteller/src/components/__tests__/nightPanelBmrAssistSource.test.ts`
- Test: `apps/storyteller/src/components/__tests__/nightActionLogSource.test.ts`

- [ ] **Step 1: Add source tests for setup-edition authority and successful callback completion.**

Assert that an additional BMR role in a TB setup does not replace the selected TB night order, and that every changed BMR control keeps its pending state until the callback reports success.

- [ ] **Step 2: Run the focused storyteller tests and verify the current source violates each assertion.**

- [ ] **Step 3: Use `gameState.settings.setupEditionId` as the primary edition for night order/dictionary and merge only explicitly active extra roles.**

- [ ] **Step 4: Preserve modal/action selections on failed callbacks and avoid duplicate automatic/manual death processing.**

- [ ] **Step 5: Run the complete storyteller test package and commit.**

```bash
pnpm --filter @clocktower/storyteller test
git add apps/storyteller/app/game/grimoire.tsx apps/storyteller/src/components/NightPanel.tsx apps/storyteller/src/components/NightActionLog.tsx apps/storyteller/src/hooks/useGameActions.ts apps/storyteller/src/components/feedback/useGameEditionRoles.ts apps/storyteller/src/components/__tests__
git commit -m "fix: keep storyteller controls aligned with the active script"
```

### Task 6: Full verification and requirement audit

**Files:**
- Modify: `README.md` only if the documented edition/feature matrix is proven stale by the completed implementation.
- Update: `docs/superpowers/plans/2026-08-17-edition-role-interactions.md`

- [ ] **Step 1: Run the complete unit and E2E suites.**

```bash
pnpm test
pnpm test:e2e
```

- [ ] **Step 2: Run static quality gates.**

```bash
pnpm typecheck
pnpm lint
pnpm build
```

- [ ] **Step 3: Inspect `git diff`, confirm each design requirement has a corresponding test/evidence, and mark only completed plan steps.**

- [ ] **Step 4: Commit any documentation update and the final plan status.**

```bash
git add README.md docs/superpowers/plans/2026-08-17-edition-role-interactions.md
git commit -m "docs: record edition interaction audit verification"
```
