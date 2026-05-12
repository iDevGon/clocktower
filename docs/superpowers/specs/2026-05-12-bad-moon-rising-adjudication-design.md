# Bad Moon Rising Adjudication Design

## Goal

피로 물든 달에서 사망, 생존, 보호, 취함, 중독, 부활이 겹치는 상황을 앱이 자동으로 단정하지 않고, 호스트에게 규칙 근거와 선택지를 제안한 뒤 호스트가 확정하게 한다.

## Assumptions

- 이번 단계의 핵심은 "자동 집행 엔진"이 아니라 "호스트 판정 보조"다.
- 호스트는 최종 판정권을 가진다. 앱은 가능한 결과, 막는 능력, 무시하는 능력, 재량 선택지를 보여준다.
- 기존 `game:kill`, `game:revive`, `player:setStatuses` 이벤트는 유지한다. 새 판정 레이어는 이 이벤트를 호출하기 전 경고와 선택지를 제공한다.
- 기존 TB/S&V 동작을 깨지 않는다. 새로운 판정은 우선 `bad_moon_rising` 에디션 또는 BMR 역할이 관여한 상황에서만 활성화한다.
- BMR 여행자는 이미 구현된 여행자 데이터와 수동 처리를 유지한다. 다만 판사, 부두술사처럼 처형/투표 흐름을 바꾸는 여행자는 별도 후속 작업으로 다룬다.
- "중독/취함이면 능력이 없다"는 기존 원칙을 따른다. 바리스타의 맑음/건강 예외와 거지의 특수 처리는 기존 유틸을 재사용한다.

## Sources

- Bad Moon Rising overview and gameplay: https://wiki.bloodontheclocktower.com/Bad_Moon_Rising
- Grandmother: https://wiki.bloodontheclocktower.com/Grandmother
- Sailor: https://wiki.bloodontheclocktower.com/Sailor
- Innkeeper: https://wiki.bloodontheclocktower.com/Innkeeper
- Devil's Advocate: https://wiki.bloodontheclocktower.com/Devil%27s_Advocate
- Assassin: https://wiki.bloodontheclocktower.com/Assassin
- Zombuul: https://wiki.bloodontheclocktower.com/Zombuul
- Pukka: https://wiki.bloodontheclocktower.com/Pukka
- Shabaloth: https://wiki.bloodontheclocktower.com/Shabaloth
- Po: https://wiki.bloodontheclocktower.com/Po
- Fool: https://wiki.bloodontheclocktower.com/Fool
- Tea Lady: https://wiki.bloodontheclocktower.com/Tea_Lady
- Professor: https://wiki.bloodontheclocktower.com/Professor
- Pacifist: https://wiki.bloodontheclocktower.com/Pacifist
- Tinker: https://wiki.bloodontheclocktower.com/Tinker
- Moonchild: https://wiki.bloodontheclocktower.com/Moonchild
- Godfather: https://wiki.bloodontheclocktower.com/Godfather
- Mastermind: https://wiki.bloodontheclocktower.com/Mastermind
- Goon: https://wiki.bloodontheclocktower.com/Goon
- Gossip: https://wiki.bloodontheclocktower.com/Gossip
- Gambler: https://wiki.bloodontheclocktower.com/Gambler
- Minstrel: https://wiki.bloodontheclocktower.com/Minstrel
- Courtier: https://wiki.bloodontheclocktower.com/Courtier
- Exorcist: https://wiki.bloodontheclocktower.com/Exorcist

## Current Code Shape

- `apps/server/src/game.ts`
  - `kill(playerId)` immediately flips `isAlive` to false.
  - `revive(playerId)` immediately flips `isAlive` to true.
  - night deaths are hidden from players by `pendingNightKills`, then announced at dawn.
  - execution currently kills the execution candidate when moving to night.
- `apps/storyteller/src/components/NightActionLog.tsx`
  - role target buttons call `onKill` or `onSetStatus`.
  - current kill blocking only covers malfunctioning actor, Soldier, and generic `protected`.
- `apps/storyteller/src/components/nightRoleLogic.ts`
  - has pure helpers for malfunctioning ability and simple kill block reason.
  - this is the right short-term location for host UI hints, but larger reusable BMR logic should move to shared.
- `packages/shared/src/types.ts`
  - status vocabulary has generic `drunk`, `poisoned`, `protected`, and `no_ability`.
  - it does not yet represent BMR-specific reminders such as Fool spent, Zombuul registers dead, Pukka poison, Devil's Advocate protection, or Courtier drunkenness duration.

## Design Direction

Use a two-layer model:

1. A pure adjudication layer calculates possible outcomes from current game state and an attempted event.
2. The host UI presents those outcomes and lets the storyteller confirm the actual result.

