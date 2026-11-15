import { colors } from '@clocktower/ui';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import { openPublicDisplay } from '../publicDisplay/window';

export function PublicDisplayButton() {
  const { isDesktopConsole } = useResponsive();
  if (!isDesktopConsole) return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="공용 화면을 별도 창으로 열기"
      onPress={() => {
        if (!openPublicDisplay())
          window.alert(
            '팝업이 차단되었습니다. 브라우저에서 팝업을 허용한 뒤 다시 눌러주세요.',
          );
      }}
      style={styles.button}
    >
      <Text style={styles.label}>공용 화면 열기 ↗</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.arcane.border.brassDim,
    backgroundColor: colors.arcane.accent.midnightInk,
  },
  label: { color: colors.arcane.text.strong, fontSize: 13, fontWeight: '600' },
});
