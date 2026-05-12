# Bad Moon Rising MVP Design

## Goal

피로물든달(Bad Moon Rising)을 에디션으로 선택해 플레이할 수 있도록 직업 데이터, 여행자 데이터, 밤 진행 순서, 기본 밤 행동/피드백, 역할별 팁을 추가한다.

## Assumptions

- 이번 단계는 데이터 중심 MVP다. BMR의 복잡한 사망, 부활, 보호, 취함, 처형 무효, 다중 사망 판정은 자동화하지 않는다.
- 한국어 명칭과 능력 문구는 사용자가 제공한 BMR 직업 매뉴얼 이미지와 밤 순서 이미지를 우선한다.
- 위키는 역할 목록, 규칙 해석, 팁 작성의 보조 자료로 사용한다.
- 기존 TB/S&V 흐름처럼 에디션, 역할 배분, 밤 순서, 플레이어 밤 행동, 호스트 수동 피드백이 동작하면 MVP 성공으로 본다.
- 이미 존재하는 BMR 여행자 5종은 명칭/설명을 재검증하고, 팁은 위키 기준으로 보강한다.

## Sources

- BMR 역할 목록과 게임 성격: https://wiki.bloodontheclocktower.com/Bad_Moon_Rising
- 여행자 역할 목록과 BMR 여행자 구분: https://wiki.bloodontheclocktower.com/Travellers
- 역할별 팁 작성 시 각 역할 하위 문서를 참고한다. 예: `Grandmother`, `Sailor`, `Chambermaid`, `Exorcist`, `Innkeeper`, `Gambler`, `Gossip`, `Courtier`, `Professor`, `Minstrel`, `Tea_Lady`, `Pacifist`, `Fool`, `Goon`, `Lunatic`, `Tinker`, `Moonchild`, `Godfather`, `Devil%27s_Advocate`, `Assassin`, `Mastermind`, `Zombuul`, `Pukka`, `Shabaloth`, `Po`, `Apprentice`, `Matron`, `Voudon`, `Judge`, `Bishop`.

## In Scope

- `bad_moon_rising` 에디션을 정식 에디션 목록에 추가한다.
- BMR 일반 직업 25개를 추가한다.
- BMR 여행자 5개가 에디션에서 노출되는지 확인하고 팁을 보강한다.
- BMR 첫 번째 밤과 두 번째 밤부터의 직업 진행 순서를 추가한다.
- BMR 밤 행동을 기존 입력 모델로 가능한 범위에서 연결한다.
- `포`처럼 대상 수가 1명 또는 3명인 행동을 위해 작은 공용 입력 확장을 추가한다.
- `할머니`처럼 플레이어 1명과 직업 1개를 알려줘야 하는 정보 능력을 위해 작은 공용 피드백 타입을 추가한다.
- 역할별 팁은 모든 BMR 일반 직업과 BMR 여행자에 대해 제공한다.
- 테스트는 shared 데이터, 밤 순서, 여행자, 팁 포함 여부를 검증한다.

## Out of Scope

- 선원/여관 주인/궁정대신/음유시인/평화주의자/어릿광대/악마의 변호사/좀비얼/푸카/사발로스/포 등의 사망, 보호, 부활, 취함, 중독 효과를 서버가 자동 판정하지 않는다.
- 도박사의 역할 추측 성공/실패 자동 사망 판정은 구현하지 않는다.
- 험담꾼, 땜장이, 달의 자손, 대부, 주모자 등의 낮/사망 조건 자동 판정은 구현하지 않는다.
- 미치광이 전용 가짜 악마 흐름과 악마에게 미치광이 선택 대상 전달 자동화는 구현하지 않는다.
- BMR 전용 리마인더 토큰 UI는 구현하지 않는다.

## Role Data

### Townsfolk

