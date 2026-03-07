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

  return (
    <View style={styles.card}>
      <Text style={styles.label}>지목 투표</Text>
      <Text style={styles.nominationInfo}>
        <Text style={styles.playerNameHighlight}>{nominatorName}</Text>
        {'(이)가 '}
        <Text style={styles.playerNameHighlight}>{nomineeName}</Text>
        {'(을)를 지목했습니다'}
      </Text>

      {hasVoted ? (
        <View style={styles.votedContainer}>
          <Text style={styles.votedText}>투표 완료</Text>
          <Text style={styles.votedSubtext}>결과를 기다리는 중...</Text>
        </View>
      ) : (
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
      )}
    </View>
  );
}
