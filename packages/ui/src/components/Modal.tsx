import { useEffect } from 'react';
import {
  Pressable,
  Modal as RNModal,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useReducedMotion } from '../ReducedMotionContext';
import { colors, elevation, motion, radii, space } from '../tokens';

export type ModalKind =
  | 'sheet' // 하단 드로워 — 목록·액션 선택
  | 'dialog' // 중앙 박스 — 확인·간단 입력
  | 'reveal'; // 전면 공개 — 역할·게임 종료 등 시네마틱 순간

interface ModalProps {
  visible: boolean;
  onDismiss?: () => void;
  kind?: ModalKind;
  /** 백드롭 탭으로 닫기 */
  dismissOnBackdrop?: boolean;
  children?: React.ReactNode;
  /** dialog·sheet의 내부 패딩 커스터마이즈 */
  contentStyle?: StyleProp<ViewStyle>;
}

export function Modal({
  visible,
  onDismiss,
  kind = 'dialog',
  dismissOnBackdrop = true,
  contentStyle,
  children,
}: ModalProps) {
  const reduced = useReducedMotion();
  const backdrop = useSharedValue(0);
  const slide = useSharedValue(0);

  useEffect(() => {
    const easing = Easing.bezier(...motion.easing.cinematic);
    if (reduced) {
      backdrop.value = visible ? 1 : 0;
      slide.value = visible ? 1 : 0;
      return;
    }
    const d = kind === 'reveal' ? motion.duration.reveal : motion.duration.base;
    backdrop.value = withTiming(visible ? 1 : 0, { duration: d, easing });
    slide.value = withTiming(visible ? 1 : 0, { duration: d, easing });
  }, [visible, kind, reduced, backdrop, slide]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdrop.value,
  }));

  const contentAnim = useAnimatedStyle(() => {
    if (kind === 'sheet') {
      return {
        opacity: slide.value,
        transform: [{ translateY: (1 - slide.value) * 60 }],
      };
    }
    if (kind === 'reveal') {
      return {
        opacity: slide.value,
        transform: [{ scale: 0.94 + slide.value * 0.06 }],
      };
    }
    return {
      opacity: slide.value,
      transform: [{ scale: 0.96 + slide.value * 0.04 }],
    };
  });

  return (
    <RNModal
      transparent
      visible={visible}
      onRequestClose={onDismiss}
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View
        style={[StyleSheet.absoluteFillObject, styles.backdrop, backdropStyle]}
      >
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={dismissOnBackdrop ? onDismiss : undefined}
          accessibilityLabel="닫기"
        />
      </Animated.View>

      <View style={LAYOUT[kind]} pointerEvents="box-none">
        <Animated.View
          style={[CONTAINER[kind], elevation.lifted, contentAnim, contentStyle]}
        >
          {children}
        </Animated.View>
      </View>
    </RNModal>
  );
}

const LAYOUT: Record<ModalKind, ViewStyle> = {
  sheet: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  dialog: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.lg,
  },
  reveal: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
  },
};

const CONTAINER: Record<ModalKind, ViewStyle> = {
  sheet: {
    backgroundColor: colors.ink.mid,
    borderTopLeftRadius: radii.panel,
    borderTopRightRadius: radii.panel,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.edge.gilt,
    padding: space.base,
    paddingBottom: space.lg,
    maxHeight: '85%',
  },
  dialog: {
    backgroundColor: colors.ink.mid,
    borderRadius: radii.panel,
    borderWidth: 1,
    borderColor: colors.edge.default,
    padding: space.lg,
    minWidth: 280,
    maxWidth: 420,
  },
  reveal: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(5,3,1,0.78)',
  },
});
