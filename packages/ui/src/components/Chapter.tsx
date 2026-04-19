import {
  type StyleProp,
  StyleSheet,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';
import { colors, space, typography } from '../tokens';
import { Ornament } from './Ornament';

interface ChapterProps {
  /** 대제목 — 디스플레이 세리프 */
  title: string;
  /** 부제 — 스몰캡 라벨 (자동으로 대문자화) */
  eyebrow?: string;
  /** 하단 설명 — 한 줄, 보조 텍스트 */
  caption?: string;
  /** 오너먼트 표시 여부. 기본 true */
  ornament?: boolean;
  align?: 'center' | 'start';
  titleStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
}

/**
 * 챕터 헤더 — 페이지·모먼트 구분. 세리프 디스플레이 + 스몰캡 라벨 + 오너먼트.
 * `align="center"`가 기본이지만 `start`로 비대칭 레이아웃 가능.
 */
export function Chapter({
  title,
  eyebrow,
  caption,
  ornament = true,
  align = 'center',
  titleStyle,
  style,
}: ChapterProps) {
  const alignItems = align === 'center' ? 'center' : 'flex-start';

  return (
    <View style={[styles.root, { alignItems }, style]}>
      {eyebrow ? (
        <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text>
      ) : null}
      <Text style={[styles.title, titleStyle]}>{title}</Text>
      {ornament ? (
        <Ornament kind="divider" width={120} style={styles.orn} />
      ) : null}
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: space.xs,
    paddingVertical: space.md,
  },
  eyebrow: {
    fontFamily: typography.family.body,
    fontWeight: typography.weight.semibold,
    fontSize: typography.size.xs,
    color: colors.edge.gilt,
    letterSpacing: typography.tracking.widest,
  },
  title: {
    fontFamily: typography.family.display,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.xl,
    color: colors.parchment.high,
    textAlign: 'center',
    lineHeight: typography.size.xl * typography.leading.tight,
  },
  orn: {
    marginTop: space.xs,
  },
  caption: {
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    color: colors.parchment.mid,
    marginTop: space.xs,
  },
});
