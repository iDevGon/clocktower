import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, Vibration, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type { ComponentProps } from 'react';
import { useGameActions } from '../hooks/useGameActions';
import { usePlayerStore } from '../stores/playerStore';
import { EdgeVignette } from './EdgeVignette';
import { VoteClockRing } from './VoteClockRing';
import { styles } from './VotePrompt.styles';

type EVColors = ComponentProps<typeof EdgeVignette>['colors'];

const VOTE_COLORS_DEFAULT: EVColors = {
  top: {
    stops: [
      'rgba(170,30,30,0.9)',
      'rgba(140,25,25,0.5)',
      'rgba(100,18,18,0.2)',
      'rgba(60,10,10,0.06)',
      'transparent',
    ],
    locations: [0, 0.2, 0.45, 0.7, 1],
  },
  bottom: {
    stops: [
      'rgba(150,25,25,0.85)',
      'rgba(120,20,20,0.45)',
      'rgba(80,14,14,0.18)',
      'rgba(50,8,8,0.05)',
      'transparent',
    ],
    locations: [0, 0.2, 0.45, 0.7, 1],
  },
  side: {
    stops: [
      'rgba(150,25,25,0.7)',
      'rgba(110,18,18,0.3)',
      'rgba(70,12,12,0.1)',
      'transparent',
    ],
    locations: [0, 0.3, 0.6, 1],
  },
  corner: 'rgba(160,28,28,0.55)',
  borderColor: 'rgba(200,60,60,0.25)',
};

// Golden amber vignette for "my turn" state
const VOTE_COLORS_MY_TURN: EVColors = {
  top: {
    stops: [
      'rgba(212,160,48,0.92)',
      'rgba(180,130,30,0.5)',
      'rgba(140,100,20,0.2)',
      'rgba(90,65,10,0.06)',
      'transparent',
    ],
    locations: [0, 0.2, 0.45, 0.7, 1],
  },
  bottom: {
    stops: [
      'rgba(200,150,40,0.85)',
      'rgba(160,120,28,0.45)',
      'rgba(120,85,18,0.18)',
      'rgba(70,50,8,0.05)',
      'transparent',
    ],
    locations: [0, 0.2, 0.45, 0.7, 1],
  },
  side: {
    stops: [
      'rgba(200,150,40,0.7)',
      'rgba(150,110,25,0.3)',
      'rgba(100,70,15,0.1)',
      'transparent',
    ],
    locations: [0, 0.3, 0.6, 1],
  },
  corner: 'rgba(212,160,48,0.55)',
  borderColor: 'rgba(240,192,64,0.3)',
};

const VOTE_OPACITY_RANGES = {
  top: [0.45, 0.65] as [number, number],
  bottom: [0.35, 0.55] as [number, number],
  side: [0.25, 0.45] as [number, number],
  border: [0.15, 0.35] as [number, number],
};

