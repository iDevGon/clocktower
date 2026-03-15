import type { NightFeedbackPayload } from '@clocktower/shared';
import { ALL_ROLES } from '@clocktower/shared';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';
import { createNightActionLogStyles } from '../NightActionLog.styles';

function useNightActionLogStyles() {
  const { fontSize } = useResponsive();
  const scale = fontSize.md / 12;
  return useMemo(() => createNightActionLogStyles(scale), [scale]);
}

interface RoleFeedbackProps {
  onSend: (fb: NightFeedbackPayload) => void;
}

export function RoleFeedback({ onSend }: RoleFeedbackProps) {
  const styles = useNightActionLogStyles();
  return (
    <View style={styles.composerVertical}>
      <Text style={styles.composerLabel}>캐릭터 선택</Text>
      <View style={styles.composerChips}>
        {ALL_ROLES.map((r) => (
          <Pressable
            key={r.id}
            onPress={() => onSend({ type: 'role', roleName: r.name })}
            style={styles.chip}
          >
            <Text style={styles.chipText}>{r.name}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
