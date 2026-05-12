# Bad Moon Rising Adjudication Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a host-facing warning layer for Bad Moon Rising death/protection adjudication without changing server-side automatic kill semantics yet.

**Architecture:** Keep Phase 1 pure and reversible. Add shared BMR adjudication helpers that calculate warnings from a death attempt, expose BMR-specific reminder statuses, then render those warnings in the storyteller night action log. The host still confirms deaths manually through the existing `game:kill` path.

**Tech Stack:** TypeScript, pnpm workspaces, Vitest, React Native storyteller UI, existing `@clocktower/shared` package exports.

---

## Source Spec

Use [docs/superpowers/specs/2026-05-12-bad-moon-rising-adjudication-design.md](/Users/gonhong/Documents/workspace/clocktower/docs/superpowers/specs/2026-05-12-bad-moon-rising-adjudication-design.md) as the source of truth.

## Phase 1 Scope

This plan implements only:

- BMR-specific statuses/reminders needed for host warnings.
- A shared pure helper that returns warning chips for attempted death events.
- Storyteller night action log support for BMR kill roles and warnings.
- Focused tests for the helper and source-level UI wiring.

This plan does not:

- Intercept automatic execution.
- Implement Zombuul false-death state.
- Automate Pukka delayed death, Po no-one state, Shabaloth regurgitation, Professor resurrection, Minstrel global drunkenness, or Mastermind win logic.
- Change player-facing death announcements.

## File Map

- `packages/shared/src/types.ts`
  - Add BMR status literals, labels, colors, and descriptions.
- `packages/shared/src/bmrAdjudication.ts`
  - New pure helper module for death-attempt warning calculation.
- `packages/shared/src/index.ts`
  - Export the new helper module.
- `packages/shared/src/__tests__/bmrAdjudication.test.ts`
  - Unit tests for warning priority and BMR-specific protection hints.
- `apps/storyteller/src/components/NightActionLog.tsx`
  - Add BMR kill roles to target action buttons and render shared warnings.
- `apps/storyteller/src/components/__tests__/nightActionLogSource.test.ts`
  - Source-level test that BMR roles are wired into the night action log without requiring a full RN mount.

## Task 1: Add BMR Reminder Statuses

**Files:**
- Modify: `packages/shared/src/types.ts`
- Test: `packages/shared/src/__tests__/bmrAdjudication.test.ts`

- [ ] **Step 1: Write the failing status vocabulary test**

Create `packages/shared/src/__tests__/bmrAdjudication.test.ts` with:

```ts
import { describe, expect, it } from 'vitest';
import {
  PLAYER_STATUS_COLORS,
  PLAYER_STATUS_DESCRIPTIONS,
  PLAYER_STATUS_LABELS,
  type PlayerStatus,
} from '../types.js';

const BMR_STATUSES = [
  'innkeeper_protected',
  'devils_advocate_protected',
  'tea_lady_protected',
  'sailor_drunk',
  'innkeeper_drunk',
  'courtier_drunk',
  'minstrel_drunk',
  'goon_drunk',
  'pukka_poisoned',
  'zombuul_registers_dead',
  'fool_spent',
  'assassin_spent',
  'professor_spent',
  'courtier_spent',
  'po_chose_no_one',
  'shabaloth_marked_dead',
] as const satisfies readonly PlayerStatus[];

describe('BMR 판정 상태', () => {
  it('모든 BMR 상태는 라벨, 색상, 설명을 가진다', () => {
    for (const status of BMR_STATUSES) {
      expect(PLAYER_STATUS_LABELS[status]).toBeTruthy();
      expect(PLAYER_STATUS_COLORS[status]).toMatch(/^#/);
      expect(PLAYER_STATUS_DESCRIPTIONS[status]).toBeTruthy();
    }
  });
});
```

- [ ] **Step 2: Run test to verify RED**

Run:

```bash
pnpm --filter @clocktower/shared test -- src/__tests__/bmrAdjudication.test.ts
```

Expected: FAIL because the new status literals are not part of `PlayerStatus`.

- [ ] **Step 3: Add the status literals**

