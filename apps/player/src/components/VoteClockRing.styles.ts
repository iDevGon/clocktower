import { StyleSheet } from 'react-native';

export const RING_SIZE = 240;
export const NODE_SIZE = 32;
export const CENTER = RING_SIZE / 2;
export const RADIUS = RING_SIZE / 2 - NODE_SIZE / 2 - 6;
export const HAND_LENGTH = RADIUS - 24;
export const TICK_COUNT = 60;
export const INNER_RING_RADIUS = RADIUS - 20;

// Dagger proportions
export const DAGGER_W = 24;
export const BLADE_W = 6;
export const TIP_H = Math.round(HAND_LENGTH * 0.1);
export const BLADE_H = Math.round(HAND_LENGTH * 0.5);
export const CROSSGUARD_W = 18;
export const CROSSGUARD_H = 3;
export const GRIP_W = 3.5;
export const GRIP_H = HAND_LENGTH - TIP_H - BLADE_H - CROSSGUARD_H - 3;
export const POMMEL_SIZE = 6;

export const COLORS = {
  brass: '#8b2020',
  brassLight: '#c44040',
  brassDark: '#6a1818',
  blood: '#8b1a1a',
  bloodGlow: '#c43c3c',
  bloodDeep: '#5a0f0f',
  bone: '#d4cfc6',
  boneFaded: '#9a958c',
  iron: '#4a4a52',
  ironDark: '#2a2a30',
  midnight: '#0d0d12',
  midnightLight: '#16161e',
  // Active = golden amber (distinct from red guilty)
  active: '#d4a030',
  activeGlow: '#f0c040',
  activeDark: '#7a5a10',
  // Guilty = saturated red, Innocent = saturated blue
  guilty: '#e05050',
  guiltyBg: '#e0505040',
  innocent: '#5090e0',
  innocentBg: '#5090e040',
  // My node = warm gold
  myGold: '#c8a040',
  myGoldGlow: '#c8a04060',
  // Dagger
  daggerBlade: '#6a2028',
  daggerEdge: '#a04040',
  daggerBladeUrgent: '#8a2830',
  daggerEdgeUrgent: '#c04848',
  daggerCrossguard: '#5a4035',
  daggerCrossguardEdge: '#7a5a48',
  daggerGrip: '#2a1518',
  daggerPommel: '#4a2828',
  daggerPommelEdge: '#6a3838',
  smoke: '#c43c3c',
};

