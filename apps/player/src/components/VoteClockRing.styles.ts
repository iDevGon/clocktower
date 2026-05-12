import { StyleSheet } from 'react-native';
import {
  PLAYER_VOTE_CLOCK_LAYER,
  PLAYER_VOTE_NODE_BADGE,
  PLAYER_VOTE_STATE_BADGE,
} from './VoteClockRing.presentation';

export const RING_SIZE = 240;
export const NODE_SIZE = 32;
export const CENTER = RING_SIZE / 2;
export const RADIUS = RING_SIZE / 2 - NODE_SIZE / 2 - 6;
export const HAND_LENGTH = RADIUS - 8;
export const DAGGER_W = 64;

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
  // Guilty = saturated red
  guilty: '#e05050',
  guiltyBg: '#e0505040',
  // My node = warm gold
  myGold: '#c8a040',
  myGoldGlow: '#c8a04060',
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
  clockFaceImage: {
    ...StyleSheet.absoluteFillObject,
    width: RING_SIZE,
    height: RING_SIZE,
    opacity: 0.34,
    zIndex: PLAYER_VOTE_CLOCK_LAYER.face,
  },
  clockFaceVeil: {
    ...StyleSheet.absoluteFillObject,
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    backgroundColor: 'rgba(4,5,8,0.38)',
    zIndex: PLAYER_VOTE_CLOCK_LAYER.face + 1,
  },
  daggerContainer: {
    position: 'absolute',
    left: CENTER - DAGGER_W / 2,
    top: CENTER - HAND_LENGTH,
    width: DAGGER_W,
    height: HAND_LENGTH,
    alignItems: 'center',
    transformOrigin: `${DAGGER_W / 2}px ${HAND_LENGTH}px`,
    zIndex: PLAYER_VOTE_CLOCK_LAYER.hand,
    elevation: PLAYER_VOTE_CLOCK_LAYER.hand,
  },
  daggerImage: {
    width: DAGGER_W,
    height: HAND_LENGTH,
  },
  daggerImageUrgent: {
    opacity: 0.92,
  },
  centerOrnament: {
    position: 'absolute',
    left: CENTER - 8,
    top: CENTER - 8,
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: '#1a0e10',
    borderWidth: 1.5,
    borderColor: '#5a2828',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: PLAYER_VOTE_CLOCK_LAYER.center,
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
    zIndex: PLAYER_VOTE_CLOCK_LAYER.timer,
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
    zIndex: PLAYER_VOTE_CLOCK_LAYER.timer,
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
    zIndex: PLAYER_VOTE_CLOCK_LAYER.smoke,
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
    zIndex: PLAYER_VOTE_CLOCK_LAYER.node,
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
  preselectedGuiltyNode: {
    borderColor: `${COLORS.guilty}50`,
    backgroundColor: `${COLORS.guilty}15`,
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
  voteIconBadge: {
    position: 'absolute',
    bottom: PLAYER_VOTE_NODE_BADGE.edgeOffset,
    right: PLAYER_VOTE_NODE_BADGE.edgeOffset,
  },
  preselectedVoteIconBadge: {
    position: 'absolute',
    bottom: PLAYER_VOTE_NODE_BADGE.edgeOffset,
    right: PLAYER_VOTE_NODE_BADGE.edgeOffset,
  },
  voteStateBadge: {
    width: PLAYER_VOTE_NODE_BADGE.size,
    height: PLAYER_VOTE_NODE_BADGE.size,
    padding: 1,
    borderRadius: PLAYER_VOTE_NODE_BADGE.borderRadius,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voteRaisedBadge: {
    backgroundColor: PLAYER_VOTE_STATE_BADGE.raised.backgroundColor,
    borderColor: PLAYER_VOTE_STATE_BADGE.raised.borderColor,
  },
  votePendingBadge: {
    backgroundColor: PLAYER_VOTE_STATE_BADGE.pending.backgroundColor,
    borderColor: PLAYER_VOTE_STATE_BADGE.pending.borderColor,
  },
  voteDownBadge: {
    backgroundColor: PLAYER_VOTE_STATE_BADGE.down.backgroundColor,
    borderColor: PLAYER_VOTE_STATE_BADGE.down.borderColor,
  },
  voteStateText: {
    color: PLAYER_VOTE_STATE_BADGE.down.color,
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 12,
  },
  voteRaisedText: {
    color: PLAYER_VOTE_STATE_BADGE.raised.color,
  },
  votePendingText: {
    color: PLAYER_VOTE_STATE_BADGE.pending.color,
  },
  voteStateImage: {
    width: PLAYER_VOTE_NODE_BADGE.iconSize,
    height: PLAYER_VOTE_NODE_BADGE.iconSize,
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
