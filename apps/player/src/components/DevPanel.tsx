import type { Phase, Role } from '@clocktower/shared';
import { TROUBLE_BREWING_ROLES } from '@clocktower/shared';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { styles } from './DevPanel.styles';
import { usePlayerStore } from '../stores/playerStore';

interface DevPanelProps {
  currentPhase: Phase;
  role: Role | null;
}

export function DevPanel({ currentPhase, role }: DevPanelProps) {
  const [devOpen, setDevOpen] = useState(false);

  const devSetRole = (roleId: string) => {
    const r = TROUBLE_BREWING_ROLES.find((x) => x.id === roleId) ?? null;
    usePlayerStore.getState().set({ role: r });
  };

  const devSetPhase = (phase: Phase) => {
    usePlayerStore.getState().set({
      currentPhase: phase,
      nomination: null,
      daySubPhase: phase === 'day' ? 'whisper' : null,
      nightProgress:
        phase === 'night'
          ? {
              activeRoleId: role?.id ?? null,
              order: [],
              players: [
                { id: 'dummy1', name: '앨리스', isAlive: true },
                { id: 'dummy2', name: '밥', isAlive: true },
                { id: 'dummy3', name: '찰리', isAlive: true },
                { id: 'dummy4', name: '다이앤', isAlive: true },
              ],
            }
          : null,
      nightActionSubmitted: false,
    });
  };

  return (
    <View style={styles.devPanel}>
      <Pressable
        onPress={() => setDevOpen((v) => !v)}
        style={styles.devToggle}
      >
        <Text style={styles.devToggleText}>
          {devOpen ? 'DEV 닫기' : 'DEV 열기'}
        </Text>
      </Pressable>
      {devOpen && (
        <>
          <View style={styles.devSection}>
            <Text style={styles.devSectionTitle}>페이즈 전환</Text>
            <View style={styles.devRow}>
              {(['setup', 'night', 'day', 'vote', 'ended'] as Phase[]).map(
                (p) => (
                  <Pressable
                    key={p}
                    onPress={() => devSetPhase(p)}
                    style={[
                      styles.devChip,
                      currentPhase === p && styles.devChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.devChipText,
                        currentPhase === p && styles.devChipTextActive,
                      ]}
                    >
                      {p}
                    </Text>
                  </Pressable>
                ),
              )}
            </View>
          </View>
          <View style={styles.devSection}>
            <Text style={styles.devSectionTitle}>직업 선택</Text>
            <View style={styles.devRoleList}>
              {TROUBLE_BREWING_ROLES.map((r) => (
                <Pressable
                  key={r.id}
                  onPress={() => devSetRole(r.id)}
                  style={[
                    styles.devChip,
                    role?.id === r.id && styles.devChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.devChipText,
                      role?.id === r.id && styles.devChipTextActive,
                    ]}
                  >
                    {r.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </>
      )}
    </View>
  );
}

