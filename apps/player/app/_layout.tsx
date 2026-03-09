import { Stack } from 'expo-router';
import { Platform, View } from 'react-native';

const rootStyle = {
  flex: 1,
  ...(Platform.OS === 'web' ? { userSelect: 'none' as const } : {}),
};

export default function RootLayout() {
  return (
    <View style={rootStyle}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#121214' },
          animation: 'fade',
        }}
      />
    </View>
  );
}
