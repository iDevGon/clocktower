# 빅토리아 아케인 UI 개편 구현 계획

> **에이전트 작업자용:** REQUIRED SUB-SKILL: 이 계획을 작업 단위로 구현할 때는 `superpowers:subagent-driven-development`(권장) 또는 `superpowers:executing-plans`를 사용한다. 단계는 추적을 위해 checkbox(`- [ ]`) 문법을 사용한다.

**목표:** 플레이어 앱과 이야기꾼 앱을 벨 에포크/빅토리아 아케인 펑크 방향으로 개편하고, `학교안심 별빛하늘` 포인트 폰트를 도입하며, 이야기꾼 PC/web 버전에는 정보 밀도 높은 진행 콘솔과 비파괴 단축키를 추가한다.

**아키텍처:** 먼저 `packages/ui`에 공통 팔레트와 타이포그래피 토큰을 추가하고, 양쪽 Expo 앱에서 폰트를 로딩하며, 이야기꾼 앱의 responsive 판단을 순수 helper로 분리한다. 그 다음 이야기꾼 PC 콘솔은 기존 game state와 socket action을 그대로 재사용하는 layout shell로 추가하고, 모바일/태블릿은 기존 터치 중심 grimoire 흐름을 유지한다. 플레이어 앱은 역할 카드, 단계 안내, 주요 행동, 오버레이 스타일을 기록지/장치 표면으로 바꾸되 게임 로직은 건드리지 않는다.

**기술 스택:** React Native, Expo Router, React Native Web, Zustand, Socket.io, Vitest, Biome, Turborepo.

---

## 범위 점검

스펙은 플레이어 앱, 이야기꾼 모바일 앱, 이야기꾼 PC 콘솔을 모두 포함한다. 독립 앱을 새로 만드는 대신 같은 Expo 프로젝트 안에서 shared token과 responsive 분기로 나누는 작업이므로 단일 계획으로 진행한다. 단, 커밋은 폰트/토큰/기반 구조, 이야기꾼 PC 콘솔, 이야기꾼 시각 정리, 플레이어 시각 정리, 오버레이/검증 단위로 나눈다.

## 파일 구조

- 수정: `packages/ui/src/tokens.ts`
  - 공통 색상 토큰에 `arcane` 팔레트를 추가하고, `typography` 토큰에 `body`/`display` 폰트 family를 추가한다.
- 생성: `packages/ui/src/__tests__/tokens.test.ts`
  - 새 토큰이 export되고 핵심 색상과 폰트 이름이 고정되어 있는지 확인한다.
- 수정: `apps/player/package.json`
- 수정: `apps/storyteller/package.json`
  - 필요 시 `expo-font` 의존성을 추가한다.
- 생성: `apps/player/assets/fonts/`
- 생성: `apps/storyteller/assets/fonts/`
  - `학교안심 별빛하늘 L/B`와 기본 UI용 산세리프 폰트 파일을 둔다.
- 수정: `apps/player/app/_layout.tsx`
- 수정: `apps/storyteller/app/_layout.tsx`
  - 앱 시작 시 폰트를 로딩하고, 로딩 실패 시 플랫폼 기본 산세리프로 fallback한다.
- 생성: `apps/storyteller/src/hooks/responsiveMode.ts`
  - 화면 폭으로 device/layout mode를 결정하는 순수 helper를 둔다.
- 수정: `apps/storyteller/src/hooks/useResponsive.ts`
  - `responsiveMode.ts`를 사용하고 `storytellerLayoutMode`, `isDesktopConsole` 값을 반환한다.
- 생성: `apps/storyteller/src/hooks/__tests__/responsiveMode.test.ts`
  - PC/web 콘솔과 터치 grimoire 분기 기준을 검증한다.
- 생성: `apps/storyteller/src/hooks/storytellerShortcuts.ts`
  - 단축키 입력을 비파괴 action 이름으로 변환하는 순수 helper를 둔다.
- 생성: `apps/storyteller/src/hooks/useStorytellerKeyboardShortcuts.ts`
  - web에서만 keyboard event를 등록하고 callback을 호출한다.
- 생성: `apps/storyteller/src/hooks/__tests__/storytellerShortcuts.test.ts`
  - 단축키 mapping과 파괴적 action 부재를 검증한다.
- 생성: `apps/storyteller/src/components/HostDesktopConsoleFrame.tsx`
  - PC 콘솔의 좌측 rail, 중앙 grimoire, 우측 rail, 하단 strip, log drawer slot을 제공한다.
- 생성: `apps/storyteller/src/components/HostDesktopConsoleFrame.styles.ts`
  - PC 콘솔 shell의 빅토리아 아케인 스타일.
- 수정: `apps/storyteller/app/game/grimoire.tsx`
  - desktop console과 mobile/tablet grimoire render branch를 나눈다.
- 수정: `apps/storyteller/src/components/NightPanel.tsx`
- 수정: `apps/storyteller/src/components/NightOrderPanel.tsx`
  - PC 단축키의 밤 순서 진행 요청을 기존 NightOrderPanel 흐름으로 전달한다.
- 수정: `apps/storyteller/src/components/GrimoireTopBar.tsx`
- 수정: `apps/storyteller/src/components/GrimoireBottomBar.tsx`
- 수정: `apps/storyteller/src/styles/grimoire.styles.ts`
- 수정: `apps/storyteller/src/components/PlayerToken.tsx`
- 수정: `apps/storyteller/src/components/PlayerToken.styles.ts`
- 수정: `apps/storyteller/src/components/NightOrderPanel.styles.ts`
- 수정: `apps/storyteller/src/components/NightActionLog.styles.ts`
- 수정: `apps/storyteller/src/components/NightFeedbackPanel.styles.ts`
  - 이야기꾼 앱의 토큰, 패널, 진행 장치를 새 팔레트로 정리한다.
- 생성: `apps/player/src/components/DocketPanel.tsx`
- 생성: `apps/player/src/components/DocketPanel.styles.ts`
  - 플레이어 앱의 기록지/장부 surface를 재사용한다.
- 수정: `apps/player/src/components/RoleCard.tsx`
- 수정: `apps/player/src/components/RoleCard.styles.ts`
- 수정: `apps/player/src/styles/game.styles.ts`
- 수정: `apps/player/src/components/PhaseContent.styles.ts`
- 수정: `apps/player/src/components/NightActionPrompt.styles.ts`
- 수정: `apps/player/src/components/VotePrompt.styles.ts`
- 수정: `apps/player/src/components/ExecutionOverlay.styles.ts`
- 수정: `apps/player/src/components/DeathOverlay.styles.ts`
- 수정: `apps/player/src/components/NightFallOverlay.styles.ts`
- 수정: `apps/player/src/components/GameStartReveal.styles.ts`
  - 플레이어 앱의 개인 기록지, 행동 장치, 오버레이 스타일을 정리한다.

---

### Task 1: 공통 폰트, 토큰, responsive 기반 만들기

**Files:**
- Modify: `packages/ui/src/tokens.ts`
- Create: `packages/ui/src/__tests__/tokens.test.ts`
- Modify: `apps/player/package.json`
- Modify: `apps/storyteller/package.json`
- Create: `apps/player/assets/fonts/`
- Create: `apps/storyteller/assets/fonts/`
- Modify: `apps/player/app/_layout.tsx`
- Modify: `apps/storyteller/app/_layout.tsx`
- Create: `apps/storyteller/src/hooks/responsiveMode.ts`
- Modify: `apps/storyteller/src/hooks/useResponsive.ts`
- Create: `apps/storyteller/src/hooks/__tests__/responsiveMode.test.ts`

- [ ] **Step 1: 공통 토큰 실패 테스트 작성**

`packages/ui/src/__tests__/tokens.test.ts`를 만든다.

