import { colors, space, typography } from '@clocktower/ui';
import { StyleSheet } from 'react-native';

const PAPER = '#f3ecd8';
const PAPER_EDGE = '#bba87e';
const INK_BODY = '#2a231a';
const INK_SOFT = '#5a4c38';

export const styles = StyleSheet.create({
  root: {
    zIndex: 95,
  },
  candleAura: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
    gap: space['2xl'],
  },
  stage: {
    width: 320,
    minHeight: 360,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  stageLayer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inkLayer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },

  // ── 봉투 ────────────────────────────────────────────────────────────
  envelopeSeal: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── 편지 ────────────────────────────────────────────────────────────
  letterPaper: {
    backgroundColor: PAPER,
    borderColor: PAPER_EDGE,
    borderWidth: 1,
    borderRadius: 2,
    paddingVertical: space.lg,
    paddingHorizontal: space.lg,
    width: 320,
    alignItems: 'center',
    // 미묘한 엘레베이션 — 종이가 어둠 속에 떠 있는 느낌
    shadowColor: '#000',
    shadowOpacity: 0.55,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  letterHeader: {
    alignItems: 'center',
    gap: space.xs,
    marginBottom: space.sm,
  },
  letterEyebrow: {
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    letterSpacing: typography.tracking.widest,
  },
  letterRoleName: {
    fontFamily: typography.family.display,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.xxl,
    color: INK_BODY,
    textAlign: 'center',
    lineHeight: typography.size.xxl * typography.leading.tight,
    letterSpacing: typography.tracking.tight,
  },
  letterOrnament: {
    marginVertical: space.md,
  },
  letterOrnamentMid: {
    marginVertical: space.md,
  },
  letterAbility: {
    fontFamily: typography.family.body,
    fontSize: typography.size.base,
    color: INK_SOFT,
    textAlign: 'center',
    lineHeight: typography.size.base * typography.leading.loose,
  },
  letterAsideLabel: {
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    letterSpacing: typography.tracking.wide,
    textTransform: 'uppercase',
    marginBottom: space.xs,
  },
  letterAsideBody: {
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    color: INK_BODY,
    textAlign: 'center',
    marginBottom: space['2xs'],
  },

  // ── 부제 ────────────────────────────────────────────────────────────
  subtitleBlock: {
    alignItems: 'center',
    gap: space.md,
  },
  subtitleText: {
    fontFamily: typography.family.display,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.parchment.mid,
    letterSpacing: typography.tracking.wide,
    textAlign: 'center',
  },
  dismissHint: {
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    color: colors.parchment.low,
    letterSpacing: typography.tracking.wide,
    marginTop: space.sm,
  },
});
