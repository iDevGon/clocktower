import type { Nomination, Player } from '@clocktower/shared';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { IS_DEV } from '../constants';
import { useResponsive } from '../hooks/useResponsive';
import { useGameStore } from '../stores/gameStore';
import { createVotePanelStyles } from './VotePanel.styles';

interface VoteResultData {
  nomineeId: string;
  nomineeName: string;
  guilty: boolean;
  votes: Record<string, boolean>;
  executionCandidate: {
    playerId: string;
    playerName: string;
    guiltyVotes: number;
  } | null;
  executionStatus?: string;
  executionMessage?: string;
}

interface VotePanelProps {
  nomination: Nomination;
  players: Player[];
  onCloseVote: () => void;
  onCastVote?: (playerId: string, guilty: boolean) => void;
  onProceedToVote?: () => void;
  voteResult?: VoteResultData | null;
  onDismissResult?: () => void;
}

export function VotePanel({
  nomination,
  players,
  onCloseVote,
  onCastVote,
  onProceedToVote,
  voteResult,
  onDismissResult,
}: VotePanelProps) {
  const { fontSize } = useResponsive();
  const scale = fontSize.md / 12;
  const styles = useMemo(() => createVotePanelStyles(scale), [scale]);

  const gameState = useGameStore((s) => s.gameState);
  const isDefensePhase = gameState?.daySubPhase === 'defense';
  const voteCountdown = useGameStore((s) => s.voteCountdown);
  const voteClock = useGameStore((s) => s.voteClock);
  const votePreselections = useGameStore((s) => s.votePreselections);
  const voteConfirmed = useGameStore((s) => s.voteConfirmed);

  const [, forceUpdate] = useState(0);

  // Re-render periodically to update timer and countdown
  useEffect(() => {
    if (!voteClock && !voteCountdown) return;
    const interval = setInterval(() => forceUpdate((n) => n + 1), 1000);
    return () => clearInterval(interval);
  }, [voteClock, voteCountdown]);

  // 카운트다운 계산
  const countdownRemaining = useMemo(() => {
    if (!voteCountdown) return 0;
    const elapsed = Date.now() - voteCountdown.startedAt;
    return Math.max(0, Math.ceil((voteCountdown.durationMs - elapsed) / 1000));
  }, [voteCountdown]);

  const isCountingDown = voteCountdown !== null && countdownRemaining > 0;

  const guiltyCount =
    Object.keys(nomination.votes).length +
    Object.values(voteConfirmed).filter(Boolean).length;

  const nominatorName =
    players.find((p) => p.id === nomination.nominatorId)?.name ?? '?';
  const nomineeName =
    players.find((p) => p.id === nomination.nomineeId)?.name ?? '?';

  // Timer display
  const remainingMs = voteClock
    ? Math.max(0, voteClock.durationMs - (Date.now() - voteClock.startedAt))
    : null;
  const remainingSec =
    remainingMs != null ? Math.ceil(remainingMs / 1000) : null;
  const isUrgent =
    voteClock && remainingMs != null
      ? remainingMs < voteClock.durationMs * 0.15
      : false;

  return (
    <View style={styles.votePanel}>
      <View style={styles.votePanelHeader}>
        <Text style={styles.votePanelTitle}>투표 진행 중</Text>
        <Text style={styles.votePanelInfo}>
          {nominatorName} → {nomineeName}
        </Text>
      </View>
      {isDefensePhase ? (
        <View style={styles.countdownRow}>
          <Text style={styles.countdownText}>
            변론 중 — {nomineeName}의 변론을 들어보세요
          </Text>
        </View>
      ) : isCountingDown ? (
        <View style={styles.countdownRow}>
          <Text style={styles.countdownText}>
            잠시 후 투표가 시작됩니다… {countdownRemaining}초
          </Text>
        </View>
      ) : (
        <Text style={styles.votePanelCount}>찬성 {guiltyCount}표</Text>
      )}
      {voteClock && remainingSec != null && (
        <View style={styles.timerRow}>
          <Text style={[styles.timerText, isUrgent && styles.timerUrgent]}>
            {remainingSec}초
          </Text>
        </View>
      )}

      {onCastVote && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.voterList}
        >
          {players.map((player) => {
            const vote = nomination.votes[player.id];
            const hasVoted = vote !== undefined;
            const confirmed = voteConfirmed[player.id];
            const hasConfirmed = confirmed !== undefined;
            const preselection = votePreselections[player.id];
            return (
              <View key={player.id} style={styles.voterItem}>
                <Text
                  style={[
                    styles.voterName,
                    !player.isAlive && styles.voterNameDead,
                  ]}
                  numberOfLines={1}
                >
                  {player.name}
                </Text>
                {hasVoted ? (
                  <Text style={[styles.votedBadge, styles.votedGuilty]}>
                    ✋🏻
                  </Text>
                ) : hasConfirmed ? (
                  confirmed ? (
                    <Text style={[styles.votedBadge, styles.votedGuilty]}>
                      ✋🏻
                    </Text>
                  ) : (
                    <Text style={styles.votedBadge}>-</Text>
                  )
                ) : preselection === true ? (
                  <Text style={[styles.votedBadge, styles.preselectedGuilty]}>
                    ✋🏻?
                  </Text>
                ) : IS_DEV ? (
                  <Pressable
                    onPress={() => onCastVote(player.id, true)}
                    style={styles.guiltyButton}
                  >
                    <Text style={styles.guiltyText}>✋🏻</Text>
                  </Pressable>
                ) : (
                  <Text style={styles.votedBadge}>-</Text>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {voteResult ? (
        <View style={styles.resultBanner}>
          <Text
            style={[
              styles.resultVerdict,
              voteResult.guilty
                ? styles.resultVerdictGuilty
                : styles.resultVerdictInnocent,
            ]}
          >
            {voteResult.nomineeName} - {voteResult.guilty ? '유죄' : '무죄'}
          </Text>
          <Text style={styles.resultCount}>
            찬성 {Object.keys(voteResult.votes).length}표
          </Text>
          <Text style={styles.resultThreshold}>
            *찬성표가{' '}
            <Text style={styles.resultThresholdHighlight}>생존자 수</Text>의
            절반 이상이면 처형
          </Text>
          <Text
            style={[
              styles.resultSentence,
              voteResult.executionStatus === 'new_candidate' ||
              voteResult.executionStatus === 'candidate_changed'
                ? styles.resultSentenceGuilty
                : voteResult.executionStatus === 'candidate_cleared'
                  ? styles.resultSentenceCleared
                  : styles.resultSentenceInnocent,
            ]}
          >
            {voteResult.executionMessage || '아무도 처형되지 않았습니다'}
          </Text>
          {onDismissResult && (
            <Pressable onPress={onDismissResult} style={styles.resultDismiss}>
              <Text style={styles.resultDismissText}>확인</Text>
            </Pressable>
          )}
        </View>
      ) : isDefensePhase && onProceedToVote ? (
        <Pressable onPress={onProceedToVote} style={styles.closeVoteButton}>
          <Text style={styles.closeVoteText}>투표 시작</Text>
        </Pressable>
      ) : (
        <Pressable onPress={onCloseVote} style={styles.closeVoteButton}>
          <Text style={styles.closeVoteText}>투표 종료</Text>
        </Pressable>
      )}
    </View>
  );
}
