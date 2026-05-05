import type { Player } from '@clocktower/shared';
import { useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, Text, View } from 'react-native';
import {
  createPlayerPickerModalStyles,
  currentBadgeStyle,
  listContentStyle,
  playerItemStyle,
  roleText,
  titleStyle,
} from './PlayerPickerModal.styles';

interface TwoPlayerPickerModalProps {
  visible: boolean;
  title: string;
  description: string;
  themeColor: string;
  candidates: Player[];
  onConfirm: (playerId1: string, playerId2: string) => void;
  onClose: () => void;
  scale: number;
}

export function TwoPlayerPickerModal({
  visible,
  title,
  description,
  themeColor,
  candidates,
  onConfirm,
  onClose,
  scale,
}: TwoPlayerPickerModalProps) {
  const s = (v: number) => Math.round(v * scale);
  const st = createPlayerPickerModalStyles(s);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (visible) setSelectedIds([]);
  }, [visible]);

  const togglePlayer = (playerId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(playerId)) return prev.filter((id) => id !== playerId);
      if (prev.length >= 2) return [prev[1], playerId];
      return [...prev, playerId];
    });
  };

  const canConfirm = selectedIds.length === 2;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={st.overlay} onPress={onClose}>
        <Pressable
          style={[st.modal, { borderColor: themeColor }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={st.header}>
            <Text style={titleStyle(s, themeColor)}>{title}</Text>
            <Text style={st.description}>{description}</Text>
          </View>
          <FlatList
            data={candidates}
            keyExtractor={(p) => p.id}
            contentContainerStyle={listContentStyle(s, false)}
            renderItem={({ item }) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <Pressable
                  onPress={() => togglePlayer(item.id)}
                  style={({ pressed }) => [
                    playerItemStyle(s, isSelected, themeColor),
                    pressed && { backgroundColor: '#353538' },
                  ]}
                >
                  <View style={st.playerItemRow}>
                    <View style={st.playerNameRow}>
                      <Text style={st.playerName}>{item.name}</Text>
                      {item.role && (
                        <Text style={roleText(s)}>{item.role.name}</Text>
                      )}
                    </View>
                    {isSelected && (
                      <Text style={currentBadgeStyle(s, themeColor)}>
                        선택 {selectedIds.indexOf(item.id) + 1}
                      </Text>
                    )}
                  </View>
                </Pressable>
              );
            }}
          />
          <View style={st.footer}>
            <Pressable
              onPress={() => {
                if (!canConfirm) return;
                onConfirm(selectedIds[0], selectedIds[1]);
              }}
              disabled={!canConfirm}
            >
              <Text
                style={[
                  st.footerText,
                  !canConfirm && { color: '#555', opacity: 0.8 },
                ]}
              >
                {canConfirm ? '교환 실행' : '두 명을 선택하세요'}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
