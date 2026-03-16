import type { Phase } from '@clocktower/shared';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

const TOAST_DURATION = 5000;

const PHASE_TIP_COLORS: Record<
  Phase,
  { bg: string; border: string; badge: string; badgeText: string }
> = {
  setup: {
    bg: '#2a2a2e',
    border: '#4a4a4e',
    badge: '#5a5a5e',
    badgeText: '#c0c0c0',
  },
  night: {
    bg: '#1a1a2e',
    border: '#3a4a6a',
    badge: '#2a3a6a',
    badgeText: '#8090c0',
  },
  day: {
    bg: '#2a2418',
    border: '#5a4a2a',
    badge: '#4a3a1a',
    badgeText: '#c4a050',
  },
  vote: {
    bg: '#2a1a1a',
    border: '#5a3030',
    badge: '#4a2020',
    badgeText: '#c47070',
  },
  ended: {
    bg: '#2a1a1a',
    border: '#5a3030',
    badge: '#4a2020',
    badgeText: '#b85c5c',
  },
};

interface PhaseTipToastProps {
  visible: boolean;
  phase: Phase;
  tip: string;
  onDismiss: () => void;
}

export function PhaseTipToast({
  visible,
  phase,
  tip,
  onDismiss,
}: PhaseTipToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (visible) {
      opacity.setValue(0);
      translateY.setValue(-20);

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      timerRef.current = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(() => onDismiss());
      }, TOAST_DURATION);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, opacity, translateY, onDismiss]);

  if (!visible) return null;

  const colors = PHASE_TIP_COLORS[phase] ?? PHASE_TIP_COLORS.night;

  return (
    <Animated.View
      style={[styles.container, { opacity, transform: [{ translateY }] }]}
    >
      <Pressable
        style={[
          styles.content,
          { backgroundColor: colors.bg, borderColor: colors.border },
        ]}
        onPress={() => {
          if (timerRef.current) clearTimeout(timerRef.current);
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start(() => onDismiss());
        }}
      >
        <View style={[styles.badge, { backgroundColor: colors.badge }]}>
          <Text style={[styles.badgeText, { color: colors.badgeText }]}>
            TIP
          </Text>
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.message} numberOfLines={3}>
            {tip}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    zIndex: 600,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  textWrap: {
    flex: 1,
  },
  message: {
    color: '#d0d0d0',
    fontSize: 13,
    lineHeight: 19,
    fontStyle: 'italic',
  },
});