In `packages/shared/src/types.ts`, extend `PlayerStatus` with:

```ts
  | 'innkeeper_protected'
  | 'devils_advocate_protected'
  | 'tea_lady_protected'
  | 'sailor_drunk'
  | 'innkeeper_drunk'
  | 'courtier_drunk'
  | 'minstrel_drunk'
  | 'goon_drunk'
  | 'pukka_poisoned'
  | 'zombuul_registers_dead'
  | 'fool_spent'
  | 'assassin_spent'
  | 'professor_spent'
  | 'courtier_spent'
  | 'po_chose_no_one'
  | 'shabaloth_marked_dead';
```

Add these labels:

```ts
  innkeeper_protected: '여관 주인 보호',
  devils_advocate_protected: '악마의 변호사 보호',
  tea_lady_protected: '찻집 여인 보호',
  sailor_drunk: '선원 취함',
  innkeeper_drunk: '여관 주인 취함',
  courtier_drunk: '궁정대신 취함',
  minstrel_drunk: '음유시인 취함',
  goon_drunk: '건달 취함',
  pukka_poisoned: '푸카 중독',
  zombuul_registers_dead: '좀비얼 사망 위장',
  fool_spent: '어릿광대 능력 소모',
  assassin_spent: '암살자 능력 소모',
  professor_spent: '교수 능력 소모',
  courtier_spent: '궁정대신 능력 소모',
  po_chose_no_one: '포 휴식',
  shabaloth_marked_dead: '사발로스 사망 표식',
```

Add these colors:

```ts
  innkeeper_protected: '#2f8f74',
  devils_advocate_protected: '#8e5a3c',
  tea_lady_protected: '#4f9d69',
  sailor_drunk: '#b07f5c',
  innkeeper_drunk: '#b07f5c',
  courtier_drunk: '#b07f5c',
  minstrel_drunk: '#b07f5c',
  goon_drunk: '#b07f5c',
  pukka_poisoned: '#9b59b6',
  zombuul_registers_dead: '#5d5f6f',
  fool_spent: '#7f8c8d',
  assassin_spent: '#7f8c8d',
  professor_spent: '#7f8c8d',
  courtier_spent: '#7f8c8d',
  po_chose_no_one: '#7b4c9a',
  shabaloth_marked_dead: '#6f2f3a',
```

Add these descriptions:

```ts
  innkeeper_protected:
    '여관 주인이 오늘 밤 사망하지 않도록 보호한 대상입니다. 암살자는 이 보호를 무시합니다.',
  devils_advocate_protected:
    '악마의 변호사가 다음 낮 처형 사망을 막도록 선택한 대상입니다.',
  tea_lady_protected:
    '찻집 여인 조건으로 사망하지 않을 수 있는 생존 이웃입니다. 암살자는 이 보호를 무시합니다.',
  sailor_drunk:
    '선원 능력으로 황혼까지 취한 플레이어입니다.',
  innkeeper_drunk:
    '여관 주인 능력으로 황혼까지 취한 플레이어입니다.',
  courtier_drunk:
    '궁정대신 능력으로 정해진 기간 동안 취한 캐릭터입니다.',
  minstrel_drunk:
    '음유시인 능력으로 다음 날 황혼까지 취한 플레이어입니다.',
  goon_drunk:
    '건달을 그날 밤 처음 선택해 황혼까지 취한 플레이어입니다.',
  pukka_poisoned:
    '푸카가 중독시킨 대상입니다. 이후 푸카 효과로 사망하고 건강해질 수 있습니다.',
  zombuul_registers_dead:
    '좀비얼이 실제로는 살아있지만 사망한 것으로 등록된 상태입니다.',
  fool_spent:
    '어릿광대의 첫 사망 방지 능력이 이미 소모되었습니다.',
  assassin_spent:
    '암살자의 게임당 1회 사망 능력이 이미 소모되었습니다.',
  professor_spent:
    '교수의 게임당 1회 부활 능력이 이미 소모되었습니다.',
  courtier_spent:
    '궁정대신의 게임당 1회 취하게 하는 능력이 이미 소모되었습니다.',
  po_chose_no_one:
    '포가 직전 실제 행동에서 아무도 선택하지 않아 다음 행동에서 3명을 선택해야 합니다.',
  shabaloth_marked_dead:
    '사발로스가 선택해 사망시킨 대상입니다. 다음 밤 토해내 부활할 수 있습니다.',
```

