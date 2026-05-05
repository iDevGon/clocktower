import { ALL_ROLES, type Role } from '@clocktower/shared';
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
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  panel: {
    backgroundColor: '#1a1a1e',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 18,
    maxHeight: '90%',
  },
  title: {
    color: '#e0ddd8',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: '#908e8a',
    fontSize: 13,
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
    color: '#7090c4',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
    marginBottom: 6,
  },
  sectionLabelOutsider: {
    color: '#50a090',
    marginTop: 12,
  },
  row: {
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: '#2e2e34',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 6,
  },
  rowSelected: {
    backgroundColor: '#1f2538',
    borderColor: '#5a78b8',
  },
  roleName: {
    color: '#e0ddd8',
    fontSize: 15,
    fontWeight: '600',
  },
  roleNameSelected: {
    color: '#cfd8ff',
  },
  abilityPanel: {
    backgroundColor: '#15151a',
    borderWidth: 1,
    borderColor: '#3a3a4a',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  abilityRoleName: {
    color: '#cfd8ff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  abilityText: {
    color: '#b8b6b2',
    fontSize: 13,
    lineHeight: 18,
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#1e1e24',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2e2e34',
  },
  cancelText: {
    color: '#908e8a',
    fontSize: 15,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#2a3a5a',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3a5a8a',
  },
  confirmButtonDisabled: {
    opacity: 0.4,
  },
  confirmText: {
    color: '#cfd8ff',
    fontSize: 15,
    fontWeight: '700',
  },
  confirmTextDisabled: {
    color: '#5c5a58',
  },
});
