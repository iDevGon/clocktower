import type { Nomination, Player } from '@clocktower/shared';
import { Pressable, Text, View } from 'react-native';
import { styles } from './VotePanel.styles';

interface VotePanelProps {
  nomination: Nomination;
  players: Player[];
  onCloseVote: () => void;
}

export function VotePanel({
  nomination,
  players,
  onCloseVote,
}: VotePanelProps) {
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
        투표: {voteCount}명 (찬성 {guiltyCount} / 반대 {voteCount - guiltyCount}
        )
      </Text>
      <Pressable onPress={onCloseVote} style={styles.closeVoteButton}>
        <Text style={styles.closeVoteText}>투표 종료</Text>
      </Pressable>
    </View>
  );
}
