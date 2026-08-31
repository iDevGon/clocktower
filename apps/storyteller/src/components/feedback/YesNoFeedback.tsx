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
  suggestedValue?: boolean;
  onSend: (fb: NightFeedbackPayload) => void;
}

const CHOICES = [
  { label: '예', value: true, buttonStyle: 'yesButton', textStyle: 'yesText' },
  {
    label: '아니오',
    value: false,
    buttonStyle: 'noButton',
    textStyle: 'noText',
  },
] as const;

export function YesNoFeedback({ suggestedValue, onSend }: YesNoFeedbackProps) {
  const styles = useNightActionLogStyles();
  const hasSuggestion = suggestedValue !== undefined;
  return (
    <View style={styles.composerRow}>
      {CHOICES.map(({ label, value, buttonStyle, textStyle }) => {
        const isSuggested = hasSuggestion && value === suggestedValue;
        const isDimmed = hasSuggestion && value !== suggestedValue;
        return (
          <Pressable
            key={label}
            onPress={() => onSend({ type: 'yes_no', value })}
            accessibilityRole="button"
            accessibilityLabel={
              isSuggested ? `${label}, 추천 피드백` : `${label} 피드백`
            }
            style={[
              styles.yesNoButton,
              styles[buttonStyle],
              isSuggested && styles.yesNoButtonSuggested,
              isDimmed && styles.yesNoButtonDimmed,
            ]}
          >
            <Text
              style={[
                styles[textStyle],
                isSuggested && styles.yesNoTextSuggested,
                isDimmed && styles.yesNoTextDimmed,
              ]}
            >
              {label}
            </Text>
            {isSuggested && (
              <Text style={styles.recommendationLabel}>추천</Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
