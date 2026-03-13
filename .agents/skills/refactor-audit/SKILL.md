---
name: refactor-audit
description: 코드의 구조적 품질을 점검하고 리팩토링합니다. 책임 분리, 스타일 추출, 중복 코드 통합, 소켓 이벤트 정합성 검사를 에이전트 팀으로 병렬 수행합니다.
user_invocable: true
metadata:
  author: DevGon
  version: "1.0.0"
  argument-hint: <검사 범위 (선택, 미지정 시 apps/ 전체)>
---

# Refactor Audit

모노레포 전체 코드의 구조적 품질을 점검하고 자동 리팩토링하는 스킬입니다.

## 역할

코드 품질 전문가로서 아래 4가지 관점에서 코드를 분석하고 개선합니다. 각 관점은 독립된 에이전트가 병렬로 처리합니다.

## 검사 항목

| # | 관점 | 설명 |
|---|------|------|
| 1 | **책임 분리** | 하나의 컴포넌트·훅·함수가 지나치게 많은 책임을 가진 경우 코드 및 파일 분리 |
| 2 | **스타일 추출** | 인라인 style을 별도 `.styles.ts` 파일의 `StyleSheet.create()`로 추출 |
| 3 | **중복 코드 통합** | player/storyteller 앱 간 중복 컴포넌트·훅·유틸을 `packages/shared`로 통합 |
| 4 | **소켓 이벤트 정합성** | `packages/shared/src/events.ts` 타입과 실제 핸들러·리스너 간 불일치 검출 |

## 실행 절차

### 1. 코드베이스 탐색 (Explore 에이전트)

대상 경로(기본: `apps/`)를 Explore 에이전트로 분석합니다.

수집할 정보:
- 모든 컴포넌트·훅·유틸 파일의 경로와 줄 수
- 인라인 `style={{ }}` 사용 위치 (파일 경로, 라인 번호)
- 단일 책임 원칙을 위반하는 과대 컴포넌트 (기준: 200줄 초과 또는 3개 이상의 독립 책임)
- player/storyteller 앱 간 유사한 이름·기능의 컴포넌트·훅 (예: 양쪽 모두에 존재하는 `useGameActions`, `StorytellerChatModal`)
- `packages/shared/src/events.ts`에 정의된 이벤트와 실제 emit/on 호출 간 불일치

참조 구조도 함께 분석합니다:
- `packages/shared/src/` — 기존 공유 타입, 이벤트, 역할 정의 패턴
- 기존 `.styles.ts` 파일 — 스타일 분리 패턴

### 2. 팀 구성 및 병렬 실행

탐색 결과를 바탕으로 4개 에이전트 팀을 구성하여 병렬로 작업합니다.
각 에이전트는 **워크트리(worktree) 격리** 환경에서 작업합니다.

#### 에이전트 구성

| 에이전트명 | 담당 | 주요 작업 |
|-----------|------|-----------|
| `splitter` | 책임 분리 | 과대 컴포넌트를 서브 컴포넌트·스타일 파일로 분리 |
| `styles-agent` | 스타일 추출 | 인라인 style → `.styles.ts` 파일의 `StyleSheet.create()` 추출 |
| `shared-agent` | 중복 통합 | player/storyteller 중복 코드 → `packages/shared` 이동, 양쪽 앱에서 import 변경 |
| `events-agent` | 이벤트 정합성 | 타입 정의와 실제 사용 간 불일치 수정, 누락된 타입 추가 |

#### 에이전트 작업 가이드

**splitter (책임 분리)**:
- 200줄 초과 컴포넌트의 스타일 상수를 별도 `.styles.ts` 파일로 추출
- 독립된 UI 영역을 서브 컴포넌트로 분리
- 오케스트레이터 패턴 유지: 상위 컴포넌트는 상태 관리와 조합만 담당
- 분리된 파일명은 기존 네이밍 컨벤션(PascalCase)을 따름

**styles-agent (스타일 추출)**:
- `style={{ }}` prop → 같은 디렉토리의 `ComponentName.styles.ts` 파일로 추출
- `StyleSheet.create()` 패턴 사용
- 동적 스타일은 함수형 스타일로 변환 (예: `(isActive: boolean) => ({ ... })`)
- `react-native-reanimated`의 `useAnimatedStyle` 등 애니메이션 관련 인라인 스타일은 그대로 유지
- 기존 `.styles.ts` 파일이 있으면 해당 파일에 추가

**shared-agent (중복 통합)**:
- player/storyteller 양쪽에 유사한 컴포넌트가 있으면 공통 부분을 `packages/shared`로 추출
- 앱별 차이는 props로 주입하거나, 공통 훅을 만들고 앱별 래퍼에서 사용
- 공유 코드는 React Native 의존성만 사용 (Expo Router 등 앱 특정 의존성 제외)
- `packages/shared/src/index.ts` barrel export에 추가

**events-agent (이벤트 정합성)**:
- `events.ts`에 정의되었지만 실제 사용되지 않는 이벤트 식별
- 실제 emit/on 되지만 `events.ts`에 타입이 없는 이벤트 식별
- 이벤트 페이로드 타입과 실제 전송 데이터의 불일치 검출
- 누락된 타입 정의를 `packages/shared/src/events.ts`에 추가

### 3. 검증

모든 에이전트 작업 완료 후:
- TypeScript 타입 체크 (`tsc --noEmit`) 통과 확인
- 변경된 모든 패키지에 대해 검증

### 4. 결과 출력

최종 결과를 아래 형식으로 출력합니다:

```
## 리팩토링 결과 요약

### 1. 책임 분리
- {파일명} ({이전 줄수} → {이후 줄수}): {분리 내용}
- ...

### 2. 스타일 추출
- {파일명}: {변경 내용}
- ...

### 3. 중복 코드 통합
- {player 파일} + {storyteller 파일} → {shared 파일}: {설명}
- ...

### 4. 소켓 이벤트 정합성
- {이벤트명}: {불일치 내용 및 수정 사항}
- ...

### 변경 통계
- 새 파일: N개
- 수정 파일: N개
- TypeScript 검증: 통과/실패
```

## 주의사항

- 기존 기능을 절대 변경하지 않습니다. 리팩토링만 수행합니다.
- 각 에이전트는 파일 충돌을 피하기 위해 워크트리 격리 환경에서 작업합니다.
- 검사할 내용이 없는 관점의 에이전트는 생성하지 않습니다.
- 작업 전 반드시 원본 파일을 읽고 이해한 후 수정합니다.
- 모든 UI 텍스트는 한국어를 유지합니다.
- Biome 포맷팅 규칙(2-space indent, single quotes, always semicolons)을 준수합니다.
