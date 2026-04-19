import { colors, space, typography } from '@clocktower/ui';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingHorizontal: space.xl,
    gap: space.sm,
  },
  eyebrow: {
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    letterSpacing: typography.tracking.widest,
    color: colors.parchment.mid,
    textTransform: 'uppercase',
    marginTop: space.sm,
  },
  noDeathText: {
    fontFamily: typography.family.display,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.parchment.high,
    textAlign: 'center',
    paddingVertical: space.sm,
  },
  deathList: {
    gap: space.xs,
    alignItems: 'center',
    paddingVertical: space.sm,
  },
  deathRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: space.sm,
  },
  deathName: {
    fontFamily: typography.family.display,
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.crimson.glow,
    letterSpacing: typography.tracking.tight,
    textDecorationLine: 'line-through',
    textDecorationColor: colors.crimson.core,
  },
  deathSuffix: {
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    color: colors.parchment.low,
    fontStyle: 'italic',
  },
  dismissHint: {
    marginTop: space.base,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    color: colors.parchment.low,
    letterSpacing: typography.tracking.wide,
  },
});
