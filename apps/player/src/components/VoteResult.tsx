import type { ExecutionStatus } from '@clocktower/shared';
import { Text, View } from 'react-native';
import { styles } from './VoteResult.styles';

interface VoteResultProps {
  nomineeName: string;
  guilty: boolean;
  votes: Record<string, boolean>;
  executionCandidate?: {
    playerId: string;
    playerName: string;
    guiltyVotes: number;
  } | null;
  executionStatus?: ExecutionStatus;
  executionMessage?: string;
}

export function VoteResult({
  nomineeName,
  guilty,
  votes,
  executionStatus,
  executionMessage,
}: VoteResultProps) {
  const yesCount = Object.keys(votes).length;
  const isCleared = executionStatus === 'candidate_cleared';
  const isGuiltyStyle =
    executionStatus === 'new_candidate' ||
    executionStatus === 'candidate_changed';

  return (
    <View style={styles.card}>
      <Text style={styles.label}>투표 결과</Text>
      <Text
        style={[
          styles.verdict,
          guilty ? styles.verdictGuilty : styles.verdictInnocent,
        ]}
      >
        {nomineeName} - {guilty ? '유죄' : '무죄'}
      </Text>
      <Text style={styles.count}>찬성 {yesCount}표</Text>
      <Text style={styles.threshold}>
        *찬성표가 <Text style={styles.thresholdHighlight}>생존자 수</Text>의
        절반 이상이면 처형
      </Text>
      <View style={styles.sentenceDivider} />
      <Text
        style={[
          styles.sentence,
          isGuiltyStyle
            ? styles.sentenceGuilty
            : isCleared
              ? styles.sentenceCleared
              : styles.sentenceInnocent,
        ]}
      >
        {executionMessage || '아무도 처형되지 않았습니다'}
      </Text>
    </View>
  );
}
