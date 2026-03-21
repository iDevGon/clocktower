import { Pressable, StyleSheet, Text, View } from 'react-native';
import { IS_DEV } from '../constants';

interface BottomBarItem {
  label: string;
  icon: string;
  onPress: () => void;
  badge?: string;
  visible?: boolean;
  highlight?: boolean;
}

interface GrimoireBottomBarProps {
  phase: string;
  daySubPhase?: string;
  activeWhispersCount: number;
  slayerWaitingAck: boolean;
  totalChatUnread: number;
  hasMemo: boolean;
  onWhispersPress: () => void;
  onNominatePress: () => void;
  onSlayerForceAck: () => void;
  onDictionaryPress: () => void;
  onMemoPress: () => void;
  onChatPress: () => void;
  onLogPress: () => void;
  scale: number;
}

export function GrimoireBottomBar({
  phase,
  daySubPhase,
  activeWhispersCount,
  slayerWaitingAck,
  totalChatUnread,
  hasMemo,
  onWhispersPress,
  onNominatePress,
  onSlayerForceAck,
  onDictionaryPress,
  onMemoPress,
  onChatPress,
  onLogPress,
  scale,
}: GrimoireBottomBarProps) {
  const s = (v: number) => Math.round(v * scale);

  const items: BottomBarItem[] = [
    {
      label: '밀담 로그',
      icon: '🤝🏻',
      onPress: onWhispersPress,
      badge: activeWhispersCount > 0 ? `${activeWhispersCount}` : undefined,
      visible: phase === 'day' && daySubPhase === 'whisper',
    },
    {
      label: '지목',
      icon: '👆',
      onPress: onNominatePress,
      visible: IS_DEV && phase === 'day' && daySubPhase === 'nomination',
    },
    {
      label: '처단자',
      icon: '⚔️',
      onPress: onSlayerForceAck,
      visible: IS_DEV && slayerWaitingAck,
      highlight: true,
    },
    {
      label: '사전',
      icon: '📖',
      onPress: onDictionaryPress,
      visible: true,
    },
    {
      label: '메모',
      icon: '📝',
      onPress: onMemoPress,
      badge: hasMemo ? '·' : undefined,
      visible: true,
    },
    {
      label: '채팅',
      icon: '💬',
      onPress: onChatPress,
      badge: totalChatUnread > 0 ? `${totalChatUnread}` : undefined,
      visible: true,
    },
    {
      label: '로그',
      icon: '📜',
      onPress: onLogPress,
      visible: true,
    },
  ];

  const visibleItems = items.filter((item) => item.visible !== false);

  return (
    <View style={[st.container, { paddingVertical: s(6) }]}>
      {visibleItems.map((item) => (
        <Pressable
          key={item.label}
          onPress={item.onPress}
          style={({ pressed }) => [
            st.item,
            pressed && st.itemPressed,
            item.highlight && st.itemHighlight,
          ]}
        >
          <View style={st.iconWrap}>
            <Text style={[st.icon, { fontSize: s(18) }]}>{item.icon}</Text>
            {item.badge && (
              <View
                style={[
                  st.badge,
                  item.badge === '·' ? st.badgeDot : st.badgeCount,
                ]}
              >
                {item.badge !== '·' && (
                  <Text style={st.badgeText}>{item.badge}</Text>
                )}
              </View>
            )}
          </View>
          <Text style={[st.label, { fontSize: s(9) }]}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    borderTopWidth: 1,
    borderColor: '#2e2e34',
    backgroundColor: '#161618',
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
    minWidth: 44,
  },
  itemPressed: {
    opacity: 0.6,
  },
  itemHighlight: {
    backgroundColor: '#3a1a1a',
    borderRadius: 8,
  },
  iconWrap: {
    position: 'relative',
  },
  icon: {
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
  },
  badgeCount: {
    backgroundColor: '#c43c3c',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeDot: {
    backgroundColor: '#7dce82',
    borderRadius: 4,
    width: 8,
    height: 8,
    top: -2,
    right: -4,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
  },
  label: {
    color: '#6a6a70',
    marginTop: 2,
    fontWeight: '500',
  },
});
