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
    color: colors.crimson.glow,
    textTransform: 'uppercase',
    marginTop: space.sm,
  },
  title: {
    fontFamily: typography.family.display,
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.parchment.high,
    textAlign: 'center',
    letterSpacing: typography.tracking.tight,
    lineHeight: typography.size.xl * typography.leading.tight,
  },
  reasonBadge: {
    paddingHorizontal: space.base,
    paddingVertical: space.xs,
    marginTop: space.xs,
  },
  reasonText: {
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    color: colors.parchment.mid,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: typography.family.body,
    fontSize: typography.size.base,
    color: colors.parchment.mid,
    textAlign: 'center',
    marginTop: space.sm,
  },
  subtitleEmphasis: {
    fontFamily: typography.family.display,
    fontWeight: typography.weight.bold,
    color: colors.ember.glow,
  },
  subtitleHint: {
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    color: colors.parchment.low,
    textAlign: 'center',
  },
});
