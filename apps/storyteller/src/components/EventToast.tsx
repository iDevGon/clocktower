import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useGameStore } from '../stores/gameStore';

const TOAST_DURATION = 4000;

export function EventToast() {
  const eventToast = useGameStore((s) => s.eventToast);
  const dismissEventToast = useGameStore((s) => s.dismissEventToast);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (eventToast) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      timerRef.current = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => dismissEventToast());
      }, TOAST_DURATION);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [eventToast, opacity, translateY, dismissEventToast]);

  if (!eventToast) return null;

  return (
    <Animated.View
      style={[styles.container, { opacity, transform: [{ translateY }] }]}
    >
      <Pressable
        style={styles.content}
        onPress={() => {
          if (timerRef.current) clearTimeout(timerRef.current);
          dismissEventToast();
        }}
      >
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{eventToast.title}</Text>
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.message} numberOfLines={2}>
            {eventToast.message}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 54,
    left: 16,
    right: 16,
    zIndex: 650,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2020',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#6a3030',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  badge: {
    backgroundColor: '#7a2a2a',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 10,
  },
  badgeText: {
    color: '#f0c0c0',
    fontSize: 11,
    fontWeight: '700',
  },
  textWrap: {
    flex: 1,
  },
  message: {
    color: '#e0e0e0',
    fontSize: 13,
  },
});
