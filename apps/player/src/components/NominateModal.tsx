import type { PlayerInfo } from '@clocktower/shared';
import { FlatList, Modal, Pressable, Text, View } from 'react-native';
import { styles } from './NominateModal.styles';

interface NominateModalProps {
  visible: boolean;
  players: PlayerInfo[];
  onNominate: (nomineeId: string) => void;
  onClose: () => void;
}

export function NominateModal({
  visible,
  players,
  onNominate,
  onClose,
}: NominateModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.header}>
          <Pressable onPress={onClose}>
            <Text style={styles.closeText}>닫기</Text>
          </Pressable>
          <Text style={styles.title}>지목할 플레이어 선택</Text>
          <View style={styles.headerSpacer} />
        </View>
        <FlatList
          data={players}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                styles.playerItem,
                pressed && styles.playerItemPressed,
              ]}
              onPress={() => onNominate(item.id)}
            >
              <View style={styles.playerAvatar}>
                <Text style={styles.playerAvatarText}>
                  {item.name.charAt(0)}
                </Text>
              </View>
              <Text style={styles.playerName}>{item.name}</Text>
            </Pressable>
          )}
        />
      </View>
    </Modal>
  );
}
