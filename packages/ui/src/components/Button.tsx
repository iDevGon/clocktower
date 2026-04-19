import { useMemo } from 'react';
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  StyleSheet,
  Text,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { colors, radii, space, typography } from '../tokens';

export type ButtonTone =
  | 'primary' // 앰버 배경, 잉크 텍스트 — 주 CTA
  | 'secondary' // 아웃라인 + 금박 보더
  | 'ghost' // 보더 없음
  | 'danger' // 크림슨
  | 'seal'; // 원형 밀랍 봉인형 — 확정 액션

export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  label: string;
  tone?: ButtonTone;
  size?: ButtonSize;
  /** 아이콘 또는 요소 좌측 슬롯 */
  leading?: React.ReactNode;
  /** 우측 슬롯 */
  trailing?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  fullWidth?: boolean;
}

const HEIGHTS: Record<ButtonSize, number> = { sm: 34, md: 44, lg: 56 };
const HPAD: Record<ButtonSize, number> = {
  sm: space.md,
  md: space.base,
  lg: space.lg,
};
const LABEL_SIZE: Record<ButtonSize, number> = {
  sm: typography.size.sm,
  md: typography.size.base,
  lg: typography.size.md,
};

export function Button({
  label,
  tone = 'primary',
  size = 'md',
  leading,
  trailing,
  disabled,
  style,
  labelStyle,
  fullWidth,
  onPress,
  ...rest
}: ButtonProps) {
  const base = useMemo<ViewStyle>(() => {
    const s: ViewStyle = {
      height: HEIGHTS[size],
      paddingHorizontal: HPAD[size],
      borderRadius: tone === 'seal' ? radii.pill : radii.soft,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: space.sm,
      alignSelf: fullWidth ? 'stretch' : 'flex-start',
    };
    if (tone === 'seal') {
      s.width = HEIGHTS[size];
      s.height = HEIGHTS[size];
      s.paddingHorizontal = 0;
    }
    return s;
  }, [size, tone, fullWidth]);

  const toned = TONE_STYLES[tone];
  const disabledOverlay: ViewStyle = disabled ? { opacity: 0.45 } : {};

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        base,
        toned.container,
        pressed && !disabled ? toned.pressed : null,
        disabledOverlay,
        style,
      ]}
      {...rest}
    >
      {leading}
      <Text
        style={[
          styles.label,
          { fontSize: LABEL_SIZE[size], color: toned.label },
          labelStyle,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {trailing}
    </Pressable>
  );
}

const TONE_STYLES: Record<
  ButtonTone,
  { container: ViewStyle; pressed: ViewStyle; label: string }
> = {
  primary: {
    container: {
      backgroundColor: colors.ember.core,
      borderWidth: 1,
      borderColor: colors.ember.glow,
    },
    pressed: { backgroundColor: colors.ember.deep },
    label: colors.ink.deep,
  },
  secondary: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.edge.gilt,
    },
    pressed: { backgroundColor: 'rgba(138,117,72,0.14)' },
    label: colors.parchment.high,
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    pressed: { backgroundColor: 'rgba(235,228,210,0.06)' },
    label: colors.parchment.mid,
  },
  danger: {
    container: {
      backgroundColor: colors.crimson.core,
      borderWidth: 1,
      borderColor: colors.crimson.glow,
    },
    pressed: { backgroundColor: colors.crimson.deep },
    label: colors.parchment.high,
  },
  seal: {
    container: {
      backgroundColor: colors.crimson.core,
      borderWidth: 2,
      borderColor: colors.crimson.deep,
    },
    pressed: { backgroundColor: colors.crimson.deep },
    label: colors.parchment.high,
  },
};

const styles = StyleSheet.create({
  label: {
    fontFamily: typography.family.body,
    fontWeight: typography.weight.semibold,
    letterSpacing: typography.tracking.normal,
  },
});