```ts
import { describe, expect, it } from 'vitest';
import { colors, typography } from '../tokens';

describe('arcane design tokens', () => {
  it('빅토리아 아케인 팔레트를 제공한다', () => {
    expect(colors.arcane.surface.base).toBe('#0d0703');
    expect(colors.arcane.border.brass).toBe('#b78642');
    expect(colors.arcane.accent.prussianBlue).toBe('#2f4f8f');
    expect(colors.arcane.action.blood).toBe('#8d3529');
  });

  it('기존 surface/base 토큰은 유지한다', () => {
    expect(colors.surface.base).toBe('#121214');
  });

  it('포인트 폰트 토큰을 제공한다', () => {
    expect(typography.fontFamily.display).toBe('SchoolSafeStarrySky-Bold');
    expect(typography.fontFamily.body).toBe('IBMPlexSansKR-Regular');
  });
});
```

- [ ] **Step 2: 토큰 테스트가 실패하는지 확인**

Run:

```bash
pnpm --filter @clocktower/ui test -- src/__tests__/tokens.test.ts
```

Expected: `colors.arcane`이 없어 실패.

- [ ] **Step 3: `packages/ui/src/tokens.ts`에 arcane 토큰 추가**

기존 `colors` 객체의 마지막 큰 그룹 근처에 아래 값을 추가한다.

```ts
  arcane: {
    surface: {
      base: '#0d0703',
      raised: '#1e1005',
      parchment: '#362008',
      ledger: '#261606',
      apparatus: '#140b05',
    },
    border: {
      brass: '#b78642',
      brassDim: '#76542a',
      parchment: '#795a33',
      double: '#9f743c',
    },
    text: {
      primary: '#f0d8b3',
      strong: '#ffe8bf',
      muted: '#c8ae86',
      label: '#e9bd70',
      dead: '#7d7160',
    },
    action: {
      blood: '#8d3529',
      bloodHighlight: '#da7a50',
      bloodPressed: '#5e1d18',
    },
    accent: {
      prussianBlue: '#2f4f8f',
      sapphireLens: '#88aaf5',
      midnightInk: '#10182f',
    },
  },
```

같은 파일에서 typography 토큰을 함께 export한다.

```ts
export const typography = {
  fontFamily: {
    body: 'IBMPlexSansKR-Regular',
    bodyMedium: 'IBMPlexSansKR-Medium',
    bodyBold: 'IBMPlexSansKR-Bold',
    displayLight: 'SchoolSafeStarrySky-Light',
    display: 'SchoolSafeStarrySky-Bold',
  },
} as const;
```

- [ ] **Step 4: 토큰 테스트 통과 확인**

Run:

```bash
pnpm --filter @clocktower/ui test -- src/__tests__/tokens.test.ts
```

Expected: PASS.

- [ ] **Step 4a: 양쪽 Expo 앱에 폰트 파일과 로딩 추가**

공식 배포처에서 받은 `학교안심 별빛하늘 L/B` 파일과 기본 UI용 산세리프 파일을 양쪽 앱의 `assets/fonts/` 아래에 둔다. 파일명은 import 안정성을 위해 ASCII 이름으로 둔다.

권장 파일명:

```text
SchoolSafeStarrySky-Light.ttf
SchoolSafeStarrySky-Bold.ttf
IBMPlexSansKR-Regular.ttf
IBMPlexSansKR-Medium.ttf
IBMPlexSansKR-Bold.ttf
```

`apps/player/app/_layout.tsx`와 `apps/storyteller/app/_layout.tsx`에서 `expo-font`의 `useFonts`를 사용해 같은 family 이름으로 등록한다. 폰트 로딩 중에는 기존 root layout이 잘못 그려지지 않게 `null` 또는 기존 loading surface를 반환한다. 로딩 실패 시에는 앱을 막지 말고 플랫폼 기본 산세리프로 fallback한다.

- [ ] **Step 4b: 폰트 로딩 후 타입체크 확인**

Run:

```bash
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 5: responsive mode 실패 테스트 작성**

`apps/storyteller/src/hooks/__tests__/responsiveMode.test.ts`를 만든다.

```ts
import { describe, expect, it } from 'vitest';
import { getDeviceType, getStorytellerLayoutMode } from '../responsiveMode';

describe('responsiveMode', () => {
  it('폭 1024 이상은 desktop으로 본다', () => {
    expect(getDeviceType(1024)).toBe('desktop');
    expect(getDeviceType(1440)).toBe('desktop');
  });

  it('폭 768 이상 1024 미만은 tablet으로 본다', () => {
    expect(getDeviceType(768)).toBe('tablet');
    expect(getDeviceType(1000)).toBe('tablet');
  });

  it('폭 768 미만은 phone으로 본다', () => {
    expect(getDeviceType(390)).toBe('phone');
    expect(getDeviceType(767)).toBe('phone');
  });

  it('desktop만 PC 진행 콘솔 레이아웃을 사용한다', () => {
    expect(getStorytellerLayoutMode('desktop')).toBe('desktopConsole');
    expect(getStorytellerLayoutMode('tablet')).toBe('touchGrimoire');
    expect(getStorytellerLayoutMode('phone')).toBe('touchGrimoire');
  });
});
```

- [ ] **Step 6: responsive mode 테스트가 실패하는지 확인**

Run:

```bash
pnpm --filter @clocktower/storyteller test -- src/hooks/__tests__/responsiveMode.test.ts
```

Expected: `responsiveMode` 모듈이 없어 실패.

- [ ] **Step 7: `responsiveMode.ts` 구현**

`apps/storyteller/src/hooks/responsiveMode.ts`를 만든다.

```ts
export type DeviceType = 'phone' | 'tablet' | 'desktop';
export type StorytellerLayoutMode = 'touchGrimoire' | 'desktopConsole';

export function getDeviceType(width: number): DeviceType {
  if (width >= 1024) return 'desktop';
  if (width >= 768) return 'tablet';
  return 'phone';
}

export function getStorytellerLayoutMode(
  device: DeviceType,
): StorytellerLayoutMode {
  if (device === 'desktop') return 'desktopConsole';
  return 'touchGrimoire';
}
```

- [ ] **Step 8: `useResponsive.ts`가 helper를 사용하게 수정**

`apps/storyteller/src/hooks/useResponsive.ts`를 아래 구조로 수정한다.

```ts
import { useWindowDimensions } from 'react-native';
import {
  type DeviceType,
  getDeviceType,
  getStorytellerLayoutMode,
  type StorytellerLayoutMode,
} from './responsiveMode';

interface ResponsiveValues {
  device: DeviceType;
  storytellerLayoutMode: StorytellerLayoutMode;
  isDesktopConsole: boolean;
  width: number;
  height: number;
  tokenSize: number;
  fontSize: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  topBarPadding: number;
  panelPadding: number;
  buttonHeight: number;
}

export function useResponsive(): ResponsiveValues {
  const { width, height } = useWindowDimensions();
  const device = getDeviceType(width);
  const storytellerLayoutMode = getStorytellerLayoutMode(device);
  const scale = device === 'desktop' ? 1.3 : device === 'tablet' ? 1.15 : 1;

  return {
    device,
    storytellerLayoutMode,
    isDesktopConsole: storytellerLayoutMode === 'desktopConsole',
    width,
    height,
    tokenSize: Math.round(80 * scale),
    fontSize: {
      xs: Math.round(8 * scale),
      sm: Math.round(10 * scale),
      md: Math.round(12 * scale),
      lg: Math.round(14 * scale),
      xl: Math.round(16 * scale),
    },
    spacing: {
      xs: Math.round(4 * scale),
      sm: Math.round(8 * scale),
      md: Math.round(12 * scale),
      lg: Math.round(16 * scale),
      xl: Math.round(24 * scale),
    },
    topBarPadding: Math.round(12 * scale),
    panelPadding: Math.round(8 * scale),
    buttonHeight: Math.round(36 * scale),
  };
}
```

- [ ] **Step 9: Task 1 테스트와 타입체크 확인**

Run:

```bash
pnpm --filter @clocktower/ui test -- src/__tests__/tokens.test.ts
pnpm --filter @clocktower/storyteller test -- src/hooks/__tests__/responsiveMode.test.ts
pnpm typecheck
```

Expected: 모두 PASS.

- [ ] **Step 10: Task 1 커밋**

```bash
git add packages/ui/src/tokens.ts packages/ui/src/__tests__/tokens.test.ts apps/storyteller/src/hooks/responsiveMode.ts apps/storyteller/src/hooks/useResponsive.ts apps/storyteller/src/hooks/__tests__/responsiveMode.test.ts
git commit -m "feat: 빅토리아 아케인 UI 기반 토큰 추가"
```

---

### Task 2: 이야기꾼 PC 단축키 기반 만들기

**Files:**
- Create: `apps/storyteller/src/hooks/storytellerShortcuts.ts`
- Create: `apps/storyteller/src/hooks/useStorytellerKeyboardShortcuts.ts`
- Create: `apps/storyteller/src/hooks/__tests__/storytellerShortcuts.test.ts`

- [ ] **Step 1: 단축키 순수 helper 실패 테스트 작성**

`apps/storyteller/src/hooks/__tests__/storytellerShortcuts.test.ts`를 만든다.

```ts
import { describe, expect, it } from 'vitest';
import {
  getStorytellerShortcutAction,
  STORYTELLER_SHORTCUT_LABELS,
} from '../storytellerShortcuts';

