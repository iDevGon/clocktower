import type { GameResult, Player } from '@clocktower/shared';
import { Pressable, Text, View } from 'react-native';
import type { createGrimoireStyles } from '../styles/grimoire.styles';
import { grimoireDynamic } from '../styles/grimoire.styles';

interface ExecutionBannerProps {
  executedPlayer: Player;
  onDismiss: () => void;
  styles: ReturnType<typeof createGrimoireStyles>;
}

export function ExecutionBanner({
  executedPlayer,
  onDismiss,
  styles,
}: ExecutionBannerProps) {
  return (
    <View style={styles.executionBanner}>
      <View style={styles.executionBannerContent}>
        <Text style={styles.executionBannerLabel}>오늘 처형</Text>
        <Text style={styles.executionBannerRole}>
          {executedPlayer.role?.name ?? '역할 미배정'}
        </Text>
        <Text style={styles.executionBannerName}>
          {executedPlayer.name}
        </Text>
      </View>
      <Pressable
        onPress={onDismiss}
        style={styles.executionBannerDismiss}
      >
        <Text style={styles.executionBannerDismissText}>닫기</Text>
      </Pressable>
    </View>
  );
}

interface GameEndBannerProps {
  gameResult: GameResult;
  fontSize: { sm: number; lg: number };
  styles: ReturnType<typeof createGrimoireStyles>;
}

export function GameEndBanner({
  gameResult,
  fontSize,
  styles,
}: GameEndBannerProps) {
  return (
    <View
      style={
        gameResult.winningTeam === 'good'
          ? styles.gameEndBannerGood
          : styles.gameEndBannerEvil
      }
    >
      <Text
        style={[
          grimoireDynamic.gameEndWinnerText(
            gameResult.winningTeam === 'good',
          ),
          { fontSize: fontSize.lg },
        ]}
      >
        {gameResult.winningTeam === 'good'
          ? '선한 팀 승리!'
          : '악한 팀 승리!'}
      </Text>
      <Text style={[styles.gameEndReason, { fontSize: fontSize.sm }]}>
        {gameResult.reason}
      </Text>
    </View>
  );
}
