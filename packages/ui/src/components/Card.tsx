import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import { colors, elevation, radii, space } from '../tokens';

export type CardVariant = 'leaf' | 'chit' | 'panel' | 'bare';

interface CardProps {
  variant?: CardVariant;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * - `leaf`: 그리모어 낱장 — 이야기꾼 앱의 정보 카드. 약한 금박 보더, 엘레베이트 서피스.
 * - `chit`: 편지 조각 — 플레이어 앱의 작은 편지. 양피지 밝은 배경.
 * - `panel`: 일반 패널. 가장 뉴트럴.
 * - `bare`: 배경·보더 없이 spacing만.
 */
export function Card({ variant = 'panel', style, children }: CardProps) {
  return <View style={[styles.base, VARIANT[variant], style]}>{children}</View>;
}

const VARIANT: Record<CardVariant, ViewStyle> = {
  leaf: {
    backgroundColor: colors.ink.mid,
    borderColor: colors.edge.gilt,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: radii.panel,
    padding: space.base,
    ...elevation.card,
  },
  chit: {
    backgroundColor: '#f3ecd8',
    borderColor: '#d1c7a7',
    borderWidth: 1,
    borderRadius: radii.card,
    padding: space.base,
    ...elevation.card,
  },
  panel: {
    backgroundColor: colors.ink.mid,
    borderColor: colors.edge.default,
    borderWidth: 1,
    borderRadius: radii.card,
    padding: space.base,
  },
  bare: {
    padding: space.base,
  },
};

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});
