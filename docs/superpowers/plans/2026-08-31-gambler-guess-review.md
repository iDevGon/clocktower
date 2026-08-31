# Gambler Guess Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 도박사가 플레이어 앱에서 대상과 역할을 제출하고, 이야기꾼이 제출값을 수정한 뒤 승인하거나 반려하는 재접속 안전 흐름을 구현한다.

**Architecture:** 서버 `GameManager`가 현재 도박사 기상 대상과 승인 대기 요청을 단일 권위 상태로 관리한다. 플레이어 앱은 제출·대기·반려·완료 상태만 표시하고 정답은 받지 않으며, 이야기꾼 앱은 `GameState.pendingGamblerGuess`를 편집 가능한 기본값으로 사용한다. 승인만 기존 도박사 판정을 실행하고 다음 밤 기상 대상을 진행한다.

**Tech Stack:** TypeScript, Socket.IO, React Native/Expo, Zustand, Vitest, pnpm/Turborepo

---

## File map

- `packages/shared/src/types.ts`: 승인 대기 도박사 요청과 플레이어 표시 상태 타입, 이야기꾼 전용 `GameState` 필드.
- `packages/shared/src/events.ts`: 플레이어 제출, 이야기꾼 검토, 검토 결과, 재접속 응답 계약.
- `apps/server/src/game.ts`: 현재 기상 플레이어, 요청 생성·반려·승인·초기화와 재접속 상태의 권위 로직.
- `apps/server/src/handlers/player.ts`: 플레이어 제출 및 재접속 복원 경계.
- `apps/server/src/handlers/storyteller.ts`: 승인·반려 처리와 다음 기상 대상 진행 경계.
- `apps/server/src/__tests__/game.test.ts`: 요청 상태 머신 단위 회귀.
- `apps/server/src/__tests__/e2e/bmrAdjudication.test.ts`: 플레이어 → 이야기꾼 → 서버 → 플레이어 전체 흐름.
- `apps/player/src/components/GamblerGuessPrompt.tsx`: 대상·역할 1개 선택과 대기/반려/완료 표시.
- `apps/player/src/components/GamblerGuessPrompt.styles.ts`: 기존 밤 행동 카드와 일관된 모바일 선택 UI.
- `apps/player/src/components/NightActionPrompt.tsx`: 효과적 역할이 도박사일 때 전용 컴포넌트로 분기.
- `apps/player/src/hooks/useGameActions.ts`: 도박사 제출 액션.
- `apps/player/src/hooks/socketListeners/nightListeners.ts`: 검토 결과와 새 기상 차례 상태 반영.
- `apps/player/src/hooks/rejoinState.ts`: 재접속 시 도박사 검토 상태 복원.
- `apps/player/src/stores/playerStore.ts`: `idle | pending | approved | rejected` 상태.
- `apps/player/app/game.tsx`: 현재 설정 기반 역할 후보와 도박사 제출 콜백 연결.
- `apps/player/src/components/__tests__/gamblerGuessPrompt.test.ts`: 플레이어 표시 상태와 제출 가능 조건.
- `apps/player/src/hooks/__tests__/rejoinState.test.ts`: pending/rejected 재접속 회귀.
- `apps/storyteller/src/components/NightPanel.tsx`: 제출값 초기화, 수정, 승인·반려 버튼.
- `apps/storyteller/src/components/feedback/useGameEditionRoles.ts`: 제외·추가 역할과 참가 여행자를 반영한 공통 편집 후보.
- `apps/storyteller/src/hooks/useGameActions.ts`: 이야기꾼 검토 액션.
- `apps/storyteller/app/game/grimoire.tsx`: 서버 pending 상태와 검토 콜백 전달.
- `apps/storyteller/src/components/__tests__/nightPanelBmrAssistSource.test.ts`: 기본값·편집·승인·반려 wiring 회귀.

### Task 1: Shared contracts and authoritative request state

