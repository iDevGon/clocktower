import { useEffect, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { useWhisperExpired } from '../hooks/useWhisperExpired';
import { usePlayerStore } from '../stores/playerStore';
import { useWhisperStore } from '../stores/whisperStore';
import { WhisperChat } from './WhisperChat';
import { WhisperPlayerList } from './WhisperPlayerList';
import { WhisperToast } from './WhisperToast';

interface ConversationTarget {
  conversationId: string;
  participantIds: string[];
  participantNames: string[];
}

interface WhisperModalProps {
  visible: boolean;
  onClose: () => void;
  onSend: (params: {
    conversationId?: string;
    participantIds?: string[];
    message: string;
  }) => void;
  initialTarget?: ConversationTarget | null;
}

export function WhisperModal({
  visible,
  onClose,
  onSend,
  initialTarget,
}: WhisperModalProps) {
  const [activeConversation, setActiveConversation] =
    useState<ConversationTarget | null>(null);
  const playerId = usePlayerStore((s) => s.playerId);
  const whisperExpired = useWhisperExpired();

  useEffect(() => {
    if (visible && initialTarget) {
      setActiveConversation(initialTarget);
      useWhisperStore.getState().setActiveChat(initialTarget.conversationId);
    }
  }, [visible, initialTarget]);

  const handleClose = () => {
    setActiveConversation(null);
    useWhisperStore.getState().setActiveChat(null);
    onClose();
  };

  const handleBack = () => {
    setActiveConversation(null);
    useWhisperStore.getState().setActiveChat(null);
  };

  const handleSelectConversation = (target: ConversationTarget) => {
    setActiveConversation(target);
    useWhisperStore.getState().setActiveChat(target.conversationId);
  };

  const handleToastNavigate = (conversationId: string) => {
    const meta = useWhisperStore.getState().conversationMeta[conversationId];
    if (meta) {
      handleSelectConversation({
        conversationId,
        participantIds: meta.participantIds,
        participantNames: meta.participantNames,
      });
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        {activeConversation ? (
          <WhisperChat
            conversationId={activeConversation.conversationId}
            participantIds={activeConversation.participantIds}
            participantNames={activeConversation.participantNames}
            onBack={handleBack}
            onSend={onSend}
            readOnly={whisperExpired}
          />
        ) : (
          <WhisperPlayerList
            players={usePlayerStore.getState().gamePlayers}
            myPlayerId={playerId}
            onSelectConversation={handleSelectConversation}
            onClose={handleClose}
          />
        )}
        <WhisperToast onNavigate={handleToastNavigate} />
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
