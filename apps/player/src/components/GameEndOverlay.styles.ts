import { colors, space, typography } from '@clocktower/ui';
import { Dimensions, StyleSheet } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// 오래된 양피지 두루마리 — 토큰 별칭
const PAPER = colors.parchment.letter;
const PAPER_EDGE = colors.parchment.letterEdge;
const PAPER_FOLD = colors.parchment.letterFold;
const INK_BODY = '#201810';
const INK_SOFT = '#4a3d25';

export const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingTop: SCREEN_HEIGHT * 0.08,
    paddingHorizontal: space.base,
    paddingBottom: space['3xl'],
    gap: space.base,
  },

  // ── 두루마리 ────────────────────────────────────────────────────────
  scroll: {
    backgroundColor: PAPER,
    width: '100%',
    maxWidth: 520,
    paddingHorizontal: space.lg,
    paddingVertical: space.lg,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.55,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    // 두루마리 몸체 — 위아래에 롤링 에지
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: PAPER_EDGE,
  },
  scrollEdgeTop: {
    position: 'absolute',
    top: -10,
    left: -8,
    right: -8,
    height: 20,
    backgroundColor: PAPER_FOLD,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PAPER_EDGE,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  scrollEdgeBottom: {
    position: 'absolute',
    bottom: -10,
    left: -8,
    right: -8,
    height: 20,
    backgroundColor: PAPER_FOLD,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PAPER_EDGE,
  },

  // ── 봉인 ────────────────────────────────────────────────────────────
  sealHolder: {
    marginTop: space.sm,
    marginBottom: space.sm,
  },

  // ── 헤드라인 ────────────────────────────────────────────────────────
  eyebrow: {
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    letterSpacing: typography.tracking.widest,
    textTransform: 'uppercase',
    marginBottom: space.xs,
  },
  verdict: {
    fontFamily: typography.family.display,
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: INK_BODY,
    textAlign: 'center',
    letterSpacing: typography.tracking.tight,
    lineHeight: typography.size.xl * typography.leading.tight,
  },
  subtitle: {
    fontFamily: typography.family.display,
    fontSize: typography.size.base,
    color: INK_SOFT,
    textAlign: 'center',
    marginTop: space.xs,
    lineHeight: typography.size.base * typography.leading.normal,
    fontStyle: 'italic',
  },
  ornament: {
    marginVertical: space.sm,
  },
  ornamentColor: {
    color: PAPER_EDGE,
  },
  reason: {
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    color: INK_SOFT,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: typography.size.sm * typography.leading.normal,
    paddingHorizontal: space.sm,
  },

  // ── 로스터 ──────────────────────────────────────────────────────────
  rosterEyebrow: {
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    letterSpacing: typography.tracking.widest,
    textTransform: 'uppercase',
    color: INK_SOFT,
    marginVertical: space.xs,
  },
  rosterList: {
    width: '100%',
    gap: space.xs,
    marginTop: space.sm,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.xs,
    borderBottomWidth: 1,
    borderBottomColor: PAPER_EDGE,
  },
  playerRowDead: {
    opacity: 0.55,
  },
  playerNameCol: {
    flex: 1,
    gap: 2,
  },
  playerName: {
    fontFamily: typography.family.display,
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: INK_BODY,
  },
  playerNameDead: {
    textDecorationLine: 'line-through',
    color: INK_SOFT,
  },
  playerTeam: {
    fontFamily: typography.family.body,
    fontSize: 10,
    fontWeight: typography.weight.medium,
    letterSpacing: typography.tracking.wide,
    textTransform: 'uppercase',
    color: INK_SOFT,
  },
  playerRole: {
    fontFamily: typography.family.display,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: INK_BODY,
  },

  dismissHint: {
    marginTop: space.lg,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    color: colors.parchment.mid,
    letterSpacing: typography.tracking.wide,
  },
  bottomSpacer: {
    height: space['2xl'],
  },
});
