import { colors } from '@clocktower/ui';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    alignItems: 'center',
    gap: 16,
  },
  title: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  ring: {
    position: 'relative',
  },
  token: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: colors.surface.elevated,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tokenMe: {
    backgroundColor: '#1e1c14',
    shadowColor: colors.phase.day,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  name: {
    color: '#b0aea8',
    fontWeight: '600',
    textAlign: 'center',
  },
  nameMe: {
    color: colors.text.primary,
  },
  deadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  dead: {
    color: colors.phase.vote,
    fontWeight: '700',
    marginTop: 1,
  },
  travellerTag: {
    color: '#a090c0',
    fontWeight: '600',
    marginTop: 1,
  },
  hint: {
    color: colors.text.tertiary,
    fontSize: 12,
  },
});
