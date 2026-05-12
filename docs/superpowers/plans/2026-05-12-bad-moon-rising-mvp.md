# Bad Moon Rising MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Bad Moon Rising as a playable data-driven edition with Korean role text, night order, basic action/feedback support, and role tips.

**Architecture:** Keep the implementation in the existing shared-first pattern. `packages/shared/src/roles.ts` owns edition data, role data, night order, action definitions, and feedback definitions; `packages/shared/src/types.ts` owns small protocol extensions; player/storyteller components only render those shared definitions. Server rule automation for BMR deaths, resurrection, drunkenness, and protection remains out of scope.

**Tech Stack:** TypeScript, pnpm workspaces, Vitest, Expo React Native, Socket.IO shared event types.

---

## Source Spec

Use [docs/superpowers/specs/2026-05-12-bad-moon-rising-mvp-design.md](/Users/gonhong/Documents/workspace/clocktower/docs/superpowers/specs/2026-05-12-bad-moon-rising-mvp-design.md) as the source of truth.

## File Map

- `packages/shared/src/roles.ts`: Add BMR regular roles, edition registration, night order, action definitions, and feedback definitions.
- `packages/shared/src/types.ts`: Add `NightActionDef.allowedTargetCounts?: number[]` and `NightFeedbackPayload` variant `{ type: 'player_and_role'; playerName: string; roleName: string }`.
- `packages/shared/src/characterTips.ts`: Add BMR regular role ID union and tips for all BMR regular roles; verify BMR travellers remain covered.
- `packages/shared/src/__tests__/roles.test.ts`: Add BMR role, edition, action, feedback, and night order tests.
- `packages/shared/src/__tests__/tips.test.ts`: Add BMR tip coverage tests.
- `apps/player/src/components/NightActionPrompt.tsx`: Support `allowedTargetCounts` for Po.
- `apps/player/src/components/FeedbackDisplay.tsx`: Render `player_and_role` feedback.
- `apps/player/src/components/__tests__/nightActionPromptScroll.test.ts`: Add source-level test for `allowedTargetCounts` handling.
- `apps/storyteller/src/components/FeedbackComposer.tsx`: Route `player_and_role` feedback.
- `apps/storyteller/src/components/feedback/PlayerAndRoleFeedback.tsx`: New compact composer for Grandmother-style feedback.

## Task 1: Shared BMR Roles, Edition, Night Order

**Files:**
- Modify: `packages/shared/src/roles.ts`
- Modify: `packages/shared/src/__tests__/roles.test.ts`

- [ ] **Step 1: Write failing shared role tests**

In `packages/shared/src/__tests__/roles.test.ts`, extend the import list to include:

```ts
  BAD_MOON_RISING_ROLES,
  BMR_FIRST_NIGHT_ORDER,
  BMR_OTHER_NIGHT_ORDER,
  EDITIONS,
```

Add this test block after the S&V role/night-order tests:

```ts
describe('Bad Moon Rising 역할 정의', () => {
  const bmrRoleIds = [
    'grandmother',
    'sailor',
    'chambermaid',
    'exorcist',
    'innkeeper',
    'gambler',
    'gossip',
    'courtier',
    'professor',
    'minstrel',
    'tea_lady',
    'pacifist',
    'fool',
    'goon',
    'lunatic',
    'tinker',
    'moonchild',
    'godfather',
    'devils_advocate',
    'assassin',
    'mastermind',
    'zombuul',
    'pukka',
    'shabaloth',
    'po',
  ];

  it('BMR 에디션은 25개 역할을 반환한다', () => {
    const roles = getRolesForEdition('bad_moon_rising');
    expect(roles).toHaveLength(25);
    expect(roles.map((r) => r.id)).toEqual(bmrRoleIds);
    expect(roles.every((r) => r.edition === 'bad_moon_rising')).toBe(true);
  });

  it('BMR 역할은 마을주민 13, 외지인 4, 하수인 4, 악마 4로 구성된다', () => {
    expect(BAD_MOON_RISING_ROLES.filter((r) => r.team === 'townsfolk')).toHaveLength(13);
    expect(BAD_MOON_RISING_ROLES.filter((r) => r.team === 'outsider')).toHaveLength(4);
    expect(BAD_MOON_RISING_ROLES.filter((r) => r.team === 'minion')).toHaveLength(4);
    expect(BAD_MOON_RISING_ROLES.filter((r) => r.team === 'demon')).toHaveLength(4);
  });

  it('BMR 에디션 메타데이터가 등록되어 있다', () => {
    expect(EDITIONS.some((edition) => edition.id === 'bad_moon_rising')).toBe(true);
  });

  it('BMR 역할은 한국어 명칭과 설명을 가진다', () => {
    for (const role of BAD_MOON_RISING_ROLES) {
      expect(/[\uac00-\ud7af]/.test(role.name)).toBe(true);
      expect(/[\uac00-\ud7af]/.test(role.ability)).toBe(true);
    }
  });

  it('BMR 에디션으로 배분하면 BMR 역할만 배정된다', () => {
    const result = distributeRoles(makePlayerIds(10), {
      editionId: 'bad_moon_rising',
    });
    expect(result).not.toBeNull();
    if (!result) return;
    expect(result.assignments.every((a) => a.role.edition === 'bad_moon_rising')).toBe(true);
  });
});

describe('BMR 밤 진행 순서', () => {
  it('BMR_FIRST_NIGHT_ORDER에 중복이 없다', () => {
    expect(new Set(BMR_FIRST_NIGHT_ORDER).size).toBe(BMR_FIRST_NIGHT_ORDER.length);
  });

  it('BMR_OTHER_NIGHT_ORDER에 중복이 없다', () => {
    expect(new Set(BMR_OTHER_NIGHT_ORDER).size).toBe(BMR_OTHER_NIGHT_ORDER.length);
  });

  it('BMR 밤 순서의 모든 역할이 조회 가능하다', () => {
    for (const id of [...BMR_FIRST_NIGHT_ORDER, ...BMR_OTHER_NIGHT_ORDER]) {
      expect(getRoleById(id)).toBeDefined();
    }
  });

  it('getNightOrderForEdition이 BMR 순서를 반환한다', () => {
    expect(getNightOrderForEdition('bad_moon_rising', 1)).toEqual(BMR_FIRST_NIGHT_ORDER);
    expect(getNightOrderForEdition('bad_moon_rising', 2)).toEqual(BMR_OTHER_NIGHT_ORDER);
  });
});
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
pnpm --filter @clocktower/shared test -- src/__tests__/roles.test.ts
```

Expected: FAIL because `BAD_MOON_RISING_ROLES`, `BMR_FIRST_NIGHT_ORDER`, and `BMR_OTHER_NIGHT_ORDER` are not exported, and `bad_moon_rising` is not in `EDITIONS`/`EDITION_ROLES`.

- [ ] **Step 3: Add BMR role constants and edition registration**

In `packages/shared/src/roles.ts`, add `BAD_MOON_RISING_ROLES` after `SECTS_AND_VIOLETS_ROLES`. Use the exact role IDs and Korean ability text from the spec:

