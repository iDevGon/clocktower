import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121214',
    paddingTop: 48,
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
  closeButton: {
    paddingVertical: 4,
    paddingRight: 12,
  },
  closeText: {
    color: '#8a6a8a',
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
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
    backgroundColor: '#2a2a4d',
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: '#1a1a1e',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#3a2a4a',
  },
  senderLabel: {
    color: '#8a6a8a',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  messageText: {
    color: '#e0ddd8',
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextMine: {
    color: '#d0d0e8',
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
    backgroundColor: '#8a6a8a',
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
