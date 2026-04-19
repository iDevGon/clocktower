import { StyleSheet } from 'react-native';
import { colors, typography } from './tokens';

type ChatAccent = keyof typeof colors.chat;

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
      backgroundColor: colors.surface.base,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderColor: colors.border.default,
    },
    closeButton: {
      paddingVertical: 4,
      paddingRight: 12,
    },
    closeText: {
      fontFamily: typography.family.body,
      color: theme.accent,
      fontSize: 14,
      fontWeight: typography.weight.semibold,
    },
    headerTitle: {
      fontFamily: typography.family.display,
      color: colors.text.primary,
      fontSize: 16,
      fontWeight: typography.weight.bold,
      letterSpacing: typography.tracking.tight,
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
      color: colors.text.tertiary,
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
      backgroundColor: theme.bubbleMine,
      borderBottomRightRadius: 4,
    },
    messageBubbleOther: {
      backgroundColor: colors.surface.elevated,
      borderBottomLeftRadius: 4,
      borderWidth: 1,
      borderColor: theme.otherBorderColor,
    },
    senderLabel: {
      fontFamily: typography.family.body,
      color: theme.senderLabel,
      fontSize: 11,
      fontWeight: typography.weight.semibold,
      letterSpacing: typography.tracking.wide,
      marginBottom: 2,
    },
    messageText: {
      fontFamily: typography.family.body,
      color: colors.text.primary,
      fontSize: 14,
      lineHeight: 20,
    },
    messageTextMine: {
      color: theme.textMine,
    },
    messageTime: {
      color: colors.text.tertiary,
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
      borderColor: colors.border.default,
      gap: 8,
    },
    input: {
      flex: 1,
      fontFamily: typography.family.body,
      backgroundColor: colors.surface.elevated,
      borderWidth: 1,
      borderColor: colors.border.default,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      color: colors.text.primary,
      fontSize: 14,
    },
    sendButton: {
      backgroundColor: theme.accent,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    sendButtonDisabled: {
      backgroundColor: colors.border.default,
    },
    sendText: {
      fontFamily: typography.family.body,
      color: colors.surface.base,
      fontSize: 14,
      fontWeight: typography.weight.bold,
    },
    sendTextDisabled: {
      color: colors.text.tertiary,
    },
  });
}
