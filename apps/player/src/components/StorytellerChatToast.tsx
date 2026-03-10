import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useChatStore } from '../stores/chatStore';

const TOAST_DURATION = 3000;

interface StorytellerChatToastProps {
  onPress?: () => void;
}

export function StorytellerChatToast({ onPress }: StorytellerChatToastProps) {
  const toast = useChatStore((s) => s.toast);
  const dismissToast = useChatStore((s) => s.dismissToast);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (toast) {
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
        }).start(() => dismissToast());
      }, TOAST_DURATION);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast, opacity, translateY, dismissToast]);

  if (!toast) return null;

  return (
    <Animated.View
      style={[styles.container, { opacity, transform: [{ translateY }] }]}
    >
      <Pressable
        style={styles.content}
        onPress={() => {
          if (timerRef.current) clearTimeout(timerRef.current);
          dismissToast();
          onPress?.();
        }}
      >
        <View style={styles.badge}>
          <Text style={styles.badgeText}>진행자</Text>
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.message} numberOfLines={2}>
            {toast.message}
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
    zIndex: 101,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2e',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#4a3a5a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  badge: {
    backgroundColor: '#5a3a6a',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 10,
  },
  badgeText: {
    color: '#d4c0e8',
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
