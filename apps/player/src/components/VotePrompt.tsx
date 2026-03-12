import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, Vibration, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useGameActions } from '../hooks/useGameActions';
import { usePlayerStore } from '../stores/playerStore';
import { EdgeVignette } from './EdgeVignette';
import { VoteClockRing } from './VoteClockRing';
import { styles } from './VotePrompt.styles';

const VOTE_COLORS = {
  top: [
    { offset: '0%', size: '40%', color: 'rgba(180,140,20,0.85)' },
    { offset: '40%', size: '30%', color: 'rgba(140,100,10,0.45)' },
    { offset: '70%', size: '30%', color: 'rgba(100,70,5,0.15)' },
  ],
  bottom: [
    { offset: '0%', size: '40%', color: 'rgba(160,120,15,0.8)' },
    { offset: '40%', size: '30%', color: 'rgba(120,90,10,0.4)' },
    { offset: '70%', size: '30%', color: 'rgba(80,60,5,0.12)' },
  ],
  side: [
    { offset: '0%', size: '50%', color: 'rgba(160,120,15,0.65)' },
    { offset: '50%', size: '50%', color: 'rgba(100,70,5,0.18)' },
  ],
  borderColor: 'rgba(232,196,74,0.5)',
} as const;

const VOTE_OPACITY_RANGES = {
  top: [0.5, 0.7] as [number, number],
  bottom: [0.4, 0.6] as [number, number],
  side: [0.3, 0.5] as [number, number],
  border: [0.3, 0.6] as [number, number],
};

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

    const myOffset = (myFullIdx - nomineeFullIdx + totalPlayers) % totalPlayers;
    const myConfirmFraction = myOffset === 0 ? 1 : myOffset / totalPlayers;

    const elapsed = Date.now() - voteClock.startedAt;
    const progress = Math.min(elapsed / voteClock.durationMs, 1);

    return progress < myConfirmFraction;
  }, [voteClock, voteOrder, playerId]);

  const fadeIn = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      fadeIn.value = withTiming(1, {
        duration: 600,
        easing: Easing.out(Easing.ease),
      });
    } else {
      fadeIn.value = withTiming(0, {
        duration: 400,
        easing: Easing.in(Easing.ease),
      });
    }
  }, [visible, fadeIn]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    pointerEvents: 'none' as const,
  }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { zIndex: 79 }, containerStyle]}
      pointerEvents="none"
    >
      <EdgeVignette
        colors={VOTE_COLORS}
        opacityRanges={VOTE_OPACITY_RANGES}
        duration={2500}
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
          <Text style={styles.countdownMessage}>잠시 후 투표가 시작됩니다</Text>
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
