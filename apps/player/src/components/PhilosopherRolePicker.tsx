import { ALL_ROLES, type Role } from '@clocktower/shared';
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

interface PhilosopherRolePickerProps {
  visible: boolean;
  edition: string;
  onPick: (roleId: string) => void;
  onClose: () => void;
}

export function PhilosopherRolePicker({
  visible,
  edition,
  onPick,
  onClose,
}: PhilosopherRolePickerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const goodRoles = useMemo(
    () =>
      ALL_ROLES.filter(
        (r) =>
          r.edition === edition &&
          r.id !== 'philosopher' &&
          (r.team === 'townsfolk' || r.team === 'outsider'),
      ),
    [edition],
  );

  const townsfolk = goodRoles.filter((r) => r.team === 'townsfolk');
  const outsider = goodRoles.filter((r) => r.team === 'outsider');

  const selectedRole: Role | undefined = goodRoles.find(
    (r) => r.id === selectedId,
  );

  const handleConfirm = () => {
    if (!selectedId) return;
    onPick(selectedId);
    setSelectedId(null);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <Text style={styles.title}>철학자 능력</Text>
          <Text style={styles.subtitle}>
            능력을 부여받을 선한 역할을 선택하세요
          </Text>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
          >
            <Text style={styles.sectionLabel}>마을주민</Text>
            {townsfolk.map((r) => (
              <Pressable
                key={r.id}
                onPress={() => setSelectedId(r.id)}
                style={[styles.row, selectedId === r.id && styles.rowSelected]}
              >
                <Text
                  style={[
                    styles.roleName,
                    selectedId === r.id && styles.roleNameSelected,
                  ]}
                >
                  {r.name}
                </Text>
              </Pressable>
            ))}

            <Text style={[styles.sectionLabel, styles.sectionLabelOutsider]}>
              외지인
            </Text>
            {outsider.map((r) => (
              <Pressable
                key={r.id}
                onPress={() => setSelectedId(r.id)}
                style={[styles.row, selectedId === r.id && styles.rowSelected]}
              >
                <Text
                  style={[
                    styles.roleName,
                    selectedId === r.id && styles.roleNameSelected,
                  ]}
                >
                  {r.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {selectedRole && (
            <View style={styles.abilityPanel}>
              <Text style={styles.abilityRoleName}>{selectedRole.name}</Text>
              <Text style={styles.abilityText}>{selectedRole.ability}</Text>
            </View>
          )}

          <View style={styles.buttons}>
            <Pressable style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>닫기</Text>
            </Pressable>
            <Pressable
              style={[
                styles.confirmButton,
                !selectedId && styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={!selectedId}
            >
              <Text
                style={[
                  styles.confirmText,
                  !selectedId && styles.confirmTextDisabled,
                ]}
              >
                선택
              </Text>
            </Pressable>
          </View>
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
    fontSize: 13,
    fontFamily: typography.fontFamily.body,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  list: {
    maxHeight: 360,
  },
  listContent: {
    paddingBottom: 8,
  },
  sectionLabel: {
    color: colors.arcane.accent.sapphireLens,
    fontSize: 12,
    fontFamily: typography.fontFamily.bodyBold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
    marginBottom: 6,
  },
  sectionLabelOutsider: {
    color: colors.arcane.text.label,
    marginTop: 12,
  },
  row: {
    backgroundColor: colors.arcane.surface.base,
    borderWidth: 1,
    borderColor: colors.arcane.border.parchment,
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 6,
  },
  rowSelected: {
    backgroundColor: colors.arcane.accent.midnightInk,
    borderColor: colors.arcane.accent.sapphireLens,
  },
  roleName: {
    color: colors.arcane.text.primary,
    fontSize: 15,
    fontFamily: typography.fontFamily.bodyBold,
  },
  roleNameSelected: {
    color: colors.arcane.accent.sapphireLens,
  },
  abilityPanel: {
    backgroundColor: colors.arcane.surface.ledger,
    borderWidth: 1,
    borderColor: colors.arcane.border.parchment,
    borderRadius: 4,
    padding: 12,
    marginTop: 10,
  },
  abilityRoleName: {
    color: colors.arcane.accent.sapphireLens,
    fontSize: 14,
    fontFamily: typography.fontFamily.bodyBold,
    marginBottom: 4,
  },
  abilityText: {
    color: colors.arcane.text.muted,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: typography.fontFamily.body,
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
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
  confirmButtonDisabled: {
    opacity: 0.4,
  },
  confirmText: {
    color: colors.arcane.accent.sapphireLens,
    fontSize: 15,
    fontFamily: typography.fontFamily.bodyBold,
  },
  confirmTextDisabled: {
    color: colors.arcane.text.dead,
  },
});
