import { colors, typography } from '@clocktower/ui';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  axeText: {
    fontSize: 56,
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    letterSpacing: 10,
    color: colors.arcane.border.brass,
    fontFamily: typography.fontFamily.bodyMedium,
    fontWeight: '300',
    textTransform: 'uppercase',
    marginBottom: 0,
  },
  nameText: {
    fontSize: 32,
    fontFamily: typography.fontFamily.display,
    fontWeight: '900',
    color: colors.arcane.text.label,
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: 'rgba(232, 100, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  reasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(38, 22, 6, 0.72)',
    borderWidth: 1,
    borderColor: colors.arcane.border.brassDim,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 20,
  },
  reasonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  reasonText: {
    fontSize: 14,
    color: colors.arcane.text.primary,
    fontWeight: '500',
    textAlign: 'center',
    flexShrink: 1,
  },
  deathText: {
    fontSize: 13,
    color: colors.arcane.text.dead,
    fontWeight: '300',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  dismissHint: {
    marginTop: 28,
    fontSize: 12,
    color: colors.arcane.text.dead,
    letterSpacing: 1,
  },
});