The app should avoid hidden hard automation for BMR deaths. It should say "이 대상은 죽지 않을 수 있음: 여관 주인 보호, 어릿광대 첫 사망, 찻집 여인 조건" and offer explicit buttons such as `사망`, `생존 처리`, `능력 소모 후 생존`, `부활`, `상태 부여`.

## Core Event Model

Future implementation should introduce a small shared type, not a large rules engine.

```ts
export type DeathTiming = 'day' | 'night';

export type DeathMethod =
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

export interface DeathAttempt {
  timing: DeathTiming;
  method: DeathMethod;
  sourceRoleId?: string;
  actorId?: string;
  targetId: string;
}

export interface AdjudicationSuggestion {
  targetId: string;
  defaultOutcome: 'dies' | 'survives' | 'host_choice';
  reasons: string[];
  warnings: string[];
  consumesStatuses: PlayerStatus[];
  addsStatuses: PlayerStatus[];
  bypassesProtection: boolean;
}
```

The first implementation does not need to persist every `DeathAttempt`. It can compute suggestions at the moment the host presses a kill/execution button.

## Death Blocking Priority

When a target would die, evaluate in this order:

1. Actor malfunction
   - If the acting role is drunk, poisoned, or truly has no ability, the death source usually does nothing.
   - Assassin is still blocked by actor malfunction.
   - Goon still changes alignment and makes the first chooser drunk even if that chooser was already malfunctioning.
2. Protection bypass
   - Assassin kills even if the target could not die, unless Assassin has no ability.
3. Explicit protection
   - Sailor, Innkeeper, Devil's Advocate, Tea Lady, Pacifist, Fool, and generic protected status can prevent death depending on timing and source.
4. Zombuul first death
   - If no other protection has already stopped the death, the first Zombuul death becomes "registers as dead" instead of true death.
5. Actual death
   - If nothing blocks the death, `game:kill` remains the final action.

This order matters because Fool should not spend their once-per-game protection if another protection already prevented the death. Zombuul should not register as dead if an execution was prevented by Devil's Advocate.

## Protection Rules

### Sailor

- If sober and healthy, the Sailor cannot die from any source.
- If the Sailor chose themself or was selected to become drunk, this protection can be absent.
- Host UI should show: `선원은 현재 맑고 건강하면 사망하지 않습니다. 취함 상태라면 사망 처리할 수 있습니다.`

### Innkeeper

- Protects two chosen players at night from any night death source except Assassin.
- One of the two chosen players is drunk until dusk.
- If the Innkeeper is drunk because of their own ability, their ability is absent and neither target is protected.
- Host UI should let the storyteller mark both protected targets and choose the drunk target. If the Innkeeper became drunk, it should warn that both protections fail.

### Devil's Advocate

- Protects one living player from execution death the next day.
- The execution still counts as the day's execution.
- Same target cannot be chosen two nights in a row.
- Cannot choose a Zombuul that registers as dead.
- Host UI should show `처형은 성공하지만 대상은 살아남습니다` when applicable.

### Tea Lady

- If both alive neighbors are good, those two alive neighbors cannot die.
- Protection applies to day and night death, including execution, Demon, Godfather, and Gossip.
- Assassin bypasses this protection.
- Alive neighbors must be recalculated whenever a player dies, revives, changes alignment, or seating changes.

### Pacifist

- If a good player is executed, the storyteller may decide that they do not die.
- This is a host choice, not a deterministic block.
- If the executed player survives, that still consumes the day's execution.
- Host UI should offer `평화주의자로 생존 처리` only when a good player is executed and a sober/healthy Pacifist is active.

### Fool

- The first time the Fool would actually die, they survive and lose the ability.
- If another protection already blocked the death, Fool is not spent.
- If the Fool is drunk or poisoned, the ability does not protect them.
- Host UI should offer `어릿광대 능력 소모 후 생존` and apply `no_ability`.

### Generic Protected Status

- Existing `protected` currently means Monk protection against Demon at night.
- BMR should not overload this single status for every protection. Add specific statuses/reminders for BMR protections rather than making all protection look like Monk protection.

## Death Source Rules

### Demon Kills

- Demon kills are blocked by actor malfunction and applicable target protection.
- Exorcist prevents a chosen Demon from waking to attack, but passive Demon effects may still happen.

### Zombuul

- Acts at night only if nobody died during the day.
- First time the Zombuul would die, they remain alive but register as dead.
- A registering-dead Zombuul counts as dead for most UI and voting purposes, but still keeps the game going and still acts as Demon.
- This requires a new state distinct from `isAlive: false`, otherwise win condition and night action filtering will be wrong.

