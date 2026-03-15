import type { Player } from '@clocktower/shared';
import { FlatList, Modal, Pressable, Text, View } from 'react-native';
import {
  autoButtonStyle,
  createPlayerPickerModalStyles,
  currentBadgeStyle,
  listContentStyle,
  playerItemStyle,
  roleText,
  titleStyle,
} from './PlayerPickerModal.styles';

interface PlayerPickerModalProps {
  visible: boolean;
  title: string;
  description: string;
  themeColor: string;
  /** 선택 가능한 플레이어 목록 */
  candidates: Player[];
  /** 현재 선택된 플레이어 ID (자동 배정 옵션 표시용) */
  currentSelectedId?: string | null;
  /** 자동(랜덤) 버튼 라벨 (없으면 자동 옵션 숨김) */
  autoLabel?: string;
  onConfirmAuto?: () => void;
  onSelectPlayer: (playerId: string) => void;
  onClose: () => void;
  /** 역할명 표시 여부 (기본 true) */
  showRole?: boolean;
  scale: number;
}

export function PlayerPickerModal({
  visible,
  title,
  description,
  themeColor,
  candidates,
  currentSelectedId,
  autoLabel,
  onConfirmAuto,
  onSelectPlayer,
  onClose,
  showRole = true,
  scale,
}: PlayerPickerModalProps) {
  const s = (v: number) => Math.round(v * scale);
  const st = createPlayerPickerModalStyles(s);
  const currentPlayer = currentSelectedId
    ? candidates.find((p) => p.id === currentSelectedId)
    : null;

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

          {/* 자동(랜덤) 확인 버튼 */}
          {autoLabel && onConfirmAuto && (
            <>
              <View style={st.autoSection}>
                <Pressable
                  onPress={onConfirmAuto}
                  style={({ pressed }) =>
                    autoButtonStyle(s, themeColor, pressed)
                  }
                >
                  <Text style={[st.autoButtonText, { color: themeColor }]}>
                    {autoLabel}
                    {currentPlayer ? ` — ${currentPlayer.name}` : ''}
                  </Text>
                </Pressable>
              </View>

              {/* 구분선 */}
              <View style={st.dividerRow}>
                <View style={st.dividerLine} />
                <Text style={st.dividerText}>또는 직접 선택</Text>
                <View style={st.dividerLine} />
              </View>
            </>
          )}

          <FlatList
            data={candidates}
            keyExtractor={(p) => p.id}
            contentContainerStyle={listContentStyle(s, !!autoLabel)}
            renderItem={({ item }) => {
              const isCurrent = item.id === currentSelectedId;
              return (
                <Pressable
                  onPress={() => onSelectPlayer(item.id)}
                  style={({ pressed }) => [
                    playerItemStyle(s, isCurrent, themeColor),
                    pressed && { backgroundColor: '#353538' },
                  ]}
                >
                  <View style={st.playerItemRow}>
                    <View style={st.playerNameRow}>
                      <Text style={st.playerName}>{item.name}</Text>
                      {showRole && item.role && (
                        <Text style={roleText(s)}>{item.role.name}</Text>
                      )}
                    </View>
                    {isCurrent && (
                      <Text style={currentBadgeStyle(s, themeColor)}>
                        현재 선택
                      </Text>
                    )}
                  </View>
                </Pressable>
              );
            }}
          />

          <Pressable style={st.footer} onPress={onClose}>
            <Text style={st.footerText}>닫기</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
