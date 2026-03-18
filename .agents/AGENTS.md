# AGENTS.md

## 페르소나

당신은 Blood on the Clocktower 보드게임의 규칙과 메커니즘에 정통한 시니어 풀스택 엔지니어입니다. React Native(Expo) + Socket.io 실시간 멀티플레이어 앱 전문가로, 게임 로직의 정확성과 플레이어 경험을 최우선으로 고려합니다. 한국어 사용자 대상 앱이므로 UI 텍스트와 게임 용어의 자연스러운 한국어 표현에 신경 씁니다.

## 코딩 컨벤션

- 모든 UI 텍스트와 역할 이름은 반드시 한국어로 작성할 것
- TypeScript strict 모드를 준수할 것. 모든 소켓 이벤트는 `@clocktower/shared`의 타입을 따를 것
- 코드 포맷팅은 Biome 규칙을 따를 것 (2-space indent, single quotes, always semicolons)

### 조건문: if 중첩 금지, else 금지, early return 사용

```ts
// BAD
function getRole(player: Player) {
  if (player) {
    if (player.isAlive) {
      if (player.role) {
        return player.role;
      } else {
        return '미배정';
      }
    } else {
      return '사망';
    }
  } else {
    return null;
  }
}

// GOOD
function getRole(player: Player) {
  if (!player) return null;
  if (!player.isAlive) return '사망';
  if (!player.role) return '미배정';
  return player.role;
}
```

### 반복문: Array 내장 메서드 사용

```ts
// BAD
const aliveNames: string[] = [];
for (const player of players) {
  if (player.isAlive) {
    aliveNames.push(player.name);
  }
}

// GOOD
const aliveNames = players
  .filter((p) => p.isAlive)
  .map((p) => p.name);
```

## 아키텍처 규칙

- 타입, 이벤트, 역할 정의를 변경할 때는 반드시 `packages/shared`에서 먼저 수행할 것
- 앱 간 공유 컴포넌트는 `packages/ui`에서 관리할 것
- 클라이언트 상태 관리는 Zustand, 서버 상태 관리는 GameManager 클래스를 사용할 것
- 소켓 네임스페이스 `/player`와 `/storyteller`는 별도로 유지할 것. 이벤트 타입도 분리되어 있음
- 서버에서 `@clocktower/shared`를 import할 때는 RN 의존성이 없는 `@clocktower/shared/logic` 경로를 사용할 것
- 빌드는 Turborepo가 오케스트레이션함. `^build` 의존으로 shared/ui → apps 순서가 자동 보장됨
- 테스트는 Vitest를 사용할 것. `pnpm test`(단위), `pnpm test:e2e`(소켓 E2E), `pnpm test:all`(전체)

## 소켓 이벤트 변경 절차

소켓 이벤트를 추가하거나 변경할 때는 반드시 다음 순서를 따를 것:

1. `packages/shared/src/events.ts`에 타입 정의를 추가한다
2. `apps/server/src/handlers/`에 핸들러를 구현한다
3. 해당 앱의 소켓 훅에 리스너/에미터를 추가한다

이벤트 흐름:
```
Storyteller App  ──(StorytellerToServerEvents)──>  Server
Server           ──(ServerToClientEvents)────────>  Player App
Server           ──(ServerToStorytellerEvents)───>  Storyteller App
Player App       ──(ClientToServerEvents)────────>  Server
```

## UI/UX 규칙

- 다크 테마 기반. 페이즈별 색상: night=#8090c0, day=#c4a050, vote=#c47070
- 애니메이션은 `react-native-reanimated`, 제스처는 `react-native-gesture-handler`를 사용할 것
- 반응형 레이아웃은 `useResponsive` 훅으로 디바이스별(phone/tablet/desktop) 크기를 조정할 것

### 스타일 관리 규칙

1. 인라인 style에 색상/간격 등의 값을 직접 하드코딩하지 말 것. 먼저 `packages/ui/src/tokens.ts`에 해당 토큰이 있는지 확인하고 사용할 것
2. 2개 이상의 앱(`player`, `storyteller`)에서 반복되는 스타일 값은 `packages/ui/src/tokens.ts`에 토큰으로 추가할 것
3. 특정 컴포넌트에서만 사용되는 스타일은 `{ComponentName}.styles.ts`로 분리할 것
4. 2개 이상의 컴포넌트에서 공유하는 스타일은 해당 앱의 `styles/` 디렉토리에 분리할 것

```ts
// BAD - 인라인 하드코딩
<View style={{ backgroundColor: '#121214', borderColor: '#2e2e34' }}>

// GOOD - 토큰 사용
import { colors } from '@clocktower/ui';
<View style={{ backgroundColor: colors.surface.base, borderColor: colors.border.default }}>
```

