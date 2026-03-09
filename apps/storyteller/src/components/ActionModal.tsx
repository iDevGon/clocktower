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
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
      },
      container: {
        backgroundColor: '#1e1e22',
        borderRadius: 12,
        width: Math.min(s(280), screenWidth * 0.85),
        maxHeight: '80%',
        borderWidth: 1,
        borderColor: '#3a3a42',
      },
      title: {
        color: '#e0ddd8',
        fontSize: s(16),
        fontWeight: '700',
        textAlign: 'center',
        paddingTop: s(16),
        paddingHorizontal: s(16),
      },
      message: {
        color: '#908e8a',
        fontSize: s(13),
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
        borderColor: '#2a2a30',
      },
      optionDestructive: {},
      optionText: {
        color: '#c0bdb8',
        fontSize: s(15),
        textAlign: 'center',
      },
      optionTextDestructive: {
        color: '#e05050',
      },
      cancelButton: {
        paddingVertical: s(14),
        borderTopWidth: 1,
        borderColor: '#3a3a42',
      },
      cancelText: {
        color: '#7070c4',
        fontSize: s(15),
        fontWeight: '600',
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
                    option.onPress?.();
                  }}
                >
                  <Text
                    style={[
                      ms.optionText,
                      option.style === 'destructive' && ms.optionTextDestructive,
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
