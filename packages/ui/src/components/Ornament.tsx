import { View, type ViewStyle } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';
import { colors } from '../tokens';

export type OrnamentKind = 'divider' | 'rule' | 'bookend' | 'star';

interface OrnamentProps {
  kind?: OrnamentKind;
  /** 오너먼트 가로 너비(px). 기본 120 */
  width?: number;
  /** 선 색상. 기본 금박 */
  color?: string;
  /** 선 굵기. 기본 1 */
  strokeWidth?: number;
  style?: ViewStyle;
}

/**
 * 장식 오너먼트 — 챕터 구분, 페이지 상단·하단, 편지 상·하단.
 *
 * - `divider`: ─── ◆ ───  가로 선 + 중앙 다이아몬드
 * - `rule`: 금박 얇은 가로 선 하나
 * - `bookend`: ◁   ▷  좌우 브래킷 (양 끝이 붙어 있지 않음, 콘텐츠를 감싸는 용)
 * - `star`: 6각성 단독 마크
 */
export function Ornament({
  kind = 'divider',
  width = 120,
  color = colors.edge.gilt,
  strokeWidth = 1,
  style,
}: OrnamentProps) {
  if (kind === 'star') {
    const size = 16;
    return (
      <View style={style}>
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Path
            d="M8 1 L9.5 6.5 L15 8 L9.5 9.5 L8 15 L6.5 9.5 L1 8 L6.5 6.5 Z"
            fill={color}
          />
        </Svg>
      </View>
    );
  }

  const height = kind === 'bookend' ? 16 : 14;

  if (kind === 'rule') {
    return (
      <View style={style}>
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <Line
            x1={0}
            x2={width}
            y1={height / 2}
            y2={height / 2}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </Svg>
      </View>
    );
  }

  if (kind === 'bookend') {
    // 좌측: ◁─  우측: ─▷
    const bracketSize = 6;
    return (
      <View style={style}>
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          {/* 좌측 화살표 */}
          <Path
            d={`M${bracketSize + 4},${height / 2 - bracketSize / 2} L4,${height / 2} L${bracketSize + 4},${height / 2 + bracketSize / 2}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Line
            x1={bracketSize + 6}
            x2={width / 2 - 6}
            y1={height / 2}
            y2={height / 2}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* 우측 */}
          <Line
            x1={width / 2 + 6}
            x2={width - bracketSize - 6}
            y1={height / 2}
            y2={height / 2}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <Path
            d={`M${width - bracketSize - 4},${height / 2 - bracketSize / 2} L${width - 4},${height / 2} L${width - bracketSize - 4},${height / 2 + bracketSize / 2}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
    );
  }

  // divider: ───── ◆ ─────
  const cx = width / 2;
  const cy = height / 2;
  const diamondHalf = 3.5;
  const gap = 8;

  return (
    <View style={style}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Line
          x1={0}
          x2={cx - diamondHalf - gap}
          y1={cy}
          y2={cy}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity={0.9}
        />
        <Path
          d={`M${cx},${cy - diamondHalf} L${cx + diamondHalf},${cy} L${cx},${cy + diamondHalf} L${cx - diamondHalf},${cy} Z`}
          fill={color}
        />
        <Line
          x1={cx + diamondHalf + gap}
          x2={width}
          y1={cy}
          y2={cy}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity={0.9}
        />
      </Svg>
    </View>
  );
}