describe('storytellerShortcuts', () => {
  const base = { isDesktopConsole: true, isTextInputFocused: false };

  it('PC 콘솔에서 주요 단축키를 action으로 변환한다', () => {
    expect(getStorytellerShortcutAction({ key: ' ' }, base)).toBe(
      'advanceNightRole',
    );
    expect(getStorytellerShortcutAction({ key: 'n' }, base)).toBe(
      'openNomination',
    );
    expect(getStorytellerShortcutAction({ key: 'V' }, base)).toBe('focusVote');
    expect(getStorytellerShortcutAction({ key: 'l' }, base)).toBe('toggleLog');
    expect(getStorytellerShortcutAction({ key: 'w' }, base)).toBe(
      'openWhispers',
    );
    expect(getStorytellerShortcutAction({ key: 'f' }, base)).toBe(
      'focusPlayerSearch',
    );
    expect(getStorytellerShortcutAction({ key: 'Escape' }, base)).toBe(
      'closeOverlay',
    );
  });

  it('텍스트 입력 중에는 Esc 외 단축키를 무시한다', () => {
    expect(
      getStorytellerShortcutAction(
        { key: 'n' },
        { isDesktopConsole: true, isTextInputFocused: true },
      ),
    ).toBeNull();
    expect(
      getStorytellerShortcutAction(
        { key: 'Escape' },
        { isDesktopConsole: true, isTextInputFocused: true },
      ),
    ).toBe('closeOverlay');
  });

  it('모바일/태블릿 grimoire에서는 단축키를 무시한다', () => {
    expect(
      getStorytellerShortcutAction(
        { key: 'n' },
        { isDesktopConsole: false, isTextInputFocused: false },
      ),
    ).toBeNull();
  });

  it('숫자키는 대상 선택용 action으로 변환한다', () => {
    expect(getStorytellerShortcutAction({ key: '1' }, base)).toEqual({
      type: 'selectVisiblePlayer',
      index: 0,
    });
    expect(getStorytellerShortcutAction({ key: '9' }, base)).toEqual({
      type: 'selectVisiblePlayer',
      index: 8,
    });
  });

  it('파괴적인 one-key action을 제공하지 않는다', () => {
    expect(Object.keys(STORYTELLER_SHORTCUT_LABELS)).not.toContain('kill');
    expect(Object.keys(STORYTELLER_SHORTCUT_LABELS)).not.toContain('execute');
    expect(Object.keys(STORYTELLER_SHORTCUT_LABELS)).not.toContain('exile');
    expect(Object.keys(STORYTELLER_SHORTCUT_LABELS)).not.toContain('resetGame');
  });
});
```

- [ ] **Step 2: 단축키 테스트 실패 확인**

Run:

```bash
pnpm --filter @clocktower/storyteller test -- src/hooks/__tests__/storytellerShortcuts.test.ts
```

Expected: `storytellerShortcuts` 모듈이 없어 실패.

- [ ] **Step 3: `storytellerShortcuts.ts` 구현**

```ts
export type StorytellerShortcutActionName =
  | 'advanceNightRole'
  | 'openNomination'
  | 'focusVote'
  | 'toggleLog'
  | 'openWhispers'
  | 'focusPlayerSearch'
  | 'closeOverlay';

export type StorytellerShortcutAction =
  | StorytellerShortcutActionName
  | { type: 'selectVisiblePlayer'; index: number };

export const STORYTELLER_SHORTCUT_LABELS: Record<
  StorytellerShortcutActionName,
  string
> = {
  advanceNightRole: '밤 순서 진행',
  openNomination: '지목 열기',
  focusVote: '투표 제어',
  toggleLog: '로그 열기/닫기',
  openWhispers: '밀담 패널',
  focusPlayerSearch: '플레이어 검색',
  closeOverlay: '닫기',
};

interface ShortcutEventLike {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
}

interface ShortcutContext {
  isDesktopConsole: boolean;
  isTextInputFocused: boolean;
}

export function getStorytellerShortcutAction(
  event: ShortcutEventLike,
  context: ShortcutContext,
): StorytellerShortcutAction | null {
  if (!context.isDesktopConsole) return null;
  if (event.metaKey || event.ctrlKey || event.altKey) return null;

  const key = event.key.toLowerCase();
  if (context.isTextInputFocused && key !== 'escape') return null;

  if (event.key === ' ') return 'advanceNightRole';
  if (key === 'n') return 'openNomination';
  if (key === 'v') return 'focusVote';
  if (key === 'l') return 'toggleLog';
  if (key === 'w') return 'openWhispers';
  if (key === 'f') return 'focusPlayerSearch';
  if (key === 'escape') return 'closeOverlay';

  const numeric = Number.parseInt(event.key, 10);
  if (Number.isInteger(numeric) && numeric >= 1 && numeric <= 9) {
    return { type: 'selectVisiblePlayer', index: numeric - 1 };
  }

  return null;
}
```

- [ ] **Step 4: web keyboard hook 구현**

`apps/storyteller/src/hooks/useStorytellerKeyboardShortcuts.ts`를 만든다.

```ts
import { useEffect } from 'react';
import { Platform } from 'react-native';
import {
  getStorytellerShortcutAction,
  type StorytellerShortcutAction,
} from './storytellerShortcuts';

interface UseStorytellerKeyboardShortcutsParams {
  enabled: boolean;
  onAction: (action: StorytellerShortcutAction) => void;
}

function isTextInputElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return true;
  }
  return target.isContentEditable;
}

export function useStorytellerKeyboardShortcuts({
  enabled,
  onAction,
}: UseStorytellerKeyboardShortcutsParams) {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const action = getStorytellerShortcutAction(event, {
        isDesktopConsole: enabled,
        isTextInputFocused: isTextInputElement(event.target),
      });
      if (action == null) return;
      event.preventDefault();
      onAction(action);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, onAction]);
}
```

- [ ] **Step 5: 단축키 테스트 통과 확인**

Run:

```bash
pnpm --filter @clocktower/storyteller test -- src/hooks/__tests__/storytellerShortcuts.test.ts
pnpm --filter @clocktower/storyteller typecheck
```

Expected: PASS.

- [ ] **Step 6: Task 2 커밋**

```bash
git add apps/storyteller/src/hooks/storytellerShortcuts.ts apps/storyteller/src/hooks/useStorytellerKeyboardShortcuts.ts apps/storyteller/src/hooks/__tests__/storytellerShortcuts.test.ts
git commit -m "feat: 이야기꾼 PC 단축키 기반 추가"
```

---

### Task 3: 이야기꾼 PC 콘솔 shell 추가

**Files:**
- Create: `apps/storyteller/src/components/HostDesktopConsoleFrame.tsx`
- Create: `apps/storyteller/src/components/HostDesktopConsoleFrame.styles.ts`
- Modify: `apps/storyteller/app/game/grimoire.tsx`
- Modify: `apps/storyteller/src/components/GrimoireTopBar.tsx`
- Modify: `apps/storyteller/src/components/NightPanel.tsx`
- Modify: `apps/storyteller/src/components/NightOrderPanel.tsx`

- [ ] **Step 1: desktop frame 컴포넌트 생성**

`apps/storyteller/src/components/HostDesktopConsoleFrame.tsx`를 만든다.

```tsx
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { desktopConsoleStyles as styles } from './HostDesktopConsoleFrame.styles';

