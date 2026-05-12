import { colors } from '@clocktower/ui';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

interface ArtistRequestModalProps {
  visible: boolean;
  playerName: string;
  warningText?: string | null;
  onAnswer: (yes: boolean) => void;
  onClose: () => void;
}

export function ArtistRequestModal({
  visible,
  playerName,
  warningText,
  onAnswer,
  onClose,
}: ArtistRequestModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.panel} onPress={(e) => e.stopPropagation?.()}>
          <Text style={styles.title}>화가 답변</Text>
          <Text style={styles.subtitle}>
            {playerName}님이 예/아니오 질문을 했습니다
          </Text>

          {warningText ? (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>{warningText}</Text>
            </View>
          ) : null}

          <View style={styles.buttons}>
            <Pressable
              style={[styles.answerButton, styles.noButton]}
              onPress={() => onAnswer(false)}
            >
              <Text style={[styles.answerText, styles.noText]}>아니오</Text>
            </Pressable>
            <Pressable
              style={[styles.answerButton, styles.yesButton]}
              onPress={() => onAnswer(true)}
            >
              <Text style={[styles.answerText, styles.yesText]}>예</Text>
            </Pressable>
          </View>

          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>취소</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface.overlay,
  },
  panel: {
    backgroundColor: colors.surface.elevated,
    borderRadius: 6,
    padding: 20,
    width: '85%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  title: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  warningBox: {
    backgroundColor: 'rgba(184,92,92,0.14)',
    borderColor: '#b85c5c',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  warningText: {
    color: '#f0b36a',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  answerButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 5,
    borderWidth: 1,
    alignItems: 'center',
  },
  yesButton: {
    backgroundColor: '#1a2a18',
    borderColor: '#4a7a3a',
  },
  noButton: {
    backgroundColor: '#261a1a',
    borderColor: '#943c3c',
  },
  answerText: {
    fontSize: 18,
    fontWeight: '800',
  },
  yesText: {
    color: '#7dce82',
  },
  noText: {
    color: '#ce8282',
  },
  cancelButton: {
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  cancelText: {
    color: colors.text.tertiary,
    fontSize: 13,
  },
});
