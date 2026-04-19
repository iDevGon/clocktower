import { StyleSheet, View, type ViewStyle } from 'react-native';
import { colors } from '../tokens';

/**
 * 양피지 서피스 — 색상 배경 + 미묘한 질감.
 *
 * iOS·Android·Web 모두 호환. 별도 네이티브 의존성 없이 순수 RN 뷰로 구현.
 * 표면 질감이 더 필요한 상황에서는 상위에서 Ornament 를 덧붙이거나
 * 반투명 PNG 패턴을 children 위에 얹어서 쓴다.
 *
 * `tone="ink"` → 이야기꾼 가죽 표지 톤 (어두운 배경).
 * `tone="parchment"` → 플레이어 편지 양피지 톤 (밝은 배경).
 */
export type ParchmentTone = 'ink' | 'parchment' | 'panel' | 'transparent';

interface ParchmentSurfaceProps {
  tone?: ParchmentTone;
  style?: ViewStyle;
  children?: React.ReactNode;
}

const TONE_BG: Record<ParchmentTone, string> = {
  ink: colors.ink.deep,
  panel: colors.ink.mid,
  parchment: colors.parchment.high,
  transparent: 'transparent',
};

export function ParchmentSurface({
  tone = 'ink',
  style,
  children,
}: ParchmentSurfaceProps) {
  const bg = TONE_BG[tone];

  return (
    <View style={[styles.root, { backgroundColor: bg }, style]}>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
});
