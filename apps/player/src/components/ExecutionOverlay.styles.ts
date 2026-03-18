import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  axeText: {
    fontSize: 56,
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    letterSpacing: 10,
    color: '#8b3a00',
    fontWeight: '300',
    textTransform: 'uppercase',
    marginBottom: 0,
  },
  nameText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#e8a060',
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: 'rgba(232, 100, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  reasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 58, 0, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(139, 58, 0, 0.35)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 20,
  },
  reasonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  reasonText: {
    fontSize: 14,
    color: '#c07840',
    fontWeight: '500',
    textAlign: 'center',
    flexShrink: 1,
  },
  deathText: {
    fontSize: 13,
    color: '#5a3015',
    fontWeight: '300',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  dismissHint: {
    marginTop: 28,
    fontSize: 12,
    color: '#5a3015',
    letterSpacing: 1,
  },
});
