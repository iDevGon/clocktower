import type { ComponentProps } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, Vibration, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useGameActions } from '../hooks/useGameActions';
import { useVoteProgress } from '../hooks/useVoteProgress';
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
  const { visible, isMyTurn } = useVoteProgress(300);

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
  const opacityRanges = isMyTurn
    ? VOTE_OPACITY_RANGES_MY_TURN
    : VOTE_OPACITY_RANGES;

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
  const { preselectVote, consentReady } = useGameActions();
  const playerId = usePlayerStore((s) => s.playerId);
  const voteClock = usePlayerStore((s) => s.voteClock);
  const voteCountdown = usePlayerStore((s) => s.voteCountdown);
  const daySubPhase = usePlayerStore((s) => s.daySubPhase);
  const isDefensePhase = daySubPhase === 'defense';
  const votePreselections = usePlayerStore((s) => s.votePreselections);
  const voteConsentReadyIds = usePlayerStore((s) => s.voteConsentReadyIds);
  const gamePlayers = usePlayerStore((s) => s.gamePlayers);
  const isConsentReady = voteConsentReadyIds.includes(playerId);
  const aliveCount = gamePlayers.filter((p) => p.isAlive).length;
  const consentCount = voteConsentReadyIds.length;

  const { canVote, hasPassed, isMyTurn } = useVoteProgress(1000);

  const [, forceUpdate] = useState(0);

  // Periodic re-render for countdown display only
  useEffect(() => {
    if (!voteCountdown) return;
    const interval = setInterval(() => forceUpdate((n) => n + 1), 1000);
    return () => clearInterval(interval);
  }, [voteCountdown]);

  // 카운트다운 계산 (forceUpdate로 매초 리렌더되어 재계산)
  const countdownRemaining = (() => {
    if (!voteCountdown) return 0;
    const elapsed = Date.now() - voteCountdown.startedAt;
    return Math.max(0, Math.ceil((voteCountdown.durationMs - elapsed) / 1000));
  })();

  const isCountingDown = voteCountdown !== null && countdownRemaining > 0;

  // 카운트다운 숫자 변경 시 진동
  const prevCountdownRef = useRef(0);
  useEffect(() => {
    if (
      countdownRemaining > 0 &&
      countdownRemaining !== prevCountdownRef.current
    ) {
      Vibration.vibrate(80);
      prevCountdownRef.current = countdownRemaining;
    }
    if (countdownRemaining === 0) {
      prevCountdownRef.current = 0;
    }
  }, [countdownRemaining]);

  // Vibrate once when the clock hand reaches the player's voting position
  const hasVibratedRef = useRef(false);
  useEffect(() => {
    if (canVote && !hasVibratedRef.current) {
      Vibration.vibrate([0, 200, 100, 200]);
      hasVibratedRef.current = true;
    }
    if (!canVote && !voteClock) {
      hasVibratedRef.current = false;
    }
  }, [canVote, voteClock]);

  const myPreselection = votePreselections[playerId] ?? null;

  const handleToggle = () => {
    const newValue = myPreselection === true ? null : true;
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
          <Pressable
            style={[
              styles.consentButton,
              isConsentReady && styles.consentButtonReady,
            ]}
            onPress={() => consentReady(!isConsentReady)}
            accessibilityLabel="투표 준비 완료"
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.consentText,
                isConsentReady && styles.consentTextReady,
              ]}
            >
              {isConsentReady ? '✓ 투표 준비 완료' : '투표 준비 완료'}
            </Text>
          </Pressable>
          <Text style={styles.consentCount}>
            {consentCount}/{aliveCount}명 준비 완료
          </Text>
        </View>
      )}

      {!isDefensePhase && isCountingDown && (
        <View style={styles.countdownContainer}>
          <Text style={styles.countdownMessage}>잠시 후 투표가 시작됩니다</Text>
          <Text style={styles.countdownNumber}>{countdownRemaining}</Text>
          <Text style={styles.countdownHint}>
            아래 버튼으로 미리 투표 의사를 밝혀두세요!
          </Text>
        </View>
      )}

      {!isDefensePhase && !isCountingDown && <VoteClockRing />}

      {/* Vote buttons — available during countdown AND active voting (not during defense) */}
      {!isDefensePhase && (isCountingDown || canVote) && !hasPassed ? (
        <>
          <Text style={styles.description}>
            {isCountingDown
              ? '손을 들어 투표에 참여하세요.'
              : isMyTurn
                ? '시계 바늘이 지나가기 전에 손을 드세요!'
                : '투표 버튼을 눌러 투표 의사를 밝힐 수 있습니다.'}
          </Text>
          <Pressable
            style={[
              styles.guiltyButton,
              myPreselection === true && styles.guiltyButtonSelected,
            ]}
            onPress={handleToggle}
            accessibilityLabel="찬성 투표"
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.guiltyText,
                myPreselection === true && styles.guiltyTextSelected,
              ]}
            >
              ✋🏻 찬성
            </Text>
          </Pressable>
          {myPreselection == null && (
            <Text style={styles.noSelectionHint}>
              미선택 시 불참으로 처리됩니다
            </Text>
          )}
        </>
      ) : !isCountingDown ? (
        <View style={styles.votedContainer}>
          <Text style={styles.votedSubtext}>
            {hasPassed
              ? '투표 완료. 결과를 기다리는 중…'
              : '다른 플레이어의 투표를 기다리는 중…'}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
