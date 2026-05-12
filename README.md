# Clocktower

Blood on the Clocktower (Trouble Brewing + Sects & Violets 에디션) 디지털 구현체. 이야기꾼과 플레이어가 각각의 앱을 통해 실시간으로 게임을 진행합니다.

## 기술 스택

- **Frontend**: React Native + Expo (iOS/Android/Web)
- **Backend**: Node.js + Express + Socket.io
- **Language**: TypeScript (strict mode)
- **State Management**: Zustand (AsyncStorage 영속화)
- **Package Manager**: pnpm workspaces (monorepo)
- **Build**: Turborepo (의존 패키지 자동 빌드, 캐싱)
- **Animation**: react-native-reanimated, react-native-gesture-handler
- **Push Notifications**: Expo Push API
- **Testing**: Vitest
- **Linter/Formatter**: Biome

## 프로젝트 구조

```
clocktower/
├── apps/
│   ├── server/            # 게임 서버 (Express + Socket.io)
│   ├── player/            # 플레이어 앱 (Expo Router)
│   └── storyteller/       # 이야기꾼 앱 (Expo Router)
├── packages/
│   ├── shared/            # 공유 타입, 이벤트, 역할 정의, 게임 사전
│   └── ui/                # 공유 UI 컴포넌트, 디자인 토큰
├── biome.json             # Biome 린터/포맷터 설정
├── turbo.json             # Turborepo 빌드 파이프라인 설정
└── pnpm-workspace.yaml
```

### apps/server

게임 상태 관리 및 실시간 동기화를 담당하는 백엔드 서버.

- Socket.io 네임스페이스: `/player`, `/storyteller`
- `GameManager` 클래스로 게임 상태 캡슐화
- `WhisperTracker` 클래스로 밀담 대화 추적 (60초 타임아웃)
- 핸들러 분리: `handlers/player.ts`, `handlers/storyteller.ts`, `handlers/storytellerVote.ts` (투표 관련)
- QR 코드 생성으로 플레이어 접속 편의 제공
- 대시보드 페이지 (`/dashboard`): 서버/플레이어/이야기꾼 앱 QR 코드 및 링크 표시, 서버 시작 시 자동 오픈
- Expo Push API를 통한 푸시 알림 전송
- `createApp()` 팩토리 함수로 서버 인스턴스 생성 (E2E 테스트용 프로그래밍 방식 시작/중지)
- 플레이어 퇴장 및 이야기꾼 강퇴 기능
- 인메모리 상태 관리 (DB 없음)
- 포트 3000에서 실행

### apps/player

게임 참가자용 모바일 앱.

- QR 스캔 또는 수동 입력으로 게임 참가
- 페이즈별 UI: 대기(베일 카드) / 밤(능력 사용) / 낮(토론, 밀담, 처단자 선언) / 투표 / 게임 종료
- 밀담(Whisper) 시스템: 플레이어 간 1:1 메시지 + 토스트 알림
- 이야기꾼 채팅: 이야기꾼과 1:1 비공개 메시지
- 사망 연출: 진동 + 풀스크린 오버레이 + 지속 비네트 효과 (처형/밤 사망/처단자 불발 구분)
- 게임 종료 시 전체 역할 공개 오버레이
- 능력 텍스트 키워드 하이라이트 및 각주
- 투표: 시계 방향 투표, 사전선택, 투표 시계, 변론 중 투표 동의(consent) 지원
- 지명 모달: 플레이어가 직접 다른 플레이어를 지명
- 플레이어 자발적 퇴장 기능
- 푸시 알림 (밤 시작, 차례 알림, 지명 발생)
- 자동 재접속 지원
- Zustand 스토어: `playerStore`, `connectionStore`, `whisperStore`, `chatStore`

### apps/storyteller

게임 진행자(이야기꾼)용 앱.

