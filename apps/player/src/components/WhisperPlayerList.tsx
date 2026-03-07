import { Pressable, ScrollView, Text, View } from 'react-native';
import { styles } from './WhisperPlayerList.styles';
import { useWhisperStore } from '../stores/whisperStore';

interface PlayerItem {
  id: string;
  name: string;
  isAlive: boolean;
}

interface WhisperPlayerListProps {
  players: PlayerItem[];
  myPlayerId: string;
  onSelectPlayer: (playerId: string, playerName: string) => void;
  onClose: () => void;
}

export function WhisperPlayerList({
  players,
  myPlayerId,
  onSelectPlayer,
  onClose,
}: WhisperPlayerListProps) {
  const unreadCounts = useWhisperStore((s) => s.unreadCounts);
  const conversations = useWhisperStore((s) => s.conversations);

  const availablePlayers = players.filter(
    (p) => p.id !== myPlayerId && p.isAlive,
  );

  // Sort: players with existing conversations first, then by unread count
  const sorted = [...availablePlayers].sort((a, b) => {
    const unreadA = unreadCounts[a.id] ?? 0;
    const unreadB = unreadCounts[b.id] ?? 0;
    if (unreadA !== unreadB) return unreadB - unreadA;
    const hasConvA = (conversations[a.id]?.length ?? 0) > 0 ? 1 : 0;
    const hasConvB = (conversations[b.id]?.length ?? 0) > 0 ? 1 : 0;
    return hasConvB - hasConvA;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>밀담 상대 선택</Text>
        <Pressable onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>닫기</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
      >
        {sorted.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              밀담 가능한 플레이어가 없습니다
            </Text>
          </View>
        )}
        {sorted.map((player) => {
          const unread = unreadCounts[player.id] ?? 0;
          const hasConversation = (conversations[player.id]?.length ?? 0) > 0;
          return (
            <Pressable
              key={player.id}
              style={styles.playerRow}
              onPress={() => onSelectPlayer(player.id, player.name)}
            >
              <View style={styles.playerInfo}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{player.name.charAt(0)}</Text>
                </View>
                <View>
                  <Text style={styles.playerName}>{player.name}</Text>
                  {hasConversation && (
                    <Text style={styles.conversationHint}>대화 중</Text>
                  )}
                </View>
              </View>
              {unread > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unread}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