**Files:**
- Modify: `packages/shared/src/types.ts`
- Modify: `packages/shared/src/events.ts`
- Modify: `apps/server/src/game.ts`
- Test: `apps/server/src/__tests__/game.test.ts`

- [ ] **Step 1: Write failing GameManager state-machine tests**

Add tests that create a night game with an awakened Gambler and assert all state transitions:

```ts
it('도박사 제출은 승인 전까지 판정하지 않고 대기 상태로 저장한다', () => {
  const { gm, players } = createBmrAssistGame();
  const gambler = players[1];
  const target = players[5];
  gm.setNightProgress('gambler', ['gambler']);
  gm.markNightWakeUp(gambler.id);

  const submitted = gm.submitGamblerGuess(
    gambler.id,
    target.id,
    target.role?.id ?? 'sailor',
  );

  expect(submitted.success).toBe(true);
  expect(gm.getPendingGamblerGuess()).toMatchObject({
    gamblerId: gambler.id,
    targetPlayerId: target.id,
  });
  expect(gm.getPlayer(gambler.id)?.isAlive).toBe(true);
  expect(gm.getGamblerGuessStatus(gambler.id)).toBe('pending');
});

it('반려한 도박사 제출은 같은 차례에서 새 요청으로 다시 제출할 수 있다', () => {
  const { gm, players } = createBmrAssistGame();
  const gambler = players[1];
  const target = players[5];
  gm.setNightProgress('gambler', ['gambler']);
  gm.markNightWakeUp(gambler.id);
  const first = gm.submitGamblerGuess(gambler.id, target.id, 'grandmother');
  expect(first.success).toBe(true);
  if (!first.success) throw new Error(first.reason);

  expect(gm.reviewGamblerGuess(first.requestId, { decision: 'reject' }))
    .toMatchObject({ success: true, decision: 'reject' });
  expect(gm.getGamblerGuessStatus(gambler.id)).toBe('rejected');

  const second = gm.submitGamblerGuess(gambler.id, target.id, 'grandmother');
  expect(second.success).toBe(true);
  if (!second.success) throw new Error(second.reason);
  expect(second.requestId).not.toBe(first.requestId);
});

it('오래된 요청 ID와 중복 제출은 현재 요청을 변경하지 않는다', () => {
  const { gm, players } = createBmrAssistGame();
  const gambler = players[1];
  const target = players[5];
  gm.setNightProgress('gambler', ['gambler']);
  gm.markNightWakeUp(gambler.id);
  const pending = gm.submitGamblerGuess(gambler.id, target.id, 'grandmother');
  expect(pending.success).toBe(true);
  if (!pending.success) throw new Error(pending.reason);

  expect(gm.submitGamblerGuess(gambler.id, target.id, 'sailor').success)
    .toBe(false);
  expect(gm.reviewGamblerGuess('stale-request', { decision: 'reject' }))
    .toMatchObject({ success: false });
  expect(gm.getPendingGamblerGuess()?.requestId).toBe(pending.requestId);
});
```

Also cover: non-night submission, inactive role, non-current wake player, missing target, excluded/unknown role, edited approval values, poisoned/drunk approval without death, and wrong sober guess adding the Gambler to pending night kills.

- [ ] **Step 2: Run the tests and verify RED**

Run:

```bash
pnpm --filter @clocktower/server exec vitest run src/__tests__/game.test.ts
```

Expected: FAIL because `submitGamblerGuess`, `reviewGamblerGuess`, `getPendingGamblerGuess`, and `getGamblerGuessStatus` do not exist.

- [ ] **Step 3: Add the shared types and event contracts**

Add to `packages/shared/src/types.ts`:

```ts
export type GamblerGuessStatus = 'idle' | 'pending' | 'approved' | 'rejected';

export interface PendingGamblerGuess {
  requestId: string;
  gamblerId: string;
  targetPlayerId: string;
  guessedRoleId: string;
}

/** Add this field inside the existing GameState interface. */
pendingGamblerGuess?: PendingGamblerGuess;
```

Import these types in `packages/shared/src/events.ts` and add exact contracts:

