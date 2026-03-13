import type { Team } from '@clocktower/shared';
import { ALL_ROLES } from '@clocktower/shared';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { EditionBadge } from './EditionBadge';

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
  editionRoles: { id: string; name: string; ability: string; team: Team; edition: string }[];
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
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: '#1e1e22',
            borderRadius: 12,
            width: '90%',
            maxHeight: '80%',
            borderWidth: 2,
            borderColor: '#4a4a5a',
          }}
          onPress={(e) => e.stopPropagation()}
        >
          <View
            style={{
              paddingHorizontal: s(16),
              paddingTop: s(16),
              paddingBottom: s(12),
              borderBottomWidth: 1,
              borderBottomColor: '#3a3a42',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: '#e0ddd8',
                fontSize: s(18),
                fontWeight: '700',
              }}
            >
              직업 제외 설정
            </Text>
            {excludedRoleIds.size > 0 && (
              <Pressable
                onPress={onResetExclude}
                style={{
                  paddingVertical: s(4),
                  paddingHorizontal: s(10),
                  borderRadius: 4,
                  backgroundColor: '#3a2020',
                }}
              >
                <Text
                  style={{
                    color: '#c47070',
                    fontSize: s(12),
                    fontWeight: '600',
                  }}
                >
                  초기화
                </Text>
              </Pressable>
            )}
          </View>
          <TextInput
            value={searchText}
            onChangeText={onSearchChange}
            placeholder="역할 검색..."
            placeholderTextColor="#5a5a5e"
            style={{
              marginHorizontal: s(12),
              marginTop: s(8),
              marginBottom: s(4),
              paddingVertical: s(8),
              paddingHorizontal: s(12),
              backgroundColor: '#252528',
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#3a3a3e',
              color: '#e0ddd8',
              fontSize: s(14),
            }}
          />
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: s(12),
              paddingVertical: s(8),
            }}
          >
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
                <View key={team} style={{ marginBottom: s(12) }}>
                  <Text
                    style={{
                      color,
                      fontSize: s(14),
                      fontWeight: '700',
                      marginBottom: s(6),
                    }}
                  >
                    {label}
                  </Text>
                  {teamRoles.map((role) => {
                    const isExcluded = excludedRoleIds.has(role.id);
                    return (
                      <Pressable
                        key={role.id}
                        onPress={() => onToggleExclude(role.id)}
                        style={({ pressed }) => ({
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: s(8),
                          paddingHorizontal: s(10),
                          marginBottom: s(2),
                          borderRadius: 6,
                          backgroundColor: isExcluded
                            ? '#2a1a1a'
                            : pressed
                              ? '#2a2a30'
                              : '#252528',
                        })}
                      >
                        <View
                          style={{
                            width: s(18),
                            height: s(18),
                            borderRadius: 4,
                            borderWidth: 2,
                            borderColor: isExcluded ? '#c47070' : '#5a5a5e',
                            backgroundColor: isExcluded
                              ? '#c47070'
                              : 'transparent',
                            marginRight: s(10),
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {isExcluded && (
                            <Text
                              style={{
                                color: '#1e1e22',
                                fontSize: s(12),
                                fontWeight: '900',
                                lineHeight: s(14),
                              }}
                            >
                              ✕
                            </Text>
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: s(6),
                            }}
                          >
                            <Text
                              style={{
                                color: isExcluded ? '#706060' : '#e0ddd8',
                                fontSize: s(14),
                                fontWeight: '600',
                                textDecorationLine: isExcluded
                                  ? 'line-through'
                                  : 'none',
                              }}
                            >
                              {role.name}
                            </Text>
                            <EditionBadge
                              editionId={role.edition}
                              scale={scale}
                            />
                          </View>
                          <Text
                            style={{
                              color: isExcluded ? '#504848' : '#787674',
                              fontSize: s(11),
                              lineHeight: s(15),
                            }}
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
          <Pressable
            style={{
              paddingVertical: s(14),
              borderTopWidth: 1,
              borderTopColor: '#3a3a42',
            }}
            onPress={onClose}
          >
            <Text
              style={{
                color: '#7070c4',
                fontSize: s(15),
                fontWeight: '600',
                textAlign: 'center',
              }}
            >
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
