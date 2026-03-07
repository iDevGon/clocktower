import type { NightFeedbackPayload, Role } from '@clocktower/shared';
import { Pressable, Text, View } from 'react-native';
import type { NightProgress as NightProgressData } from '../stores/playerStore';
import { styles } from '../styles/game.styles';
import { NightActionPrompt } from './NightActionPrompt';
import { NightProgress } from './NightProgress';

interface SetupPhaseProps {
  visible: boolean;
}

export function SetupPhase({ visible }: SetupPhaseProps) {
  if (!visible) return null;
  return (
    <View style={styles.phaseContentLarge}>
      <Text style={styles.setupTitle}>게임 시작을 기다리는 중...</Text>
      <Text style={styles.setupSubtitle}>
        진행자가 게임을 준비하고 있습니다
      </Text>
    </View>
  );
}

interface NightPhaseProps {
  visible: boolean;
  nightProgress: NightProgressData | null;
  role: Role | null;
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
  isMyTurn,
  playerId,
  nightActionSubmitted,
  nightFeedback,
  onSubmitNightAction,
}: NightPhaseProps) {
  if (!visible) return null;
  return (
    <View style={styles.phaseContent}>
      <Text style={styles.nightTitle}>밤이 찾아옵니다</Text>
      <Text style={styles.phaseDescription}>
        눈을 감으세요. 능력이 발동되면 진동으로 알려드립니다.
      </Text>
      {nightProgress && (
        <NightProgress
          activeRoleId={nightProgress.activeRoleId}
          order={nightProgress.order}
          myRole={role}
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

interface WhisperPhaseProps {
  visible: boolean;
  totalUnread: number;
  onOpenWhisper: () => void;
}

export function WhisperPhase({
  visible,
  totalUnread,
  onOpenWhisper,
}: WhisperPhaseProps) {
  if (!visible) return null;
  return (
    <View style={styles.phaseContent}>
      <Text style={styles.dayTitle}>밀담 시간</Text>
      <Text style={styles.phaseDescription}>
        다른 플레이어와 자유롭게 대화하세요.
      </Text>
      <Pressable style={styles.whisperButton} onPress={onOpenWhisper}>
        <Text style={styles.whisperButtonText}>밀담</Text>
        {totalUnread > 0 && (
          <View style={styles.whisperBadge}>
            <Text style={styles.whisperBadgeText}>{totalUnread}</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

interface DiscussionPhaseProps {
  visible: boolean;
}

export function DiscussionPhase({ visible }: DiscussionPhaseProps) {
  if (!visible) return null;
  return (
    <View style={styles.phaseContent}>
      <Text style={styles.dayTitle}>공개 토론</Text>
      <Text style={styles.phaseDescription}>
        마을 사람들과 공개적으로 토론하세요.{'\n'}정보를 공유하고, 의심하고,
        변호하세요.
      </Text>
    </View>
  );
}

interface NominationPhaseProps {
  visible: boolean;
  isAlive: boolean;
  hasNominatedToday: boolean;
  onOpenNominate: () => void;
}

export function NominationPhase({
  visible,
  isAlive,
  hasNominatedToday,
  onOpenNominate,
}: NominationPhaseProps) {
  if (!visible) return null;
  return (
    <View style={styles.phaseContent}>
      <Text style={styles.dayTitle}>지목</Text>
      <Text style={styles.phaseDescription}>
        처형할 플레이어를 지목하세요.{'\n'}하루에 한 번 지목할 수 있습니다.
      </Text>
      {isAlive && !hasNominatedToday && (
        <Pressable style={styles.nominateButton} onPress={onOpenNominate}>
          <Text style={styles.nominateButtonText}>지목하기</Text>
        </Pressable>
      )}
      {isAlive && hasNominatedToday && (
        <View style={styles.nominatedBadge}>
          <Text style={styles.nominatedText}>오늘 지목을 사용했습니다</Text>
        </View>
      )}
      {!isAlive && (
        <Text style={styles.phaseDescriptionSub}>
          사망한 플레이어는 지목할 수 없습니다.
        </Text>
      )}
    </View>
  );
}

interface EndedPhaseProps {
  visible: boolean;
  hasVoteResult: boolean;
}

export function EndedPhase({ visible, hasVoteResult }: EndedPhaseProps) {
  if (!visible) return null;
  return (
    <View style={styles.phaseContentLarge}>
      <Text style={styles.endedTitle}>게임 종료</Text>
      {hasVoteResult && (
        <Text style={styles.phaseDescription}>게임이 끝났습니다.</Text>
      )}
    </View>
  );
}
