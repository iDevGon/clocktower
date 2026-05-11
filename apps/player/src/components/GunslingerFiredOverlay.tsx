import { useCallback, useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { usePlayerStore } from '../stores/playerStore';

const AUTO_DISMISS_MS = 8000;

export function GunslingerFiredOverlay() {
  const overlay = usePlayerStore((s) => s.gunslingerFiredOverlay);
  const dismiss = useCallback(
    () => usePlayerStore.getState().set({ gunslingerFiredOverlay: null }),
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
          <Text style={styles.tag}>
            {overlay.killed === false ? '총잡이 발사 실패' : '총잡이 발사'}
          </Text>
          <View style={styles.row}>
            <Text style={styles.gunslingerName}>{overlay.gunslingerName}</Text>
            <Text style={styles.arrow}>→</Text>
            <Text
              style={[
                styles.targetName,
                overlay.killed !== false && styles.targetNameKilled,
              ]}
            >
              {overlay.targetName}
            </Text>
          </View>
          <Text style={styles.targetRole}>{overlay.targetRoleName}</Text>
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
    backgroundColor: '#1f1414',
    borderWidth: 1,
    borderColor: '#7a3a3a',
    borderRadius: 6,
    padding: 24,
    alignItems: 'center',
  },
  tag: {
    color: '#d89090',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  gunslingerName: {
    color: '#e0ddd8',
    fontSize: 20,
    fontWeight: '800',
  },
  arrow: {
    color: '#c47070',
    fontSize: 22,
    fontWeight: '700',
  },
  targetName: {
    color: '#e0ddd8',
    fontSize: 20,
    fontWeight: '800',
  },
  targetNameKilled: {
    textDecorationLine: 'line-through',
  },
  targetRole: {
    color: '#c47070',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 10,
  },
  hint: {
    color: '#5c5a58',
    fontSize: 11,
    marginTop: 16,
  },
});