interface HostDesktopConsoleFrameProps {
  topBar: ReactNode;
  leftRail: ReactNode;
  center: ReactNode;
  rightRail: ReactNode;
  bottomStrip: ReactNode;
  logDrawer?: ReactNode;
  shortcutHint?: string;
}

export function HostDesktopConsoleFrame({
  topBar,
  leftRail,
  center,
  rightRail,
  bottomStrip,
  logDrawer,
  shortcutHint = 'Space 진행 · N 지목 · V 투표 · L 로그 · W 밀담 · F 검색',
}: HostDesktopConsoleFrameProps) {
  return (
    <View style={styles.root}>
      <View style={styles.top}>{topBar}</View>
      <View style={styles.body}>
        <View style={styles.leftRail}>{leftRail}</View>
        <View style={styles.center}>{center}</View>
        <View style={styles.rightRail}>{rightRail}</View>
      </View>
      <View style={styles.bottomStrip}>
        <Text style={styles.shortcutHint}>{shortcutHint}</Text>
        <View style={styles.bottomContent}>{bottomStrip}</View>
      </View>
      {logDrawer}
    </View>
  );
}
```

- [ ] **Step 2: desktop frame 스타일 생성**

`apps/storyteller/src/components/HostDesktopConsoleFrame.styles.ts`를 만든다.

```ts
import { colors } from '@clocktower/ui';
import { StyleSheet } from 'react-native';

export const desktopConsoleStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.arcane.surface.base,
  },
  top: {
    borderBottomWidth: 1,
    borderColor: colors.arcane.border.brassDim,
    backgroundColor: colors.arcane.surface.raised,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    minHeight: 0,
  },
  leftRail: {
    width: 260,
    borderRightWidth: 1,
    borderColor: colors.arcane.border.brassDim,
    backgroundColor: colors.arcane.surface.apparatus,
  },
  center: {
    flex: 1,
    minWidth: 520,
    backgroundColor: colors.arcane.surface.base,
  },
  rightRail: {
    width: 340,
    borderLeftWidth: 1,
    borderColor: colors.arcane.border.brassDim,
    backgroundColor: colors.arcane.surface.apparatus,
  },
  bottomStrip: {
    minHeight: 58,
    borderTopWidth: 1,
    borderColor: colors.arcane.border.brassDim,
    backgroundColor: colors.arcane.surface.raised,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 14,
  },
  shortcutHint: {
    color: colors.arcane.text.muted,
    fontSize: 12,
    minWidth: 360,
  },
  bottomContent: {
    flex: 1,
  },
});
```

- [ ] **Step 3: `GrimoireTopBar`에 compact prop 추가**

`apps/storyteller/src/components/GrimoireTopBar.tsx`의 props에 `compact?: boolean`을 추가하고 top bar 텍스트가 PC에서도 과도하게 커지지 않게 한다.

```tsx
interface GrimoireTopBarProps {
  day: number;
  phase: string;
  daySubPhase?: string;
  onMenuPress?: () => void;
  styles: ReturnType<typeof createGrimoireStyles>;
  compact?: boolean;
}
```

렌더링은 다음처럼 바꾼다.

```tsx
<View style={[styles.topBar, compact && localStyles.compactTopBar]}>
  <Text style={[styles.dayText, compact && localStyles.compactDayText]}>
    {day}일차 · {phaseLabel}
  </Text>
  {onMenuPress && (
    <Pressable onPress={onMenuPress} style={localStyles.menuButton}>
      <Text style={localStyles.menuIcon}>☰</Text>
    </Pressable>
  )}
</View>
```

`localStyles`에는 다음을 추가한다.

```ts
  compactTopBar: {
    minHeight: 44,
  },
  compactDayText: {
    color: '#e9bd70',
    fontWeight: '700',
  },
```

- [ ] **Step 4: `grimoire.tsx`에서 desktop branch 준비**

`apps/storyteller/app/game/grimoire.tsx` 상단 import에 frame과 shortcut hook을 추가한다.

```tsx
import { HostDesktopConsoleFrame } from '../../src/components/HostDesktopConsoleFrame';
import { useStorytellerKeyboardShortcuts } from '../../src/hooks/useStorytellerKeyboardShortcuts';
import type { StorytellerShortcutAction } from '../../src/hooks/storytellerShortcuts';
```

`useResponsive` 사용부를 다음처럼 바꾼다.

```tsx
const { fontSize, isDesktopConsole } = useResponsive();
const scale = fontSize.md / 12;
```

단축키 handler와 desktop focus state를 추가한다.

```tsx
const [desktopFocusTarget, setDesktopFocusTarget] = useState<
  'vote' | 'playerSearch' | null
>(null);
const [nightAdvanceRequestId, setNightAdvanceRequestId] = useState(0);

const handleShortcutAction = useCallback(
  (action: StorytellerShortcutAction) => {
    if (action === 'toggleLog') {
      router.push('/game/log');
      return;
    }
    if (action === 'openWhispers') {
      router.push('/game/whispers');
      return;
    }
    if (action === 'openNomination') {
      router.push('/game/nominate');
      return;
    }
    if (action === 'focusVote') {
      setDesktopFocusTarget('vote');
      return;
    }
    if (action === 'closeOverlay') {
      closeModal();
      setSettingsVisible(false);
      setChatModalVisible(false);
      setDictionaryVisible(false);
      setMemoModalVisible(false);
      setGeneralMemoVisible(false);
      setDesktopFocusTarget(null);
      return;
    }
    if (action === 'advanceNightRole') {
      if (gameState?.phase !== 'night') return;
      setNightAdvanceRequestId((prev) => prev + 1);
      return;
    }
    if (typeof action === 'object' && action.type === 'selectVisiblePlayer') {
      const player = gameState?.players[action.index];
      if (!player) return;
      handlePlayerPress(player.id, player.name, player.isAlive);
    }
  },
  [
    closeModal,
    gameState,
    handlePlayerPress,
    router,
    setDesktopFocusTarget,
    setDictionaryVisible,
    setGeneralMemoVisible,
    setChatModalVisible,
    setMemoModalVisible,
    setNightAdvanceRequestId,
    setSettingsVisible,
  ],
);

useStorytellerKeyboardShortcuts({
  enabled: isDesktopConsole,
  onAction: handleShortcutAction,
});
```

- [ ] **Step 5: NightOrderPanel에 안전한 advance request 연결**

`apps/storyteller/src/components/NightPanel.tsx`의 props에 `advanceRequestId?: number`를 추가하고 destructuring에 포함한다.

```tsx
interface NightPanelProps {
  day: number;
  players: Player[];
  nightActions: NightAction[];
  playerStatuses: Record<string, PlayerStatus[]>;
  activeNightRoleId: string | null;
  activeRoleIds: string[];
  dormantRoleIds: string[];
  skippedNightRoles: string[];
  executedPlayer: Player | null;
  empathNeighborIds: Set<string>;
  empathEvilCount: number;
  chefEvilPairCount: number;
  chefEvilPairNames: string[][];
  playerOrder: string[];
  onActivateRole: (roleId: string | null) => void;
  onNightComplete: () => void;
  onSendFeedback: (playerId: string, feedback: NightFeedbackPayload) => void;
  onKill: (playerId: string) => void;
  onSetStatus: (playerId: string, status: PlayerStatus) => void;
  advanceRequestId?: number;
  onFangGuJump?: (oldDemonId: string, newDemonId: string) => void;
  onSnakeCharmerSwap?: (snakeCharmerId: string, demonId: string) => void;
  onVigormortisKillMinion?: (
    vigormortisId: string,
    minionId: string,
    poisonedNeighborId: string,
  ) => void;
  onPitHagChangeRole?: (
    pitHagId: string,
    targetPlayerId: string,
    newRoleId: string,
  ) => void;
  onBoneCollectorRestore?: (
    boneCollectorId: string,
    targetPlayerId: string,
  ) => void;
  onApplyBaristaEffect?: (
    targetPlayerId: string,
    effect: 'sober_healthy' | 'acts_twice',
  ) => void;
  nightWakeUpTargets: string[];
  styles: ReturnType<typeof createGrimoireStyles>;
  editionId?: string;
  jugglerCorrectCount?: Record<string, number>;
  extraNightRoleIds?: string[];
}
```

`NightOrderPanel` 호출에 prop을 전달한다.

```tsx
<NightOrderPanel
  day={day}
  activeRoleIds={activeRoleIds}
  skippedRoleIds={skippedNightRoles}
  dormantRoleIds={dormantRoleIds}
  activeNightRoleId={activeNightRoleId}
  advanceRequestId={advanceRequestId}
  onActivateRole={onActivateRole}
  onNightComplete={() => {
    setNightOrderComplete(true);
  }}
  editionId={editionId}
  extraRoleIds={extraNightRoleIds}