### Pukka

- Acts on the first night.
- New target is poisoned immediately.
- Previously poisoned target dies after the Pukka attacks again, then becomes healthy.
- If Exorcist prevents Pukka from waking, Pukka does not poison a new target, but previous poison death can still resolve.
- If Innkeeper prevents the delayed death, the target does not die and becomes healthy.
- If Pukka was drunk when choosing a target, that target is not poisoned and will not die from that choice.
- If Pukka was sober when poisoning a target but is drunk on the later night, the target does not die yet; the poison can resume when Pukka becomes sober.

### Shabaloth

- Each night except the first, chooses two players; each chosen player would die.
- Each later night before Shabaloth acts, the storyteller may resurrect one player previously selected by Shabaloth.
- A resurrected player regains their ability, including once-per-game abilities already used.
- The host UI must keep this as optional, not automatic.

### Po

- Each night except the first, Po may choose one player or choose nobody.
- If Po's last actual choice was nobody, Po must choose three players tonight.
- Choosing nobody while drunk or poisoned still makes Po choose three next time.
- Being prevented from waking by Exorcist does not count as choosing nobody.
- If Po chose a player but that player did not die, that does not count as choosing nobody.

### Assassin

- Once per game, at night except the first, kills the chosen player even if they could not otherwise die.
- Actor malfunction prevents the kill.
- If Assassin targets Goon, Goon dies and becomes evil.
- Host UI should mark Assassin spent with `no_ability`.

### Godfather

- If one or more Outsiders died during the day, Godfather chooses one player to die that night.
- Outsider deaths at night do not count.
- Multiple daytime Outsider deaths still grant only one Godfather kill.

### Gossip

- If Gossip made a definite true public statement during the day, the storyteller chooses one player to die that night.
- If Gossip was drunk or poisoned when speaking but sober/healthy when the night trigger resolves, the death can still happen.
- Host UI should record the daytime statement as a reminder and expose a night kill choice only if the host marked it true.

### Gambler

- Each night except the first, chooses a player and guesses a character.
- If the guess is wrong, Gambler dies.
- The app should not auto-check hidden character truth in the first pass. It should show a host confirmation: `추측 실패로 도박사 사망 처리`.

### Tinker

- May die at any time by storyteller choice.
- Cannot die from this ability while protected from death.
- Should not be killed by storyteller fiat if that alone decides the game.

### Moonchild

- When Moonchild learns they died, they publicly chooses one alive player.
- At night, if that player is good, they die.
- If Moonchild is sober/healthy at night, the death can happen even if Moonchild was drunk or poisoned when they chose during the day.
- If Moonchild is drunk or poisoned at night, the target does not die.

### Grandmother

- If the Demon kills the Grandchild, Grandmother dies too.
- If the Grandchild dies by another source, Grandmother does not die from this ability.
- If Grandmother is drunk or poisoned when this would trigger, Grandmother does not die from this ability.

## Resurrection Rules

### Professor

- Once per game, at night except the first, chooses a dead player.
- If the target is a Townsfolk, they revive.
- If the target is not a Townsfolk, nothing happens and Professor's ability is spent.
- Revived Townsfolk regain their ability, including once-per-game abilities.
- Start-knowing or first-night-only abilities may need immediate host handling after revival.

### Shabaloth Regurgitation

- Optional storyteller resurrection of one player selected by Shabaloth on the previous night.
- Can resurrect a player that was alive when attacked and died, or a dead player that was attacked.
- Revived player regains ability.

## Drunkenness and Poisoning Rules

### Sailor

- Each night chooses an alive player.
- Storyteller chooses whether Sailor or the target is drunk until dusk.
- If Sailor is drunk, their cannot-die protection is absent.

### Innkeeper

- Chooses two players.
- Storyteller chooses one of them to become drunk until dusk.
- If the Innkeeper is the drunk one, both protection effects fail.

### Courtier

- Once per game, chooses a character, not a player.
- That character is drunk for three nights and three days, starting immediately.
- If Courtier is drunk or poisoned when choosing, no effect happens and the ability is spent.
- If Courtier later becomes drunk or poisoned, their drunkenness effect pauses while they have no ability and resumes if they recover before duration ends.

### Minstrel

- If a Minion is executed and dies, all other non-Traveller players are drunk until dusk tomorrow.
- If the Minion is executed but does not die, this does not trigger.
- If Minstrel is drunk or poisoned when the Minion dies, this does not trigger.

### Goon

- Each night, the first player who chooses Goon with their own ability becomes drunk immediately until dusk.
- That chooser's ability does not work tonight.
- Goon changes alignment to match that chooser.
- Later players choosing Goon that same night are not blocked by Goon.
- Storyteller-chosen targets do not trigger Goon unless a player actually chose Goon.

