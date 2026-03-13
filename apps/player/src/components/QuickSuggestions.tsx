import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const CHOSUNG = [
  'ㄱ',
  'ㄲ',
  'ㄴ',
  'ㄷ',
  'ㄸ',
  'ㄹ',
  'ㅁ',
  'ㅂ',
  'ㅃ',
  'ㅅ',
  'ㅆ',
  'ㅇ',
  'ㅈ',
  'ㅉ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ',
];

function getChosung(str: string): string {
  return [...str]
    .map((ch) => {
      const code = ch.charCodeAt(0) - 0xac00;
      if (code < 0 || code > 11171) return ch;
      return CHOSUNG[Math.floor(code / 588)];
    })
    .join('');
}

function isChosungOnly(str: string): boolean {
  return [...str].every((ch) => CHOSUNG.includes(ch));
}

function matchQuery(candidate: string, query: string): boolean {
  const lower = query.toLowerCase();
  if (candidate.toLowerCase().includes(lower)) return true;
  if (isChosungOnly(query)) {
    return getChosung(candidate).startsWith(query);
  }
  return false;
}

export type CandidateCategory = 'player' | 'role' | 'status';

export interface TaggedCandidate {
  word: string;
  category: CandidateCategory;
}

const CATEGORY_COLORS: Record<
  CandidateCategory,
  { bg: string; text: string; border: string }
> = {
  player: { bg: '#1a2e1a', text: '#7dce82', border: '#2e4a2e' },
  role: { bg: '#1a1e2e', text: '#82a8ce', border: '#2e3a4e' },
  status: { bg: '#2e1a1e', text: '#ce8282', border: '#4e2e2e' },
};

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
  const matches = useMemo(() => {
    const parts = text.split(/\s+/);
    const lastWord = parts[parts.length - 1] ?? '';
    if (!lastWord) return [];
    return candidates.filter((c) => matchQuery(c.word, lastWord));
  }, [text, candidates]);

  if (matches.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        contentContainerStyle={styles.scrollContent}
      >
        {matches.map((item) => {
          const colors = CATEGORY_COLORS[item.category];
          return (
            <Pressable
              key={item.word}
              style={[
                styles.chip,
                {
                  backgroundColor: colors.bg,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => onSelect(item.word)}
            >
              <Text style={[styles.chipText, { color: colors.text }]}>
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
    maxHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderColor: '#2e2e34',
    backgroundColor: '#1a1a1e',
  },
  scrollContent: {
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
