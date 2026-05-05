import { useCallback, useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { usePlayerStore } from '../stores/playerStore';

const AUTO_DISMISS_MS = 8000;

export function ScapegoatSwappedOverlay() {
  const overlay = usePlayerStore((s) => s.scapegoatSwappedOverlay);
  const dismiss = useCallback(
    () => usePlayerStore.getState().set({ scapegoatSwappedOverlay: null }),
    [],
  );

  useEffect(() => {
    if (!overlay) return;
    const timer = setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [overlay, dismiss]);

  if (!overlay) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={dismiss}>
      <Pressable style={styles.overlay} onPress={dismiss}>
        <Pressable style={styles.panel} onPress={(e) => e.stopPropagation?.()}>
          <Text style={styles.tag}>희생양 교체</Text>
          <View style={styles.row}>
            <Text style={styles.originalName}>{overlay.originalName}</Text>
            <Text style={styles.arrow}>→</Text>
            <Text style={styles.scapegoatName}>{overlay.scapegoatName}</Text>
          </View>
          <Text style={styles.subtitle}>
            처형 예정자가 희생양으로 교체되었습니다
          </Text>
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
    backgroundColor: 'rgba(0,0,0,0.88)',
    padding: 20,
  },
  panel: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#1a1614',
    borderWidth: 1,
    borderColor: '#7a5a3a',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  tag: {
    color: '#d8b890',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  originalName: {
    color: '#8a8078',
    fontSize: 18,
    fontWeight: '700',
    textDecorationLine: 'line-through',
  },
  arrow: {
    color: '#c49060',
    fontSize: 22,
    fontWeight: '700',
  },
  scapegoatName: {
    color: '#e0ddd8',
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    color: '#b8b6b2',
    fontSize: 13,
    marginTop: 14,
    textAlign: 'center',
  },
  hint: {
    color: '#5c5a58',
    fontSize: 11,
    marginTop: 16,
  },
});
