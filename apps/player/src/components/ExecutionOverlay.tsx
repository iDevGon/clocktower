import {
  type ExecutionAnnouncement,
  getRandomGameTip,
} from '@clocktower/shared';
import {
  colors,
  FullScreenVignette,
  GameTip,
  Ornament,
  WaxSeal,
} from '@clocktower/ui';
import { useEffect, useMemo } from 'react';
import { Vibration, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { usePlayerStore } from '../stores/playerStore';
import { BaseOverlay } from './BaseOverlay';
import { CandleDying } from './CandleDying';
import { styles as s } from './ExecutionOverlay.styles';

type ReasonKey = 'execution' | 'virgin' | 'slayer' | string;

const REASON_TITLES: Record<string, string> = {
  execution: '처형',
  virgin: '성녀의 심판',
  slayer: '사냥꾼의 선언',
};

const REASON_SEAL: Record<
  ReasonKey,
  {
    tone: 'crimson' | 'amber' | 'twilight' | 'verdure' | 'bruise';
    glyph: 'star' | 'moon' | 'clock' | 'lily' | 'bat';
  }
> = {
  execution: { tone: 'crimson', glyph: 'bat' },
  virgin: { tone: 'twilight', glyph: 'lily' },
  slayer: { tone: 'amber', glyph: 'star' },
};

function ExecutionEffects() {
  return (
    <FullScreenVignette
      color={colors.crimson.deep}
      opacityRange={[0.25, 0.55]}
      duration={2800}
    />
  );
}

interface ExecutionOverlayProps {
  announcement: ExecutionAnnouncement;
  onDismiss: () => void;
}

export function ExecutionOverlay({
  announcement,
  onDismiss,
}: ExecutionOverlayProps) {
  const role = usePlayerStore((st) => st.role);
  const tip = useMemo(
    () => getRandomGameTip('vote', role?.id, role?.team),
    [role?.id, role?.team],
  );

  useEffect(() => {
    Vibration.vibrate([0, 140, 100, 220]);
  }, []);

  const title = REASON_TITLES[announcement.reason] ?? '처형';
  const sealCfg = REASON_SEAL[announcement.reason] ?? REASON_SEAL.execution;

  return (
    <BaseOverlay
      backgroundColor={colors.ink.void}
      zIndex={95}
      effectsLayer={<ExecutionEffects />}
      onDismiss={onDismiss}
      dismissOnBackdropPress
      dismissDelayMs={2000}
      autoDismissMs={5400}
      fadeOutDurationMs={800}
    >
      <View style={s.content}>
        {/* 촛불 꺼짐 */}
        <CandleDying size={90} dieDelay={500} dieDuration={1500} />

        <Animated.Text
          entering={FadeIn.delay(900).duration(500)}
          style={s.eyebrow}
        >
          {title.toUpperCase()}
        </Animated.Text>

        <Animated.View entering={FadeIn.delay(1100).duration(500)}>
          <Ornament kind="divider" width={160} color={colors.crimson.deep} />
        </Animated.View>

        <Animated.Text
          entering={FadeIn.delay(1300).duration(600)}
          style={s.nameText}
        >
          {announcement.executedName}
        </Animated.Text>

        {/* 봉인 스탬프 */}
        <Animated.View
          entering={ZoomIn.delay(1600).duration(400)}
          style={s.seal}
        >
          <WaxSeal size={52} tone={sealCfg.tone} glyph={sealCfg.glyph} />
        </Animated.View>

        <Animated.Text
          entering={FadeIn.delay(1900).duration(500)}
          style={s.detailText}
        >
          {announcement.detail}
        </Animated.Text>

        <Animated.Text
          entering={FadeIn.delay(2200).duration(600)}
          style={s.verdict}
        >
          처형되었습니다
        </Animated.Text>

        <GameTip tip={tip} color={colors.crimson.glow} delay={2600} />

        <Animated.Text
          entering={FadeIn.delay(3000).duration(500)}
          style={s.dismissHint}
        >
          터치하여 닫기
        </Animated.Text>
      </View>
    </BaseOverlay>
  );
}