export const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 12,
  },
  outerGlow: {
    position: 'absolute',
    width: RING_SIZE + 30,
    height: RING_SIZE + 30,
    borderRadius: (RING_SIZE + 30) / 2,
    backgroundColor: `${COLORS.blood}15`,
    top: -3,
  },
  clockOuter: {
    width: RING_SIZE,
    height: RING_SIZE,
    overflow: 'visible',
  },
  clockFace: {
    width: RING_SIZE,
    height: RING_SIZE,
    position: 'relative',
    backgroundColor: COLORS.midnight,
    borderRadius: RING_SIZE / 2,
    overflow: 'visible',
  },
  outerRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RING_SIZE / 2,
    borderWidth: 2.5,
    borderColor: COLORS.brassDark,
    shadowColor: COLORS.brass,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  innerRing: {
    position: 'absolute',
    left: CENTER - INNER_RING_RADIUS,
    top: CENTER - INNER_RING_RADIUS,
    width: INNER_RING_RADIUS * 2,
    height: INNER_RING_RADIUS * 2,
    borderRadius: INNER_RING_RADIUS,
    borderWidth: 0.8,
    borderColor: `${COLORS.brassDark}40`,
  },
  // Dagger hand
  daggerContainer: {
    position: 'absolute',
    left: CENTER - DAGGER_W / 2,
    top: CENTER - HAND_LENGTH,
    width: DAGGER_W,
    height: HAND_LENGTH,
    alignItems: 'center',
    transformOrigin: `${DAGGER_W / 2}px ${HAND_LENGTH}px`,
    zIndex: 10,
  },
  bladeTip: {
    position: 'absolute',
    top: 0,
    width: 0,
    height: 0,
    borderLeftWidth: BLADE_W / 2,
    borderRightWidth: BLADE_W / 2,
    borderBottomWidth: TIP_H,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: COLORS.daggerBlade,
    zIndex: 2,
  },
  bladeTipUrgent: {
    borderBottomColor: COLORS.daggerBladeUrgent,
  },
  blade: {
    position: 'absolute',
    top: TIP_H,
    width: BLADE_W,
    height: BLADE_H,
    backgroundColor: COLORS.daggerBlade,
    borderWidth: 0.5,
    borderColor: COLORS.daggerEdge,
    borderTopWidth: 0,
    zIndex: 2,
  },
  bladeUrgent: {
    backgroundColor: COLORS.daggerBladeUrgent,
    borderColor: COLORS.daggerEdgeUrgent,
  },
  bloodGroove: {
    position: 'absolute',
    top: TIP_H + 6,
    width: 1.5,
    height: BLADE_H - 10,
    backgroundColor: '#3a0f14',
    borderRadius: 1,
    zIndex: 3,
  },
  crossguard: {
    position: 'absolute',
    top: TIP_H + BLADE_H,
    width: CROSSGUARD_W,
    height: CROSSGUARD_H,
    backgroundColor: COLORS.daggerCrossguard,
    borderRadius: 1,
    borderWidth: 0.5,
    borderColor: COLORS.daggerCrossguardEdge,
    zIndex: 2,
  },
  crossguardUrgent: {
    backgroundColor: '#6a4840',
    borderColor: '#8a6858',
  },
  grip: {
    position: 'absolute',
    top: TIP_H + BLADE_H + CROSSGUARD_H + 1,
    width: GRIP_W,
    height: GRIP_H,
    backgroundColor: COLORS.daggerGrip,
    borderRadius: 1.5,
    zIndex: 2,
  },
  pommel: {
    position: 'absolute',
    top: HAND_LENGTH - POMMEL_SIZE,
    width: POMMEL_SIZE,
    height: POMMEL_SIZE,
    borderRadius: POMMEL_SIZE / 2,
    backgroundColor: COLORS.daggerPommel,
    borderWidth: 0.5,
    borderColor: COLORS.daggerPommelEdge,
    zIndex: 2,
  },
  // Center ornament
  centerOrnament: {
    position: 'absolute',
    left: CENTER - 8,
    top: CENTER - 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#1a0e10',
    borderWidth: 1.5,
    borderColor: '#5a2828',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 11,
  },
  centerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8a3030',
  },
  myTurnTimerContainer: {
    position: 'absolute',
    left: CENTER - 28,
    top: CENTER - 32,
    width: 56,
    alignItems: 'center',
    zIndex: 12,
  },
  myTurnTimerText: {
    color: COLORS.active,
    fontSize: 14,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    textShadowColor: `${COLORS.activeGlow}60`,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  timerContainer: {
    position: 'absolute',
    left: CENTER - 28,
    top: CENTER + 18,
    width: 56,
    alignItems: 'center',
    zIndex: 12,
  },
  timerText: {
    color: COLORS.bone,
    fontSize: 16,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    textShadowColor: `${COLORS.brass}40`,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  // Smoke layer
  smokeLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'visible',
    zIndex: 1,
  },
  // Player nodes
  node: {
    position: 'absolute',
    borderRadius: 16,
    backgroundColor: COLORS.midnightLight,
    borderWidth: 2,
    borderColor: COLORS.iron,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  deadNode: {
    opacity: 0.25,
  },
  deadWithVoteNode: {
    opacity: 0.6,
    borderColor: '#5aa0d0',
    borderWidth: 1.5,
  },
  nonVoterNode: {
    opacity: 0.3,
    borderColor: `${COLORS.iron}60`,
  },
  nomineeNode: {
    backgroundColor: COLORS.bloodDeep,
    borderColor: COLORS.bloodGlow,
    shadowColor: COLORS.bloodGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  activeNode: {
    backgroundColor: `${COLORS.activeDark}50`,
    borderColor: COLORS.active,
    borderWidth: 2.5,
    shadowColor: COLORS.activeGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 8,
  },
  myNode: {
    borderColor: COLORS.myGold,
    borderWidth: 2.5,
    shadowColor: COLORS.myGoldGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  guiltyNode: {
    borderColor: COLORS.guilty,
    backgroundColor: COLORS.guiltyBg,
    borderWidth: 2.5,
  },
  innocentNode: {
    borderColor: COLORS.innocent,
    backgroundColor: COLORS.innocentBg,
    borderWidth: 2.5,
  },
  preselectedGuiltyNode: {
    borderColor: `${COLORS.guilty}50`,
    backgroundColor: `${COLORS.guilty}15`,
  },
  preselectedInnocentNode: {
    borderColor: `${COLORS.innocent}50`,
    backgroundColor: `${COLORS.innocent}15`,
  },
  pastNode: {
    opacity: 0.35,
  },
  nodeText: {
    color: COLORS.boneFaded,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  nomineeText: {
    color: COLORS.bloodGlow,
  },
  activeText: {
    color: COLORS.activeGlow,
    fontWeight: '900',
  },
  myText: {
    color: COLORS.myGold,
  },
  // Vote indicator emoji
  voteEmoji: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    fontSize: 12,
  },
  preselectedVoteEmoji: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    fontSize: 10,
    opacity: 0.5,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 12,
    paddingHorizontal: 16,
  },
  legendText: {
    color: COLORS.boneFaded,
    fontSize: 11,
    letterSpacing: 0.3,
  },
});
