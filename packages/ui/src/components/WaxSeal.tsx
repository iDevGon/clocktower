import { useId } from 'react';
import { View, type ViewStyle } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import { colors } from '../tokens';

export type SealTone = 'crimson' | 'amber' | 'twilight' | 'verdure' | 'bruise';
export type SealGlyph = 'star' | 'moon' | 'clock' | 'lily' | 'bat' | 'blank';

interface WaxSealProps {
  size?: number;
  tone?: SealTone;
  glyph?: SealGlyph;
  /** 봉인 균열 표시 — 공개 모먼트에서 깨진 상태 */
  broken?: boolean;
  style?: ViewStyle;
}

const TONE_MAP = {
  crimson: {
    highlight: colors.crimson.glow,
    mid: colors.crimson.core,
    shadow: colors.crimson.deep,
    glyph: '#f2d2cf',
  },
  amber: {
    highlight: colors.ember.glow,
    mid: colors.ember.core,
    shadow: colors.ember.deep,
    glyph: '#2a1a0a',
  },
  twilight: {
    highlight: colors.twilight.glow,
    mid: colors.twilight.core,
    shadow: colors.twilight.deep,
    glyph: '#dfe5f2',
  },
  verdure: {
    highlight: colors.verdure.glow,
    mid: colors.verdure.core,
    shadow: colors.verdure.deep,
    glyph: '#d8e8dd',
  },
  bruise: {
    highlight: colors.bruise.glow,
    mid: colors.bruise.core,
    shadow: colors.bruise.deep,
    glyph: '#ede0f0',
  },
} as const;

/**
 * 밀랍 봉인 (wax seal).
 * 원형 밀랍 스탬프로, 내부에 글립 하나. 편지 공개·확정·상태 스탬프에 사용.
 */
