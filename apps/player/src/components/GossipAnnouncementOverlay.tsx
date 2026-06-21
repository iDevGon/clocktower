import { useCallback, useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { usePlayerStore } from '../stores/playerStore';

const AUTO_DISMISS_MS = 12000;

export function GossipAnnouncementOverlay() {
  const announcement = usePlayerStore((s) => s.gossipAnnouncement);
  const dismiss = useCallback(
    () => usePlayerStore.getState().set({ gossipAnnouncement: null }),
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
          <Text style={styles.tag}>험담 공개발언</Text>
          <Text style={styles.gossipName}>{announcement.gossipName}</Text>
          <View style={styles.statementBox}>
            <Text style={styles.statement}>{announcement.statement}</Text>
          </View>
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
    backgroundColor: '#181a1f',
    borderWidth: 1,
    borderColor: '#4e6f82',
    borderRadius: 6,
    padding: 24,
  },
  tag: {
    color: '#9ec7da',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  gossipName: {
    color: '#e0ddd8',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 6,
  },
  statementBox: {
    borderWidth: 1,
    borderColor: '#2f4654',
    backgroundColor: '#101318',
    borderRadius: 4,
    padding: 14,
    marginTop: 16,
  },
  statement: {
    color: '#f0ede8',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  hint: {
    color: '#686d72',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 14,
  },
});
