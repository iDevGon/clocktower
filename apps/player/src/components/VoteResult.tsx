import { StyleSheet, Text, View } from 'react-native';

interface VoteResultProps {
  nomineeName: string;
  guilty: boolean;
  votes: Record<string, boolean>;
}

export function VoteResult({ nomineeName, guilty, votes }: VoteResultProps) {
  const yesCount = Object.values(votes).filter(Boolean).length;
  const noCount = Object.values(votes).filter((v) => !v).length;

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
      <Text style={styles.count}>
        찬성 {yesCount}표 / 반대 {noCount}표
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3a3a42',
    padding: 20,
    alignItems: 'center',
  },
  label: {
    color: '#908e8a',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 12,
  },
  verdict: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  verdictGuilty: {
    color: '#c47070',
  },
  verdictInnocent: {
    color: '#6a9a6a',
  },
  count: {
    color: '#908e8a',
    fontSize: 14,
  },
});
