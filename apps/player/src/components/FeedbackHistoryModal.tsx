import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import type { FeedbackHistoryEntry } from '../stores/playerStore';
import { FeedbackDisplay } from './FeedbackDisplay';
import { styles } from './FeedbackHistoryModal.styles';

interface FeedbackHistoryModalProps {
  visible: boolean;
  history: FeedbackHistoryEntry[];
  onClose: () => void;
  /** timestamp of the entry to highlight (from feedbackToast) */
  highlightTimestamp?: number | null;
}

function HighlightableEntry({
  entry,
  isHighlighted,
}: {
  entry: FeedbackHistoryEntry;
  isHighlighted: boolean;
}) {
  const opacity = useRef(new Animated.Value(isHighlighted ? 1 : 0)).current;

  useEffect(() => {
    if (!isHighlighted) return;
    // Pulse animation: fade highlight in and out
    const animation = Animated.sequence([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(1500),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [isHighlighted, opacity]);

  return (
    <View style={styles.entry}>
      {isHighlighted && (
        <Animated.View
          style={[
            styles.entryHighlight,
            {
              opacity,
              position: 'absolute',
              top: -4,
              left: -8,
              right: -8,
              bottom: -4,
            },
          ]}
        />
      )}
      <View style={styles.dayLabelRow}>
        <View style={styles.dayLabelDot} />
        <Text style={styles.dayLabel}>{entry.day}일차 밤</Text>
      </View>
      <View style={styles.feedbackWrapper}>
        <FeedbackDisplay feedback={entry.feedback} compact />
      </View>
    </View>
  );
}

export function FeedbackHistoryModal({
  visible,
  history,
  onClose,
  highlightTimestamp,
}: FeedbackHistoryModalProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [entryLayouts, setEntryLayouts] = useState<Record<number, number>>({});

  const reversedHistory = [...history].reverse();

  // Find the index of the highlighted entry in reversed list
  const highlightIndex = highlightTimestamp
    ? reversedHistory.findIndex((e) => e.timestamp === highlightTimestamp)
    : -1;

  const handleEntryLayout = useCallback((index: number, y: number) => {
    setEntryLayouts((prev) => ({ ...prev, [index]: y }));
  }, []);

  // Auto-scroll to highlighted entry when modal opens
  useEffect(() => {
    if (!visible || highlightIndex < 0) return;
    const y = entryLayouts[highlightIndex];
    if (y == null) return;
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [visible, highlightIndex, entryLayouts]);

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
              ref={scrollRef}
              style={styles.list}
              contentContainerStyle={styles.listContent}
            >
              {reversedHistory.map((entry, index) => (
                <View
                  key={`${entry.day}-${entry.timestamp}`}
                  onLayout={(e) =>
                    handleEntryLayout(index, e.nativeEvent.layout.y)
                  }
                >
                  <HighlightableEntry
                    entry={entry}
                    isHighlighted={index === highlightIndex}
                  />
                </View>
              ))}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
