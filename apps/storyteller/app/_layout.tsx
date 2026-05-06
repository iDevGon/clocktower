import { ReducedMotionProvider, typography } from '@clocktower/ui';
import { useFonts } from 'expo-font';
import * as NavigationBar from 'expo-navigation-bar';
import { Stack } from 'expo-router';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { DevSettings, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSocketConnection } from '../src/hooks/useSocketConnection';
import { useConnectionStore } from '../src/stores/connectionStore';
import { useGameStore } from '../src/stores/gameStore';
import { useSettingsStore } from '../src/stores/settingsStore';

const IS_DEV = process.env.EXPO_PUBLIC_DEV_MODE === 'true';
if (__DEV__ && !IS_DEV && Platform.OS !== 'web') {
  // biome-ignore lint/suspicious/noExplicitAny: DevSettings type missing setIsShakeToShowDevMenuEnabled
  (DevSettings as any).setIsShakeToShowDevMenuEnabled?.(false);
}

// 시스템 네비게이션 바 & 배경을 앱 테마에 맞춤
if (Platform.OS === 'android') {
  NavigationBar.setBackgroundColorAsync('#121214');
  NavigationBar.setButtonStyleAsync('light');
}
SystemUI.setBackgroundColorAsync('#121214');

const SCROLLBAR_CSS = `
  *::-webkit-scrollbar {
    width: 12px;
    height: 12px;
  }
  *::-webkit-scrollbar-track {
    background: #1a1a22;
    border-radius: 4px;
  }
  *::-webkit-scrollbar-thumb {
    background: #5a5a68;
    border-radius: 4px;
  }
  *::-webkit-scrollbar-thumb:hover {
    background: #7a7a8a;
  }
`;

export default function RootLayout() {
  const { connect } = useSocketConnection();
  const gameId = useGameStore((s) => s.gameState?.id);
  const serverUrl = useConnectionStore((s) => s.serverUrl);
  const isConnected = useConnectionStore((s) => s.isConnected);
  const lowPowerMode = useSettingsStore((s) => s.lowPowerMode);
  const [fontsLoaded, fontError] = useFonts({
    [typography.fontFamily
      .body]: require('../assets/fonts/IBMPlexSansKR-Regular.ttf'),
    [typography.fontFamily
      .bodyMedium]: require('../assets/fonts/IBMPlexSansKR-Medium.ttf'),
    [typography.fontFamily
      .bodyBold]: require('../assets/fonts/IBMPlexSansKR-Bold.ttf'),
    [typography.fontFamily
      .displayLight]: require('../assets/fonts/SchoolSafeStarrySky-Light.ttf'),
    [typography.fontFamily
      .display]: require('../assets/fonts/SchoolSafeStarrySky-Bold.ttf'),
  });

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const style = document.createElement('style');
    style.textContent = SCROLLBAR_CSS;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // 이전 세션이 있고 연결이 끊어졌을 때 자동 재접속
  useEffect(() => {
    if (!gameId || !serverUrl || isConnected) return;
    connect(serverUrl).catch(() => {
      useGameStore.getState().reset();
    });
  }, [gameId, serverUrl, isConnected, connect]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ReducedMotionProvider value={lowPowerMode}>
      <GestureHandlerRootView
        style={{
          flex: 1,
          ...(Platform.OS === 'web' ? { userSelect: 'none' as const } : {}),
        }}
      >
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: '#1a1a1e' },
            headerTintColor: '#e0ddd8',
            headerTitleStyle: { fontWeight: '700' },
            contentStyle: { backgroundColor: '#121214' },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="game" options={{ headerShown: false }} />
        </Stack>
      </GestureHandlerRootView>
    </ReducedMotionProvider>
  );
}
