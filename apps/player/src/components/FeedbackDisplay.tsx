import {
  type NightFeedbackPayload,
  PLAYER_STATUS_LABELS,
  type Team,
} from '@clocktower/shared';
import { StyleSheet, Text, View } from 'react-native';

const TEAM_COLORS: Record<Team, string> = {
  townsfolk: '#7090c4',
  outsider: '#50a090',
  minion: '#c48850',
  demon: '#b85c5c',
};

interface FeedbackDisplayProps {
  feedback: NightFeedbackPayload;
  /** When true, uses compact layout without "진행자 안내" label */
  compact?: boolean;
}

export function FeedbackDisplay({ feedback, compact }: FeedbackDisplayProps) {
  const bannerStyle = compact ? compactStyles.banner : inlineStyles.banner;
  const labelStyle = compact ? compactStyles.label : inlineStyles.label;

  switch (feedback.type) {
    case 'number':
      return (
        <View style={bannerStyle}>
          {!compact && <Text style={labelStyle}>진행자 안내</Text>}
          <Text style={compact ? compactStyles.number : inlineStyles.number}>
            {feedback.value}
          </Text>
        </View>
      );
    case 'yes_no':
      return (
        <View
          style={[
            bannerStyle,
            feedback.value ? sharedStyles.yesVariant : sharedStyles.noVariant,
          ]}
        >
          {!compact && <Text style={labelStyle}>진행자 안내</Text>}
          <Text
            style={[
              compact ? compactStyles.big : inlineStyles.big,
              { color: feedback.value ? '#6ab04c' : '#b85c5c' },
            ]}
          >
            {feedback.value ? '예' : '아니오'}
          </Text>
        </View>
      );
    case 'players_and_role':
      return (
        <View style={bannerStyle}>
          {!compact && <Text style={labelStyle}>진행자 안내</Text>}
          <Text style={sharedStyles.playersText}>
            {feedback.playerNames.map((name, i) => (
              <Text key={name}>
                {i > 0 && '과(와) '}
                <Text style={sharedStyles.highlight}>{name}</Text>
              </Text>
            ))}
          </Text>
          <Text style={sharedStyles.roleText}>
            중 한 명이{' '}
            <Text style={sharedStyles.highlight}>{feedback.roleName}</Text>
            입니다
          </Text>
        </View>
      );
    case 'role':
      return (
        <View style={bannerStyle}>
          {!compact && <Text style={labelStyle}>진행자 안내</Text>}
          <Text style={compact ? compactStyles.big : inlineStyles.big}>
            {feedback.roleName}
          </Text>
        </View>
      );
    case 'no_match':
      return (
        <View style={bannerStyle}>
          {!compact && <Text style={labelStyle}>진행자 안내</Text>}
          <Text style={compact ? compactStyles.big : inlineStyles.big}>
            {feedback.message}
          </Text>
        </View>
      );
    case 'grimoire':
      return (
        <View style={bannerStyle}>
          {!compact && <Text style={labelStyle}>마법서</Text>}
          {compact && <Text style={compactStyles.grimoireTitle}>마법서</Text>}
          <View style={sharedStyles.grimoireList}>
            {feedback.entries.map((entry) => (
              <View
                key={entry.name}
                style={[
                  sharedStyles.grimoireRow,
                  !entry.isAlive && sharedStyles.grimoireRowDead,
                ]}
              >
                <View style={sharedStyles.grimoireNameCol}>
                  <View style={sharedStyles.grimoireNameRow}>
                    {!entry.isAlive && (
                      <Text style={sharedStyles.grimoireDeadIcon}>💀</Text>
                    )}
                    <Text
                      style={[
                        sharedStyles.grimoireName,
                        !entry.isAlive && sharedStyles.grimoireNameDead,
                      ]}
                    >
                      {entry.name}
                    </Text>
                  </View>
                  {entry.statuses.length > 0 && (
                    <View style={sharedStyles.grimoireStatusRow}>
                      {entry.statuses.map((status) => (
                        <Text key={status} style={sharedStyles.grimoireStatus}>
                          {PLAYER_STATUS_LABELS[status]}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    sharedStyles.grimoireRole,
                    { color: TEAM_COLORS[entry.team] },
                    !entry.isAlive && { opacity: 0.5 },
                  ]}
                >
                  {entry.roleName}
                </Text>
              </View>
            ))}
          </View>
        </View>
      );
  }
}

/** Inline styles (used inside NightActionPrompt — full-size display) */
const inlineStyles = StyleSheet.create({
  banner: {
    backgroundColor: '#1e1a30',
    borderWidth: 1,
    borderColor: '#6a50b0',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
  },
  label: {
    color: '#8070b0',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  number: {
    color: '#d0c8f0',
    fontSize: 48,
    fontWeight: 'bold',
  },
  big: {
    color: '#d0c8f0',
    fontSize: 28,
    fontWeight: 'bold',
  },
});

/** Compact styles (used inside FeedbackHistoryModal) */
const compactStyles = StyleSheet.create({
  banner: {
    backgroundColor: '#1e1a30',
    borderWidth: 1,
    borderColor: '#3a3452',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  label: {
    color: '#8070b0',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  number: {
    color: '#d0c8f0',
    fontSize: 36,
    fontWeight: 'bold',
  },
  big: {
    color: '#d0c8f0',
    fontSize: 20,
    fontWeight: 'bold',
  },
  grimoireTitle: {
    color: '#8070b0',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

/** Styles shared between both modes */
const sharedStyles = StyleSheet.create({
  yesVariant: {
    borderColor: '#4a7a3a',
    backgroundColor: '#1a2618',
  },
  noVariant: {
    borderColor: '#943c3c',
    backgroundColor: '#261a1a',
  },
  playersText: {
    color: '#b8b6b2',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 4,
  },
  roleText: {
    color: '#b8b6b2',
    fontSize: 16,
    textAlign: 'center',
  },
  highlight: {
    color: '#d0c8f0',
    fontWeight: 'bold',
  },
  grimoireList: {
    width: '100%',
    gap: 6,
  },
  grimoireRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#16141e',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  grimoireRowDead: {
    backgroundColor: '#1a1218',
    opacity: 0.7,
  },
  grimoireNameCol: {
    flex: 1,
    marginRight: 8,
  },
  grimoireNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  grimoireDeadIcon: {
    fontSize: 12,
  },
  grimoireName: {
    color: '#e0ddd8',
    fontSize: 14,
  },
  grimoireNameDead: {
    color: '#8a7070',
    textDecorationLine: 'line-through',
  },
  grimoireStatusRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 3,
  },
  grimoireStatus: {
    fontSize: 10,
    color: '#c48850',
    fontWeight: '600',
    backgroundColor: 'rgba(196,136,80,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  grimoireRole: {
    fontSize: 13,
    fontWeight: 'bold',
  },
});
