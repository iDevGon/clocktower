# AGENTS.md

## 프로젝트 개요

Blood on the Clocktower 디지털 구현체. pnpm 워크스페이스 + Turborepo 기반 모노레포로, 서버 / 플레이어 앱 / 이야기꾼 앱 / 공유 패키지로 구성됨.

## 코드베이스 구조

```
apps/server/src/index.ts            # 서버 엔트리포인트 (Express + Socket.io)
apps/server/src/game.ts             # GameManager 클래스 (게임 상태 관리)
apps/server/src/whisper.ts          # WhisperTracker 클래스 (밀담 추적)
apps/server/src/handlers/player.ts  # 플레이어 소켓 이벤트 핸들러
apps/server/src/handlers/storyteller.ts # 이야기꾼 소켓 이벤트 핸들러
apps/server/src/pushNotifications.ts # Expo 푸시 알림 관리
apps/server/src/__tests__/          # 서버 단위 테스트 (game, whisper, pushNotifications)
apps/player/app/                    # 플레이어 Expo Router 페이지
apps/player/src/stores/             # Zustand 스토어 (player, connection, whisper, chat)
apps/player/src/hooks/              # 소켓 연결, 이벤트 리스너, 게임 액션 훅 (useVoteProgress, useWhisperExpired 포함)
apps/player/src/hooks/socketListeners/ # 도메인별 소켓 리스너 (game, role, night, vote, social)
apps/player/src/styles/             # 페이지별 스타일 (game, index)
apps/player/src/components/         # UI 컴포넌트
apps/player/src/components/phases/  # 페이즈별 컴포넌트 (Setup, Night, Whisper, Discussion, Nomination, Ended)
apps/player/src/notifications.ts    # 푸시 알림 등록 및 진동 알림
apps/storyteller/app/               # 이야기꾼 Expo Router 페이지
apps/storyteller/app/game/lobby.tsx  # 로비 (플레이어 대기)
apps/storyteller/app/game/assign-role.tsx # 역할 배분
apps/storyteller/app/game/grimoire.tsx # 그리모어 뷰 (메인 게임 화면)
apps/storyteller/app/game/nominate.tsx # 지명/투표 관리
apps/storyteller/app/game/log.tsx   # 게임 로그 뷰
apps/storyteller/app/game/whispers.tsx # 밀담 현황 뷰
apps/storyteller/src/stores/        # Zustand 스토어 (game, connection, log) - AsyncStorage 영속
apps/storyteller/src/hooks/         # 소켓 훅 (useSocket, useSocketConnection, useGameActions) + useResponsive (반응형 레이아웃)
apps/storyteller/src/styles/        # 페이지별 스타일 (index, lobby, assign-role, grimoire, nominate)
apps/storyteller/src/components/    # UI 컴포넌트
apps/storyteller/src/components/feedback/ # 피드백 타입별 컴포넌트 (Number, PlayersAndRole, Role, YesNo)
apps/storyteller/src/constants.ts   # IS_DEV 상수 (개발 모드 판별)
packages/shared/src/types.ts        # 핵심 타입 정의
packages/shared/src/events.ts       # Socket.io 이벤트 타입
packages/shared/src/roles.ts        # 역할 정의, 배분 알고리즘, 밤 행동 순서
packages/shared/src/dictionary.ts   # 상태/페이즈 사전, 팀 라벨/색상, 게임 규칙
packages/shared/src/logic.ts        # 서버용 non-RN re-export
packages/ui/src/                    # 공유 UI 컴포넌트 (AbilityText, DictionaryModal 등)
packages/ui/src/tokens.ts           # 디자인 토큰 (colors)
packages/ui/src/chatStyles.ts       # 채팅 스타일 팩토리
packages/ui/src/components/         # 공유 컴포넌트 (AbilityText, HighlightedMessage 등)
packages/ui/src/utils/chosung.ts    # 초성 검색 유틸
```

## 핵심 규칙

