import { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

interface GossipDeclareModalProps {
  visible: boolean;
  onSubmit: (statement: string) => void;
  onClose: () => void;
}

export function GossipDeclareModal({
  visible,
  onSubmit,
  onClose,
}: GossipDeclareModalProps) {
  const [statement, setStatement] = useState('');
  const trimmed = statement.trim();

  const submit = () => {
    if (!trimmed) return;
    onSubmit(trimmed);
    setStatement('');
  };

  const close = () => {
    setStatement('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.panel}>
          <Text style={styles.title}>험담 공개발언</Text>
          <TextInput
            value={statement}
            onChangeText={setStatement}
            placeholder="예: 오늘 살아있는 악 팀은 2명입니다"
            placeholderTextColor="#696866"
            multiline
            maxLength={180}
            style={styles.input}
          />
          <View style={styles.buttons}>
            <Pressable style={styles.cancelButton} onPress={close}>
              <Text style={styles.cancelText}>취소</Text>
            </Pressable>
            <Pressable
              style={[styles.submitButton, !trimmed && styles.disabledButton]}
              onPress={submit}
              disabled={!trimmed}
            >
              <Text style={styles.submitText}>공개발언</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.78)',
    padding: 20,
  },
  panel: {
    backgroundColor: '#1a1816',
    borderWidth: 1,
    borderColor: '#3e3a35',
    borderRadius: 6,
    padding: 18,
  },
  title: {
    color: '#e0ddd8',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  input: {
    minHeight: 96,
    color: '#f0ede8',
    backgroundColor: '#11100f',
    borderWidth: 1,
    borderColor: '#3a3632',
    borderRadius: 4,
    padding: 12,
    textAlignVertical: 'top',
    fontSize: 15,
    lineHeight: 21,
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 4,
    backgroundColor: '#2b2926',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 4,
    backgroundColor: '#4e6f82',
  },
  disabledButton: {
    opacity: 0.45,
  },
  cancelText: {
    color: '#c8c2ba',
    fontWeight: '700',
  },
  submitText: {
    color: '#fff',
    fontWeight: '800',
  },
});
