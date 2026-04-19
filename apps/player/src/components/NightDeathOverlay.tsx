import { getRandomGameTip } from '@clocktower/shared';
import { colors, FullScreenVignette, GameTip, Ornament } from '@clocktower/ui';
import { useEffect, useMemo } from 'react';
import { Text, Vibration, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { usePlayerStore } from '../stores/playerStore';
import { BaseOverlay } from './BaseOverlay';
import { CandleDying } from './CandleDying';
import { styles as s } from './NightDeathOverlay.styles';

function NightDeathEffects() {
  return (
    <FullScreenVignette
      color={colors.ink.void}
      opacityRange={[0.55, 0.8]}
      duration={2600}
    />
  );
}

interface NightDeathOverlayProps {
  deaths: Array<{ id: string; name: string }>;
  onDismiss: () => void;
}

export function NightDeathOverlay({
  deaths,
  onDismiss,
}: NightDeathOverlayProps) {
  const role = usePlayerStore((st) => st.role);
  const tip = useMemo(
    () => getRandomGameTip('day', role?.id, role?.team),
    [role?.id, role?.team],
  );

  useEffect(() => {
    Vibration.vibrate([0, 180, 100, 280]);
  }, []);

  const noDeaths = deaths.length === 0;
  const autoDismissMs = noDeaths ? 4200 : 3200 + deaths.length * 700;
  const dismissDelayMs = noDeaths ? 1200 : 900 + deaths.length * 300;

  return (
    <BaseOverlay
      backgroundColor={colors.ink.void}
      zIndex={88}
      effectsLayer={<NightDeathEffects />}
      onDismiss={onDismiss}
      dismissOnBackdropPress
      dismissDelayMs={dismissDelayMs}
      autoDismissMs={autoDismissMs}
      fadeOutDurationMs={800}
    >
      <View style={s.content}>
        {/* 조각 촛불 — 여러 명 사망 시 촛불 하나, 그 아래 이름들 */}
        <CandleDying
          size={70}
          dieDelay={300}
          dieDuration={noDeaths ? 2000 : 1400}
        />

        <Animated.Text
          entering={FadeIn.delay(800).duration(600)}
          style={s.eyebrow}
        >
          간밤의 소식
        </Animated.Text>

        <Animated.View entering={FadeIn.delay(1000).duration(500)}>
          <Ornament kind="divider" width={180} color={colors.edge.strong} />
        </Animated.View>

        {noDeaths ? (
          <Animated.Text
            entering={FadeIn.delay(1200).duration(700)}
            style={s.noDeathText}
          >
            밤은 고요히 지났습니다
          </Animated.Text>
        ) : (
          <View style={s.deathList}>
            {deaths.map((death, i) => (
              <Animated.View
                key={death.id}
                entering={FadeIn.delay(1200 + i * 280).duration(600)}
                style={s.deathRow}
              >
                <Text style={s.deathName}>{death.name}</Text>
                <Text style={s.deathSuffix}>— 잠들었다</Text>
              </Animated.View>
            ))}
          </View>
        )}

        <Animated.View entering={FadeIn.delay(1500).duration(500)}>
          <Ornament kind="divider" width={180} color={colors.edge.strong} />
        </Animated.View>

        <GameTip
          tip={tip}
          color={colors.parchment.low}
          delay={dismissDelayMs}
        />

        <Animated.Text
          entering={FadeIn.delay(dismissDelayMs + 200).duration(500)}
          style={s.dismissHint}
        >
          터치하여 닫기
        </Animated.Text>
      </View>
    </BaseOverlay>
  );
}
