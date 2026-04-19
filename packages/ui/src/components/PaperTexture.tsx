import { useId, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

interface PaperTextureProps {
  /** 노이즈 농도 0..1. 기본 0.5 */
  intensity?: number;
  /** 어두운 얼룩 색 — 섬유/오염 자국 */
  spotColor?: string;
  /** 섬유선 색 */
  fiberColor?: string;
}

/**
 * 크로스플랫폼 양피지 질감 오버레이.
 *
 * 네이티브 Skia 의존 없이 react-native-svg 만으로 구현.
 * 결정론적 난수(고정 시드)로 반투명 원형 얼룩 + 얇은 섬유선 수십 개를 배치해
 * 순수 색면이 아닌 "손때 묻은 종이" 느낌을 준다. 인스턴스별 seed 를 달리해
 * 같은 화면에 여러 양피지가 있어도 패턴이 똑같아 보이지 않게 한다.
 *
 * 절대 배치 (absolute fill)이므로 부모가 `position: 'relative'` (RN 기본)
 * 이고 `overflow: 'hidden'` 이어야 카드 밖으로 질감이 삐져나오지 않는다.
 */
export function PaperTexture({
  intensity = 0.5,
  spotColor = '#7a6238',
  fiberColor = '#6a5a2e',
}: PaperTextureProps) {
  const rawId = useId();
  const seed = useMemo(() => hashString(rawId), [rawId]);

  const { spots, fibers } = useMemo(() => generatePattern(seed), [seed]);

  // intensity 로 불투명도 스케일 (너무 진해서 텍스트 가독성을 해치지 않게)
  const spotOpacity = 0.12 * intensity;
  const fiberOpacity = 0.14 * intensity;

  return (
    <Svg
      style={StyleSheet.absoluteFillObject}
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      pointerEvents="none"
    >
      {/* 섬유선 */}
      {fibers.map((f, i) => (
        <Line
          key={`f-${i}`}
          x1={f.x1}
          y1={f.y1}
          x2={f.x2}
          y2={f.y2}
          stroke={fiberColor}
          strokeWidth={f.w}
          opacity={f.opa * fiberOpacity}
        />
      ))}
      {/* 얼룩/점 */}
      {spots.map((s, i) => (
        <Circle
          key={`s-${i}`}
          cx={s.cx}
          cy={s.cy}
          r={s.r}
          fill={spotColor}
          opacity={s.opa * spotOpacity}
        />
      ))}
    </Svg>
  );
}

// ── 결정론적 난수 ──────────────────────────────────────────────────────────

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h = (h ^ s.charCodeAt(i)) >>> 0;
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h || 1;
}

function mulberry32(seed: number) {
  let t = seed;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function generatePattern(seed: number) {
  const rng = mulberry32(seed);
  const spots = Array.from({ length: 18 }, () => ({
    cx: rng() * 100,
    cy: rng() * 100,
    r: 0.8 + rng() * 2.2,
    opa: 0.4 + rng() * 0.6,
  }));
  const fibers = Array.from({ length: 32 }, () => {
    const x1 = rng() * 100;
    const y1 = rng() * 100;
    // 거의 수평인 얇은 선 — 양피지 결 느낌
    const dx = (rng() - 0.5) * 30;
    const dy = (rng() - 0.5) * 8;
    return {
      x1,
      y1,
      x2: x1 + dx,
      y2: y1 + dy,
      w: 0.15 + rng() * 0.3,
      opa: 0.4 + rng() * 0.6,
    };
  });
  return { spots, fibers };
}
