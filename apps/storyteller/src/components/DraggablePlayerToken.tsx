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
import { PlayerToken, type VoteIndicator } from './PlayerToken';

export interface CircularPosition {
  x: number;
  y: number;
  index: number;
}

interface DraggablePlayerTokenProps {
  player: Player;
  statuses?: PlayerStatus[];
  highlighted?: boolean;
  empathNeighbor?: boolean;
  voteIndicator?: VoteIndicator;
  isPreselected?: boolean;
  isExecutionCandidate?: boolean;
  hasNominated?: boolean;
  wasNominated?: boolean;
  memo?: string;
  tokenSize?: number;
  initialX: number;
  initialY: number;
  circularPositions?: CircularPosition[];
  onPress?: () => void;
  onPositionChange?: (x: number, y: number) => void;
  onSwap?: (fromIndex: number, toIndex: number) => void;
  positionIndex?: number;
}

export type { VoteIndicator } from './PlayerToken';

export function DraggablePlayerToken({
  player,
  statuses,
  highlighted,
  empathNeighbor,
  voteIndicator,
  isPreselected,
  isExecutionCandidate,
  hasNominated,
  wasNominated,
  memo,
  tokenSize: tokenSizeProp,
  initialX,
  initialY,
  circularPositions,
  onPress,
  onPositionChange,
  onSwap,
  positionIndex,
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
      if (
        circularPositions &&
        circularPositions.length > 0 &&
        onSwap &&
        positionIndex != null
      ) {
        // 가장 가까운 원형 위치를 찾아 스냅
        const curX = translateX.value;
        const curY = translateY.value;
        const closest = circularPositions.reduce(
          (best, pos) => {
            const dx = curX - pos.x;
            const dy = curY - pos.y;
            const dist = dx * dx + dy * dy;
            return dist < best.dist ? { dist, index: pos.index } : best;
          },
          { dist: Number.MAX_SAFE_INTEGER, index: positionIndex },
        );
        const closestIdx = closest.index;
        if (closestIdx !== positionIndex) {
          runOnJS(onSwap)(positionIndex, closestIdx);
        } else {
          // 원래 위치로 스냅백
          translateX.value = withSpring(initialX);
          translateY.value = withSpring(initialY);
        }
      } else if (onPositionChange) {
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
          empathNeighbor={empathNeighbor}
          voteIndicator={voteIndicator}
          isPreselected={isPreselected}
          isExecutionCandidate={isExecutionCandidate}
          hasNominated={hasNominated}
          wasNominated={wasNominated}
          memo={memo}
          size={tokenSize}
        />
      </Animated.View>
    </GestureDetector>
  );
}
