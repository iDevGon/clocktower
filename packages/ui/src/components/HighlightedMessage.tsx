import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../tokens';
import { segmentHighlightedMessage } from '../utils/chat';
import type { TaggedCandidate } from './QuickSuggestions';

const BADGE_COLORS = colors.badge;

interface HighlightedMessageProps {
  message: string;
  keywords: TaggedCandidate[];
  baseStyle?: object | object[];
}

export function HighlightedMessage({
  message,
  keywords,
  baseStyle,
}: HighlightedMessageProps) {
  const baseStyleFlat = StyleSheet.flatten(baseStyle);

  const segments = useMemo(() => {
    return segmentHighlightedMessage(message, keywords);
  }, [message, keywords]);

  return (
    <View style={styles.container}>
      {segments.map((seg, i) => {
        if (!seg.match) {
          return (
            <Text key={i} style={baseStyleFlat}>
              {seg.text}
            </Text>
          );
        }
        const clr = BADGE_COLORS[seg.match.category];
        return (
          <View
            key={i}
            style={[
              styles.badge,
              {
                backgroundColor: clr.bg,
                borderColor: clr.border,
              },
            ]}
          >
            <Text style={[styles.badgeText, { color: clr.text }]}>
              {seg.text}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  badge: {
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    marginVertical: 1,
  },
  badgeText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.bodyBold,
  },
});
