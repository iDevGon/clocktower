import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSocketConnection } from '../src/hooks/useSocketConnection';
import { useConnectionStore } from '../src/stores/connectionStore';
import { useGameStore } from '../src/stores/gameStore';

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

  return (
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
  );
}
