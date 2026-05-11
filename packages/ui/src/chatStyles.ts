import { StyleSheet } from 'react-native';
import { colors, typography } from './tokens';

type ChatAccent = keyof typeof colors.chat;
const arcane = colors.arcane;

/**
 * Creates chat styles parameterized by accent theme.
 * Both StorytellerChatModal and WhisperChat use identical layout
 * but differ in accent colors (purple vs green).
 */
export function createChatStyles(accent: ChatAccent) {
  const theme = colors.chat[accent];
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: arcane.surface.base,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderColor: arcane.border.brassDim,
      backgroundColor: arcane.surface.apparatus,
    },
    closeButton: {
      paddingVertical: 4,
      paddingRight: 12,
    },
    closeText: {
      color: theme.accent,
      fontSize: 14,
      fontFamily: typography.fontFamily.bodyBold,
    },
    headerTitle: {
      color: arcane.text.strong,
      fontSize: 17,
      fontFamily: typography.fontFamily.display,
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
      color: arcane.text.dead,
      fontSize: 14,
      fontFamily: typography.fontFamily.body,
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
      borderRadius: 4,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderWidth: 1,
    },
    messageBubbleMine: {
      backgroundColor: theme.bubbleMine,
      borderColor: theme.accent,
    },
    messageBubbleOther: {
      backgroundColor: arcane.surface.apparatus,
      borderColor: theme.otherBorderColor,
    },
    senderLabel: {
      color: theme.senderLabel,
      fontSize: 11,
      fontFamily: typography.fontFamily.bodyBold,
      marginBottom: 2,
    },
    messageText: {
      color: arcane.text.primary,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: typography.fontFamily.body,
    },
    messageTextMine: {
      color: theme.textMine,
    },
    messageTime: {
      color: arcane.text.dead,
      fontSize: 10,
      marginTop: 4,
      textAlign: 'right',
      fontFamily: typography.fontFamily.bodyMedium,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderTopWidth: 1,
      borderColor: arcane.border.brassDim,
      backgroundColor: arcane.surface.apparatus,
      gap: 8,
    },
    input: {
      flex: 1,
      backgroundColor: arcane.surface.base,
      borderWidth: 1,
      borderColor: arcane.border.parchment,
      borderRadius: 4,
      paddingHorizontal: 16,
      paddingVertical: 10,
      color: arcane.text.primary,
      fontSize: 14,
      fontFamily: typography.fontFamily.body,
    },
    sendButton: {
      backgroundColor: theme.accent,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: arcane.border.brassDim,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    sendButtonDisabled: {
      backgroundColor: arcane.surface.ledger,
      borderColor: arcane.border.parchment,
    },
    sendText: {
      color: arcane.surface.base,
      fontSize: 14,
      fontFamily: typography.fontFamily.bodyBold,
    },
    sendTextDisabled: {
      color: arcane.text.dead,
    },
  });
}
