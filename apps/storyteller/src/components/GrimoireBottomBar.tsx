import { colors, SpriteIcon, typography } from '@clocktower/ui';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { arcaneUiSprite, uiIcon } from '../assets/ui';
import { IS_DEV } from '../constants';

interface BottomBarItem {
  label: string;
  icon: number;
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
      icon: uiIcon.whisper,
      onPress: onWhispersPress,
      badge: activeWhispersCount > 0 ? `${activeWhispersCount}` : undefined,
      visible: phase === 'day' && daySubPhase === 'whisper',
    },
    {
      label: '지목',
      icon: uiIcon.nominate,
      onPress: onNominatePress,
      visible: IS_DEV && phase === 'day' && daySubPhase === 'nomination',
    },
    {
      label: '처단자',
      icon: uiIcon.verdict,
      onPress: onSlayerForceAck,
      visible: IS_DEV && slayerWaitingAck,
      highlight: true,
    },
    {
      label: '사전',
      icon: uiIcon.dictionary,
      onPress: onDictionaryPress,
      visible: true,
    },
    {
      label: '메모',
      icon: uiIcon.memo,
      onPress: onMemoPress,
      badge: hasMemo ? '·' : undefined,
      visible: true,
    },
    {
      label: '채팅',
      icon: uiIcon.chat,
      onPress: onChatPress,
      badge: totalChatUnread > 0 ? `${totalChatUnread}` : undefined,
      visible: true,
    },
    {
      label: '로그',
      icon: uiIcon.log,
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
            <SpriteIcon
              source={arcaneUiSprite}
              index={item.icon}
              size={s(28)}
              opacity={item.highlight ? 1 : 0.92}
            />
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
    borderColor: colors.arcane.border.brassDim,
    backgroundColor: colors.arcane.surface.apparatus,
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
    backgroundColor: colors.arcane.action.bloodPressed,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.arcane.action.bloodHighlight,
  },
  iconWrap: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
  },
  badgeCount: {
    backgroundColor: colors.arcane.action.blood,
    borderRadius: 4,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeDot: {
    backgroundColor: colors.arcane.text.label,
    borderRadius: 4,
    width: 8,
    height: 8,
    top: -2,
    right: -4,
  },
  badgeText: {
    color: colors.arcane.text.strong,
    fontSize: 9,
    fontWeight: '700',
  },
  label: {
    color: colors.arcane.text.muted,
    marginTop: 2,
    fontFamily: typography.fontFamily.bodyMedium,
  },
});
