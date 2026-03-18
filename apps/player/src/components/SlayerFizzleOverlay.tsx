import { getRandomGameTip } from '@clocktower/shared';
import { FullScreenVignette, GameTip } from '@clocktower/ui';
import { useEffect, useMemo, useState } from 'react';
import { Dimensions, Pressable, Text, Vibration, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useConnectionStore } from '../stores/connectionStore';
import { usePlayerStore } from '../stores/playerStore';
import { BaseOverlay } from './BaseOverlay';
import { styles } from './SlayerFizzleOverlay.styles';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── Smoke particles (rising and dissolving) ──

function SmokeWisp({ index }: { index: number }) {
  const progress = useSharedValue(0);
  const centerX = SCREEN_WIDTH / 2;
  const startX =
    centerX + (((index * 37 + 11) % 80) - 40) * (SCREEN_WIDTH / 200);
  const startY = SCREEN_HEIGHT * 0.48 + (index % 5) * 15;
  const driftX = (index % 2 === 0 ? 1 : -1) * (8 + (index % 7) * 5);
  const size = 6 + (index % 4) * 4;
  const delay = (index * 280) % 2800;
  const duration = 2800 + (index % 5) * 500;

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration, easing: Easing.out(Easing.cubic) }),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(progress);
  }, [progress, delay, duration]);

  const style = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          progress.value,
          [0, 1],
          [0, -SCREEN_HEIGHT * 0.25],
        ),
      },
      {
        translateX: interpolate(
          progress.value,
          [0, 0.3, 0.6, 1],
          [0, driftX * 0.3, driftX * 0.8, driftX * 1.4],
        ),
      },
      {
        scale: interpolate(
          progress.value,
          [0, 0.15, 0.4, 0.7, 1],
          [0.2, 1, 1.8, 2.5, 3],
        ),
      },
    ],
    opacity: interpolate(
      progress.value,
      [0, 0.1, 0.3, 0.6, 1],
      [0, 0.35, 0.25, 0.1, 0],
    ),
  }));

  const colors = ['#6a7a8a', '#7a8a98', '#5a6a7a', '#8090a0', '#4a5a6a'];
  const color = colors[index % colors.length];

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: startX,
          top: startY,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

// ── Gun icon with recoil + smoke puff ──

function GunIcon() {
  const recoil = useSharedValue(0);
  const smokeOpacity = useSharedValue(0);

  useEffect(() => {
    // Short recoil kick
    recoil.value = withDelay(
      300,
      withSequence(
        withTiming(-12, { duration: 80, easing: Easing.out(Easing.quad) }),
        withTiming(4, { duration: 120, easing: Easing.out(Easing.back(2)) }),
        withTiming(0, { duration: 200, easing: Easing.out(Easing.quad) }),
      ),
    );
    // Arrow miss — flies right and fades out (반복 테스트)
    smokeOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0, { duration: 1500, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 500 }),
      ),
      -1,
      false,
    );
    return () => {
      cancelAnimation(recoil);
      cancelAnimation(smokeOpacity);
    };
  }, [recoil, smokeOpacity]);

  const bowStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: recoil.value },
      { rotate: `${recoil.value * 0.5}deg` },
    ],
    opacity: interpolate(recoil.value, [-12, -8], [0.8, 1], 'clamp'),
  }));

  const arrowStyle = useAnimatedStyle(() => ({
    opacity: smokeOpacity.value,
    transform: [
      { translateY: interpolate(smokeOpacity.value, [1, 0], [15, -20]) },
      { scale: interpolate(smokeOpacity.value, [1, 0], [0.3, 1.2]) },
    ],
  }));

  return (
    <View style={styles.bowContainer}>
      <Animated.Text style={[styles.bowText, bowStyle]}>
        {'\uD83C\uDFF9'}
      </Animated.Text>
      <Animated.Text style={[styles.arrowText, arrowStyle]}>
        {'\uD83D\uDCAB'}
      </Animated.Text>
    </View>
  );
}

// ── Horizontal dissolve line ──

