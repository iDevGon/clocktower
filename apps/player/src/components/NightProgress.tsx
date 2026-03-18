import type { Role } from '@clocktower/shared';
import { getRoleById } from '@clocktower/shared';
import { useEffect } from 'react';
import { Text, Vibration, View } from 'react-native';
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
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.out(Easing.ease) }),
        withTiming(0, { duration: 0 }),
      ),
      -1,
    );
    return () => cancelAnimation(progress);
  }, [progress]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.6, 0]),
    transform: [{ scale: interpolate(progress.value, [0, 1], [1, 2.4]) }],
  }));

  return (
    <Animated.View
      style={[
        styles.activeGlow,
        { backgroundColor: isMine ? '#c4a050' : '#8090c0' },
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
  isAlive?: boolean;
  /** 서버에서 night:wakeUp을 받았는지 여부 (onlyWhenDead 역할용) */
  nightWakeUp?: boolean;
}

export function NightProgress({
  activeRoleId,
  order,
  myRole,
  drunkAs,
  isAlive = true,
  nightWakeUp = false,
}: NightProgressProps) {
  const isRoleActive =
    myRole != null &&
    (activeRoleId === myRole.id ||
      (drunkAs != null && activeRoleId === drunkAs));
  const isMyTurn = isRoleActive && (nightWakeUp || isAlive);
  const pulseAnim = useSharedValue(1);

  useEffect(() => {
    if (isMyTurn) {
      Vibration.vibrate([0, 400, 200, 400, 200, 400]);

      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
      );
    } else {
      cancelAnimation(pulseAnim);
      pulseAnim.value = 1;
    }
    return () => cancelAnimation(pulseAnim);
  }, [isMyTurn, pulseAnim]);

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
                  {isActive && <ActiveGlow isMine={isMine} />}
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
