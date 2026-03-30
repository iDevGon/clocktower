import { ReducedMotionProvider } from '@clocktower/ui';
import * as NavigationBar from 'expo-navigation-bar';
import { Stack } from 'expo-router';
import * as SystemUI from 'expo-system-ui';
import { DevSettings, Platform, View } from 'react-native';
import { useSettingsStore } from '../src/stores/settingsStore';

const IS_DEV = process.env.EXPO_PUBLIC_DEV_MODE === 'true';
if (__DEV__ && !IS_DEV && Platform.OS !== 'web') {
  // biome-ignore lint/suspicious/noExplicitAny: DevSettings type missing setIsShakeToShowDevMenuEnabled
  (DevSettings as any).setIsShakeToShowDevMenuEnabled?.(false);
}

// 시스템 네비게이션 바 & 배경을 앱 테마에 맞춤
if (Platform.OS === 'android') {
  NavigationBar.setBackgroundColorAsync('#080304');
  NavigationBar.setButtonStyleAsync('light');
}
SystemUI.setBackgroundColorAsync('#080304');

const rootStyle = {
  flex: 1,
  ...(Platform.OS === 'web' ? { userSelect: 'none' as const } : {}),
};

export default function RootLayout() {
  const lowPowerMode = useSettingsStore((s) => s.lowPowerMode);

  return (
    <ReducedMotionProvider value={lowPowerMode}>
      <View style={rootStyle}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#121214' },
            animation: 'fade',
          }}
        />
      </View>
    </ReducedMotionProvider>
  );
}
