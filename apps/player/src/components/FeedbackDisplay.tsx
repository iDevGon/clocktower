import {
  type NightFeedbackPayload,
  PLAYER_STATUS_LABELS,
  type Team,
} from '@clocktower/shared';
import { Text, View } from 'react-native';
import {
  compactStyles,
  inlineStyles,
  sharedStyles,
} from './FeedbackDisplay.styles';

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
