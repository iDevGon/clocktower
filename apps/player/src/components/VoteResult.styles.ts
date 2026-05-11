import { colors } from '@clocktower/ui';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.elevated,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3a3a42',
    padding: 20,
    alignItems: 'center',
  },
  label: {
    color: colors.text.secondary,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 12,
  },
  verdict: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  verdictGuilty: {
    color: colors.phase.vote,
  },
  verdictInnocent: {
    color: '#6a9a6a',
  },
  count: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  threshold: {
    color: '#706e6a',
    fontSize: 12,
    marginTop: 4,
  },
  thresholdHighlight: {
    color: '#a0967a',
    fontWeight: '600',
  },
  sentenceDivider: {
    width: '60%',
    height: 1,
    backgroundColor: '#2a2a32',
    marginVertical: 12,
  },
  sentence: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 22,
  },
  sentenceGuilty: {
    color: colors.phase.vote,
    textShadowColor: '#c4707040',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  sentenceInnocent: {
    color: '#6a9a6a',
  },
  sentenceCleared: {
    color: colors.phase.day,
  },
});
