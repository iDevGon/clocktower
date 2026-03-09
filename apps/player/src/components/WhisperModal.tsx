import { useEffect, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { usePlayerStore } from '../stores/playerStore';
import { useWhisperStore } from '../stores/whisperStore';
import { WhisperChat } from './WhisperChat';
import { WhisperPlayerList } from './WhisperPlayerList';
import { WhisperToast } from './WhisperToast';

interface WhisperModalProps {
  visible: boolean;
  onClose: () => void;
  onSend: (toId: string, message: string) => void;
  initialTarget?: { id: string; name: string } | null;
}

export function WhisperModal({ visible, onClose, onSend, initialTarget }: WhisperModalProps) {
  const [whisperTarget, setWhisperTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const playerId = usePlayerStore((s) => s.playerId);

  useEffect(() => {
    if (visible && initialTarget) {
      setWhisperTarget(initialTarget);
      useWhisperStore.getState().setActiveChat(initialTarget.id);
    }
  }, [visible, initialTarget]);

  const handleClose = () => {
    setWhisperTarget(null);
    useWhisperStore.getState().setActiveChat(null);
    onClose();
  };

  const handleBack = () => {
    setWhisperTarget(null);
    useWhisperStore.getState().setActiveChat(null);
  };

  const handleSelectPlayer = (id: string, name: string) => {
    setWhisperTarget({ id, name });
    useWhisperStore.getState().setActiveChat(id);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        {whisperTarget ? (
          <WhisperChat
            partnerId={whisperTarget.id}
            partnerName={whisperTarget.name}
            onBack={handleBack}
            onSend={onSend}
          />
        ) : (
          <WhisperPlayerList
            players={usePlayerStore.getState().gamePlayers}
            myPlayerId={playerId}
            onSelectPlayer={handleSelectPlayer}
            onClose={handleClose}
          />
        )}
        <WhisperToast
          onNavigate={(id, name) => handleSelectPlayer(id, name)}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#121214',
    paddingTop: 48,
  },
});
