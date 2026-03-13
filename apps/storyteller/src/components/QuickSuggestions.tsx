import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const CHOSUNG = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ',
  'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
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

interface QuickSuggestionsProps {
  text: string;
  candidates: string[];
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
    return candidates.filter((c) => matchQuery(c, query));
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
        {filtered.map((word) => (
          <Pressable
            key={word}
            style={styles.chip}
            onPress={() => onSelect(word)}
          >
            <Text style={styles.chipText}>{word}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderColor: '#2e2e34',
    maxHeight: 44,
  },
  scrollContent: {
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    backgroundColor: '#2e2e34',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    color: '#e0ddd8',
    fontSize: 13,
  },
});
