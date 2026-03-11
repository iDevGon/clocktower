import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useGameActions } from '../hooks/useGameActions';
import { usePlayerStore } from '../stores/playerStore';
import { VoteClockRing } from './VoteClockRing';
import { styles } from './VotePrompt.styles';

interface VotePromptProps {
  nominatorName: string;
  nomineeName: string;
}

export function VotePrompt({ nominatorName, nomineeName }: VotePromptProps) {
  const { preselectVote } = useGameActions();
  const playerId = usePlayerStore((s) => s.playerId);
  const voteClock = usePlayerStore((s) => s.voteClock);
  const voteCountdown = usePlayerStore((s) => s.voteCountdown);
  const voteOrder = usePlayerStore((s) => s.voteOrder);
  const votePreselections = usePlayerStore((s) => s.votePreselections);

  const [, forceUpdate] = useState(0);

  // Periodic re-render to track hand position and countdown
  useEffect(() => {
    if (!voteClock && !voteCountdown) return;
    const interval = setInterval(() => forceUpdate((n) => n + 1), 200);
    return () => clearInterval(interval);
  }, [voteClock, voteCountdown]);

  // 카운트다운 계산
  const countdownRemaining = useMemo(() => {
    if (!voteCountdown) return 0;
    const elapsed = Date.now() - voteCountdown.startedAt;
    return Math.max(0, Math.ceil((voteCountdown.durationMs - elapsed) / 1000));
  }, [voteCountdown]);

  const isCountingDown = voteCountdown !== null && countdownRemaining > 0;

  // Compute whether the hand has passed my position
  const myVoteState = useMemo(() => {
    if (!voteClock || !voteOrder?.fullOrder) {
      return { canVote: false, hasPassed: false };
    }

    const fullOrder = voteOrder.fullOrder;
    const totalPlayers = fullOrder.length;
    const nomineeId = voteOrder.nomineeId;
    const nomineeFullIdx = fullOrder.findIndex((p) => p.id === nomineeId);
    const myFullIdx = fullOrder.findIndex((p) => p.id === playerId);

    if (nomineeFullIdx < 0 || myFullIdx < 0) {
      return { canVote: false, hasPassed: false };
    }

    const myOffset = (myFullIdx - nomineeFullIdx + totalPlayers) % totalPlayers;
    // nominee confirms at 360 (end of rotation)
    const myConfirmFraction = myOffset === 0 ? 1 : myOffset / totalPlayers;

    const elapsed = Date.now() - voteClock.startedAt;
    const progress = Math.min(elapsed / voteClock.durationMs, 1);

    const hasPassed = progress >= myConfirmFraction;
    return { canVote: !hasPassed, hasPassed };
  }, [voteClock, voteOrder, playerId]);

  const myPreselection = votePreselections[playerId] ?? null;

  const handleToggle = (guilty: boolean) => {
    if (!myVoteState.canVote) return;
    const newValue = myPreselection === guilty ? null : guilty;
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

      {isCountingDown ? (
        <View style={styles.countdownContainer}>
          <Text style={styles.countdownMessage}>
            잠시 후 투표가 시작됩니다
          </Text>
          <Text style={styles.countdownNumber}>{countdownRemaining}</Text>
        </View>
      ) : (
        <>
          <VoteClockRing />
          {myVoteState.canVote ? (
            <>
              <Text style={styles.description}>
                시계 바늘이 지나가기 전에 찬반을 선택하세요.
              </Text>
              <View style={styles.buttonRow}>
                <Pressable
                  style={[
                    styles.guiltyButton,
                    myPreselection === true && styles.guiltyButtonSelected,
                  ]}
                  onPress={() => handleToggle(true)}
                >
                  <Text
                    style={[
                      styles.guiltyText,
                      myPreselection === true && styles.guiltyTextSelected,
                    ]}
                  >
                    유죄
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.innocentButton,
                    myPreselection === false && styles.innocentButtonSelected,
                  ]}
                  onPress={() => handleToggle(false)}
                >
                  <Text
                    style={[
                      styles.innocentText,
                      myPreselection === false && styles.innocentTextSelected,
                    ]}
                  >
                    무죄
                  </Text>
                </Pressable>
              </View>
              {myPreselection == null && (
                <Text style={styles.noSelectionHint}>
                  미선택 시 무죄로 처리됩니다
                </Text>
              )}
            </>
          ) : (
            <View style={styles.votedContainer}>
              <Text style={styles.votedSubtext}>
                {myVoteState.hasPassed
                  ? '투표 완료. 결과를 기다리는 중...'
                  : '다른 플레이어의 투표를 기다리는 중...'}
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}
