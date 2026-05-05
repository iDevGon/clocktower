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
          <Text style={styles.title}>창녀 방문 요청</Text>
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
    backgroundColor: 'rgba(0,0,0,0.65)',
    padding: 20,
  },
  panel: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#1e1e22',
    borderWidth: 1,
    borderColor: '#3a3a42',
  },
  title: {
    color: '#e0ddd8',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    paddingTop: 20,
  },
  message: {
    color: '#b6b0a6',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#3a3a42',
  },
  button: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
  },
  rejectButton: {
    backgroundColor: '#282329',
    borderRightWidth: 1,
    borderRightColor: '#3a3a42',
  },
  acceptButton: {
    backgroundColor: '#1f332d',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  rejectText: {
    color: '#c8c2b8',
  },
  acceptText: {
    color: '#8ee0c0',
  },
});
