import { colors, createChatStyles, typography } from '@clocktower/ui';
import { StyleSheet } from 'react-native';

const chatStyles = createChatStyles('whisper');

export const styles = StyleSheet.create({
  ...chatStyles,
  backButton: chatStyles.closeButton,
  backText: chatStyles.closeText,
  partnerName: {
    ...chatStyles.headerTitle,
    flex: 1,
    textAlign: 'center',
  },
  senderName: {
    ...chatStyles.senderLabel,
    color: colors.arcane.text.label,
  },
  inputClosedText: {
    color: colors.arcane.text.dead,
    fontSize: 14,
    fontFamily: typography.fontFamily.bodyBold,
  },
});
