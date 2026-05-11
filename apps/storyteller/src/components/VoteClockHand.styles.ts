import { StyleSheet } from 'react-native';
import { VOTE_CLOCK_LAYER } from './votePresentation';

export const COLORS = {
  bloodGlow: '#c43c3c',
  smoke: '#c43c3c',
};

export const styles = StyleSheet.create({
  pointerEventsNone: {
    pointerEvents: 'none',
    overflow: 'visible',
    zIndex: VOTE_CLOCK_LAYER.hand,
    elevation: VOTE_CLOCK_LAYER.hand,
  },
  daggerContainer: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: VOTE_CLOCK_LAYER.hand,
    elevation: VOTE_CLOCK_LAYER.hand,
    overflow: 'visible',
  },
  centerHub: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 5,
    backgroundColor: '#1a0e10',
    borderWidth: 2,
    borderColor: '#5a2828',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: VOTE_CLOCK_LAYER.centerHub,
    shadowColor: COLORS.bloodGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  centerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8a3030',
  },
});
