import type { Phase, PlayerInfo } from '@clocktower/shared';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Dimensions, Modal, Pressable, Text, View } from 'react-native';
import { styles as s } from './SeatingChart.styles';

interface SeatingChartProps {
  visible: boolean;
  players: PlayerInfo[];
  myId: string;
  phase: Phase;
  onClose: () => void;
}

const TOKEN_SIZE = 56;
const SCREEN = Dimensions.get('window');

export function SeatingChart({
  visible,
  players,
  myId,
  phase,
  onClose,
}: SeatingChartProps) {
  // 밤 진입 시점의 사망자 ID를 스냅샷으로 저장
  const deadBeforeNight = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (phase === 'night') {
      deadBeforeNight.current = new Set(
        players.filter((p) => !p.isAlive).map((p) => p.id),
      );
    }
  }, [phase, players]);

  const areaSize = useMemo(() => {
    const side = Math.min(SCREEN.width - 48, SCREEN.height * 0.55, 400);
    return side;
  }, []);

  const tokenSize = useMemo(() => {
    if (players.length <= 6) return TOKEN_SIZE;
    if (players.length <= 10) return 50;
    if (players.length <= 14) return 44;
    return 40;
  }, [players.length]);

  const positions = useMemo(() => {
    const center = areaSize / 2;
    const radius = center - tokenSize / 2 - 8;
    return players.map((_, i) => {
      const angle = (i / players.length) * 2 * Math.PI - Math.PI / 2;
      return {
        x: center + radius * Math.cos(angle) - tokenSize / 2,
        y: center + radius * Math.sin(angle) - tokenSize / 2,
      };
    });
  }, [players, areaSize, tokenSize]);

  const renderToken = useCallback(
    (player: PlayerInfo, index: number) => {
      const isMe = player.id === myId;
      const pos = positions[index];
      const fontSize = tokenSize <= 44 ? 10 : 11;

      // 밤에는 밤 진입 전 이미 죽었던 사람만 사망 표시
      // 그 외 페이즈에서는 서버 상태 그대로 표시
      const showDeath =
        phase === 'night'
          ? deadBeforeNight.current.has(player.id)
          : !player.isAlive && phase !== 'setup';

      // 사망자 중 투표권이 남아있으면 푸른 글로우
      const hasGhostVote = showDeath && !player.deadVoteUsed;

      const borderColor = isMe
        ? '#c4a050'
        : hasGhostVote
          ? '#5aa0d0'
          : '#3a3a42';

      return (
        <View
          key={player.id}
          style={[
            s.token,
            {
              width: tokenSize,
              height: tokenSize,
              left: pos.x,
              top: pos.y,
              borderColor,
              borderWidth: isMe ? 2.5 : hasGhostVote ? 2 : 1.5,
              opacity: showDeath ? 0.35 : 1,
              shadowColor: hasGhostVote ? '#5aa0d0' : 'transparent',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: hasGhostVote ? 0.8 : 0,
              shadowRadius: hasGhostVote ? 8 : 0,
              elevation: hasGhostVote ? 8 : 0,
            },
            isMe && s.tokenMe,
          ]}
        >
          <Text
            style={[s.name, { fontSize }, isMe && s.nameMe]}
            numberOfLines={1}
          >
            {player.name}
          </Text>
          {player.isTraveller && (
            <Text style={[s.travellerTag, { fontSize: fontSize - 2 }]}>
              여행자
            </Text>
          )}
          {showDeath && (
            <View style={s.deadRow}>
              <Text style={[s.dead, { fontSize: fontSize - 1 }]}>사망</Text>
            </View>
          )}
        </View>
      );
    },
    [myId, positions, tokenSize, phase],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={s.overlay} onPress={onClose}>
        <View style={s.container}>
          <Text style={s.title}>좌석 배치</Text>
          <View style={[s.ring, { width: areaSize, height: areaSize }]}>
            {players.map(renderToken)}
          </View>
          <Text style={s.hint}>탭하여 닫기</Text>
        </View>
      </Pressable>
    </Modal>
  );
}
