import type { NightFeedbackPayload } from '@clocktower/shared';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';
import { createNightActionLogStyles } from '../NightActionLog.styles';

function useNightActionLogStyles() {
  const { fontSize } = useResponsive();
  const scale = fontSize.md / 12;
  return useMemo(() => createNightActionLogStyles(scale), [scale]);
}

interface YesNoFeedbackProps {
  onSend: (fb: NightFeedbackPayload) => void;
}

export function YesNoFeedback({ onSend }: YesNoFeedbackProps) {
  const styles = useNightActionLogStyles();
  return (
    <View style={styles.composerRow}>
      <Pressable
        onPress={() => onSend({ type: 'yes_no', value: true })}
        style={[styles.yesNoButton, styles.yesButton]}
      >
        <Text style={styles.yesText}>예</Text>
      </Pressable>
      <Pressable
        onPress={() => onSend({ type: 'yes_no', value: false })}
        style={[styles.yesNoButton, styles.noButton]}
      >
        <Text style={styles.noText}>아니오</Text>
      </Pressable>
    </View>
  );
}
