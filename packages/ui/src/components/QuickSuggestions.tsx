import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../tokens';
import { matchQuery } from '../utils/chosung';

export type CandidateCategory = 'player' | 'role' | 'status';

export interface TaggedCandidate {
  word: string;
  category: CandidateCategory;
}

const CATEGORY_COLORS = colors.badge;

interface QuickSuggestionsProps {
  text: string;
  candidates: TaggedCandidate[];
  onSelect: (word: string) => void;
}

export function QuickSuggestions({
  text,
  candidates,
  onSelect,
}: QuickSuggestionsProps) {
  const query = useMemo(() => {
    const parts = text.split(/\s+/);
    return parts[parts.length - 1] ?? '';
  }, [text]);

  const filtered = useMemo(() => {
    if (!query) return [];
    return candidates.filter((c) => matchQuery(c.word, query));
  }, [query, candidates]);

  if (filtered.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        contentContainerStyle={styles.scrollContent}
      >
        {filtered.map((item) => {
          const clr = CATEGORY_COLORS[item.category];
          return (
            <Pressable
              key={item.word}
              style={[
                styles.chip,
                {
                  backgroundColor: clr.bg,
                  borderColor: clr.border,
                },
              ]}
              onPress={() => onSelect(item.word)}
            >
              <Text style={[styles.chipText, { color: clr.text }]}>
                {item.word}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.arcane.surface.apparatus,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderColor: colors.arcane.border.brassDim,
    maxHeight: 44,
  },
  scrollContent: {
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.bodyBold,
  },
});
