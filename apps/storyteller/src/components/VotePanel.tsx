import type { Nomination, Player } from '@clocktower/shared';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import { useGameStore } from '../stores/gameStore';
import { createVotePanelStyles } from './VotePanel.styles';

interface VoteResultData {
  nomineeId: string;
  nomineeName: string;
  guilty: boolean;
  votes: Record<string, boolean>;
}

interface VotePanelProps {
  nomination: Nomination;
  players: Player[];
  onCloseVote: () => void;
  onCastVote?: (playerId: string, guilty: boolean) => void;
  voteResult?: VoteResultData | null;
  onDismissResult?: () => void;
}

export function VotePanel({
  nomination,
  players,
  onCloseVote,
  onCastVote,
  voteResult,
  onDismissResult,
}: VotePanelProps) {
  const { fontSize } = useResponsive();
  const scale = fontSize.md / 12;
  const styles = useMemo(() => createVotePanelStyles(scale), [scale]);

  const voteCountdown = useGameStore((s) => s.voteCountdown);
  const voteClock = useGameStore((s) => s.voteClock);
  const votePreselections = useGameStore((s) => s.votePreselections);
  const voteConfirmed = useGameStore((s) => s.voteConfirmed);

  const [, forceUpdate] = useState(0);

  // Re-render periodically to update timer and countdown
  useEffect(() => {
    if (!voteClock && !voteCountdown) return;
    const interval = setInterval(() => forceUpdate((n) => n + 1), 200);
    return () => clearInterval(interval);
  }, [voteClock, voteCountdown]);

  // 카운트다운 계산
  const countdownRemaining = useMemo(() => {
    if (!voteCountdown) return 0;
    const elapsed = Date.now() - voteCountdown.startedAt;
    return Math.max(0, Math.ceil((voteCountdown.durationMs - elapsed) / 1000));
  }, [voteCountdown]);

  const isCountingDown = voteCountdown !== null && countdownRemaining > 0;

  const voteCount =
    Object.values(nomination.votes).length + Object.keys(voteConfirmed).length;
  const guiltyCount =
    Object.values(nomination.votes).filter(Boolean).length +
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
      {isCountingDown ? (
        <View style={styles.countdownRow}>
          <Text style={styles.countdownText}>
            잠시 후 투표가 시작됩니다... {countdownRemaining}초
          </Text>
        </View>
      ) : (
        <>
          <Text style={styles.votePanelCount}>
            투표: {voteCount}명 (찬성 {guiltyCount} / 반대{' '}
            {voteCount - guiltyCount})
          </Text>
        </>
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
                  <Text
                    style={[
                      styles.votedBadge,
                      vote ? styles.votedGuilty : styles.votedInnocent,
                    ]}
                  >
                    {vote ? '찬성' : '반대'}
                  </Text>
                ) : hasConfirmed ? (
                  <Text
                    style={[
                      styles.votedBadge,
                      confirmed ? styles.votedGuilty : styles.votedInnocent,
                    ]}
                  >
                    {confirmed ? '찬성' : '반대'}
                  </Text>
                ) : preselection != null ? (
                  <Text
                    style={[
                      styles.votedBadge,
                      preselection
                        ? styles.preselectedGuilty
                        : styles.preselectedInnocent,
                    ]}
                  >
                    {preselection ? '찬성?' : '반대?'}
                  </Text>
                ) : (
                  <View style={styles.voteButtons}>
                    <Pressable
                      onPress={() => onCastVote(player.id, true)}
                      style={styles.guiltyButton}
                    >
                      <Text style={styles.guiltyText}>찬</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => onCastVote(player.id, false)}
                      style={styles.innocentButton}
                    >
                      <Text style={styles.innocentText}>반</Text>
                    </Pressable>
                  </View>
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
            찬성 {Object.values(voteResult.votes).filter(Boolean).length}표 /
            반대{' '}
            {Object.values(voteResult.votes).filter((v) => !v).length}표
          </Text>
          <Text
            style={[
              styles.resultSentence,
              voteResult.guilty
                ? styles.resultSentenceGuilty
                : styles.resultSentenceInnocent,
            ]}
          >
            {voteResult.guilty
              ? `${voteResult.nomineeName}님이 처형 예정입니다`
              : '아무도 처형되지 않았습니다'}
          </Text>
          {onDismissResult && (
            <Pressable onPress={onDismissResult} style={styles.resultDismiss}>
              <Text style={styles.resultDismissText}>확인</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <Pressable onPress={onCloseVote} style={styles.closeVoteButton}>
          <Text style={styles.closeVoteText}>투표 종료</Text>
        </Pressable>
      )}
    </View>
  );
}