- 게임 생성 및 QR 코드 표시
- 역할 자동/수동 배분 (주정뱅이 가짜 역할 자동 배정, 역할 제외/추가 지원)
- 페이즈 전환 제어 (밤 → 낮 → 투표) + 낮 서브페이즈 (밀담 → 토론 → 지명 → 변론) + 서브페이즈별 타이머
- 밤 페이즈: 역할 순서대로 활성화, 액션 수신, 피드백 전송
- 지명 및 투표 관리 (시계 방향 투표, 투표 시계)
- 플레이어 상태 관리 (중독, 취함, 보호, 저주)
- 드래그 가능한 플레이어 토큰 (grimoire 뷰)
- 게임 로그 뷰 (페이즈별 타임스탬프 기록)
- 밀담 현황 모니터링
- 이야기꾼-플레이어 1:1 채팅
- 게임 설정: 밀담 모드 (채팅/오프라인), 투표 모드 (온라인/오프라인), 시계 속도, 토론/지명/변론 타이머
- 블러프 역할 사전 선택 (역할 배분 시 악마 블러프 3개 지정)
- 플레이어 강퇴 기능
- 반응형 레이아웃 (phone/tablet/desktop)
- AsyncStorage로 세션 복구 지원
- Zustand 스토어: `gameStore` (영속), `connectionStore` (영속), `logStore` (영속)

### packages/shared

앱 간 공유되는 타입과 게임 로직.

- `types.ts`: Phase, DaySubPhase, Team, Role, Player, GameState, NightAction, NightFeedback, WhisperMessage, PlayerStatus, GameResult, GameSettings, StorytellerMessage, DeathReason, ExecutionAnnouncement, Edition 등
- `events.ts`: Socket.io 이벤트 타입 (ServerToClient, ServerToStoryteller, ClientToServer, StorytellerToServer)
- `roles.ts`: Trouble Brewing 역할 22종 + Sects & Violets 25종 + 여행자 15종 (3개 에디션) 정의, 에디션별 역할 배분 알고리즘, 밤 행동 순서, `onlyWhenDead` 지원
- `tips.ts`: 게임 플레이 팁 시스템 (페이즈별/역할별/진영별 팁 제공)
- `characterTips.ts`: TB + S&V 역할별 플레이 팁 및 상대 팁
- `dictionary.ts`: 팀 라벨/색상, 상태/페이즈/서브페이즈 사전, 게임 규칙, 게임 흐름
- `logic.ts`: 서버용 non-RN re-export

### packages/ui

앱 간 공유되는 UI 컴포넌트와 디자인 토큰.

- `AbilityText`: 능력 텍스트 키워드 하이라이트 + 각주
- `DictionaryModal`: 게임 사전 모달 (역할, 상태, 규칙, 흐름)
- `HighlightedMessage`: 메시지 키워드 하이라이트 (플레이어/역할/상태 배지)
- `QuickSuggestions`: 자동완성 제안
- `SmokeParticles`: 연기 파티클 효과
- `GameTip` / `RotatingGameTip`: 게임 팁 표시 (글로우 효과, 자동 회전)
- `FullScreenVignette`: 전체화면 비네트 오버레이
- `BaseToast`: 공통 토스트 알림 (auto-dismiss, fade)
- `RoleTips`: 역할별 플레이 팁 및 상대 팁 표시 (접기/펼치기)
- `CountdownTimer`: 게임 타이머 (일시정지, 만료 표시, 진동 피드백)
- `colors`: 디자인 토큰 (surface, border, text, phase, status, badge, chat)
- `createChatStyles`: 채팅 스타일 팩토리
- `chosung` utils: 초성 검색 유틸
- `chat` utils: 채팅 공통 유틸 (자동완성 후보 생성, 시간 포맷, 제안 적용)

## 게임 흐름

1. **이야기꾼**가 서버에 접속하여 게임 생성 (게임 코드 + QR 생성)
2. **플레이어**가 QR 스캔 또는 IP + 코드 입력으로 참가
3. 이야기꾼이 역할 배분 (자동 or 수동)
   - 악마에게 하수인 이름 + 블러프 역할 3개, 하수인에게 악마 이름 + 다른 하수인 이름 자동 전달