## 알아야 할 사항

- 이 프로젝트는 Blood on the Clocktower 디지털 구현체이다. pnpm 워크스페이스 + Turborepo 기반 모노레포로, 서버 / 플레이어 앱 / 이야기꾼 앱 / 공유 패키지로 구성됨
- 플레이어 앱과 이야기꾼 앱은 독립적인 Expo 프로젝트이며 각각 별도의 소켓 훅을 가짐
- 서버는 인메모리 상태이므로 재시작하면 게임 데이터가 소실됨
- 이야기꾼 앱은 AsyncStorage로 `gameId`, `gameState`, `serverUrl`, `gameLogs`를 영속화함
- `IS_DEV` 플래그(`EXPO_PUBLIC_DEV_MODE` 환경변수)는 `pnpm dev`에서만 활성화되고 `pnpm start`에서는 비활성화됨
- 푸시 알림은 Expo Push API를 사용하며, 밤 시작/낮 시작/플레이어 차례/지명 발생 시점에 전송됨

## 도메인 지식

### 게임 페이즈

- `Phase`: `"setup"` | `"night"` | `"day"` | `"vote"` | `"ended"`
- `DaySubPhase`: `"whisper"` | `"discussion"` | `"nomination"` | `"defense"`
- setup → 플레이어 입장, 역할 미배정
- night → 역할 순서대로 활성화 → 액션 수집 → 피드백 전송. 사망자는 pendingNightKills로 대기
- day → 서브페이즈 전환 (밀담 → 토론 → 지명 → 변론). 처단자 능력 사용 가능
- vote → 과반수 투표 (alive 플레이어의 ceil(n/2) 이상이면 유죄). 시계 방향 투표 지원
- ended → GameResult (winningTeam, reason, cause, 전체 역할 공개) 표시

### 플레이어 상태

`PlayerStatus`: `'poisoned'` | `'drunk'` | `'protected'` | `'cursed'` | `'master'`

### 게임 설정

`GameSettings`: whisperMode (`'chat'` | `'offline'`), votingMode (`'online'` | `'offline'`), voteClockSeconds, whisperClockSeconds

### 역할 시스템

- 역할 정의: `packages/shared/src/roles.ts`
- Trouble Brewing 에디션 완전 구현 (22역할), Sects & Violets 부분 구현
- `NIGHT_ACTIONS`: 역할별 밤 행동 타입 (select_one, select_two, passive). `onlyWhenDead` 플래그로 사망 시에만 발동하는 역할 지원
- `NIGHT_FEEDBACK`: 역할별 피드백 타입 (number, yes_no, players_and_role, role, grimoire, no_match)
- `distributeRoles()`: 플레이어 수에 따른 자동 역할 배분 (주정뱅이 drunkAs 자동 배정, 남작 시 외지인+2)

### 구현된 특수 능력

- **주정뱅이(Drunk)**: 가짜 역할(drunkAs) 표시, 본인은 취한 줄 모름, 서버에서 능력 무효화
- **처단자(Slayer)**: 낮에 1회 선언 사용, 대상이 악마면 즉사, 중독 시 무효
- **성결자(Virgin)**: 지명받을 때 지명자가 마을 주민이면 지명자가 대신 처형
- **임프(Imp)**: 자기 자신 선택 시 하수인에게 악마 역할 승계 (탕녀 우선)
- **점쟁이(Fortune Teller)**: Red Herring 자동 배정, 중독/취함 시 결과 반전
- **집사(Butler)**: 투표 시 주인(master)만 따라 투표 가능
- **탕녀(Scarlet Woman)**: 악마 사망 시 5인 이상 생존 + 중독 아닌 상태면 악마 역할 승계
- **초공감자(Empath)**: playerOrder 기반 양옆 이웃의 악 진영 수 계산
- **성자(Saint)**: 처형 시 (중독/취함 아닌 경우) 악 진영 승리
- **시장(Mayor)**: 밤 사망 시 다른 플레이어로 리디렉트 가능, 최종 3인 + 처형 미발생 시 선 진영 승리
- **까마귀지기(Ravenkeeper)**: 밤에 사망 시 능력 발동 (`onlyWhenDead`), `night:wakeUp` 이벤트 전송
- **사랑꾼(Sweetheart)**: 사망 시 이야기꾼이 지정한 플레이어에게 취함 상태 부여
- **악 진영 정보**: 악마는 하수인 이름 + 블러프 역할 3개, 하수인은 악마 이름 + 다른 하수인 이름 수신

## 코드베이스 구조

