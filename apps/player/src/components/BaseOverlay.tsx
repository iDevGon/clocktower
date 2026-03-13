import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

/**
 * 오버레이 공통 베이스 컴포넌트.
 *
 * 모든 전체 화면 오버레이(사망, 처형, 게임 종료, 불발 등)가 공유하는
 * 반투명 배경, 진입/퇴장 애니메이션, 선택적 탭 닫기를 처리합니다.
 */

interface BaseOverlayProps {
  /** 배경 색상 (기본: '#0a0000') */
  backgroundColor?: string;
  /** z-index (기본: 90) */
  zIndex?: number;
  /** 배경 효과 레이어 (비네트, 파티클 등) */
  effectsLayer?: ReactNode;
  /** 메인 콘텐츠 */
  children: ReactNode;
  /** 닫기 콜백 */
  onDismiss?: () => void;
  /** 배경 탭으로 닫기 허용 (기본: false) */
  dismissOnBackdropPress?: boolean;
  /** 자동 닫기 딜레이 (ms). 설정 시 해당 시간 후 fade-out 후 onDismiss 호출 */
  autoDismissMs?: number;
  /** fade-out 애니메이션 시간 (ms, 기본: 800) */
  fadeOutDurationMs?: number;
  /** 콘텐츠를 ScrollView로 감쌀지 여부 (기본: false) */
  scrollable?: boolean;
  /** 콘텐츠 정렬 (기본: 'center') */
  contentAlign?: 'center' | 'flex-start' | 'flex-end';
}

export function BaseOverlay({
  backgroundColor = '#0a0000',
  zIndex = 90,
  effectsLayer,
  children,
  onDismiss,
  dismissOnBackdropPress = false,
  autoDismissMs,
  fadeOutDurationMs = 800,
  scrollable = false,
  contentAlign = 'center',
}: BaseOverlayProps) {
  const fadeOut = useSharedValue(1);

  useEffect(() => {
    if (autoDismissMs != null && onDismiss) {
      fadeOut.value = withDelay(
        autoDismissMs,
        withTiming(
          0,
          { duration: fadeOutDurationMs, easing: Easing.in(Easing.quad) },
          (finished) => {
            if (finished) {
              runOnJS(onDismiss)();
            }
          },
        ),
      );
    }
    return () => cancelAnimation(fadeOut);
  }, [fadeOut, autoDismissMs, fadeOutDurationMs, onDismiss]);

  const containerAnimStyle = useAnimatedStyle(() => ({
    opacity: fadeOut.value,
  }));

  const Wrapper = dismissOnBackdropPress ? Pressable : View;
  const wrapperProps = dismissOnBackdropPress ? { onPress: onDismiss } : {};

  const contentNode = scrollable ? (
    <Animated.ScrollView
      style={s.scrollView}
      contentContainerStyle={[
        s.contentContainer,
        { justifyContent: contentAlign },
      ]}
    >
      {children}
    </Animated.ScrollView>
  ) : (
    <View
      style={[s.contentContainer, { justifyContent: contentAlign }]}
      pointerEvents="box-none"
    >
      {children}
    </View>
  );

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { zIndex }, containerAnimStyle]}
    >
      <Wrapper style={[StyleSheet.absoluteFill, s.overlay]} {...wrapperProps}>
        {/* 배경 색상 레이어 */}
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor }]}
          pointerEvents="none"
        />

        {/* 효과 레이어 (비네트, 파티클 등) */}
        {effectsLayer}

        {/* 콘텐츠 레이어 */}
        {contentNode}
      </Wrapper>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
  },
});
