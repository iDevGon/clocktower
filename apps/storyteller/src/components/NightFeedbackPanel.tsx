import type {
  NightAction,
  NightFeedbackPayload,
  Player,
} from '@clocktower/shared';
import { getRoleById, NIGHT_FEEDBACK } from '@clocktower/shared';
import { useMemo, useState } from 'react';
import { Platform, ScrollView, Text, View } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import { AbilityText } from '@clocktower/shared';
import { AnimatedBorderCard } from './AnimatedBorderCard';
import { FeedbackComposer } from './FeedbackComposer';
import { createNightActionLogStyles } from './NightActionLog.styles';
import {
  getAbilityTextStyle,
  getContentPadding,
  panelStyles,
  webScrollbarStyle,
} from './NightFeedbackPanel.styles';
import { TEAM_COLORS } from './NightOrderPanel.styles';

/** Map team → gradient colors for the animated border card */
const TEAM_CARD_COLORS: Record<
  string,
  { color: string; bgStart: string; bgMid: string; bgEnd: string }
> = {
  townsfolk: {
    color: '#5a8ec8',
    bgStart: '#161e34',
    bgMid: '#121828',
    bgEnd: '#0e1220',
  },
  outsider: {
    color: '#4aa890',
    bgStart: '#142222',
    bgMid: '#0e1c1a',
    bgEnd: '#0a1414',
  },
  minion: {
    color: '#c07040',
    bgStart: '#221812',
    bgMid: '#1a120e',
    bgEnd: '#140e0a',
  },
  demon: {
    color: '#c03848',
    bgStart: '#221014',
    bgMid: '#1a0c10',
    bgEnd: '#14080c',
  },
};

const FALLBACK_CARD_COLORS = TEAM_CARD_COLORS.townsfolk;

interface EmpathHint {
  neighbors: { id: string; name: string; isEvil: boolean }[];
  evilCount: number;
}

interface ChefHint {
  evilPairCount: number;
  evilPairNames: string[][];
}

interface NightFeedbackPanelProps {
  activeRoleId: string | null;
  players: Player[];
  nightActions?: NightAction[];
  empathHint?: EmpathHint;
  chefHint?: ChefHint;
  onSendFeedback: (playerId: string, feedback: NightFeedbackPayload) => void;
}

