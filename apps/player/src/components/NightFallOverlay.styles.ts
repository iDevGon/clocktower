import { colors, space, typography } from '@clocktower/ui';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingHorizontal: space.xl,
    gap: space.base,
  },
  flameStage: {
    width: 80,
    height: 150,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: space.base,
  },
  flameStageStatic: {
    width: 80,
    height: 150,
    marginBottom: space.base,
  },
  flameHalo: {
    position: 'absolute',
    top: 0,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.ember.glow,
  },
  candleBase: {
    width: 14,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.ink.mid,
    marginTop: -4,
  },
  clocktowerLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '40%',
  },

  label: {
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    letterSpacing: typography.tracking.widest,
    color: colors.twilight.glow,
    textTransform: 'uppercase',
  },
  ornament: {
    marginVertical: space.sm,
  },
  message: {
    fontFamily: typography.family.display,
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.parchment.high,
    textAlign: 'center',
    letterSpacing: typography.tracking.wide,
  },
});
