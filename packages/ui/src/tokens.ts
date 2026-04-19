/**
 * Design tokens — "Leatherbound Grimoire + Sealed Letter"
 *
 * 공유 파운데이션. 양 앱(이야기꾼·플레이어)이 동일한 토큰을 참조하며,
 * 앱별 조성·질감 레이어에서만 분기한다.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Palette — 빅토리아 고딕 톤. 앰버·크림슨·트와일라잇. 순백/순흑 없음.
// ─────────────────────────────────────────────────────────────────────────────

const palette = {
  ink: {
    void: '#0f0c08',
    deep: '#15120c',
    mid: '#1e1a12',
    rise: '#2a251a',
  },
  parchment: {
    high: '#ebe4d2',
    mid: '#b8ae97',
    low: '#7a7161',
    ghost: '#4a4339',
  },
  edge: {
    hairline: '#2a241a',
    default: '#3a322a',
    strong: '#5a4e3e',
    gilt: '#8a7548',
  },
  ember: {
    glow: '#e4a553',
    core: '#c98f44',
    deep: '#8a5e2b',
  },
  twilight: {
    glow: '#7b8db8',
    core: '#5a6d9a',
    deep: '#2e3a5c',
  },
  crimson: {
    glow: '#c55c5b',
    core: '#a03e3d',
    deep: '#5e2020',
  },
  verdure: {
    glow: '#6d9878',
    core: '#4e7359',
    deep: '#2a4432',
  },
  bruise: {
    glow: '#a07aae',
    core: '#7a5788',
    deep: '#402d48',
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Typography
// ─────────────────────────────────────────────────────────────────────────────

export const typography = {
  family: {
    display: 'MaruBuri',
    displayFallback: 'MaruBuri-Bold',
    body: 'Pretendard',
    bodyFallback: 'Pretendard-Regular',
    mono: 'D2Coding',
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    black: '900' as const,
  },
  // 1.25 모듈러 스케일 (px)
  size: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 18,
    lg: 24,
    xl: 32,
    xxl: 44,
    xxxl: 60,
  },
  leading: {
    tight: 1.15,
    normal: 1.4,
    loose: 1.6,
  },
  tracking: {
    tight: -0.3,
    normal: 0,
    wide: 1.5,
    widest: 3,
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Spacing (4pt base)
// ─────────────────────────────────────────────────────────────────────────────

export const space = {
  '2xs': 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 96,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Radii
// ─────────────────────────────────────────────────────────────────────────────

export const radii = {
  sharp: 0,
  subtle: 2,
  soft: 6,
  card: 10,
  panel: 14,
  pill: 999,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Elevation (iOS shadow + Android elevation)
// ─────────────────────────────────────────────────────────────────────────────

export const elevation = {
  none: {},
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  page: {
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  lifted: {
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Motion
// ─────────────────────────────────────────────────────────────────────────────

export const motion = {
  duration: {
    quick: 140,
    base: 220,
    slow: 380,
    reveal: 720,
    cinematic: 1400,
  },
  easing: {
    standard: [0.2, 0.0, 0, 1.0] as const,
    exit: [0.4, 0.0, 1, 1.0] as const,
    enter: [0.0, 0.0, 0.2, 1.0] as const,
    cinematic: [0.16, 1, 0.3, 1] as const,
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Colors — 신규 구조 (semantic) + 하위호환 shim
//
// 새 코드는 `colors.ink.deep`, `colors.parchment.high` 같은 신규 semantic 키를
// 사용하고, 기존 코드는 `colors.surface.base`, `colors.phase.day` 같은 구 키를
// 그대로 쓸 수 있도록 shim으로 매핑한다. 구 키는 PR 4에서 단계적으로 제거.
// ─────────────────────────────────────────────────────────────────────────────

export const colors = {
  // ── 신규 semantic 토큰 ──
  ink: palette.ink,
  parchment: palette.parchment,
  edge: palette.edge,
  ember: palette.ember,
  twilight: palette.twilight,
  crimson: palette.crimson,
  verdure: palette.verdure,
  bruise: palette.bruise,

  // ── 하위호환 shim (기존 코드가 깨지지 않도록 유지) ──
  surface: {
    base: palette.ink.deep,
    elevated: palette.ink.mid,
    overlay: 'rgba(0,0,0,0.7)',
  },
  border: {
    default: palette.edge.default,
    subtle: palette.edge.hairline,
  },
  text: {
    primary: palette.parchment.high,
    secondary: palette.parchment.mid,
    tertiary: palette.parchment.low,
    muted: palette.parchment.mid,
  },
  phase: {
    night: palette.twilight.core,
    day: palette.ember.core,
    vote: palette.crimson.core,
    setup: palette.parchment.mid,
    ended: palette.crimson.glow,
  },
  status: {
    poisoned: palette.bruise.glow,
    drunk: palette.ember.glow,
    protected: palette.verdure.glow,
    cursed: palette.bruise.core,
  },
  badge: {
    player: {
      bg: palette.verdure.deep,
      text: palette.verdure.glow,
      border: palette.verdure.core,
    },
    role: {
      bg: palette.twilight.deep,
      text: palette.twilight.glow,
      border: palette.twilight.core,
    },
    status: {
      bg: palette.crimson.deep,
      text: palette.crimson.glow,
      border: palette.crimson.core,
    },
  },
  team: {
    traveller: palette.bruise.glow,
  },
  chat: {
    storyteller: {
      accent: palette.bruise.core,
      bubbleMine: '#2a2a4d',
      textMine: '#d0d0e8',
      senderLabel: palette.bruise.core,
      otherBorderColor: '#3a2a4a',
    },
    whisper: {
      accent: palette.verdure.core,
      bubbleMine: '#2a3d2a',
      textMine: '#d0e8d0',
      senderLabel: '#8a9a8a',
      otherBorderColor: palette.edge.default,
    },
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Composition tokens — 자주 쓰이는 조합을 의미 기반으로 묶음
// ─────────────────────────────────────────────────────────────────────────────

export const surfaces = {
  /** 화면 베이스 (가장 깊은 서재 배경) */
  page: palette.ink.void,
  /** 표준 패널 배경 */
  panel: palette.ink.deep,
  /** 카드·리스트 항목 (엘레베이트) */
  card: palette.ink.mid,
  /** 카드 위 카드 (2차 엘레베이트) */
  raised: palette.ink.rise,
} as const;

export const strokes = {
  hairline: palette.edge.hairline,
  default: palette.edge.default,
  strong: palette.edge.strong,
  /** 금박 디테일 — 장식적 구분 */
  gilt: palette.edge.gilt,
} as const;

/** 팀/상태별 악센트 — 양 앱 공통 */
export const accent = {
  good: palette.verdure,
  evil: palette.crimson,
  traveller: palette.bruise,
  day: palette.ember,
  night: palette.twilight,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Export 타입 (소비 측에서 keyof typeof 대신 쓸 수 있게)
// ─────────────────────────────────────────────────────────────────────────────

export type SpaceToken = keyof typeof space;
export type RadiiToken = keyof typeof radii;
export type SizeToken = keyof typeof typography.size;
export type WeightToken = keyof typeof typography.weight;
