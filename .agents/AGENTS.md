# AGENTS.md

## 프로젝트 개요

Blood on the Clocktower 디지털 구현체. pnpm 워크스페이스 기반 모노레포로, 서버 / 플레이어 앱 / 스토리텔러 앱 / 공유 패키지로 구성됨.

## 코드베이스 구조

```
apps/server/src/index.ts            # 서버 엔트리포인트 (Express + Socket.io)
apps/server/src/game.ts             # GameManager 클래스 (게임 상태 관리)
apps/server/src/handlers/player.ts  # 플레이어 소켓 이벤트 핸들러
apps/server/src/handlers/storyteller.ts # 스토리텔러 소켓 이벤트 핸들러
apps/server/src/pushNotifications.ts # Expo 푸시 알림 관리
apps/player/app/                    # 플레이어 Expo Router 페이지
apps/player/src/stores/             # Zustand 스토어 (player, connection, whisper)
apps/player/src/hooks/              # 소켓 연결 및 이벤트 훅
apps/player/src/components/         # UI 컴포넌트
apps/player/src/notifications.ts    # 푸시 알림 등록 및 진동 알림
apps/storyteller/app/               # 스토리텔러 Expo Router 페이지
apps/storyteller/app/game/log.tsx   # 게임 로그 뷰
apps/storyteller/app/game/whispers.tsx # 밀담 현황 뷰
apps/storyteller/src/stores/        # Zustand 스토어 (game, connection, log) - AsyncStorage 영속
apps/storyteller/src/hooks/         # 소켓 훅 + useResponsive (반응형 레이아웃)
apps/storyteller/src/components/    # UI 컴포넌트
packages/shared/src/types.ts        # 핵심 타입 정의
packages/shared/src/events.ts       # Socket.io 이벤트 타입
packages/shared/src/roles.ts        # 역할 정의, 배분 알고리즘, 밤 행동 순서
```

## 핵심 규칙

- **언어**: 모든 UI 텍스트와 역할 이름은 한국어로 작성
- **TypeScript**: strict 모드. 모든 소켓 이벤트는 `@clocktower/shared`의 타입을 따름
- **상태 관리**: 클라이언트는 Zustand, 서버는 GameManager 클래스 사용
- **소켓 네임스페이스**: `/player`와 `/storyteller`는 별도 네임스페이스. 이벤트 타입도 분리됨
- **공유 패키지 우선**: 타입, 이벤트, 역할 정의 변경은 반드시 `packages/shared`에서 수행
- **코드 포맷팅**: Biome 사용 (2-space indent, single quotes, always semicolons)

## 이벤트 흐름

```
Storyteller App  ──(StorytellerToServerEvents)──>  Server
Server           ──(ServerToClientEvents)────────>  Player App
Player App       ──(ClientToServerEvents)────────>  Server
```

소켓 이벤트를 추가/변경할 때는 반드시:
1. `packages/shared/src/events.ts`에 타입 정의 추가
2. `apps/server/src/handlers/`에 핸들러 구현
3. 해당 앱의 소켓 훅에 리스너/에미터 추가

### 주요 이벤트

**Client → Server**: `slayer:use`, `push:register`
**Server → Client**: `slayer:declared`, `virgin:triggered`, `evil:info`, `whisper:activeChats`, `game:end`
**Storyteller → Server**: `player:setStatuses`, `game:assignRole` (drunkAs 지원), `game:distributeRoles`

## 역할 시스템

- 역할 정의: `packages/shared/src/roles.ts`
- 현재 Trouble Brewing 에디션만 구현 (21역할)
- `NIGHT_ACTIONS`: 역할별 밤 행동 타입 (select_one, select_two, passive)
- `NIGHT_FEEDBACK`: 역할별 피드백 타입 (number, yes_no, players_and_role, role, grimoire, no_match)
- `FIRST_NIGHT_ORDER` / `OTHER_NIGHT_ORDER`: 밤 행동 순서
- `distributeRoles()`: 플레이어 수에 따른 자동 역할 배분 (주정뱅이 drunkAs 자동 배정 포함)

### 구현된 특수 능력

