import type { Nomination, Player } from '@clocktower/shared';
import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import { createVotePanelStyles } from './VotePanel.styles';

interface VotePanelProps {
  nomination: Nomination;
  players: Player[];
  onCloseVote: () => void;
  onCastVote?: (playerId: string, guilty: boolean) => void;
}

export function VotePanel({
  nomination,
  players,
  onCloseVote,
  onCastVote,
}: VotePanelProps) {
  const { fontSize } = useResponsive();
  const scale = fontSize.md / 12;
  const styles = useMemo(() => createVotePanelStyles(scale), [scale]);

  const voteCount = Object.values(nomination.votes).length;
  const guiltyCount = Object.values(nomination.votes).filter(Boolean).length;

  const nominatorName =
    players.find((p) => p.id === nomination.nominatorId)?.name ?? '?';
  const nomineeName =
    players.find((p) => p.id === nomination.nomineeId)?.name ?? '?';

  return (
    <View style={styles.votePanel}>
      <View style={styles.votePanelHeader}>
        <Text style={styles.votePanelTitle}>투표 진행 중</Text>
        <Text style={styles.votePanelInfo}>
          {nominatorName} → {nomineeName}
        </Text>
      </View>
      <Text style={styles.votePanelCount}>
        투표: {voteCount}명 (찬성 {guiltyCount} / 반대{' '}
        {voteCount - guiltyCount})
      </Text>

      {onCastVote && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.voterList}
        >
          {players.map((player) => {
            const vote = nomination.votes[player.id];
            const hasVoted = vote !== undefined;
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

      <Pressable onPress={onCloseVote} style={styles.closeVoteButton}>
        <Text style={styles.closeVoteText}>투표 종료</Text>
      </Pressable>
    </View>
  );
}