```ts
// ServerToClientEvents
'gambler:guessReviewed': (data: {
  requestId: string;
  status: 'approved' | 'rejected';
}) => void;

// ClientToServerEvents
'gambler:submitGuess': (
  data: { targetPlayerId: string; guessedRoleId: string },
  callback: (res:
    | { success: true; requestId: string }
    | { success: false; error: string }
  ) => void,
) => void;

// StorytellerToServerEvents
'gambler:reviewGuess': (
  data:
    | { requestId: string; decision: 'reject' }
    | {
        requestId: string;
        decision: 'approve';
        targetPlayerId: string;
        guessedRoleId: string;
      },
  callback: (res: { success: boolean; error?: string }) => void,
) => void;
```

Extend the `game:rejoin` success response with:

```ts
gamblerGuessStatus?: GamblerGuessStatus;
gamblerGuessRequestId?: string;
```

- [ ] **Step 4: Implement the minimal GameManager state machine**

In `apps/server/src/game.ts`, add one internal state object and current wake target:

```ts
private currentNightWakeUpPlayerId: string | null = null;
private gamblerGuessReview:
  | { request: PendingGamblerGuess; status: 'pending' | 'rejected' }
  | null = null;
```

Update `markNightWakeUp` to set `currentNightWakeUpPlayerId`. Clear both fields when the active role changes away from Gambler and during create/reset/restart.

Implement these public methods:

```ts
submitGamblerGuess(
  gamblerId: string,
  targetPlayerId: string,
  guessedRoleId: string,
):
  | { success: true; requestId: string }
  | { success: false; reason: string };

reviewGamblerGuess(
  requestId: string,
  review:
    | { decision: 'reject' }
    | {
        decision: 'approve';
        targetPlayerId: string;
        guessedRoleId: string;
      },
):
  | {
      success: true;
      decision: 'approve' | 'reject';
      gamblerId: string;
      requestId: string;
      killedTargetId?: string;
    }
  | { success: false; reason: string };

getPendingGamblerGuess(): PendingGamblerGuess | null;
getGamblerGuessStatus(playerId: string): GamblerGuessStatus;
```

Validation must check `phase === 'night'`, `currentNightRoleId === 'gambler'`, `currentNightWakeUpPlayerId === gamblerId`, effective Gambler ownership, target existence, and the allowed-role set built with `getActiveRoles({ editionId: settings.setupEditionId, additionalRoleIds: settings.additionalRoleIds, excludedRoleIds: settings.excludedRoleIds })` plus joined Traveller roles. Approval must call `resolveGamblerGuess`; treat `{ success: false, blocked: true }` as an accepted malfunctioning resolution with no death. Add `pendingGamblerGuess` only in `getStorytellerState()` and explicitly strip it in `toPublicGameState()`.

- [ ] **Step 5: Run unit tests and typechecks**

Run:

```bash
pnpm --filter @clocktower/server exec vitest run src/__tests__/game.test.ts
pnpm --filter @clocktower/shared typecheck
pnpm --filter @clocktower/server typecheck
```

Expected: all new state-machine tests PASS and both typechecks exit 0.

- [ ] **Step 6: Commit Task 1**

```bash
git add packages/shared/src/types.ts packages/shared/src/events.ts \
  apps/server/src/game.ts apps/server/src/handlers/publicPayloads.ts \
  apps/server/src/__tests__/game.test.ts
git commit -m "feat: track pending gambler guesses"
```

### Task 2: Socket review flow and reconnect recovery

**Files:**
- Modify: `apps/server/src/handlers/player.ts`
- Modify: `apps/server/src/handlers/storyteller.ts`
- Test: `apps/server/src/__tests__/e2e/bmrAdjudication.test.ts`

- [ ] **Step 1: Write failing end-to-end tests**

Import `GameState` from `@clocktower/shared`, then add Socket.IO tests for the real event sequence:

```ts
it('도박사 제출은 이야기꾼 승인 전 판정되지 않고 수정된 값으로 승인된다', async () => {
  const { playerIds } = await setupGameWithRoles(ctx, [
    { roleId: 'gambler' },
    { roleId: 'grandmother' },
    { roleId: 'sailor' },
    { roleId: 'godfather' },
    { roleId: 'po' },
  ]);
  const wakePromise = waitForEvent(ctx.players[0], 'night:wakeUp');
  ctx.storyteller.emit('night:setActiveRole', 'gambler');
  await wakePromise;

  const pendingPromise = waitForEvent<GameState>(ctx.storyteller, 'game:state');
  const submit = await new Promise<
    | { success: true; requestId: string }
    | { success: false; error: string }
  >((resolve) => {
    ctx.players[0].emit(
      'gambler:submitGuess',
      { targetPlayerId: playerIds[1], guessedRoleId: 'sailor' },
      resolve,
    );
  });

  expect(submit.success).toBe(true);
  if (!submit.success) throw new Error(submit.error);
  expect(ctx.app.game.getPlayer(playerIds[0])?.isAlive).toBe(true);
  const pendingState = await pendingPromise;
  expect(pendingState.pendingGamblerGuess).toMatchObject({
    targetPlayerId: playerIds[1],
    guessedRoleId: 'sailor',
  });

  const reviewed = waitForEvent(ctx.players[0], 'gambler:guessReviewed');
  const approve = await new Promise<{ success: boolean; error?: string }>(
    (resolve) => {
      ctx.storyteller.emit(
        'gambler:reviewGuess',
        {
          requestId: submit.requestId,
          decision: 'approve',
          targetPlayerId: playerIds[1],
          guessedRoleId: 'grandmother',
        },
        resolve,
      );
    },
  );

  expect(approve.success).toBe(true);
  expect(await reviewed).toEqual({
    requestId: submit.requestId,
    status: 'approved',
  });
  expect(ctx.app.game.getPlayer(playerIds[0])?.isAlive).toBe(true);
});
```

Add separate cases for:

- rejection emits `rejected`, does not pop the wake queue, and allows resubmission;
- approval of a wrong sober guess creates a pending night death but does not publicly reveal it before day;
- poisoned/drunk approval succeeds without death;
- stale request review fails and leaves the active request intact;
- a second Barista wake receives a new request after the first approval;
- player rejoin returns `pending` or `rejected` without target/role truth leakage;
- storyteller reconnect receives `pendingGamblerGuess` in `game:state`;
- public `game:state` never contains `pendingGamblerGuess`.

- [ ] **Step 2: Run focused E2E and verify RED**

Run:

```bash
pnpm --filter @clocktower/server test:e2e -- bmrAdjudication.test.ts
```

Expected: FAIL because the submit/review events are not registered and rejoin has no Gambler state.

- [ ] **Step 3: Implement player submission handler**

In `apps/server/src/handlers/player.ts` register:

```ts
socket.on(
  'gambler:submitGuess',
  ({ targetPlayerId, guessedRoleId }, callback) => {
    const playerId = getPlayerIdFromSocket(socket);
    if (!playerId) {
      callback({ success: false, error: '플레이어를 찾을 수 없습니다' });
      return;
    }
    const result = game.submitGamblerGuess(
      playerId,
      targetPlayerId,
      guessedRoleId,
    );
    if (!result.success) {
      callback({ success: false, error: result.reason });
      return;
    }
    storytellerIo.emit('game:state', game.getStorytellerState());
    callback({ success: true, requestId: result.requestId });
  },
);
```

Add `gamblerGuessStatus` and current request ID to successful `game:rejoin` callbacks. Do not return target or guessed role to the player.

- [ ] **Step 4: Implement storyteller review and shared queue advancement**

Extract the existing next-wake block inside `night:sendFeedback` into a local `wakeNextNightPlayer()` helper. Call it after successful Gambler approval, never after rejection.

Replace the manual `gambler:guess` handler with:

```ts
socket.on('gambler:reviewGuess', (data, callback) => {
  const result = game.reviewGamblerGuess(
    data.requestId,
    data.decision === 'approve'
      ? {
          decision: 'approve',
          targetPlayerId: data.targetPlayerId,
          guessedRoleId: data.guessedRoleId,
        }
      : { decision: 'reject' },
  );
  if (!result.success) {
    callback({ success: false, error: result.reason });
    return;
  }

  playerIo.to(result.gamblerId).emit('gambler:guessReviewed', {
    requestId: result.requestId,
    status: result.decision === 'approve' ? 'approved' : 'rejected',
  });
  storytellerIo.emit('game:state', game.getStorytellerState());
  if (result.decision === 'approve') {
    emitBmrAssistResult(result.killedTargetId);
    wakeNextNightPlayer();
  }
  callback({ success: true });
});
```

- [ ] **Step 5: Run E2E, unit tests, and typechecks**

Run:

```bash
pnpm --filter @clocktower/server test:e2e -- bmrAdjudication.test.ts
pnpm --filter @clocktower/server test
pnpm --filter @clocktower/shared typecheck
pnpm --filter @clocktower/server typecheck
```

Expected: the complete socket flow passes; existing BMR adjudication remains green.

- [ ] **Step 6: Commit Task 2**

```bash
git add apps/server/src/handlers/player.ts \
  apps/server/src/handlers/storyteller.ts \
  apps/server/src/__tests__/e2e/bmrAdjudication.test.ts
git commit -m "feat: review gambler guesses on the server"
```

### Task 3: Player Gambler selection and review states

**Files:**
- Create: `apps/player/src/components/GamblerGuessPrompt.tsx`
- Create: `apps/player/src/components/GamblerGuessPrompt.styles.ts`
- Create: `apps/player/src/components/__tests__/gamblerGuessPrompt.test.ts`
- Modify: `apps/player/src/components/NightActionPrompt.tsx`
- Modify: `apps/player/src/hooks/useGameActions.ts`
- Modify: `apps/player/src/hooks/socketListeners/nightListeners.ts`
- Modify: `apps/player/src/hooks/__tests__/rejoinState.test.ts`
- Modify: `apps/player/src/hooks/rejoinState.ts`
- Modify: `apps/player/src/stores/playerStore.ts`
- Modify: `apps/player/app/game.tsx`

- [ ] **Step 1: Write failing pure presentation and rejoin tests**

Create a small exported presentation helper beside the component and test exact states:

```ts
expect(getGamblerGuessPresentation('idle')).toEqual({
  canEdit: true,
  message: null,
});
expect(getGamblerGuessPresentation('pending')).toEqual({
  canEdit: false,
  message: '이야기꾼 확인 대기 중',
});
expect(getGamblerGuessPresentation('rejected')).toEqual({
  canEdit: true,
  message: '이야기꾼이 제출을 반려했습니다. 다시 선택하세요.',
});
expect(getGamblerGuessPresentation('approved')).toEqual({
  canEdit: false,
  message: '행동 완료',
});
```

Extend `rejoinState.test.ts` to assert `pending` and `rejected` are restored, and that no guessed role, target, correctness, or death result is present in the response/patch.

- [ ] **Step 2: Run focused player tests and verify RED**

Run:

```bash
pnpm --filter @clocktower/player exec vitest run \
  src/components/__tests__/gamblerGuessPrompt.test.ts \
  src/hooks/__tests__/rejoinState.test.ts
```

Expected: FAIL because the prompt/helper and store fields do not exist.

- [ ] **Step 3: Add the player store and socket actions**

Add to `PlayerState` and defaults:

```ts
gamblerGuessStatus: GamblerGuessStatus;
gamblerGuessRequestId: string | null;
```

In `useGameActions.ts`, add:

