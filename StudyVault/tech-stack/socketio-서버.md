# Socket.io 서버 사이드

## Socket.io란

- WebSocket 기반 실시간 양방향 통신 라이브러리
- WebSocket 불가 시 long-polling 등 폴백 메커니즘 제공
- 자동 재연결, 룸(room), 네임스페이스 등 고수준 기능 내장

## 서버 설정

- `new Server(httpServer, options)` — HTTP 서버에 Socket.io 서버 부착
- CORS 설정, 전송 방식 지정 등 옵션 가능
- Express와 통합: 같은 HTTP 서버 공유

## 네임스페이스 (Namespace)

- 하나의 서버에서 여러 통신 채널을 분리하는 메커니즘
- `io.of('/player')` — `/player` 네임스페이스 생성
- 각 네임스페이스는 독립적인 이벤트 공간, 미들웨어, 룸을 가짐
- 이 프로젝트: `/player`(플레이어), `/storyteller`(이야기꾼) 분리

## 룸 (Room)

- 네임스페이스 내에서 소켓을 그룹화하는 메커니즘
- `socket.join('room-name')` — 룸 참가
- `io.to('room-name').emit(event, data)` — 룸의 모든 소켓에 전송
- `socket.to('room-name').emit(event, data)` — 자기 자신 제외하고 전송
- 동적 룸 이름으로 게임별 격리: `game:${gameId}`

## 이벤트 흐름

```
Client emit → Server on(이벤트 핸들러) → 로직 처리 → Server emit → Client on
```

- 단방향: `emit`으로 전송, `on`으로 수신
- 양방향 (acknowledgement): `emit(event, data, callback)` — 서버에서 callback 호출로 응답

## TypeScript 타입 안전성

```typescript
interface ServerToClientEvents {
  'game:state': (state: GameState) => void;
}
interface ClientToServerEvents {
  'game:join': (data: { gameId: string; name: string }) => void;
}

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer);
```

- 제네릭으로 이벤트 이름과 페이로드 타입을 컴파일 타임에 검증

## 미들웨어

- `io.use((socket, next) => { ... })` — 연결 전 인증/검증
- `namespace.use(...)` — 네임스페이스별 미들웨어
- `next()` 호출로 다음 미들웨어 진행, `next(error)` 로 연결 거부

## 에러 처리와 연결 관리

- `socket.on('disconnect', reason)` — 연결 해제 감지
- `socket.on('error', error)` — 에러 처리
- `socket.rooms` — 소켓이 속한 룸 목록
- `io.sockets.adapter.rooms` — 서버의 모든 룸 정보
