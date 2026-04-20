# PR 코드 리뷰 규칙

PR 리뷰 시 아래 규칙을 따릅니다.

## 리뷰 범위

- 변경된 파일만 리뷰
- 제외 대상: pnpm-lock.yaml, \*.d.ts (자동생성), 이미지/폰트 바이너리, .github/ 설정 파일

## 코멘트 형식

각 이슈를 발견한 라인에 직접 인라인 코멘트를 남깁니다. 한국어로 작성합니다.

````
🤖 🔴|🟡 **[카테고리]** 규칙명

🔍 **문제**: 왜 이 코드가 문제인지 간결하게 설명합니다.

💡 **제안**:
```tsx
// 수정된 코드
```

📎 **근거**: `파일경로` > 섹션/규칙명
````

근거에는 이 코멘트가 어떤 문서의 어떤 규칙을 기반으로 작성되었는지 명시합니다.

- 예: `📎 **근거**: .claude/CLAUDE.md > Coding Conventions > No nested if`
- 예: `📎 **근거**: .agents/skills/vercel-react-best-practices/rules/rerender-memo.md > useMemo`

### 심각도 분류

- 🔴 **CRITICAL**: 머지 전 반드시 수정 (버그, 타입 안전성, 보안, 소켓 이벤트 불일치)
- 🟡 **WARNING**: 수정 권장 (컨벤션 위반, 성능 이슈 등)

## 라인 번호 정확성

인라인 코멘트의 `line` 파라미터는 반드시 **diff 출력의 `+` 라인 번호**(신규 파일 기준)를 사용해야 합니다.

- diff hunk 헤더 `@@ -old,count +new,count @@`에서 `+new` 숫자가 해당 hunk의 시작 라인입니다.
- 코멘트를 달려는 코드의 정확한 라인 번호를 diff에서 직접 세어 확인합니다.
- **절대로 추정하지 말 것**: diff 출력에 실제로 보이는 라인에만 코멘트를 남깁니다.
- 변경되지 않은 라인(diff에서 공백으로 시작하는 context 라인)에도 코멘트를 남길 수 있지만, 반드시 해당 hunk 범위 내에 있어야 합니다.

## 코멘트 제한

- 인라인 코멘트는 **최대 10개**로 제한
- 우선순위: 🔴 CRITICAL > 🟡 WARNING
- 동일 심각도 내 순서: [구현 완성도] > [소켓 이벤트 정합성] > [코드 품질] > [성능] > [테스트 품질]

## 리뷰 실행 순서

1. **정보 수집** (병렬):
   - `gh pr diff {PR_NUMBER}`
   - `gh pr view {PR_NUMBER}`
   - 기존 코멘트 조회: `gh api "repos/$GITHUB_REPOSITORY/pulls/{PR_NUMBER}/comments" --paginate`
2. **PR 설명 파싱**: `gh pr view` 결과에서 아래 필드를 추출
   - 작업사항 → 기대하는 구현 범위
   - 주요 검토 사항 → 집중 리뷰 포인트
3. **규칙 로드**: 변경 파일 유형에 맞는 규칙 파일만 **병렬로** 읽기
   3-1. 항상 `.claude/CLAUDE.md`를 읽어 코딩 컨벤션과 아키텍처 규칙 확인
   3-2. React/RN 컴포넌트 변경 시 `.agents/skills/vercel-react-best-practices/SKILL.md` → 해당 rules/ 파일 읽기
   3-3. 컴포넌트 구조/패턴 변경 시 `.agents/skills/vercel-composition-patterns/SKILL.md` → 해당 rules/ 파일 읽기
   3-4. 테스트 파일 `*.test.*`이 없으면 테스트 관련 규칙은 읽지 않음
   3-5. `AGENTS.md`는 읽지 않음
4. **맥락 파악**: 변경된 코드의 주변 맥락이 필요하면 Read/Glob/Grep으로 소스 파일 확인
   - 특히 소켓 이벤트 변경 시 `packages/shared/src/events.ts`와의 타입 일치 여부 확인
   - `packages/shared` 타입 변경 시 서버/클라이언트 양쪽 핸들러 확인
