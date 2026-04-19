import { colors, typography } from '@clocktower/ui';
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
        backgroundColor: 'rgba(5,3,1,0.78)',
        justifyContent: 'center',
        alignItems: 'center',
      },
      container: {
        backgroundColor: colors.ink.mid,
        borderRadius: 14,
        width: Math.min(s(300), screenWidth * 0.85),
        borderWidth: 1,
        borderColor: colors.edge.gilt,
      },
      body: {
        paddingHorizontal: s(20),
        paddingTop: s(20),
        paddingBottom: s(16),
      },
      title: {
        fontFamily: typography.family.display,
        color: colors.parchment.high,
        fontSize: s(18),
        fontWeight: typography.weight.bold,
        textAlign: 'center',
        letterSpacing: typography.tracking.tight,
      },
      message: {
        fontFamily: typography.family.body,
        color: colors.parchment.mid,
        fontSize: s(13),
        textAlign: 'center',
        marginTop: s(8),
        lineHeight: s(19),
      },
      buttonRow: {
        flexDirection: 'row',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.edge.default,
      },
      button: {
        flex: 1,
        paddingVertical: s(14),
        alignItems: 'center',
      },
      buttonDivider: {
        width: StyleSheet.hairlineWidth,
        backgroundColor: colors.edge.default,
      },
      cancelText: {
        fontFamily: typography.family.body,
        color: colors.parchment.mid,
        fontSize: s(15),
        fontWeight: typography.weight.semibold,
      },
      confirmText: {
        fontFamily: typography.family.body,
        color: colors.ember.glow,
        fontSize: s(15),
        fontWeight: typography.weight.semibold,
      },
      confirmTextDestructive: {
        color: colors.crimson.glow,
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