- **언어**: 모든 UI 텍스트와 역할 이름은 한국어로 작성
- **TypeScript**: strict 모드. 모든 소켓 이벤트는 `@clocktower/shared`의 타입을 따름
- **상태 관리**: 클라이언트는 Zustand, 서버는 GameManager 클래스 사용
- **소켓 네임스페이스**: `/player`와 `/storyteller`는 별도 네임스페이스. 이벤트 타입도 분리됨
- **공유 패키지 우선**: 타입, 이벤트, 역할 정의 변경은 반드시 `packages/shared`에서 수행
- **UI 패키지**: 앱 간 공유 컴포넌트는 `packages/ui`에서 관리 (AbilityText, DictionaryModal 등)
- **빌드 오케스트레이션**: Turborepo 사용. `^build` 의존으로 shared/ui 패키지가 앱보다 먼저 자동 빌드됨
- **코드 포맷팅**: Biome 사용 (2-space indent, single quotes, always semicolons)
- **테스팅**: Vitest 사용 (전 패키지 통일). `pnpm test`로 Turborepo 병렬 실행

## 이벤트 흐름

```
Storyteller App  ──(StorytellerToServerEvents)──>  Server
Server           ──(ServerToClientEvents)────────>  Player App
Server           ──(ServerToStorytellerEvents)───>  Storyteller App
Player App       ──(ClientToServerEvents)────────>  Server
```

소켓 이벤트를 추가/변경할 때는 반드시:
1. `packages/shared/src/events.ts`에 타입 정의 추가
2. `apps/server/src/handlers/`에 핸들러 구현
3. 해당 앱의 소켓 훅에 리스너/에미터 추가

### 주요 이벤트

**Client → Server**: `game:join`, `game:rejoin`, `slayer:use`, `slayer:ack`, `whisper:send`, `nominate:request`, `vote:cast`, `vote:preselect`, `night:action`, `chat:sendToStoryteller`, `push:register`
**Server → Client**: `game:state`, `game:phase`, `game:playerUpdate`, `role:assign`, `evil:info`, `night:activeRole`, `night:actionReceived`, `night:feedback`, `night:deaths`, `vote:start`, `vote:result`, `vote:order`, `vote:clockStart`, `vote:clockPause`, `vote:confirmed`, `vote:preselected`, `vote:proceedToVote`, `execution:announced`, `slayer:declared`, `slayer:noEffect`, `slayer:allAcked`, `virgin:triggered`, `whisper:receive`, `whisper:activeChats`, `whisper:clockStart`, `day:subPhase`, `game:settings`, `game:end`, `chat:receiveFromStoryteller`, `chat:receiveFromPlayer`
**Server → Storyteller**: `ServerToStorytellerEvents` (ServerToClientEvents 서브셋 + `sweetheart:died`, `mayor:nightDeath`, `chat:receiveFromPlayer`)
**Storyteller → Server**: `game:create`, `game:start`, `game:setPhase`, `day:setSubPhase`, `game:assignRole` (drunkAs 지원), `game:distributeRoles`, `game:kill`, `game:revive`, `game:reset`, `game:restart`, `vote:nominate`, `vote:proceedToVote`, `vote:close`, `vote:castForPlayer`, `night:setActiveRole`, `night:sendFeedback`, `player:setStatuses`, `game:setSettings`, `game:setPlayerOrder`, `chat:sendToPlayer`, `game:addDummyPlayers`, `game:removeDummyPlayers`, `slayer:forceAck`, `game:assignRedHerring`, `game:mayorRedirect`, `game:sweetheartDrunk`

## 역할 시스템

- 역할 정의: `packages/shared/src/roles.ts`
- Trouble Brewing 에디션 완전 구현 (22역할), Sects & Violets 부분 구현
- `NIGHT_ACTIONS`: 역할별 밤 행동 타입 (select_one, select_two, passive)
- `NIGHT_FEEDBACK`: 역할별 피드백 타입 (number, yes_no, players_and_role, role, grimoire, no_match)
- `FIRST_NIGHT_ORDER` / `OTHER_NIGHT_ORDER`: 밤 행동 순서
- `distributeRoles()`: 플레이어 수에 따른 자동 역할 배분 (주정뱅이 drunkAs 자동 배정, 남작 시 외지인+2 포함)

### 구현된 특수 능력