```ts
export const BAD_MOON_RISING_ROLES: Role[] = [
  {
    id: 'grandmother',
    name: '할머니',
    team: 'townsfolk',
    ability:
      '게임 시작 시, 선한 플레이어 1명과 그의 캐릭터를 알게 됩니다. 악마가 그 플레이어를 죽이면 당신도 사망합니다.',
    edition: 'bad_moon_rising',
  },
  {
    id: 'sailor',
    name: '선원',
    team: 'townsfolk',
    ability:
      '매일 밤, 생존한 플레이어 1명을 선택합니다: 당신과 그중 1명은 황혼까지 취합니다. 당신은 사망할 수 없습니다.',
    edition: 'bad_moon_rising',
  },
  {
    id: 'chambermaid',
    name: '객실 청소부',
    team: 'townsfolk',
    ability:
      '매일 밤, (당신을 제외하고) 생존한 플레이어 2명을 선택합니다: 그중 몇 명이 오늘 밤 자기 능력으로 인해 자신이 깨어났는지 알게 됩니다.',
    edition: 'bad_moon_rising',
  },
  {
    id: 'exorcist',
    name: '구마사제',
    team: 'townsfolk',
    ability:
      '매일 밤*, (지난밤에 선택하지 않은) 플레이어 1명을 선택합니다: 악마를 선택한다면 그 악마는 당신의 정체를 알게 되지만 오늘 밤 깨어나지 않습니다.',
    edition: 'bad_moon_rising',
  },
  {
    id: 'innkeeper',
    name: '여관 주인',
    team: 'townsfolk',
    ability:
      '매일 밤*, 플레이어 2명을 선택합니다: 이들은 오늘 밤 사망할 수 없으나, 그중 1명은 황혼까지 취합니다.',
    edition: 'bad_moon_rising',
  },
  {
    id: 'gambler',
    name: '도박사',
    team: 'townsfolk',
    ability:
      '매일 밤*, 플레이어 1명을 선택하고 그의 캐릭터를 추측합니다: 추측이 틀리면, 당신은 사망합니다.',
    edition: 'bad_moon_rising',
  },
  {
    id: 'gossip',
    name: '험담꾼',
    team: 'townsfolk',
    ability:
      '매일 낮, 당신은 공개 발언을 할 수 있습니다. 오늘 밤, 그 발언이 사실이었다면 플레이어 1명이 사망합니다.',
    edition: 'bad_moon_rising',
  },
  {
    id: 'courtier',
    name: '궁정대신',
    team: 'townsfolk',
    ability:
      '게임당 1번, 밤에 캐릭터 1명을 선택합니다: 그 플레이어는 3일 밤낮 동안 취합니다.',
    edition: 'bad_moon_rising',
  },
  {
    id: 'professor',
    name: '교수',
    team: 'townsfolk',
    ability:
      '게임당 1번, 밤*에, 사망한 플레이어 1명을 선택합니다: 그 플레이어가 주민이라면, 그 플레이어는 부활합니다.',
    edition: 'bad_moon_rising',
  },
  {
    id: 'minstrel',
    name: '음유시인',
    team: 'townsfolk',
    ability:
      '하수인 1명이 처형으로 사망하면, (여행자를 제외하고) 다른 모든 플레이어는 다음 날 황혼까지 취합니다.',
    edition: 'bad_moon_rising',
  },
  {
    id: 'tea_lady',
    name: '찻집 여인',
    team: 'townsfolk',
    ability:
      '이웃 생존자 2명이 모두 선한 플레이어라면, 이들은 사망할 수 없습니다.',
    edition: 'bad_moon_rising',
  },
  {
    id: 'pacifist',
    name: '평화주의자',
    team: 'townsfolk',
    ability: '선한 플레이어가 처형당하면, 그는 사망하지 않을 수도 있습니다.',
    edition: 'bad_moon_rising',
  },
  {
    id: 'fool',
    name: '어릿광대',
    team: 'townsfolk',
    ability: '당신이 처음으로 사망할 때, 사망하지 않습니다.',
    edition: 'bad_moon_rising',
  },
  {
    id: 'goon',
    name: '건달',
    team: 'outsider',
    ability:
      '매일 밤, 자기 능력으로 당신을 선택하는 첫 플레이어는 황혼까지 취합니다. 당신은 그 플레이어가 소속한 팀이 됩니다.',
    edition: 'bad_moon_rising',
  },
  {
    id: 'lunatic',
    name: '미치광이',
    team: 'outsider',
    ability:
      '당신은 악마가 아니지만, 악마라고 착각합니다. 악마는 당신이 누구인지 알고, 밤에 당신이 누구를 선택하는지 알게 됩니다.',
    edition: 'bad_moon_rising',
  },
  {
    id: 'tinker',
    name: '땜장이',
    team: 'outsider',
    ability: '당신은 언제든지 돌연 사망할 수도 있습니다.',
    edition: 'bad_moon_rising',
  },
  {
    id: 'moonchild',
    name: '달의 자손',
    team: 'outsider',
    ability:
      '당신이 사망했음을 알게 될 때, 생존한 플레이어 1명을 공개적으로 선택합니다. 그가 선한 플레이어라면, 오늘 밤 그는 사망합니다.',
    edition: 'bad_moon_rising',
  },
  {
    id: 'godfather',
    name: '대부',
    team: 'minion',
    ability:
      '게임 시작 시, 어느 외지인이 게임에 참여하는지 알게 됩니다. 낮에 외지인 1명이 사망하면, 그날 밤 플레이어 1명을 선택합니다: 그는 사망합니다. [외지인 -1명 또는 +1명]',
    edition: 'bad_moon_rising',
  },
  {
    id: 'devils_advocate',
    name: '악마의 변호사',
    team: 'minion',
    ability:
      '매일 밤, (지난밤에 선택하지 않은) 생존한 플레이어 1명을 선택합니다: 그 플레이어가 내일 처형당하면, 그는 사망하지 않습니다.',
    edition: 'bad_moon_rising',
  },
  {
    id: 'assassin',
    name: '암살자',
    team: 'minion',
    ability:
      '게임당 1번, 밤*에, 플레이어 1명을 선택합니다: 그 플레이어는 이유불문 사망합니다.',
    edition: 'bad_moon_rising',
  },
  {
    id: 'mastermind',
    name: '주모자',
    team: 'minion',
    ability:
      '악마가 처형으로 사망하면(게임 종료 조건), 하루 더 게임을 진행합니다. 그런 다음, 플레이어 1명이 처형당하면, 그 플레이어가 소속된 팀이 패배합니다.',
    edition: 'bad_moon_rising',
  },
  {
    id: 'zombuul',
    name: '좀버얼',
    team: 'demon',
    ability:
      '매일 밤*, 오늘 낮에 누구도 사망하지 않았다면, 플레이어 1명을 선택합니다: 그는 사망합니다. 당신이 처음으로 사망할 때, 실제로는 생존해 있지만 사망한 상태로 위장합니다.',
    edition: 'bad_moon_rising',
  },
  {
    id: 'pukka',
    name: '푸카',
    team: 'demon',
    ability:
      '매일 밤, 플레이어 1명을 선택합니다: 그는 중독됩니다. 이전에 당신이 중독시켰던 플레이어는 사망하고, 건강한 상태가 됩니다.',
    edition: 'bad_moon_rising',
  },
  {
    id: 'shabaloth',
    name: '사발로스',
    team: 'demon',
    ability:
      '매일 밤*, 플레이어 2명을 선택합니다: 그들은 사망합니다. 지난밤에 당신이 선택했던 사망한 플레이어를 다시 토해낼 수도 있습니다(살아납니다).',
    edition: 'bad_moon_rising',
  },
  {
    id: 'po',
    name: '포',
    team: 'demon',
    ability:
      '매일 밤*, 플레이어 1명을 선택할 수 있습니다. 그는 사망합니다. 이전에 누구도 선택하지 않았다면, 오늘 밤에는 사망할 플레이어 3명을 선택합니다.',
    edition: 'bad_moon_rising',
  },
];
```

Update the edition arrays/maps:

```ts
export const EDITIONS: Edition[] = [
  { id: 'trouble_brewing', name: '점철되는 혼란', description: '입문자용 에디션. 21개 역할.' },
  { id: 'sects_and_violets', name: '화단에 꽃피운 이단', description: '중급자용 에디션. 25개 역할.' },
  { id: 'bad_moon_rising', name: '피로 물든 달', description: '중급자용 에디션. 25개 역할.' },
];

export const EDITION_ROLES: Record<string, Role[]> = {
  trouble_brewing: TROUBLE_BREWING_ROLES,
  sects_and_violets: SECTS_AND_VIOLETS_ROLES,
  bad_moon_rising: BAD_MOON_RISING_ROLES,
};

export const ALL_ROLES: Role[] = [
  ...TROUBLE_BREWING_ROLES,
  ...SECTS_AND_VIOLETS_ROLES,
  ...BAD_MOON_RISING_ROLES,
];

export const EDITION_LABELS: Record<string, string> = {
  trouble_brewing: '혼란',
  sects_and_violets: '이단',
  bad_moon_rising: '피달',
};

export const EDITION_COLORS: Record<string, string> = {
  trouble_brewing: '#5dade2',
  sects_and_violets: '#a569bd',
  bad_moon_rising: '#b85c5c',
};
```