/>
```

`apps/storyteller/src/components/NightOrderPanel.tsx`에 prop을 추가한다.

```tsx
interface NightOrderPanelProps {
  day: number;
  activeRoleIds: string[];
  skippedRoleIds?: string[];
  dormantRoleIds?: string[];
  activeNightRoleId?: string | null;
  advanceRequestId?: number;
  onActivateRole: (roleId: string | null) => void;
  onNightComplete?: () => void;
  editionId?: string;
  extraRoleIds?: string[];
}
```

`handleNext` 선언 아래에 request effect를 추가한다.

```tsx
const lastAdvanceRequestRef = useRef(advanceRequestId);

useEffect(() => {
  if (advanceRequestId == null) return;
  if (lastAdvanceRequestRef.current === advanceRequestId) return;
  lastAdvanceRequestRef.current = advanceRequestId;
  handleNext();
}, [advanceRequestId, handleNext]);
```

- [ ] **Step 6: desktop frame render branch 추가**

`if (!gameState) return null;` 아래에서 토큰 영역 JSX를 `tokenCanvas` 변수로 추출한다. 기존 `View style={styles.tokenArea}` 블록을 그대로 변수에 담고, 기존 mobile branch와 desktop branch가 함께 재사용하게 한다.

```tsx
const tokenCanvas = (
  <View
    style={styles.tokenArea}
    onLayout={(e) => {
      const { width, height } = e.nativeEvent.layout;
      setAreaSize({ width, height });
    }}
  >
    {/* 이 위치에는 현재 grimoire.tsx의 tokenArea 내부 JSX를 이동한다. */}
  </View>
);
```

desktop branch는 다음 구조를 사용한다.

```tsx
if (isDesktopConsole) {
  return (
    <SafeAreaView style={styles.container}>
      <HostDesktopConsoleFrame
        topBar={
          <GrimoireTopBar
            day={gameState.day}
            phase={gameState.phase}
            daySubPhase={gameState.daySubPhase ?? undefined}
            onMenuPress={handleMenu}
            styles={styles}
            compact
          />
        }
        leftRail={
          <View style={styles.desktopRailPanel}>
            <PhaseBar
              currentPhase={gameState.phase}
              onSetPhase={handleSetPhase}
              disableNext={gameState.phase === 'night' && !nightOrderComplete}
            />
            {gameState.phase === 'day' && (
              <DaySubPhaseBar
                currentSubPhase={gameState.daySubPhase}
                onSetSubPhase={setDaySubPhase}
                whisperClock={whisperClock}
                discussionClock={discussionClock}
                nominationClock={nominationClock}
                nominationPaused={nominationPaused}
                defenseClock={defenseClock}
              />
            )}
          </View>
        }
        center={tokenCanvas}
        rightRail={
          <View style={styles.desktopRailPanel}>
            {gameState.phase === 'night' && (
              <NightPanel
                day={gameState.day}
                players={gameState.players}
                nightActions={nightActions}
                playerStatuses={playerStatuses}
                activeNightRoleId={activeNightRoleId}
                activeRoleIds={activeRoleIds}
                dormantRoleIds={dormantRoleIds}
                skippedNightRoles={skippedNightRoles}
                executedPlayer={executedPlayer}
                empathNeighborIds={empathNeighborIds}
                empathEvilCount={empathEvilCount}
                chefEvilPairCount={chefEvilPairCount}
                chefEvilPairNames={chefEvilPairNames}
                playerOrder={playerOrder}
                onActivateRole={setActiveNightRole}
                onNightComplete={() => setNightOrderComplete(true)}
                onSendFeedback={sendNightFeedback}
                onKill={kill}
                onSetStatus={setPlayerStatus}
                onFangGuJump={fangGuConfirmJump}
                onSnakeCharmerSwap={snakeCharmerSwap}
                onVigormortisKillMinion={vigormortisKillMinion}
                onPitHagChangeRole={pitHagChangeRole}
                onBoneCollectorRestore={boneCollectorRestore}
                onApplyBaristaEffect={applyBaristaEffect}
                advanceRequestId={nightAdvanceRequestId}
                nightWakeUpTargets={nightWakeUpTargets}
                styles={styles}
                editionId={detectedEditionId}
                jugglerCorrectCount={jugglerCorrectCount}
                extraNightRoleIds={extraNightRoleIds}
              />
            )}
          </View>
        }
        bottomStrip={
          <GrimoireBottomBar
            phase={gameState.phase}
            daySubPhase={gameState.daySubPhase ?? undefined}
            activeWhispersCount={activeWhispers.length}
            slayerWaitingAck={slayerWaitingAck}
            totalChatUnread={totalChatUnread}
            hasMemo={generalMemo.length > 0}
            onWhispersPress={() => router.push('/game/whispers')}
            onNominatePress={() => router.push('/game/nominate')}
            onSlayerForceAck={() => socket?.emit('slayer:forceAck')}
            onDictionaryPress={() => setDictionaryVisible(true)}
            onMemoPress={openGeneralMemo}
            onChatPress={() => {
              setChatInitialPlayerId(null);
              setChatModalVisible(true);
            }}
            onLogPress={() => router.push('/game/log')}
            scale={scale}
          />
        }
      />
      {/* 기존 modal/overlay 묶음은 desktop branch에도 그대로 유지 */}
    </SafeAreaView>
  );
}
```

desktop branch 아래에는 현재 mobile branch에서 쓰는 `SettingsPanel`, `StorytellerChatModal`, `DictionaryModal`, `ActionModal`, `ConfirmModal`, 메모 modal, 여행자/역할 특수 modal 묶음을 동일하게 렌더링한다. 중복이 커지면 `const sharedModals = (...)`로 추출해 mobile branch와 desktop branch가 같은 JSX를 사용하게 만든다.

- [ ] **Step 7: desktop rail 스타일 추가**

`apps/storyteller/src/styles/grimoire.styles.ts`에 다음 스타일을 추가한다.

```ts
desktopRailPanel: {
  flex: 1,
  padding: s(10),
  gap: s(10),
},
```

- [ ] **Step 8: Task 3 타입체크**

Run:

```bash
pnpm --filter @clocktower/storyteller typecheck
```

Expected: PASS.

- [ ] **Step 9: Task 3 커밋**

```bash
git add apps/storyteller/src/components/HostDesktopConsoleFrame.tsx apps/storyteller/src/components/HostDesktopConsoleFrame.styles.ts apps/storyteller/src/components/GrimoireTopBar.tsx apps/storyteller/src/components/NightPanel.tsx apps/storyteller/src/components/NightOrderPanel.tsx apps/storyteller/app/game/grimoire.tsx apps/storyteller/src/styles/grimoire.styles.ts
git commit -m "feat: 이야기꾼 PC 콘솔 레이아웃 추가"
```

---

### Task 4: 이야기꾼 앱 빅토리아 아케인 스타일 적용

**Files:**
- Modify: `apps/storyteller/src/styles/grimoire.styles.ts`
- Modify: `apps/storyteller/src/components/PlayerToken.tsx`
- Modify: `apps/storyteller/src/components/PlayerToken.styles.ts`
- Modify: `apps/storyteller/src/components/NightOrderPanel.styles.ts`
- Modify: `apps/storyteller/src/components/NightActionLog.styles.ts`
- Modify: `apps/storyteller/src/components/NightFeedbackPanel.styles.ts`
- Modify: `apps/storyteller/src/components/GrimoireBottomBar.tsx`

- [ ] **Step 1: PlayerToken 색상 mapping을 arcane 팔레트로 변경**

`apps/storyteller/src/components/PlayerToken.tsx`의 team color 상수를 교체한다.

```ts
const TEAM_BORDER_COLORS = {
  townsfolk: colors.arcane.accent.prussianBlue,
  outsider: '#5f6f8f',
  minion: '#b78642',
  demon: colors.arcane.action.bloodHighlight,
  traveller: '#8f6ab0',
} as const;

