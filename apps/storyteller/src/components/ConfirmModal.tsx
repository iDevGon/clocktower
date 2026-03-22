import { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  confirmStyle?: 'default' | 'destructive';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  visible,
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  confirmStyle = 'default',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const { fontSize, width: screenWidth } = useResponsive();
  const scale = fontSize.md / 12;

  const ms = useMemo(() => {
    const s = (v: number) => Math.round(v * scale);
    return StyleSheet.create({
      overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
      },
      container: {
        backgroundColor: '#1e1e22',
        borderRadius: 12,
        width: Math.min(s(300), screenWidth * 0.85),
        borderWidth: 1,
        borderColor: '#3a3a42',
      },
      body: {
        paddingHorizontal: s(20),
        paddingTop: s(20),
        paddingBottom: s(16),
      },
      title: {
        color: '#e0ddd8',
        fontSize: s(16),
        fontWeight: '700',
        textAlign: 'center',
      },
      message: {
        color: '#908e8a',
        fontSize: s(13),
        textAlign: 'center',
        marginTop: s(8),
        lineHeight: s(19),
      },
      buttonRow: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#3a3a42',
      },
      button: {
        flex: 1,
        paddingVertical: s(14),
        alignItems: 'center',
      },
      buttonDivider: {
        width: 1,
        backgroundColor: '#3a3a42',
      },
      cancelText: {
        color: '#908e8a',
        fontSize: s(15),
        fontWeight: '600',
      },
      confirmText: {
        color: '#7090c4',
        fontSize: s(15),
        fontWeight: '600',
      },
      confirmTextDestructive: {
        color: '#e05050',
      },
    });
  }, [scale, screenWidth]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={ms.overlay} onPress={onCancel}>
        <Pressable style={ms.container} onPress={(e) => e.stopPropagation()}>
          <View style={ms.body}>
            <Text style={ms.title}>{title}</Text>
            {message && <Text style={ms.message}>{message}</Text>}
          </View>
          <View style={ms.buttonRow}>
            <Pressable style={ms.button} onPress={onCancel}>
              <Text style={ms.cancelText}>{cancelText}</Text>
            </Pressable>
            <View style={ms.buttonDivider} />
            <Pressable style={ms.button} onPress={() => onConfirm()}>
              <Text
                style={[
                  ms.confirmText,
                  confirmStyle === 'destructive' && ms.confirmTextDestructive,
                ]}
              >
                {confirmText}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