- [ ] **Step 4: Add BMR night order constants**

Add after the S&V night order constants:

```ts
export const BMR_FIRST_NIGHT_ORDER: string[] = [
  'sailor',
  'courtier',
  'godfather',
  'devils_advocate',
  'pukka',
  'apprentice',
  'grandmother',
  'chambermaid',
];

export const BMR_OTHER_NIGHT_ORDER: string[] = [
  'sailor',
  'innkeeper',
  'courtier',
  'gambler',
  'devils_advocate',
  'lunatic',
  'exorcist',
  'zombuul',
  'pukka',
  'shabaloth',
  'po',
  'assassin',
  'godfather',
  'professor',
  'gossip',
  'tinker',
  'moonchild',
  'apprentice',
  'grandmother',
  'chambermaid',
];
```

Update `getNightOrderForEdition`:

```ts
export function getNightOrderForEdition(
  editionId: string,
  day: number,
): string[] {
  if (editionId === 'sects_and_violets') {
    return day <= 1 ? SV_FIRST_NIGHT_ORDER : SV_OTHER_NIGHT_ORDER;
  }
  if (editionId === 'bad_moon_rising') {
    return day <= 1 ? BMR_FIRST_NIGHT_ORDER : BMR_OTHER_NIGHT_ORDER;
  }
  return day <= 1 ? FIRST_NIGHT_ORDER : OTHER_NIGHT_ORDER;
}
```

- [ ] **Step 5: Run tests to verify GREEN**

Run:

```bash
pnpm --filter @clocktower/shared test -- src/__tests__/roles.test.ts
```

Expected: PASS for the new BMR role and night order tests, except tests for `NIGHT_ACTIONS`/`NIGHT_FEEDBACK` that are added in Task 2.

- [ ] **Step 6: Commit Task 1**

```bash
git add packages/shared/src/roles.ts packages/shared/src/__tests__/roles.test.ts
git commit -m "feat: 피로물든달 에디션 데이터 추가"
```

## Task 2: BMR Night Actions and Po Target Count

**Files:**
- Modify: `packages/shared/src/types.ts`
- Modify: `packages/shared/src/roles.ts`
- Modify: `packages/shared/src/__tests__/roles.test.ts`
- Modify: `apps/player/src/components/NightActionPrompt.tsx`
- Modify: `apps/player/src/components/__tests__/nightActionPromptScroll.test.ts`

- [ ] **Step 1: Write failing action definition tests**

In `packages/shared/src/__tests__/roles.test.ts`, add:

```ts
describe('BMR 밤 행동 정의', () => {
  it('BMR 밤 행동 역할이 NIGHT_ACTIONS에 정의되어 있다', () => {
    const bmrActionRoles = [
      'sailor',
      'chambermaid',
      'exorcist',
      'innkeeper',
      'professor',
      'godfather',
      'devils_advocate',
      'assassin',
      'zombuul',
      'pukka',
      'shabaloth',
      'po',
      'grandmother',
      'courtier',
      'gambler',
      'gossip',
      'lunatic',
      'tinker',
      'moonchild',
      'apprentice',
    ];
    for (const id of bmrActionRoles) {
      expect(NIGHT_ACTIONS[id]).toBeDefined();
    }
  });

  it('포는 1명 또는 3명을 선택할 수 있다', () => {
    expect(NIGHT_ACTIONS.po?.type).toBe('select_one');
    expect(NIGHT_ACTIONS.po?.allowedTargetCounts).toEqual([1, 3]);
  });

  it('객실 청소부는 자신을 제외한 생존 플레이어 2명을 선택한다', () => {
    expect(NIGHT_ACTIONS.chambermaid).toMatchObject({
      type: 'select_two',
      excludeSelf: true,
    });
  });

  it('교수는 사망 플레이어도 대상으로 선택할 수 있다', () => {
    expect(NIGHT_ACTIONS.professor?.includeDeadTargets).toBe(true);
  });
});
```

In `apps/player/src/components/__tests__/nightActionPromptScroll.test.ts`, add:

```ts
describe('NightActionPrompt allowed target counts', () => {
  it('uses allowedTargetCounts when deciding whether a submission is complete', () => {
    expect(source).toContain('allowedTargetCounts');
    expect(source).toContain('allowedTargetCounts.includes(selected.length)');
  });

  it('uses the largest allowed target count as the selection cap', () => {
    expect(source).toContain('Math.max(...allowedTargetCounts)');
  });
});
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
pnpm --filter @clocktower/shared test -- src/__tests__/roles.test.ts
pnpm --filter @clocktower/player test -- src/components/__tests__/nightActionPromptScroll.test.ts
```

Expected: shared FAIL because BMR actions are missing and `allowedTargetCounts` is not typed/defined; player FAIL because `NightActionPrompt.tsx` does not contain the new logic.

- [ ] **Step 3: Extend `NightActionDef`**

In `packages/shared/src/types.ts`, add:

```ts
  /** 선택 가능한 대상 수 목록. 예: 포는 1명 또는 3명 */
  allowedTargetCounts?: number[];
```

Place it inside `NightActionDef` after `includeDeadTargets?: boolean;`.

- [ ] **Step 4: Add BMR `NIGHT_ACTIONS`**

In `packages/shared/src/roles.ts`, add these entries before the traveller section in `NIGHT_ACTIONS`:

```ts
  // ── Bad Moon Rising ──
  grandmother: {
    type: 'passive',
    instruction: '진행자가 손주 플레이어와 캐릭터를 알려줍니다',
    excludeSelf: false,
  },
  sailor: {
    type: 'select_one',
    instruction: '술을 마실 생존 플레이어 1명을 선택하세요',
    excludeSelf: false,
  },
  chambermaid: {
    type: 'select_two',
    instruction: '오늘 밤 자기 능력으로 깨어났는지 확인할 생존 플레이어 2명을 선택하세요',
    excludeSelf: true,
  },
  exorcist: {
    type: 'select_one',
    instruction: '오늘 밤 깨어나지 못하게 할 플레이어 1명을 선택하세요',
    excludeSelf: true,
  },
  innkeeper: {
    type: 'select_two',
    instruction: '오늘 밤 사망할 수 없게 할 플레이어 2명을 선택하세요',
    excludeSelf: false,
  },
  gambler: {
    type: 'passive',
    instruction: '플레이어와 캐릭터 추측은 진행자가 수동으로 처리합니다',
    excludeSelf: false,
  },
  gossip: {
    type: 'passive',
    instruction: '낮 공개 발언 결과는 진행자가 수동으로 처리합니다',
    excludeSelf: false,
  },
  courtier: {
    type: 'passive',
    instruction: '취하게 할 캐릭터 선택은 진행자가 수동으로 처리합니다',
    excludeSelf: false,
  },
  professor: {
    type: 'select_one',
    instruction: '부활시킬 사망 플레이어를 선택하세요',
    excludeSelf: true,
    includeDeadTargets: true,
  },
  lunatic: {
    type: 'passive',
    instruction: '가짜 악마 행동은 진행자가 수동으로 안내합니다',
    excludeSelf: false,
  },
  tinker: {
    type: 'passive',
    instruction: '돌연 사망 여부는 진행자가 수동으로 처리합니다',
    excludeSelf: false,
  },
  moonchild: {
    type: 'passive',
    instruction: '달의 자손 공개 선택 결과는 진행자가 수동으로 처리합니다',
    excludeSelf: false,
  },
  godfather: {
    type: 'select_one',
    instruction: '외지인이 낮에 사망했다면 죽일 플레이어를 선택하세요',
    excludeSelf: false,
  },
  devils_advocate: {
    type: 'select_one',
    instruction: '내일 처형되어도 사망하지 않을 생존 플레이어를 선택하세요',
    excludeSelf: false,
  },
  assassin: {
    type: 'select_one',
    instruction: '암살할 플레이어를 선택하세요 (1회 사용)',
    excludeSelf: false,
  },
  zombuul: {
    type: 'select_one',
    instruction: '오늘 낮에 아무도 사망하지 않았다면 죽일 플레이어를 선택하세요',
    excludeSelf: false,
  },
  pukka: {
    type: 'select_one',
    instruction: '중독시킬 플레이어를 선택하세요',
    excludeSelf: false,
  },
  shabaloth: {
    type: 'select_two',
    instruction: '죽일 플레이어 2명을 선택하세요',
    excludeSelf: false,
  },
  po: {
    type: 'select_one',
    instruction: '죽일 플레이어 1명 또는, 지난밤 아무도 선택하지 않았다면 3명을 선택하세요',
    excludeSelf: false,
    allowedTargetCounts: [1, 3],
  },
```