4. 게임 루프: **밤** → **낮** → **투표** → 반복 또는 종료
   - **밤**: 이야기꾼이 역할 순서대로 활성화, 플레이어가 능력 사용, 피드백 전송
   - **낮**: 서브페이즈 전환 (밀담 → 토론 → 지명 → 변론), 처단자 능력 선언
   - **투표**: 지명 → 시계 방향 순차 투표 → 과반수로 처형 결정 (성결자 트리거 체크)
5. **여행자**: 게임 진행 중 `game:joinAsTraveller`로 참가, 이야기꾼이 역할+진영 배정, 추방(exile)은 처형과 별개
6. **승리 조건**: 악마 처형 시 마을 승리 / 생존자 2명 이하 시 악 승리 / 성자 처형 시 악 승리 / 시장 특수 승리 / 선한 쌍둥이 처형 시 악 승리 (S&V) / 보르톡스 처형 없는 날 선 승리 (S&V)

## 구현된 특수 능력

| 역할 | 능력 |
|------|------|
| 처단자 | 낮에 1회 선언, 대상이 악마면 즉사 (중독 시 무효) |
| 성결자 | 지명받을 때 지명자가 마을 주민이면 지명자 처형 |
| 주정뱅이 | 가짜 역할 표시, 본인은 취한 줄 모름, 서버에서 능력 무효화 |
| 임프 | 자기 자신 선택 시 하수인에게 악마 역할 승계 (탕녀 우선) |
| 점쟁이 | Red Herring 자동 배정, 중독/취함 시 결과 반전 |
| 집사 | 투표 시 주인(master)만 따라 투표 가능 |
| 탕녀 | 악마 사망 시 5인 이상 생존 + 중독 아닌 상태면 악마 역할 승계 |
| 초공감자 | 양옆 이웃의 악 진영 수 계산 (playerOrder 기반) |
| 성자 | 처형 시 (중독/취함 아닌 경우) 악 진영 승리 |
| 시장 | 밤 사망 시 다른 플레이어로 리디렉트, 최종 3인 + 처형 미발생 시 선 진영 승리 |
| 까마귀지기 | 밤에 사망 시 능력 발동 (onlyWhenDead), 플레이어 1명의 역할 확인 |
| 악 진영 | 악마↔하수인 서로 인지, 악마에게 블러프 역할 3개 제공 |
| 마녀 | 매 밤 1명 저주, 저주받은 플레이어가 지명하면 즉사 (S&V) |
| 사악한 쌍둥이 | 선한 쌍둥이 처형 시 악 승리, 두 쌍둥이가 모두 생존 중이면 선 팀 승리 불가 (S&V) |
| 팡 구 | 외지인 사망 시 외지인이 새 악마가 됨 (게임당 1회) (S&V) |
| 마귀할멈 | 매 밤 플레이어의 역할을 변경 (S&V) |
| 이발사 | 사망 시 악마가 2명의 역할을 교환 (S&V) |
| 얼뜨기 | 사망 시 선택한 플레이어가 악이면 악 승리 (S&V) |
| 사랑꾼 | 사망 시 지정 플레이어에게 취함 상태 부여 (S&V) |
| 시계공 | 악마-최근접 하수인 거리 정보 제공 (S&V) |
| 보르톡스 | 주민 능력으로 얻는 모든 정보가 거짓, 처형 없는 날 악 팀 승리 (S&V) |
| 노 다시 | 양옆 마을주민 중독 (S&V) |
| 여행자 | 게임 중간 참가, 추방(exile)은 처형과 별개, 승리 조건 제외 |

## 역할

### Trouble Brewing (22역할)

| 진영 | 역할 |
|------|------|
| 마을주민 (13) | 세탁부, 사서, 수사관, 요리사, 초공감자, 점쟁이, 장의사, 수도사, 까마귀지기, 성결자, 처단자, 군인, 시장 |
| 외지인 (4) | 집사, 주정뱅이, 은둔자, 성자 |
| 하수인 (4) | 독살범, 첩자, 탕녀, 남작 |
| 악마 (1) | 임프 |

### Sects & Violets (25역할)

