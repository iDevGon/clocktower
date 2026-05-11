import type { Role } from '@clocktower/shared';
import { getRoleById } from '@clocktower/shared';
import { colors, useReducedMotion } from '@clocktower/ui';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { styles } from './NightProgress.styles';

function ActiveGlow({ isMine }: { isMine: boolean }) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.out(Easing.ease) }),
        withTiming(0, { duration: 0 }),
      ),
      -1,
    );
    return () => cancelAnimation(progress);
  }, [progress, reduced]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.6, 0]),
    transform: [{ scale: interpolate(progress.value, [0, 1], [1, 2.4]) }],
  }));

  return (
    <Animated.View
      style={[
        styles.activeGlow,
        { backgroundColor: isMine ? colors.phase.day : '#8090c0' },
        animStyle,
      ]}
    />
  );
}

interface NightProgressProps {
  activeRoleId: string | null;
  order: string[];
  myRole: Role | null;
  drunkAs?: string | null;
  /** 서버에서 night:wakeUp을 받았는지 여부 */
  nightWakeUp?: boolean;
}

export function NightProgress({
  activeRoleId,
  order,
  myRole,
  drunkAs,
  nightWakeUp = false,
}: NightProgressProps) {
  const isRoleActive =
    myRole != null &&
    (activeRoleId === myRole.id ||
      (drunkAs != null && activeRoleId === drunkAs));
  // 서버가 night:wakeUp을 개별 전송하므로, wakeUp 수신 시에만 차례로 인정
  const isMyTurn = isRoleActive && nightWakeUp;
  const reduced = useReducedMotion();
  const pulseAnim = useSharedValue(1);

  useEffect(() => {
    if (!isMyTurn || reduced) {
      cancelAnimation(pulseAnim);
      pulseAnim.value = 1;
      return;
    }
    // 진동은 night:wakeUp 리스너에서 처리 (이중 진동 방지)
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
    return () => cancelAnimation(pulseAnim);
  }, [isMyTurn, pulseAnim, reduced]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseAnim.value,
  }));

  const activeIndex = activeRoleId ? order.indexOf(activeRoleId) : -1;

  return (
    <View style={styles.container}>
      {isMyTurn && (
        <Animated.View style={[styles.myTurnBanner, pulseStyle]}>
          <Text style={styles.myTurnText}>당신의 차례입니다</Text>
        </Animated.View>
      )}

      <View style={styles.progressBar}>
        {order.map((roleId, index) => {
          const role = getRoleById(roleId);
          const isActive = roleId === activeRoleId;
          const isPast = activeIndex >= 0 && index < activeIndex;
          const isMine =
            myRole?.id === roleId || (drunkAs != null && drunkAs === roleId);
          const isFirst = index === 0;
          const isLast = index === order.length - 1;

          return (
            <View key={roleId} style={styles.stepWrapper}>
              <View style={styles.stepRow}>
                <View
                  style={[
                    styles.line,
                    isFirst
                      ? styles.lineHidden
                      : (isPast || isActive) && styles.linePast,
                  ]}
                />
                <View style={styles.dotContainer}>
                  {isActive && !reduced && <ActiveGlow isMine={isMine} />}
                  <View
                    style={[
                      styles.dot,
                      isPast && styles.dotPast,
                      isActive && styles.dotActive,
                      isMine && !isActive && styles.dotMine,
                      isMine && isActive && styles.dotMyActive,
                    ]}
                  />
                </View>
                <View
                  style={[
                    styles.line,
                    isLast ? styles.lineHidden : isPast && styles.linePast,
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.roleName,
                  isPast && styles.roleNamePast,
                  isActive && styles.roleNameActive,
                  isMine && styles.roleNameMine,
                ]}
                numberOfLines={1}
              >
                {isMine ? (role?.name ?? roleId) : '???'}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