- [ ] **Step 4: Run test to verify GREEN**

Run:

```bash
pnpm --filter @clocktower/shared test -- src/__tests__/bmrAdjudication.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/types.ts packages/shared/src/__tests__/bmrAdjudication.test.ts
git commit -m "feat: 피로물든달 판정 상태 추가"
```

## Task 2: Add Pure BMR Death Warning Helper

**Files:**
- Create: `packages/shared/src/bmrAdjudication.ts`
- Modify: `packages/shared/src/index.ts`
- Modify: `packages/shared/src/__tests__/bmrAdjudication.test.ts`

- [ ] **Step 1: Add failing helper tests**

Append to `packages/shared/src/__tests__/bmrAdjudication.test.ts`:

```ts
import {
  getBmrDeathWarnings,
  type BmrDeathWarningKind,
} from '../bmrAdjudication.js';
import type { Player } from '../types.js';

function player(overrides: Partial<Player>): Player {
  return {
    id: 'p1',
    name: 'Player',
    isAlive: true,
    isConnected: true,
    role: {
      id: 'washerwoman',
      name: '세탁부',
      team: 'townsfolk',
      ability: '',
      edition: 'trouble_brewing',
    },
    statuses: [],
    ...overrides,
  };
}

function warningKinds(
  args: Parameters<typeof getBmrDeathWarnings>[0],
): BmrDeathWarningKind[] {
  return getBmrDeathWarnings(args).map((warning) => warning.kind);
}

describe('getBmrDeathWarnings', () => {
  it('중독/취함 행동자는 사망 처리를 막는 경고를 먼저 반환한다', () => {
    const actor = player({
      id: 'assassin',
      role: {
        id: 'assassin',
        name: '암살자',
        team: 'minion',
        ability: '',
        edition: 'bad_moon_rising',
      },
      statuses: ['poisoned'],
    });
    const target = player({ id: 'target', statuses: ['tea_lady_protected'] });

    expect(
      warningKinds({
        roleId: 'assassin',
        method: 'assassin',
        timing: 'night',
        actor,
        target,
      })[0],
    ).toBe('actor_malfunctioning');
  });

  it('맑고 건강한 암살자는 보호 무시 경고를 반환한다', () => {
    const actor = player({
      id: 'assassin',
      role: {
        id: 'assassin',
        name: '암살자',
        team: 'minion',
        ability: '',
        edition: 'bad_moon_rising',
      },
    });
    const target = player({ id: 'target', statuses: ['tea_lady_protected'] });

    expect(
      warningKinds({
        roleId: 'assassin',
        method: 'assassin',
        timing: 'night',
        actor,
        target,
      }),
    ).toContain('assassin_bypasses_protection');
  });

  it('맑고 건강한 선원 대상은 사망 불가 경고를 반환한다', () => {
    const target = player({
      id: 'sailor',
      role: {
        id: 'sailor',
        name: '선원',
        team: 'townsfolk',
        ability: '',
        edition: 'bad_moon_rising',
      },
    });

    expect(
      warningKinds({
        roleId: 'po',
        method: 'po',
        timing: 'night',
        target,
      }),
    ).toContain('sailor_cannot_die');
  });

  it('취한 선원 대상은 선원 생존 경고를 반환하지 않는다', () => {
    const target = player({
      id: 'sailor',
      role: {
        id: 'sailor',
        name: '선원',
        team: 'townsfolk',
        ability: '',
        edition: 'bad_moon_rising',
      },
      statuses: ['drunk'],
    });

    expect(
      warningKinds({
        roleId: 'po',
        method: 'po',
        timing: 'night',
        target,
      }),
    ).not.toContain('sailor_cannot_die');
  });

  it('악마의 변호사 보호는 낮 처형에만 경고를 반환한다', () => {
    const target = player({
      id: 'target',
      statuses: ['devils_advocate_protected'],
    });

    expect(
      warningKinds({
        roleId: 'execution',
        method: 'execution',
        timing: 'day',
        target,
      }),
    ).toContain('devils_advocate_protected');
    expect(
      warningKinds({
        roleId: 'po',
        method: 'po',
        timing: 'night',
        target,
      }),
    ).not.toContain('devils_advocate_protected');
  });

  it('어릿광대가 능력을 쓰지 않았다면 첫 사망 선택지를 반환한다', () => {
    const target = player({
      id: 'fool',
      role: {
        id: 'fool',
        name: '어릿광대',
        team: 'townsfolk',
        ability: '',
        edition: 'bad_moon_rising',
      },
    });

    expect(
      warningKinds({
        roleId: 'po',
        method: 'po',
        timing: 'night',
        target,
      }),
    ).toContain('fool_first_death');
  });

  it('좀비얼 첫 사망은 사망 위장 선택지를 반환한다', () => {
    const target = player({
      id: 'zombuul',
      role: {
        id: 'zombuul',
        name: '좀비얼',
        team: 'demon',
        ability: '',
        edition: 'bad_moon_rising',
      },
    });

    expect(
      warningKinds({
        roleId: 'execution',
        method: 'execution',
        timing: 'day',
        target,
      }),
    ).toContain('zombuul_registers_dead');
  });
});
```

