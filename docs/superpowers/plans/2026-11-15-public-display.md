# Public Display Implementation Plan

**Goal:** 이야기꾼 PC 웹에서 공개 정보와 스크립트를 보조 모니터용 별도 창에 표시한다.

**Architecture:** 루트에 유지되는 브리지가 Zustand 변경을 구독한다. 순수 투영 함수가 허용된 필드만 새 객체로 구성하며, 웹 전용 컨트롤러가 이 객체를 별도 창에 렌더링한다. 네이티브에는 빈 브리지를 제공한다.

**Tech Stack:** Expo, React, Zustand, browser DOM, Vitest.

1. `src/publicDisplay/model.ts`와 `__tests__/model.test.ts`: 공개 데이터와 밤 경계, 기본 분배/스크립트 필터를 테스트부터 구현한다. `pnpm --filter @clocktower/storyteller test src/publicDisplay/__tests__/model.test.ts`로 검증한다.
2. `src/publicDisplay/render.ts`, `window.web.ts`, `window.ts`: HTML 이스케이프, 별도 창 재사용, 전체 화면, 연결 안내와 수명 정리를 구현한다. 렌더링 단위 테스트를 추가한다.
3. `PublicDisplayBridge.tsx`, `PublicDisplayButton.tsx`, 루트/대기실/상단 바: 웹 전용 진입점과 루트 구독을 연결한다. 기존 수정 내용을 유지한다.
4. 이야기꾼 전체 테스트/타입 검사, 변경 파일 Biome, 웹 export 및 브라우저로 정상 표시와 반복 열기 동작을 검증한다.

같은 작업 공간에서 순서대로 수행한다. 사용자 작업을 보존하기 위해 자동 커밋이나 다른 브랜치로의 이동은 하지 않는다.

## 검증 기록

- 공개 투영·HTML·팝업 수명 테스트를 실패부터 작성하고 구현했다.
- 기존 테스트를 포함해 이야기꾼 245개 테스트가 통과했다. 타입 검사, 변경 파일 Biome, 웹 export도 통과했다.
- 독립 코드 리뷰에서 가중 투표와 찬성 인원 수의 혼동을 발견해 결과를 `찬성 N명`, 서버 처형 후보 집계는 `N표`로 표시하도록 수정했다.
- 브라우저 연결 도구가 `The browser access host is unavailable`을 반환해 실제 창의 시각 검증은 수행하지 못했다.
- 후속 요청: 스크롤을 제거하고 1600px 보드의 실제 콘텐츠 크기를 기준으로 창에 맞추도록 변경했다. 직업 설명은 3열로 표시하며 창 크기/전체 화면/콘텐츠 변경에 맞춰 축척을 다시 계산한다. 보통 콘텐츠, 긴 혼합 스크립트, 전체 화면 확대의 축척 계산을 테스트한다.
