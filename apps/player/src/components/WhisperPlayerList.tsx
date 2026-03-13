import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useWhisperStore } from '../stores/whisperStore';
import { styles } from './WhisperPlayerList.styles';

interface PlayerItem {
  id: string;
  name: string;
  isAlive: boolean;
}

interface ConversationTarget {
  conversationId: string;
  participantIds: string[];
  participantNames: string[];
}

interface WhisperPlayerListProps {
  players: PlayerItem[];
  myPlayerId: string;
  onSelectConversation: (target: ConversationTarget) => void;
  onClose: () => void;
  readOnly?: boolean;
}

function makeConversationId(...ids: string[]): string {
  return [...ids].sort().join(':');
}

export function WhisperPlayerList({
  players,
  myPlayerId,
  onSelectConversation,
  onClose,
  readOnly,
}: WhisperPlayerListProps) {
  const unreadCounts = useWhisperStore((s) => s.unreadCounts);
  const conversations = useWhisperStore((s) => s.conversations);
  const conversationMeta = useWhisperStore((s) => s.conversationMeta);
  const [groupMode, setGroupMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const availablePlayers = players.filter(
    (p) => p.id !== myPlayerId && p.isAlive,
  );

  // Get existing conversation entries sorted by unread then activity
  const existingConversations = Object.entries(conversationMeta)
    .filter(([convId]) => (conversations[convId]?.length ?? 0) > 0)
    .sort(([a], [b]) => {
      const unreadA = unreadCounts[a] ?? 0;
      const unreadB = unreadCounts[b] ?? 0;
      if (unreadA !== unreadB) return unreadB - unreadA;
      const lastA =
        conversations[a]?.[conversations[a].length - 1]?.timestamp ?? 0;
      const lastB =
        conversations[b]?.[conversations[b].length - 1]?.timestamp ?? 0;
      return lastB - lastA;
    });

  const handlePlayerTap = (player: PlayerItem) => {
    if (groupMode) {
      setSelectedIds((prev) =>
        prev.includes(player.id)
          ? prev.filter((id) => id !== player.id)
          : [...prev, player.id],
      );
      return;
    }
    // 1:1 conversation
    const convId = makeConversationId(myPlayerId, player.id);
    const myName = players.find((p) => p.id === myPlayerId)?.name ?? myPlayerId;
    onSelectConversation({
      conversationId: convId,
      participantIds: [myPlayerId, player.id],
      participantNames: [myName, player.name],
    });
  };

  const handleCreateGroup = () => {
    if (selectedIds.length < 2) return;
    const allIds = [myPlayerId, ...selectedIds];
    const allNames = allIds.map(
      (id) => players.find((p) => p.id === id)?.name ?? id,
    );
    const convId = makeConversationId(...allIds);
    onSelectConversation({
      conversationId: convId,
      participantIds: allIds,
      participantNames: allNames,
    });
    setGroupMode(false);
    setSelectedIds([]);
  };

  const handleCancelGroup = () => {
    setGroupMode(false);
    setSelectedIds([]);
  };

  const getConversationDisplayName = (meta: {
    participantIds: string[];
    participantNames: string[];
  }) => {
    return meta.participantNames
      .filter((_, i) => meta.participantIds[i] !== myPlayerId)
      .join(', ');
  };

  const getLastMessage = (convId: string) => {
    const msgs = conversations[convId];
    if (!msgs || msgs.length === 0) return null;
    return msgs[msgs.length - 1];
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {groupMode ? '그룹 밀담 만들기' : '밀담'}
        </Text>
        {groupMode ? (
          <Pressable onPress={handleCancelGroup} style={styles.closeButton}>
            <Text style={styles.closeText}>취소</Text>
          </Pressable>
        ) : (
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>닫기</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
      >
        {/* Existing conversations section */}
        {!groupMode && existingConversations.length > 0 && (
          <>
            <Text style={groupStyles.sectionTitle}>대화 중</Text>
            {existingConversations.map(([convId, meta]) => {
              const unread = unreadCounts[convId] ?? 0;
              const lastMsg = getLastMessage(convId);
              const isGroup = meta.participantIds.length > 2;
              return (
                <Pressable
                  key={convId}
                  style={styles.playerRow}
                  onPress={() =>
                    onSelectConversation({
                      conversationId: convId,
                      participantIds: meta.participantIds,
                      participantNames: meta.participantNames,
                    })
                  }
                >
                  <View style={styles.playerInfo}>
                    <View
                      style={[
                        styles.avatarCircle,
                        isGroup && groupStyles.groupAvatar,
                      ]}
                    >
                      <Text
                        style={[
                          styles.avatarText,
                          isGroup && groupStyles.groupAvatarText,
                        ]}
                      >
                        {isGroup
                          ? `${meta.participantIds.length}`
                          : getConversationDisplayName(meta).charAt(0)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.playerName} numberOfLines={1}>
                        {getConversationDisplayName(meta)}
                      </Text>
                      {lastMsg && (
                        <Text style={groupStyles.lastMessage} numberOfLines={1}>
                          {lastMsg.fromId === myPlayerId
                            ? `나: ${lastMsg.message}`
                            : isGroup
                              ? `${lastMsg.fromName}: ${lastMsg.message}`
                              : lastMsg.message}
                        </Text>
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
            <Text style={groupStyles.sectionTitle}>새 대화</Text>
          </>
        )}

        {/* Group create button */}
        {!groupMode && !readOnly && (
          <Pressable
            style={groupStyles.groupCreateButton}
            onPress={() => setGroupMode(true)}
          >
            <View style={groupStyles.groupCreateIcon}>
              <Text style={groupStyles.groupCreateIconText}>+</Text>
            </View>
            <Text style={groupStyles.groupCreateText}>그룹 밀담 만들기</Text>
          </Pressable>
        )}

        {/* Group mode header */}
        {groupMode && (
          <Text style={groupStyles.groupModeHint}>
            2명 이상 선택하세요 ({selectedIds.length}명 선택됨)
          </Text>
        )}

        {/* Player list */}
        {availablePlayers.length === 0 && !groupMode && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              밀담 가능한 플레이어가 없습니다
            </Text>
          </View>
        )}
        {availablePlayers.map((player) => {
          const isSelected = selectedIds.includes(player.id);
          const convId = makeConversationId(myPlayerId, player.id);
          const unreadCount = unreadCounts[convId] ?? 0;
          return (
            <Pressable
              key={player.id}
              style={[styles.playerRow, isSelected && groupStyles.selectedRow]}
              onPress={() => handlePlayerTap(player)}
            >
              <View style={styles.playerInfo}>
                <View
                  style={[
                    styles.avatarCircle,
                    isSelected && groupStyles.selectedAvatar,
                  ]}
                >
                  <Text
                    style={[
                      styles.avatarText,
                      isSelected && groupStyles.selectedAvatarText,
                    ]}
                  >
                    {isSelected ? '✓' : player.name.charAt(0)}
                  </Text>
                </View>
                <Text style={styles.playerName}>{player.name}</Text>
              </View>
              {!groupMode && unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Group create confirm button */}
      {groupMode && selectedIds.length >= 2 && (
        <View style={groupStyles.confirmBar}>
          <Pressable
            style={groupStyles.confirmButton}
            onPress={handleCreateGroup}
          >
            <Text style={groupStyles.confirmButtonText}>
              밀담 시작 ({selectedIds.length}명)
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const groupStyles = StyleSheet.create({
  sectionTitle: {
    color: '#6a8a6a',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
  lastMessage: {
    color: '#5c5a58',
    fontSize: 12,
    marginTop: 2,
  },
  groupAvatar: {
    backgroundColor: '#2a2a4d',
    borderColor: '#5a4a8a',
  },
  groupAvatarText: {
    color: '#9a8aca',
  },
  groupCreateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#1e1e22',
    gap: 12,
  },
  groupCreateIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a4d',
    borderWidth: 1,
    borderColor: '#5a4a8a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupCreateIconText: {
    color: '#9a8aca',
    fontSize: 20,
    fontWeight: '600',
  },
  groupCreateText: {
    color: '#d4c8f0',
    fontSize: 16,
  },
  groupModeHint: {
    color: '#8a8a8a',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 12,
  },
  selectedRow: {
    backgroundColor: 'rgba(90, 74, 138, 0.15)',
  },
  selectedAvatar: {
    backgroundColor: '#5a4a8a',
    borderColor: '#9a8aca',
  },
  selectedAvatarText: {
    color: '#fff',
  },
  confirmBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: '#2e2e34',
  },
  confirmButton: {
    backgroundColor: '#5a4a8a',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
