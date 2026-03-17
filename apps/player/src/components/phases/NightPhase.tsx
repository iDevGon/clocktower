import type { NightFeedbackPayload, Role } from '@clocktower/shared';
import { Text, View } from 'react-native';
import type { NightProgress as NightProgressData } from '../../stores/playerStore';
import { usePlayerStore } from '../../stores/playerStore';
import { styles } from '../../styles/game.styles';
import { NightActionPrompt } from '../NightActionPrompt';
import { NightProgress } from '../NightProgress';

interface NightPhaseProps {
  visible: boolean;
  nightProgress: NightProgressData | null;
  role: Role | null;
  drunkAs?: string | null;
  isMyTurn: boolean;
  playerId: string;
  nightActionSubmitted: boolean;
  nightFeedback: NightFeedbackPayload | null;
  onSubmitNightAction: (targets: string[]) => void;
}

export function NightPhase({
  visible,
  nightProgress,
  role,
  drunkAs,
  isMyTurn,
  playerId,
  nightActionSubmitted,
  nightFeedback,
  onSubmitNightAction,
}: NightPhaseProps) {
  const isDead = !usePlayerStore((s) => s.isAlive);
  const nightWakeUp = usePlayerStore((s) => s.nightWakeUp);
  if (!visible) return null;
  return (
    <View style={styles.phaseContent}>
      <Text style={[styles.nightTitle, isDead && styles.nightTitleDead]}>
        밤이 찾아옵니다
      </Text>
      <Text style={styles.phaseDescription}>
        눈을 감으세요. 능력이 발동되면 진동으로 알려드립니다.
      </Text>
      {nightProgress && (
        <NightProgress
          activeRoleId={nightProgress.activeRoleId}
          order={nightProgress.order}
          myRole={role}
          drunkAs={drunkAs}
          isAlive={!isDead}
          nightWakeUp={nightWakeUp != null}
        />
      )}
      {isMyTurn && role && nightProgress && (
        <NightActionPrompt
          role={role}
          players={nightProgress.players}
          myPlayerId={playerId}
          submitted={nightActionSubmitted}
          feedback={nightFeedback}
          onSubmit={onSubmitNightAction}
        />
      )}
    </View>
  );
}
