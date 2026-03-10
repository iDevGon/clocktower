import { Pressable, Text, View } from 'react-native';
import { useGameActions } from '../hooks/useGameActions';
import { usePlayerStore } from '../stores/playerStore';
import { styles } from './VotePrompt.styles';

interface VotePromptProps {
  nominatorName: string;
  nomineeName: string;
}

export function VotePrompt({ nominatorName, nomineeName }: VotePromptProps) {
  const { castVote } = useGameActions();
  const hasVoted = usePlayerStore((s) => s.hasVoted);
  const playerId = usePlayerStore((s) => s.playerId);
  const voteTurn = usePlayerStore((s) => s.voteTurn);
  const voteTimerMs = usePlayerStore((s) => s.voteTimerMs);

  const isMyVoteTurn = voteTurn?.playerId === playerId;
  const timerSeconds =
    voteTimerMs != null ? Math.ceil(voteTimerMs / 1000) : null;

  return (
    <View style={styles.card}>
      <Text style={styles.label}>지목 투표</Text>
      <Text style={styles.nominationInfo}>
        <Text style={styles.playerNameHighlight}>{nominatorName}</Text>
        {'(이)가 '}
        <Text style={styles.playerNameHighlight}>{nomineeName}</Text>
        {'(을)를 지목했습니다'}
      </Text>

      {voteTurn && (
        <View
          style={{
            backgroundColor: isMyVoteTurn ? '#2a1a0a' : '#1a1a2a',
            padding: 8,
            borderRadius: 6,
            marginTop: 8,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: isMyVoteTurn ? '#f5c542' : '#8090c0',
              fontSize: 13,
              fontWeight: '600',
            }}
          >
            {isMyVoteTurn
              ? '지금 당신의 투표 차례입니다!'
              : `${voteTurn.playerName}의 투표 차례`}
          </Text>
          {timerSeconds != null && (
            <Text
              style={{
                color: timerSeconds <= 3 ? '#e74c3c' : '#c0c8e0',
                fontSize: 18,
                fontWeight: '700',
                marginTop: 4,
                fontVariant: ['tabular-nums'],
              }}
            >
              {timerSeconds}초
            </Text>
          )}
        </View>
      )}

      {hasVoted ? (
        <View style={styles.votedContainer}>
          <Text style={styles.votedText}>투표 완료</Text>
          <Text style={styles.votedSubtext}>결과를 기다리는 중...</Text>
        </View>
      ) : isMyVoteTurn || !voteTurn ? (
        <>
          <Text style={styles.description}>판결을 내리세요.</Text>
          <View style={styles.buttonRow}>
            <Pressable
              style={({ pressed }) => [
                styles.guiltyButton,
                pressed && styles.guiltyButtonPressed,
              ]}
              onPress={() => castVote(true)}
            >
              <Text style={styles.guiltyText}>유죄</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.innocentButton,
                pressed && styles.innocentButtonPressed,
              ]}
              onPress={() => castVote(false)}
            >
              <Text style={styles.innocentText}>무죄</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <View style={styles.votedContainer}>
          <Text style={styles.votedSubtext}>
            다른 플레이어의 투표를 기다리는 중...
          </Text>
        </View>
      )}
    </View>
  );
}
