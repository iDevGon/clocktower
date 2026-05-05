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
  /** 표시할 최대 숫자 (기본 3, 곡예사는 5) */
  maxNumber?: number;
  onSend: (fb: NightFeedbackPayload) => void;
}

export function NumberFeedback({
  suggestedNumber,
  maxNumber = 3,
  onSend,
}: NumberFeedbackProps) {
  const styles = useNightActionLogStyles();
  const hasSuggestion = suggestedNumber !== undefined;
  const numbers = Array.from({ length: maxNumber + 1 }, (_, i) => i);
  return (
    <View style={styles.composerRow}>
      {numbers.map((n) => {
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
