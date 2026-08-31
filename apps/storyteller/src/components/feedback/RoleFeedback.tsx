import type { NightFeedbackPayload, Player } from '@clocktower/shared';
import { matchQuery } from '@clocktower/ui';
import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';
import { createNightActionLogStyles } from '../NightActionLog.styles';
import { useGameEditionRoles } from './useGameEditionRoles';

function useNightActionLogStyles() {
  const { fontSize } = useResponsive();
  const scale = fontSize.md / 12;
  return useMemo(() => createNightActionLogStyles(scale), [scale]);
}

interface RoleFeedbackProps {
  players: Player[];
  onSend: (fb: NightFeedbackPayload) => void;
  highlightedRoleName?: string;
}

export function RoleFeedback({
  players,
  onSend,
  highlightedRoleName,
}: RoleFeedbackProps) {
  const styles = useNightActionLogStyles();
  const [roleQuery, setRoleQuery] = useState('');
  const gameRoles = useGameEditionRoles(players);
  const hasSuggestion = highlightedRoleName !== undefined;

  const filteredRoles = useMemo(() => {
    if (!roleQuery.trim()) return gameRoles;
    return gameRoles.filter((r) => matchQuery(r.name, roleQuery.trim()));
  }, [gameRoles, roleQuery]);

  return (
    <View style={styles.composerVertical}>
      <Text style={styles.composerLabel}>캐릭터 선택</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="역할 검색 (초성 가능)"
        placeholderTextColor="#5c5a58"
        value={roleQuery}
        onChangeText={setRoleQuery}
        autoCorrect={false}
      />
      <View style={styles.composerChips}>
        {filteredRoles.map((r) => {
          const isHighlighted = r.name === highlightedRoleName;
          const isDimmed = hasSuggestion && !isHighlighted;
          return (
            <Pressable
              key={r.id}
              onPress={() => onSend({ type: 'role', roleName: r.name })}
              accessibilityRole="button"
              accessibilityLabel={
                isHighlighted ? `${r.name}, 추천 피드백` : `${r.name} 피드백`
              }
              style={[
                styles.chip,
                isHighlighted && styles.chipSuggested,
                isDimmed && styles.chipDimmed,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  isHighlighted && styles.chipTextSuggested,
                  isDimmed && styles.chipTextDimmed,
                ]}
              >
                {r.name}
              </Text>
              {isHighlighted && (
                <Text style={styles.recommendationLabel}>추천</Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
