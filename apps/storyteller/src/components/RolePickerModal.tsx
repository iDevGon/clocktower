import type { Role } from '@clocktower/shared';
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
  roleItemStyle,
} from './DrunkFakeRoleModal.styles';

interface RolePickerModalProps {
  visible: boolean;
  title: string;
  description: string;
  roles: Role[];
  disabledRoleIds?: Set<string>;
  disabledLabel?: string;
  onSelectRole: (roleId: string) => void;
  onClose: () => void;
  scale: number;
}

export function RolePickerModal({
  visible,
  title,
  description,
  roles,
  disabledRoleIds,
  disabledLabel = '이미 존재',
  onSelectRole,
  onClose,
  scale,
}: RolePickerModalProps) {
  const [searchText, setSearchText] = useState('');
  const s = (v: number) => Math.round(v * scale);
  const st = createDrunkFakeRoleModalStyles(s);

  const filteredRoles = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return roles;
    return roles.filter((r) => r.name.toLowerCase().includes(query));
  }, [roles, searchText]);

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
            <Text style={st.headerTitle}>{title}</Text>
            <Text style={st.headerDesc}>{description}</Text>
          </View>
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="역할 검색..."
            placeholderTextColor="#5a5a5e"
            style={st.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <FlatList
            data={filteredRoles}
            keyExtractor={(r) => r.id}
            contentContainerStyle={st.listContent}
            renderItem={({ item }) => {
              const isDisabled = disabledRoleIds?.has(item.id) ?? false;
              return (
                <Pressable
                  onPress={() => {
                    if (!isDisabled) onSelectRole(item.id);
                  }}
                  disabled={isDisabled}
                  style={({ pressed }) => [
                    roleItemStyle(s, false, pressed),
                    isDisabled && { opacity: 0.45 },
                  ]}
                >
                  <View style={st.itemRow}>
                    <Text style={st.itemName}>{item.name}</Text>
                    {isDisabled && (
                      <Text style={st.currentBadge}>{disabledLabel}</Text>
                    )}
                  </View>
                  <AbilityText text={item.ability} style={st.abilityText} />
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <Text style={st.emptyText}>선택 가능한 역할이 없습니다</Text>
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
