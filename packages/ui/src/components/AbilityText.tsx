import { StyleSheet, Text, type TextStyle, View } from 'react-native';

/** *로 표시된 키워드와 하단 각주 설명 */
const FOOTNOTES: Record<string, string> = {
  '밤*': '첫째 밤에는 적용되지 않습니다. (첫째 밤 제외)',
};

interface AbilityTextProps {
  text: string;
  style?: TextStyle;
}

/**
 * 능력 텍스트를 렌더링하고, *가 붙은 키워드가 있으면
 * 하단에 각주로 설명을 표시합니다.
 */
export function AbilityText({ text, style }: AbilityTextProps) {
  const { parts, footnotes } = parseAbilityText(text);

  return (
    <View>
      <Text style={[styles.base, style]}>
        {parts.map((part, i) =>
          part.highlighted ? (
            <Text key={i} style={styles.keyword}>
              {part.text}
            </Text>
          ) : (
            <Text key={i}>{part.text}</Text>
          ),
        )}
      </Text>
      {footnotes.length > 0 && (
        <View style={styles.footnoteContainer}>
          {footnotes.map((note) => (
            <Text key={note} style={[styles.base, style, styles.footnote]}>
              {note}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

type ParsedPart = { text: string; highlighted: boolean };

function parseAbilityText(text: string): {
  parts: ParsedPart[];
  footnotes: string[];
} {
  const parts: ParsedPart[] = [];
  const footnotes: string[] = [];
  const regex = /\S+\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while (true) {
    match = regex.exec(text);
    if (!match) break;

    if (match.index > lastIndex) {
      parts.push({
        text: text.slice(lastIndex, match.index),
        highlighted: false,
      });
    }
    parts.push({ text: match[0], highlighted: !!FOOTNOTES[match[0]] });
    if (FOOTNOTES[match[0]]) {
      footnotes.push(FOOTNOTES[match[0]]);
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), highlighted: false });
  }

  return { parts, footnotes };
}

const styles = StyleSheet.create({
  base: {
    color: '#b8b6b2',
    fontSize: 14,
    lineHeight: 20,
  },
  footnoteContainer: {
    marginTop: 6,
  },
  keyword: {
    color: '#e8c460',
  },
  footnote: {
    color: '#e8c460',
    fontStyle: 'italic',
  },
});
