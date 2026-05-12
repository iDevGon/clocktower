import type {
  NightFeedbackPayload,
  PlayerStatus,
  Team,
} from '@clocktower/shared';
import { PLAYER_STATUS_LABELS } from '@clocktower/shared';
import { colors, typography } from '@clocktower/ui';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { DeliveredFeedbackHistoryEntry } from '../stores/gameStore';

const TEAM_COLORS: Record<Team, string> = {
  townsfolk: '#7090c4',
  outsider: '#50a090',
  minion: '#c48850',
  demon: '#b85c5c',
  traveller: '#b07cc6',
};

interface DeliveredFeedbackHistoryModalProps {
  visible: boolean;
  history: DeliveredFeedbackHistoryEntry[];
  onClose: () => void;
}

function statusText(statuses: PlayerStatus[]): string {
  if (statuses.length === 0) return '';
  return statuses.map((status) => PLAYER_STATUS_LABELS[status]).join(', ');
}

function FeedbackSummary({ feedback }: { feedback: NightFeedbackPayload }) {
  switch (feedback.type) {
    case 'number':
      return <Text style={styles.primaryValue}>{feedback.value}</Text>;
    case 'yes_no':
      return (
        <View style={styles.summaryBlock}>
          {feedback.targetNames && feedback.targetNames.length > 0 && (
            <Text style={styles.detailText}>
              {feedback.targetNames.join(', ')}
            </Text>
          )}
          <Text
            style={[
              styles.primaryValue,
              { color: feedback.value ? '#6ab04c' : '#b85c5c' },
            ]}
          >
            {feedback.value ? '예' : '아니오'}
          </Text>
        </View>
      );
    case 'players_and_role':
      return (
        <Text style={styles.detailText}>
          {feedback.playerNames.join(', ')} 중 한 명이 {feedback.roleName}
        </Text>
      );
    case 'dreamer_info':
      return (
        <Text style={styles.detailText}>
          {feedback.targetName}: {feedback.goodRoleName} 또는{' '}
          {feedback.evilRoleName}
        </Text>
      );
    case 'players':
      return (
        <Text style={styles.detailText}>
          {feedback.playerNames.join(', ')}
          {feedback.message ? ` · ${feedback.message}` : ''}
        </Text>
      );
    case 'mad_as':
      return <Text style={styles.detailText}>{feedback.roleName} 주장</Text>;
    case 'no_match':
      return <Text style={styles.detailText}>{feedback.message}</Text>;
    case 'role':
      return <Text style={styles.primaryValue}>{feedback.roleName}</Text>;
    case 'savant_info':
      return (
        <View style={styles.summaryBlock}>
          <Text style={styles.detailText}>정보 1: {feedback.info1}</Text>
          <Text style={styles.detailText}>정보 2: {feedback.info2}</Text>
        </View>
      );
    case 'grimoire':
      return (
        <View style={styles.grimoireList}>
          {feedback.entries.map((entry) => {
            const statuses = statusText(entry.statuses);
            return (
              <View key={entry.name} style={styles.grimoireRow}>
                <View style={styles.grimoireNameBlock}>
                  <Text
                    style={[
                      styles.grimoireName,
                      !entry.isAlive && styles.deadText,
                    ]}
                  >
                    {entry.name}
                  </Text>
                  {statuses.length > 0 && (
                    <Text style={styles.statusText}>{statuses}</Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.grimoireRole,
                    { color: TEAM_COLORS[entry.team] },
                    !entry.isAlive && styles.deadText,
                  ]}
                >
                  {entry.roleName}
                </Text>
              </View>
            );
          })}
        </View>
      );
  }
}

export function DeliveredFeedbackHistoryModal({
  visible,
  history,
  onClose,
}: DeliveredFeedbackHistoryModalProps) {
  const entries = [...history].reverse();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>건넨 정보</Text>
            <Text style={styles.subtitle}>{history.length}개 기록</Text>
          </View>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>닫기</Text>
          </Pressable>
        </View>

        {entries.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>아직 건넨 정보가 없습니다</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            nestedScrollEnabled
          >
            {entries.map((entry) => (
              <View
                key={`${entry.timestamp}-${entry.playerId}-${entry.roleId}`}
                style={styles.entry}
              >
                <View style={styles.entryHeader}>
                  <Text style={styles.meta}>
                    {entry.day}일차 밤 · {entry.roleName} → {entry.playerName}
                  </Text>
                  <Text style={styles.sourceBadge}>
                    {entry.source === 'auto' ? '자동' : '수동'}
                  </Text>
                </View>
                <FeedbackSummary feedback={entry.feedback} />
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.arcane.surface.base,
  },
  header: {
    paddingTop: 54,
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.arcane.border.brassDim,
    backgroundColor: colors.arcane.surface.apparatus,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: colors.arcane.text.strong,
    fontFamily: typography.fontFamily.display,
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.arcane.text.muted,
    fontFamily: typography.fontFamily.body,
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    borderWidth: 1,
    borderColor: colors.arcane.border.brass,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.arcane.surface.parchment,
  },
  closeText: {
    color: colors.arcane.text.label,
    fontFamily: typography.fontFamily.bodyBold,
    fontSize: 13,
    fontWeight: '700',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    color: colors.arcane.text.dead,
    fontFamily: typography.fontFamily.body,
    fontSize: 14,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 14,
    gap: 10,
    paddingBottom: 36,
  },
  entry: {
    borderWidth: 1,
    borderColor: colors.arcane.border.brassDim,
    backgroundColor: colors.arcane.surface.apparatus,
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  meta: {
    color: colors.arcane.text.muted,
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: 12,
    flex: 1,
  },
  sourceBadge: {
    color: colors.arcane.text.label,
    fontFamily: typography.fontFamily.bodyBold,
    fontSize: 11,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: colors.arcane.border.brassDim,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  summaryBlock: {
    gap: 5,
  },
  primaryValue: {
    color: colors.arcane.text.strong,
    fontFamily: typography.fontFamily.display,
    fontSize: 24,
    fontWeight: '700',
  },
  detailText: {
    color: colors.arcane.text.primary,
    fontFamily: typography.fontFamily.body,
    fontSize: 14,
    lineHeight: 20,
  },
  grimoireList: {
    gap: 6,
  },
  grimoireRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.arcane.border.brassDim,
    paddingBottom: 6,
  },
  grimoireNameBlock: {
    flex: 1,
    minWidth: 0,
  },
  grimoireName: {
    color: colors.arcane.text.strong,
    fontFamily: typography.fontFamily.bodyBold,
    fontSize: 13,
    fontWeight: '700',
  },
  statusText: {
    color: colors.arcane.text.dead,
    fontFamily: typography.fontFamily.body,
    fontSize: 10,
    marginTop: 2,
  },
  grimoireRole: {
    fontFamily: typography.fontFamily.bodyBold,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    flexShrink: 1,
  },
  deadText: {
    opacity: 0.5,
  },
});
