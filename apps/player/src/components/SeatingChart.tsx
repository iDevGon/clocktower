import type { Phase, PlayerInfo } from '@clocktower/shared';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

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

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    alignItems: 'center',
    gap: 16,
  },
  title: {
    color: '#e0ddd8',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  ring: {
    position: 'relative',
  },
  token: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#1a1a1e',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tokenMe: {
    backgroundColor: '#1e1c14',
    shadowColor: '#c4a050',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  name: {
    color: '#b0aea8',
    fontWeight: '600',
    textAlign: 'center',
  },
  nameMe: {
    color: '#e0ddd8',
  },
  deadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  dead: {
    color: '#c47070',
    fontWeight: '700',
    marginTop: 1,
  },
  hint: {
    color: '#5c5a58',
    fontSize: 12,
  },
});
