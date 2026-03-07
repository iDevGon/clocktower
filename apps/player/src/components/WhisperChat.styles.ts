import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121214',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#2e2e34',
  },
  backButton: {
    paddingVertical: 4,
    paddingRight: 12,
  },
  backText: {
    color: '#6a8a6a',
    fontSize: 14,
    fontWeight: '600',
  },
  partnerName: {
    color: '#e0ddd8',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 60,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 16,
    gap: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    color: '#5c5a58',
    fontSize: 14,
  },
  messageBubbleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  messageBubbleRowMine: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  messageBubbleMine: {
    backgroundColor: '#2a3d2a',
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: '#1a1a1e',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#2e2e34',
  },
  messageText: {
    color: '#e0ddd8',
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextMine: {
    color: '#d0e8d0',
  },
  messageTime: {
    color: '#5c5a58',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'right',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: '#2e2e34',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#1a1a1e',
    borderWidth: 1,
    borderColor: '#2e2e34',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#e0ddd8',
    fontSize: 14,
  },
  sendButton: {
    backgroundColor: '#6a8a6a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendButtonDisabled: {
    backgroundColor: '#2e2e34',
  },
  sendText: {
    color: '#121214',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sendTextDisabled: {
    color: '#5c5a58',
  },
});
