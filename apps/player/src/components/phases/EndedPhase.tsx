import type { GameResult } from '@clocktower/shared';
import { Text, View } from 'react-native';
import { styles } from '../../styles/game.styles';
import { endedStyles, getPlayerRowOpacity } from '../PhaseContent.styles';

const TEAM_LABELS: Record<string, string> = {
  townsfolk: '마을주민',
  outsider: '외지인',
  minion: '하수인',
  demon: '악마',
};

const TEAM_COLORS: Record<string, string> = {
  townsfolk: '#5dade2',
  outsider: '#5dade2',
  minion: '#e74c3c',
  demon: '#e74c3c',
};

interface EndedPhaseProps {
  visible: boolean;
  gameResult: GameResult | null;
}

export function EndedPhase({ visible, gameResult }: EndedPhaseProps) {
  if (!visible) return null;
  const isGoodWin = gameResult?.winningTeam === 'good';
  return (
    <View style={styles.phaseContentLarge}>
      <Text
        style={[
          styles.endedTitle,
          { color: isGoodWin ? '#5dade2' : '#e74c3c' },
        ]}
      >
        {isGoodWin ? '선한 팀 승리!' : '악한 팀 승리!'}
      </Text>
      {gameResult && (
        <>
          <Text style={styles.phaseDescription}>{gameResult.reason}</Text>
          <View style={endedStyles.playerListContainer}>
            {gameResult.players.map((p) => (
              <View
                key={p.id}
                style={[endedStyles.playerRow, getPlayerRowOpacity(p.isAlive)]}
              >
                <Text style={endedStyles.playerName}>
                  {p.name}
                  {!p.isAlive ? ' (사망)' : ''}
                </Text>
                <Text
                  style={[
                    endedStyles.playerRole,
                    { color: TEAM_COLORS[p.team] ?? '#888' },
                  ]}
                >
                  {p.role.name} ({TEAM_LABELS[p.team] ?? p.team})
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
      {!gameResult && (
        <Text style={styles.phaseDescription}>게임이 끝났습니다.</Text>
      )}
    </View>
  );
}