- [ ] **Step 2: Run test to verify RED**

Run:

```bash
pnpm --filter @clocktower/shared test -- src/__tests__/bmrAdjudication.test.ts
```

Expected: FAIL because `../bmrAdjudication.js` does not exist.

- [ ] **Step 3: Create the helper module**

Create `packages/shared/src/bmrAdjudication.ts`:

```ts
import { hasPoisonStatus } from './types.js';
import type { Player, PlayerStatus } from './types.js';

export type BmrDeathTiming = 'day' | 'night';

export type BmrDeathMethod =
  | 'execution'
  | 'demon'
  | 'assassin'
  | 'godfather'
  | 'gossip'
  | 'gambler'
  | 'tinker'
  | 'moonchild'
  | 'grandmother'
  | 'pukka_delayed'
  | 'shabaloth'
  | 'po'
  | 'manual';

export type BmrDeathWarningSeverity = 'block' | 'choice' | 'bypass' | 'info';

export type BmrDeathWarningKind =
  | 'actor_malfunctioning'
  | 'assassin_bypasses_protection'
  | 'sailor_cannot_die'
  | 'innkeeper_protected'
  | 'devils_advocate_protected'
  | 'tea_lady_protected'
  | 'fool_first_death'
  | 'zombuul_registers_dead';

export interface BmrDeathWarning {
  kind: BmrDeathWarningKind;
  severity: BmrDeathWarningSeverity;
  message: string;
}

export interface BmrDeathWarningContext {
  roleId: string;
  method: BmrDeathMethod;
  timing: BmrDeathTiming;
  actor?: Pick<Player, 'role' | 'statuses'> | null;
  target?: Pick<Player, 'role' | 'statuses'> | null;
  targetStatuses?: PlayerStatus[];
}

function isSoberHealthy(player?: Pick<Player, 'role' | 'statuses'> | null) {
  if (!player) return false;
  return (
    player.role?.id === 'beggar' ||
    player.statuses.includes('barista_sober_healthy')
  );
}

function isAbilityMalfunctioning(
  player?: Pick<Player, 'role' | 'statuses'> | null,
): boolean {
  if (!player || isSoberHealthy(player)) return false;
  return (
    player.role?.id === 'drunk' ||
    player.statuses.includes('drunk') ||
    hasPoisonStatus(player.statuses)
  );
}

function statusesOf(
  player: Pick<Player, 'statuses'> | null | undefined,
  override: PlayerStatus[] | undefined,
): PlayerStatus[] {
  return override ?? player?.statuses ?? [];
}

function hasProtectionStatus(statuses: PlayerStatus[]): boolean {
  return (
    statuses.includes('protected') ||
    statuses.includes('innkeeper_protected') ||
    statuses.includes('devils_advocate_protected') ||
    statuses.includes('tea_lady_protected')
  );
}

export function getBmrDeathWarnings({
  method,
  timing,
  actor,
  target,
  targetStatuses,
}: BmrDeathWarningContext): BmrDeathWarning[] {
  const warnings: BmrDeathWarning[] = [];
  const statuses = statusesOf(target, targetStatuses);

  if (isAbilityMalfunctioning(actor)) {
    warnings.push({
      kind: 'actor_malfunctioning',
      severity: 'block',
      message: '행동자가 중독/취함 상태라 이 사망 능력은 처리하지 않습니다.',
    });
    return warnings;
  }

  if (method === 'assassin') {
    if (hasProtectionStatus(statuses)) {
      warnings.push({
        kind: 'assassin_bypasses_protection',
        severity: 'bypass',
        message: '암살자는 보호로 사망할 수 없는 대상도 죽일 수 있습니다.',
      });
    }
    return warnings;
  }

  if (
    target?.role?.id === 'sailor' &&
    !isAbilityMalfunctioning(target) &&
    !statuses.includes('sailor_drunk')
  ) {
    warnings.push({
      kind: 'sailor_cannot_die',
      severity: 'block',
      message: '맑고 건강한 선원은 사망하지 않습니다.',
    });
  }

  if (timing === 'night' && statuses.includes('innkeeper_protected')) {
    warnings.push({
      kind: 'innkeeper_protected',
      severity: 'block',
      message: '여관 주인 보호 대상은 오늘 밤 사망하지 않습니다.',
    });
  }

  if (
    timing === 'day' &&
    method === 'execution' &&
    statuses.includes('devils_advocate_protected')
  ) {
    warnings.push({
      kind: 'devils_advocate_protected',
      severity: 'block',
      message: '처형은 성공하지만 악마의 변호사 보호로 대상은 생존합니다.',
    });
  }

  if (statuses.includes('tea_lady_protected')) {
    warnings.push({
      kind: 'tea_lady_protected',
      severity: 'block',
      message: '찻집 여인 조건으로 이 대상은 사망하지 않을 수 있습니다.',
    });
  }

  if (
    target?.role?.id === 'fool' &&
    !isAbilityMalfunctioning(target) &&
    !statuses.includes('fool_spent') &&
    !statuses.includes('no_ability')
  ) {
    warnings.push({
      kind: 'fool_first_death',
      severity: 'choice',
      message: '어릿광대의 첫 사망 방지 능력을 소모하고 생존할 수 있습니다.',
    });
  }

  if (
    target?.role?.id === 'zombuul' &&
    !statuses.includes('zombuul_registers_dead')
  ) {
    warnings.push({
      kind: 'zombuul_registers_dead',
      severity: 'choice',
      message: '좀비얼의 첫 사망은 실제 사망 대신 사망한 것으로 위장될 수 있습니다.',
    });
  }

  return warnings;
}
```