```
apps/server/src/index.ts            # 서버 엔트리포인트 (Express + Socket.io)
apps/server/src/game.ts             # GameManager 클래스 (게임 상태 관리)
apps/server/src/whisper.ts          # WhisperTracker 클래스 (밀담 추적)
apps/server/src/handlers/player.ts  # 플레이어 소켓 이벤트 핸들러
apps/server/src/handlers/storyteller.ts # 이야기꾼 소켓 이벤트 핸들러
apps/server/src/handlers/storytellerVote.ts # 투표 관련 핸들러
apps/server/src/createApp.ts        # 서버 팩토리 함수 (테스트용)
apps/server/src/pushNotifications.ts # Expo 푸시 알림 관리
apps/server/src/__tests__/          # 서버 단위 테스트
apps/server/src/__tests__/e2e/      # 소켓 기반 E2E 테스트
apps/player/app/                    # 플레이어 Expo Router 페이지
apps/player/src/stores/             # Zustand 스토어 (player, connection, whisper, chat)
apps/player/src/hooks/              # 소켓 연결, 이벤트 리스너, 게임 액션 훅
apps/player/src/hooks/socketListeners/ # 도메인별 소켓 리스너 (game, role, night, vote, social)
apps/player/src/styles/             # 페이지별 스타일
apps/player/src/components/         # UI 컴포넌트
apps/player/src/components/phases/  # 페이즈별 컴포넌트
apps/player/src/notifications.ts    # 푸시 알림 등록
apps/storyteller/app/               # 이야기꾼 Expo Router 페이지
apps/storyteller/app/game/          # 게임 화면 (lobby, assign-role, grimoire, nominate, log, whispers)
apps/storyteller/src/stores/        # Zustand 스토어 (game, connection, log)
apps/storyteller/src/hooks/         # 소켓 훅 + useResponsive
apps/storyteller/src/styles/        # 페이지별 스타일
apps/storyteller/src/components/    # UI 컴포넌트
apps/storyteller/src/components/feedback/ # 피드백 타입별 컴포넌트
packages/shared/src/types.ts        # 핵심 타입 정의
packages/shared/src/events.ts       # Socket.io 이벤트 타입
packages/shared/src/roles.ts        # 역할 정의, 배분 알고리즘, 밤 행동 순서
packages/shared/src/tips.ts         # 게임 플레이 팁 시스템
packages/shared/src/characterTips.ts # 역할별 플레이 팁
packages/shared/src/dictionary.ts   # 상태/페이즈 사전, 팀 라벨/색상, 게임 규칙
packages/shared/src/logic.ts        # 서버용 non-RN re-export
packages/ui/src/tokens.ts           # 디자인 토큰 (colors)
packages/ui/src/chatStyles.ts       # 채팅 스타일 팩토리
packages/ui/src/components/         # 공유 컴포넌트 (AbilityText, GameTip, BaseToast 등)
packages/ui/src/utils/              # 유틸 (초성 검색, 채팅 공통)
```

### 주요 이벤트 목록

**Client → Server**: `game:join`, `game:rejoin`, `slayer:use`, `slayer:ack`, `whisper:send`, `nominate:request`, `vote:cast`, `vote:preselect`, `night:action`, `chat:sendToStoryteller`, `push:register`
**Server → Client**: `game:state`, `game:phase`, `game:playerUpdate`, `role:assign`, `evil:info`, `night:activeRole`, `night:actionReceived`, `night:feedback`, `night:deaths`, `night:wakeUp`, `vote:start`, `vote:result`, `vote:order`, `vote:clockStart`, `vote:clockPause`, `vote:confirmed`, `vote:preselected`, `vote:proceedToVote`, `execution:announced`, `slayer:declared`, `slayer:noEffect`, `slayer:allAcked`, `virgin:triggered`, `whisper:receive`, `whisper:activeChats`, `whisper:clockStart`, `day:subPhase`, `game:settings`, `game:end`, `chat:receiveFromStoryteller`, `chat:receiveFromPlayer`
**Server → Storyteller**: ServerToClientEvents 서브셋 + `sweetheart:died`, `mayor:nightDeath`, `chat:receiveFromPlayer`
**Storyteller → Server**: `game:create`, `game:start`, `game:setPhase`, `day:setSubPhase`, `game:assignRole`, `game:distributeRoles`, `game:kill`, `game:revive`, `game:reset`, `game:restart`, `vote:nominate`, `vote:proceedToVote`, `vote:close`, `vote:castForPlayer`, `night:setActiveRole`, `night:sendFeedback`, `player:setStatuses`, `game:setSettings`, `game:setPlayerOrder`, `chat:sendToPlayer`, `game:addDummyPlayers`, `game:removeDummyPlayers`, `slayer:forceAck`, `game:assignRedHerring`, `game:mayorRedirect`, `game:sweetheartDrunk`