const VOTE_OPACITY_RANGES_MY_TURN = {
  top: [0.55, 0.8] as [number, number],
  bottom: [0.45, 0.7] as [number, number],
  side: [0.35, 0.55] as [number, number],
  border: [0.2, 0.45] as [number, number],
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

  const [tick, forceRender] = useState(0);

  // Re-render frequently to track clock hand position for vignette color changes
  useEffect(() => {
    if (!voteClock) return;
    const interval = setInterval(() => forceRender((n) => n + 1), 300);
    return () => clearInterval(interval);
  }, [voteClock]);

  // Compute every render (tick-driven) so vignette color reacts in real-time
  let visible = false;
  let isMyTurn = false;
  if (voteClock && voteOrder?.fullOrder) {
    const fullOrder = voteOrder.fullOrder;
    const totalPlayers = fullOrder.length;
    const nomineeId = voteOrder.nomineeId;
    const nomineeFullIdx = fullOrder.findIndex((p) => p.id === nomineeId);
    const myFullIdx = fullOrder.findIndex((p) => p.id === playerId);

    if (nomineeFullIdx >= 0 && myFullIdx >= 0) {
      const myOffset = (myFullIdx - nomineeFullIdx + totalPlayers) % totalPlayers;
      const myConfirmFraction = myOffset === 0 ? 1 : myOffset / totalPlayers;

      const elapsed = Date.now() - voteClock.startedAt;
      const progress = Math.min(elapsed / voteClock.durationMs, 1);

      const hasPassed = progress >= myConfirmFraction;
      // "My turn" = hand is within my slot (one full slot before confirm point)
      const slotSize = 1 / totalPlayers;
      isMyTurn = !hasPassed && progress >= myConfirmFraction - slotSize;
      visible = !hasPassed;
    }
  }
  // suppress unused-var lint (tick drives re-renders)
  void tick;

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

  const colors = isMyTurn ? VOTE_COLORS_MY_TURN : VOTE_COLORS_DEFAULT;
  const opacityRanges = isMyTurn ? VOTE_OPACITY_RANGES_MY_TURN : VOTE_OPACITY_RANGES;

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { zIndex: 79 }, containerStyle]}
      pointerEvents="none"
    >
      <EdgeVignette
        colors={colors}
        opacityRanges={opacityRanges}
        duration={isMyTurn ? 1800 : 2500}
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
  const daySubPhase = usePlayerStore((s) => s.daySubPhase);
  const isDefensePhase = daySubPhase === 'defense';
  const voteOrder = usePlayerStore((s) => s.voteOrder);
  const votePreselections = usePlayerStore((s) => s.votePreselections);

  const [tick, forceUpdate] = useState(0);

  // Periodic re-render to track hand position and countdown
  useEffect(() => {
    if (!voteClock && !voteCountdown) return;
    const interval = setInterval(() => forceUpdate((n) => n + 1), 1000);
    return () => clearInterval(interval);
  }, [voteClock, voteCountdown]);

  // 카운트다운 계산
  const countdownRemaining = useMemo(() => {
    if (!voteCountdown) return 0;
    const elapsed = Date.now() - voteCountdown.startedAt;
    return Math.max(0, Math.ceil((voteCountdown.durationMs - elapsed) / 1000));
  }, [voteCountdown, tick]);

  const isCountingDown = voteCountdown !== null && countdownRemaining > 0;

  // 카운트다운 숫자 변경 시 진동
  const prevCountdownRef = useRef(0);
  useEffect(() => {
    if (countdownRemaining > 0 && countdownRemaining !== prevCountdownRef.current) {
      Vibration.vibrate(80);
      prevCountdownRef.current = countdownRemaining;
    }
    if (countdownRemaining === 0) {
      prevCountdownRef.current = 0;
    }
  }, [countdownRemaining]);

  // Compute whether the hand has passed my position and whether it's my turn
  const myVoteState = useMemo(() => {
    if (!voteClock || !voteOrder?.fullOrder) {
      return { canVote: false, hasPassed: false, isMyTurn: false };
    }

    const fullOrder = voteOrder.fullOrder;
    const totalPlayers = fullOrder.length;
    const nomineeId = voteOrder.nomineeId;
    const nomineeFullIdx = fullOrder.findIndex((p) => p.id === nomineeId);
    const myFullIdx = fullOrder.findIndex((p) => p.id === playerId);

    if (nomineeFullIdx < 0 || myFullIdx < 0) {
      return { canVote: false, hasPassed: false, isMyTurn: false };
    }

    const myOffset = (myFullIdx - nomineeFullIdx + totalPlayers) % totalPlayers;
    // nominee confirms at 360 (end of rotation)
    const myConfirmFraction = myOffset === 0 ? 1 : myOffset / totalPlayers;

    const elapsed = Date.now() - voteClock.startedAt;
    const progress = Math.min(elapsed / voteClock.durationMs, 1);

    const hasPassed = progress >= myConfirmFraction;
    // My turn = hand is within my slot (half slot before ~ confirm point)
    const slotFraction = 1 / totalPlayers;
    const isMyTurn = !hasPassed && progress >= myConfirmFraction - slotFraction;
    return { canVote: !hasPassed, hasPassed, isMyTurn };
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

  const handleToggleAlways = (guilty: boolean) => {
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

      {isDefensePhase && (
        <View style={styles.countdownContainer}>
          <Text style={styles.countdownMessage}>변론 중</Text>
          <Text style={styles.countdownHint}>
            {nomineeName}의 변론을 들어보세요
          </Text>
        </View>
      )}

      {!isDefensePhase && isCountingDown && (
        <View style={styles.countdownContainer}>
          <Text style={styles.countdownMessage}>잠시 후 투표가 시작됩니다</Text>
          <Text style={styles.countdownNumber}>{countdownRemaining}</Text>
          <Text style={styles.countdownHint}>
            아래 버튼으로 미리 찬반을 선택해두세요!
          </Text>
        </View>
      )}

      {!isDefensePhase && !isCountingDown && <VoteClockRing />}

      {/* Vote buttons — available during countdown AND active voting (not during defense) */}
      {!isDefensePhase && (isCountingDown || myVoteState.canVote) && !myVoteState.hasPassed ? (
        <>
          <Text style={styles.description}>
            {isCountingDown
              ? '미리 찬반을 선택할 수 있습니다.'
              : myVoteState.isMyTurn
                ? '시계 바늘이 지나가기 전에 찬반을 선택하세요.'
                : '차례가 되기 전에 투표 버튼을 눌러 투표 의사를 밝힐 수 있습니다.'}
          </Text>
          <View style={styles.buttonRow}>
            <Pressable
              style={[
                styles.guiltyButton,
                myPreselection === true && styles.guiltyButtonSelected,
              ]}
              onPress={() => handleToggleAlways(true)}
            >
              <Text
                style={[
                  styles.guiltyText,
                  myPreselection === true && styles.guiltyTextSelected,
                ]}
              >
                찬성
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.innocentButton,
                myPreselection === false && styles.innocentButtonSelected,
              ]}
              onPress={() => handleToggleAlways(false)}
            >
              <Text
                style={[
                  styles.innocentText,
                  myPreselection === false && styles.innocentTextSelected,
                ]}
              >
                반대
              </Text>
            </Pressable>
          </View>
          {myPreselection == null && (
            <Text style={styles.noSelectionHint}>
              미선택 시 반대로 처리됩니다
            </Text>
          )}
        </>
      ) : !isCountingDown ? (
        <View style={styles.votedContainer}>
          <Text style={styles.votedSubtext}>
            {myVoteState.hasPassed
              ? '투표 완료. 결과를 기다리는 중...'
              : '다른 플레이어의 투표를 기다리는 중...'}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
