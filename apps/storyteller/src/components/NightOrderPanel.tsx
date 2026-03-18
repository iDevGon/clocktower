import {
  FIRST_NIGHT_ORDER,
  getRoleById,
  OTHER_NIGHT_ORDER,
} from '@clocktower/shared';
import { AbilityText } from '@clocktower/ui';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import {
  createNightOrderPanelStyles,
  TEAM_COLORS,
} from './NightOrderPanel.styles';

const TEAM_LABELS: Record<string, string> = {
  townsfolk: '마을주민',
  outsider: '외지인',
  minion: '하수인',
  demon: '악마',
};

const EMPTY_STRING_ARRAY: string[] = [];

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface NightOrderPanelProps {
  day: number;
  activeRoleIds: string[];
  skippedRoleIds?: string[];
  /** 게임에 존재하지만 현재 능력을 사용할 수 없는 역할 (예: 살아있는 까마귀지기) */
  dormantRoleIds?: string[];
  activeNightRoleId?: string | null;
  onActivateRole: (roleId: string | null) => void;
  onNightComplete?: () => void;
}

export function NightOrderPanel({
  day,
  activeRoleIds,
  skippedRoleIds = EMPTY_STRING_ARRAY,
  dormantRoleIds = EMPTY_STRING_ARRAY,
  activeNightRoleId,
  onActivateRole,
  onNightComplete,
}: NightOrderPanelProps) {
  const { device, fontSize } = useResponsive();
  const scale = fontSize.md / 12;
  const styles = useMemo(
    () => createNightOrderPanelStyles(scale, device),
    [scale, device],
  );

  const order = day <= 1 ? FIRST_NIGHT_ORDER : OTHER_NIGHT_ORDER;

  const [activeIndex, setActiveIndex] = useState<number | null>(() => {
    if (activeNightRoleId) {
      const idx = order.indexOf(activeNightRoleId);
      return idx >= 0 ? idx : null;
    }
    return null;
  });
  // Sync activeIndex when external activeNightRoleId changes
  useEffect(() => {
    if (!activeNightRoleId) {
      setActiveIndex(null);
      return;
    }
    const idx = order.indexOf(activeNightRoleId);
    setActiveIndex(idx >= 0 ? idx : null);
  }, [activeNightRoleId, order]);

  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const chipWidths = useRef<number[]>([]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setElapsed(0);

    if (activeIndex !== null) {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeIndex]);

  // Auto-scroll chip list to active role
  useEffect(() => {
    if (activeIndex !== null && scrollRef.current) {
      let offset = 0;
      const gap = scale * (device === 'desktop' ? 6 : 5);
      for (let i = 0; i < activeIndex; i++) {
        offset += (chipWidths.current[i] ?? 60) + gap;
      }
      const chipW = chipWidths.current[activeIndex] ?? 60;
      // Center the chip
      const padding =
        scale * (device === 'desktop' ? 24 : device === 'tablet' ? 20 : 12);
      scrollRef.current.scrollTo({
        x: Math.max(0, offset - padding + chipW / 2 - 100),
        animated: true,
      });
    }
  }, [activeIndex, device, scale]);

  const handlePress = (index: number) => {
    if (activeIndex === index) {
      setActiveIndex(null);
      onActivateRole(null);
      return;
    }
    setActiveIndex(index);
    onActivateRole(order[index]);
  };

  const handlePrev = () => {
    if (activeIndex === null || activeIndex <= 0) return;
    const prevIndex = activeIndex - 1;
    setActiveIndex(prevIndex);
    onActivateRole(order[prevIndex]);
  };

  const isLastRole = activeIndex !== null && activeIndex >= order.length - 1;

  const handleNext = () => {
    const nextIndex = activeIndex === null ? 0 : activeIndex + 1;
    if (nextIndex < order.length) {
      setActiveIndex(nextIndex);
      onActivateRole(order[nextIndex]);
      if (nextIndex >= order.length - 1) {
        onNightComplete?.();
      }
    }
  };

  const activeRole =
    activeIndex !== null ? getRoleById(order[activeIndex]) : null;
  const activeTeam = activeRole?.team ?? 'townsfolk';
  const teamColor =
    TEAM_COLORS[activeTeam as keyof typeof TEAM_COLORS] ??
    TEAM_COLORS.townsfolk;
  const isInGame =
    activeIndex !== null ? activeRoleIds.includes(order[activeIndex]) : false;
  const isSkipped =
    activeIndex !== null ? skippedRoleIds.includes(order[activeIndex]) : false;
  const isDormant =
    activeIndex !== null ? dormantRoleIds.includes(order[activeIndex]) : false;
  const isActiveAbsent = !isInGame || isSkipped;

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressBar}>
        {order.map((roleId, index) => {
          const role = getRoleById(roleId);
          const team = role?.team ?? 'townsfolk';
          const tc =
            TEAM_COLORS[team as keyof typeof TEAM_COLORS] ??
            TEAM_COLORS.townsfolk;
          const isPast = activeIndex !== null && index < activeIndex;
          const isCurrent = activeIndex === index;

          let bgColor: string;
          if (isCurrent) {
            bgColor = tc.dot;
          } else if (isPast) {
            bgColor = `${tc.dot}40`;
          } else {
            bgColor = '#1e1e28';
          }

          return (
            <View
              key={roleId}
              style={[styles.progressSegment, { backgroundColor: bgColor }]}
            />
          );
        })}
      </View>

      {/* Stepper: prev | active card | next */}
      <View style={styles.stepper}>
        <Pressable
          onPress={handlePrev}
          style={[
            styles.navButton,
            (activeIndex === null || activeIndex <= 0) &&
              styles.navButtonDisabled,
          ]}
          disabled={activeIndex === null || activeIndex <= 0}
          accessibilityLabel="이전 역할"
          accessibilityRole="button"
        >
          <Text style={styles.navButtonText}>{'‹'}</Text>
        </Pressable>

        <View
          style={[
            styles.activeCard,
            activeIndex !== null
              ? {
                  backgroundColor: teamColor.bg,
                  borderColor: teamColor.border,
                }
              : styles.activeCardIdle,
          ]}
        >
          {activeRole ? (
            <>
              <View style={styles.activeCardHeader}>
                <View style={styles.activeCardLeft}>
                  <View
                    style={[styles.teamDot, { backgroundColor: teamColor.dot }]}
                  />
                  <View>
                    <Text
                      style={[styles.activeRoleName, { color: teamColor.text }]}
                    >
                      {activeRole.name}
                    </Text>
                    <Text
                      style={[styles.activeRoleTeam, { color: teamColor.text }]}
                    >
                      {TEAM_LABELS[activeTeam] ?? activeTeam}
                    </Text>
                  </View>
                </View>
                <View style={styles.timerBadge}>
                  <View
                    style={[
                      styles.timerDot,
                      { backgroundColor: teamColor.dot },
                    ]}
                  />
                  <Text style={styles.timerText}>{formatTimer(elapsed)}</Text>
                </View>
              </View>
              {activeRole.ability && (
                <AbilityText
                  text={activeRole.ability}
                  style={styles.activeAbility}
                />
              )}
              {isActiveAbsent ? (
                <View
                  style={[styles.inGameBadge, { backgroundColor: '#ffffff08' }]}
                >
                  <Text style={[styles.inGameBadgeText, { color: '#c0a060' }]}>
                    이 직업은 게임에 없지만, 플레이어들은 알 수 없습니다.{'\n'}
                    존재하는 것처럼 시간을 두고 진행하세요.
                  </Text>
                </View>
              ) : isDormant ? (
                <View
                  style={[styles.inGameBadge, { backgroundColor: '#ffffff08' }]}
                >
                  <Text style={[styles.inGameBadgeText, { color: '#c0a060' }]}>
                    현재 사용할 능력이 없지만, 플레이어들은 알 수 없습니다.
                    {'\n'}
                    존재하는 것처럼 시간을 두고 진행하세요.
                  </Text>
                </View>
              ) : (
                <View
                  style={[
                    styles.inGameBadge,
                    { backgroundColor: `${teamColor.dot}18` },
                  ]}
                >
                  <Text
                    style={[styles.inGameBadgeText, { color: teamColor.text }]}
                  >
                    게임에 존재
                  </Text>
                </View>
              )}
            </>
          ) : (
            <Text style={styles.idleText}>다음을 눌러 밤을 시작하세요</Text>
          )}
        </View>

        {!isLastRole ? (
          <Pressable
            onPress={handleNext}
            style={styles.navButton}
            accessibilityLabel="다음 역할"
            accessibilityRole="button"
          >
            <Text style={styles.navButtonText}>
              {activeIndex === null ? '▶' : '›'}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {/* Step counter */}
      {activeIndex !== null && (
        <Text style={styles.stepCounter}>
          {activeIndex + 1} / {order.length}
        </Text>
      )}

      {/* Role chip list */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.roleList}
      >
        {order.map((roleId, index) => {
          const role = getRoleById(roleId);
          const team = role?.team ?? 'townsfolk';
          const tc =
            TEAM_COLORS[team as keyof typeof TEAM_COLORS] ??
            TEAM_COLORS.townsfolk;
          const isActive = activeIndex === index;
          const isPast = activeIndex !== null && index < activeIndex;
          const isChipInGame = activeRoleIds.includes(roleId);
          const isChipSkipped = skippedRoleIds.includes(roleId);
          const absent = !isChipInGame || isChipSkipped;

          return (
            <Pressable
              key={roleId}
              onPress={() => handlePress(index)}
              onLayout={(e) => {
                chipWidths.current[index] = e.nativeEvent.layout.width;
              }}
              accessibilityLabel={`${role?.name ?? roleId} 역할 선택`}
              accessibilityRole="button"
              style={[
                styles.roleChip,
                isActive && [
                  styles.roleChipActive,
                  { borderColor: tc.border, backgroundColor: tc.bg },
                ],
                isPast && styles.roleChipPast,
                absent && !isActive && styles.roleChipAbsent,
              ]}
            >
              <Text
                style={[
                  styles.roleChipName,
                  isActive && [styles.roleChipNameActive, { color: tc.text }],
                  isPast && styles.roleChipNamePast,
                ]}
              >
                {role?.name ?? roleId}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
