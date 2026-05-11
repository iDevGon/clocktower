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
        backgroundColor: 'rgba(13, 7, 3, 0.78)',
        justifyContent: 'center',
        alignItems: 'center',
      },
      container: {
        backgroundColor: colors.arcane.surface.apparatus,
        borderRadius: 4,
        width: Math.min(s(320), screenWidth * 0.88),
        borderWidth: 1,
        borderColor: colors.arcane.border.brassDim,
      },
      body: {
        paddingHorizontal: s(20),
        paddingTop: s(20),
        paddingBottom: s(16),
      },
      title: {
        color: colors.arcane.text.strong,
        fontSize: s(18),
        fontFamily: typography.fontFamily.display,
        textAlign: 'center',
      },
      message: {
        color: colors.arcane.text.muted,
        fontSize: s(13),
        fontFamily: typography.fontFamily.body,
        textAlign: 'center',
        marginTop: s(8),
        lineHeight: s(19),
      },
      buttonRow: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: colors.arcane.border.brassDim,
      },
      button: {
        flex: 1,
        paddingVertical: s(14),
        alignItems: 'center',
      },
      buttonDivider: {
        width: 1,
        backgroundColor: colors.arcane.border.brassDim,
      },
      cancelText: {
        color: colors.arcane.text.muted,
        fontSize: s(15),
        fontFamily: typography.fontFamily.bodyBold,
      },
      confirmText: {
        color: colors.arcane.accent.sapphireLens,
        fontSize: s(15),
        fontFamily: typography.fontFamily.bodyBold,
      },
      confirmTextDestructive: {
        color: colors.arcane.action.bloodHighlight,
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
