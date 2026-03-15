import { EDITION_COLORS, EDITION_LABELS } from '@clocktower/shared';
import { Text } from 'react-native';
import { badgeStyle } from './EditionBadge.styles';

export function EditionBadge({
  editionId,
  scale,
}: {
  editionId: string;
  scale: number;
}) {
  const s = (v: number) => Math.round(v * scale);
  const label = EDITION_LABELS[editionId] ?? editionId;
  const color = EDITION_COLORS[editionId] ?? '#908e8a';

  return <Text style={badgeStyle(s, color)}>{label}</Text>;
}
