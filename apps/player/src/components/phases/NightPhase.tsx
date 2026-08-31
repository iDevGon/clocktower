import type {
  GamblerGuessStatus,
  NightFeedbackPayload,
  Role,
} from '@clocktower/shared';
import { Text, View } from 'react-native';
import type { NightProgress as NightProgressData } from '../../stores/playerStore';
import { usePlayerStore } from '../../stores/playerStore';
import { styles } from '../../styles/game.styles';
import { NightActionPrompt } from '../NightActionPrompt';

interface NightPhaseProps {
  visible: boolean;
  nightProgress: NightProgressData | null;
  role: Role | null;
  isMyTurn: boolean;
  playerId: string;
  nightActionSubmitted: boolean;
  nightFeedback: NightFeedbackPayload | null;
  onSubmitNightAction: (targets: string[]) => void;
  philosopherGrantedRoleId?: string | null;
  onChoosePhilosopherRole?: (roleId: string) => Promise<void> | void;
  gamblerRoles: Role[];
  gamblerGuessStatus: GamblerGuessStatus;
  onSubmitGamblerGuess: (
    targetPlayerId: string,
    guessedRoleId: string,
  ) => Promise<{ success: boolean; error?: string }>;
}

export function NightPhase({
  visible,
  nightProgress,
  role,
  isMyTurn,
  playerId,
  nightActionSubmitted,
  nightFeedback,
  onSubmitNightAction,
  philosopherGrantedRoleId,
  onChoosePhilosopherRole,
  gamblerRoles,
  gamblerGuessStatus,
  onSubmitGamblerGuess,
}: NightPhaseProps) {
  const isDead = !usePlayerStore((s) => s.isAlive);
  if (!visible) return null;
  return (
    <View style={styles.phaseContent}>
      <Text style={[styles.nightTitle, isDead && styles.nightTitleDead]}>
        밤이 찾아옵니다
      </Text>
      <Text style={styles.phaseDescription}>
        눈을 감으세요. 능력이 발동되면 진동으로 알려드립니다.
      </Text>
      {isMyTurn && role && nightProgress && (
        <NightActionPrompt
          role={role}
          players={nightProgress.players}
          myPlayerId={playerId}
          submitted={nightActionSubmitted}
          feedback={nightFeedback}
          onSubmit={onSubmitNightAction}
          philosopherGrantedRoleId={philosopherGrantedRoleId}
          onChoosePhilosopherRole={onChoosePhilosopherRole}
          gamblerRoles={gamblerRoles}
          gamblerGuessStatus={gamblerGuessStatus}
          onSubmitGamblerGuess={onSubmitGamblerGuess}
        />
      )}
    </View>
  );
}
