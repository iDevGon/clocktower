import {
  applyDefaultFonts,
  fontAssets,
  ReducedMotionProvider,
} from '@clocktower/ui';
import { useFonts } from 'expo-font';
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

// 앱 전역 기본 폰트를 Pretendard 로 — fontFamily 명시 안 한 Text 가
// 시스템 폰트로 떨어지는 것을 방지.
applyDefaultFonts();

const rootStyle = {
  flex: 1,
  ...(Platform.OS === 'web' ? { userSelect: 'none' as const } : {}),
};

export default function RootLayout() {
  const lowPowerMode = useSettingsStore((s) => s.lowPowerMode);
  // 폰트 로드가 완료될 때까지 대기 — 로드 실패 시에도 fallback 되도록 error 는 무시
  const [fontsLoaded, fontError] = useFonts(fontAssets);

  if (!fontsLoaded && !fontError) {
    // 로딩 중에는 빈 화면 — 스플래시 유지
    return null;
  }

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
