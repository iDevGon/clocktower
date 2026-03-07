import type { PlayerInfo } from '@clocktower/shared';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

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
          <View style={{ width: 40 }} />
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

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#121214',
    paddingTop: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: '#2e2e34',
  },
  title: {
    color: '#e0ddd8',
    fontSize: 16,
    fontWeight: '600',
  },
  closeText: {
    color: '#908e8a',
    fontSize: 15,
  },
  list: {
    padding: 16,
    gap: 8,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1e',
    borderRadius: 12,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: '#2e2e34',
  },
  playerItemPressed: {
    backgroundColor: '#2e2e34',
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3a2020',
    borderWidth: 1,
    borderColor: '#943c3c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerAvatarText: {
    color: '#c47070',
    fontSize: 16,
    fontWeight: 'bold',
  },
  playerName: {
    color: '#e0ddd8',
    fontSize: 16,
    fontWeight: '500',
  },
});
