import type {
  GameResult,
  NightFeedbackPayload,
  Role,
} from '@clocktower/shared';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { NightProgress as NightProgressData } from '../stores/playerStore';
import { usePlayerStore } from '../stores/playerStore';
import { useWhisperStore } from '../stores/whisperStore';
import { styles } from '../styles/game.styles';
import { NightActionPrompt } from './NightActionPrompt';
import { NightProgress } from './NightProgress';
import {
  endedStyles,
  getPlayerRowOpacity,
  whisperStyles,
} from './PhaseContent.styles';

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
  if (!visible) return null;
  return (
    <View style={styles.phaseContent}>
      <Text style={[styles.nightTitle, isDead && styles.nightTitleDead]}>밤이 찾아옵니다</Text>
      <Text style={styles.phaseDescription}>
        눈을 감으세요. 능력이 발동되면 진동으로 알려드립니다.
      </Text>
      {nightProgress && (
        <NightProgress
          activeRoleId={nightProgress.activeRoleId}
          order={nightProgress.order}
          myRole={role}
          drunkAs={drunkAs}
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

function useWhisperCountdown() {
  const whisperClock = usePlayerStore((s) => s.whisperClock);
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!whisperClock) {
      setRemaining(null);
      return;
    }
    const update = () => {
      const elapsed = Date.now() - whisperClock.startedAt;
      const left = Math.max(
        0,
        Math.ceil((whisperClock.durationMs - elapsed) / 1000),
      );
      setRemaining(left);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [whisperClock]);

  return remaining;
}

interface WhisperPhaseProps {
  visible: boolean;
  totalUnread: number;
  whisperMode?: 'chat' | 'offline';
  onOpenWhisper: () => void;
}

export function WhisperPhase({
  visible,
  totalUnread,
  whisperMode,
  onOpenWhisper,
}: WhisperPhaseProps) {
  const activeWhispers = useWhisperStore((s) => s.activeWhispers);
  const remaining = useWhisperCountdown();
  const isDead = !usePlayerStore((s) => s.isAlive);

  if (!visible) return null;

  if (whisperMode === 'offline') {
    return (
      <View style={styles.phaseContent}>
        <Text style={[styles.dayTitle, isDead && styles.dayTitleDead]}>밀담 시간</Text>
        <Text style={styles.phaseDescription}>
          밀담은 직접 대면으로 진행하세요.
        </Text>
      </View>
    );
  }

  const minutes = remaining !== null ? Math.floor(remaining / 60) : 0;
  const seconds = remaining !== null ? remaining % 60 : 0;

  const isExpired = remaining === 0;

  return (
    <View style={styles.phaseContent}>
      <Text style={[styles.dayTitle, isDead && styles.dayTitleDead, isExpired && { color: '#555' }]}>
        {isExpired ? '밀담 시간 종료' : '밀담 시간'}
      </Text>
      {remaining !== null && remaining > 0 && (
        <Text
          style={[
            whisperStyles.countdownText,
            remaining <= 10 && whisperStyles.countdownUrgent,
          ]}
        >
          {minutes}:{seconds.toString().padStart(2, '0')}
        </Text>
      )}
      {!isExpired && (
        <Text style={styles.phaseDescription}>
          다른 플레이어와 자유롭게 대화하세요.
        </Text>
      )}
      <Pressable style={[styles.whisperButton, isDead && styles.whisperButtonDead]} onPress={onOpenWhisper}>
        <Text style={[styles.whisperButtonText, isDead && styles.whisperButtonTextDead]}>밀담</Text>
        {totalUnread > 0 && (
          <View style={[styles.whisperBadge, isDead && styles.whisperBadgeDead]}>
            <Text style={styles.whisperBadgeText}>{totalUnread}</Text>
          </View>
        )}
      </Pressable>
      {activeWhispers.length > 0 && (
        <View style={whisperStyles.activePanel}>
          <Text style={whisperStyles.activePanelTitle}>진행 중인 밀담</Text>
          {activeWhispers.map((w) => (
            <Text key={w.conversationId} style={whisperStyles.activePanelItem}>
              {w.participantNames.join(' ↔ ')}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

interface DiscussionPhaseProps {
  visible: boolean;
}

export function DiscussionPhase({ visible }: DiscussionPhaseProps) {
  const isDead = !usePlayerStore((s) => s.isAlive);
  if (!visible) return null;
  return (
    <View style={styles.phaseContent}>
      <Text style={[styles.dayTitle, isDead && styles.dayTitleDead]}>공개 토론</Text>
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
  executionHappenedToday: boolean;
  votingMode?: 'online' | 'offline';
  onOpenNominate: () => void;
}

export function NominationPhase({
  visible,
  isAlive,
  hasNominatedToday,
  executionHappenedToday,
  votingMode,
  onOpenNominate,
}: NominationPhaseProps) {
  const isDead = !isAlive;
  if (!visible) return null;

  if (votingMode === 'offline') {
    return (
      <View style={styles.phaseContent}>
        <Text style={[styles.dayTitle, isDead && styles.dayTitleDead]}>지목</Text>
        <Text style={styles.phaseDescription}>
          투표는 오프라인으로 진행됩니다.{'\n'}진행자의 안내를 따라주세요.
        </Text>
      </View>
    );
  }

  const canNominate = isAlive && !hasNominatedToday && !executionHappenedToday;

  return (
    <View style={styles.phaseContent}>
      <Text style={[styles.dayTitle, isDead && styles.dayTitleDead]}>지목</Text>
      <Text style={styles.phaseDescription}>
        처형할 플레이어를 지목하세요.{'\n'}하루에 한 번 지목할 수 있습니다.
      </Text>
      {isAlive && canNominate && (
        <Pressable style={styles.nominateButton} onPress={onOpenNominate}>
          <Text style={styles.nominateButtonText}>지목하기</Text>
        </Pressable>
      )}
      {isAlive && executionHappenedToday && (
        <View style={styles.nominatedBadge}>
          <Text style={styles.nominatedText}>오늘 처형이 집행되었습니다</Text>
        </View>
      )}
      {isAlive && !executionHappenedToday && hasNominatedToday && (
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

const TEAM_LABELS: Record<string, string> = {
  townsfolk: '마을주민',
  outsider: '외지인',
  minion: '하수인',
  demon: '악마',
};

const TEAM_COLORS: Record<string, string> = {
  townsfolk: '#5dade2',
  outsider: '#5dade2',
  minion: '#e74c3c',
  demon: '#e74c3c',
};

interface EndedPhaseProps {
  visible: boolean;
  gameResult: GameResult | null;
}

export function EndedPhase({ visible, gameResult }: EndedPhaseProps) {
  if (!visible) return null;
  const isGoodWin = gameResult?.winningTeam === 'good';
  return (
    <View style={styles.phaseContentLarge}>
      <Text
        style={[
          styles.endedTitle,
          { color: isGoodWin ? '#5dade2' : '#e74c3c' },
        ]}
      >
        {isGoodWin ? '선한 팀 승리!' : '악한 팀 승리!'}
      </Text>
      {gameResult && (
        <>
          <Text style={styles.phaseDescription}>{gameResult.reason}</Text>
          <View style={endedStyles.playerListContainer}>
            {gameResult.players.map((p) => (
              <View
                key={p.id}
                style={[endedStyles.playerRow, getPlayerRowOpacity(p.isAlive)]}
              >
                <Text style={endedStyles.playerName}>
                  {p.name}
                  {!p.isAlive ? ' (사망)' : ''}
                </Text>
                <Text
                  style={[
                    endedStyles.playerRole,
                    { color: TEAM_COLORS[p.team] ?? '#888' },
                  ]}
                >
                  {p.role.name} ({TEAM_LABELS[p.team] ?? p.team})
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
      {!gameResult && (
        <Text style={styles.phaseDescription}>게임이 끝났습니다.</Text>
      )}
    </View>
  );
}
