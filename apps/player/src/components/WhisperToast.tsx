import { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { useWhisperStore } from '../stores/whisperStore';
import { styles } from './WhisperToast.styles';

const TOAST_DURATION = 3000;

interface WhisperToastProps {
  onNavigate?: (conversationId: string) => void;
}

export function WhisperToast({ onNavigate }: WhisperToastProps) {
  const toast = useWhisperStore((s) => s.toast);
  const dismissToast = useWhisperStore((s) => s.dismissToast);
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

  const isGroup = toast.participantNames.length > 2;

  return (
    <Animated.View
      style={[styles.container, { opacity, transform: [{ translateY }] }]}
    >
      <Pressable
        style={styles.content}
        onPress={() => {
          if (timerRef.current) clearTimeout(timerRef.current);
          dismissToast();
          if (toast && onNavigate) {
            onNavigate(toast.conversationId);
          }
        }}
      >
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{isGroup ? '그룹 밀담' : '밀담'}</Text>
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.name} numberOfLines={1}>
            {toast.fromName}
          </Text>
          <Text style={styles.message} numberOfLines={1}>
            {toast.message}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
