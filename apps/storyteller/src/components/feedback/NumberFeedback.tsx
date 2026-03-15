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

interface NumberFeedbackProps {
  suggestedNumber?: number;
  onSend: (fb: NightFeedbackPayload) => void;
}

export function NumberFeedback({
  suggestedNumber,
  onSend,
}: NumberFeedbackProps) {
  const styles = useNightActionLogStyles();
  const hasSuggestion = suggestedNumber !== undefined;
  return (
    <View style={styles.composerRow}>
      {[0, 1, 2, 3].map((n) => {
        const isSuggested = hasSuggestion && n === suggestedNumber;
        const isDimmed = hasSuggestion && n !== suggestedNumber;
        return (
          <Pressable
            key={n}
            onPress={() => onSend({ type: 'number', value: n })}
            style={[
              styles.numberButton,
              isSuggested && styles.numberButtonSuggested,
              isDimmed && styles.numberButtonDimmed,
            ]}
          >
            <Text
              style={[
                styles.numberText,
                isSuggested && styles.numberTextSuggested,
                isDimmed && styles.numberTextDimmed,
              ]}
            >
              {n}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
