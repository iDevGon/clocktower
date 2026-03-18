import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconText: {
    fontSize: 56,
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    letterSpacing: 8,
    color: '#50b0b0',
    fontWeight: '300',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#60c8c8',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(80, 180, 180, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#50a8a8',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 12,
  },
  abilityBadge: {
    backgroundColor: 'rgba(64, 160, 160, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(64, 160, 160, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  abilityText: {
    fontSize: 14,
    color: '#70c0c0',
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 22,
  },
  dismissHint: {
    marginTop: 8,
    fontSize: 12,
    color: '#2a5a5a',
    letterSpacing: 1,
  },
});
