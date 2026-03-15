import type React from 'react';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  createCollapsibleSectionStyles,
  toggleButtonStyle,
} from './CollapsibleSection.styles';

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
  const st = createCollapsibleSectionStyles(s);
  const chevronRotation = useSharedValue(0);
  const contentHeight = useSharedValue(0);

  useEffect(() => {
    chevronRotation.value = withTiming(isOpen ? 180 : 0, { duration: 250 });
    contentHeight.value = withTiming(isOpen ? 1 : 0, { duration: 250 });
  }, [isOpen, chevronRotation, contentHeight]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value}deg` }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentHeight.value,
    maxHeight: contentHeight.value === 0 ? 0 : contentHeight.value * 500,
    overflow: 'hidden' as const,
  }));

  return (
    <View style={st.container}>
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => toggleButtonStyle(s, pressed)}
      >
        <Text style={st.label}>{label}</Text>
        <Animated.Text style={[st.chevron, chevronStyle]}>▼</Animated.Text>
      </Pressable>
      <Animated.View style={[st.contentWrapper, contentStyle]}>
        {children}
      </Animated.View>
    </View>
  );
}
