import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import type { FeedbackHistoryEntry } from '../stores/playerStore';
import { FeedbackDisplay } from './FeedbackDisplay';
import { styles } from './FeedbackHistoryModal.styles';

interface FeedbackHistoryModalProps {
  visible: boolean;
  history: FeedbackHistoryEntry[];
  onClose: () => void;
}

export function FeedbackHistoryModal({
  visible,
  history,
  onClose,
}: FeedbackHistoryModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.container} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>받은 정보</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>닫기</Text>
            </Pressable>
          </View>

          {history.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>아직 받은 정보가 없습니다</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
            >
              {[...history].reverse().map((entry) => (
                <View
                  key={`${entry.day}-${entry.timestamp}`}
                  style={styles.entry}
                >
                  <View style={styles.dayLabelRow}>
                    <View style={styles.dayLabelDot} />
                    <Text style={styles.dayLabel}>{entry.day}일차 밤</Text>
                  </View>
                  <View style={styles.feedbackWrapper}>
                    <FeedbackDisplay feedback={entry.feedback} compact />
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
