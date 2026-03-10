import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { FeedbackHistoryEntry } from '../stores/playerStore';
import { FeedbackDisplay } from './FeedbackDisplay';

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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#1a1a1e',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '85%',
    minHeight: 300,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#2e2e34',
  },
  title: {
    color: '#e0ddd8',
    fontSize: 17,
    fontWeight: '700',
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#2a2a30',
  },
  closeText: {
    color: '#908e8a',
    fontSize: 14,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#5c5a58',
    fontSize: 14,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  entry: {
    gap: 8,
  },
  dayLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayLabelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8090c0',
  },
  dayLabel: {
    color: '#8090c0',
    fontSize: 13,
    fontWeight: '700',
  },
  feedbackWrapper: {
    marginLeft: 16,
  },
});
