import { StyleSheet } from 'react-native';

export const COLORS = {
  brass: '#8b2020',
  brassLight: '#c44040',
  brassDark: '#6a1818',
  bloodGlow: '#c43c3c',
  iron: '#4a4a52',
  ironDark: '#2a2a30',
  active: '#c43c3c',
  // Dagger
  daggerBlade: '#6a2028',
  daggerEdge: '#a04040',
  daggerCrossguard: '#5a4035',
  daggerCrossguardEdge: '#7a5a48',
  daggerGrip: '#2a1518',
  daggerPommel: '#4a2828',
  daggerPommelEdge: '#6a3838',
  smoke: '#c43c3c',
};

export const styles = StyleSheet.create({
  pointerEventsNone: {
    pointerEvents: 'none',
    overflow: 'visible',
  },
  daggerContainer: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 50,
    overflow: 'visible',
  },
  centerHub: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1a0e10',
    borderWidth: 2,
    borderColor: '#5a2828',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 51,
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
