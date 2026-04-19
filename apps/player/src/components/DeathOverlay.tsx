import {
  DEATH_REASON_LABELS,
  type DeathReason,
  getRandomGameTip,
} from '@clocktower/shared';
import { colors, FullScreenVignette, GameTip, Ornament } from '@clocktower/ui';
import { useEffect, useMemo } from 'react';
import { Text, Vibration, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { usePlayerStore } from '../stores/playerStore';
import { BaseOverlay } from './BaseOverlay';
import { CandleDying } from './CandleDying';
import { styles as s } from './DeathOverlay.styles';

const AUTO_DISMISS_MS = 4800;
const FADE_OUT_MS = 800;

interface DeathOverlayProps {
  onDismiss: () => void;
  reason?: DeathReason | null;
}

function DeathEffects() {
  return (
    <FullScreenVignette
      color={colors.crimson.deep}
      opacityRange={[0.25, 0.5]}
      duration={2600}
    />
  );
}

export function DeathOverlay({ onDismiss, reason }: DeathOverlayProps) {
  const role = usePlayerStore((st) => st.role);
  const tip = useMemo(
    () => getRandomGameTip('death', role?.id, role?.team),
    [role?.id, role?.team],
  );

  useEffect(() => {
    Vibration.vibrate([0, 240, 120, 360]);
  }, []);

  return (
    <BaseOverlay
      backgroundColor={colors.ink.void}
      zIndex={90}
      effectsLayer={<DeathEffects />}
      onDismiss={onDismiss}
      autoDismissMs={AUTO_DISMISS_MS}
      fadeOutDurationMs={FADE_OUT_MS}
    >
      <View style={s.content}>
        <CandleDying size={90} dieDelay={400} dieDuration={1600} />

        <Animated.Text
          entering={FadeIn.delay(900).duration(600)}
          style={s.eyebrow}
        >
          불꽃이 꺼지다
        </Animated.Text>

        <Animated.Text
          entering={FadeIn.delay(1200).duration(700)}
          style={s.title}
        >
          그대의 이야기가 끝났습니다
        </Animated.Text>

        <Animated.View entering={FadeIn.delay(1500).duration(500)}>
          <Ornament kind="divider" width={160} color={colors.crimson.deep} />
        </Animated.View>

        {reason ? (
          <Animated.View
            entering={FadeIn.delay(1700).duration(500)}
            style={s.reasonBadge}
          >
            <Text style={s.reasonText}>{DEATH_REASON_LABELS[reason]}</Text>
          </Animated.View>
        ) : null}

        <Animated.Text
          entering={FadeIn.delay(2100).duration(600)}
          style={s.subtitle}
        >
          한 표가 <Text style={s.subtitleEmphasis}>남아 있습니다</Text>
        </Animated.Text>
        <Animated.Text
          entering={FadeIn.delay(2400).duration(600)}
          style={s.subtitleHint}
        >
          신중하게 사용하세요
        </Animated.Text>

        <GameTip tip={tip} color={colors.crimson.glow} delay={2800} />
      </View>
    </BaseOverlay>
  );
}
