# Active Roles, Settings, and Dictionary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make bluff selection, dictionary content, night-flow examples, vote-history visibility, and timer controls use one server-synchronized game setup.

**Architecture:** Add shared selectors for active roles and base role counts, persist exclusions and vote-history visibility in `GameSettings`, and pass the resulting setup into both apps' shared dictionary. Keep timer storage in seconds while adding a small minutes/seconds editor beside the existing presets.

**Tech Stack:** TypeScript, React Native, Expo Router, Socket.io, Zustand, Vitest.

---

## File map

- `packages/shared/src/roles.ts`: active-role and base-distribution selectors.
- `packages/shared/src/types.ts`: synchronized setup settings.
- `apps/server/src/game.ts`: persist edition, exclusions, and additions together.
- `apps/server/src/handlers/storyteller.ts`: use active roles for bluff resolution and broadcast settings.
- `packages/ui/src/components/DictionaryModal.tsx`: filtered flow plus base team-count tab.
- `apps/player/app/game.tsx`: derive dictionary roles and player count from server settings.
- `apps/storyteller/app/game/grimoire.tsx`: pass synchronized setup and player count to the dictionary.
- `apps/storyteller/app/game/lobby.tsx`: expose vote-history setting and custom timer inputs.
- `apps/storyteller/src/components/SettingsPanel.tsx`: expose the same in-game setting.
- `apps/storyteller/src/components/ClockSpeedSetting.tsx`: synchronize presets with exact minute/second input.

### Task 1: Shared active-role and base-count selectors

**Files:**
- Modify: `packages/shared/src/roles.ts`
- Modify: `packages/shared/src/__tests__/roles.test.ts`

- [ ] **Step 1: Write failing selector tests**

Add imports and tests equivalent to:

```ts
expect(
  getActiveRoles({
    editionId: 'trouble_brewing',
    excludedRoleIds: ['librarian'],
    additionalRoleIds: ['sweetheart'],
  }).map((role) => role.id),
).not.toContain('librarian');
expect(
  getActiveRoles({
    editionId: 'trouble_brewing',
    excludedRoleIds: ['librarian'],
    additionalRoleIds: ['sweetheart'],
  }).map((role) => role.id),
).toContain('sweetheart');
expect(getBaseRoleCounts(7)).toEqual({
  townsfolk: 5,
  outsider: 0,
  minion: 1,
  demon: 1,
});
expect(getBaseRoleCounts(4)).toBeNull();
```

- [ ] **Step 2: Verify the tests fail**

Run: `pnpm --filter @clocktower/shared test -- roles.test.ts`

Expected: FAIL because `getActiveRoles` and `getBaseRoleCounts` are not exported.

- [ ] **Step 3: Implement the minimal shared selectors**

Add these public contracts and reuse `ROLE_DISTRIBUTION`:

```ts
export interface ActiveRoleOptions {
  editionId: string;
  excludedRoleIds?: readonly string[];
  additionalRoleIds?: readonly string[];
}

export function getActiveRoles(options: ActiveRoleOptions): Role[] {
  const excluded = new Set(options.excludedRoleIds ?? []);
  const active = new Map(
    getRolesForEdition(options.editionId)
      .filter((role) => !excluded.has(role.id))
      .map((role) => [role.id, role]),
  );
  for (const roleId of options.additionalRoleIds ?? []) {
    const role = getRoleById(roleId);
    if (role && !excluded.has(role.id)) active.set(role.id, role);
  }
  return [...active.values()];
}

export function getBaseRoleCounts(playerCount: number): {
  townsfolk: number;
  outsider: number;
  minion: number;
  demon: number;
} | null {
  const counts = ROLE_DISTRIBUTION[playerCount];
  if (!counts) return null;
  const [townsfolk, outsider, minion, demon] = counts;
  return { townsfolk, outsider, minion, demon };
}
```

- [ ] **Step 4: Reuse `getActiveRoles` inside `distributeRoles` and verify green**

Replace the local edition/additional/excluded merge with `getActiveRoles(options)` and run:

`pnpm --filter @clocktower/shared test -- roles.test.ts`

