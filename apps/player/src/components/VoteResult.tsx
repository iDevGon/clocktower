import type { ExecutionStatus } from '@clocktower/shared';
import { Ornament, PaperTexture, WaxSeal } from '@clocktower/ui';
import { Text, View } from 'react-native';
import Animated, { Easing, FadeIn, ZoomIn } from 'react-native-reanimated';
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

/**
 * 투표 판결 — 편지체 양피지 위에 도장이 찍히는 연출.
 * "유죄/무죄"를 대형 세리프 + 밀랍 봉인 스탬프로 극적으로 표현.
 */
export function VoteResult({
  nomineeName,
  guilty,
  votes,
  executionStatus,
  executionMessage,
}: VoteResultProps) {
  const yesCount = Object.keys(votes).length;
  const isCleared = executionStatus === 'candidate_cleared';
  const isNewCandidate =
    executionStatus === 'new_candidate' ||
    executionStatus === 'candidate_changed';

  const sealTone = guilty ? 'crimson' : 'verdure';
  const sealGlyph = guilty ? 'bat' : 'lily';

  const sentenceColor = isNewCandidate
    ? styles.sentenceGuilty
    : isCleared
      ? styles.sentenceCleared
      : styles.sentenceInnocent;

  return (
    <Animated.View entering={FadeIn.duration(420)} style={styles.card}>
      <PaperTexture />
      <Text style={styles.eyebrow}>투표 판결</Text>

      <Text style={styles.nomineeName}>{nomineeName}</Text>

      <Animated.View
        entering={ZoomIn.delay(280)
          .duration(420)
          .easing(Easing.out(Easing.cubic))}
        style={styles.sealWrap}
      >
        <WaxSeal size={68} tone={sealTone} glyph={sealGlyph} />
      </Animated.View>

      <Text
        style={[
          styles.verdict,
          guilty ? styles.verdictGuilty : styles.verdictInnocent,
        ]}
      >
        {guilty ? '유 죄' : '무 죄'}
      </Text>

      <Ornament
        kind="rule"
        width={120}
        color={styles.ruleColor.color}
        style={styles.rule}
      />

      <Text style={styles.count}>찬성 {yesCount}표</Text>
      <Text style={styles.threshold}>
        찬성표가 <Text style={styles.thresholdHighlight}>생존자 수</Text>의 절반
        이상이면 처형
      </Text>

      <View style={styles.sentenceDivider} />

      <Text style={[styles.sentence, sentenceColor]}>
        {executionMessage || '아무도 처형되지 않았습니다'}
      </Text>
    </Animated.View>
  );
}
