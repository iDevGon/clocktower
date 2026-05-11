import { colors } from '@clocktower/ui';
import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

interface SavantRequestModalProps {
  visible: boolean;
  playerName: string;
  onSubmit: (trueInfo: string, falseInfo: string) => void;
  onClose: () => void;
}

export function SavantRequestModal({
  visible,
  playerName,
  onSubmit,
  onClose,
}: SavantRequestModalProps) {
  const [trueInfo, setTrueInfo] = useState('');
  const [falseInfo, setFalseInfo] = useState('');

  useEffect(() => {
    if (visible) {
      setTrueInfo('');
      setFalseInfo('');
    }
  }, [visible]);

  const canSend = trueInfo.trim().length > 0 && falseInfo.trim().length > 0;

  const handleSubmit = () => {
    if (!canSend) return;
    onSubmit(trueInfo.trim(), falseInfo.trim());
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.panel} onPress={(e) => e.stopPropagation?.()}>
          <Text style={styles.title}>백치천재 정보 전송</Text>
          <Text style={styles.subtitle}>{playerName}님에게 보낼 정보</Text>

          <Text style={styles.fieldLabel}>참 정보</Text>
          <TextInput
            style={[styles.input, styles.inputTrue]}
            value={trueInfo}
            onChangeText={setTrueInfo}
            placeholder="실제로 참인 정보를 입력하세요"
            placeholderTextColor={colors.text.tertiary}
            multiline
            autoFocus
          />

          <Text style={styles.fieldLabel}>거짓 정보</Text>
          <TextInput
            style={[styles.input, styles.inputFalse]}
            value={falseInfo}
            onChangeText={setFalseInfo}
            placeholder="거짓 정보를 입력하세요"
            placeholderTextColor={colors.text.tertiary}
            multiline
          />

          <View style={styles.buttons}>
            <Pressable style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>취소</Text>
            </Pressable>
            <Pressable
              style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
              onPress={handleSubmit}
              disabled={!canSend}
            >
              <Text
                style={[styles.sendText, !canSend && styles.sendTextDisabled]}
              >
                전송
              </Text>
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
    borderRadius: 6,
    padding: 20,
    width: '90%',
    maxWidth: 480,
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
    marginTop: 4,
    marginBottom: 16,
  },
  fieldLabel: {
    color: colors.text.muted,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: colors.surface.base,
    borderWidth: 1,
    borderRadius: 4,
    padding: 12,
    color: colors.text.primary,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  inputTrue: {
    borderColor: '#2e4a2e',
  },
  inputFalse: {
    borderColor: '#4e2e2e',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  cancelButton: {
    backgroundColor: colors.surface.base,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  cancelText: {
    color: colors.text.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  sendButton: {
    backgroundColor: '#1a2e3a',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#2e4a5a',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendText: {
    color: '#82c8ce',
    fontSize: 14,
    fontWeight: '700',
  },
  sendTextDisabled: {
    color: colors.text.tertiary,
  },
});
