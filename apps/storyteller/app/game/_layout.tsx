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
      <Stack.Screen name="lobby" options={{ title: '대기실' }} />
      <Stack.Screen
        name="grimoire"
        options={{
          title: '마법서',
          headerBackVisible: false,
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
    </Stack>
  );
}