```ts
const submitGamblerGuess = useCallback(
  (targetPlayerId: string, guessedRoleId: string) =>
    new Promise<{ success: boolean; error?: string }>((resolve) => {
      const socket = useConnectionStore.getState().socket;
      if (!socket) {
        resolve({ success: false, error: '서버에 연결되어 있지 않습니다' });
        return;
      }
      socket.emit(
        'gambler:submitGuess',
        { targetPlayerId, guessedRoleId },
        (result) => {
          if (result.success) {
            usePlayerStore.getState().set({
              gamblerGuessStatus: 'pending',
              gamblerGuessRequestId: result.requestId,
            });
          }
          resolve(result);
        },
      );
    }),
  [],
);
```

In `nightListeners.ts`, reset status to `idle` on each new Gambler `night:wakeUp` and handle `gambler:guessReviewed`. Ignore a result whose request ID does not match the current store request. Approved sets `approved` and `nightActionSubmitted: true`; rejected sets `rejected`, clears the request ID, and keeps `nightActionSubmitted: false`.

Map the rejoin fields in `buildRejoinStatePatch`. For `pending` or `rejected`, restore `nightWakeUp: 'gambler'` and `nightActionSubmitted: false` so a cold reconnect can render the waiting or retry screen. Otherwise clear the Gambler request ID and leave `nightWakeUp` unset.

- [ ] **Step 4: Build `GamblerGuessPrompt` and wire `NightActionPrompt`**

The component API must stay narrow:

```ts
interface GamblerGuessPromptProps {
  players: PlayerInfo[];
  roles: Role[];
  status: GamblerGuessStatus;
  onSubmit: (
    targetPlayerId: string,
    guessedRoleId: string,
  ) => Promise<{ success: boolean; error?: string }>;
}
```

Render two Pressable selectors, scrollable player/role picker overlays, an inline Korean error, and one submit button. All players are eligible. Disable submission until both selections exist or while pending. Do not render correctness terms such as `정답`, `오답`, `맞음`, or `틀림`.

Before the existing passive branch in `NightActionPrompt.tsx`, add:

```tsx
if (effectiveRoleId === 'gambler') {
  return (
    <GamblerGuessPrompt
      players={players}
      roles={gamblerRoleOptions}
      status={gamblerGuessStatus}
      onSubmit={onSubmitGamblerGuess}
    />
  );
}
```

In `game.tsx`, build `gamblerRoleOptions` with `getActiveRoles({ editionId, additionalRoleIds, excludedRoleIds })`, then append unique joined Traveller roles from `gamePlayers`. Pass status and submit action through `NightPhase` to `NightActionPrompt`.

- [ ] **Step 5: Run player tests, typecheck, and accessibility source checks**

Run:

```bash
pnpm --filter @clocktower/player test
pnpm --filter @clocktower/player typecheck
pnpm exec biome check apps/player/src/components/GamblerGuessPrompt.tsx \
  apps/player/src/components/GamblerGuessPrompt.styles.ts \
  apps/player/src/components/NightActionPrompt.tsx \
  apps/player/app/game.tsx
```

Expected: all player tests pass; selectors and submit button have Korean accessibility labels and at least 48px touch height.

- [ ] **Step 6: Commit Task 3**

```bash
git add apps/player/app/game.tsx apps/player/src/components/GamblerGuessPrompt.tsx \
  apps/player/src/components/GamblerGuessPrompt.styles.ts \
  apps/player/src/components/NightActionPrompt.tsx \
  apps/player/src/components/__tests__/gamblerGuessPrompt.test.ts \
  apps/player/src/hooks/useGameActions.ts \
  apps/player/src/hooks/socketListeners/nightListeners.ts \
  apps/player/src/hooks/__tests__/rejoinState.test.ts \
  apps/player/src/hooks/rejoinState.ts apps/player/src/stores/playerStore.ts
git commit -m "feat: submit gambler guesses from player app"
```

### Task 4: Storyteller editable approval and rejection controls

