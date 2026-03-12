import { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, Vibration, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useGameActions } from '../hooks/useGameActions';
import { usePlayerStore } from '../stores/playerStore';
import { VoteClockRing } from './VoteClockRing';
import { styles } from './VotePrompt.styles';

const { width: SW, height: SH } = Dimensions.get('window');
const VIGNETTE_EDGE_H = SH * 0.12;
const VIGNETTE_SIDE_W = SW * 0.08;

const vignetteStyles = StyleSheet.create({
  edgeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: VIGNETTE_EDGE_H,
    zIndex: 80,
  },
  edgeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: VIGNETTE_EDGE_H,
    zIndex: 80,
  },
  edgeLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: VIGNETTE_SIDE_W,
    zIndex: 80,
  },
  edgeRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: VIGNETTE_SIDE_W,
    zIndex: 80,
  },
  gradLayer: {
    position: 'absolute',
  },
  innerBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderColor: 'rgba(232,196,74,0.5)',
    zIndex: 81,
  },
});

/**
 * Gold vignette overlay shown when the player can vote.
 * Self-contained: reads vote state from the player store.
 * Fades in when canVote becomes true and pulses gently.
 */
export function VoteVignette() {
  const playerId = usePlayerStore((s) => s.playerId);
  const voteClock = usePlayerStore((s) => s.voteClock);
  const voteOrder = usePlayerStore((s) => s.voteOrder);

  const [, forceRender] = useState(0);

  // Re-render periodically to track clock hand position
  useEffect(() => {
    if (!voteClock) return;
    const interval = setInterval(() => forceRender((n) => n + 1), 200);
    return () => clearInterval(interval);
  }, [voteClock]);

  const visible = useMemo(() => {
    if (!voteClock || !voteOrder?.fullOrder) return false;

    const fullOrder = voteOrder.fullOrder;
    const totalPlayers = fullOrder.length;
    const nomineeId = voteOrder.nomineeId;
    const nomineeFullIdx = fullOrder.findIndex((p) => p.id === nomineeId);
    const myFullIdx = fullOrder.findIndex((p) => p.id === playerId);

    if (nomineeFullIdx < 0 || myFullIdx < 0) return false;

    const myOffset =
      (myFullIdx - nomineeFullIdx + totalPlayers) % totalPlayers;
    const myConfirmFraction = myOffset === 0 ? 1 : myOffset / totalPlayers;

    const elapsed = Date.now() - voteClock.startedAt;
    const progress = Math.min(elapsed / voteClock.durationMs, 1);

    return progress < myConfirmFraction;
  }, [voteClock, voteOrder, playerId]);
  const fadeIn = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      fadeIn.value = withTiming(1, {
        duration: 600,
        easing: Easing.out(Easing.ease),
      });
      pulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
      );
    } else {
      fadeIn.value = withTiming(0, {
        duration: 400,
        easing: Easing.in(Easing.ease),
      });
      cancelAnimation(pulse);
      pulse.value = 0;
    }
  }, [visible, fadeIn, pulse]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    pointerEvents: 'none' as const,
  }));

  const topStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.5, 0.7]),
  }));

  const bottomStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.4, 0.6]),
  }));

  const sideStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.3, 0.5]),
  }));

  const borderStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.3, 0.6]),
  }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { zIndex: 79 }, containerStyle]}
      pointerEvents="none"
    >
      {/* Top edge */}
      <Animated.View
        style={[vignetteStyles.edgeTop, topStyle]}
        pointerEvents="none"
      >
        <Animated.View
          style={[
            vignetteStyles.gradLayer,
            {
              top: 0,
              height: '40%',
              left: 0,
              right: 0,
              backgroundColor: 'rgba(180,140,20,0.85)',
            },
          ]}
        />
        <Animated.View
          style={[
            vignetteStyles.gradLayer,
            {
              top: '40%',
              height: '30%',
              left: 0,
              right: 0,
              backgroundColor: 'rgba(140,100,10,0.45)',
            },
          ]}
        />
        <Animated.View
          style={[
            vignetteStyles.gradLayer,
            {
              top: '70%',
              height: '30%',
              left: 0,
              right: 0,
              backgroundColor: 'rgba(100,70,5,0.15)',
            },
          ]}
        />
      </Animated.View>

      {/* Bottom edge */}
      <Animated.View
        style={[vignetteStyles.edgeBottom, bottomStyle]}
        pointerEvents="none"
      >
        <Animated.View
          style={[
            vignetteStyles.gradLayer,
            {
              bottom: 0,
              height: '40%',
              left: 0,
              right: 0,
              backgroundColor: 'rgba(160,120,15,0.8)',
            },
          ]}
        />
        <Animated.View
          style={[
            vignetteStyles.gradLayer,
            {
              bottom: '40%',
              height: '30%',
              left: 0,
              right: 0,
              backgroundColor: 'rgba(120,90,10,0.4)',
            },
          ]}
        />
        <Animated.View
          style={[
            vignetteStyles.gradLayer,
            {
              bottom: '70%',
              height: '30%',
              left: 0,
              right: 0,
              backgroundColor: 'rgba(80,60,5,0.12)',
            },
          ]}
        />
      </Animated.View>

      {/* Left edge */}
      <Animated.View
        style={[vignetteStyles.edgeLeft, sideStyle]}
        pointerEvents="none"
      >
        <Animated.View
          style={[
            vignetteStyles.gradLayer,
            {
              left: 0,
              width: '50%',
              top: 0,
              bottom: 0,
              backgroundColor: 'rgba(160,120,15,0.65)',
            },
          ]}
        />
        <Animated.View
          style={[
            vignetteStyles.gradLayer,
            {
              left: '50%',
              width: '50%',
              top: 0,
              bottom: 0,
              backgroundColor: 'rgba(100,70,5,0.18)',
            },
          ]}
        />
      </Animated.View>

      {/* Right edge */}
      <Animated.View
        style={[vignetteStyles.edgeRight, sideStyle]}
        pointerEvents="none"
      >
        <Animated.View
          style={[
            vignetteStyles.gradLayer,
            {
              right: 0,
              width: '50%',
              top: 0,
              bottom: 0,
              backgroundColor: 'rgba(160,120,15,0.65)',
            },
          ]}
        />
        <Animated.View
          style={[
            vignetteStyles.gradLayer,
            {
              right: '50%',
              width: '50%',
              top: 0,
              bottom: 0,
              backgroundColor: 'rgba(100,70,5,0.18)',
            },
          ]}
        />
      </Animated.View>

      {/* Thin gold inner border */}
      <Animated.View
        style={[vignetteStyles.innerBorder, borderStyle]}
        pointerEvents="none"
      />
    </Animated.View>
  );
}