## Required New State

Add specific statuses/reminders only as implementation needs them. Recommended first batch:

```ts
type BmrPlayerStatus =
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

`no_ability` can still be used for generic display, but BMR-specific statuses are needed for rules that care about source and duration.

## UI Requirements

### Night Action Log

- Add BMR kill action buttons for `zombuul`, `pukka`, `shabaloth`, `po`, `assassin`, `godfather`, `gossip`, `gambler`, `moonchild`, `grandmother`.
- For each target, show one of:
  - `사망 가능`
  - `보호로 생존 가능`
  - `호스트 선택 필요`
  - `능력 무효로 처리 없음`
  - `암살자는 보호 무시`
- Do not hide the action button just because protection exists. Host must be able to override or choose an alternate legal result.

### Execution Flow

- For BMR games, moving from day to night must not immediately kill the execution candidate without checking BMR survival candidates.
- If the candidate may survive, show a storyteller confirmation modal before applying death.
- The modal should present:
  - execution target
  - possible survival reasons
  - whether the execution still counts
  - buttons: `사망`, `처형 성공 생존`, `취소`

### State Cleanup

- Night-only protections clear at dawn after night deaths resolve.
- Until-dusk drunk statuses clear at dusk.
- Courtier duration decrements by full night/day boundaries, not by arbitrary UI visits.
- Pukka poison persists across nights until death/healthy cleanup or Pukka effect interruption.
- Po no-one state persists until the next actual Po action.

## Implementation Phasing

### Phase 1: Host Warning Layer

- Create pure BMR adjudication helper functions.
- Expand `NightActionLog` kill warnings for BMR roles.
- Add statuses needed only for display and host choices.
- No automatic server death rewrite yet.

### Phase 2: Execution Survivability

- Intercept execution before automatic `game.kill`.
- Support Devil's Advocate, Tea Lady, Pacifist, Fool, Sailor, and Zombuul first-death outcomes.
- Add Minstrel trigger only after an executed Minion actually dies.
- Add Mastermind one-more-day handling after Demon execution.

### Phase 3: Night Death and Resurrection Flow

- Support Pukka delayed poison/death.
- Support Po no-one and three-kill state.
- Support Shabaloth two kills and optional regurgitation.
- Support Assassin protection bypass and spent state.
- Support Professor resurrection and spent state.
- Support Grandmother extra death from Demon-killed Grandchild.

### Phase 4: Daytime Triggers

- Add host reminders for Gossip statement truth, Tinker death, Moonchild public choice, and Godfather Outsider death tracking.
- Keep each as host-confirmed, not hidden automation.

## Verification Targets

- A sober Sailor targeted by a Demon shows a survival warning and is not auto-killed.
- A drunk Sailor targeted by a Demon can be killed.
- A Monk-protected Soldier targeted by a drunk Demon shows actor malfunction before target protection.
- An Assassin targeting a Tea Lady-protected neighbor shows protection bypass and allows death if Assassin is sober/healthy.
- A Devil's Advocate-protected execution target survives while the execution still counts.
- A Fool survives their first actual death and receives a spent marker.
- A Zombuul's first unblocked death registers them as dead without ending the game.
- Pukka poison death is delayed and can be blocked by Innkeeper while clearing poison.
- Po choosing nobody while drunk still creates a three-kill obligation on the next actual Po action.
- A Minion execution that does not kill the Minion does not trigger Minstrel.
- Professor revives only dead Townsfolk and spends ability on use.
- No existing TB/S&V test changes behavior unless the test explicitly opts into BMR adjudication.

## Out of Scope

- Fully automatic legal ruling for every cross-edition jinx.
- Rewriting the full win-condition model in the first implementation step.
- Automatic selection of storyteller-choice deaths for Gossip, Tinker, Shabaloth regurgitation, or Pacifist.
- Player-facing explanation of why someone survived or died. BMR survival reasons should remain storyteller-facing unless explicitly sent as information.
- Visual redesign of the grimoire or night panel.

## Risks

- `isAlive` alone cannot represent a Zombuul that registers as dead but still acts. This needs careful server state work before true Zombuul support.
- Current execution is automatic on phase transition. BMR survivability requires a confirmation step to avoid instantly killing protected targets.
- Using generic `protected` for all protection will create incorrect rulings. Source-specific statuses are safer even if they add more labels.
- Pukka and Courtier duration rules can become complex. The first implementation should surface host warnings before attempting full duration automation.
- BMR has many storyteller-choice effects. Over-automation would make the app confidently wrong, which is worse than manual play.