Expected: PASS, including existing exclusion and cross-edition distribution cases.

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/roles.ts packages/shared/src/__tests__/roles.test.ts
git commit -m "feat: centralize active role setup"
```

### Task 2: Persist setup exclusions and vote-history visibility

**Files:**
- Modify: `packages/shared/src/types.ts`
- Modify: `apps/server/src/game.ts`
- Modify: `apps/server/src/handlers/storyteller.ts`
- Modify: `apps/server/src/__tests__/game.test.ts`
- Modify: `apps/server/src/__tests__/e2e/gameFlow.test.ts`
- Modify: `apps/storyteller/src/stores/__tests__/gameStore.test.ts`

- [ ] **Step 1: Write failing settings tests**

Assert the defaults and setup persistence:

```ts
expect(DEFAULT_GAME_SETTINGS.excludedRoleIds).toEqual([]);
expect(DEFAULT_GAME_SETTINGS.showVoteHistory).toBe(true);

game.setRoleSetup('trouble_brewing', ['sweetheart'], ['librarian']);
expect(game.getSettings()).toMatchObject({
  setupEditionId: 'trouble_brewing',
  additionalRoleIds: ['sweetheart'],
  excludedRoleIds: ['librarian'],
  showVoteHistory: true,
});
```

Add an E2E case that emits `game:setSettings` with `{ showVoteHistory: false }` and expects the connected player to receive `game:settings` with `showVoteHistory: false`.

- [ ] **Step 2: Verify red**

Run:

```bash
pnpm --filter @clocktower/server test -- game.test.ts
pnpm --filter @clocktower/server test:e2e -- gameFlow.test.ts
```

Expected: FAIL because the two settings and three-argument `setRoleSetup` do not exist.

- [ ] **Step 3: Add synchronized settings**

Extend the type and default:

```ts
export interface GameSettings {
  // existing fields
  setupEditionId: string;
  excludedRoleIds: string[];
  additionalRoleIds: string[];
  showVoteHistory: boolean;
}

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  // existing defaults
  setupEditionId: 'trouble_brewing',
  excludedRoleIds: [],
  additionalRoleIds: [],
  showVoteHistory: true,
};
```

Change the server setup boundary to:

```ts
setRoleSetup(
  editionId: string,
  additionalRoleIds: string[] = [],
  excludedRoleIds: string[] = [],
): void {
  this.editionWasConfigured = true;
  this.editionId = editionId;
  this.state.settings.setupEditionId = editionId;
  this.state.settings.additionalRoleIds = [...additionalRoleIds];
  this.state.settings.excludedRoleIds = [...excludedRoleIds];
}
```

Pass `options.excludedRoleIds ?? []` from `game:distributeRoles`.

- [ ] **Step 4: Run focused tests**

Run the two commands from Step 2 and `pnpm --filter @clocktower/storyteller test -- gameStore.test.ts`.

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/types.ts apps/server/src/game.ts apps/server/src/handlers/storyteller.ts apps/server/src/__tests__/game.test.ts apps/server/src/__tests__/e2e/gameFlow.test.ts apps/storyteller/src/stores/__tests__/gameStore.test.ts
git commit -m "feat: synchronize role exclusions and vote history setting"
```

### Task 3: Make bluff resolution use the active setup

**Files:**
- Modify: `apps/server/src/handlers/storyteller.ts`
- Modify: `apps/server/src/__tests__/e2e/bluffRoles.test.ts`

- [ ] **Step 1: Add two failing bluff regressions**

Configure the game setup before manual assignment and verify:

```ts
ctx.app.game.setRoleSetup(
  'trouble_brewing',
  ['sweetheart'],
  ['librarian'],
);
```

The first case preselects `librarian` and expects it absent from the final three bluffs. The second preselects unassigned `sweetheart` and expects it present.

- [ ] **Step 2: Verify red**

Run: `pnpm --filter @clocktower/server test:e2e -- bluffRoles.test.ts`

Expected: at least one regression fails because candidates currently use the editions of assigned roles and ignore the exclusion list.

- [ ] **Step 3: Replace edition inference with active-role selection**

Import `getActiveRoles` and implement the candidate source as:

```ts
function getNotInPlayGoodRoles(game: GameManager): Role[] {
  const state = game.getState();
  const settings = game.getSettings();
  const assignedRoleIds = new Set(
    state.players
      .flatMap((player) => [player.role?.id, player.drunkAs, player.lunaticAs])
      .filter((id): id is string => Boolean(id)),
  );
  return getActiveRoles({
    editionId: settings.setupEditionId,
    excludedRoleIds: settings.excludedRoleIds,
    additionalRoleIds: settings.additionalRoleIds,
  }).filter(
    (role) =>
      (role.team === 'townsfolk' || role.team === 'outsider') &&
      !assignedRoleIds.has(role.id),
  );
}
```

Keep the existing `drunk` and `lunatic` random exclusions.

- [ ] **Step 4: Verify green and commit**

Run: `pnpm --filter @clocktower/server test:e2e -- bluffRoles.test.ts`

Expected: PASS.

```bash
git add apps/server/src/handlers/storyteller.ts apps/server/src/__tests__/e2e/bluffRoles.test.ts
git commit -m "fix: scope demon bluffs to active roles"
```

### Task 4: Filter both dictionaries and add the base-count tab

**Files:**
- Modify: `packages/ui/src/components/DictionaryModal.tsx`
- Modify: `packages/ui/src/__tests__/dictionaryModal.test.ts`
- Modify: `packages/ui/src/__tests__/dictionaryModalFlowSource.test.ts`
- Modify: `apps/player/app/game.tsx`
- Modify: `apps/storyteller/app/game/grimoire.tsx`
- Modify: `apps/storyteller/src/components/__tests__/gameScriptRoles.test.ts`

- [ ] **Step 1: Write failing dictionary tests**

Add source/selector assertions for a fifth tab and base counts:

```ts
expect(getBaseRoleCounts(10)).toEqual({
  townsfolk: 7,
  outsider: 0,
  minion: 2,
  demon: 1,
});
expect(source).toContain("{ id: 'composition', label: '인원 구성' }");
expect(source).toContain('roleIds={dictionaryRoleIds}');
expect(source).toContain('regularPlayerCount=');
```

Also assert the player app derives `dictionaryRoleIds` with `getActiveRoles` and the storyteller passes `gameState.settings.excludedRoleIds`.

- [ ] **Step 2: Verify red**

Run:

```bash
pnpm --filter @clocktower/ui test
pnpm --filter @clocktower/storyteller test -- gameScriptRoles.test.ts
```

Expected: FAIL because the composition tab and synchronized exclusion filter are missing.

- [ ] **Step 3: Add `DictionaryModal` composition input and content**

Extend props with `regularPlayerCount?: number`, add `composition` to `TabId`/`TABS`, and render the four values returned by `getBaseRoleCounts(regularPlayerCount)`. Render an explicit unsupported-count message when the selector returns `null`.

- [ ] **Step 4: Pass one active role list from each app**

In both apps derive IDs with:

```ts
getActiveRoles({
  editionId: settings.setupEditionId,
  excludedRoleIds: settings.excludedRoleIds,
  additionalRoleIds: settings.additionalRoleIds,
}).map((role) => role.id)
```

Pass the count of non-traveller players as `regularPlayerCount`.

- [ ] **Step 5: Verify and commit**

Run the Step 2 commands plus both app typechecks.

```bash
git add packages/ui/src/components/DictionaryModal.tsx packages/ui/src/__tests__ apps/player/app/game.tsx apps/storyteller/app/game/grimoire.tsx apps/storyteller/src/components/__tests__/gameScriptRoles.test.ts
git commit -m "feat: align dictionary with the active setup"
```

### Task 5: Add the storyteller vote-history toggle

**Files:**
- Modify: `apps/storyteller/app/game/lobby.tsx`
- Modify: `apps/storyteller/src/components/SettingsPanel.tsx`
- Modify: `apps/player/app/game.tsx`
- Modify: `apps/player/src/components/SeatingChart.tsx`
- Modify: `apps/player/src/components/__tests__/seatingChartLayoutSource.test.ts`
- Modify: `apps/storyteller/src/components/__tests__/lobbySeatingSource.test.ts`