interface VotePromptProps {
  nominatorName: string;
  nomineeName: string;
}

export function VotePrompt({ nominatorName, nomineeName }: VotePromptProps) {
  const { preselectVote } = useGameActions();
  const playerId = usePlayerStore((s) => s.playerId);
  const voteClock = usePlayerStore((s) => s.voteClock);
  const voteCountdown = usePlayerStore((s) => s.voteCountdown);
  const voteOrder = usePlayerStore((s) => s.voteOrder);
  const votePreselections = usePlayerStore((s) => s.votePreselections);

  const [, forceUpdate] = useState(0);

  // Periodic re-render to track hand position and countdown
  useEffect(() => {
    if (!voteClock && !voteCountdown) return;
    const interval = setInterval(() => forceUpdate((n) => n + 1), 200);
    return () => clearInterval(interval);
  }, [voteClock, voteCountdown]);

  // 카운트다운 계산
  const countdownRemaining = useMemo(() => {
    if (!voteCountdown) return 0;
    const elapsed = Date.now() - voteCountdown.startedAt;
    return Math.max(0, Math.ceil((voteCountdown.durationMs - elapsed) / 1000));
  }, [voteCountdown]);

  const isCountingDown = voteCountdown !== null && countdownRemaining > 0;

  // Compute whether the hand has passed my position
  const myVoteState = useMemo(() => {
    if (!voteClock || !voteOrder?.fullOrder) {
      return { canVote: false, hasPassed: false };
    }

    const fullOrder = voteOrder.fullOrder;
    const totalPlayers = fullOrder.length;
    const nomineeId = voteOrder.nomineeId;
    const nomineeFullIdx = fullOrder.findIndex((p) => p.id === nomineeId);
    const myFullIdx = fullOrder.findIndex((p) => p.id === playerId);

    if (nomineeFullIdx < 0 || myFullIdx < 0) {
      return { canVote: false, hasPassed: false };
    }

    const myOffset = (myFullIdx - nomineeFullIdx + totalPlayers) % totalPlayers;
    // nominee confirms at 360 (end of rotation)
    const myConfirmFraction = myOffset === 0 ? 1 : myOffset / totalPlayers;

    const elapsed = Date.now() - voteClock.startedAt;
    const progress = Math.min(elapsed / voteClock.durationMs, 1);

    const hasPassed = progress >= myConfirmFraction;
    return { canVote: !hasPassed, hasPassed };
  }, [voteClock, voteOrder, playerId]);

  // Vibrate once when the clock hand reaches the player's voting position
  const hasVibratedRef = useRef(false);
  useEffect(() => {
    if (myVoteState.canVote && !hasVibratedRef.current) {
      Vibration.vibrate([0, 200, 100, 200]);
      hasVibratedRef.current = true;
    }
    if (!myVoteState.canVote && !voteClock) {
      hasVibratedRef.current = false;
    }
  }, [myVoteState.canVote, voteClock]);

  const myPreselection = votePreselections[playerId] ?? null;

  const handleToggle = (guilty: boolean) => {
    if (!myVoteState.canVote) return;
    const newValue = myPreselection === guilty ? null : guilty;
    preselectVote(newValue);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.label}>지목 투표</Text>
      <Text style={styles.nominationInfo}>
        <Text style={styles.playerNameHighlight}>{nominatorName}</Text>
        {'(이)가 '}
        <Text style={styles.playerNameHighlight}>{nomineeName}</Text>
        {'(을)를 지목했습니다'}
      </Text>

      {isCountingDown ? (
        <View style={styles.countdownContainer}>
          <Text style={styles.countdownMessage}>
            잠시 후 투표가 시작됩니다
          </Text>
          <Text style={styles.countdownNumber}>{countdownRemaining}</Text>
        </View>
      ) : (
        <>
          <VoteClockRing />
          {myVoteState.canVote ? (
            <>
              <Text style={styles.description}>
                시계 바늘이 지나가기 전에 찬반을 선택하세요.
              </Text>
              <View style={styles.buttonRow}>
                <Pressable
                  style={[
                    styles.guiltyButton,
                    myPreselection === true && styles.guiltyButtonSelected,
                  ]}
                  onPress={() => handleToggle(true)}
                >
                  <Text
                    style={[
                      styles.guiltyText,
                      myPreselection === true && styles.guiltyTextSelected,
                    ]}
                  >
                    유죄
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.innocentButton,
                    myPreselection === false && styles.innocentButtonSelected,
                  ]}
                  onPress={() => handleToggle(false)}
                >
                  <Text
                    style={[
                      styles.innocentText,
                      myPreselection === false && styles.innocentTextSelected,
                    ]}
                  >
                    무죄
                  </Text>
                </Pressable>
              </View>
              {myPreselection == null && (
                <Text style={styles.noSelectionHint}>
                  미선택 시 무죄로 처리됩니다
                </Text>
              )}
            </>
          ) : (
            <View style={styles.votedContainer}>
              <Text style={styles.votedSubtext}>
                {myVoteState.hasPassed
                  ? '투표 완료. 결과를 기다리는 중...'
                  : '다른 플레이어의 투표를 기다리는 중...'}
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}
