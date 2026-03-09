import type { Player, PlayerStatus } from '@clocktower/shared';
import { useEffect } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useResponsive } from '../hooks/useResponsive';
import { PlayerToken } from './PlayerToken';

interface DraggablePlayerTokenProps {
  player: Player;
  statuses?: PlayerStatus[];
  highlighted?: boolean;
  butlerMasterName?: string;
  tokenSize?: number;
  initialX: number;
  initialY: number;
  onPress?: () => void;
  onPositionChange?: (x: number, y: number) => void;
}

export function DraggablePlayerToken({
  player,
  statuses,
  highlighted,
  butlerMasterName,
  tokenSize: tokenSizeProp,
  initialX,
  initialY,
  onPress,
  onPositionChange,
}: DraggablePlayerTokenProps) {
  const responsive = useResponsive();
  const tokenSize = tokenSizeProp ?? responsive.tokenSize;
  const half = tokenSize / 2;

  const translateX = useSharedValue(initialX);
  const translateY = useSharedValue(initialY);

  useEffect(() => {
    translateX.value = withSpring(initialX);
    translateY.value = withSpring(initialY);
  }, [initialX, initialY, translateX, translateY]);

  const contextX = useSharedValue(0);
  const contextY = useSharedValue(0);
  const scale = useSharedValue(1);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      contextX.value = translateX.value;
      contextY.value = translateY.value;
      scale.value = withSpring(1.1);
    })
    .onUpdate((e) => {
      translateX.value = contextX.value + e.translationX;
      translateY.value = contextY.value + e.translationY;
    })
    .onEnd(() => {
      scale.value = withSpring(1);
      if (onPositionChange) {
        runOnJS(onPositionChange)(translateX.value, translateY.value);
      }
    })
    .minDistance(10);

  const tapGesture = Gesture.Tap().onEnd(() => {
    if (onPress) {
      runOnJS(onPress)();
    }
  });

  const composed = Gesture.Race(panGesture, tapGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    left: translateX.value - half,
    top: translateY.value - half,
    transform: [{ scale: scale.value }],
    zIndex: scale.value > 1 ? 100 : 1,
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={animatedStyle}>
        <PlayerToken
          player={player}
          statuses={statuses}
          highlighted={highlighted}
          butlerMasterName={butlerMasterName}
          size={tokenSize}
        />
      </Animated.View>
    </GestureDetector>
  );
}
