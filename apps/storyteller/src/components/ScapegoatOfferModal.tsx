import { colors } from '@clocktower/ui';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

interface ScapegoatOfferModalProps {
  visible: boolean;
  candidateName: string;
  scapegoatName: string;
  onAccept: () => void;
  onReject: () => void;
}

export function ScapegoatOfferModal({
  visible,
  candidateName,
  scapegoatName,
  onAccept,
  onReject,
}: ScapegoatOfferModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onReject}
    >
      <Pressable style={styles.overlay} onPress={onReject}>
        <Pressable style={styles.panel} onPress={(e) => e.stopPropagation?.()}>
          <Text style={styles.title}>희생양 교체</Text>
          <Text style={styles.body}>
            <Text style={styles.highlight}>{candidateName}</Text> 처형 예정.
          </Text>
          <Text style={styles.body}>
            같은 진영 희생양{' '}
            <Text style={styles.highlight}>{scapegoatName}</Text>이(가) 대신
            처형될 수 있습니다.
          </Text>

          <View style={styles.buttons}>
            <Pressable style={styles.rejectButton} onPress={onReject}>
              <Text style={styles.rejectText}>그대로 진행</Text>
            </Pressable>
            <Pressable style={styles.acceptButton} onPress={onAccept}>
              <Text style={styles.acceptText}>희생양으로 교체</Text>
            </Pressable>
          </View>
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
    borderRadius: 12,
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
    marginBottom: 12,
  },
  body: {
    color: colors.text.muted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  highlight: {
    color: colors.text.primary,
    fontWeight: '700',
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: colors.surface.base,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  rejectText: {
    color: colors.text.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#2a1a1e',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#5a3a3a',
  },
  acceptText: {
    color: '#ce9090',
    fontSize: 14,
    fontWeight: '700',
  },
});