| id | name | ability |
| --- | --- | --- |
| `grandmother` | 할머니 | 게임 시작 시, 선한 플레이어 1명과 그의 캐릭터를 알게 됩니다. 악마가 그 플레이어를 죽이면 당신도 사망합니다. |
| `sailor` | 선원 | 매일 밤, 생존한 플레이어 1명을 선택합니다: 당신과 그중 1명은 황혼까지 취합니다. 당신은 사망할 수 없습니다. |
| `chambermaid` | 객실 청소부 | 매일 밤, (당신을 제외하고) 생존한 플레이어 2명을 선택합니다: 그중 몇 명이 오늘 밤 자기 능력으로 인해 자신이 깨어났는지 알게 됩니다. |
| `exorcist` | 구마사제 | 매일 밤*, (지난밤에 선택하지 않은) 플레이어 1명을 선택합니다: 악마를 선택한다면 그 악마는 당신의 정체를 알게 되지만 오늘 밤 깨어나지 않습니다. |
| `innkeeper` | 여관 주인 | 매일 밤*, 플레이어 2명을 선택합니다: 이들은 오늘 밤 사망할 수 없으나, 그중 1명은 황혼까지 취합니다. |
| `gambler` | 도박사 | 매일 밤*, 플레이어 1명을 선택하고 그의 캐릭터를 추측합니다: 추측이 틀리면, 당신은 사망합니다. |
| `gossip` | 험담꾼 | 매일 낮, 당신은 공개 발언을 할 수 있습니다. 오늘 밤, 그 발언이 사실이었다면 플레이어 1명이 사망합니다. |
| `courtier` | 궁정대신 | 게임당 1번, 밤에 캐릭터 1명을 선택합니다: 그 플레이어는 3일 밤낮 동안 취합니다. |
| `professor` | 교수 | 게임당 1번, 밤*에, 사망한 플레이어 1명을 선택합니다: 그 플레이어가 주민이라면, 그 플레이어는 부활합니다. |
| `minstrel` | 음유시인 | 하수인 1명이 처형으로 사망하면, (여행자를 제외하고) 다른 모든 플레이어는 다음 날 황혼까지 취합니다. |
| `tea_lady` | 찻집 여인 | 이웃 생존자 2명이 모두 선한 플레이어라면, 이들은 사망할 수 없습니다. |
| `pacifist` | 평화주의자 | 선한 플레이어가 처형당하면, 그는 사망하지 않을 수도 있습니다. |
| `fool` | 어릿광대 | 당신이 처음으로 사망할 때, 사망하지 않습니다. |

### Outsiders

| id | name | ability |
| --- | --- | --- |
| `goon` | 건달 | 매일 밤, 자기 능력으로 당신을 선택하는 첫 플레이어는 황혼까지 취합니다. 당신은 그 플레이어가 소속한 팀이 됩니다. |
| `lunatic` | 미치광이 | 당신은 악마가 아니지만, 악마라고 착각합니다. 악마는 당신이 누구인지 알고, 밤에 당신이 누구를 선택하는지 알게 됩니다. |
| `tinker` | 땜장이 | 당신은 언제든지 돌연 사망할 수도 있습니다. |
| `moonchild` | 달의 자손 | 당신이 사망했음을 알게 될 때, 생존한 플레이어 1명을 공개적으로 선택합니다. 그가 선한 플레이어라면, 오늘 밤 그는 사망합니다. |

### Minions

| id | name | ability |
| --- | --- | --- |
| `godfather` | 대부 | 게임 시작 시, 어느 외지인이 게임에 참여하는지 알게 됩니다. 낮에 외지인 1명이 사망하면, 그날 밤 플레이어 1명을 선택합니다: 그는 사망합니다. [외지인 -1명 또는 +1명] |
| `devils_advocate` | 악마의 변호사 | 매일 밤, (지난밤에 선택하지 않은) 생존한 플레이어 1명을 선택합니다: 그 플레이어가 내일 처형당하면, 그는 사망하지 않습니다. |
| `assassin` | 암살자 | 게임당 1번, 밤*에, 플레이어 1명을 선택합니다: 그 플레이어는 이유불문 사망합니다. |
| `mastermind` | 주모자 | 악마가 처형으로 사망하면(게임 종료 조건), 하루 더 게임을 진행합니다. 그런 다음, 플레이어 1명이 처형당하면, 그 플레이어가 소속된 팀이 패배합니다. |

### Demons

| id | name | ability |
| --- | --- | --- |
| `zombuul` | 좀비얼 | 매일 밤*, 오늘 낮에 누구도 사망하지 않았다면, 플레이어 1명을 선택합니다: 그는 사망합니다. 당신이 처음으로 사망할 때, 실제로는 생존해 있지만 사망한 상태로 위장합니다. |
| `pukka` | 푸카 | 매일 밤, 플레이어 1명을 선택합니다: 그는 중독됩니다. 이전에 당신이 중독시켰던 플레이어는 사망하고, 건강한 상태가 됩니다. |
| `shabaloth` | 사발로스 | 매일 밤*, 플레이어 2명을 선택합니다: 그들은 사망합니다. 지난밤에 당신이 선택했던 사망한 플레이어를 다시 토해낼 수도 있습니다(살아납니다). |
| `po` | 포 | 매일 밤*, 플레이어 1명을 선택할 수 있습니다. 그는 사망합니다. 이전에 누구도 선택하지 않았다면, 오늘 밤에는 사망할 플레이어 3명을 선택합니다. |

