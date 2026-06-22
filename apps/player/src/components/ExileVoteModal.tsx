import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { usePlayerStore } from '../stores/playerStore';
import { styles } from './ExileVoteModal.styles';

interface ExileVoteModalProps {
  onVote: (guilty: boolean) => Promise<{ success: boolean; error?: string }>;
}

export function ExileVoteModal({ onVote }: ExileVoteModalProps) {
  const exileVote = usePlayerStore((s) => s.exileVote);
  const exileResult = usePlayerStore((s) => s.exileResult);
  const playerId = usePlayerStore((s) => s.playerId);
  const [hasVoted, setHasVoted] = useState(false);
  const prevTargetRef = useRef<string | null>(null);

  // 새 추방 투표가 시작되면 hasVoted 리셋
  useEffect(() => {
    if (!exileVote) {
      prevTargetRef.current = null;
      return;
    }
    if (prevTargetRef.current !== exileVote.targetId) {
      prevTargetRef.current = exileVote.targetId;
      // rejoin 시 이미 투표한 상태면 hasVoted 유지
      setHasVoted(exileVote.votes[playerId] !== undefined);
    }
  }, [exileVote, playerId]);

  const handleVote = useCallback(
    (guilty: boolean) => {
      onVote(guilty).then((res) => {
        if (res.success) setHasVoted(true);
      });
    },
    [onVote],
  );

  const dismissResult = useCallback(() => {
    usePlayerStore.getState().set({ exileResult: null });
    setHasVoted(false);
  }, []);

  if (!exileVote && !exileResult) return null;

  // 결과 표시
  if (exileResult) {
    return (
      <Modal visible transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.resultPanel}>
            <Text
              style={[
                styles.resultTitle,
                exileResult.exiled
                  ? styles.resultExiled
                  : styles.resultSurvived,
              ]}
            >
              {exileResult.exiled
                ? `${exileResult.targetName} 추방됨`
                : `${exileResult.targetName} 추방 부결`}
            </Text>
            <Text style={styles.resultDetail}>
              찬성 {exileResult.guiltyCount} / 전체 {exileResult.totalPlayers}
            </Text>
            <Pressable style={styles.dismissButton} onPress={dismissResult}>
              <Text style={styles.dismissText}>확인</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  if (!exileVote) return null;

  const alreadyVoted = hasVoted || exileVote.votes[playerId] !== undefined;
  const majority = Math.floor(exileVote.totalPlayers / 2) + 1;

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <Text style={styles.title}>추방 투표</Text>
          <Text style={styles.subtitle}>
            {exileVote.proposerName}의 추방 제안
          </Text>
          <Text style={styles.targetName}>{exileVote.targetName}</Text>
          <Text style={styles.targetRole}>{exileVote.targetRoleName}</Text>
          <Text style={styles.voteCount}>
            찬성 {exileVote.guiltyCount} / 반대 {exileVote.innocentCount}
          </Text>
          <Text style={styles.threshold}>
            과반수 {majority}표 필요 (전체 {exileVote.totalPlayers}명)
          </Text>
          {alreadyVoted ? (
            <Text style={styles.votedText}>투표 완료 — 결과를 기다리는 중</Text>
          ) : (
            <View style={styles.buttonRow}>
              <Pressable
                style={styles.guiltyButton}
                onPress={() => handleVote(true)}
              >
                <Text style={styles.guiltyButtonText}>찬성 (추방)</Text>
              </Pressable>
              <Pressable
                style={styles.innocentButton}
                onPress={() => handleVote(false)}
              >
                <Text style={styles.innocentButtonText}>반대</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
