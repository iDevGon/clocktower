import { colors, SpriteIcon } from '@clocktower/ui';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { arcaneUiSprite, uiIcon } from '../assets/ui';
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
          <SpriteIcon source={arcaneUiSprite} index={uiIcon.menu} size={30} />
        </Pressable>
      )}
    </View>
  );
}

const localStyles = StyleSheet.create({
  menuButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.arcane.border.brassDim,
    backgroundColor: colors.arcane.accent.midnightInk,
  },
});