### Travellers

| id | name | ability |
| --- | --- | --- |
| `apprentice` | 수습생 | 당신의 첫 번째 밤에 선한 팀이라면 주민의 능력을, 악한 팀이라면 하수인의 능력을 얻습니다. |
| `matron` | 가정교사 | 매일 낮, 플레이어 2명의 자리를 맞바꿀 수 있습니다(낮마다 총 3번까지 가능). 플레이어들은 자기 자리를 떠나 1:1로 대화할 수 없습니다. |
| `voudon` | 부두술사 | 오직 사망한 플레이어와 당신만 투표할 수 있습니다. 투표 토큰 없이도 투표할 수 있으며, 50% 이상의 찬성표를 요구하지 않습니다. |
| `judge` | 판사 | 게임당 1번, 다른 플레이어가 누군가를 지목했을 때, 이번 처형의 성패를 당신이 단독으로 선택할 수 있습니다. |
| `bishop` | 주교 | 이야기꾼만이 누군가를 지목할 수 있습니다. 매일 낮, 상대 팀 플레이어 1명 이상이 지목되어야 합니다. |

## Night Order

현재 앱의 밤 순서는 역할 chip 배열이다. 이미지의 `황혼`, `하수인 정보`, `악마 정보`, `새벽` 같은 비역할 안내 단계는 배열에 넣지 않는다. 악한 팀 정보와 블러프 전달은 기존 게임 시작 흐름을 유지한다.

### First Night

```ts
export const BMR_FIRST_NIGHT_ORDER = [
  'sailor',
  'courtier',
  'godfather',
  'devils_advocate',
  'pukka',
  'apprentice',
  'grandmother',
  'chambermaid',
];
```

`apprentice`는 여행자가 실제로 첫 번째 밤을 맞았을 때만 진행자가 사용한다.

### Other Nights