- [ ] **Step 4: Export the helper**

In `packages/shared/src/index.ts`, add:

```ts
export * from './bmrAdjudication.js';
```

- [ ] **Step 5: Run test to verify GREEN**

Run:

```bash
pnpm --filter @clocktower/shared test -- src/__tests__/bmrAdjudication.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/shared/src/bmrAdjudication.ts packages/shared/src/index.ts packages/shared/src/__tests__/bmrAdjudication.test.ts
git commit -m "feat: 피로물든달 사망 경고 헬퍼 추가"
```

## Task 3: Wire BMR Kill Buttons and Warnings Into Night Action Log

**Files:**
- Modify: `apps/storyteller/src/components/NightActionLog.tsx`
- Modify: `apps/storyteller/src/components/NightActionLog.styles.ts`
- Test: `apps/storyteller/src/components/__tests__/nightActionLogSource.test.ts`

- [ ] **Step 1: Write failing source-level UI wiring test**

Create `apps/storyteller/src/components/__tests__/nightActionLogSource.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  fileURLToPath(new URL('../NightActionLog.tsx', import.meta.url)),
  'utf8',
);

describe('NightActionLog BMR wiring', () => {
  it('BMR 사망 역할을 행동 버튼 대상으로 등록한다', () => {
    for (const roleId of [
      'zombuul',
      'pukka',
      'shabaloth',
      'po',
      'assassin',
      'godfather',
      'gossip',
      'gambler',
      'moonchild',
      'grandmother',
    ]) {
      expect(source).toContain(`${roleId}: { label: '사망 처리'`);
    }
  });

  it('공유 BMR 판정 경고를 렌더링한다', () => {
    expect(source).toContain('getBmrDeathWarnings');
    expect(source).toContain('bmrWarningBadge');
    expect(source).toContain('warning.message');
  });
});
```

- [ ] **Step 2: Run test to verify RED**

Run:

```bash
pnpm --filter @clocktower/storyteller test -- src/components/__tests__/nightActionLogSource.test.ts
```

Expected: FAIL because BMR roles and warning rendering are not wired.

- [ ] **Step 3: Import the shared helper**

In `apps/storyteller/src/components/NightActionLog.tsx`, change imports from shared to include `getBmrDeathWarnings`:

```ts
import {
  getBmrDeathWarnings,
  getRoleById,
  NIGHT_FEEDBACK,
} from '@clocktower/shared';
```

- [ ] **Step 4: Add BMR roles to `ROLE_TARGET_ACTIONS`**

In `ROLE_TARGET_ACTIONS`, after the S&V Demon entries, add:

```ts
  zombuul: { label: '사망 처리', doneLabel: '사망', isKill: true },
  pukka: { label: '사망 처리', doneLabel: '사망', isKill: true },
  shabaloth: { label: '사망 처리', doneLabel: '사망', isKill: true },
  po: { label: '사망 처리', doneLabel: '사망', isKill: true },
  assassin: { label: '사망 처리', doneLabel: '사망', isKill: true },
  godfather: { label: '사망 처리', doneLabel: '사망', isKill: true },
  gossip: { label: '사망 처리', doneLabel: '사망', isKill: true },
  gambler: { label: '사망 처리', doneLabel: '사망', isKill: true },
  moonchild: { label: '사망 처리', doneLabel: '사망', isKill: true },
  grandmother: { label: '사망 처리', doneLabel: '사망', isKill: true },
```

- [ ] **Step 5: Compute warnings next to existing block reason**

Inside `action.targets.map((targetId) => { ... })`, after `blockReason`, add:

```ts
                      const bmrWarnings = actionConfig.isKill
                        ? getBmrDeathWarnings({
                            roleId: action.roleId,
                            method:
                              action.roleId === 'assassin'
                                ? 'assassin'
                                : action.roleId === 'godfather'
                                  ? 'godfather'
                                  : action.roleId === 'gossip'
                                    ? 'gossip'
                                    : action.roleId === 'gambler'
                                      ? 'gambler'
                                      : action.roleId === 'moonchild'
                                        ? 'moonchild'
                                        : action.roleId === 'grandmother'
                                          ? 'grandmother'
                                          : action.roleId === 'pukka'
                                            ? 'pukka_delayed'
                                            : action.roleId === 'shabaloth'
                                              ? 'shabaloth'
                                              : action.roleId === 'po'
                                                ? 'po'
                                                : action.roleId === 'zombuul'
                                                  ? 'demon'
                                                  : 'manual',
                            timing: 'night',
                            actor: actionPlayer,
                            target: targetPlayer,
                            targetStatuses,
                          })
                        : [];
```

This keeps Phase 1 night-log-only. Execution-specific timing is Phase 2.

- [ ] **Step 6: Render warnings above the action button**

Before the role-specific `if (action.roleId === 'pit_hag')` block, insert:

```tsx
                      const warningBadges =
                        bmrWarnings.length > 0 ? (
                          <View key={`${targetId}-warnings`}>
                            {bmrWarnings.map((warning) => (
                              <View
                                key={warning.kind}
                                style={[
                                  styles.bmrWarningBadge,
                                  warning.severity === 'bypass' &&
                                    styles.bmrWarningBypass,
                                ]}
                              >
                                <Text style={styles.bmrWarningText}>
                                  {warning.message}
                                </Text>
                              </View>
                            ))}
                          </View>
                        ) : null;
```

Then wrap normal kill button rendering in a fragment so warnings appear before the button:

```tsx
                      return (
                        <View key={targetId} style={styles.targetActionGroup}>
                          {warningBadges}
                          <Pressable
                            onPress={() =>
                              handleTargetAction(
                                action,
                                i,
                                targetId,
                                actionConfig,
                              )
                            }
                            style={[
                              styles.killButton,
                              alreadyDone && styles.killButtonDone,
                            ]}
                          >
                            <Text
                              style={[
                                styles.killText,
                                alreadyDone && styles.killTextDone,
                              ]}
                            >
                              {alreadyDone
                                ? `${getPlayerName(targetId)} ${actionConfig.doneLabel}`
                                : `${getPlayerName(targetId)} ${actionConfig.label}`}
                            </Text>
                          </Pressable>
                        </View>
                      );
```

Apply this only to the default target-action return at the bottom of the target map. Do not alter Pit-Hag, Cerenovus, Snake Charmer, Fang Gu, Vigormortis, or Bone Collector special branches.

- [ ] **Step 7: Add styles**

In `apps/storyteller/src/components/NightActionLog.styles.ts`, add styles to the returned style object:

```ts
    targetActionGroup: {
      gap: s(6),
    },
    bmrWarningBadge: {
      borderWidth: 1,
      borderColor: 'rgba(209, 170, 105, 0.45)',
      backgroundColor: 'rgba(209, 170, 105, 0.12)',
      borderRadius: s(6),
      paddingHorizontal: s(8),
      paddingVertical: s(5),
    },
    bmrWarningBypass: {
      borderColor: 'rgba(184, 92, 92, 0.5)',
      backgroundColor: 'rgba(184, 92, 92, 0.12)',
    },
    bmrWarningText: {
      color: '#e0ddd8',
      fontSize: s(11),
      lineHeight: s(15),
    },
```

- [ ] **Step 8: Run focused tests**

Run:

```bash
pnpm --filter @clocktower/storyteller test -- src/components/__tests__/nightActionLogSource.test.ts
pnpm --filter @clocktower/storyteller typecheck
```

Expected: both PASS.

- [ ] **Step 9: Commit**

```bash
git add apps/storyteller/src/components/NightActionLog.tsx apps/storyteller/src/components/NightActionLog.styles.ts apps/storyteller/src/components/__tests__/nightActionLogSource.test.ts
git commit -m "feat: 피로물든달 밤 사망 경고 표시"
```

## Task 4: Regression Pass

**Files:**
- Verify only.

- [ ] **Step 1: Run shared tests**

```bash
pnpm --filter @clocktower/shared test
```

Expected: PASS.

- [ ] **Step 2: Run storyteller tests and typecheck**

```bash
pnpm --filter @clocktower/storyteller test
pnpm --filter @clocktower/storyteller typecheck
```

Expected: PASS. Existing warnings are acceptable only if already present before this work.

- [ ] **Step 3: Run full repo checks**

```bash
pnpm lint
pnpm format
pnpm typecheck
```

Expected: all PASS. If `pnpm format` changes files, review `git diff` and commit formatting with the relevant task if it touches only files from that task.

- [ ] **Step 4: Final commit if needed**

If formatting or small cleanup changed files after Task 3, commit them:

```bash
git add packages/shared/src/types.ts packages/shared/src/bmrAdjudication.ts packages/shared/src/index.ts packages/shared/src/__tests__/bmrAdjudication.test.ts apps/storyteller/src/components/NightActionLog.tsx apps/storyteller/src/components/NightActionLog.styles.ts apps/storyteller/src/components/__tests__/nightActionLogSource.test.ts
git commit -m "chore: 피로물든달 판정 경고 정리"
```

Do not stage `.DS_Store` or `aaa/`.

## Post-Phase Decision

After this plan is complete, the next implementation plan should be Phase 2: execution survivability. That phase must address automatic execution before night transition because `apps/server/src/handlers/storyteller.ts` currently calls `game.kill(candidate.playerId)` directly when advancing from day to night.
