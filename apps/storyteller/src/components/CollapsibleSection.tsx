import type React from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

export function CollapsibleSection({
  label,
  isOpen,
  onToggle,
  scale,
  children,
}: {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  scale: number;
  children: React.ReactNode;
}) {
  const s = (v: number) => Math.round(v * scale);
  const chevronRotation = useSharedValue(0);
  const contentHeight = useSharedValue(0);

  // Update animation values when isOpen changes
  chevronRotation.value = withTiming(isOpen ? 180 : 0, { duration: 250 });
  contentHeight.value = withTiming(isOpen ? 1 : 0, { duration: 250 });

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value}deg` }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentHeight.value,
    maxHeight: contentHeight.value === 0 ? 0 : contentHeight.value * 500,
    overflow: 'hidden' as const,
  }));

  return (
    <View style={{ marginBottom: s(8) }}>
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: s(8),
          borderRadius: 6,
          backgroundColor: pressed ? '#2a2a30' : '#1e1e22',
          borderWidth: 1,
          borderColor: '#3a3a3e',
          gap: s(6),
        })}
      >
        <Text
          style={{
            color: '#908e8a',
            fontSize: s(13),
            fontWeight: '600',
          }}
        >
          {label}
        </Text>
        <Animated.Text
          style={[
            {
              color: '#908e8a',
              fontSize: s(11),
            },
            chevronStyle,
          ]}
        >
          ▼
        </Animated.Text>
      </Pressable>
      <Animated.View style={[{ marginTop: s(8) }, contentStyle]}>
        {children}
      </Animated.View>
    </View>
  );
}