- [ ] **Step 5: Support `allowedTargetCounts` in player prompt**

In `apps/player/src/components/NightActionPrompt.tsx`, replace:

```ts
  const maxTargets = actionDef.type === 'select_two' ? 2 : 1;
```

with:

```ts
  const allowedTargetCounts =
    actionDef.allowedTargetCounts ??
    (actionDef.type === 'select_two' ? [2] : [1]);
  const maxTargets = Math.max(...allowedTargetCounts);
```

Replace:

```ts
  const canSubmit = selected.length === maxTargets;
```

with:

```ts
  const canSubmit = allowedTargetCounts.includes(selected.length);
```

- [ ] **Step 6: Run tests to verify GREEN**

Run:

```bash
pnpm --filter @clocktower/shared test -- src/__tests__/roles.test.ts
pnpm --filter @clocktower/player test -- src/components/__tests__/nightActionPromptScroll.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit Task 2**

```bash
git add packages/shared/src/types.ts packages/shared/src/roles.ts packages/shared/src/__tests__/roles.test.ts apps/player/src/components/NightActionPrompt.tsx apps/player/src/components/__tests__/nightActionPromptScroll.test.ts
git commit -m "feat: 피로물든달 밤 행동 정의 추가"
```

## Task 3: Grandmother `player_and_role` Feedback

**Files:**
- Modify: `packages/shared/src/types.ts`
- Modify: `packages/shared/src/roles.ts`
- Modify: `packages/shared/src/__tests__/roles.test.ts`
- Create: `apps/storyteller/src/components/feedback/PlayerAndRoleFeedback.tsx`
- Modify: `apps/storyteller/src/components/FeedbackComposer.tsx`
- Modify: `apps/player/src/components/FeedbackDisplay.tsx`

- [ ] **Step 1: Write failing shared feedback tests**

In `packages/shared/src/__tests__/roles.test.ts`, add:

```ts
describe('BMR 밤 피드백 정의', () => {
  it('할머니는 플레이어와 역할 피드백을 사용한다', () => {
    expect(NIGHT_FEEDBACK.grandmother?.type).toBe('player_and_role');
  });

  it('객실 청소부는 숫자 피드백을 사용한다', () => {
    expect(NIGHT_FEEDBACK.chambermaid?.type).toBe('number');
  });

  it('수습생은 역할 피드백을 사용한다', () => {
    expect(NIGHT_FEEDBACK.apprentice?.type).toBe('role');
  });
});
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
pnpm --filter @clocktower/shared test -- src/__tests__/roles.test.ts
```

Expected: FAIL because `player_and_role` is not a `FeedbackType` and `NIGHT_FEEDBACK.grandmother` is missing.

- [ ] **Step 3: Add shared feedback type**

In `packages/shared/src/types.ts`, add `'player_and_role'` to `FeedbackType`:

```ts
  | 'player_and_role'
```

Add this payload variant after `players_and_role`:

```ts
  | { type: 'player_and_role'; playerName: string; roleName: string }
```

- [ ] **Step 4: Add BMR `NIGHT_FEEDBACK` entries**

In `packages/shared/src/roles.ts`, add before the traveller section in `NIGHT_FEEDBACK`:

```ts
  // ── Bad Moon Rising ──
  grandmother: { type: 'player_and_role' },
  chambermaid: { type: 'number' },
```

Leave `apprentice: { type: 'role' }` in the traveller section as-is.

- [ ] **Step 5: Create storyteller feedback composer**

Create `apps/storyteller/src/components/feedback/PlayerAndRoleFeedback.tsx`:

```tsx
import type { NightFeedbackPayload, Player } from '@clocktower/shared';
import { matchQuery } from '@clocktower/ui';
import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';
import { createNightActionLogStyles } from '../NightActionLog.styles';
import { useGameEditionRoles } from './useGameEditionRoles';

function useNightActionLogStyles() {
  const { fontSize } = useResponsive();
  const scale = fontSize.md / 12;
  return useMemo(() => createNightActionLogStyles(scale), [scale]);
}

interface PlayerAndRoleFeedbackProps {
  players: Player[];
  onSend: (fb: NightFeedbackPayload) => void;
}