5. **이슈 선별** (코멘트 작성 전 필수 단계)
   - [구현 완성도] 이슈와 [소켓 이벤트 정합성/코드 품질/성능/테스트] 이슈를 모두 수집
   - 심각도순 정렬 → 상위 10개 선택
   - 이 단계에서 코멘트를 작성하지 않고, 먼저 전체 후보를 수집
6. **코멘트 작성** (병렬):
   - 인라인 코멘트: `gh api` 또는 MCP 도구 사용

## 중복 코멘트 방지

- 인라인 코멘트를 작성하기 전에 **기존 코멘트 목록**을 확인합니다.
- 같은 파일(path)의 같은 규칙(규칙명)에 대해 이미 코멘트가 존재하면 resolve 여부와 관계없이 **해당 코멘트는 건너뜁니다.**

## 리뷰 판단 기준

코멘트를 남기기 전에 반드시 **해당 코드가 실제로 규칙을 위반하는지** 맥락을 파악합니다.

- 맥락 우선: 키워드/패턴 매칭만으로 판단하지 말고, 해당 코드가 왜 그렇게 작성되었는지 주변 코드와의 관계를 확인합니다.
- 확신 없으면 생략: 작성자의 의도적 선택일 가능성을 고려하고, 확신이 없으면 코멘트를 남기지 않습니다. 10개를 채우는 것보다 정확한 코멘트가 중요합니다.

## 리뷰 카테고리

5개의 카테고리로 구분하여 리뷰. 각 카테고리의 상세 규칙은 해당 문서를 참조.

### [구현 완성도]

PR 설명(작업사항, 주요 검토 사항)과 실제 코드 변경을 대조하여 일치 여부를 검증합니다.
별도의 스킬 파일 없이, 아래 규칙을 직접 적용합니다.

#### 검증 항목

1. **작업사항 누락**: PR 설명의 작업사항에 명시되었으나 코드 변경에 반영되지 않은 항목
2. **주요 검토 사항 확인**: PR 작성자가 명시적으로 검토를 요청한 부분에 대한 집중 리뷰

### [소켓 이벤트 정합성]

소켓 기반 실시간 앱 특성상, 이벤트 타입과 핸들러의 일관성이 중요합니다.
별도의 스킬 파일 없이, 아래 규칙을 직접 적용합니다.

#### 검증 항목

1. **타입 불일치**: `packages/shared/src/events.ts`에 정의된 이벤트 타입과 실제 emit/on 핸들러의 payload가 불일치
2. **네임스페이스 혼용**: `/player`와 `/storyteller` 네임스페이스 간 이벤트가 잘못 사용됨
3. **핸들러 누락**: 새 이벤트 타입이 추가되었으나 대응하는 핸들러가 없음
4. **이벤트 순서**: `.claude/CLAUDE.md`의 Socket Event Change Procedure를 따르지 않음

### [코드 품질]

- **규칙 소스**: `.claude/CLAUDE.md` > Coding Conventions, Architecture Rules
- 주요 체크 포인트:
  - TypeScript strict mode 준수
  - 중첩 if/else 대신 early return 패턴
  - for 루프 대신 Array 메서드 사용
  - 하드코딩된 색상/간격 대신 `packages/ui/src/tokens.ts` 토큰 사용
  - UI 텍스트의 한국어 작성 여부
  - Biome 포매팅 규칙 (2-space indent, single quotes, always semicolons)

### [성능]

- **스킬**: `.agents/skills/vercel-react-best-practices/SKILL.md` 참조
- **스킬**: `.agents/skills/vercel-composition-patterns/SKILL.md` 참조
- **주의**: `.claude/CLAUDE.md`의 원칙과 충돌 시 CLAUDE.md를 우선합니다

### [테스트 품질]

- **규칙 소스**: `.claude/CLAUDE.md` > Architecture Rules (Vitest, pnpm test)
- 주요 체크 포인트:
  - Vitest 사용 여부
  - 서버 핸들러 변경 시 대응하는 테스트 존재 여부
  - E2E 테스트에서 소켓 이벤트 흐름의 올바른 검증
