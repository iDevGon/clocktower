import { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors } from '../tokens';
import type { TaggedCandidate } from './QuickSuggestions';

const BADGE_COLORS = colors.badge;

interface HighlightedMessageProps {
  message: string;
  keywords: TaggedCandidate[];
  baseStyle?: object;
}

export function HighlightedMessage({
  message,
  keywords,
  baseStyle,
}: HighlightedMessageProps) {
  const segments = useMemo(() => {
    if (keywords.length === 0) return [{ text: message, match: null }];

    const sorted = [...keywords].sort((a, b) => b.word.length - a.word.length);

    const result: { text: string; match: TaggedCandidate | null }[] = [];
    let remaining = message;

    while (remaining.length > 0) {
      let earliestIdx = remaining.length;
      let earliestMatch: TaggedCandidate | null = null;

      for (const kw of sorted) {
        const idx = remaining.indexOf(kw.word);
        if (idx !== -1 && idx < earliestIdx) {
          earliestIdx = idx;
          earliestMatch = kw;
        }
      }

      if (!earliestMatch) {
        result.push({ text: remaining, match: null });
        break;
      }

      if (earliestIdx > 0) {
        result.push({ text: remaining.slice(0, earliestIdx), match: null });
      }
      result.push({ text: earliestMatch.word, match: earliestMatch });
      remaining = remaining.slice(earliestIdx + earliestMatch.word.length);
    }

    return result;
  }, [message, keywords]);

  return (
    <Text style={baseStyle}>
      {segments.map((seg, i) => {
        if (!seg.match) {
          return <Text key={i}>{seg.text}</Text>;
        }
        const clr = BADGE_COLORS[seg.match.category];
        return (
          <Text
            key={i}
            style={[
              styles.badge,
              {
                backgroundColor: clr.bg,
                color: clr.text,
                borderColor: clr.border,
              },
            ]}
          >
            {seg.text}
          </Text>
        );
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  badge: {
    fontSize: 13,
    fontWeight: '600',
    borderRadius: 6,
    overflow: 'hidden',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderWidth: 1,
  },
});
