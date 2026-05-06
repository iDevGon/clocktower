import { colors, typography } from '@clocktower/ui';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  skullText: {
    fontSize: 64,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    letterSpacing: 12,
    color: colors.arcane.action.blood,
    fontFamily: typography.fontFamily.bodyMedium,
    fontWeight: '300',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontFamily: typography.fontFamily.display,
    fontWeight: '800',
    color: colors.arcane.action.bloodHighlight,
    textAlign: 'center',
    marginBottom: 8,
  },
  reasonBadge: {
    backgroundColor: 'rgba(94, 29, 24, 0.34)',
    borderWidth: 1,
    borderColor: colors.arcane.action.blood,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
    marginTop: 4,
  },
  reasonText: {
    fontSize: 13,
    color: colors.arcane.text.primary,
    fontWeight: '500',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: colors.arcane.text.muted,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitleEmphasis: {
    color: colors.arcane.action.bloodHighlight,
    fontWeight: '800',
    fontSize: 16,
  },
  subtitleHint: {
    fontSize: 13,
    color: colors.arcane.text.dead,
    fontWeight: '300',
    textAlign: 'center',
  },
});
