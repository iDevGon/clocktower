import type { Role } from '@clocktower/shared';
import { getRoleById } from '@clocktower/shared';
import { useEffect, useRef } from 'react';
import { Animated, ScrollView, Text, Vibration, View, useWindowDimensions } from 'react-native';
import { styles } from './NightProgress.styles';

function ActiveGlow({ isMine }: { isMine: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 2.4,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.6,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [scale, opacity]);

  return (
    <Animated.View
      style={[
        styles.activeGlow,
        {
          backgroundColor: isMine ? '#c4a050' : '#8090c0',
          transform: [{ scale }],
          opacity,
        },
      ]}
    />
  );
}

interface NightProgressProps {
  activeRoleId: string | null;
  order: string[];
  myRole: Role | null;
  drunkAs?: string | null;
}

export function NightProgress({
  activeRoleId,
  order,
  myRole,
  drunkAs,
}: NightProgressProps) {
  const isMyTurn =
    myRole != null &&
    (activeRoleId === myRole.id ||
      (drunkAs != null && activeRoleId === drunkAs));
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
  const { width: screenWidth } = useWindowDimensions();
  const MIN_STEP_WIDTH = 48;
  const barPadding = 32; // paddingHorizontal 16 * 2
  const naturalStepWidth = (screenWidth - barPadding) / Math.max(order.length, 1);
  const needsScroll = naturalStepWidth < MIN_STEP_WIDTH;
  const stepWidth = needsScroll ? MIN_STEP_WIDTH : undefined;

  const barContent = order.map((roleId, index) => {
    const role = getRoleById(roleId);
    const isActive = roleId === activeRoleId;
    const isPast = activeIndex >= 0 && index < activeIndex;
    const isMine = myRole?.id === roleId || (drunkAs != null && drunkAs === roleId);
    const isFirst = index === 0;
    const isLast = index === order.length - 1;

    return (
      <View key={roleId} style={[styles.stepWrapper, stepWidth != null && { width: stepWidth, flex: undefined }]}>
        <View style={styles.stepRow}>
          <View style={[styles.line, isFirst ? styles.lineHidden : ((isPast || isActive) && styles.linePast)]} />
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
          <View style={[styles.line, isLast ? styles.lineHidden : (isPast && styles.linePast)]} />
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
  });

  return (
    <View style={styles.container}>
      {isMyTurn && (
        <Animated.View style={[styles.myTurnBanner, { opacity: pulseAnim }]}>
          <Text style={styles.myTurnText}>당신의 차례입니다</Text>
        </Animated.View>
      )}

      {needsScroll ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.progressBarScroll}
        >
          {barContent}
        </ScrollView>
      ) : (
        <View style={styles.progressBar}>
          {barContent}
        </View>
      )}
    </View>
  );
}
