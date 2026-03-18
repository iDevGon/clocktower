import type { Player } from '@clocktower/shared';
import { Text, View } from 'react-native';
import type { createGrimoireStyles } from '../styles/grimoire.styles';

interface EmpathHintBarProps {
  players: Player[];
  empathNeighborIds: Set<string>;
  empathEvilCount: number;
  fontSize: { sm: number; md: number };
  styles: ReturnType<typeof createGrimoireStyles>;
}

export function EmpathHintBar({
  players,
  empathNeighborIds,
  empathEvilCount,
  fontSize,
  styles,
}: EmpathHintBarProps) {
  if (empathNeighborIds.size === 0) return null;

  return (
    <View style={styles.empathHintBar}>
      <Text style={[styles.empathHintLabel, { fontSize: fontSize.sm }]}>
        초공감자 이웃:
      </Text>
      <Text style={[styles.empathHintNames, { fontSize: fontSize.sm }]}>
        {players
          .filter((p) => empathNeighborIds.has(p.id))
          .map((p) => p.name)
          .join(', ')}
      </Text>
      <Text style={[styles.empathHintCount, { fontSize: fontSize.md }]}>
        악한 {empathEvilCount}명
      </Text>
    </View>
  );
}

interface ChefHintBarProps {
  players: Player[];
  playerOrder: string[];
  chefEvilPairIds: Set<string>;
  chefEvilPairCount: number;
  fontSize: { sm: number; md: number };
  styles: ReturnType<typeof createGrimoireStyles>;
}

export function ChefHintBar({
  players,
  playerOrder,
  chefEvilPairIds,
  chefEvilPairCount,
  fontSize,
  styles,
}: ChefHintBarProps) {
  if (chefEvilPairIds.size === 0) return null;

  return (
    <View style={styles.chefHintBar}>
      <Text style={[styles.chefHintLabel, { fontSize: fontSize.sm }]}>
        인접 악한 쌍:
      </Text>
      <Text style={[styles.chefHintNames, { fontSize: fontSize.sm }]}>
        {(() => {
          const order = playerOrder;
          const pairs: string[] = [];
          for (let i = 0; i < order.length; i++) {
            const curr = order[i];
            const next = order[(i + 1) % order.length];
            const cp = players.find((p) => p.id === curr);
            const np = players.find((p) => p.id === next);
            const isEvil = (p: typeof cp) =>
              p?.role?.team === 'minion' || p?.role?.team === 'demon';
            if (isEvil(cp) && isEvil(np)) {
              pairs.push(`${cp?.name}-${np?.name}`);
            }
          }
          return pairs.join(', ') || '없음';
        })()}
      </Text>
      <Text style={[styles.chefHintCount, { fontSize: fontSize.md }]}>
        {chefEvilPairCount}쌍
      </Text>
    </View>
  );
}
