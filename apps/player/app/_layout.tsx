import { ReducedMotionProvider } from '@clocktower/ui';
import { Stack } from 'expo-router';
import { DevSettings, Platform, View } from 'react-native';
import { useSettingsStore } from '../src/stores/settingsStore';

const IS_DEV = process.env.EXPO_PUBLIC_DEV_MODE === 'true';
if (__DEV__ && !IS_DEV && Platform.OS !== 'web') {
  DevSettings.setIsShakeToShowDevMenuEnabled?.(false);
}

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
