import {
  type NightFeedbackPayload,
  PLAYER_STATUS_LABELS,
  type Team,
} from '@clocktower/shared';
import { colors, Ornament, PaperTexture, WaxSeal } from '@clocktower/ui';
import { Text, View } from 'react-native';
import Animated, { Easing, FadeIn, ZoomIn } from 'react-native-reanimated';
import {
  compactStyles,
  inlineStyles,
  sharedStyles,
} from './FeedbackDisplay.styles';

const TEAM_INK: Record<Team, string> = {
  townsfolk: colors.twilight.deep,
  outsider: colors.verdure.deep,
  minion: colors.ember.deep,
  demon: colors.crimson.deep,
  traveller: colors.bruise.deep,
};

interface FeedbackDisplayProps {
  feedback: NightFeedbackPayload;
  /** compact = 히스토리 모달용 작은 버전 */
  compact?: boolean;
}

/**
 * 밤 피드백 = "답장이 도착했다" — 양피지 조각 메타포.
 * 배경 다크 테마 위에 크림 종이로 나타나 한 조각의 진실을 전달.
 */
export function FeedbackDisplay({ feedback, compact }: FeedbackDisplayProps) {
  const S = compact ? compactStyles : inlineStyles;

  switch (feedback.type) {
    case 'number':
      return (
        <Animated.View
          entering={ZoomIn.duration(420).easing(Easing.out(Easing.cubic))}
          style={S.paper}
        >
          <PaperTexture />
          {compact ? null : <Text style={S.eyebrow}>답장</Text>}
          <Text style={S.number}>{feedback.value}</Text>
          <Ornament
            kind="rule"
            width={compact ? 60 : 100}
            color={sharedStyles.papyrusEdge.color}
            style={sharedStyles.rule}
          />
        </Animated.View>
      );
    case 'yes_no':
      return (
        <Animated.View
          entering={ZoomIn.duration(420).easing(Easing.out(Easing.cubic))}
          style={S.paper}
        >
          <PaperTexture />
          {compact ? null : <Text style={S.eyebrow}>답장</Text>}
          {feedback.targetNames?.length ? (
            <Text style={sharedStyles.targetNames}>
              {feedback.targetNames.join(' · ')}
            </Text>
          ) : null}
          {/* 도장: yes=verdure lily, no=crimson bat */}
          <Animated.View
            entering={ZoomIn.delay(200)
              .duration(340)
              .easing(Easing.out(Easing.cubic))}
            style={sharedStyles.stampWrap}
          >
            <WaxSeal
              size={compact ? 40 : 56}
              tone={feedback.value ? 'verdure' : 'crimson'}
              glyph={feedback.value ? 'lily' : 'bat'}
            />
          </Animated.View>
          <Text
            style={[
              S.verdict,
              {
                color: feedback.value
                  ? colors.verdure.deep
                  : colors.crimson.deep,
              },
            ]}
          >
            {feedback.value ? '그렇다' : '아니다'}
          </Text>
        </Animated.View>
      );
    case 'players_and_role':
      return (
        <Animated.View
          entering={ZoomIn.duration(420).easing(Easing.out(Easing.cubic))}
          style={S.paper}
        >
          <PaperTexture />
          {compact ? null : <Text style={S.eyebrow}>답장</Text>}
          <Text style={sharedStyles.bodyText}>
            {feedback.playerNames.map((name, i) => (
              <Text key={name}>
                {i > 0 ? ' 과(와) ' : ''}
                <Text style={sharedStyles.bodyHighlight}>{name}</Text>
              </Text>
            ))}
          </Text>
          <Text style={sharedStyles.bodyText}>
            중 한 명이{' '}
            <Text style={sharedStyles.bodyHighlight}>{feedback.roleName}</Text>
            입니다
          </Text>
        </Animated.View>
      );
    case 'role':
      return (
        <Animated.View
          entering={ZoomIn.duration(420).easing(Easing.out(Easing.cubic))}
          style={S.paper}
        >
          <PaperTexture />
          {compact ? null : <Text style={S.eyebrow}>답장</Text>}
          <Text style={S.roleName}>{feedback.roleName}</Text>
          <Ornament
            kind="rule"
            width={compact ? 60 : 100}
            color={sharedStyles.papyrusEdge.color}
            style={sharedStyles.rule}
          />
        </Animated.View>
      );
    case 'no_match':
      return (
        <Animated.View
          entering={FadeIn.duration(500)}
          style={[S.paper, sharedStyles.paperMuted]}
        >
          <PaperTexture />
          {compact ? null : <Text style={S.eyebrow}>답장</Text>}
          <Text style={S.quiet}>{feedback.message}</Text>
        </Animated.View>
      );
    case 'grimoire':
      return (
        <Animated.View entering={FadeIn.duration(520)} style={S.paper}>
          <PaperTexture />
          <Text style={S.eyebrow}>마법서</Text>
          <View style={sharedStyles.grimoireList}>
            {feedback.entries.map((entry) => (
              <View
                key={entry.name}
                style={[
                  sharedStyles.grimoireRow,
                  entry.isAlive ? null : sharedStyles.grimoireRowDead,
                ]}
              >
                <View style={sharedStyles.grimoireNameCol}>
                  <Text
                    style={[
                      sharedStyles.grimoireName,
                      entry.isAlive ? null : sharedStyles.grimoireNameDead,
                    ]}
                  >
                    {entry.name}
                  </Text>
                  {entry.statuses.length > 0 ? (
                    <View style={sharedStyles.grimoireStatusRow}>
                      {entry.statuses.map((status) => (
                        <Text key={status} style={sharedStyles.grimoireStatus}>
                          {PLAYER_STATUS_LABELS[status]}
                        </Text>
                      ))}
                    </View>
                  ) : null}
                </View>
                <Text
                  style={[
                    sharedStyles.grimoireRole,
                    { color: TEAM_INK[entry.team] },
                    entry.isAlive ? null : { opacity: 0.45 },
                  ]}
                >
                  {entry.roleName}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>
      );
  }
}
