import { colors, typography } from '@clocktower/ui';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { usePlayerStore } from '../stores/playerStore';

interface HarlotConsentModalProps {
  onRespond: (harlotId: string, accepted: boolean) => void;
}

export function HarlotConsentModal({ onRespond }: HarlotConsentModalProps) {
  const request = usePlayerStore((s) => s.harlotConsentRequest);

  if (!request) return null;

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <Text style={styles.title}>매춘부 방문 요청</Text>
          <Text style={styles.message}>
            {request.harlotName}이(가) 당신을 방문했습니다. 동의하면 당신의
            캐릭터를 알게 됩니다.
          </Text>
          <View style={styles.buttonRow}>
            <Pressable
              style={[styles.button, styles.rejectButton]}
              onPress={() => onRespond(request.harlotId, false)}
            >
              <Text style={[styles.buttonText, styles.rejectText]}>거절</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.acceptButton]}
              onPress={() => onRespond(request.harlotId, true)}
            >
              <Text style={[styles.buttonText, styles.acceptText]}>동의</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(13,7,3,0.78)',
    padding: 20,
  },
  panel: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.arcane.surface.apparatus,
    borderWidth: 1,
    borderColor: colors.arcane.border.brassDim,
    borderRadius: 4,
    overflow: 'hidden',
  },
  title: {
    color: colors.arcane.text.strong,
    fontSize: 18,
    fontFamily: typography.fontFamily.display,
    textAlign: 'center',
    paddingTop: 20,
  },
  message: {
    color: colors.arcane.text.muted,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: typography.fontFamily.body,
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.arcane.border.brassDim,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
  },
  rejectButton: {
    backgroundColor: colors.arcane.surface.ledger,
    borderRightWidth: 1,
    borderRightColor: colors.arcane.border.brassDim,
  },
  acceptButton: {
    backgroundColor: colors.arcane.accent.midnightInk,
  },
  buttonText: {
    fontSize: 15,
    fontFamily: typography.fontFamily.bodyBold,
  },
  rejectText: {
    color: colors.arcane.text.muted,
  },
  acceptText: {
    color: colors.arcane.accent.sapphireLens,
  },
});
