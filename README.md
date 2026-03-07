# Clocktower

Blood on the Clocktower (Trouble Brewing 에디션) 디지털 구현체. 스토리텔러와 플레이어가 각각의 앱을 통해 실시간으로 게임을 진행합니다.

## 기술 스택

- **Frontend**: React Native + Expo (iOS/Android/Web)
- **Backend**: Node.js + Express + Socket.io
- **Language**: TypeScript (strict mode)
- **State Management**: Zustand
- **Package Manager**: pnpm workspaces (monorepo)

## 프로젝트 구조

```
clocktower/
├── apps/
│   ├── server/            # 게임 서버 (Express + Socket.io)
│   ├── player/            # 플레이어 앱 (Expo Router)
│   └── storyteller/       # 스토리텔러 앱 (Expo Router)
├── packages/
│   └── shared/            # 공유 타입, 이벤트, 역할 정의
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

### apps/server

게임 상태 관리 및 실시간 동기화를 담당하는 백엔드 서버.

- Socket.io 네임스페이스: `/player`, `/storyteller`
- `GameManager` 클래스로 게임 상태 캡슐화
- QR 코드 생성으로 플레이어 접속 편의 제공
- 인메모리 상태 관리 (DB 없음)
- 포트 3000에서 실행

### apps/player

게임 참가자용 모바일 앱.

- QR 스캔 또는 수동 입력으로 게임 참가
- 페이즈별 UI: 대기 / 밤(능력 사용) / 낮(토론, 밀담) / 투표 / 게임 종료
- 밀담(Whisper) 시스템: 플레이어 간 1:1 메시지
- 자동 재접속 지원
- Zustand 스토어: `playerStore`, `connectionStore`, `whisperStore`

### apps/storyteller

게임 진행자(스토리텔러)용 앱.

- 게임 생성 및 QR 코드 표시
- 역할 자동/수동 배분
- 페이즈 전환 제어 (밤 → 낮 → 투표)
- 밤 페이즈: 역할 순서대로 활성화, 액션 수신, 피드백 전송
- 지명 및 투표 관리
- AsyncStorage로 세션 복구 지원
- Zustand 스토어: `gameStore` (영속), `connectionStore` (영속)

### packages/shared

앱 간 공유되는 타입과 게임 로직.

- `types.ts`: Phase, Team, Role, Player, GameState, NightAction, NightFeedback, WhisperMessage 등
- `events.ts`: Socket.io 이벤트 타입 (ServerToClient, ClientToServer, StorytellerToServer)
- `roles.ts`: Trouble Brewing 역할 21종 정의, 역할 배분 알고리즘, 밤 행동 순서

## 게임 흐름

1. **스토리텔러**가 서버에 접속하여 게임 생성 (게임 코드 + QR 생성)
2. **플레이어**가 QR 스캔 또는 IP + 코드 입력으로 참가
3. 스토리텔러가 역할 배분 (자동 or 수동)
4. 게임 루프: **밤** → **낮** → **투표** → 반복 또는 종료
   - **밤**: 스토리텔러가 역할 순서대로 활성화, 플레이어가 능력 사용, 피드백 전송
   - **낮**: 토론 및 밀담
   - **투표**: 지명 → 과반수 투표로 처형 결정
5. **승리 조건**: 악마 처형 시 마을 승리 / 악 진영이 선 진영 이상이면 악 승리

## 역할 (Trouble Brewing)

| 진영 | 역할 |
|------|------|
| 선한 마을 (13) | 세탁부, 사서, 조사관, 요리사, 감정사, 점쟁이, 장의사, 수도승, 까마귀지기, 성녀, 사냥꾼, 군인, 시장 |
| 외부인 (4) | 집사, 주정뱅이, 은둔자, 성인 |
| 하수인 (3) | 독살자, 스파이, 붉은 여인 |
| 악마 (1) | 임프 |

## 개발

```bash
# 의존성 설치
pnpm install

# 서버 실행
pnpm --filter @clocktower/server dev

# 플레이어 앱 실행
pnpm --filter @clocktower/player start

# 스토리텔러 앱 실행
pnpm --filter @clocktower/storyteller start
```

## 아키텍처 특징

- **Socket.io 네임스페이스 분리**: 플레이어와 스토리텔러가 별도 네임스페이스로 통신
- **TypeScript 이벤트 타입**: 양방향 소켓 이벤트에 대한 엄격한 타입 정의
- **모노레포 공유 패키지**: 타입 불일치 방지
- **자동 재접속**: playerId + gameCode 기반 세션 복구
- **인메모리 상태**: 별도 DB 없이 서버 메모리에서 관리
- **한국어 UI**: 전체 인터페이스 한국어 지원
