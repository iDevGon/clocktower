import { colors, Ornament, space, typography } from '@clocktower/ui';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { createGrimoireStyles } from '../styles/grimoire.styles';

interface GrimoireTopBarProps {
  day: number;
  phase: string;
  daySubPhase?: string;
  onMenuPress?: () => void;
  styles: ReturnType<typeof createGrimoireStyles>;
}

function getPhaseNarrative(phase: string, daySubPhase?: string) {
  if (phase === 'setup') return { main: '준비', sub: '' };
  if (phase === 'night') return { main: '밤', sub: '' };
  if (phase === 'vote') return { main: '투표', sub: '' };
  if (phase === 'ended') return { main: '종료', sub: '' };
  if (phase === 'day') {
    const subMap: Record<string, string> = {
      whisper: '밀담',
      discussion: '토론',
      nomination: '지목',
      defense: '변론',
    };
    return { main: '낮', sub: daySubPhase ? (subMap[daySubPhase] ?? '') : '' };
  }
  return { main: '', sub: '' };
}

export function GrimoireTopBar({
  day,
  phase,
  daySubPhase,
  onMenuPress,
  styles,
}: GrimoireTopBarProps) {
  const { main, sub } = getPhaseNarrative(phase, daySubPhase);

  return (
    <View style={[styles.topBar, localStyles.bar]}>
      {/* 좌: 챕터 헤드 (세리프 디스플레이) */}
      <View style={localStyles.leftBlock}>
        <Text style={localStyles.chapterMain}>
          제 {day}일차 · {main}
        </Text>
        {sub ? <Text style={localStyles.chapterSub}>— {sub}</Text> : null}
      </View>

      {/* 중: 금박 오너먼트 (star) */}
      <View style={localStyles.centerBlock} pointerEvents="none">
        <Ornament kind="star" />
      </View>

      {/* 우: 메뉴 */}
      <View style={localStyles.rightBlock}>
        {onMenuPress ? (
          <Pressable
            onPress={onMenuPress}
            style={localStyles.menuButton}
            accessibilityLabel="메뉴"
            accessibilityRole="button"
          >
            <Text style={localStyles.menuIcon}>☰</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  bar: {
    // 금박 hairline 하단 보더 — 기존 #2e2e34 보더 덮어쓰기
    borderBottomColor: colors.edge.gilt,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  leftBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: space.xs,
    flex: 1,
  },
  centerBlock: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  chapterMain: {
    fontFamily: typography.family.display,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.parchment.high,
    letterSpacing: typography.tracking.tight,
  },
  chapterSub: {
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    color: colors.parchment.mid,
    letterSpacing: typography.tracking.normal,
  },
  menuButton: {
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
  },
  menuIcon: {
    color: colors.parchment.mid,
    fontSize: 18,
    fontFamily: typography.family.body,
  },
});
