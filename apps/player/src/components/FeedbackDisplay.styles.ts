import { colors, space, typography } from '@clocktower/ui';
import { StyleSheet } from 'react-native';

const PAPER = '#f3ecd8';
const PAPER_EDGE = '#bba87e';
const INK_BODY = '#2a231a';
const INK_SOFT = '#5a4c38';

/** Inline = NightActionPrompt 안에서 사용하는 풀사이즈 양피지 */
export const inlineStyles = StyleSheet.create({
  paper: {
    backgroundColor: PAPER,
    borderColor: PAPER_EDGE,
    borderWidth: 1,
    borderRadius: 3,
    paddingHorizontal: space.lg,
    paddingVertical: space.base,
    alignItems: 'center',
    width: '100%',
    gap: space.xs,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  eyebrow: {
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    letterSpacing: typography.tracking.widest,
    color: INK_SOFT,
    textTransform: 'uppercase',
    marginBottom: space['2xs'],
  },
  number: {
    fontFamily: typography.family.display,
    fontSize: typography.size.xxxl,
    fontWeight: typography.weight.bold,
    color: INK_BODY,
    lineHeight: typography.size.xxxl * 1.05,
  },
  verdict: {
    fontFamily: typography.family.display,
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    letterSpacing: typography.tracking.tight,
  },
  roleName: {
    fontFamily: typography.family.display,
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: INK_BODY,
    textAlign: 'center',
  },
  quiet: {
    fontFamily: typography.family.display,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: INK_SOFT,
    textAlign: 'center',
    paddingVertical: space.sm,
  },
});

/** Compact = 히스토리 모달에서 쓰는 작은 버전 */
export const compactStyles = StyleSheet.create({
  paper: {
    backgroundColor: PAPER,
    borderColor: PAPER_EDGE,
    borderWidth: 1,
    borderRadius: 3,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    alignItems: 'center',
    gap: space['2xs'],
  },
  eyebrow: {
    fontFamily: typography.family.body,
    fontSize: 10,
    fontWeight: typography.weight.semibold,
    letterSpacing: typography.tracking.wide,
    color: INK_SOFT,
    textTransform: 'uppercase',
    marginBottom: space['2xs'],
  },
  number: {
    fontFamily: typography.family.display,
    fontSize: 36,
    fontWeight: typography.weight.bold,
    color: INK_BODY,
  },
  verdict: {
    fontFamily: typography.family.display,
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
  },
  roleName: {
    fontFamily: typography.family.display,
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: INK_BODY,
    textAlign: 'center',
  },
  quiet: {
    fontFamily: typography.family.display,
    fontSize: typography.size.sm,
    color: INK_SOFT,
    textAlign: 'center',
  },
});

export const sharedStyles = StyleSheet.create({
  paperMuted: {
    backgroundColor: '#ebe3c8',
  },
  rule: {
    marginTop: space['2xs'],
  },
  papyrusEdge: {
    color: PAPER_EDGE,
  },
  stampWrap: {
    marginVertical: space.xs,
  },
  targetNames: {
    fontFamily: typography.family.display,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: INK_BODY,
    textAlign: 'center',
  },
  bodyText: {
    fontFamily: typography.family.body,
    fontSize: typography.size.base,
    color: INK_BODY,
    textAlign: 'center',
    lineHeight: typography.size.base * typography.leading.normal,
  },
  bodyHighlight: {
    fontFamily: typography.family.display,
    fontWeight: typography.weight.bold,
    color: INK_BODY,
  },

  grimoireList: {
    width: '100%',
    gap: space.xs,
    marginTop: space.xs,
  },
  grimoireRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
    borderBottomWidth: 1,
    borderBottomColor: PAPER_EDGE,
  },
  grimoireRowDead: {
    opacity: 0.55,
  },
  grimoireNameCol: {
    flex: 1,
    gap: 2,
  },
  grimoireName: {
    fontFamily: typography.family.display,
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: INK_BODY,
  },
  grimoireNameDead: {
    textDecorationLine: 'line-through',
    color: INK_SOFT,
  },
  grimoireStatusRow: {
    flexDirection: 'row',
    gap: space['2xs'],
    marginTop: 2,
  },
  grimoireStatus: {
    fontFamily: typography.family.body,
    fontSize: 10,
    fontWeight: typography.weight.semibold,
    color: colors.ember.deep,
  },
  grimoireRole: {
    fontFamily: typography.family.display,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
  },
});
