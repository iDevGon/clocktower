import type { Player } from '@clocktower/shared';
import { AbilityText } from '@clocktower/ui';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  createDrunkFakeRoleModalStyles,
  randomButtonStyle,
  roleItemStyle,
} from './DrunkFakeRoleModal.styles';

interface DrunkFakeRoleModalProps {
  drunkModalPlayer: Player | null;
  onClose: () => void;
  availableTownsfolk: { id: string; name: string; ability: string }[];
  onChangeFakeRole: (fakeRoleId: string) => void;
  onRandomFakeRole: () => void;
  scale: number;
}

export function DrunkFakeRoleModal({
  drunkModalPlayer,
  onClose,
  availableTownsfolk,
  onChangeFakeRole,
  onRandomFakeRole,
  scale,
}: DrunkFakeRoleModalProps) {
  const [searchText, setSearchText] = useState('');
  const s = (v: number) => Math.round(v * scale);
  const st = createDrunkFakeRoleModalStyles(s);

  const filteredTownsfolk = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return availableTownsfolk;
    return availableTownsfolk.filter((r) =>
      r.name.toLowerCase().includes(query),
    );
  }, [availableTownsfolk, searchText]);

  return (
    <Modal
      visible={!!drunkModalPlayer}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      onShow={() => setSearchText('')}
    >
      <Pressable style={st.overlay} onPress={onClose}>
        <Pressable style={st.modal} onPress={(e) => e.stopPropagation()}>
          <View style={st.header}>
            <Text style={st.headerTitle}>주정뱅이 가짜 역할 변경</Text>
            <Text style={st.headerDesc}>
              {drunkModalPlayer?.name}이(가) 자신이라고 믿을 마을주민 역할
            </Text>
          </View>
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="역할 검색…"
            placeholderTextColor="#5a5a5e"
            style={st.searchInput}
          />
          <FlatList
            data={filteredTownsfolk}
            keyExtractor={(r) => r.id}
            contentContainerStyle={st.listContent}
            ListHeaderComponent={
              availableTownsfolk.length > 0 ? (
                <Pressable
                  onPress={onRandomFakeRole}
                  style={({ pressed }) => randomButtonStyle(s, pressed)}
                >
                  <Text style={st.randomButtonText}>랜덤 배정</Text>
                </Pressable>
              ) : null
            }
            renderItem={({ item }) => {
              const isCurrentFake = drunkModalPlayer?.drunkAs === item.id;
              return (
                <Pressable
                  onPress={() => onChangeFakeRole(item.id)}
                  style={({ pressed }) => [
                    roleItemStyle(s, isCurrentFake, pressed),
                  ]}
                >
                  <View style={st.itemRow}>
                    <Text style={st.itemName}>{item.name}</Text>
                    {isCurrentFake && (
                      <Text style={st.currentBadge}>현재 선택</Text>
                    )}
                  </View>
                  <AbilityText text={item.ability} style={st.abilityText} />
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <Text style={st.emptyText}>
                선택 가능한 마을주민 역할이 없습니다
              </Text>
            }
          />
          <Pressable style={st.footer} onPress={onClose}>
            <Text style={st.footerText}>닫기</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
