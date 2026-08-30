# Player Vote, Seating, and Night UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep voting usable during Slayer announcements, remove night-order leakage, and make seating notes and ghost-vote states explicit.

**Architecture:** Derive presentation labels and overlay deferral from pure helpers, preserve server state while delaying only full-screen presentation, and remove the night progress renderer without removing private wake-up/action data. Keep changes local to the player app.

**Tech Stack:** TypeScript, React Native, Zustand, Vitest.

---

## File map

- `apps/player/src/components/gameOverlayPresentation.ts`: defer Slayer-related full-screen overlays while voting.
- `apps/player/src/components/GameOverlays.tsx`: render deferred state after vote completion.
- `apps/player/src/components/phases/NightPhase.tsx`: remove the public progress visualization.
- `apps/player/src/components/SeatingChart.tsx`: note focus, ghost-vote labels, and optional history.
- `apps/player/src/components/VotePrompt.presentation.ts`: disabled-vote message selector.
- `apps/player/src/components/VotePrompt.tsx`: show the used-ghost-vote explanation.

### Task 1: Defer Slayer overlays until voting ends

**Files:**
- Modify: `apps/player/src/components/gameOverlayPresentation.ts`
- Modify: `apps/player/src/components/__tests__/gameOverlayPresentation.test.ts`
- Modify: `apps/player/src/components/GameOverlays.tsx`
- Modify: `apps/player/src/hooks/socketListeners/__tests__/voteListeners.test.ts`

- [ ] **Step 1: Write failing presentation tests**

```ts
expect(
  selectGameOverlay({
    currentPhase: 'vote',
    justDied: true,
    deathReason: 'slayer',
  }),
).toBe('none');
expect(
  selectGameOverlay({
    currentPhase: 'day',
    justDied: true,
    deathReason: 'slayer',
  }),
).toBe('death');
expect(
  selectGameOverlay({
    currentPhase: 'vote',
    executionReason: 'slayer',
  }),
).toBe('none');
expect(
  selectGameOverlay({
    currentPhase: 'day',
    executionReason: 'slayer',
  }),
).toBe('execution');
```

Cover Slayer fizzle in the same way. Add a listener assertion proving `executionAnnouncement`/`slayerFizzle` remains in the store while deferred.

- [ ] **Step 2: Verify red**

Run the two focused player tests.

- [ ] **Step 3: Implement presentation-only deferral**

In the selector compute:

```ts
const deferSlayer =
  input.currentPhase === 'vote' &&
  (input.deathReason === 'slayer' ||
    input.executionReason === 'slayer' ||
    input.hasSlayerFizzle);
```

Return `none` for that Slayer presentation while voting. Do not clear store fields. When `vote:result` later changes the phase to `day`, the same retained data becomes the next overlay and displays once.

- [ ] **Step 4: Verify and commit**

Run player tests/typecheck.

```bash
git add apps/player/src/components/gameOverlayPresentation.ts apps/player/src/components/__tests__/gameOverlayPresentation.test.ts apps/player/src/components/GameOverlays.tsx apps/player/src/hooks/socketListeners/__tests__/voteListeners.test.ts
git commit -m "fix: defer slayer overlays during voting"
```

### Task 2: Remove player-visible night progress nodes

**Files:**
- Modify: `apps/player/src/components/phases/NightPhase.tsx`
- Modify: `apps/player/src/components/__tests__/nightActionPromptScroll.test.ts`
- Create: `apps/player/src/components/__tests__/nightPhasePrivacySource.test.ts`

- [ ] **Step 1: Write a failing privacy source test**

```ts
expect(source).not.toContain("from '../NightProgress'");
expect(source).not.toContain('<NightProgress');
expect(source).toContain('<NightActionPrompt');
expect(source).toContain('isMyTurn');
```

- [ ] **Step 2: Verify red**

Run: `pnpm --filter @clocktower/player test -- nightPhasePrivacySource.test.ts`

Expected: FAIL because `NightPhase` currently imports and renders `NightProgress`.

- [ ] **Step 3: Remove only the progress visualization**

Delete the `NightProgress` import and element. Keep `nightProgress.players` available to `NightActionPrompt` for the current player's private target selection, and keep `night:wakeUp` as the only signal that sets `isMyTurn`.