| 진영 | 역할 |
|------|------|
| 마을주민 (13) | 시계공, 꿈꾸는 자, 뱀 조련사, 수학자, 꽃팔이 소녀, 포고꾼, 예언자, 백치천재, 재봉사, 철학자, 화가, 곡예사, 현자 |
| 외지인 (4) | 변종, 사랑꾼, 이발사, 얼뜨기 |
| 하수인 (4) | 사악한 쌍둥이, 마녀, 세레노버스, 마귀할멈 |
| 악마 (4) | 팡 구, 비고르모르티스, 노 다시, 보르톡스 |

### 여행자 (15역할, 3개 에디션)

| 에디션 | 역할 |
|--------|------|
| Trouble Brewing (5) | 희생양, 총잡이, 거지, 관료, 도둑 |
| Sects & Violets (5) | 푸주한, 뼈 수집가, 매춘부, 바리스타, 이단아 |
| Bad Moon Rising (5) | 수습생, 가정교사, 부두술사, 판사, 주교 |

## 개발

```bash
# 의존성 설치
pnpm install

# 전체 개발 서버 실행
pnpm dev

# 서버 실행
pnpm dev:server

# 플레이어 앱 실행 (포트 8081)
pnpm dev:player

# 이야기꾼 앱 실행 (포트 8082)
pnpm dev:storyteller

# 단위 테스트 실행 (Turborepo 병렬)
pnpm test

# E2E 테스트 실행 (소켓 통합 테스트)
pnpm test:e2e

# 전체 테스트 실행 (단위 + E2E)
pnpm test:all
```

> **`pnpm dev` vs `pnpm start`**: `dev`는 `EXPO_PUBLIC_DEV_MODE=true`를 설정하여 더미 플레이어 추가 등 개발 전용 기능이 활성화됩니다. `start`는 개발 기능 없이 실행됩니다.

## 아키텍처 특징

- **Socket.io 네임스페이스 분리**: 플레이어와 이야기꾼이 별도 네임스페이스로 통신
- **핸들러 분리**: 플레이어/이야기꾼 소켓 핸들러를 별도 파일로 관리
- **TypeScript 이벤트 타입**: 양방향 소켓 이벤트에 대한 엄격한 타입 정의 (ServerToStoryteller 분리)
- **모노레포 공유 패키지**: 타입 불일치 방지 (`@clocktower/shared`, `@clocktower/ui`)
- **자동 재접속**: playerId + gameCode 기반 세션 복구
- **인메모리 상태**: 별도 DB 없이 서버 메모리에서 관리
- **푸시 알림**: Expo Push API로 밤/낮 전환, 차례 알림, 지명 알림
- **반응형 UI**: phone/tablet/desktop 디바이스별 레이아웃 조정
- **플레이어 상태 시스템**: 중독/취함/보호/저주/마녀저주/광기/쌍둥이 등 상태 관리
- **여행자 시스템**: 게임 중간 참가, 추방(exile) 메커니즘, 승리 조건 제외
- **에디션 시스템**: TB/S&V 에디션별 역할 배분, 밤 순서, 자동 에디션 감지
- **이야기꾼-플레이어 채팅**: 1:1 비공개 메시지 시스템
- **낮 서브페이즈**: 밀담/토론/지명/변론 단계 분리
- **게임 설정**: 밀담 모드, 투표 모드, 시계 속도, 토론/지명/변론 타이머 커스터마이징
- **투표 동의**: 변론 중 투표 준비 상태 표시
- **플레이어 퇴장/강퇴**: 자발적 퇴장 및 이야기꾼 강퇴 기능
- **블러프 사전선택**: 역할 배분 시 악마 블러프 역할 3개 지정 가능
- **서버 대시보드**: 시작 시 자동 오픈, 서버/앱 QR 코드 및 링크 표시
- **시계 방향 투표**: 순차 투표 + 사전선택 지원
- **한국어 UI**: 전체 인터페이스 한국어 지원
- **Turborepo 빌드**: `^build` 의존으로 shared/ui → apps 순서 자동 빌드 및 캐싱
- **Biome**: 코드 포맷팅 및 린팅 (워크스페이스별 규칙 오버라이드)
- **Vitest**: 전 패키지 통일 테스트 프레임워크 (단위 테스트 + 소켓 기반 E2E 테스트, Turborepo 병렬 실행)
