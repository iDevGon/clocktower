# Player Stability, Haptics, and Offline Kick Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent death-state overlay/rejoin failures, make iOS tactile feedback reliable, and make kicking a disconnected player authoritative.

**Architecture:** Normalize rejoin payloads through one pure state patch, distinguish missing sessions from transient network failure, and arbitrate full-screen overlays so incompatible death presentations cannot mount together. Wrap platform haptics behind one player-app utility and make server removal independent of socket presence.

**Tech Stack:** TypeScript, React Native, Expo Haptics, Socket.io, Zustand, Vitest.

---

## File map

- `apps/player/src/hooks/rejoinState.ts`: pure rejoin outcome and state-patch logic.
- `apps/player/src/hooks/useConnection.ts`: initial manual auto-rejoin.
- `apps/player/src/hooks/socketListeners/gameListeners.ts`: reconnect/background rejoin and death-state normalization.
- `apps/player/src/components/GameOverlays.tsx`: one active full-screen presentation at a time.
- `apps/player/src/haptics.ts`: iOS haptics and Android vibration adapter.
- `apps/server/src/handlers/player.ts`: explicit rejoin failure reasons.
- `apps/server/src/handlers/storyteller.ts`: disconnected-player kick cleanup.
- `apps/server/src/pushNotifications.ts`: clear a kicked player's token.

### Task 1: Reproduce and normalize death/rejoin state

**Files:**
- Create: `apps/player/src/hooks/rejoinState.ts`
- Create: `apps/player/src/hooks/__tests__/rejoinState.test.ts`
- Modify: `apps/player/src/hooks/useConnection.ts`
- Modify: `apps/player/src/hooks/socketListeners/gameListeners.ts`
- Modify: `apps/player/src/stores/playerStore.ts`

- [ ] **Step 1: Write failing state-patch tests**

Create fixtures for a dead player reconnecting after execution and after night death:

```ts
const previous = {
  justDied: true,
  deathReason: 'execution',
  executionAnnouncement: { executedId: 'p1' },
  nightDeathAnnouncement: [{ id: 'p1', name: 'Player1' }],
  slayerFizzle: { slayerName: 'A', targetName: 'B' },
};
const patch = buildRejoinStatePatch(previous, {
  success: true,
  playerName: 'Player1',
  roleId: 'empath',
  phase: 'day',
  isAlive: false,
  deadVoteUsed: false,
});
expect(patch).toMatchObject({
  isAlive: false,
  justDied: false,
  deathReason: null,
  executionAnnouncement: null,
  nightDeathAnnouncement: null,
  slayerFizzle: null,
});
```

Also assert that nomination, execution candidate, and game players are copied from a successful response in the same patch.

- [ ] **Step 2: Verify red**

Run: `pnpm --filter @clocktower/player test -- rejoinState.test.ts`

Expected: FAIL because the pure state builder does not exist.

- [ ] **Step 3: Implement one rejoin state builder**

Define a typed `SuccessfulRejoinResponse` from the shared callback response and return a `Partial<PlayerState>` that hydrates server state while explicitly clearing all transient full-screen presentation fields:

```ts
return {
  role: response.roleId ? (getRoleById(response.roleId) ?? null) : null,
  currentPhase: response.phase ?? 'setup',
  isAlive: response.isAlive ?? true,
  deadVoteUsed: response.deadVoteUsed ?? false,
  nomination: response.nomination ?? null,
  executionCandidate: response.executionCandidate ?? null,
  justDied: false,
  deathReason: null,
  executionAnnouncement: null,
  nightDeathAnnouncement: null,
  slayerFizzle: null,
  rolePromotion: null,
  pendingRolePromotion: null,
};
```

Export the minimum store-state type needed by the helper instead of exporting the entire store interface.

- [ ] **Step 4: Use the builder in both rejoin paths**

Replace the duplicated object literals in `useConnection.ts` and `gameListeners.ts`. The reconnect path updates `playerId` and `playerName` from the successful response. Atomic `gameSettings` hydration is added in Task 2 together with the shared response field.

- [ ] **Step 5: Verify and commit**

Run player tests and typecheck.

```bash
git add apps/player/src/hooks/rejoinState.ts apps/player/src/hooks/__tests__/rejoinState.test.ts apps/player/src/hooks/useConnection.ts apps/player/src/hooks/socketListeners/gameListeners.ts apps/player/src/stores/playerStore.ts
git commit -m "fix: normalize player state after rejoin"
```

### Task 2: Distinguish missing sessions from transient rejoin failures