const TEAM_BG_COLORS = {
  townsfolk: colors.arcane.surface.raised,
  outsider: '#1c160a',
  minion: '#241306',
  demon: '#2a0d08',
  traveller: '#1c1020',
} as const;
```

`borderColor` 계산에서 ghost vote는 `colors.arcane.accent.sapphireLens`를 사용한다.

- [ ] **Step 2: PlayerToken 이중 고리 스타일 추가**

`PlayerToken.tsx`의 토큰 내부 첫 child로 inner ring을 추가한다.

```tsx
<View
  style={[
    styles.innerRing,
    {
      borderColor: hasGlow
        ? colors.arcane.accent.sapphireLens
        : colors.arcane.border.brassDim,
    },
  ]}
/>
```

`PlayerToken.styles.ts`에 추가한다.

```ts
innerRing: {
  position: 'absolute',
  top: 6,
  right: 6,
  bottom: 6,
  left: 6,
  borderRadius: 9999,
  borderWidth: 1,
  opacity: 0.65,
},
```

- [ ] **Step 3: 상태 배지를 토큰 표식처럼 절제**

`PlayerToken.styles.ts`에서 `statusRow`, `statusBadge`, `statusText`를 다음 방향으로 바꾼다.

```ts
statusRow: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: 2,
  marginTop: 2,
  position: 'absolute',
  bottom: -10,
},
statusBadge: {
  paddingHorizontal: 4,
  paddingVertical: 1,
  borderRadius: 999,
  borderWidth: 1,
  borderColor: '#b78642',
},
statusText: {
  color: '#f0d8b3',
  fontSize: 8,
  fontWeight: '800',
},
```

- [ ] **Step 4: grimoire 기본 surface를 arcane 팔레트로 변경**

`createGrimoireStyles`에서 container/topBar/tokenArea 관련 색을 바꾼다.

```ts
container: {
  flex: 1,
  backgroundColor: colors.arcane.surface.base,
},
topBar: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: s(16),
  paddingVertical: s(12),
  borderBottomWidth: 1,
  borderColor: colors.arcane.border.brassDim,
  backgroundColor: colors.arcane.surface.raised,
  zIndex: 200,
},
dayText: {
  color: colors.arcane.text.label,
  fontSize: s(14),
  fontWeight: '700',
},
tokenArea: {
  flex: 1,
  position: 'relative',
  backgroundColor: colors.arcane.surface.base,
},
```

파일 상단에는 `import { colors } from '@clocktower/ui';`를 추가한다.

- [ ] **Step 5: NightOrderPanel 팀 색상을 황동/프러시안 블루 기준으로 변경**

`NightOrderPanel.styles.ts`에 `colors` import를 추가하고 `TEAM_COLORS`를 변경한다.

```ts
import { colors } from '@clocktower/ui';

const TEAM_COLORS = {
  townsfolk: {
    bg: colors.arcane.surface.raised,
    border: colors.arcane.accent.prussianBlue,
    text: colors.arcane.accent.sapphireLens,
    dot: colors.arcane.accent.sapphireLens,
  },
  outsider: {
    bg: '#1c160a',
    border: '#7d6a45',
    text: colors.arcane.text.primary,
    dot: colors.arcane.border.brass,
  },
  minion: {
    bg: '#241306',
    border: colors.arcane.border.brass,
    text: colors.arcane.text.label,
    dot: colors.arcane.border.brass,
  },
  demon: {
    bg: '#2a0d08',
    border: colors.arcane.action.bloodHighlight,
    text: '#ffb59c',
    dot: colors.arcane.action.bloodHighlight,
  },
} as const;
```

- [ ] **Step 6: NightActionLog/NightFeedbackPanel 패널 스타일 정리**

각 styles 파일에서 container, item, active/sent 상태를 다음 원칙으로 변경한다.

```ts
container: {
  borderTopWidth: 1,
  borderColor: colors.arcane.border.brassDim,
  backgroundColor: colors.arcane.surface.raised,
  paddingVertical: s(6),
},
item: {
  backgroundColor: colors.arcane.surface.apparatus,
  borderWidth: 1,
  borderColor: colors.arcane.border.brassDim,
  borderRadius: 4,
  paddingHorizontal: s(10),
  paddingVertical: s(6),
  minWidth: s(140),
},
itemSent: {
  borderColor: colors.arcane.accent.prussianBlue,
},
```

숫자/yes-no 버튼의 강조색은 `colors.arcane.accent.sapphireLens`, kill button은 `colors.arcane.action.blood` 계열을 사용한다.

- [ ] **Step 7: BottomBar를 장치 버튼처럼 정리**

`GrimoireBottomBar.tsx`의 `st` 스타일에서 container/item/highlight 색을 arcane 토큰으로 교체한다.

```ts
container: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-evenly',
  borderTopWidth: 1,
  borderColor: colors.arcane.border.brassDim,
  backgroundColor: colors.arcane.surface.raised,
},
itemHighlight: {
  backgroundColor: colors.arcane.action.blood,
  borderRadius: 6,
},
label: {
  color: colors.arcane.text.muted,
  marginTop: 2,
  fontWeight: '600',
},
```

파일 상단에 `import { colors } from '@clocktower/ui';`를 추가한다.

- [ ] **Step 8: 이야기꾼 스타일 타입체크**

Run:

```bash
pnpm --filter @clocktower/storyteller typecheck
```

Expected: PASS.

- [ ] **Step 9: Task 4 커밋**

```bash
git add apps/storyteller/src/styles/grimoire.styles.ts apps/storyteller/src/components/PlayerToken.tsx apps/storyteller/src/components/PlayerToken.styles.ts apps/storyteller/src/components/NightOrderPanel.styles.ts apps/storyteller/src/components/NightActionLog.styles.ts apps/storyteller/src/components/NightFeedbackPanel.styles.ts apps/storyteller/src/components/GrimoireBottomBar.tsx
git commit -m "style: 이야기꾼 앱 빅토리아 아케인 스타일 적용"
```

---

### Task 5: 플레이어 앱 개인 기록지 스타일 적용

**Files:**
- Create: `apps/player/src/components/DocketPanel.tsx`
- Create: `apps/player/src/components/DocketPanel.styles.ts`
- Modify: `apps/player/src/components/RoleCard.tsx`
- Modify: `apps/player/src/components/RoleCard.styles.ts`
- Modify: `apps/player/src/styles/game.styles.ts`
- Modify: `apps/player/src/components/PhaseContent.styles.ts`
- Modify: `apps/player/src/components/NightActionPrompt.styles.ts`
- Modify: `apps/player/src/components/VotePrompt.styles.ts`

- [ ] **Step 1: DocketPanel 컴포넌트 추가**

`apps/player/src/components/DocketPanel.tsx`를 만든다.

```tsx
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { docketStyles as styles } from './DocketPanel.styles';

interface DocketPanelProps {
  label?: string;
  title?: string;
  children: ReactNode;
}

