import type { Player } from '@clocktower/shared';
import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface PitHagDemonCreationModalProps {
  visible: boolean;
  pending: {
    targetId: string;
  } | null;
  players: Player[];
  onResolve: (killPlayerIds: string[]) => void;
}

export function PitHagDemonCreationModal({
  visible,
  pending,
  players,
  onResolve,
}: PitHagDemonCreationModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (visible) setSelectedIds([]);
  }, [visible]);

  if (!pending) return null;

  const livingPlayers = players.filter((player) => player.isAlive);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>마귀할멈: 새 악마 생성</Text>
          <Text style={styles.message}>
            새 악마가 만들어졌습니다. 이번 밤 임의로 사망시킬 플레이어를
            선택하세요. 선택하지 않고 판정을 끝낼 수도 있습니다.
          </Text>
          <ScrollView style={styles.playerList}>
            {livingPlayers.map((player) => {
              const selected = selectedIds.includes(player.id);
              return (
                <Pressable
                  key={player.id}
                  onPress={() =>
                    setSelectedIds((ids) =>
                      selected
                        ? ids.filter((id) => id !== player.id)
                        : [...ids, player.id],
                    )
                  }
                  style={[styles.player, selected && styles.playerSelected]}
                >
                  <Text style={styles.playerName}>{player.name}</Text>
                  {player.id === pending.targetId && (
                    <Text style={styles.demonLabel}>새 악마</Text>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
          <View style={styles.actions}>
            <Pressable
              onPress={() => onResolve(selectedIds)}
              style={styles.resolveButton}
            >
              <Text style={styles.resolveText}>
                {selectedIds.length > 0
                  ? `${selectedIds.length}명 사망 처리`
                  : '사망 없이 판정 완료'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  card: {
    maxHeight: '80%',
    borderRadius: 8,
    padding: 18,
    backgroundColor: '#20171a',
    borderWidth: 1,
    borderColor: '#8b3a3a',
  },
  title: {
    color: '#f0b0a0',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  message: {
    color: '#d8c8c4',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  playerList: {
    marginBottom: 14,
  },
  player: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 12,
    marginBottom: 6,
    borderRadius: 5,
    backgroundColor: '#2a2425',
    borderWidth: 1,
    borderColor: '#4a3a3a',
  },
  playerSelected: {
    backgroundColor: '#54282b',
    borderColor: '#c05b5b',
  },
  playerName: {
    color: '#f2e7e3',
    fontSize: 14,
  },
  demonLabel: {
    color: '#e9a16b',
    fontSize: 11,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
  },
  resolveButton: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 5,
    paddingVertical: 12,
    backgroundColor: '#7a3034',
  },
  resolveText: {
    color: '#fff4ef',
    fontSize: 14,
    fontWeight: '700',
  },
});