export function PlayerAndRoleFeedback({
  players,
  onSend,
}: PlayerAndRoleFeedbackProps) {
  const styles = useNightActionLogStyles();
  const [selectedPlayerName, setSelectedPlayerName] = useState<string | null>(null);
  const [selectedRoleName, setSelectedRoleName] = useState<string | null>(null);
  const [playerQuery, setPlayerQuery] = useState('');
  const [roleQuery, setRoleQuery] = useState('');
  const gameRoles = useGameEditionRoles(players);

  const filteredPlayers = playerQuery.trim()
    ? players.filter((p) => matchQuery(p.name, playerQuery.trim()))
    : players;
  const filteredRoles = roleQuery.trim()
    ? gameRoles.filter((r) => matchQuery(r.name, roleQuery.trim()))
    : gameRoles;
  const canSend = selectedPlayerName != null && selectedRoleName != null;

  return (
    <View style={styles.composerVertical}>
      <Text style={styles.composerLabel}>플레이어 1명</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="플레이어 검색"
        placeholderTextColor="#5c5a58"
        value={playerQuery}
        onChangeText={setPlayerQuery}
        autoCorrect={false}
      />
      <View style={styles.composerChips}>
        {filteredPlayers.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => setSelectedPlayerName(p.name)}
            style={[
              styles.chip,
              selectedPlayerName === p.name && styles.chipSelected,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                selectedPlayerName === p.name && styles.chipTextSelected,
              ]}
            >
              {p.name}
              {p.role ? ` (${p.role.name})` : ''}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.composerLabel}>역할 1개</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="역할 검색"
        placeholderTextColor="#5c5a58"
        value={roleQuery}
        onChangeText={setRoleQuery}
        autoCorrect={false}
      />
      <View style={styles.composerChips}>
        {filteredRoles.map((r) => (
          <Pressable
            key={r.id}
            onPress={() => setSelectedRoleName(r.name)}
            style={[
              styles.chip,
              selectedRoleName === r.name && styles.chipSelected,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                selectedRoleName === r.name && styles.chipTextSelected,
              ]}
            >
              {r.name}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={() => {
          if (!canSend) return;
          onSend({
            type: 'player_and_role',
            playerName: selectedPlayerName as string,
            roleName: selectedRoleName as string,
          });
        }}
        style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
        disabled={!canSend}
      >
        <Text style={styles.sendText}>전송</Text>
      </Pressable>
    </View>
  );
}
```

- [ ] **Step 6: Route composer in `FeedbackComposer`**

In `apps/storyteller/src/components/FeedbackComposer.tsx`, add:

```ts
import { PlayerAndRoleFeedback } from './feedback/PlayerAndRoleFeedback';
```

Add a switch case before `dreamer_info`:

```tsx
    case 'player_and_role':
      return <PlayerAndRoleFeedback players={players} onSend={onSend} />;
```

- [ ] **Step 7: Render feedback in player app**

In `apps/player/src/components/FeedbackDisplay.tsx`, add a case before `players_and_role`:

```tsx
    case 'player_and_role':
      return (
        <View style={bannerStyle}>
          {!compact && <Text style={labelStyle}>진행자 안내</Text>}
          <Text style={sharedStyles.playersText}>
            <Text style={sharedStyles.highlight}>{feedback.playerName}</Text>
          </Text>
          <Text style={sharedStyles.roleText}>
            의 캐릭터는{' '}
            <Text style={sharedStyles.highlight}>{feedback.roleName}</Text>
            입니다
          </Text>
        </View>
      );
```

- [ ] **Step 8: Run tests and typecheck**

Run:

```bash
pnpm --filter @clocktower/shared test -- src/__tests__/roles.test.ts
pnpm --filter @clocktower/player typecheck
pnpm --filter @clocktower/storyteller typecheck
```

Expected: PASS.

- [ ] **Step 9: Commit Task 3**

```bash
git add packages/shared/src/types.ts packages/shared/src/roles.ts packages/shared/src/__tests__/roles.test.ts apps/storyteller/src/components/feedback/PlayerAndRoleFeedback.tsx apps/storyteller/src/components/FeedbackComposer.tsx apps/player/src/components/FeedbackDisplay.tsx
git commit -m "feat: 할머니 밤 정보 피드백 추가"
```

## Task 4: BMR Character Tips

**Files:**
- Modify: `packages/shared/src/characterTips.ts`
- Modify: `packages/shared/src/__tests__/tips.test.ts`

- [ ] **Step 1: Write failing BMR tip coverage tests**

In `packages/shared/src/__tests__/tips.test.ts`, add under `describe('CHARACTER_TIPS 데이터', ...)`:

```ts
  it('Bad Moon Rising 전체 일반 역할의 팁이 정의되어 있다', () => {
    const bmrRoles = [
      'grandmother',
      'sailor',
      'chambermaid',
      'exorcist',
      'innkeeper',
      'gambler',
      'gossip',
      'courtier',
      'professor',
      'minstrel',
      'tea_lady',
      'pacifist',
      'fool',
      'goon',
      'lunatic',
      'tinker',
      'moonchild',
      'godfather',
      'devils_advocate',
      'assassin',
      'mastermind',
      'zombuul',
      'pukka',
      'shabaloth',
      'po',
    ] as const;

    for (const roleId of bmrRoles) {
      expect(CHARACTER_TIPS).toHaveProperty(roleId);
      expect(CHARACTER_TIPS[roleId].playTips.length).toBeGreaterThanOrEqual(3);
      expect(CHARACTER_TIPS[roleId].counterTips.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('Bad Moon Rising 여행자 팁이 정의되어 있다', () => {
    const bmrTravellers = [
      'apprentice',
      'matron',
      'voudon',
      'judge',
      'bishop',
    ] as const;

    for (const roleId of bmrTravellers) {
      expect(CHARACTER_TIPS[roleId].playTips.length).toBeGreaterThanOrEqual(3);
      expect(CHARACTER_TIPS[roleId].counterTips.length).toBeGreaterThanOrEqual(3);
    }
  });
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
pnpm --filter @clocktower/shared test -- src/__tests__/tips.test.ts
```

Expected: FAIL because BMR regular role IDs are not part of `TippedRoleId` and have no `CHARACTER_TIPS` entries.

- [ ] **Step 3: Add BMR role ID union**

In `packages/shared/src/characterTips.ts`, add:

```ts
/** Bad Moon Rising 에디션의 역할 ID */
type BMRRoleId =
  | 'grandmother'
  | 'sailor'
  | 'chambermaid'
  | 'exorcist'
  | 'innkeeper'
  | 'gambler'
  | 'gossip'
  | 'courtier'
  | 'professor'
  | 'minstrel'
  | 'tea_lady'
  | 'pacifist'
  | 'fool'
  | 'goon'
  | 'lunatic'
  | 'tinker'
  | 'moonchild'
  | 'godfather'
  | 'devils_advocate'
  | 'assassin'
  | 'mastermind'
  | 'zombuul'
  | 'pukka'
  | 'shabaloth'
  | 'po';
```

Update:

```ts
type TippedRoleId = TroubleBrewingRoleId | SVRoleId | TravellerRoleId;
```

to:

```ts
type TippedRoleId =
  | TroubleBrewingRoleId
  | SVRoleId
  | BMRRoleId
  | TravellerRoleId;
```

- [ ] **Step 4: Add BMR tips**

Add entries for all `BMRRoleId` keys before the existing BMR traveller section. Each entry must have at least 3 `playTips` and 3 `counterTips`.

Use this exact block as the BMR regular-role tip implementation:

```ts
  grandmother: {
    playTips: [
      '손주는 선한 플레이어와 역할을 동시에 확인해주는 강한 신뢰 축입니다. 손주와 조용히 협력해 정보를 검증하세요.',
      '손주가 악마에게 죽으면 당신도 죽습니다. 손주 정체를 공개할지 숨길지 사망 패턴과 보호 역할을 보고 결정하세요.',
      '밤에 손주와 함께 죽었다면 악마가 손주를 죽였다는 강한 단서입니다. 어떤 악마가 가능한지도 같이 정리하세요.',
    ],
    counterTips: [
      '할머니를 사칭할 때는 악 동료를 손주라고 주장하면 서로를 보호하는 구조를 만들 수 있습니다.',
      '진짜 할머니의 손주를 찾아내면 악마가 두 명을 한 번에 죽이는 압박을 줄 수 있습니다.',
      '손주가 다른 원인으로 죽으면 할머니는 같이 죽지 않습니다. 사망 원인을 흐리면 BMR 악마 추론을 방해할 수 있습니다.',
    ],
  },
  sailor: {
    playTips: [
      '생존 증명은 강력하지만, 스스로 취하면 사망할 수 있습니다. 누구를 선택했는지 기록해 취함 가능성을 설명하세요.',
      '의심스러운 악 플레이어를 선택하면 보통 자신이 취할 수 있습니다. 생존 증명과 취함 리스크를 함께 계산하세요.',
      '처형으로도 죽지 않는다면 큰 신뢰를 얻지만, 악마의 변호사 보호와 구분해야 합니다.',
    ],
    counterTips: [
      '선원이 선택한 플레이어는 취했을 수 있습니다. 그날 정보가 틀렸다면 선원 선택 기록을 확인하세요.',
      '악한 선원 블러프는 처형 생존을 요구받으면 위험합니다. 악마의 변호사와 함께라면 더 그럴듯합니다.',
      '선원이 비주민을 자주 선택했다면 선원 자신이 취했을 가능성이 높아 생존 능력이 약해집니다.',
    ],
  },
  chambermaid: {
    playTips: [
      '정보는 진영이 아니라 밤에 자기 능력으로 깨어났는지를 알려줍니다. 주장한 역할의 밤 행동 여부와 비교하세요.',
      '같은 플레이어를 여러 밤 확인하면 도박사, 궁정대신, 암살자처럼 행동 빈도가 변하는 역할을 잡아낼 수 있습니다.',
      '취하거나 중독된 플레이어도 자기 능력으로 깨어났다면 카운트됩니다. 정보 해석 때 이 점을 분리하세요.',
    ],
    counterTips: [
      '객실 청소부 블러프는 0, 1, 2 중 1이 가장 안전합니다. 한쪽 주장이 틀려도 즉시 들키지 않습니다.',
      '악 팀은 실제 밤 행동을 하는 블러프를 골라 객실 청소부 정보와 맞추면 신뢰를 얻을 수 있습니다.',
      '객실 청소부가 확인한 대상에게 미리 역할을 공개하게 만들면 정보 가치가 낮아집니다.',
    ],
  },
  exorcist: {
    playTips: [
      '악마를 맞히면 그 악마는 밤에 깨어나지 못합니다. 사망자가 줄거나 없어지는 밤을 악마 추적에 활용하세요.',
      '같은 대상을 연속 선택할 수 없으므로 후보군을 번갈아 좁히는 계획이 필요합니다.',
      '악마는 당신이 누구인지 알게 됩니다. 맞힌 뒤에는 다음 밤 사망 위험을 고려해 정보를 빨리 공유하세요.',
    ],
    counterTips: [
      '구마사제가 악마를 막은 밤에는 악마 종류 추론이 흔들립니다. 다른 사망 원인을 강조해 혼란을 줄 수 있습니다.',
      '구마사제 사칭은 밤 사망 감소를 설명하는 데 좋지만 같은 대상 연속 선택 금지를 기억해야 합니다.',
      '악마가 구마사제를 알게 되면 우선 제거하거나, 다른 사망 원인을 만들어 구마사제 정보를 약화시키세요.',
    ],
  },
  innkeeper: {
    playTips: [
      '보호한 2명은 죽지 않지만 그중 1명은 취합니다. 핵심 정보 역할을 보호할 때 정보 오염 가능성도 알려주세요.',
      '사망자가 없는 밤은 보호 성공일 수 있지만 선원, 악마의 변호사, 어릿광대 등과 구분해야 합니다.',
      '악마 후보를 보호 대상에 넣으면 죽음 패턴을 읽기 어려워질 수 있습니다. 보호 목적을 분명히 정하세요.',
    ],
    counterTips: [
      '여관 주인의 보호는 사망을 막지만 취함을 남깁니다. 틀린 정보를 여관 주인 탓으로 돌릴 수 있습니다.',
      '악한 여관 주인 블러프는 사망자가 적은 밤을 자연스럽게 설명합니다.',
      '여관 주인이 보호한 대상 중 하나는 취했을 수 있으므로 그들의 정보 신뢰도를 낮춰 말하세요.',
    ],
  },
  gambler: {
    playTips: [
      '정확히 맞히면 생존하고, 틀리면 죽습니다. 공개 주장과 강하게 맞물리는 플레이어부터 검증하세요.',
      '도박으로 죽었다면 추측이 틀렸다는 정보입니다. 죽기 전 선택과 추측을 남겨 팀이 활용하게 하세요.',
      '너무 안전한 추측만 하면 정보량이 적습니다. 팀에 필요한 의심 지점을 과감히 검증하세요.',
    ],
    counterTips: [
      '악 팀은 도박사의 추측을 유도해 틀리게 만들면 밤 사망을 하나 추가할 수 있습니다.',
      '도박사 블러프는 매일 선택과 역할 추측 기록이 필요합니다. 죽지 않은 이유도 일관되어야 합니다.',
      '도박사가 죽은 밤에는 악마 사망과 구분되도록 사망 원인을 여러 개 제시해 혼란을 줄 수 있습니다.',
    ],
  },
  gossip: {
    playTips: [
      '매일 낮 공개 발언을 할 수 있습니다. 참이면 밤에 추가 사망이 생기므로 검증 가능한 단정문을 고르세요.',
      '험담으로 발생한 죽음은 악마 종류 추론을 흐릴 수 있습니다. 다음날 반드시 어떤 발언을 했는지 공유하세요.',
      '악 팀이 당신을 죽이기 전에 여러 번 정보를 만들 수 있습니다. 초반부터 적극적으로 발언하세요.',
    ],
    counterTips: [
      '험담꾼 사칭은 추가 사망을 자연스럽게 설명합니다. 전날 발언과 사망자를 일관되게 기록하세요.',
      '진짜 험담꾼의 참 발언은 강한 정보입니다. 발언 내용을 왜곡하거나 다른 사망 원인을 강조하세요.',
      '사발로스나 포가 있는 것처럼 보이게 하려면 험담 사망 가능성을 흐리는 것이 좋습니다.',
    ],
  },
  courtier: {
    playTips: [
      '게임당 1번 캐릭터 하나를 3일 밤낮 동안 취하게 합니다. 악마나 핵심 하수인을 맞히면 큰 효과가 있습니다.',
      '능력을 쓴 뒤에는 선택한 캐릭터와 날짜를 기록하세요. 사망자가 줄거나 능력이 멈춘 시점과 연결됩니다.',
      '너무 늦게 쓰면 죽을 수 있습니다. 후보가 2~3개로 좁혀졌을 때 사용하는 것이 좋습니다.',
    ],
    counterTips: [
      '궁정대신이 악마를 맞히면 사망 패턴이 크게 바뀝니다. 다른 보호 역할이나 구마사제 가능성을 섞어 혼란을 주세요.',
      '궁정대신 블러프는 능력 사용 이후 3일 동안의 결과 설명이 필요합니다.',
      '악 팀은 일부러 죽이지 않는 밤을 만들어 궁정대신이 맞혔다고 믿게 만들 수 있습니다.',
    ],
  },
  professor: {
    playTips: [
      '게임당 1번 죽은 주민을 부활시킬 수 있습니다. 공개 정보가 많은 주민을 되살리면 신뢰와 정보가 모두 늘어납니다.',
      '부활이 실패하면 대상이 주민이 아니었거나 당신이 취함/중독일 수 있습니다. 실패 자체도 추론 자료입니다.',
      '악마가 다시 죽일 수 있으므로 부활 대상과 타이밍을 팀과 상의하세요.',
    ],
    counterTips: [
      '교수의 부활은 강한 공개 증거입니다. 교수 후보를 빠르게 제거하거나 취함 가능성을 만들어 두세요.',
      '교수 블러프는 실패를 설명하기 쉽습니다. 대상이 주민이 아니었다거나 자신이 취했다고 주장할 수 있습니다.',
      '죽은 하수인이나 악마를 주민처럼 보이게 만든 뒤 교수 선택을 유도하면 선 팀 시간을 낭비시킬 수 있습니다.',
    ],
  },
  minstrel: {
    playTips: [
      '하수인이 처형으로 죽으면 다음 날 황혼까지 대부분의 플레이어가 취합니다. 그날 정보는 강하게 의심해야 합니다.',
      '하수인 처형 다음날 사망/정보 이상이 생기면 음유시인 발동 가능성을 공개하세요.',
      '자신이 살아있어도 능력은 수동입니다. 처형 기록을 중심으로 팀의 정보 해석을 조정하세요.',
    ],
    counterTips: [
      '음유시인이 있으면 하수인 처형 다음날 선 팀 정보가 흔들립니다. 그 틈에 거짓 정보를 밀어붙이세요.',
      '음유시인 블러프는 잘못된 정보를 설명하기 좋지만, 실제 하수인 처형 시점과 맞아야 합니다.',
      '선 팀이 음유시인을 믿으면 정확한 정보도 버릴 수 있습니다. 하수인 처형 직후 혼란을 키우세요.',
    ],
  },
  tea_lady: {
    playTips: [
      '양쪽 생존 이웃이 모두 선하면 그 이웃들은 사망할 수 없습니다. 처형/밤 공격 생존은 강한 좌석 정보입니다.',
      '자신이 아니라 이웃을 보호합니다. 이웃 두 명의 진영을 추론하는 데 능력 결과를 사용하세요.',
      '가정교사나 여행자 합류로 좌석이 바뀌면 보호 조건도 달라질 수 있습니다.',
    ],
    counterTips: [
      '찻집 여인의 이웃이 죽지 않으면 둘 다 선하다는 인상이 생깁니다. 다른 보호 역할 가능성을 함께 제시하세요.',
      '악한 이웃을 끼워 넣으면 찻집 여인 능력은 작동하지 않습니다. 좌석 변경이 있다면 활용하세요.',
      '찻집 여인 블러프는 이웃 생존을 설명하지만, 이웃 중 악이 드러나면 무너집니다.',
    ],
  },
  pacifist: {
    playTips: [
      '선한 플레이어 처형이 사망하지 않을 수 있습니다. 처형 생존이 나오면 선한 플레이어일 가능성을 검토하세요.',
      '능력은 확정 발동이 아닙니다. 선한 플레이어가 처형으로 죽어도 평화주의자가 없다는 뜻은 아닙니다.',
      '악마의 변호사, 선원, 어릿광대와 처형 생존 원인을 구분해야 합니다.',
    ],
    counterTips: [
      '평화주의자는 처형 생존을 설명하는 좋은 블러프입니다. 악마의 변호사 보호를 숨길 수 있습니다.',
      '선 팀이 평화주의자를 믿으면 처형 실패 대상을 선으로 볼 수 있습니다. 그 판단을 이용하세요.',
      '평화주의자 능력은 선한 플레이어에게만 의미가 있습니다. 악한 플레이어 생존은 다른 원인을 찾아야 합니다.',
    ],
  },
  fool: {
    playTips: [
      '처음 사망할 때 죽지 않습니다. 공개 처형 생존으로 자신을 증명할 수 있지만, 능력은 소모됩니다.',
      '능력 소모 후에는 평범한 주민처럼 죽습니다. 소모 시점을 명확히 기록하세요.',
      '악마 공격을 유도하면 밤 사망을 막고 악마 행동을 낭비시킬 수 있습니다.',
    ],
    counterTips: [
      '어릿광대는 첫 사망만 막습니다. 능력이 빠진 뒤 다시 공격하거나 처형하세요.',
      '어릿광대 블러프는 생존 증명을 요구받기 쉽습니다. 악마의 변호사 보호와 함께라면 설득력이 커집니다.',
      '처형 생존이 어릿광대 때문인지 평화주의자나 악마의 변호사 때문인지 계속 혼동시키세요.',
    ],
  },
  goon: {
    playTips: [
      '매일 밤 당신을 능력으로 처음 선택한 플레이어를 취하게 하고 그 팀이 됩니다. 누가 당신을 선택했는지 추론하세요.',
      '팀이 바뀔 수 있으므로 공개 여부가 중요합니다. 현재 어느 팀에 유리한지 판단하고 움직이세요.',
      '여러 역할이 당신을 대상으로 삼을수록 정보가 복잡해집니다. 밤 선택 주장을 모아 순서를 추정하세요.',
    ],
    counterTips: [
      '건달은 팀이 바뀔 수 있습니다. 현재 선한지 악한지 단정하지 말고 최근 밤 행동을 확인하세요.',
      '악 팀은 건달을 먼저 선택해 악 팀으로 만들 수 있지만, 선택자가 취해 능력이 무효화될 수 있습니다.',
      '건달 블러프는 진영 변화 설명이 필요합니다. 밤마다 누가 선택했는지 일관된 이야기를 준비하세요.',
    ],
  },
  lunatic: {
    playTips: [
      '당신은 악마라고 믿지만 실제 악마가 아닙니다. 사망 패턴이 당신 선택과 맞지 않으면 미치광이를 의심하세요.',
      '악마는 당신이 누구인지 알고 당신 선택을 알 수 있습니다. 당신의 선택이 악마 행동에 이용될 수 있습니다.',
      '모순이 보이면 조용히 기록한 뒤 공개 타이밍을 잡으세요. 너무 빨리 공개하면 악 팀이 조정할 수 있습니다.',
    ],
    counterTips: [
      '미치광이가 있으면 가짜 악마 선택을 실제 사망처럼 보이게 조정할 수 있습니다.',
      '미치광이를 사칭하면 악마가 아닌데 악마 행동을 했다고 설명할 수 있지만, 실제 악마 정보와 충돌하면 위험합니다.',
      '선 팀이 미치광이를 찾으면 실제 악마 후보가 줄어듭니다. 미치광이 선택과 사망의 연결을 흐리세요.',
    ],
  },
  tinker: {
    playTips: [
      '언제든 돌연 사망할 수 있습니다. 자신의 죽음이 악마 정보로 오해되지 않도록 역할을 일부에게 알려두세요.',
      '땜장이 사망은 BMR 악마 추론을 흔듭니다. 사망한 날의 다른 원인과 함께 분석해야 합니다.',
      '능력은 통제할 수 없으므로 토론과 투표에서 적극적으로 기여하세요.',
    ],
    counterTips: [
      '땜장이 사망 가능성은 추가 밤 사망을 설명하는 좋은 도구입니다.',
      '땜장이 블러프는 사망 전까지 검증이 어렵습니다. 하지만 외지인 수와 충돌하지 않아야 합니다.',
      '선 팀이 모든 추가 사망을 땜장이로 넘기면 악마 종류 추론이 늦어집니다.',
    ],
  },
  moonchild: {
    playTips: [
      '사망을 알게 되면 생존 플레이어 1명을 공개 선택합니다. 선한 플레이어를 고르면 그날 밤 죽으므로 신중해야 합니다.',
      '의심스러운 악 플레이어를 선택하면 위험을 줄이면서 정보를 만들 수 있습니다.',
      '선택 이유를 공개하세요. 밤 사망이 발생하면 그 플레이어의 진영 추론에 직접 연결됩니다.',
    ],
    counterTips: [
      '달의 자손 선택으로 생긴 죽음은 악마 사망과 구분해야 합니다. 사망 원인을 일부러 섞어 혼란을 줄 수 있습니다.',
      '악한 플레이어가 달의 자손에게 선택되면 죽지 않습니다. 이를 선함의 증거로 오해하게 만들 수 있습니다.',
      '달의 자손 블러프는 죽은 뒤 공개 선택만 하면 되므로 쉽지만, 결과 사망과 맞아야 합니다.',
    ],
  },
  godfather: {
    playTips: [
      '게임 시작 시 외지인을 압니다. 이 정보로 미치광이, 건달, 땜장이, 달의 자손을 추적하세요.',
      '낮에 외지인이 죽으면 밤에 추가 사망을 만들 수 있습니다. 외지인 처형 타이밍을 악 팀과 맞추세요.',
      '대부가 있으면 외지인 수가 -1 또는 +1 변합니다. 배정 수 혼란을 블러프에 활용하세요.',
    ],
    counterTips: [
      '외지인이 낮에 죽은 다음 밤 추가 사망이 있으면 대부 가능성이 있습니다.',
      '대부는 외지인 정보를 알고 있어 외지인 블러프를 정교하게 공격하거나 보호할 수 있습니다.',
      '대부 블러프는 외지인 목록을 알아야 설득력이 있습니다. 공개된 외지인 주장과 맞추세요.',
    ],
  },
  devils_advocate: {
    playTips: [
      '매일 밤 생존 플레이어 1명을 보호해 다음날 처형되어도 죽지 않게 합니다. 악마나 핵심 악 동료 보호가 강력합니다.',
      '같은 대상을 연속 선택할 수 없습니다. 보호 순서를 미리 계획하세요.',
      '선한 플레이어를 보호해 처형 실패를 만들면 평화주의자나 어릿광대처럼 보이게 할 수 있습니다.',
    ],
    counterTips: [
      '처형됐는데 죽지 않은 악 후보가 있다면 악마의 변호사 보호를 의심하세요.',
      '악마의 변호사 블러프는 처형 생존을 설명하지만 전날 밤 선택 제한을 지켜야 합니다.',
      '보호 대상을 다시 처형하려면 다음날을 노리세요. 같은 대상 연속 보호는 불가능합니다.',
    ],
  },
  assassin: {
    playTips: [
      '게임당 1번 밤에 이유불문 사망을 만듭니다. 보호나 생존 능력을 뚫어야 할 때 사용하세요.',
      '암살 사망은 악마 종류 추론을 크게 흐립니다. 사용한 밤의 사망 수를 악 팀 계획과 맞추세요.',
      '너무 아끼면 죽기 전에 쓰지 못할 수 있습니다. 핵심 정보 역할이 드러났을 때 과감히 사용하세요.',
    ],
    counterTips: [
      '보호 중인 플레이어가 죽으면 암살자 가능성을 검토하세요.',
      '암살자는 1회성입니다. 한 번 강한 추가 사망이 나온 뒤에는 같은 원인이 반복되지 않을 수 있습니다.',
      '암살자 블러프는 사망 수 설명에 좋지만, 언제 능력을 썼는지 기록이 필요합니다.',
    ],
  },
  mastermind: {
    playTips: [
      '악마가 처형되어도 하루 더 게임을 진행시킵니다. 마지막 날 방의 판단을 읽고 선한 플레이어 처형을 유도하세요.',
      '악마 처형 직후 게임이 끝나지 않으면 주모자 존재가 드러납니다. 그 하루가 승부처입니다.',
      '악마를 보호하기보다 악마 처형 이후의 표 흐름을 준비하는 것이 중요합니다.',
    ],
    counterTips: [
      '악마를 처형했는데 게임이 끝나지 않으면 다음 처형이 승패를 결정합니다. 무작정 추가 처형하지 마세요.',
      '주모자가 있을 수 있으면 악마 처형 다음날에는 악한 플레이어를 찾아 처형해야 합니다.',
      '주모자 블러프는 직접 행동이 없으므로 쉽지만, 악마 처형 이후 하루 연장 상황과 맞아야 합니다.',
    ],
  },
  zombuul: {
    playTips: [
      '처음 죽을 때 실제로는 살아있지만 죽은 것처럼 보입니다. 죽은 악마로서 의심 밖에서 움직일 수 있습니다.',
      '낮에 아무도 죽지 않았을 때만 밤에 죽일 수 있습니다. 처형과 다른 낮 사망 여부를 주의 깊게 봐야 합니다.',
      '사망한 척한 뒤에도 악마 후보에서 완전히 벗어나지는 않습니다. 지나친 안심을 유도하세요.',
    ],
    counterTips: [
      '죽은 플레이어도 좀버얼일 수 있습니다. 특히 악마 처형 뒤 게임이 끝나지 않으면 의심하세요.',
      '낮 사망이 있었던 다음 밤에 좀버얼은 죽일 수 없습니다. 사망 패턴으로 다른 악마와 구분하세요.',
      '좀버얼 블러프는 죽은 뒤에도 살아있는 것처럼 행동하지 않아야 합니다. 투표와 대화 흔적이 단서가 됩니다.',
    ],
  },
  pukka: {
    playTips: [
      '매일 밤 새 대상을 중독시키고 이전 중독 대상은 죽고 건강해집니다. 사망이 하루 지연되는 점을 이용하세요.',
      '첫 선택 대상은 바로 죽지 않습니다. 강한 정보 역할을 먼저 중독시켜 정보를 망가뜨리세요.',
      '푸카 사망 패턴은 일정합니다. 다른 추가 사망 원인과 섞어 정체를 숨기세요.',
    ],
    counterTips: [
      '푸카는 전날 중독한 대상이 다음 밤 죽습니다. 죽기 전날 정보가 틀렸는지 확인하세요.',
      '푸카 중독 대상은 죽을 때 건강해집니다. 사망 후 정보 오류를 역추적할 수 있습니다.',
      '푸카 블러프를 상대할 때는 하루 지연 사망 패턴이 실제로 맞는지 날짜별로 정리하세요.',
    ],
  },
  shabaloth: {
    playTips: [
      '매일 밤 2명을 죽입니다. 많은 사망을 통해 선 팀을 압박하지만, 죽은 플레이어를 토해내 부활시킬 수도 있습니다.',
      '이전에 선택한 사망자를 되살릴 수 있다는 점으로 교수나 평화주의자와 혼동을 만들 수 있습니다.',
      '현자나 할머니 손주처럼 죽이면 위험한 대상을 고를 때는 부활 가능성까지 고려하세요.',
    ],
    counterTips: [
      '밤마다 2명씩 죽는 패턴은 사발로스의 강한 단서입니다. 험담, 암살자, 대부 사망과 구분하세요.',
      '사발로스가 고른 죽은 플레이어는 다시 살아날 수 있습니다. 부활이 항상 교수 때문은 아닙니다.',
      '사발로스 블러프는 사망 수가 맞아야 합니다. 너무 적거나 많은 사망은 다른 원인을 함께 설명해야 합니다.',
    ],
  },
  po: {
    playTips: [
      '보통 1명을 죽이지만, 전날 아무도 선택하지 않았다면 다음 밤 3명을 죽일 수 있습니다.',
      '하룻밤 쉬는 선택은 강력하지만 구마사제, 궁정대신, 보호 역할과 혼동될 수 있습니다. 타이밍을 신중히 잡으세요.',
      '3명 사망 밤은 게임을 빠르게 끝낼 수 있습니다. 주모자나 악마의 변호사와 남은 인원 계산을 맞추세요.',
    ],
    counterTips: [
      '사망자가 없는 밤 다음에 3명이 죽으면 포 가능성이 큽니다.',
      '포가 쉬었는지, 구마사제나 궁정대신에게 막혔는지 구분해야 합니다. 전날 밤 행동 주장을 모으세요.',
      '포 블러프는 쉬는 밤과 3킬 밤의 연결이 핵심입니다. 사망자 수 기록이 맞지 않으면 의심하세요.',
    ],
  },
```

- [ ] **Step 5: Verify GREEN**

Run:

```bash
pnpm --filter @clocktower/shared test -- src/__tests__/tips.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit Task 4**

```bash
git add packages/shared/src/characterTips.ts packages/shared/src/__tests__/tips.test.ts
git commit -m "feat: 피로물든달 역할 팁 추가"
```

## Task 5: Final Verification

**Files:**
- No planned code edits. This task verifies the full story.

- [ ] **Step 1: Run shared tests**

```bash
pnpm --filter @clocktower/shared test
```

Expected: PASS.

- [ ] **Step 2: Run player tests and typecheck**

```bash
pnpm --filter @clocktower/player test
pnpm --filter @clocktower/player typecheck
```

Expected: PASS.

- [ ] **Step 3: Run storyteller typecheck**

```bash
pnpm --filter @clocktower/storyteller typecheck
```

Expected: PASS.

- [ ] **Step 4: Run repo checks**

```bash
pnpm lint
pnpm format
pnpm typecheck
```

Expected: all commands PASS.

- [ ] **Step 5: Inspect final diff**

```bash
git status --short
git diff --stat HEAD
```

Expected: only BMR MVP files are modified. Existing untracked `.DS_Store` and `aaa/` remain untracked and must not be committed unless the user explicitly asks.

- [ ] **Step 6: Commit final verification note only if formatting changed files**

If `pnpm format` changed files, commit them with:

```bash
git add <formatted files>
git commit -m "chore: 피로물든달 MVP 정리"
```

If no files changed, do not create a no-op commit.

## Self-Review

- Spec coverage: Task 1 covers BMR edition, regular roles, distribution, and night order. Task 2 covers basic actions and Po target counts. Task 3 covers Grandmother feedback. Task 4 covers BMR regular and traveller tips. Task 5 covers verification.
- Scope: BMR automatic death/protection/resurrection/drunkenness logic remains excluded by design.
- Type consistency: `allowedTargetCounts` is added to `NightActionDef`; `player_and_role` is added to both `FeedbackType` and `NightFeedbackPayload`; `NIGHT_FEEDBACK.grandmother.type` uses the same literal.
- Execution note: follow TDD for each task. Write the failing test, run it, then implement.
