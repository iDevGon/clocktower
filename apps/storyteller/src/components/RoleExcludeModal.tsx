import type { Team } from '@clocktower/shared';
import { ALL_ROLES } from '@clocktower/shared';
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
  createRoleExcludeModalStyles,
  roleAbilityStyle,
  roleItemStyle,
  roleNameStyle,
} from './RoleExcludeModal.styles';

const TEAM_SECTIONS = [
  { team: 'townsfolk' as Team, label: '마을주민', color: '#7090c4' },
  { team: 'outsider' as Team, label: '외지인', color: '#50a090' },
  { team: 'minion' as Team, label: '하수인', color: '#c48850' },
  { team: 'demon' as Team, label: '악마', color: '#b85c5c' },
] as const;

interface RoleExcludeModalProps {
  visible: boolean;
  onClose: () => void;
  excludedRoleIds: Set<string>;
  onToggleExclude: (roleId: string) => void;
  onResetExclude: () => void;
  editionRoles: {
    id: string;
    name: string;
    ability: string;
    team: Team;
    edition: string;
  }[];
  additionalRoleIds: Set<string>;
  searchText: string;
  onSearchChange: (text: string) => void;
  scale: number;
}

export function RoleExcludeModal({
  visible,
  onClose,
  excludedRoleIds,
  onToggleExclude,
  onResetExclude,
  editionRoles,
  additionalRoleIds,
  searchText,
  onSearchChange,
  scale,
}: RoleExcludeModalProps) {
  const s = (v: number) => Math.round(v * scale);
  const st = createRoleExcludeModalStyles(s);
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
            <Text style={st.headerTitle}>직업 제외 설정</Text>
            {excludedRoleIds.size > 0 && (
              <Pressable onPress={onResetExclude} style={st.resetButton}>
                <Text style={st.resetText}>초기화</Text>
              </Pressable>
            )}
          </View>
          <TextInput
            value={searchText}
            onChangeText={onSearchChange}
            placeholder="역할 검색…"
            placeholderTextColor="#5a5a5e"
            style={st.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <ScrollView contentContainerStyle={st.scrollContent}>
            {TEAM_SECTIONS.map(({ team, label, color }) => {
              // 현재 에디션 + 믹스된 역할
              const additionalRolesArr = ALL_ROLES.filter(
                (r) =>
                  additionalRoleIds.has(r.id) &&
                  !editionRoles.some((er) => er.id === r.id),
              );
              const allAvailableRoles = [
                ...editionRoles,
                ...additionalRolesArr,
              ];
              const searchLower = searchText.toLowerCase().trim();
              const teamRoles = allAvailableRoles.filter(
                (r) =>
                  r.team === team &&
                  (searchLower === '' ||
                    r.name.toLowerCase().includes(searchLower)),
              );
              if (teamRoles.length === 0) return null;
              return (
                <View key={team} style={st.teamSection}>
                  <Text style={[st.teamLabel, { color }]}>{label}</Text>
                  {teamRoles.map((role) => {
                    const isExcluded = excludedRoleIds.has(role.id);
                    return (
                      <Pressable
                        key={role.id}
                        onPress={() => onToggleExclude(role.id)}
                        style={({ pressed }) =>
                          roleItemStyle(s, isExcluded, pressed)
                        }
                      >
                        <View style={checkboxStyle(s, isExcluded)}>
                          {isExcluded && <Text style={st.checkmark}>✕</Text>}
                        </View>
                        <View style={st.roleContent}>
                          <View style={st.roleNameRow}>
                            <Text style={roleNameStyle(s, isExcluded)}>
                              {role.name}
                            </Text>
                            <EditionBadge
                              editionId={role.edition}
                              scale={scale}
                            />
                          </View>
                          <Text
                            style={roleAbilityStyle(s, isExcluded)}
                            numberOfLines={2}
                          >
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
              {excludedRoleIds.size > 0
                ? `선택 완료 (${excludedRoleIds.size}개 제외)`
                : '선택 완료'}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
