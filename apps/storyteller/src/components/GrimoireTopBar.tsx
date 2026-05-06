import { colors } from '@clocktower/ui';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { createGrimoireStyles } from '../styles/grimoire.styles';

interface GrimoireTopBarProps {
  day: number;
  phase: string;
  daySubPhase?: string;
  onMenuPress?: () => void;
  styles: ReturnType<typeof createGrimoireStyles>;
}

export function GrimoireTopBar({
  day,
  phase,
  daySubPhase,
  onMenuPress,
  styles,
}: GrimoireTopBarProps) {
  const phaseLabel =
    phase === 'setup'
      ? '준비'
      : phase === 'night'
        ? '밤'
        : phase === 'day'
          ? daySubPhase === 'whisper'
            ? '낮 · 밀담'
            : daySubPhase === 'discussion'
              ? '낮 · 토론'
              : daySubPhase === 'nomination'
                ? '낮 · 지목'
                : daySubPhase === 'defense'
                  ? '낮 · 변론'
                  : '낮'
          : phase === 'vote'
            ? '투표'
            : phase === 'ended'
              ? '종료'
              : '';

  return (
    <View style={styles.topBar}>
      <Text style={styles.dayText}>
        {day}일차 · {phaseLabel}
      </Text>
      {onMenuPress && (
        <Pressable onPress={onMenuPress} style={localStyles.menuButton}>
          <Text style={localStyles.menuIcon}>☰</Text>
        </Pressable>
      )}
    </View>
  );
}

const localStyles = StyleSheet.create({
  menuButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  menuIcon: {
    color: colors.arcane.text.label,
    fontSize: 18,
  },
});
