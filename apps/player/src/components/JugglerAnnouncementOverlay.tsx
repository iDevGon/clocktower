import { useCallback, useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { usePlayerStore } from '../stores/playerStore';

const AUTO_DISMISS_MS = 12000;

export function JugglerAnnouncementOverlay() {
  const announcement = usePlayerStore((s) => s.jugglerAnnouncement);
  const dismiss = useCallback(
    () => usePlayerStore.getState().set({ jugglerAnnouncement: null }),
    [],
  );

  useEffect(() => {
    if (!announcement) return;
    const timer = setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [announcement, dismiss]);

  if (!announcement) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={dismiss}>
      <Pressable style={styles.overlay} onPress={dismiss}>
        <Pressable style={styles.panel} onPress={(e) => e.stopPropagation?.()}>
          <Text style={styles.tag}>곡예사 공개 선언</Text>
          <Text style={styles.jugglerName}>{announcement.jugglerName}</Text>
          <View style={styles.divider} />
          {announcement.guesses.map((g, i) => (
            <View
              key={`${g.playerId}-${g.roleId}-${i}`}
              style={styles.guessRow}
            >
              <Text style={styles.guessIndex}>{i + 1}</Text>
              <Text style={styles.guessPlayer}>{g.playerName}</Text>
              <Text style={styles.guessEq}>=</Text>
              <Text style={styles.guessRole}>{g.roleName}</Text>
            </View>
          ))}
          <Text style={styles.hint}>탭하여 닫기</Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
    padding: 20,
  },
  panel: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#1a1620',
    borderWidth: 1,
    borderColor: '#5a3a7a',
    borderRadius: 6,
    padding: 24,
  },
  tag: {
    color: '#b894d8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  jugglerName: {
    color: '#e0ddd8',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#3a2a4a',
    marginVertical: 14,
  },
  guessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  guessIndex: {
    color: '#7c7a78',
    fontSize: 12,
    fontWeight: '700',
    width: 18,
    textAlign: 'center',
  },
  guessPlayer: {
    color: '#e0ddd8',
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  guessEq: {
    color: '#5c5a58',
    fontSize: 14,
  },
  guessRole: {
    color: '#cfa8e8',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  hint: {
    color: '#5c5a58',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 14,
  },
});
