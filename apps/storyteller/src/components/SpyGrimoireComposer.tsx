import type { NightFeedbackPayload, Player } from '@clocktower/shared';
import { getRoleById } from '@clocktower/shared';
import { colors, typography } from '@clocktower/ui';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import { useGameEditionRoles } from './feedback/useGameEditionRoles';
import { RolePickerModal } from './RolePickerModal';
import {
  buildManualSpyGrimoireEntries,
  createAutoFakeSpyGrimoireSelections,
  type SpyGrimoireSelections,
} from './spyGrimoire';

interface SpyGrimoireComposerProps {
  players: Player[];
  spyPlayer: Player;
  onSend: (
    playerId: string,
    feedback: NightFeedbackPayload,
    callback?: (result: { success: boolean; error?: string }) => void,
  ) => void;
  onSent?: (result: { success: boolean; error?: string }) => void;
}

export function SpyGrimoireComposer({
  players,
  spyPlayer,
  onSend,
  onSent,
}: SpyGrimoireComposerProps) {
  const { fontSize } = useResponsive();
  const scale = fontSize.md / 12;
  const s = (v: number) => Math.round(v * scale);
  const styles = useMemo(() => createStyles(scale), [scale]);
  const roles = useGameEditionRoles(players);
  const [selections, setSelections] = useState<SpyGrimoireSelections>({});
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const canSend = players.every((player) => selections[player.id]);

  const editingPlayer = editingPlayerId
    ? players.find((player) => player.id === editingPlayerId)
    : null;

  const applyAutoFake = () => {
    setSelections(createAutoFakeSpyGrimoireSelections(players));
  };

  const send = () => {
    if (!canSend) return;
    onSend(
      spyPlayer.id,
      {
        type: 'grimoire',
        entries: buildManualSpyGrimoireEntries(players, selections),
      },
      (result) => {
        if (result.success) onSent?.(result);
      },
    );
  };

  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>첩자 가짜 그리모어</Text>
          <Text style={styles.subtitle}>
            {spyPlayer.name}의 능력이 중독/취함으로 무효입니다
          </Text>
        </View>
        <Pressable onPress={applyAutoFake} style={styles.secondaryButton}>
          <Text style={styles.secondaryText}>자동 가짜 생성</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={{ gap: s(8), paddingBottom: s(8) }}
        nestedScrollEnabled
      >
        {players.map((player) => {
          const selectedRole = getRoleById(selections[player.id] ?? '');
          return (
            <Pressable
              key={player.id}
              onPress={() => setEditingPlayerId(player.id)}
              style={styles.row}
            >
              <View style={styles.nameBlock}>
                <Text style={styles.playerName}>{player.name}</Text>
                <Text style={styles.publicState}>
                  {player.isAlive ? '생존' : '사망'}
                </Text>
              </View>
              <Text
                style={[
                  styles.selectedRole,
                  !selectedRole && styles.placeholderRole,
                ]}
              >
                {selectedRole?.name ?? '전달할 역할 선택'}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Pressable
        onPress={send}
        disabled={!canSend}
        style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
      >
        <Text style={styles.sendText}>그리모어 전달</Text>
      </Pressable>

      <RolePickerModal
        visible={editingPlayer != null}
        title="가짜 역할 선택"
        description={`${editingPlayer?.name ?? '플레이어'}에게 보일 역할을 선택하세요`}
        roles={roles}
        onSelectRole={(roleId) => {
          if (!editingPlayerId) return;
          setSelections((prev) => ({ ...prev, [editingPlayerId]: roleId }));
          setEditingPlayerId(null);
        }}
        onClose={() => setEditingPlayerId(null)}
        scale={scale}
      />
    </View>
  );
}

function createStyles(scale: number) {
  const s = (v: number) => Math.round(v * scale);
  return StyleSheet.create({
    panel: {
      backgroundColor: colors.arcane.surface.apparatus,
      borderWidth: 1,
      borderColor: colors.arcane.border.brassDim,
      padding: s(12),
      gap: s(10),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: s(10),
    },
    title: {
      color: colors.arcane.action.bloodHighlight,
      fontFamily: typography.fontFamily.display,
      fontSize: s(15),
      fontWeight: '700',
    },
    subtitle: {
      color: colors.arcane.text.muted,
      fontFamily: typography.fontFamily.body,
      fontSize: s(11),
      marginTop: s(3),
    },
    secondaryButton: {
      borderWidth: 1,
      borderColor: colors.arcane.border.brass,
      backgroundColor: colors.arcane.surface.parchment,
      borderRadius: s(6),
      paddingHorizontal: s(10),
      paddingVertical: s(8),
    },
    secondaryText: {
      color: colors.arcane.text.label,
      fontFamily: typography.fontFamily.bodyBold,
      fontSize: s(11),
      fontWeight: '700',
    },
    list: {
      maxHeight: s(260),
    },
    row: {
      minHeight: s(48),
      borderWidth: 1,
      borderColor: colors.arcane.border.brassDim,
      backgroundColor: colors.arcane.surface.base,
      borderRadius: s(6),
      paddingHorizontal: s(10),
      paddingVertical: s(8),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: s(8),
    },
    nameBlock: {
      flex: 1,
      minWidth: 0,
    },
    playerName: {
      color: colors.arcane.text.strong,
      fontFamily: typography.fontFamily.bodyBold,
      fontSize: s(12),
      fontWeight: '700',
    },
    publicState: {
      color: colors.arcane.text.dead,
      fontFamily: typography.fontFamily.body,
      fontSize: s(10),
      marginTop: s(2),
    },
    selectedRole: {
      color: colors.arcane.text.label,
      fontFamily: typography.fontFamily.bodyBold,
      fontSize: s(12),
      fontWeight: '700',
      textAlign: 'right',
      flexShrink: 1,
    },
    placeholderRole: {
      color: colors.arcane.text.dead,
      fontWeight: '500',
    },
    sendButton: {
      backgroundColor: colors.arcane.action.blood,
      borderRadius: s(6),
      minHeight: s(42),
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendButtonDisabled: {
      backgroundColor: colors.arcane.surface.ledger,
      opacity: 0.6,
    },
    sendText: {
      color: colors.arcane.text.strong,
      fontFamily: typography.fontFamily.bodyBold,
      fontSize: s(13),
      fontWeight: '700',
    },
  });
}
