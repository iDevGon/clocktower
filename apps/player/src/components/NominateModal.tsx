import type { PlayerInfo } from '@clocktower/shared';
import { FlatList, Modal, Pressable, Text, View } from 'react-native';
import { styles } from './NominateModal.styles';

interface NominateModalProps {
  visible: boolean;
  players: PlayerInfo[];
  nominatedTodayIds?: string[];
  onNominate: (nomineeId: string) => void;
  onClose: () => void;
  title?: string;
}

export function NominateModal({
  visible,
  players,
  nominatedTodayIds = [],
  onNominate,
  onClose,
  title = '지목할 플레이어 선택',
}: NominateModalProps) {
  const nominatedSet = new Set(nominatedTodayIds);

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
          <Text style={styles.title}>{title}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <FlatList
          data={players}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const alreadyNominated = nominatedSet.has(item.id);
            return (
              <Pressable
                style={({ pressed }) => [
                  styles.playerItem,
                  pressed && !alreadyNominated && styles.playerItemPressed,
                  alreadyNominated && styles.playerItemDisabled,
                ]}
                onPress={() => !alreadyNominated && onNominate(item.id)}
                disabled={alreadyNominated}
              >
                <View
                  style={[
                    styles.playerAvatar,
                    alreadyNominated && styles.playerAvatarDisabled,
                  ]}
                >
                  <Text
                    style={[
                      styles.playerAvatarText,
                      alreadyNominated && styles.playerAvatarTextDisabled,
                    ]}
                  >
                    {item.name.charAt(0)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.playerName,
                      alreadyNominated && styles.playerNameDisabled,
                    ]}
                  >
                    {item.name}
                  </Text>
                  {alreadyNominated && (
                    <Text style={styles.alreadyNominatedHint}>
                      이미 오늘 지목을 당한 플레이어입니다
                    </Text>
                  )}
                </View>
              </Pressable>
            );
          }}
        />
      </View>
    </Modal>
  );
}
