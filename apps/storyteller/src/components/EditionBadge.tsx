import { EDITION_COLORS, EDITION_LABELS } from '@clocktower/shared';
import { Text } from 'react-native';

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

  return (
    <Text
      style={{
        fontSize: s(9),
        fontWeight: '700',
        color,
        borderWidth: 1,
        borderColor: color,
        borderRadius: 3,
        paddingHorizontal: s(4),
        paddingVertical: s(1),
        overflow: 'hidden',
      }}
    >
      {label}
    </Text>
  );
}