- **주정뱅이(Drunk)**: 가짜 역할(drunkAs) 표시, 본인은 취한 줄 모름, 서버에서 능력 무효화
- **사냥꾼(Slayer)**: 낮에 1회 선언 사용, 대상이 악마면 즉사, 중독 시 무효
- **성녀(Virgin)**: 지명받을 때 지명자가 마을 주민이면 지명자가 대신 처형
- **악 진영 정보**: 악마는 하수인 이름 + 블러프 역할 3개, 하수인은 악마 이름 수신

## 플레이어 상태 시스템

`PlayerStatus`: `'poisoned'` | `'drunk'` | `'protected'` | `'cursed'`

- 스토리텔러가 `player:setStatuses`로 수동 설정 가능
- UI 색상: poisoned=#9b59b6, drunk=#e67e22, protected=#2ecc71, cursed=#9b59b6
- 한국어 라벨: `PLAYER_STATUS_LABELS` (types.ts)

## 게임 페이즈

`Phase`: "setup" | "night" | "day" | "vote" | "ended"

- **setup**: 플레이어 입장, 역할 미배정. VeiledRoleCard 표시
- **night**: 역할 순서대로 활성화 → 액션 수집 → 피드백 전송. 푸시 알림으로 차례 알림
- **day**: 토론, 밀담(Whisper), 사냥꾼 능력 사용 가능
- **vote**: 지명 → 과반수 투표 (alive 플레이어의 ceil(n/2) 이상이면 유죄). 성녀 트리거 체크
- **ended**: GameResult (winningTeam, reason, 전체 역할 공개) 표시

## 주요 컴포넌트

### 플레이어 앱
- `RoleCard` / `VeiledRoleCard`: 역할 카드 (배정 전 베일 애니메이션)
- `AbilityText`: 능력 텍스트 키워드 하이라이트 + 툴팁
- `DeathOverlay` / `DeadVignette`: 사망 연출 (진동, 애니메이션) + 지속 비네트
- `GameEndOverlay`: 승리/패배 결과 + 전체 역할 공개
- `WhisperModal` / `WhisperToast`: 밀담 채팅 + 토스트 알림
- `NightActionPrompt`: 밤 행동 UI
- `FeedbackDisplay`: 피드백 결과 표시

### 스토리텔러 앱
- `PlayerToken` / `DraggablePlayerToken`: 플레이어 토큰 (드래그 앤 드롭 지원)
- `PhaseBar` / `DaySubPhaseBar`: 페이즈 전환 컨트롤
- `NightOrderPanel` / `NightActionLog`: 밤 순서 관리 및 행동 기록
- `NightFeedbackPanel` / `FeedbackComposer`: 피드백 작성 도구
- `VotePanel`: 투표 관리
- `ActionModal`: 범용 확인/취소 모달
- `AnimatedBorderCard`: 애니메이션 테두리 카드 (활성 상태 강조)
- `AbilityText`: 능력 텍스트 키워드 하이라이트 + 툴팁

## 푸시 알림

- `apps/server/src/pushNotifications.ts`: Expo Push API를 통한 알림 전송
- `apps/player/src/notifications.ts`: 토큰 등록 및 권한 요청
- 알림 시점: 밤 시작 🌙, 낮 시작 ☀️, 플레이어 차례 도래

## 개발 시 주의사항

- 새 타입/이벤트 추가 시 `packages/shared`부터 시작
- 플레이어 앱과 스토리텔러 앱은 독립적인 Expo 프로젝트. 각각 별도의 소켓 훅을 가짐
- 서버는 인메모리 상태. 재시작하면 게임 데이터 소실
- 스토리텔러 앱은 AsyncStorage로 `gameId`, `gameState`, `serverUrl`, `gameLogs`를 영속화
- `__DEV__` 모드에서 더미 플레이어 추가/삭제 및 페이즈/역할 테스트 가능
- 다크 테마 기반 UI. 페이즈별 색상: night=#8090c0, day=#c4a050, vote=#c47070
- 애니메이션: `react-native-reanimated` 사용. 제스처: `react-native-gesture-handler` 사용
- 반응형 레이아웃: `useResponsive` 훅으로 디바이스별 (phone/tablet/desktop) 크기 조정
