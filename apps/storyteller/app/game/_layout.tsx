import { Stack } from 'expo-router';

export default function GameLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#1a1a1e' },
        headerTintColor: '#e0ddd8',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: '#121214' },
      }}
    >
      <Stack.Screen name="lobby" options={{ title: '대기실', headerBackVisible: false }} />
      <Stack.Screen
        name="grimoire"
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="assign-role"
        options={{ title: '역할 배정', presentation: 'modal' }}
      />
      <Stack.Screen
        name="nominate"
        options={{ title: '지목', presentation: 'modal' }}
      />
      <Stack.Screen
        name="whispers"
        options={{ title: '밀담 현황', presentation: 'modal' }}
      />
      <Stack.Screen
        name="log"
        options={{ title: '게임 로그', presentation: 'modal' }}
      />
    </Stack>
  );
}
