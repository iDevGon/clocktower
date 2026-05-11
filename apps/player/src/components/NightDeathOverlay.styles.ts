import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  moonText: {
    fontSize: 56,
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    letterSpacing: 8,
    color: '#6a7aaa',
    fontWeight: '300',
    textTransform: 'uppercase',
  },
  noDeathText: {
    fontSize: 18,
    color: '#8a9ac0',
    fontWeight: '500',
    textAlign: 'center',
  },
  deathRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 8,
    backgroundColor: 'rgba(80,30,30,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(140,50,50,0.25)',
    borderRadius: 5,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minWidth: 200,
  },
  skullSmall: {
    fontSize: 24,
  },
  deathInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  deathName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#cc4040',
    textShadowColor: 'rgba(200, 50, 50, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  deathSuffix: {
    fontSize: 14,
    color: '#8a4040',
    fontWeight: '400',
  },
  dismissHint: {
    marginTop: 16,
    fontSize: 12,
    color: '#3a4a6a',
    letterSpacing: 1,
  },
});
