import {
  PLAYER_STATUS_LABELS,
  type NightFeedbackPayload,
  type Team,
} from '@clocktower/shared';
import { Text, View } from 'react-native';
import { styles } from './NightActionPrompt.styles';

const TEAM_COLORS: Record<Team, string> = {
  townsfolk: '#7090c4',
  outsider: '#50a090',
  minion: '#c48850',
  demon: '#b85c5c',
};

export function FeedbackDisplay({
  feedback,
}: {
  feedback: NightFeedbackPayload;
}) {
  switch (feedback.type) {
    case 'number':
      return (
        <View style={styles.feedbackBanner}>
          <Text style={styles.feedbackLabel}>진행자 안내</Text>
          <Text style={styles.feedbackNumber}>{feedback.value}</Text>
        </View>
      );
    case 'yes_no':
      return (
        <View
          style={[
            styles.feedbackBanner,
            feedback.value ? styles.feedbackYes : styles.feedbackNo,
          ]}
        >
          <Text style={styles.feedbackLabel}>진행자 안내</Text>
          <Text
            style={[
              styles.feedbackBig,
              { color: feedback.value ? '#6ab04c' : '#b85c5c' },
            ]}
          >
            {feedback.value ? '예' : '아니오'}
          </Text>
        </View>
      );
    case 'players_and_role':
      return (
        <View style={styles.feedbackBanner}>
          <Text style={styles.feedbackLabel}>진행자 안내</Text>
          <Text style={styles.feedbackPlayersText}>
            {feedback.playerNames.map((name, i) => (
              <Text key={name}>
                {i > 0 && '과(와) '}
                <Text style={styles.feedbackHighlight}>{name}</Text>
              </Text>
            ))}
          </Text>
          <Text style={styles.feedbackRoleText}>
            중 한 명이{' '}
            <Text style={styles.feedbackHighlight}>{feedback.roleName}</Text>
            입니다
          </Text>
        </View>
      );
    case 'role':
      return (
        <View style={styles.feedbackBanner}>
          <Text style={styles.feedbackLabel}>진행자 안내</Text>
          <Text style={styles.feedbackBig}>{feedback.roleName}</Text>
        </View>
      );
    case 'no_match':
      return (
        <View style={styles.feedbackBanner}>
          <Text style={styles.feedbackLabel}>진행자 안내</Text>
          <Text style={styles.feedbackBig}>{feedback.message}</Text>
        </View>
      );
    case 'grimoire':
      return (
        <View style={styles.feedbackBanner}>
          <Text style={styles.feedbackLabel}>마법서</Text>
          <View style={styles.grimoireList}>
            {feedback.entries.map((entry) => (
              <View
                key={entry.name}
                style={[
                  styles.grimoireRow,
                  !entry.isAlive && styles.grimoireRowDead,
                ]}
              >
                <View style={styles.grimoireNameCol}>
                  <View style={styles.grimoireNameRow}>
                    {!entry.isAlive && (
                      <Text style={styles.grimoireDeadIcon}>💀</Text>
                    )}
                    <Text
                      style={[
                        styles.grimoireName,
                        !entry.isAlive && styles.grimoireNameDead,
                      ]}
                    >
                      {entry.name}
                    </Text>
                  </View>
                  {entry.statuses.length > 0 && (
                    <View style={styles.grimoireStatusRow}>
                      {entry.statuses.map((status) => (
                        <Text key={status} style={styles.grimoireStatus}>
                          {PLAYER_STATUS_LABELS[status]}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    styles.grimoireRole,
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