- **주정뱅이(Drunk)**: 가짜 역할(drunkAs) 표시, 본인은 취한 줄 모름, 서버에서 능력 무효화
- **처단자(Slayer)**: 낮에 1회 선언 사용, 대상이 악마면 즉사, 중독 시 무효
- **성결자(Virgin)**: 지명받을 때 지명자가 마을 주민이면 지명자가 대신 처형
- **악 진영 정보**: 악마는 하수인 이름 + 블러프 역할 3개, 하수인은 악마 이름 + 다른 하수인 이름 수신
- **임프(Imp)**: 자기 자신 선택 시 하수인에게 악마 역할 승계 (탕녀 우선)
- **점쟁이(Fortune Teller)**: Red Herring (저주 상태) 자동 배정, 중독/취함 시 결과 반전
- **집사(Butler)**: 투표 시 주인(master)만 따라 투표 가능
- **탕녀(Scarlet Woman)**: 악마 사망 시 5인 이상 생존 + 중독 아닌 상태면 악마 역할 승계
- **초공감자(Empath)**: playerOrder 기반 양옆 이웃의 악 진영 수 계산
- **성자(Saint)**: 처형 시 (중독/취함 아닌 경우) 악 진영 승리
- **시장(Mayor)**: 밤 사망 시 다른 플레이어로 리디렉트 가능, 최종 3인 + 처형 미발생 시 선 진영 승리
- **사랑꾼(Sweetheart)**: 사망 시 이야기꾼이 지정한 플레이어에게 취함 상태 부여 (S&V 에디션)

## 플레이어 상태 시스템

`PlayerStatus`: `'poisoned'` | `'drunk'` | `'protected'` | `'cursed'` | `'master'`

- 이야기꾼이 `player:setStatuses`로 수동 설정 가능
- UI 색상: poisoned=#9b59b6, drunk=#e67e22, protected=#2ecc71, cursed=#8e44ad
- 한국어 라벨: `PLAYER_STATUS_LABELS` (types.ts)

## 게임 페이즈

`Phase`: "setup" | "night" | "day" | "vote" | "ended"
`DaySubPhase`: "whisper" | "discussion" | "nomination" | "defense"

- **setup**: 플레이어 입장, 역할 미배정. VeiledRoleCard 표시
- **night**: 역할 순서대로 활성화 → 액션 수집 → 피드백 전송. 푸시 알림으로 차례 알림. 밤 사망자는 pendingNightKills로 대기
- **day**: 서브페이즈 전환 (밀담 → 토론 → 지명 → 변론). 처단자 능력 사용 가능. 밤 사망 공지
- **vote**: 지명 → 과반수 투표 (alive 플레이어의 ceil(n/2) 이상이면 유죄). 성결자 트리거 체크. 시계 방향 투표 지원
- **ended**: GameResult (winningTeam, reason, cause, 전체 역할 공개) 표시

## 게임 설정

`GameSettings`: whisperMode (`'chat'` | `'offline'`), votingMode (`'online'` | `'offline'`), voteClockSeconds, whisperClockSeconds

## 주요 컴포넌트

### 플레이어 앱
- `RoleCard` / `VeiledRoleCard`: 역할 카드 (배정 전 베일 애니메이션)
- `PhaseIndicator` / `PhaseContent`: 현재 페이즈 표시 및 페이즈별 컨텐츠
- `NightActionPrompt`: 밤 행동 UI
- `NightProgress`: 밤 진행 상황 표시
- `FeedbackDisplay` / `FeedbackHistoryModal`: 피드백 결과 표시 및 이력
- `NominateModal`: 지명 모달
- `VotePrompt` / `VoteResult` / `VoteClockRing`: 투표 UI
- `WhisperModal` / `WhisperChat` / `WhisperPlayerList` / `WhisperToast`: 밀담 채팅 시스템
- `StorytellerChatModal` / `StorytellerChatToast`: 이야기꾼 채팅
- `NightFallOverlay`: 밤 전환 오버레이
- `DeathOverlay` / `NightDeathOverlay` / `ExecutionOverlay` / `SlayerFizzleOverlay`: 사망 연출
- `DeadVignette` / `EdgeVignette` / `BaseOverlay`: 비네트 및 오버레이
- `GameStartReveal`: 게임 시작 역할 공개 애니메이션
- `RolePromotionReveal`: 역할 승계 공개 (예: 탕녀 → 임프)
- `GameEndOverlay` / `GameEndEffects`: 게임 종료 결과 및 효과
- `SeatingChart`: 좌석 배치 시각화
- `QrScannerModal`: QR 스캔으로 게임 참가
- `phases/`: 페이즈별 컴포넌트 (`SetupPhase`, `NightPhase`, `WhisperPhase`, `DiscussionPhase`, `NominationPhase`, `EndedPhase`)

