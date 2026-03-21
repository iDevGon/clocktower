import type { Role, Team } from '@clocktower/shared';
import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  checkboxStyle,
  createBluffSelectModalStyles,
  roleAbilityStyle,
  roleItemStyle,
  roleNameStyle,
} from './BluffSelectModal.styles';
import { EditionBadge } from './EditionBadge';

const TEAM_SECTIONS = [
  { team: 'townsfolk' as Team, label: '마을주민', color: '#7090c4' },
  { team: 'outsider' as Team, label: '외지인', color: '#50a090' },
] as const;

interface BluffSelectModalProps {
  visible: boolean;
  onClose: () => void;
  selectedBluffIds: Set<string>;
  onToggleBluff: (roleId: string) => void;
  onResetBluffs: () => void;
  /** 게임에 등장하지 않는 선한 역할 목록 */
  availableRoles: Role[];
  scale: number;
}

export function BluffSelectModal({
  visible,
  onClose,
  selectedBluffIds,
  onToggleBluff,
  onResetBluffs,
  availableRoles,
  scale,
}: BluffSelectModalProps) {
  const s = (v: number) => Math.round(v * scale);
  const st = createBluffSelectModalStyles(s);
  const [searchText, setSearchText] = useState('');

  const selectedRoleNames = useMemo(
    () =>
      availableRoles
        .filter((r) => selectedBluffIds.has(r.id))
        .map((r) => ({ id: r.id, name: r.name })),
    [availableRoles, selectedBluffIds],
  );

  const filteredSections = useMemo(() => {
    const query = searchText.toLowerCase().trim();
    return TEAM_SECTIONS.map(({ team, label, color }) => {
      const roles = availableRoles.filter(
        (r) =>
          r.team === team &&
          (query === '' || r.name.toLowerCase().includes(query)),
      );
      return { team, label, color, roles };
    }).filter((sec) => sec.roles.length > 0);
  }, [availableRoles, searchText]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      onShow={() => setSearchText('')}
    >
      <Pressable style={st.overlay} onPress={onClose}>
        <Pressable style={st.modal} onPress={(e) => e.stopPropagation()}>
          <View style={st.header}>
            <Text style={st.headerTitle}>블러프 직업 선택</Text>
            <Text style={st.headerSubtitle}>
              악마에게 전달할 블러프 직업을 최대 3개 선택하세요 (미선택 시 랜덤)
            </Text>
          </View>

          {selectedRoleNames.length > 0 && (
            <View style={st.selectedContainer}>
              <Text style={st.selectedLabel}>
                선택됨 ({selectedRoleNames.length}/3)
              </Text>
              <View style={st.selectedRow}>
                {selectedRoleNames.map((r) => (
                  <Pressable
                    key={r.id}
                    onPress={() => onToggleBluff(r.id)}
                    style={st.selectedChip}
                  >
                    <Text style={st.selectedChipText}>{r.name}</Text>
                    <Text style={st.selectedChipRemove}>×</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="역할 검색…"
            placeholderTextColor="#5a5a5e"
            style={st.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <ScrollView contentContainerStyle={st.scrollContent}>
            {filteredSections.map(({ team, label, color, roles }) => (
              <View key={team} style={st.teamSection}>
                <Text style={[st.teamLabel, { color }]}>{label}</Text>
                {roles.map((role) => {
                  const isSelected = selectedBluffIds.has(role.id);
                  const isDisabled = !isSelected && selectedBluffIds.size >= 3;
                  return (
                    <Pressable
                      key={role.id}
                      onPress={() => {
                        if (isDisabled) return;
                        onToggleBluff(role.id);
                      }}
                      disabled={isDisabled}
                      style={({ pressed }) =>
                        roleItemStyle(s, isSelected, pressed)
                      }
                    >
                      <View
                        style={[
                          checkboxStyle(s, isSelected),
                          isDisabled && { opacity: 0.3 },
                        ]}
                      >
                        {isSelected && (
                          <Text
                            style={{
                              color: '#1e1e22',
                              fontSize: s(12),
                              fontWeight: '900',
                              lineHeight: s(14),
                            }}
                          >
                            ✓
                          </Text>
                        )}
                      </View>
                      <View
                        style={[st.roleContent, isDisabled && { opacity: 0.4 }]}
                      >
                        <View style={st.roleNameRow}>
                          <Text style={roleNameStyle(s, isSelected)}>
                            {role.name}
                          </Text>
                          <EditionBadge
                            editionId={role.edition}
                            scale={scale}
                          />
                        </View>
                        <Text style={roleAbilityStyle(s)} numberOfLines={2}>
                          {role.ability}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </ScrollView>

          <View
            style={{
              flexDirection: 'row',
              borderTopWidth: 1,
              borderTopColor: '#3a3a42',
            }}
          >
            {selectedBluffIds.size > 0 && (
              <Pressable
                onPress={onResetBluffs}
                style={{
                  flex: 1,
                  paddingVertical: s(14),
                  borderRightWidth: 1,
                  borderRightColor: '#3a3a42',
                }}
              >
                <Text
                  style={{
                    color: '#c47070',
                    fontSize: s(14),
                    fontWeight: '600',
                    textAlign: 'center',
                  }}
                >
                  초기화
                </Text>
              </Pressable>
            )}
            <Pressable
              style={{ flex: 2, paddingVertical: s(14) }}
              onPress={onClose}
            >
              <Text style={st.footerText}>
                {selectedBluffIds.size > 0
                  ? `선택 완료 (${selectedBluffIds.size}개)`
                  : '랜덤으로 진행'}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
