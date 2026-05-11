import { ALL_ROLES, type PlayerInfo, type Role } from '@clocktower/shared';
import { colors, typography } from '@clocktower/ui';
import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const MAX_GUESSES = 5;

interface JugglerDeclareModalProps {
  visible: boolean;
  edition: string;
  players: PlayerInfo[];
  myPlayerId: string;
  onSubmit: (
    guesses: Array<{ playerId: string; roleId: string }>,
  ) => Promise<void> | void;
  onClose: () => void;
}

interface GuessRow {
  playerId: string | null;
  roleId: string | null;
}

type PickerMode =
  | { type: 'player'; rowIndex: number }
  | { type: 'role'; rowIndex: number }
  | null;

export function JugglerDeclareModal({
  visible,
  edition,
  players,
  myPlayerId,
  onSubmit,
  onClose,
}: JugglerDeclareModalProps) {
  const [rows, setRows] = useState<GuessRow[]>([
    { playerId: null, roleId: null },
  ]);
  const [picker, setPicker] = useState<PickerMode>(null);
  const [submitting, setSubmitting] = useState(false);

  const editionRoles = useMemo(
    () =>
      ALL_ROLES.filter((r) => r.edition === edition && r.team !== 'traveller'),
    [edition],
  );
  const eligiblePlayers = useMemo(
    () =>
      players.filter((p) => p.isAlive && p.id !== myPlayerId && !p.isTraveller),
    [players, myPlayerId],
  );

  const reset = () => {
    setRows([{ playerId: null, roleId: null }]);
    setPicker(null);
    setSubmitting(false);
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const updateRow = (index: number, patch: Partial<GuessRow>) => {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    );
  };
  const addRow = () => {
    if (rows.length >= MAX_GUESSES) return;
    setRows((prev) => [...prev, { playerId: null, roleId: null }]);
  };
  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const completeRows = rows.filter(
    (r): r is { playerId: string; roleId: string } =>
      r.playerId != null && r.roleId != null,
  );
  const canSubmit = completeRows.length >= 1 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    await onSubmit(
      completeRows.map((r) => ({
        playerId: r.playerId,
        roleId: r.roleId,
      })),
    );
    reset();
    onClose();
  };

  const findPlayer = (id: string | null) =>
    id ? players.find((p) => p.id === id) : undefined;
  const findRole = (id: string | null): Role | undefined =>
    id ? editionRoles.find((r) => r.id === id) : undefined;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <Text style={styles.title}>곡예사 공개 선언</Text>
          <Text style={styles.subtitle}>
            플레이어-역할 조합을 최대 5개 선언합니다 (모든 플레이어에게 공개)
          </Text>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
          >
            {rows.map((row, idx) => {
              const player = findPlayer(row.playerId);
              const role = findRole(row.roleId);
              return (
                <View key={`row-${idx}`} style={styles.row}>
                  <Text style={styles.rowIndex}>{idx + 1}</Text>
                  <Pressable
                    style={[styles.cell, !player && styles.cellEmpty]}
                    onPress={() => setPicker({ type: 'player', rowIndex: idx })}
                  >
                    <Text
                      style={[styles.cellText, !player && styles.cellTextEmpty]}
                    >
                      {player?.name ?? '플레이어'}
                    </Text>
                  </Pressable>
                  <Text style={styles.rowEq}>=</Text>
                  <Pressable
                    style={[styles.cell, !role && styles.cellEmpty]}
                    onPress={() => setPicker({ type: 'role', rowIndex: idx })}
                  >
                    <Text
                      style={[styles.cellText, !role && styles.cellTextEmpty]}
                    >
                      {role?.name ?? '역할'}
                    </Text>
                  </Pressable>
                  {rows.length > 1 && (
                    <Pressable
                      style={styles.removeButton}
                      onPress={() => removeRow(idx)}
                    >
                      <Text style={styles.removeText}>×</Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
            {rows.length < MAX_GUESSES && (
              <Pressable style={styles.addButton} onPress={addRow}>
                <Text style={styles.addText}>+ 추측 추가</Text>
              </Pressable>
            )}
          </ScrollView>

          <View style={styles.buttons}>
            <Pressable
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={submitting}
            >
              <Text style={styles.cancelText}>취소</Text>
            </Pressable>
            <Pressable
              style={[
                styles.confirmButton,
                !canSubmit && styles.confirmButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!canSubmit}
            >
              <Text
                style={[
                  styles.confirmText,
                  !canSubmit && styles.confirmTextDisabled,
                ]}
              >
                {submitting ? '선언 중…' : '공개 선언'}
              </Text>
            </Pressable>
          </View>

          {/* 인라인 picker (위에서 떠 있게) */}
          {picker && (
            <View style={styles.pickerOverlay}>
              <View style={styles.pickerPanel}>
                <Text style={styles.pickerTitle}>
                  {picker.type === 'player' ? '플레이어 선택' : '역할 선택'}
                </Text>
                <ScrollView style={styles.pickerScroll}>
                  {picker.type === 'player'
                    ? eligiblePlayers.map((p) => (
                        <Pressable
                          key={p.id}
                          style={styles.pickerRow}
                          onPress={() => {
                            updateRow(picker.rowIndex, { playerId: p.id });
                            setPicker(null);
                          }}
                        >
                          <Text style={styles.pickerRowText}>{p.name}</Text>
                        </Pressable>
                      ))
                    : editionRoles.map((r) => (
                        <Pressable
                          key={r.id}
                          style={styles.pickerRow}
                          onPress={() => {
                            updateRow(picker.rowIndex, { roleId: r.id });
                            setPicker(null);
                          }}
                        >
                          <Text style={styles.pickerRowText}>{r.name}</Text>
                          <Text style={styles.pickerRowTeam}>{r.team}</Text>
                        </Pressable>
                      ))}
                </ScrollView>
                <Pressable
                  style={styles.pickerClose}
                  onPress={() => setPicker(null)}
                >
                  <Text style={styles.pickerCloseText}>닫기</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(13,7,3,0.82)',
  },
  panel: {
    backgroundColor: colors.arcane.surface.apparatus,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    padding: 18,
    maxHeight: '90%',
    borderTopWidth: 1,
    borderColor: colors.arcane.border.brassDim,
  },
  title: {
    color: colors.arcane.text.strong,
    fontSize: 20,
    fontFamily: typography.fontFamily.display,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.arcane.text.muted,
    fontSize: 12,
    fontFamily: typography.fontFamily.body,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  list: { maxHeight: 380 },
  listContent: { paddingBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  rowIndex: {
    color: colors.arcane.text.dead,
    fontSize: 14,
    fontFamily: typography.fontFamily.bodyBold,
    width: 18,
    textAlign: 'center',
  },
  cell: {
    flex: 1,
    backgroundColor: colors.arcane.surface.base,
    borderWidth: 1,
    borderColor: colors.arcane.border.parchment,
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  cellEmpty: {
    borderStyle: 'dashed',
    borderColor: colors.arcane.border.brassDim,
  },
  cellText: {
    color: colors.arcane.text.primary,
    fontSize: 14,
    fontFamily: typography.fontFamily.bodyBold,
  },
  cellTextEmpty: {
    color: colors.arcane.text.dead,
    fontFamily: typography.fontFamily.bodyMedium,
  },
  rowEq: {
    color: colors.arcane.text.dead,
    fontSize: 14,
    fontFamily: typography.fontFamily.bodyBold,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.arcane.action.bloodPressed,
    borderWidth: 1,
    borderColor: colors.arcane.action.blood,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    color: colors.arcane.action.bloodHighlight,
    fontSize: 16,
    fontFamily: typography.fontFamily.bodyBold,
    lineHeight: 16,
  },
  addButton: {
    backgroundColor: colors.arcane.surface.ledger,
    borderWidth: 1,
    borderColor: colors.arcane.border.parchment,
    borderStyle: 'dashed',
    borderRadius: 4,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  addText: {
    color: colors.arcane.text.label,
    fontSize: 13,
    fontFamily: typography.fontFamily.bodyBold,
  },
  buttons: { flexDirection: 'row', gap: 10, marginTop: 14 },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.arcane.surface.ledger,
    borderRadius: 4,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.arcane.border.parchment,
  },
  cancelText: {
    color: colors.arcane.text.muted,
    fontSize: 15,
    fontFamily: typography.fontFamily.bodyBold,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: colors.arcane.accent.midnightInk,
    borderRadius: 4,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.arcane.accent.prussianBlue,
  },
  confirmButtonDisabled: { opacity: 0.4 },
  confirmText: {
    color: colors.arcane.accent.sapphireLens,
    fontSize: 15,
    fontFamily: typography.fontFamily.bodyBold,
  },
  confirmTextDisabled: { color: colors.arcane.text.dead },
  pickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(13,7,3,0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerPanel: {
    width: '100%',
    maxWidth: 360,
    maxHeight: '80%',
    backgroundColor: colors.arcane.surface.apparatus,
    borderRadius: 4,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.arcane.border.brassDim,
  },
  pickerTitle: {
    color: colors.arcane.text.strong,
    fontSize: 16,
    fontFamily: typography.fontFamily.display,
    textAlign: 'center',
    marginBottom: 10,
  },
  pickerScroll: { maxHeight: 360 },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.arcane.surface.base,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 4,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.arcane.border.parchment,
  },
  pickerRowText: {
    color: colors.arcane.text.primary,
    fontSize: 14,
    fontFamily: typography.fontFamily.bodyBold,
  },
  pickerRowTeam: {
    color: colors.arcane.text.dead,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  pickerClose: {
    marginTop: 8,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: colors.arcane.surface.ledger,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.arcane.border.parchment,
  },
  pickerCloseText: {
    color: colors.arcane.text.muted,
    fontSize: 14,
    fontFamily: typography.fontFamily.bodyBold,
  },
});