export function WaxSeal({
  size = 72,
  tone = 'crimson',
  glyph = 'star',
  broken = false,
  style,
}: WaxSealProps) {
  const palette = TONE_MAP[tone];
  const r = size / 2;
  const innerR = r - size * 0.08;

  // 웹 호환: SVG id 는 document-global이므로 인스턴스별 고유 id 필요
  // 영숫자만 남기기 (React 19 useId 는 `:r0:` · `«r0»` 등 특수문자 포함)
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const gradId = `wax-${uid}`;
  const highId = `wax-hi-${uid}`;

  return (
    <View style={style}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <RadialGradient id={gradId} cx="35%" cy="30%" r="75%">
            <Stop offset="0%" stopColor={palette.highlight} />
            <Stop offset="55%" stopColor={palette.mid} />
            <Stop offset="100%" stopColor={palette.shadow} />
          </RadialGradient>
          <LinearGradient id={highId} x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
            <Stop offset="40%" stopColor="#ffffff" stopOpacity="0.05" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="0.25" />
          </LinearGradient>
        </Defs>

        {/* 바깥 밀랍 원판 */}
        <Circle cx={r} cy={r} r={r - 1} fill={`url(#${gradId})`} />

        {/* 내부 눌린 자국 (깊이감) */}
        <Circle
          cx={r}
          cy={r}
          r={innerR}
          fill="none"
          stroke={palette.shadow}
          strokeWidth={0.8}
          opacity={0.6}
        />

        {/* 하이라이트 오버레이 */}
        <Circle cx={r} cy={r} r={r - 1} fill={`url(#${highId})`} />

        {/* 글립 */}
        <SealGlyphMark
          glyph={glyph}
          cx={r}
          cy={r}
          size={size * 0.45}
          color={palette.glyph}
        />

        {/* 균열 (broken 상태) */}
        {broken ? (
          <>
            <Path
              d={`M${r * 0.7},${r * 0.4} L${r * 1.05},${r * 1.05} L${r * 1.35},${r * 0.9} L${r * 1.55},${r * 1.6}`}
              stroke={palette.shadow}
              strokeWidth={1.2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d={`M${r * 0.3},${r * 1.2} L${r * 0.9},${r * 1.0} L${r * 1.1},${r * 1.45}`}
              stroke={palette.shadow}
              strokeWidth={0.9}
              fill="none"
              strokeLinecap="round"
            />
          </>
        ) : null}
      </Svg>
    </View>
  );
}

interface GlyphProps {
  glyph: SealGlyph;
  cx: number;
  cy: number;
  size: number;
  color: string;
}

function SealGlyphMark({ glyph, cx, cy, size, color }: GlyphProps) {
  const half = size / 2;

  if (glyph === 'blank') return null;

  if (glyph === 'star') {
    // 6각별 (헥사그램)
    const points: string[] = [];
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI / 6) * i - Math.PI / 2;
      const radius = i % 2 === 0 ? half : half * 0.45;
      points.push(
        `${cx + Math.cos(angle) * radius},${cy + Math.sin(angle) * radius}`,
      );
    }
    return <Path d={`M${points.join(' L')} Z`} fill={color} opacity={0.88} />;
  }

  if (glyph === 'moon') {
    // 초승달: 원 - 오프셋 원
    return (
      <Path
        d={`M${cx + half * 0.4},${cy - half * 0.9}
            A${half},${half} 0 1 0 ${cx + half * 0.4},${cy + half * 0.9}
            A${half * 0.85},${half * 0.85} 0 1 1 ${cx + half * 0.4},${cy - half * 0.9} Z`}
        fill={color}
        opacity={0.88}
      />
    );
  }

  if (glyph === 'clock') {
    // 시계탑 + 4방향 눈금
    const lines: string[] = [];
    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI / 2) * i - Math.PI / 2;
      const outer = half * 0.95;
      const inner = half * 0.75;
      lines.push(
        `M${cx + Math.cos(angle) * outer},${cy + Math.sin(angle) * outer} L${cx + Math.cos(angle) * inner},${cy + Math.sin(angle) * inner}`,
      );
    }
    return (
      <>
        <Circle
          cx={cx}
          cy={cy}
          r={half}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          opacity={0.88}
        />
        <Path
          d={lines.join(' ')}
          stroke={color}
          strokeWidth={1.5}
          opacity={0.88}
        />
        {/* 시침·분침 */}
        <Path
          d={`M${cx},${cy} L${cx},${cy - half * 0.6}`}
          stroke={color}
          strokeWidth={1.3}
          strokeLinecap="round"
          opacity={0.9}
        />
        <Path
          d={`M${cx},${cy} L${cx + half * 0.5},${cy}`}
          stroke={color}
          strokeWidth={1.3}
          strokeLinecap="round"
          opacity={0.9}
        />
      </>
    );
  }

  if (glyph === 'lily') {
    // 백합 — 좋은 팀
    return (
      <Path
        d={`M${cx},${cy - half}
            C${cx + half * 0.6},${cy - half * 0.3} ${cx + half * 0.6},${cy + half * 0.3} ${cx},${cy + half * 0.9}
            C${cx - half * 0.6},${cy + half * 0.3} ${cx - half * 0.6},${cy - half * 0.3} ${cx},${cy - half}
            M${cx - half * 0.7},${cy} L${cx + half * 0.7},${cy}`}
        fill={color}
        stroke={color}
        strokeWidth={1.2}
        opacity={0.85}
      />
    );
  }

  if (glyph === 'bat') {
    // 박쥐 — 사악 팀
    return (
      <Path
        d={`M${cx},${cy + half * 0.3}
            L${cx - half * 0.3},${cy}
            L${cx - half * 0.9},${cy - half * 0.3}
            L${cx - half * 0.65},${cy + half * 0.1}
            L${cx - half * 0.35},${cy + half * 0.55}
            L${cx - half * 0.1},${cy + half * 0.25}
            L${cx + half * 0.1},${cy + half * 0.25}
            L${cx + half * 0.35},${cy + half * 0.55}
            L${cx + half * 0.65},${cy + half * 0.1}
            L${cx + half * 0.9},${cy - half * 0.3}
            L${cx + half * 0.3},${cy} Z`}
        fill={color}
        opacity={0.88}
      />
    );
  }

  return null;
}