- [ ] **Step 4: Verify and commit**

Run night-related player tests and typecheck.

```bash
git add apps/player/src/components/phases/NightPhase.tsx apps/player/src/components/__tests__/nightActionPromptScroll.test.ts apps/player/src/components/__tests__/nightPhasePrivacySource.test.ts
git commit -m "fix: hide night role progress from players"
```

### Task 3: Make ghost-vote seating states explicit and remove autofocus

**Files:**
- Create: `apps/player/src/components/seatingPresentation.ts`
- Create: `apps/player/src/components/__tests__/seatingPresentation.test.ts`
- Modify: `apps/player/src/components/SeatingChart.tsx`
- Modify: `apps/player/src/components/SeatingChart.styles.ts`
- Modify: `apps/player/src/components/__tests__/seatingChartRolePickerSource.test.ts`

- [ ] **Step 1: Write failing label tests**

```ts
expect(getVoteRightPresentation({ isAlive: true, deadVoteUsed: false })).toEqual({
  label: '투표 가능',
  state: 'alive',
});
expect(getVoteRightPresentation({ isAlive: false, deadVoteUsed: false })).toEqual({
  label: '유령표 보유',
  state: 'ghost_available',
});
expect(getVoteRightPresentation({ isAlive: false, deadVoteUsed: true })).toEqual({
  label: '유령표 사용',
  state: 'ghost_spent',
});
```

Add a source assertion that the note editor contains no `autoFocus`.

- [ ] **Step 2: Verify red**

Run the two seating test files.

- [ ] **Step 3: Implement and apply the presentation helper**

Use the helper for visible text and accessibility labels. Keep the blue glow for `ghost_available`; give `ghost_spent` a muted ash treatment with a distinct icon/glyph and no glow. Change the badge text exactly to `유령표 보유` and `유령표 사용`. Remove `autoFocus` from the role search input.

- [ ] **Step 4: Verify and commit**

Run seating tests/typecheck.

```bash
git add apps/player/src/components/seatingPresentation.ts apps/player/src/components/__tests__/seatingPresentation.test.ts apps/player/src/components/SeatingChart.tsx apps/player/src/components/SeatingChart.styles.ts apps/player/src/components/__tests__/seatingChartRolePickerSource.test.ts
git commit -m "fix: clarify ghost vote state in seating"
```

### Task 4: Explain why a used ghost vote cannot be cast

**Files:**
- Modify: `apps/player/src/components/VotePrompt.presentation.ts`
- Modify: `apps/player/src/components/VotePrompt.tsx`
- Modify: `apps/player/src/components/__tests__/voteClockPresentation.test.ts`

- [ ] **Step 1: Write a failing disabled-message test**

```ts
expect(
  getVoteUnavailableMessage({
    isAlive: false,
    deadVoteUsed: true,
    hasPassed: false,
  }),
).toBe('유령표를 이미 사용했습니다');
```

Also cover the existing waiting and completed messages so they remain unchanged for living players.

- [ ] **Step 2: Verify red**

Run: `pnpm --filter @clocktower/player test -- voteClockPresentation.test.ts`

- [ ] **Step 3: Use the message in `VotePrompt`**

Read `isAlive` and `deadVoteUsed` from the store. During countdown and active voting, a dead player with a spent vote sees a disabled button/card labeled `유령표를 이미 사용했습니다`; do not call `preselectVote` from that control. Living players and dead players with a remaining ghost vote retain the current hand-toggle behavior.

- [ ] **Step 4: Verify and commit**

Run vote tests/typecheck.

```bash
git add apps/player/src/components/VotePrompt.presentation.ts apps/player/src/components/VotePrompt.tsx apps/player/src/components/__tests__/voteClockPresentation.test.ts
git commit -m "fix: explain spent ghost vote state"
```

### Task 5: Workstream verification

- [ ] Run `pnpm --filter @clocktower/player test`.
- [ ] Run `pnpm --filter @clocktower/player typecheck`.
- [ ] Run `git diff --check`.
- [ ] Verify requirements 4, 7, 11, 12, and 13 each have a focused passing test.