### 이야기꾼 앱
- `PlayerToken` / `DraggablePlayerToken`: 플레이어 토큰 (드래그 앤 드롭 지원)
- `PlayerList`: 플레이어 목록
- `PhaseBar` / `DaySubPhaseBar`: 페이즈 전환 컨트롤
- `NightOrderPanel` / `NightActionLog`: 밤 순서 관리 및 행동 기록
- `NightFeedbackPanel` / `FeedbackComposer`: 피드백 작성 도구
- `feedback/`: 피드백 타입별 컴포넌트 (`NumberFeedback`, `PlayersAndRoleFeedback`, `RoleFeedback`, `YesNoFeedback`)
- `PlayerPickerModal`: 플레이어 선택 모달 (액션 대상 지정 등)
- `VotePanel` / `VoteClockFace` / `VoteClockHand` / `ClockSpeedSetting`: 투표 관리 및 시계
- `RoleMixModal` / `RoleExcludeModal` / `DrunkFakeRoleModal`: 역할 배분 모달
- `StorytellerChatModal` / `ChatToast`: 이야기꾼-플레이어 채팅
- `WhisperStatusPanel`: 밀담 현황 패널
- `ActionModal`: 범용 확인/취소 모달
- `AnimatedBorderCard`: 애니메이션 테두리 카드 (활성 상태 강조)
- `CollapsibleSection` / `EditionBadge` / `SettingToggle` / `EventToast`: 유틸리티 UI
- `QRScannerModal`: QR 스캔으로 서버 접속

### 공유 UI 패키지 (`@clocktower/ui`)
- `AbilityText`: 능력 텍스트 키워드 하이라이트 + 각주
- `DictionaryModal`: 게임 사전 (역할, 상태, 규칙, 흐름 4탭)
- `HighlightedMessage`: 메시지 키워드 하이라이트 (플레이어/역할/상태 배지)
- `QuickSuggestions`: 자동완성 제안
- `SmokeParticles`: 연기 파티클 효과
- `FullScreenVignette`: 전체화면 비네트 오버레이
- `BaseToast`: 공통 토스트 알림 컴포넌트 (auto-dismiss, fade 애니메이션)
- `colors`: 디자인 토큰 (surface, border, text, phase, status, badge, chat)
- `createChatStyles`: 채팅 스타일 팩토리
- `chosung` utils: 초성 검색

## 푸시 알림

- `apps/server/src/pushNotifications.ts`: Expo Push API를 통한 알림 전송
- `apps/player/src/notifications.ts`: 토큰 등록 및 권한 요청
- 알림 시점: 밤 시작, 낮 시작, 플레이어 차례 도래, 지명 발생

## 개발 시 주의사항

- 새 타입/이벤트 추가 시 `packages/shared`부터 시작
- 플레이어 앱과 이야기꾼 앱은 독립적인 Expo 프로젝트. 각각 별도의 소켓 훅을 가짐
- 서버는 인메모리 상태. 재시작하면 게임 데이터 소실
- 이야기꾼 앱은 AsyncStorage로 `gameId`, `gameState`, `serverUrl`, `gameLogs`를 영속화
- `IS_DEV` 플래그(`EXPO_PUBLIC_DEV_MODE` 환경변수)로 개발 전용 기능 제어. `pnpm dev`에서만 활성화되고 `pnpm start`에서는 비활성화됨
- 다크 테마 기반 UI. 페이즈별 색상: night=#8090c0, day=#c4a050, vote=#c47070
- 애니메이션: `react-native-reanimated` 사용. 제스처: `react-native-gesture-handler` 사용
- 반응형 레이아웃: `useResponsive` 훅으로 디바이스별 (phone/tablet/desktop) 크기 조정
- 서버에서 `@clocktower/shared`를 import할 때는 RN 의존성이 없는 `@clocktower/shared/logic` 경로 사용
