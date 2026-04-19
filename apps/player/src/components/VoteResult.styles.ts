import { colors, space, typography } from '@clocktower/ui';
import { StyleSheet } from 'react-native';

// 오래된 양피지 — 어두운 앰버-탄 톤
const PAPER = '#c9b687';
const PAPER_EDGE = '#8a7540';
const INK_BODY = '#201810';
const INK_SOFT = '#4a3d25';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: PAPER,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: PAPER_EDGE,
    paddingHorizontal: space.lg,
    paddingVertical: space.base,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  eyebrow: {
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    letterSpacing: typography.tracking.widest,
    textTransform: 'uppercase',
    color: INK_SOFT,
    marginBottom: space['2xs'],
  },
  nomineeName: {
    fontFamily: typography.family.display,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: INK_SOFT,
    marginBottom: space.xs,
  },
  sealWrap: {
    marginVertical: space['2xs'],
  },
  verdict: {
    fontFamily: typography.family.display,
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    letterSpacing: typography.tracking.wide,
    marginTop: space.xs,
  },
  verdictGuilty: {
    color: colors.crimson.deep,
  },
  verdictInnocent: {
    color: colors.verdure.deep,
  },
  rule: {
    marginVertical: space.xs,
  },
  ruleColor: {
    color: PAPER_EDGE,
  },
  count: {
    fontFamily: typography.family.mono,
    fontSize: typography.size.sm,
    color: INK_BODY,
    marginTop: space['2xs'],
  },
  threshold: {
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    color: INK_SOFT,
    textAlign: 'center',
    marginTop: space['2xs'],
  },
  thresholdHighlight: {
    fontFamily: typography.family.body,
    color: INK_BODY,
    fontWeight: typography.weight.semibold,
  },
  sentenceDivider: {
    width: '60%',
    height: 1,
    backgroundColor: PAPER_EDGE,
    opacity: 0.5,
    marginVertical: space.sm,
  },
  sentence: {
    fontFamily: typography.family.display,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    textAlign: 'center',
    lineHeight: typography.size.md * typography.leading.normal,
  },
  sentenceGuilty: {
    color: colors.crimson.deep,
  },
  sentenceInnocent: {
    color: colors.verdure.deep,
  },
  sentenceCleared: {
    color: colors.ember.deep,
  },
});
