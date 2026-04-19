import { colors, space, typography } from '@clocktower/ui';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingHorizontal: space.xl,
    gap: space.xs,
  },
  eyebrow: {
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    letterSpacing: typography.tracking.widest,
    color: colors.crimson.glow,
    textTransform: 'uppercase',
    marginTop: space.sm,
  },
  nameText: {
    fontFamily: typography.family.display,
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: colors.parchment.high,
    textAlign: 'center',
    letterSpacing: typography.tracking.tight,
    marginVertical: space.sm,
  },
  seal: {
    marginVertical: space.xs,
  },
  detailText: {
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    color: colors.parchment.mid,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  verdict: {
    fontFamily: typography.family.display,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.crimson.glow,
    letterSpacing: typography.tracking.wide,
    marginTop: space.sm,
  },
  dismissHint: {
    marginTop: space.lg,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    color: colors.parchment.low,
    letterSpacing: typography.tracking.wide,
  },
});
