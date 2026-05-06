import { colors, typography } from '@clocktower/ui';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  pressable: {
    width: '100%',
  },
  container: {
    width: '100%',
    position: 'relative',
  },
  face: {
    width: '100%',
  },
  faceBack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  card: {
    backgroundColor: colors.arcane.surface.ledger,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.arcane.border.brassDim,
    padding: 20,
    overflow: 'hidden',
  },
  cardBack: {
    backgroundColor: colors.arcane.surface.apparatus,
  },
  teamLabel: {
    fontSize: 12,
    fontFamily: typography.fontFamily.bodyMedium,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
    marginTop: 2,
  },
  roleName: {
    color: colors.arcane.text.strong,
    fontFamily: typography.fontFamily.display,
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  roleNameDead: {
    color: colors.arcane.text.dead,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: colors.arcane.border.brassDim,
    marginBottom: 12,
  },
  ability: {
    color: colors.arcane.text.primary,
    fontSize: 14,
    fontFamily: typography.fontFamily.body,
    lineHeight: 20,
  },
  flipHintBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 10,
  },
  flipHintLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.arcane.border.brassDim,
  },
  flipHintText: {
    color: colors.arcane.text.dead,
    fontSize: 12,
    fontFamily: typography.fontFamily.bodyMedium,
    letterSpacing: 0.5,
  },
  evilInfoSection: {
    marginTop: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  infoLabel: {
    color: colors.arcane.action.bloodHighlight,
    fontSize: 13,
    fontFamily: typography.fontFamily.bodyBold,
    fontWeight: '600',
    width: 80,
  },
  infoValue: {
    color: colors.arcane.text.primary,
    fontSize: 13,
    fontFamily: typography.fontFamily.body,
    flex: 1,
  },

  // Back face styles
  outerGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 16,
  },
  shimmerContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 200,
    left: '50%',
    marginLeft: -100,
    zIndex: 1,
  },
  shimmerGradient: {
    flex: 1,
    transform: [{ skewX: '-15deg' }],
  },
  patternContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backContent: {
    alignItems: 'center',
    paddingVertical: 16,
    zIndex: 2,
  },
  backTeamLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 4,
    marginBottom: 10,
  },
  mysteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  mysteryLine: {
    width: 40,
    height: 1,
  },
  questionMark: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  backDivider: {
    width: '60%',
    height: 1,
    backgroundColor: colors.arcane.border.brassDim,
    marginBottom: 16,
  },
  phrase: {
    fontSize: 14,
    fontFamily: typography.fontFamily.body,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  hiddenHint: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bodyMedium,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 20,
  },
  sealContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  sealGlow: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  seal: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: colors.arcane.surface.ledger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: colors.arcane.surface.ledger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealIcon: {
    fontSize: 14,
  },
  bottomHint: {
    color: colors.arcane.text.dead,
    fontSize: 11,
    fontFamily: typography.fontFamily.bodyMedium,
    letterSpacing: 1,
  },

  // Ornate pattern
  ornateGrid: {
    justifyContent: 'space-evenly',
    width: '100%',
    height: '100%',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  ornateRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginVertical: 4,
  },
  diamond: {
    width: 14,
    height: 14,
    borderWidth: 1,
    transform: [{ rotate: '45deg' }],
  },
});
