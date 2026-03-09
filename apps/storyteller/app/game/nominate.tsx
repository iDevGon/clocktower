import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { PlayerList } from '../../src/components/PlayerList';
import { useGameActions } from '../../src/hooks/useGameActions';
import { useResponsive } from '../../src/hooks/useResponsive';
import { useGameStore } from '../../src/stores/gameStore';
import { createNominateStyles } from '../../src/styles/nominate.styles';

export default function NominateScreen() {
  const router = useRouter();
  const { fontSize } = useResponsive();
  const scale = fontSize.md / 12;
  const styles = useMemo(() => createNominateStyles(scale), [scale]);
  const players = useGameStore((s) => s.gameState?.players ?? []);
  const { nominate } = useGameActions();
  const [nominatorId, setNominatorId] = useState<string | null>(null);
  const [nomineeId, setNomineeId] = useState<string | null>(null);

  const alivePlayers = players.filter((p) => p.isAlive);

  const handleSubmit = () => {
    if (nominatorId && nomineeId) {
      nominate(nominatorId, nomineeId);
      router.back();
    }
  };

  const nominatorName = players.find((p) => p.id === nominatorId)?.name;
  const nomineeName = players.find((p) => p.id === nomineeId)?.name;
  const canSubmit = !!(nominatorId && nomineeId);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.instruction}>
          {!nominatorId ? '지목자를 선택하세요' : '피지목자를 선택하세요'}
        </Text>
        <View style={styles.selectionRow}>
          <View style={styles.selectionBox}>
            <Text style={styles.selectionLabel}>지목자</Text>
            <Text style={styles.selectionValue}>{nominatorName ?? '--'}</Text>
          </View>
          <View style={styles.selectionBox}>
            <Text style={styles.selectionLabel}>피지목자</Text>
            <Text style={styles.selectionValue}>{nomineeName ?? '--'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.listContainer}>
        <PlayerList
          players={alivePlayers}
          onPlayerPress={(p) => {
            if (!nominatorId) setNominatorId(p.id);
            else if (!nomineeId && p.id !== nominatorId) setNomineeId(p.id);
          }}
        />
      </View>

      <View style={styles.footer}>
        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit}
          style={({ pressed }) => [
            styles.submitButton,
            canSubmit
              ? [
                  styles.submitButtonActive,
                  pressed && styles.submitButtonPressed,
                ]
              : styles.submitButtonDisabled,
          ]}
        >
          <Text style={styles.submitButtonText}>투표 시작</Text>
        </Pressable>
      </View>
    </View>
  );
}