```ts
export const BMR_OTHER_NIGHT_ORDER = [
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

`apprentice`, `gossip`, `tinker`, `moonchild`는 자동 판정보다 진행자 확인용 chip 성격이 강하다.

## Night Actions

MVP의 밤 행동은 "플레이어가 선택값을 제출하고, 진행자가 수동으로 결과를 처리할 수 있게 하는 것"까지만 보장한다.

| role | action |
| --- | --- |
| `sailor` | `select_one`, 생존 플레이어 1명 |
| `chambermaid` | `select_two`, 자신 제외 생존 플레이어 2명 |
| `exorcist` | `select_one`, 플레이어 1명 |
| `innkeeper` | `select_two`, 플레이어 2명 |
| `professor` | `select_one`, 사망 플레이어 선택 가능 |
| `godfather` | `select_one`, 플레이어 1명 |
| `devils_advocate` | `select_one`, 생존 플레이어 1명 |
| `assassin` | `select_one`, 플레이어 1명 |
| `zombuul` | `select_one`, 플레이어 1명 |
| `pukka` | `select_one`, 플레이어 1명 |
| `shabaloth` | `select_two`, 플레이어 2명 |
| `po` | 대상 수 1명 또는 3명을 허용하는 공용 선택 확장 |
| `grandmother` | `passive`, 진행자가 정보 전달 |
| `courtier` | `passive`, 캐릭터 선택은 진행자 수동 처리 |
| `gambler` | `passive`, 플레이어+캐릭터 추측은 진행자 수동 처리 |
| `gossip` | `passive`, 낮 발언 처리 결과를 밤에 진행자 수동 처리 |
| `lunatic` | `passive`, 가짜 악마 흐름은 진행자 수동 처리 |
| `tinker` | `passive`, 임의 사망 여부 진행자 수동 처리 |
| `moonchild` | `passive`, 사망 후 선택 결과 진행자 수동 처리 |
| `apprentice` | `passive`, 획득 능력은 진행자 수동 전달 |

## Night Feedback

| role | feedback |
| --- | --- |
| `grandmother` | 플레이어 1명 + 역할 1개를 전달하는 공용 `player_and_role` 피드백 타입 |
| `chambermaid` | `number` |
| `apprentice` | `role` |

그 외 BMR 역할은 MVP에서 피드백 자동 전송 없이 진행자가 수동으로 처리한다.

## Tips

- `CHARACTER_TIPS` 타입 유니온에 BMR 일반 직업 25개를 추가한다.
- BMR 일반 직업 25개와 BMR 여행자 5개가 모두 `CHARACTER_TIPS`에 있어야 한다.
- 각 역할은 최소 `playTips` 3개, `counterTips` 3개를 갖는다.
- 팁은 위키의 Summary, How to Run, Tips & Tricks, Bluffing sections를 바탕으로 한국어 요약으로 작성한다.
- 기존 BMR 여행자 팁은 위키 기준으로 검토해 부정확하거나 너무 얕은 문장을 보강한다.

## Files

- Modify `packages/shared/src/roles.ts`
  - Add `BAD_MOON_RISING_ROLES`.
  - Add BMR to `EDITIONS`, `EDITION_ROLES`, `ALL_ROLES`, `EDITION_LABELS`, `EDITION_COLORS`.
  - Add `BMR_FIRST_NIGHT_ORDER`, `BMR_OTHER_NIGHT_ORDER`.
  - Update `getNightOrderForEdition`.
  - Add BMR `NIGHT_ACTIONS` and `NIGHT_FEEDBACK`.
- Modify `packages/shared/src/types.ts`
  - Add `allowedTargetCounts?: number[]` to `NightActionDef` for Po.
  - Add `player_and_role` feedback payload for Grandmother feedback.
- Modify `apps/player/src/components/NightActionPrompt.tsx`
  - Support target count 1 or 3 when a `NightActionDef` declares allowed target counts.
- Modify `apps/storyteller/src/components/FeedbackComposer.tsx`
  - Route `player_and_role` feedback.
- Add or modify `apps/storyteller/src/components/feedback/PlayerAndRoleFeedback.tsx`
  - Let host pick one player and one role for Grandmother.
- Modify `apps/player/src/components/FeedbackDisplay.tsx`
  - Render `player_and_role` feedback.
- Modify `packages/shared/src/characterTips.ts`
  - Add BMR role IDs and tips.
- Modify tests:
  - `packages/shared/src/__tests__/roles.test.ts`
  - `packages/shared/src/__tests__/traveller.test.ts`
  - `packages/shared/src/__tests__/tips.test.ts`
  - Add focused player/storyteller component tests for `allowedTargetCounts` and `player_and_role` rendering if the existing package test setup can mount the touched component directly; otherwise cover these via shared type tests and manual UI verification.

## Verification

- `getRolesForEdition('bad_moon_rising')` returns 25 roles.
- BMR team counts are 13 townsfolk, 4 outsiders, 4 minions, 4 demons.
- `EDITIONS` includes `bad_moon_rising`.
- `distributeRoles(..., { editionId: 'bad_moon_rising' })` assigns only BMR regular roles.
- `getTravellersForEdition('bad_moon_rising')` returns the 5 BMR travellers.
- `getNightOrderForEdition('bad_moon_rising', 1)` returns `BMR_FIRST_NIGHT_ORDER`.
- `getNightOrderForEdition('bad_moon_rising', 2)` returns `BMR_OTHER_NIGHT_ORDER`.
- Every BMR night order ID resolves via `getRoleById`.
- Every BMR `NIGHT_ACTIONS` key resolves via `getRoleById`.
- `CHARACTER_TIPS` has entries for all 25 BMR roles and 5 BMR travellers.
- `pnpm --filter @clocktower/shared test` passes.
- Full repo checks pass before implementation commit: `pnpm lint`, `pnpm format`, `pnpm typecheck`.

## Risks

- BMR의 핵심 재미는 자동 판정보다 "왜 누가 죽었는지" 추론에 있다. MVP가 수동 처리 중심이면 진행자는 편하지만 완전 자동 게임 엔진은 아니다.
- `미치광이`, `포`, `도박사`, `궁정대신`은 기존 입력 모델과 맞지 않는 부분이 있어 MVP에서는 수동 처리 비중이 높다.
- `할머니` 피드백 타입은 다른 역할에도 재사용 가능한 작은 확장이지만, 플레이어 피드백 렌더링까지 같이 검증해야 한다.
