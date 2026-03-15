import { createChatStyles } from '@clocktower/ui';
import { StyleSheet } from 'react-native';

const chatStyles = createChatStyles('storyteller');

export const styles = StyleSheet.create({
  ...chatStyles,
  modalContainer: {
    flex: 1,
    backgroundColor: '#121214',
    paddingTop: 48,
  },
  backText: {
    color: '#8a6a8a',
    fontSize: 14,
    fontWeight: '600',
  },
  // Player list
  playerList: {
    flex: 1,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#1e1e22',
  },
  playerInfo: {
    flex: 1,
  },
  playerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerName: {
    color: '#e0ddd8',
    fontSize: 15,
    fontWeight: '600',
  },
  playerNameDead: {
    color: '#6a6a6a',
  },
  deadBadge: {
    color: '#c44',
    fontSize: 11,
    fontWeight: '700',
  },
  roleBadge: {
    color: '#888',
    fontSize: 11,
  },
  lastMessage: {
    color: '#7a7a7a',
    fontSize: 13,
    marginTop: 4,
  },
  unreadBadge: {
    backgroundColor: '#c44',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  // Chat view overrides (sender label uses greenish tint for player names)
  senderLabel: {
    ...chatStyles.senderLabel,
    color: '#8a8a6a',
  },
  messageBubbleOther: {
    ...chatStyles.messageBubbleOther,
    borderColor: '#2e2e34',
  },
});
