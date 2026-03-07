import type { Role } from '@clocktower/shared';
import { getRoleById } from '@clocktower/shared';
import { useEffect, useRef } from 'react';
import { Animated, Text, Vibration, View } from 'react-native';
import { styles } from './NightProgress.styles';

interface NightProgressProps {
  activeRoleId: string | null;
  order: string[];
  myRole: Role | null;
}

export function NightProgress({
  activeRoleId,
  order,
  myRole,
}: NightProgressProps) {
  const isMyTurn = myRole != null && activeRoleId === myRole.id;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isMyTurn) {
      // 진동 3회 반복 (패턴: 대기, 진동, 대기, 진동, 대기, 진동)
      Vibration.vibrate([0, 400, 200, 400, 200, 400]);

      // 펄스 애니메이션
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isMyTurn, pulseAnim]);

  const activeIndex = activeRoleId ? order.indexOf(activeRoleId) : -1;

  return (
    <View style={styles.container}>
      {isMyTurn && (
        <Animated.View style={[styles.myTurnBanner, { opacity: pulseAnim }]}>
          <Text style={styles.myTurnText}>당신의 차례입니다</Text>
        </Animated.View>
      )}

      <View style={styles.progressBar}>
        {order.map((roleId, index) => {
          const role = getRoleById(roleId);
          const isActive = roleId === activeRoleId;
          const isPast = activeIndex >= 0 && index < activeIndex;
          const isMine = myRole?.id === roleId;

          return (
            <View key={roleId} style={styles.stepWrapper}>
              <View style={styles.stepRow}>
                <View
                  style={[
                    styles.dot,
                    isPast && styles.dotPast,
                    isActive && styles.dotActive,
                    isMine && !isActive && styles.dotMine,
                    isMine && isActive && styles.dotMyActive,
                  ]}
                />
                {index < order.length - 1 && (
                  <View style={[styles.line, isPast && styles.linePast]} />
                )}
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