**Files:**
- Modify: `apps/storyteller/src/components/NightPanel.tsx`
- Modify: `apps/storyteller/src/components/feedback/useGameEditionRoles.ts`
- Modify: `apps/storyteller/src/hooks/useGameActions.ts`
- Modify: `apps/storyteller/app/game/grimoire.tsx`
- Modify: `apps/storyteller/src/components/__tests__/nightPanelBmrAssistSource.test.ts`
- Modify: `apps/storyteller/src/components/__tests__/gameScriptRoles.test.ts`
- Create: `apps/storyteller/src/components/__tests__/gamblerGuessReview.test.ts`
- Create: `apps/storyteller/src/components/gamblerGuessReview.ts`

- [ ] **Step 1: Write failing editor-state and wiring tests**

Create a pure request-keyed initializer:

```ts
expect(
  syncGamblerGuessDraft(
    { requestId: null, targetPlayerId: null, guessedRoleId: null },
    pending,
  ),
).toEqual({
  requestId: pending.requestId,
  targetPlayerId: pending.targetPlayerId,
  guessedRoleId: pending.guessedRoleId,
});

expect(
  syncGamblerGuessDraft(
    {
      requestId: pending.requestId,
      targetPlayerId: 'storyteller-edited-target',
      guessedRoleId: 'storyteller-edited-role',
    },
    pending,
  ),
).toEqual({
  requestId: pending.requestId,
  targetPlayerId: 'storyteller-edited-target',
  guessedRoleId: 'storyteller-edited-role',
});
```

Update source wiring tests to require `승인`, `반려`, `플레이어 제출 대기 중`, pending request props, and `gambler:reviewGuess`; forbid the old manual `gambler:guess` event.

Extend `gameScriptRoles.test.ts` so excluded roles are absent, cross-edition additions remain present, and joined Traveller roles remain present. This keeps the player submission list and Storyteller edit list on the same game setup.

- [ ] **Step 2: Run focused Storyteller tests and verify RED**

Run:

```bash
pnpm --filter @clocktower/storyteller exec vitest run \
  src/components/__tests__/gamblerGuessReview.test.ts \
  src/components/__tests__/nightPanelBmrAssistSource.test.ts \
  src/components/__tests__/gameScriptRoles.test.ts
```

Expected: FAIL because the draft helper and review wiring are absent.

- [ ] **Step 3: Add the review action and request-keyed draft helper**

In `useGameActions.ts`, replace `gamblerGuess` with:

```ts
const reviewGamblerGuess = useCallback(
  (
    data: Parameters<StorytellerToServerEvents['gambler:reviewGuess']>[0],
    callback?: BmrAssistCallback,
  ) => socket?.emit('gambler:reviewGuess', data, callback),
  [socket],
);
```

Implement `syncGamblerGuessDraft` so it initializes only when `requestId` changes and returns an empty draft when pending becomes null.

Update `buildGameScriptRoles` to call `getActiveRoles` with `setupEditionId`, `additionalRoleIds`, and `excludedRoleIds`, then append unique joined Traveller roles:

```ts
export function buildGameScriptRoles(
  players: Player[],
  settings?: Pick<
    GameSettings,
    'setupEditionId' | 'additionalRoleIds' | 'excludedRoleIds'
  > | null,
): Role[] {
  const roles = getActiveRoles({
    editionId: settings?.setupEditionId ?? 'trouble_brewing',
    additionalRoleIds: settings?.additionalRoleIds ?? [],
    excludedRoleIds: settings?.excludedRoleIds ?? [],
  });
  const roleById = new Map(roles.map((role) => [role.id, role]));
  for (const player of players) {
    if (player.isTraveller && player.role) {
      roleById.set(player.role.id, player.role);
    }
  }
  return [...roleById.values()];
}
```

- [ ] **Step 4: Replace the manual Gambler panel with pending review UI**

Pass `gameState.pendingGamblerGuess` and `reviewGamblerGuess` from `grimoire.tsx` into `NightPanel`.

In the Gambler branch:

