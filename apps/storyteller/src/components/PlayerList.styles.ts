import { colors, typography } from '@clocktower/ui';
import { StyleSheet } from 'react-native';

const arcane = colors.arcane;

export const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: arcane.surface.apparatus,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: arcane.border.parchment,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 9999,
  },
  playerName: {
    color: arcane.text.strong,
    fontSize: 16,
    fontFamily: typography.fontFamily.bodyMedium,
  },
  roleName: {
    color: arcane.text.muted,
    fontSize: 14,
    fontFamily: typography.fontFamily.body,
  },
});