- [ ] **Step 1: Write failing source behavior tests**

Assert both storyteller setting surfaces contain `showVoteHistory`, the player passes it to `SeatingChart`, and the history panel is conditional.

- [ ] **Step 2: Verify red**

Run the two component test files directly in their workspaces.

- [ ] **Step 3: Implement the toggle and conditional history**

Add a `SettingToggle`/`Switch` labeled `이전 투표 기록` in lobby and in-game settings. Add `showVoteHistory: boolean` to `SeatingChartProps`, clear `selectedVoteId` when it becomes false, and wrap `historyPanel` with `showVoteHistory && (...)`.

- [ ] **Step 4: Verify and commit**

Run both focused tests and player/storyteller typechecks.

```bash
git add apps/storyteller/app/game/lobby.tsx apps/storyteller/src/components/SettingsPanel.tsx apps/player/app/game.tsx apps/player/src/components/SeatingChart.tsx apps/player/src/components/__tests__/seatingChartLayoutSource.test.ts apps/storyteller/src/components/__tests__/lobbySeatingSource.test.ts
git commit -m "feat: let storyteller hide vote history"
```

### Task 6: Add exact minute/second timer input

**Files:**
- Create: `apps/storyteller/src/components/durationInput.ts`
- Create: `apps/storyteller/src/components/__tests__/durationInput.test.ts`
- Modify: `apps/storyteller/src/components/ClockSpeedSetting.tsx`
- Modify: `apps/storyteller/src/components/ClockSpeedSetting.styles.ts`
- Modify: `apps/storyteller/src/components/__tests__/lobbySeatingSource.test.ts`

- [ ] **Step 1: Write failing duration conversion tests**

```ts
expect(splitDurationSeconds(125)).toEqual({ minutes: '2', seconds: '5' });
expect(mergeDurationParts('2', '75')).toBe(195);
expect(mergeDurationParts('0', '0')).toBe(0);
expect(mergeDurationParts('-1', '10')).toBeNull();
expect(mergeDurationParts('abc', '10')).toBeNull();
```

- [ ] **Step 2: Verify red**

Run: `pnpm --filter @clocktower/storyteller test -- durationInput.test.ts`

- [ ] **Step 3: Implement conversion helpers**

```ts
export function splitDurationSeconds(total: number) {
  const safe = Number.isFinite(total) && total >= 0 ? Math.floor(total) : 0;
  return { minutes: String(Math.floor(safe / 60)), seconds: String(safe % 60) };
}

export function mergeDurationParts(minutes: string, seconds: string) {
  if (!/^\d+$/.test(minutes) || !/^\d+$/.test(seconds)) return null;
  const mins = Number(minutes);
  const secs = Number(seconds);
  if (!Number.isSafeInteger(mins) || !Number.isSafeInteger(secs)) return null;
  return mins * 60 + secs;
}
```

- [ ] **Step 4: Add two controlled numeric inputs to `ClockSpeedSetting`**

Keep local text while editing, call `onInteractionStart` on focus and `onInteractionEnd` on blur, normalize through `splitDurationSeconds` after a valid `onChange`, and preserve the existing slider. Label the fields `분` and `초`; add numeric keyboard types and accessibility labels containing the timer label.

- [ ] **Step 5: Verify and commit**

Run storyteller tests and typecheck.

```bash
git add apps/storyteller/src/components/durationInput.ts apps/storyteller/src/components/__tests__/durationInput.test.ts apps/storyteller/src/components/ClockSpeedSetting.tsx apps/storyteller/src/components/ClockSpeedSetting.styles.ts apps/storyteller/src/components/__tests__/lobbySeatingSource.test.ts
git commit -m "feat: add exact timer inputs"
```

### Task 7: Workstream verification

- [ ] Run `pnpm --filter @clocktower/shared test`.
- [ ] Run `pnpm --filter @clocktower/ui test`.
- [ ] Run `pnpm --filter @clocktower/server test:e2e -- bluffRoles.test.ts gameFlow.test.ts`.
- [ ] Run player and storyteller tests and typechecks.
- [ ] Run `git diff --check` and confirm requirements 1, 5, 6, 9, and 10 each map to a passing regression.
