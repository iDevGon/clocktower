import { createChatStyles } from '@clocktower/ui';
import { StyleSheet } from 'react-native';

const chatStyles = createChatStyles('storyteller');

export const styles = StyleSheet.create({
  ...chatStyles,
  container: {
    ...chatStyles.container,
    paddingTop: 48,
  },
});
