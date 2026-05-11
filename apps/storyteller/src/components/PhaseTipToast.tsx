import type { Phase } from '@clocktower/shared';
import { useReducedMotion } from '@clocktower/ui';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

const TOAST_DURATION = 5000;

const TIP_BLUE = '#5a9ecf';
const TIP_GLOW = '#3a7abf';

const PHASE_TIP_COLORS: Record<
  Phase,
  { bg: string; border: string; badge: string; badgeText: string }
> = {
  setup: {
    bg: '#1a2230',
    border: '#2a3a5a',
    badge: '#1e2e4a',
    badgeText: TIP_BLUE,
  },
  night: {
    bg: '#1a1a2e',
    border: '#2a3a6a',
    badge: '#1e2848',
    badgeText: '#7090d0',
  },
  day: {
    bg: '#1e2430',
    border: '#3a4a6a',
    badge: '#1e2e4a',
    badgeText: TIP_BLUE,
  },
  vote: {
    bg: '#1e2030',
    border: '#3a3a5a',
    badge: '#1e2848',
    badgeText: TIP_BLUE,
  },
  ended: {
    bg: '#1a2230',
    border: '#2a3a5a',
    badge: '#1e2e4a',
    badgeText: TIP_BLUE,
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
  const reduced = useReducedMotion();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    if (visible) {
      if (reduced) {
        opacity.setValue(1);
        translateY.setValue(0);
      } else {
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
      }

      timerRef.current = setTimeout(() => {
        if (reduced) {
          onDismissRef.current();
        } else {
          Animated.timing(opacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }).start(() => onDismissRef.current());
        }
      }, TOAST_DURATION);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, opacity, translateY, reduced]);

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
          if (reduced) {
            onDismiss();
          } else {
            Animated.timing(opacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }).start(() => onDismiss());
          }
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
    bottom: 16,
    left: 16,
    right: 16,
    zIndex: 600,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    shadowColor: TIP_GLOW,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
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
    textShadowColor: TIP_GLOW,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  textWrap: {
    flex: 1,
  },
  message: {
    color: TIP_BLUE,
    fontSize: 13,
    lineHeight: 19,
    fontStyle: 'italic',
    textShadowColor: TIP_GLOW,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
});
