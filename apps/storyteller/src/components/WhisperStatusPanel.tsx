import { StyleSheet, Text, View } from 'react-native';

interface ActiveWhisper {
  player1Id: string;
  player1Name: string;
  player2Id: string;
  player2Name: string;
}

interface WhisperStatusPanelProps {
  whispers: ActiveWhisper[];
}

export function WhisperStatusPanel({ whispers }: WhisperStatusPanelProps) {
  if (whispers.length === 0) return null;

  return (
    <View style={styles.whisperPanel}>
      <Text style={styles.whisperPanelTitle}>밀담 현황</Text>
      {whispers.map((w) => (
        <Text
          key={`${w.player1Id}-${w.player2Id}`}
          style={styles.whisperPanelItem}
        >
          {w.player1Name} ↔ {w.player2Name}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  whisperPanel: {
    backgroundColor: '#1a1a1e',
    borderTopWidth: 1,
    borderColor: '#2a3d2a',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  whisperPanelTitle: {
    color: '#6a8a6a',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  whisperPanelItem: {
    color: '#e0ddd8',
    fontSize: 14,
    paddingVertical: 3,
  },
});
