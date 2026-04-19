import { Canvas, Fill, Shader, Skia } from '@shopify/react-native-skia';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { colors } from '../tokens';

/**
 * 양피지 서피스 — 색상 배경 + 아주 미묘한 노이즈 오버레이.
 *
 * Skia shader로 runtime noise를 그려 반복 텍스처 없이 자연스러운 입자감을 냄.
 * 성능: static shader (애니메이션 없음) — 한 번 그리고 caching.
 *
 * `tone="ink"` → 이야기꾼 가죽 표지 톤 (기본 어두운 배경).
 * `tone="parchment"` → 플레이어 편지 양피지 톤 (밝은 배경).
 */
export type ParchmentTone = 'ink' | 'parchment' | 'panel' | 'transparent';

interface ParchmentSurfaceProps {
  tone?: ParchmentTone;
  /** 노이즈 강도 0..1 (기본 0.08) */
  grain?: number;
  style?: ViewStyle;
  children?: React.ReactNode;
}

const TONE_BG: Record<ParchmentTone, string> = {
  ink: colors.ink.deep,
  panel: colors.ink.mid,
  parchment: colors.parchment.high,
  transparent: 'transparent',
};

// 단순 해시 기반 노이즈. TurbulenceFilter가 있지만, SkSL 짧은 코드로도 충분.
const NOISE_SKSL = `
uniform float u_grain;
vec4 main(vec2 p) {
  float n = fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  float g = (n - 0.5) * u_grain;
  return vec4(g, g, g, g);
}
`;

const noiseEffect = Skia.RuntimeEffect.Make(NOISE_SKSL);

export function ParchmentSurface({
  tone = 'ink',
  grain = 0.08,
  style,
  children,
}: ParchmentSurfaceProps) {
  const bg = TONE_BG[tone];
  const effect = noiseEffect;

  return (
    <View style={[styles.root, { backgroundColor: bg }, style]}>
      {effect ? (
        <Canvas style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <Fill>
            <Shader source={effect} uniforms={{ u_grain: grain }} />
          </Fill>
        </Canvas>
      ) : null}
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
