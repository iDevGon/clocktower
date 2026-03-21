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
  createBluffSelectModalStyles,
  randomButtonStyle,
  roleItemStyle,
} from './BluffSelectModal.styles';

interface BluffSelectModalProps {
  visible: boolean;
  /** 선택 완료 (확인) 콜백 — 빈 배열이면 랜덤 */
  onConfirm: (selectedIds: string[]) => void;
  /** 변경 없이 닫기 콜백 */
  onCancel: () => void;
  /** 모달 열릴 때의 초기 선택 ID */
  initialSelectedIds?: string[];
  /** 게임에 등장하지 않는 선한 역할 목록 */
  availableRoles: Role[];
  scale: number;
}

export function BluffSelectModal({
  visible,
  onConfirm,
  onCancel,
  initialSelectedIds,
  availableRoles,
  scale,
}: BluffSelectModalProps) {
  const s = (v: number) => Math.round(v * scale);
  const st = createBluffSelectModalStyles(s);
  const [searchText, setSearchText] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleShow = () => {
    setSearchText('');
    setSelectedIds(new Set(initialSelectedIds ?? []));
  };

  const toggleRole = (roleId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(roleId)) next.delete(roleId);
      else if (next.size < 3) next.add(roleId);
      return next;
    });
  };

  const filteredRoles = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return availableRoles;
    return availableRoles.filter((r) => r.name.toLowerCase().includes(query));
  }, [availableRoles, searchText]);

  const handleConfirm = () => {
    onConfirm(selectedIds.size > 0 ? [...selectedIds] : []);
  };

  const handleRandom = () => {
    onConfirm([]);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      onShow={handleShow}
    >
      <Pressable style={st.overlay} onPress={onCancel}>
        <Pressable style={st.modal} onPress={(e) => e.stopPropagation()}>
          <View style={st.header}>
            <Text style={st.headerTitle}>블러프 직업 선택</Text>
            <Text style={st.headerDesc}>
              악마에게 전달할 블러프 직업을 최대 3개 선택하세요
            </Text>
          </View>
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="역할 검색…"
            placeholderTextColor="#5a5a5e"
            style={st.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <FlatList
            data={filteredRoles}
            keyExtractor={(r) => r.id}
            contentContainerStyle={st.listContent}
            ListHeaderComponent={
              <Pressable
                onPress={handleRandom}
                style={({ pressed }) => randomButtonStyle(s, pressed)}
              >
                <Text style={st.randomButtonText}>랜덤 배정</Text>
              </Pressable>
            }
            renderItem={({ item }) => {
              const isSelected = selectedIds.has(item.id);
              const isDisabled = !isSelected && selectedIds.size >= 3;
              return (
                <Pressable
                  onPress={() => {
                    if (!isDisabled) toggleRole(item.id);
                  }}
                  disabled={isDisabled}
                  style={({ pressed }) =>
                    roleItemStyle(s, isSelected, pressed, isDisabled)
                  }
                >
                  <View style={st.itemRow}>
                    <Text style={st.itemName}>{item.name}</Text>
                    {isSelected && <Text style={st.selectedBadge}>선택됨</Text>}
                  </View>
                  <AbilityText text={item.ability} style={st.abilityText} />
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <Text style={st.emptyText}>선택 가능한 역할이 없습니다</Text>
            }
          />
          <View style={st.footerRow}>
            <Pressable style={st.footerButton} onPress={onCancel}>
              <Text style={st.footerCloseText}>닫기</Text>
            </Pressable>
            {selectedIds.size > 0 && (
              <>
                <View style={st.footerDivider} />
                <Pressable style={st.footerButton} onPress={handleConfirm}>
                  <Text style={st.footerConfirmText}>
                    선택 완료 ({selectedIds.size}개)
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
