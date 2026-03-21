import {
  type ExecutionAnnouncement,
  getRandomGameTip,
} from '@clocktower/shared';
import { FullScreenVignette, GameTip } from '@clocktower/ui';
import { useEffect, useMemo } from 'react';
import { Dimensions, Text, Vibration, View } from 'react-native';
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
import { usePlayerStore } from '../stores/playerStore';
import { BaseOverlay } from './BaseOverlay';
import { styles as s } from './ExecutionOverlay.styles';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const REASON_ICONS: Record<string, string> = {
  execution: '\u2696\uFE0F',
  virgin: '\uD83D\uDC7C',
  slayer: '\uD83C\uDFF9',
};

const REASON_TITLES: Record<string, string> = {
  execution: '\uCC98\uD615',
  virgin: '\uC131\uB140\uC758 \uC2EC\uD310',
  slayer: '\uC0AC\uB0E5\uAFBC\uC758 \uC120\uC5B8',
};

// ── Axe swing animation ──

function AxeIcon() {
  const swing = useSharedValue(0);

  useEffect(() => {
    swing.value = withSequence(
      withTiming(-25, { duration: 0 }),
      withDelay(
        200,
        withSequence(
          withTiming(15, {
            duration: 400,
            easing: Easing.out(Easing.back(1.5)),
          }),
          withTiming(-5, { duration: 200, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 150, easing: Easing.out(Easing.quad) }),
        ),
      ),
    );
    return () => cancelAnimation(swing);
  }, [swing]);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${swing.value}deg` }],
    opacity: interpolate(swing.value, [-25, -20], [0, 1]),
  }));

  return (
    <Animated.Text style={[s.axeText, style]}>{'\u2694\uFE0F'}</Animated.Text>
  );
}

// ── Ember particles (burning/smoldering atmosphere) ──

function Ember({ index }: { index: number }) {
  const progress = useSharedValue(0);
  const startX = ((index * 67 + 23) % 100) * (SCREEN_WIDTH / 100);
  const startY = SCREEN_HEIGHT * (0.5 + (index % 6) * 0.08);
  const driftX = (index % 2 === 0 ? 1 : -1) * (5 + (index % 5) * 6);
  const size = 2 + (index % 3) * 1.5;
  const delay = (index * 200) % 2500;
  const duration = 2000 + (index % 4) * 600;

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration, easing: Easing.out(Easing.quad) }),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(progress);
  }, [progress, delay, duration]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [0, -startY * 0.5]) },
      {
        translateX: interpolate(
          progress.value,
          [0, 0.5, 1],
          [0, driftX, driftX * 2],
        ),
      },
      {
        scale: interpolate(progress.value, [0, 0.2, 0.6, 1], [0, 1.2, 0.8, 0]),
      },
    ],
    opacity: interpolate(progress.value, [0, 0.15, 0.5, 1], [0, 1, 0.6, 0]),
  }));

  const colors = ['#ff6b35', '#ff8c42', '#ffa64d', '#e85d26', '#cc4400'];
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

// ── Strike line (dramatic horizontal slash) ──

function StrikeLine() {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withDelay(
      600,
      withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) }),
    );
    return () => cancelAnimation(width);
  }, [width]);

  const style = useAnimatedStyle(() => ({
    width: interpolate(width.value, [0, 1], [0, SCREEN_WIDTH * 0.7]),
    opacity: interpolate(width.value, [0, 0.3, 1], [0, 1, 0.6]),
  }));

  return (
    <Animated.View
      style={[
        {
          height: 1,
          backgroundColor: '#8b3a00',
          marginVertical: 20,
          alignSelf: 'center',
        },
        style,
      ]}
    />
  );
}

const EMBER_COUNT = 16;

// ── Effects layer ──

function ExecutionEffects() {
  return (
    <>
      <FullScreenVignette
        color="#0d0500"
        opacityRange={[0.5, 0.7]}
        duration={2500}
      />
      {Array.from({ length: EMBER_COUNT }).map((_, i) => (
        <Ember key={`e-${i}`} index={i} />
      ))}
    </>
  );
}

// ── Main Overlay ──

interface ExecutionOverlayProps {
  announcement: ExecutionAnnouncement;
  onDismiss: () => void;
}

export function ExecutionOverlay({
  announcement,
  onDismiss,
}: ExecutionOverlayProps) {
  const role = usePlayerStore((s) => s.role);
  const tip = useMemo(
    () => getRandomGameTip('vote', role?.id, role?.team),
    [role?.id, role?.team],
  );

  useEffect(() => {
    Vibration.vibrate([0, 150, 100, 250]);
  }, []);

  const icon = REASON_ICONS[announcement.reason] ?? '\u2696\uFE0F';
  const title = REASON_TITLES[announcement.reason] ?? '\uCC98\uD615';

  return (
    <BaseOverlay
      backgroundColor="#0a0300"
      zIndex={95}
      effectsLayer={<ExecutionEffects />}
      onDismiss={onDismiss}
      dismissOnBackdropPress
      dismissDelayMs={2000}
      autoDismissMs={5000}
      fadeOutDurationMs={800}
    >
      <View style={s.content}>
        <AxeIcon />

        <Animated.Text
          entering={FadeIn.delay(400).duration(500)}
          style={s.label}
        >
          {title}
        </Animated.Text>

        <StrikeLine />

        <Animated.Text
          entering={FadeIn.delay(700).duration(600)}
          style={s.nameText}
        >
          {announcement.executedName}
        </Animated.Text>

        <Animated.View
          entering={FadeIn.delay(900).duration(500)}
          style={s.reasonBadge}
        >
          <Text style={s.reasonIcon}>{icon}</Text>
          <Text style={s.reasonText}>{announcement.detail}</Text>
        </Animated.View>

        <Animated.Text
          entering={FadeIn.delay(1200).duration(600)}
          style={s.deathText}
        >
          {'\uCC98\uD615\uB418\uC5C8\uC2B5\uB2C8\uB2E4'}
        </Animated.Text>

        <GameTip tip={tip} color="#c47070" glowColor="#8b2020" delay={1600} />

        <Animated.Text
          entering={FadeIn.delay(2000).duration(500)}
          style={s.dismissHint}
        >
          터치하여 닫기
        </Animated.Text>
      </View>
    </BaseOverlay>
  );
}