- show `플레이어 제출 대기 중` when pending is null;
- initialize the selected player and role from the new request once;
- keep both existing chip groups editable;
- render `반려` and `승인` buttons only for a pending request;
- disable both while a review callback is outstanding;
- send the edited values in the approve payload;
- send only request ID and `decision: 'reject'` for rejection;
- do not call the role-wide `handleBmrAssistResult` for Gambler reviews, because it would hide the panel before a Barista second wake;
- keep the Gambler panel controlled by the active role and pending request, while the other BMR panels continue using `isFeedbackSent`;
- show callback errors without clearing the request or draft.

Use exact accessible labels `도박사 추측 승인` and `도박사 추측 반려`.

- [ ] **Step 5: Run Storyteller tests and typecheck**

Run:

```bash
pnpm --filter @clocktower/storyteller test
pnpm --filter @clocktower/storyteller typecheck
pnpm exec biome check apps/storyteller/src/components/NightPanel.tsx \
  apps/storyteller/src/components/gamblerGuessReview.ts \
  apps/storyteller/src/hooks/useGameActions.ts \
  apps/storyteller/app/game/grimoire.tsx
```

Expected: all Storyteller tests pass, edited draft persists across unrelated renders, and buttons are duplicate-safe.

- [ ] **Step 6: Commit Task 4**

```bash
git add apps/storyteller/src/components/NightPanel.tsx \
  apps/storyteller/src/components/gamblerGuessReview.ts \
  apps/storyteller/src/components/feedback/useGameEditionRoles.ts \
  apps/storyteller/src/components/__tests__/gamblerGuessReview.test.ts \
  apps/storyteller/src/components/__tests__/gameScriptRoles.test.ts \
  apps/storyteller/src/components/__tests__/nightPanelBmrAssistSource.test.ts \
  apps/storyteller/src/hooks/useGameActions.ts \
  apps/storyteller/app/game/grimoire.tsx
git commit -m "feat: approve or reject gambler guesses"
```

### Task 5: Cross-app verification and review

**Files:**
- Modify only files required by concrete review findings.

- [ ] **Step 1: Run focused end-to-end acceptance cases**

```bash
pnpm --filter @clocktower/server test:e2e -- bmrAdjudication.test.ts
pnpm --filter @clocktower/player exec vitest run \
  src/components/__tests__/gamblerGuessPrompt.test.ts \
  src/hooks/__tests__/rejoinState.test.ts
pnpm --filter @clocktower/storyteller exec vitest run \
  src/components/__tests__/gamblerGuessReview.test.ts \
  src/components/__tests__/nightPanelBmrAssistSource.test.ts
```

Expected: submit → edit → approve, submit → reject → resubmit, reconnect, malfunction, stale request, and Barista double-turn cases all pass.

- [ ] **Step 2: Run the full repository gate**

```bash
pnpm test
pnpm test:e2e
pnpm typecheck
pnpm lint
pnpm build
git diff --check
```

Expected: every command exits 0. Existing Vite CJS deprecation warnings may remain, but no new warnings or failures are accepted.

- [ ] **Step 3: Review privacy and state boundaries**

Verify by source inspection and tests:

- no public `game:state` contains `pendingGamblerGuess`;
- no player event or UI contains correctness or the final edited Storyteller value;
- only the socket-bound current awakened Gambler can submit;
- approval advances exactly one wake target, rejection advances none;
- a stale callback cannot settle a new request;
- all new touch controls have accessibility roles, labels, disabled state, and 48px minimum height.

- [ ] **Step 4: Request independent code review and fix only concrete findings**

Review the feature range from the design-doc commit through `HEAD`, with special attention to reconnect recovery, Barista double turns, duplicate approval callbacks, private-role leakage, and poisoned/drunk adjudication. For each valid finding, add a failing regression test, verify RED, implement the minimal fix, and rerun Step 2.

- [ ] **Step 5: Commit any review fixes**

If review produces changes:

```bash
git status --short
git add apps/player apps/server apps/storyteller packages/shared
git commit -m "fix: harden gambler guess review flow"
```

Before staging, confirm every listed change is a direct result of an accepted review finding. Do not stage documentation, generated files, or unrelated user changes.

If review produces no changes, leave the worktree clean and do not create an empty commit.