export function NightFeedbackPanel({
  activeRoleId,
  players,
  nightActions,
  empathHint,
  chefHint,
  onSendFeedback,
}: NightFeedbackPanelProps) {
  const { fontSize } = useResponsive();
  const scale = fontSize.md / 12;
  const styles = useMemo(() => createNightActionLogStyles(scale), [scale]);

  const [sent, setSent] = useState<string | null>(null);

  if (!activeRoleId) return null;

  const feedbackDef = NIGHT_FEEDBACK[activeRoleId];
  if (
    !feedbackDef ||
    feedbackDef.type === 'none' ||
    feedbackDef.type === 'grimoire'
  )
    return null;

  const targetPlayer = players.find(
    (p) =>
      p.role?.id === activeRoleId ||
      (p.role?.id === 'drunk' && p.drunkAs === activeRoleId),
  );
  if (!targetPlayer) return null;

  const isDrunk = targetPlayer.role?.id === 'drunk';
  const role = getRoleById(activeRoleId);
  const team = role?.team ?? 'townsfolk';
  const cardColors = TEAM_CARD_COLORS[team] ?? FALLBACK_CARD_COLORS;
  const teamColor =
    TEAM_COLORS[team as keyof typeof TEAM_COLORS] ?? TEAM_COLORS.townsfolk;

  if (sent === activeRoleId) {
    return (
      <View style={styles.feedbackPanel}>
        <Text style={styles.feedbackPanelSent}>피드백 전송됨</Text>
      </View>
    );
  }

  const handleSend = (fb: NightFeedbackPayload) => {
    // 점쟁이 yes_no 피드백에 지목 대상 이름 포함
    if (activeRoleId === 'fortune_teller' && fb.type === 'yes_no') {
      const ftAction = nightActions?.find(
        (a) => a.roleId === 'fortune_teller',
      );
      if (ftAction) {
        const targetNames = ftAction.targets
          .map((id) => players.find((p) => p.id === id)?.name ?? id)
          .filter(Boolean);
        if (targetNames.length > 0) {
          fb = { ...fb, targetNames };
        }
      }
    }
    onSendFeedback(targetPlayer.id, fb);
    setSent(activeRoleId);
  };

  return (
    <ScrollView
      style={[
        panelStyles.scrollViewFlex,
        Platform.OS === 'web' && webScrollbarStyle,
      ]}
    >
      <AnimatedBorderCard
        color={cardColors.color}
        bgStart={cardColors.bgStart}
        bgMid={cardColors.bgMid}
        bgEnd={cardColors.bgEnd}
        borderRadius={0}
        borderWidth={1.5}
      >
        <View style={getContentPadding(scale)}>
          <Text style={[styles.feedbackPanelTitle, { color: teamColor.text }]}>
            {role?.name ?? activeRoleId} → {targetPlayer.name}
          </Text>

          {role?.ability && (
            <AbilityText
              text={role.ability}
              style={getAbilityTextStyle(scale)}
            />
          )}

          {isDrunk && (
            <View style={styles.drunkBanner}>
              <Text style={styles.drunkBannerText}>
                ⚠️ 주정뱅이 - 가짜 정보를 제공하세요
              </Text>
            </View>
          )}

          {activeRoleId === 'fortune_teller' &&
            (() => {
              const ftAction = nightActions?.find(
                (a) => a.roleId === 'fortune_teller',
              );
              if (!ftAction || ftAction.fortuneTellerResult === undefined)
                return null;
              const targetNames = ftAction.targets
                .map((id) => players.find((p) => p.id === id)?.name ?? id)
                .join(', ');
              const isPoisoned = targetPlayer.statuses.includes('poisoned');
              return (
                <View
                  style={[
                    styles.drunkBanner,
                    {
                      backgroundColor: ftAction.fortuneTellerResult
                        ? 'rgba(106,176,76,0.15)'
                        : 'rgba(184,92,92,0.15)',
                      borderColor: ftAction.fortuneTellerResult
                        ? '#6ab04c'
                        : '#b85c5c',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.drunkBannerText,
                      {
                        color: ftAction.fortuneTellerResult
                          ? '#6ab04c'
                          : '#b85c5c',
                      },
                    ]}
                  >
                    {targetNames} →{' '}
                    {ftAction.fortuneTellerResult
                      ? '예 (악마/저주 포함)'
                      : '아니오'}
                    {isPoisoned ? ' (중독 반전 적용됨)' : ''}
                  </Text>
                </View>
              );
            })()}

          {activeRoleId === 'empath' &&
            empathHint &&
            empathHint.neighbors.length > 0 && (
              <View
                style={[
                  styles.drunkBanner,
                  {
                    backgroundColor: 'rgba(46,204,113,0.15)',
                    borderColor: '#2ecc71',
                  },
                ]}
              >
                <Text style={[styles.drunkBannerText, { color: '#2ecc71' }]}>
                  이웃: {empathHint.neighbors.map((n) => n.name).join(', ')} →
                  악한 {empathHint.evilCount}명
                  {isDrunk ? ' (주정뱅이 - 가짜 정보 제공)' : ''}
                </Text>
              </View>
            )}

          {activeRoleId === 'chef' && chefHint && (
            <View
              style={[
                styles.drunkBanner,
                {
                  backgroundColor: 'rgba(230,126,34,0.15)',
                  borderColor: '#e67e22',
                },
              ]}
            >
              <Text style={[styles.drunkBannerText, { color: '#e67e22' }]}>
                인접 악한 쌍: {chefHint.evilPairCount}개
                {chefHint.evilPairNames.length > 0
                  ? ` (${chefHint.evilPairNames.map((pair) => pair.join('-')).join(', ')})`
                  : ''}
                {isDrunk ? ' (주정뱅이 - 가짜 정보 제공)' : ''}
              </Text>
            </View>
          )}

          <FeedbackComposer
            feedbackDef={feedbackDef}
            players={players.filter((p) => p.id !== targetPlayer.id)}
            isDrunkUser={isDrunk}
            suggestedNumber={
              isDrunk
                ? undefined
                : activeRoleId === 'empath' && empathHint
                  ? empathHint.evilCount
                  : activeRoleId === 'chef' && chefHint
                    ? chefHint.evilPairCount
                    : undefined
            }
            onSend={handleSend}
          />
        </View>
      </AnimatedBorderCard>
    </ScrollView>
  );
}