function DissolveLine() {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      700,
      withSequence(
        withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) }),
        withTiming(0.4, { duration: 800, easing: Easing.inOut(Easing.sin) }),
      ),
    );
    return () => cancelAnimation(progress);
  }, [progress]);

  const style = useAnimatedStyle(() => ({
    width: interpolate(progress.value, [0, 1], [0, SCREEN_WIDTH * 0.55]),
    opacity: interpolate(progress.value, [0, 0.3, 1], [0, 0.8, 0.3]),
  }));

  return (
    <Animated.View
      style={[
        {
          height: 1,
          backgroundColor: '#4a5a6a',
          marginVertical: 18,
          alignSelf: 'center',
        },
        style,
      ]}
    />
  );
}

const SMOKE_COUNT = 8;

// ── Effects layer ──

function FizzleEffects() {
  return (
    <>
      <FullScreenVignette
        color="#080c12"
        opacityRange={[0.6, 0.75]}
        duration={3000}
      />
      {Array.from({ length: SMOKE_COUNT }).map((_, i) => (
        <SmokeWisp key={`s-${i}`} index={i} />
      ))}
    </>
  );
}

// ── Main Overlay ──

interface SlayerFizzleOverlayProps {
  slayerName: string;
  targetName: string;
  isVotePhase: boolean;
  onDismiss: () => void;
}

export function SlayerFizzleOverlay({
  slayerName,
  targetName,
  isVotePhase,
  onDismiss,
}: SlayerFizzleOverlayProps) {
  const role = usePlayerStore((s) => s.role);
  const tip = useMemo(
    () => getRandomGameTip('general', role?.id, role?.team),
    [role?.id, role?.team],
  );
  const [acked, setAcked] = useState(false);

  useEffect(() => {
    // Muffled vibration — a dull thud, not a sharp crack
    Vibration.vibrate([0, 60, 80, 40]);
  }, []);

  const handleConfirm = () => {
    if (isVotePhase) {
      if (acked) return;
      setAcked(true);
      const socket = useConnectionStore.getState().socket;
      socket?.emit('slayer:ack');
    } else {
      onDismiss();
    }
  };

  return (
    <BaseOverlay
      backgroundColor="#060a10"
      zIndex={94}
      effectsLayer={<FizzleEffects />}
      onDismiss={isVotePhase ? undefined : onDismiss}
    >
      <View style={styles.content}>
        <GunIcon />

        <Animated.Text
          entering={FadeIn.delay(500).duration(500)}
          style={styles.label}
        >
          {'\uBD88\uBC1C'}
        </Animated.Text>

        <DissolveLine />

        <Animated.Text
          entering={FadeIn.delay(800).duration(600)}
          style={styles.nameText}
        >
          {slayerName}
        </Animated.Text>

        <Animated.View
          entering={FadeIn.delay(1000).duration(500)}
          style={styles.targetBadge}
        >
          <Text style={styles.targetLabel}>{targetName}에게 발사</Text>
        </Animated.View>

        <Animated.Text
          entering={FadeIn.delay(1300).duration(700)}
          style={styles.fizzleText}
        >
          화살이 발사되었으나{'\n'}아무 일도 일어나지 않았습니다
        </Animated.Text>

        <Animated.View
          entering={FadeIn.delay(1800).duration(600)}
          style={styles.hintBadge}
        >
          <Text style={styles.hintText}>
            {'처단자가 아님 · 대상이 악마가 아님 · 능력 무효'}
          </Text>
        </Animated.View>

        <GameTip tip={tip} color="#3e4e5e" delay={2000} />

        <Animated.View entering={FadeIn.delay(2200).duration(500)}>
          <Pressable
            style={[styles.confirmButton, acked && styles.confirmButtonAcked]}
            onPress={handleConfirm}
          >
            <Text
              style={[styles.confirmText, acked && styles.confirmTextAcked]}
            >
              {acked ? '대기 중...' : '확인'}
            </Text>
          </Pressable>
        </Animated.View>

        {acked && (
          <Animated.Text
            entering={FadeIn.duration(400)}
            style={styles.waitingHint}
          >
            다른 플레이어를 기다리는 중
          </Animated.Text>
        )}
      </View>
    </BaseOverlay>
  );
}
