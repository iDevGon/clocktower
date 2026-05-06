import { colors, typography } from '@clocktower/ui';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  moonText: {
    fontSize: 56,
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    letterSpacing: 8,
    color: colors.arcane.accent.sapphireLens,
    fontFamily: typography.fontFamily.bodyMedium,
    fontWeight: '300',
    textTransform: 'uppercase',
  },
  message: {
    fontSize: 20,
    color: colors.arcane.text.primary,
    fontFamily: typography.fontFamily.display,
    fontWeight: '500',
    textAlign: 'center',
  },
});