**Files:**
- Modify: `packages/shared/src/events.ts`
- Modify: `apps/server/src/handlers/player.ts`
- Modify: `apps/server/src/__tests__/e2e/gameFlow.test.ts`
- Modify: `apps/player/src/hooks/rejoinState.ts`
- Modify: `apps/player/src/hooks/useConnection.ts`
- Modify: `apps/player/app/index.tsx`
- Modify: `apps/player/src/hooks/socketListeners/gameListeners.ts`
- Modify: `apps/player/src/hooks/__tests__/useConnectionRejoinSource.test.ts`

- [ ] **Step 1: Write failing server E2E cases**

Assert the callback returns explicit codes:

```ts
expect(noGameResponse).toEqual({
  success: false,
  error: 'game_not_found',
});
expect(unknownPlayerResponse).toEqual({
  success: false,
  error: 'player_not_found',
});
```

- [ ] **Step 2: Verify red**

Run: `pnpm --filter @clocktower/server test:e2e -- gameFlow.test.ts`

Expected: FAIL because current failures contain only `success: false`.

- [ ] **Step 3: Add the error union and server responses**

Extend the shared callback response with:

```ts
error?: 'game_not_found' | 'player_not_found';
gameSettings?: GameSettings;
```

Return `game_not_found` when no game exists and `player_not_found` when the ID is absent. Include `gameSettings: state.settings` on success so hydration is atomic instead of waiting for a following event.

- [ ] **Step 4: Return a discriminated client outcome**

Change direct rejoin from `Promise<boolean>` to:

```ts
type RejoinOutcome =
  | { status: 'success' }
  | { status: 'missing' }
  | { status: 'unavailable' };
```

Only `missing` clears the stored player ID. A timeout, disconnected socket, or connection exception returns `unavailable` and preserves the session. The join screen stops its spinner in all three cases and only navigates on `success`.

- [ ] **Step 5: Verify and commit**

Run server E2E, player tests, and both typechecks.

```bash
git add packages/shared/src/events.ts apps/server/src/handlers/player.ts apps/server/src/__tests__/e2e/gameFlow.test.ts apps/player/src/hooks/rejoinState.ts apps/player/src/hooks/useConnection.ts apps/player/app/index.tsx apps/player/src/hooks/socketListeners/gameListeners.ts apps/player/src/hooks/__tests__/useConnectionRejoinSource.test.ts
git commit -m "fix: distinguish expired player sessions on rejoin"
```

### Task 3: Enforce one full-screen death presentation

**Files:**
- Create: `apps/player/src/components/gameOverlayPresentation.ts`
- Create: `apps/player/src/components/__tests__/gameOverlayPresentation.test.ts`
- Modify: `apps/player/src/components/GameOverlays.tsx`
- Modify: `apps/player/app/game.tsx`
- Modify: `apps/player/src/hooks/socketListeners/__tests__/gameListeners.test.ts`

- [ ] **Step 1: Write failing overlay-priority tests**

```ts
expect(selectGameOverlay({ justDied: true, nightDeaths: true })).toBe('death');
expect(
  selectGameOverlay({
    justDied: false,
    executionAnnouncement: true,
    nightDeaths: true,
  }),
).toBe('execution');
expect(
  selectGameOverlay({
    justDied: false,
    executionAnnouncement: false,
    nightDeaths: true,
  }),
).toBe('night_deaths');
```

Add a listener regression where `night:deaths` and `game:playerUpdate` arrive for the same player; the store must retain one personal death presentation and clear the redundant group announcement when dismissed.

- [ ] **Step 2: Verify red**

Run the two player test files.

- [ ] **Step 3: Implement a pure overlay selector and stable dismiss handlers**

Return one key in priority order: game end, start reveal, promotion, personal death, execution, night fall, Ravenkeeper, night deaths, Slayer fizzle, none. In `GameOverlays`, switch on this key instead of independently rendering several booleans. Wrap all dismiss callbacks passed from `game.tsx` in `useCallback` so `BaseOverlay` auto-dismiss animations are not canceled and restarted by unrelated store renders.

- [ ] **Step 4: Verify and commit**

Run player tests/typecheck.

```bash
git add apps/player/src/components/gameOverlayPresentation.ts apps/player/src/components/__tests__/gameOverlayPresentation.test.ts apps/player/src/components/GameOverlays.tsx apps/player/app/game.tsx apps/player/src/hooks/socketListeners/__tests__/gameListeners.test.ts
git commit -m "fix: serialize player death overlays"
```

### Task 4: Introduce reliable iOS haptics

