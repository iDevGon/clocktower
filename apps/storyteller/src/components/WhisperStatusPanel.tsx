import type { ActiveWhisperChat } from '@clocktower/shared';
import { StyleSheet, Text, View } from 'react-native';

interface WhisperStatusPanelProps {
  whispers: ActiveWhisperChat[];
}

export function WhisperStatusPanel({ whispers }: WhisperStatusPanelProps) {
  if (whispers.length === 0) return null;

  return (
    <View style={styles.whisperPanel}>
      <Text style={styles.whisperPanelTitle}>밀담 현황</Text>
      {whispers.map((w) => (
        <Text key={w.conversationId} style={styles.whisperPanelItem}>
          {w.participantNames.join(' ↔ ')}
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
