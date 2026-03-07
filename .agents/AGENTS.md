# AGENTS.md

## 프로젝트 개요

Blood on the Clocktower 디지털 구현체. pnpm 워크스페이스 기반 모노레포로, 서버 / 플레이어 앱 / 스토리텔러 앱 / 공유 패키지로 구성됨.

## 코드베이스 구조

```
apps/server/src/index.ts       # 서버 엔트리포인트 (Express + Socket.io)
apps/server/src/game.ts        # GameManager 클래스 (게임 상태 관리)
apps/player/app/               # 플레이어 Expo Router 페이지
apps/player/src/stores/        # Zustand 스토어 (player, connection, whisper)
apps/player/src/hooks/         # useSocket 훅 (소켓 연결 및 이벤트)
apps/player/src/components/    # UI 컴포넌트 (RoleCard, VotePrompt, NightActionPrompt 등)
apps/storyteller/app/          # 스토리텔러 Expo Router 페이지
apps/storyteller/src/stores/   # Zustand 스토어 (game, connection) - AsyncStorage 영속
apps/storyteller/src/hooks/    # useSocket 훅
apps/storyteller/src/components/ # UI 컴포넌트 (PlayerToken, PhaseBar, NightOrderPanel 등)
packages/shared/src/types.ts   # 핵심 타입 정의
packages/shared/src/events.ts  # Socket.io 이벤트 타입
packages/shared/src/roles.ts   # 역할 정의, 배분 알고리즘, 밤 행동 순서
```

## 핵심 규칙

- **언어**: 모든 UI 텍스트와 역할 이름은 한국어로 작성
- **TypeScript**: strict 모드. 모든 소켓 이벤트는 `@clocktower/shared`의 타입을 따름
- **상태 관리**: 클라이언트는 Zustand, 서버는 GameManager 클래스 사용
- **소켓 네임스페이스**: `/player`와 `/storyteller`는 별도 네임스페이스. 이벤트 타입도 분리됨
- **공유 패키지 우선**: 타입, 이벤트, 역할 정의 변경은 반드시 `packages/shared`에서 수행

## 이벤트 흐름

```
Storyteller App  ──(StorytellerToServerEvents)──>  Server
Server           ──(ServerToClientEvents)────────>  Player App
Player App       ──(ClientToServerEvents)────────>  Server
```

소켓 이벤트를 추가/변경할 때는 반드시:
1. `packages/shared/src/events.ts`에 타입 정의 추가
2. `apps/server/src/index.ts`에 핸들러 구현
3. 해당 앱의 `useSocket` 훅에 리스너/에미터 추가

## 역할 시스템

- 역할 정의: `packages/shared/src/roles.ts`
- 현재 Trouble Brewing 에디션만 구현 (21역할)
- `NIGHT_ACTIONS`: 역할별 밤 행동 타입 (select_one, select_two, passive)
- `NIGHT_FEEDBACK`: 역할별 피드백 타입 (number, yes_no, players_and_role, role, grimoire)
- `FIRST_NIGHT_ORDER` / `OTHER_NIGHT_ORDER`: 밤 행동 순서
- `distributeRoles()`: 플레이어 수에 따른 자동 역할 배분

## 게임 페이즈

`Phase`: "setup" | "night" | "day" | "vote" | "ended"

- **setup**: 플레이어 입장, 역할 미배정
- **night**: 역할 순서대로 활성화 → 액션 수집 → 피드백 전송
- **day**: 토론, 밀담(Whisper)
- **vote**: 지명 → 과반수 투표 (alive 플레이어의 ceil(n/2) 이상이면 유죄)
- **ended**: 게임 종료

## 개발 시 주의사항

- 새 타입/이벤트 추가 시 `packages/shared`부터 시작
- 플레이어 앱과 스토리텔러 앱은 독립적인 Expo 프로젝트. 각각 별도의 `useSocket` 훅을 가짐
- 서버는 인메모리 상태. 재시작하면 게임 데이터 소실
- 스토리텔러 앱은 AsyncStorage로 `gameId`, `gameState`, `serverUrl`을 영속화
- `__DEV__` 모드에서 더미 플레이어 추가/삭제 및 페이즈/역할 테스트 가능
- 다크 테마 기반 UI. 페이즈별 색상: night=#8090c0, day=#c4a050, vote=#c47070
