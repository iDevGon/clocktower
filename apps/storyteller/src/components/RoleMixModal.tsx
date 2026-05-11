import type { Team } from '@clocktower/shared';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { EditionBadge } from './EditionBadge';
import {
  checkboxStyle,
  createRoleMixModalStyles,
  roleItemStyle,
} from './RoleMixModal.styles';

const TEAM_SECTIONS = [
  { team: 'townsfolk' as Team, label: '마을주민', color: '#7090c4' },
  { team: 'outsider' as Team, label: '외지인', color: '#50a090' },
  { team: 'minion' as Team, label: '하수인', color: '#c48850' },
  { team: 'demon' as Team, label: '악마', color: '#b85c5c' },
] as const;

interface RoleMixModalProps {
  visible: boolean;
  onClose: () => void;
  additionalRoleIds: Set<string>;
  onToggleAdditional: (roleId: string) => void;
  onResetAdditional: () => void;
  mixableRoles: {
    id: string;
    name: string;
    ability: string;
    team: Team;
    edition: string;
  }[];
  searchText: string;
  onSearchChange: (text: string) => void;
  scale: number;
}

export function RoleMixModal({
  visible,
  onClose,
  additionalRoleIds,
  onToggleAdditional,
  onResetAdditional,
  mixableRoles,
  searchText,
  onSearchChange,
  scale,
}: RoleMixModalProps) {
  const s = (v: number) => Math.round(v * scale);
  const st = createRoleMixModalStyles(s);
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={st.overlay} onPress={onClose}>
        <Pressable style={st.modal} onPress={(e) => e.stopPropagation()}>
          <View style={st.header}>
            <Text style={st.headerTitle}>다른 에디션 역할 추가</Text>
            {additionalRoleIds.size > 0 && (
              <Pressable onPress={onResetAdditional} style={st.resetButton}>
                <Text style={st.resetText}>초기화</Text>
              </Pressable>
            )}
          </View>
          <TextInput
            value={searchText}
            onChangeText={onSearchChange}
            placeholder="역할 검색…"
            placeholderTextColor="#746b60"
            style={st.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <ScrollView contentContainerStyle={st.scrollContent}>
            {TEAM_SECTIONS.map(({ team, label, color }) => {
              const mixSearchLower = searchText.toLowerCase().trim();
              const teamRoles = mixableRoles.filter(
                (r) =>
                  r.team === team &&
                  (mixSearchLower === '' ||
                    r.name.toLowerCase().includes(mixSearchLower)),
              );
              if (teamRoles.length === 0) return null;
              return (
                <View key={team} style={st.teamSection}>
                  <Text style={[st.teamLabel, { color }]}>{label}</Text>
                  {teamRoles.map((role) => {
                    const isSelected = additionalRoleIds.has(role.id);
                    return (
                      <Pressable
                        key={role.id}
                        onPress={() => onToggleAdditional(role.id)}
                        style={({ pressed }) =>
                          roleItemStyle(s, isSelected, pressed)
                        }
                      >
                        <View style={checkboxStyle(s, isSelected)}>
                          {isSelected && <Text style={st.checkmark}>✓</Text>}
                        </View>
                        <View style={st.roleContent}>
                          <View style={st.roleNameRow}>
                            <Text style={st.roleName}>{role.name}</Text>
                            <EditionBadge
                              editionId={role.edition}
                              scale={scale}
                            />
                          </View>
                          <Text style={st.roleAbility} numberOfLines={2}>
                            {role.ability}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              );
            })}
          </ScrollView>
          <Pressable style={st.footer} onPress={onClose}>
            <Text style={st.footerText}>
              {additionalRoleIds.size > 0
                ? `선택 완료 (${additionalRoleIds.size}개 추가)`
                : '선택 완료'}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
