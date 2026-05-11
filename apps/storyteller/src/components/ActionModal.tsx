import { colors, typography } from '@clocktower/ui';
import { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';

export interface ActionModalOption {
  text: string;
  style?: 'default' | 'destructive' | 'cancel';
  onPress?: () => void;
}

interface ActionModalProps {
  visible: boolean;
  title: string;
  message?: string;
  options: ActionModalOption[];
  onClose: () => void;
}

export function ActionModal({
  visible,
  title,
  message,
  options,
  onClose,
}: ActionModalProps) {
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
        maxHeight: '80%',
        borderWidth: 1,
        borderColor: colors.arcane.border.brassDim,
      },
      title: {
        color: colors.arcane.text.strong,
        fontSize: s(18),
        fontFamily: typography.fontFamily.display,
        textAlign: 'center',
        paddingTop: s(18),
        paddingHorizontal: s(16),
      },
      message: {
        color: colors.arcane.text.muted,
        fontSize: s(13),
        fontFamily: typography.fontFamily.body,
        textAlign: 'center',
        paddingHorizontal: s(16),
        paddingTop: s(6),
      },
      options: {
        paddingTop: s(12),
        paddingBottom: s(4),
      },
      option: {
        paddingVertical: s(12),
        paddingHorizontal: s(16),
        borderTopWidth: 1,
        borderColor: colors.arcane.border.parchment,
      },
      optionDestructive: {},
      optionText: {
        color: colors.arcane.text.primary,
        fontSize: s(15),
        fontFamily: typography.fontFamily.bodyMedium,
        textAlign: 'center',
      },
      optionTextDestructive: {
        color: colors.arcane.action.bloodHighlight,
      },
      cancelButton: {
        paddingVertical: s(14),
        borderTopWidth: 1,
        borderColor: colors.arcane.border.brassDim,
        backgroundColor: colors.arcane.surface.ledger,
      },
      cancelText: {
        color: colors.arcane.accent.sapphireLens,
        fontSize: s(15),
        fontFamily: typography.fontFamily.bodyBold,
        textAlign: 'center',
      },
    });
  }, [scale, screenWidth]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={ms.overlay} onPress={onClose}>
        <Pressable style={ms.container} onPress={(e) => e.stopPropagation()}>
          <Text style={ms.title}>{title}</Text>
          {message && <Text style={ms.message}>{message}</Text>}
          <View style={ms.options}>
            {options
              .filter((o) => o.style !== 'cancel')
              .map((option) => (
                <Pressable
                  key={option.text}
                  style={[
                    ms.option,
                    option.style === 'destructive' && ms.optionDestructive,
                  ]}
                  onPress={() => {
                    onClose();
                    // Alert가 모달 닫힘 애니메이션과 겹치지 않도록 딜레이
                    setTimeout(() => option.onPress?.(), 300);
                  }}
                >
                  <Text
                    style={[
                      ms.optionText,
                      option.style === 'destructive' &&
                        ms.optionTextDestructive,
                    ]}
                  >
                    {option.text}
                  </Text>
                </Pressable>
              ))}
          </View>
          <Pressable style={ms.cancelButton} onPress={onClose}>
            <Text style={ms.cancelText}>
              {options.find((o) => o.style === 'cancel')?.text ?? '닫기'}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