**Files:**
- Modify: `apps/player/package.json`
- Modify: `pnpm-lock.yaml`
- Create: `apps/player/src/haptics.ts`
- Create: `apps/player/src/__tests__/haptics.test.ts`
- Modify: `apps/player/src/notifications.ts`
- Modify: `apps/player/src/components/DeathOverlay.tsx`
- Modify: `apps/player/src/components/ExecutionOverlay.tsx`
- Modify: `apps/player/src/components/NightDeathOverlay.tsx`
- Modify: `apps/player/src/components/RavenkeeperOverlay.tsx`
- Modify: `apps/player/src/components/GameEndOverlay.tsx`
- Modify: `apps/player/src/components/SlayerFizzleOverlay.tsx`
- Modify: `apps/player/src/components/VotePrompt.tsx`

- [ ] **Step 1: Install the Expo-compatible package**

Run: `pnpm --filter @clocktower/player exec expo install expo-haptics`

Expected: `expo-haptics` is added with a version compatible with Expo 54.

- [ ] **Step 2: Write failing adapter tests**

Mock `Platform.OS`, `expo-haptics`, and `Vibration`; assert iOS calls `impactAsync`/`notificationAsync`, Android calls `Vibration.vibrate`, web calls neither, and a rejected haptic promise is swallowed.

- [ ] **Step 3: Verify red**

Run: `pnpm --filter @clocktower/player test -- haptics.test.ts`

- [ ] **Step 4: Implement the adapter**

Expose semantic functions such as:

```ts
export function hapticAlert(): void {
  if (Platform.OS === 'ios') {
    void Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Warning,
    ).catch(() => undefined);
    return;
  }
  if (Platform.OS === 'android') Vibration.vibrate([0, 200, 100, 200]);
}

export function hapticSelection(): void {
  if (Platform.OS === 'ios') {
    void Haptics.selectionAsync().catch(() => undefined);
    return;
  }
  if (Platform.OS === 'android') Vibration.vibrate(80);
}
```

- [ ] **Step 5: Replace direct player-app vibration calls**

Map death/game-end events to notification feedback, vote countdown to selection feedback, and turn arrival to alert feedback. Do not change shared UI or storyteller vibration in this task.

- [ ] **Step 6: Verify and commit**

Run player tests/typecheck.

```bash
git add apps/player/package.json pnpm-lock.yaml apps/player/src/haptics.ts apps/player/src/__tests__/haptics.test.ts apps/player/src/notifications.ts apps/player/src/components apps/player/src/hooks/socketListeners
git commit -m "fix: use native haptics on ios"
```

### Task 5: Kick disconnected players authoritatively

**Files:**
- Modify: `apps/server/src/handlers/storyteller.ts`
- Modify: `apps/server/src/pushNotifications.ts`
- Modify: `apps/server/src/__tests__/e2e/traveller.test.ts`
- Modify: `apps/server/src/__tests__/pushNotifications.test.ts`

- [ ] **Step 1: Add a failing offline-kick E2E case**

Start a game, disconnect one player socket, emit `player:kick` for its retained player ID, and assert:

```ts
expect(result.success).toBe(true);
expect(ctx.app.game.getPlayer(playerId)).toBeUndefined();
expect(ctx.app.game.getPlayerOrder()).not.toContain(playerId);
expect(rejoinResult).toEqual({
  success: false,
  error: 'player_not_found',
});
```

- [ ] **Step 2: Verify red**

Run: `pnpm --filter @clocktower/server test:e2e -- traveller.test.ts`

- [ ] **Step 3: Make socket delivery optional and cleanup unconditional**

Call `game.removePlayer(playerId)` and check its boolean result before any socket-dependent behavior. Then call `removePushToken(playerId)`, emit `player:kicked` to the room, remove sockets from the room, and broadcast the updated state. The handler returns success whenever removal succeeded, even if the room contains no sockets.

- [ ] **Step 4: Verify and commit**

Run the offline kick E2E and push-notification unit tests.

```bash
git add apps/server/src/handlers/storyteller.ts apps/server/src/pushNotifications.ts apps/server/src/__tests__/e2e/traveller.test.ts apps/server/src/__tests__/pushNotifications.test.ts
git commit -m "fix: kick disconnected players from game state"
```

### Task 6: Workstream verification

- [ ] Run `pnpm --filter @clocktower/player test`.
- [ ] Run `pnpm --filter @clocktower/server test`.
- [ ] Run focused server E2E tests for rejoin and kick.
- [ ] Run player/server typechecks.
- [ ] Run `git diff --check` and map requirements 2, 3, and 8 to fresh evidence.