export function DocketPanel({ label, title, children }: DocketPanelProps) {
  return (
    <View style={styles.panel}>
      {(label || title) && (
        <View style={styles.header}>
          {label && <Text style={styles.label}>{label}</Text>}
          {title && <Text style={styles.title}>{title}</Text>}
        </View>
      )}
      <View style={styles.body}>{children}</View>
    </View>
  );
}
```

`apps/player/src/components/DocketPanel.styles.ts`를 만든다.

```ts
import { colors } from '@clocktower/ui';
import { StyleSheet } from 'react-native';

export const docketStyles = StyleSheet.create({
  panel: {
    width: '100%',
    backgroundColor: colors.arcane.surface.raised,
    borderWidth: 1,
    borderColor: colors.arcane.border.brassDim,
    borderRadius: 4,
    padding: 14,
  },
  header: {
    borderBottomWidth: 3,
    borderColor: colors.arcane.border.double,
    paddingBottom: 8,
    marginBottom: 12,
  },
  label: {
    color: colors.arcane.text.label,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.arcane.text.strong,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 3,
  },
  body: {
    gap: 8,
  },
});
```

- [ ] **Step 2: RoleCard 팀 스타일을 arcane 팔레트로 전환**

`RoleCard.tsx`의 `TEAM_STYLES`를 다음 기준으로 바꾼다.

```ts
const TEAM_STYLES: Record<Team, TeamStyleEntry> = {
  townsfolk: {
    borderColor: colors.arcane.accent.prussianBlue,
    label: '마을주민',
    labelColor: colors.arcane.accent.sapphireLens,
    accentDim: colors.arcane.accent.midnightInk,
  },
  outsider: {
    borderColor: colors.arcane.border.brass,
    label: '외지인',
    labelColor: colors.arcane.text.label,
    accentDim: '#2a1b08',
  },
  minion: {
    borderColor: colors.arcane.border.brass,
    label: '하수인',
    labelColor: colors.arcane.text.label,
    accentDim: '#3a1e08',
  },
  demon: {
    borderColor: colors.arcane.action.bloodHighlight,
    label: '악마',
    labelColor: '#ffb59c',
    accentDim: '#3a0d08',
  },
  traveller: {
    borderColor: '#8f6ab0',
    label: '여행자',
    labelColor: '#c9a3de',
    accentDim: '#24102a',
  },
};
```

파일 상단의 import는 `import { AbilityText, colors, RoleTips, useReducedMotion } from '@clocktower/ui';` 형태로 바꾼다.

- [ ] **Step 3: RoleCard.styles를 기록지 surface로 변경**

`RoleCard.styles.ts`의 핵심 스타일을 아래 기준으로 바꾼다.

```ts
card: {
  backgroundColor: colors.arcane.surface.raised,
  borderRadius: 4,
  borderWidth: 1,
  padding: 20,
  overflow: 'hidden',
},
teamLabel: {
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: 2.4,
  marginBottom: 6,
  marginTop: 2,
},
roleName: {
  color: colors.arcane.text.strong,
  fontSize: 28,
  fontWeight: '900',
  marginBottom: 12,
},
divider: {
  width: '100%',
  height: 3,
  borderTopWidth: 1,
  borderBottomWidth: 1,
  borderColor: colors.arcane.border.double,
  marginBottom: 12,
},
ability: {
  color: colors.arcane.text.primary,
  fontSize: 14,
  lineHeight: 21,
},
```

Back face의 보라/파랑 계열 shimmer는 프러시안 블루와 황동 계열로 바꾼다.

- [ ] **Step 4: game.styles 기본 배경과 phase surface 전환**

`apps/player/src/styles/game.styles.ts` 상단에 `colors` import를 추가한다.

```ts
import { colors } from '@clocktower/ui';
```

container/header/scrollContent/phaseContent 주요 색을 바꾼다.

```ts
container: {
  flex: 1,
  backgroundColor: colors.arcane.surface.base,
},
header: {
  paddingTop: 12,
  paddingHorizontal: 24,
  paddingBottom: 16,
  borderBottomWidth: 1,
  borderColor: colors.arcane.border.brassDim,
  backgroundColor: colors.arcane.surface.raised,
},
playerLabel: {
  color: colors.arcane.text.label,
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: 2,
},
playerName: {
  color: colors.arcane.text.strong,
  fontSize: 19,
  fontWeight: '800',
},
phaseContent: {
  alignItems: 'center',
  paddingVertical: 28,
  width: '100%',
},
phaseDescription: {
  color: colors.arcane.text.muted,
  textAlign: 'center',
  lineHeight: 22,
},
```

- [ ] **Step 5: 플레이어 행동 버튼을 장치/도장 스타일로 변경**

`nominateButton`, `whisperButton`, `feedbackHistoryButton`, `nominatedBadge`를 토큰 기반으로 바꾼다.

```ts
nominateButton: {
  backgroundColor: colors.arcane.action.blood,
  borderWidth: 1,
  borderColor: colors.arcane.action.bloodHighlight,
  borderRadius: 4,
  paddingHorizontal: 32,
  paddingVertical: 14,
  marginTop: 20,
},
nominateButtonText: {
  color: '#ffe4cf',
  fontSize: 18,
  fontWeight: '800',
},
whisperButton: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: colors.arcane.surface.raised,
  borderWidth: 1,
  borderColor: colors.arcane.border.brass,
  borderRadius: 4,
  paddingHorizontal: 24,
  paddingVertical: 12,
  marginTop: 20,
  gap: 8,
},
whisperButtonText: {
  color: colors.arcane.text.label,
  fontSize: 16,
  fontWeight: '800',
},
```

- [ ] **Step 6: PhaseContent 부속 스타일 정리**

`PhaseContent.styles.ts`의 active panel/ended row 색을 arcane 토큰으로 바꾼다.

```ts
activePanel: {
  marginTop: 16,
  backgroundColor: colors.arcane.surface.raised,
  borderWidth: 1,
  borderColor: colors.arcane.border.brassDim,
  borderRadius: 4,
  paddingHorizontal: 14,
  paddingVertical: 10,
  width: '100%',
},
activePanelTitle: {
  color: colors.arcane.text.label,
  fontSize: 12,
  fontWeight: '800',
  textTransform: 'uppercase',
  letterSpacing: 1,
  marginBottom: 6,
},
```

- [ ] **Step 7: NightActionPrompt/VotePrompt 스타일 전환**

각 styles 파일의 card/container surface는 `colors.arcane.surface.raised`, border는 `colors.arcane.border.brassDim`, 주요 행동은 `colors.arcane.action.blood`, 밤 활성 정보는 `colors.arcane.accent.prussianBlue`를 사용한다.

예시:

```ts
card: {
  width: '100%',
  backgroundColor: colors.arcane.surface.raised,
  borderWidth: 1,
  borderColor: colors.arcane.border.brassDim,
  borderRadius: 4,
  padding: 16,
},
label: {
  color: colors.arcane.text.label,
  fontSize: 11,
  fontWeight: '800',
  letterSpacing: 1.4,
  textTransform: 'uppercase',
},
```

- [ ] **Step 8: 플레이어 앱 타입체크**

Run:

```bash
pnpm --filter @clocktower/player typecheck
```

Expected: PASS.

- [ ] **Step 9: Task 5 커밋**

```bash
git add apps/player/src/components/DocketPanel.tsx apps/player/src/components/DocketPanel.styles.ts apps/player/src/components/RoleCard.tsx apps/player/src/components/RoleCard.styles.ts apps/player/src/styles/game.styles.ts apps/player/src/components/PhaseContent.styles.ts apps/player/src/components/NightActionPrompt.styles.ts apps/player/src/components/VotePrompt.styles.ts
git commit -m "style: 플레이어 앱 개인 기록지 스타일 적용"
```

---

### Task 6: 오버레이와 모션을 의식/장치 느낌으로 정리

**Files:**
- Modify: `apps/player/src/components/ExecutionOverlay.styles.ts`
- Modify: `apps/player/src/components/DeathOverlay.styles.ts`
- Modify: `apps/player/src/components/NightFallOverlay.styles.ts`
- Modify: `apps/player/src/components/GameStartReveal.styles.ts`
- Modify: `apps/player/src/components/GunslingerFiredOverlay.tsx`
- Modify: `apps/player/src/components/ScapegoatSwappedOverlay.tsx`

- [ ] **Step 1: 오버레이 공통 원칙 적용**

각 오버레이의 panel/card surface를 다음 기준으로 맞춘다.

```ts
panel: {
  backgroundColor: colors.arcane.surface.raised,
  borderWidth: 1,
  borderColor: colors.arcane.border.brass,
  borderRadius: 6,
  padding: 22,
},
tag: {
  color: colors.arcane.text.label,
  fontSize: 11,
  fontWeight: '800',
  letterSpacing: 1.6,
  textTransform: 'uppercase',
},
title: {
  color: colors.arcane.text.strong,
  fontSize: 28,
  fontWeight: '900',
},
```

파일에 `colors` import가 없으면 추가한다.

- [ ] **Step 2: 처형/사망은 핏빛 판결 도장 톤으로 변경**

Execution/Death overlay의 강조색은 아래를 사용한다.

```ts
const VERDICT_COLORS = {
  border: colors.arcane.action.bloodHighlight,
  background: colors.arcane.action.blood,
  text: '#ffe4cf',
};
```

큰 글로우 대신 border, stamp-like label, 어두운 vignette를 사용한다.

- [ ] **Step 3: 밤/역할 공개는 프러시안 블루 렌즈 톤으로 변경**

NightFall/GameStartReveal의 강조색은 다음을 사용한다.

```ts
const LENS_COLORS = {
  border: colors.arcane.accent.prussianBlue,
  glow: 'rgba(136,170,245,0.18)',
  text: colors.arcane.accent.sapphireLens,
};
```

저전력 모드에서는 기존처럼 animation을 줄이고 정적 surface만 보이게 유지한다.

- [ ] **Step 4: 총잡이/희생양 오버레이 문맥 스타일 정리**

`GunslingerFiredOverlay.tsx`와 `ScapegoatSwappedOverlay.tsx`의 inline 색상이 있으면 styles 파일 또는 local StyleSheet에서 arcane 토큰으로 바꾼다. 실패/무효 상태는 프러시안 블루, 실제 사망은 핏빛을 사용한다.

- [ ] **Step 5: 오버레이 타입체크**

Run:

```bash
pnpm --filter @clocktower/player typecheck
```

Expected: PASS.

- [ ] **Step 6: Task 6 커밋**

```bash
git add apps/player/src/components/ExecutionOverlay.styles.ts apps/player/src/components/DeathOverlay.styles.ts apps/player/src/components/NightFallOverlay.styles.ts apps/player/src/components/GameStartReveal.styles.ts apps/player/src/components/GunslingerFiredOverlay.tsx apps/player/src/components/ScapegoatSwappedOverlay.tsx
git commit -m "style: 플레이어 이벤트 오버레이 아케인 스타일 적용"
```

---

### Task 7: 전체 검증과 시각 점검

**Files:**
- Modify only if verification reveals style/type issues.

- [ ] **Step 1: 정적 검증 실행**

Run:

```bash
pnpm lint
pnpm typecheck
```

Expected: 둘 다 PASS.

- [ ] **Step 2: 기존 테스트 실행**

Run:

```bash
pnpm test
```

Expected: PASS. 시각 변경만 했는데 테스트가 깨지면 스타일 import/type 변경에서 생긴 regression인지 확인한다.

- [ ] **Step 3: 서버 E2E 회귀 확인**

Run:

```bash
pnpm test:e2e
```

Expected: PASS. UI 작업이 socket/game logic을 바꾸지 않았음을 확인한다.

- [ ] **Step 4: 웹 화면 수동 확인 준비**

각 앱을 실행한다.

```bash
pnpm dev:server
pnpm --filter @clocktower/storyteller web
pnpm --filter @clocktower/player web
```

Expected: storyteller web은 PC 폭에서 desktop console branch가 보이고, 좁은 폭에서는 touch grimoire branch가 보인다.

- [ ] **Step 5: 수동 시각 체크리스트**

다음 화면을 확인한다.

- 플레이어 앱: 준비, 밤, 낮 토론, 지목, 투표, 사망, 게임 종료
- 플레이어 앱: 역할 공개, 밤 전환, 처형, 사망, 총잡이, 희생양 오버레이
- 이야기꾼 모바일/태블릿 폭: grimoire token drag/tap, phase bar, night panel, vote panel
- 이야기꾼 PC 폭: 좌측 레일, 중앙 grimoire, 우측 rail, 하단 strip, 단축키 안내
- 이야기꾼 PC 폭: `N`, `V`, `L`, `W`, `F`, `Esc`, 숫자키가 destructive action 없이 동작
- 한국어 텍스트가 버튼/토큰/패널에서 잘리지 않는지 확인
- 프러시안 블루가 주색이 아니라 마법 장치 accent로만 보이는지 확인

- [ ] **Step 6: 최종 커밋**

검증 중 발생한 작은 수정이 있으면 명시 파일만 add한다.

```bash
git status --short
git add packages/ui/src/tokens.ts packages/ui/src/__tests__/tokens.test.ts apps/storyteller/src/hooks/responsiveMode.ts apps/storyteller/src/hooks/useResponsive.ts apps/storyteller/src/hooks/storytellerShortcuts.ts apps/storyteller/src/hooks/useStorytellerKeyboardShortcuts.ts apps/storyteller/src/hooks/__tests__/responsiveMode.test.ts apps/storyteller/src/hooks/__tests__/storytellerShortcuts.test.ts apps/storyteller/app/game/grimoire.tsx apps/storyteller/src/components/HostDesktopConsoleFrame.tsx apps/storyteller/src/components/HostDesktopConsoleFrame.styles.ts apps/storyteller/src/components/GrimoireTopBar.tsx apps/storyteller/src/components/GrimoireBottomBar.tsx apps/storyteller/src/components/NightPanel.tsx apps/storyteller/src/components/NightOrderPanel.tsx apps/storyteller/src/components/PlayerToken.tsx apps/storyteller/src/components/PlayerToken.styles.ts apps/storyteller/src/components/NightOrderPanel.styles.ts apps/storyteller/src/components/NightActionLog.styles.ts apps/storyteller/src/components/NightFeedbackPanel.styles.ts apps/storyteller/src/styles/grimoire.styles.ts apps/player/src/components/DocketPanel.tsx apps/player/src/components/DocketPanel.styles.ts apps/player/src/components/RoleCard.tsx apps/player/src/components/RoleCard.styles.ts apps/player/src/styles/game.styles.ts apps/player/src/components/PhaseContent.styles.ts apps/player/src/components/NightActionPrompt.styles.ts apps/player/src/components/VotePrompt.styles.ts apps/player/src/components/ExecutionOverlay.styles.ts apps/player/src/components/DeathOverlay.styles.ts apps/player/src/components/NightFallOverlay.styles.ts apps/player/src/components/GameStartReveal.styles.ts apps/player/src/components/GunslingerFiredOverlay.tsx apps/player/src/components/ScapegoatSwappedOverlay.tsx
git commit -m "chore: UI 개편 검증 후 정리"
```

수정이 없으면 커밋하지 않는다.

---

## 자체 검토

- 스펙의 주요 요구사항인 벨 에포크/빅토리아 아케인 방향, `학교안심 별빛하늘` 포인트 폰트, 프러시안 블루 accent, 플레이어 개인 기록지, 이야기꾼 grimoire 장치, PC/web 콘솔 분리, 모바일/태블릿 touch-first 유지, 비파괴 단축키 정책을 모두 task에 반영했다.
- 파괴적인 one-key shortcut은 Task 2 테스트에서 금지한다.
- 게임 로직, socket event, role rule 변경은 계획에 포함하지 않았다.
- 커스텀 폰트는 첫 구현 범위에 포함하되, 장식 폰트 사용처는 짧은 제목과 오버레이로 제한했다.
- 시각 변경 중심이지만 responsive mode와 shortcut mapping은 순수 helper 테스트로 검증한다.
