import { colors } from '@clocktower/ui';
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
    backgroundColor: colors.surface.elevated,
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    overflow: 'hidden',
  },
  cardBack: {
    backgroundColor: '#14141a',
  },
  teamLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
    marginTop: 2,
  },
  roleName: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  roleNameDead: {
    color: '#9a9ca4',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: colors.border.default,
    marginBottom: 12,
  },
  ability: {
    color: colors.text.muted,
    fontSize: 14,
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
    backgroundColor: '#2e2e38',
  },
  flipHintText: {
    color: '#6a6a7a',
    fontSize: 12,
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
    color: '#b85c5c',
    fontSize: 13,
    fontWeight: '600',
    width: 80,
  },
  infoValue: {
    color: '#d0ccc8',
    fontSize: 13,
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
    backgroundColor: '#242838',
    marginBottom: 16,
  },
  phrase: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  hiddenHint: {
    fontSize: 14,
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
    backgroundColor: '#1c1e28',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: '#1c1e28',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealIcon: {
    fontSize: 14,
  },
  bottomHint: {
    color: '#3a3e4a',
    fontSize: 11,
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
