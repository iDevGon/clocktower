import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useSocketConnection } from '../src/hooks/useSocketConnection';
import { useConnectionStore } from '../src/stores/connectionStore';
import { useGameStore } from '../src/stores/gameStore';

export default function RootLayout() {
  const { connect } = useSocketConnection();
  const gameId = useGameStore((s) => s.gameState?.id);
  const serverUrl = useConnectionStore((s) => s.serverUrl);
  const isConnected = useConnectionStore((s) => s.isConnected);

  useEffect(() => {
    if (!gameId || !serverUrl || isConnected) return;
    connect(serverUrl).catch(() => {
      useGameStore.getState().reset();
    });
  }, [gameId, serverUrl, isConnected, connect]);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#1a1a1e' },
        headerTintColor: '#e0ddd8',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: '#121214' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Clocktower' }} />
      <Stack.Screen name="game" options={{ headerShown: false }} />
    </Stack>
  );
}
