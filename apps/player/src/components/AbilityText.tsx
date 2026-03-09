import { useState, useCallback, useRef } from 'react';
import {
  Text,
  Pressable,
  View,
  StyleSheet,
  Dimensions,
  type TextStyle,
  Modal,
} from 'react-native';

/** *로 표시된 키워드와 그 설명 */
const GLOSSARY: Record<string, string> = {
  '밤*': '첫째 밤에는 적용되지 않습니다. (첫째 밤 제외)',
};

const TOOLTIP_MAX_WIDTH = 240;
const SCREEN_PADDING = 12;

interface AbilityTextProps {
  text: string;
  style?: TextStyle;
}

/**
 * 능력 텍스트에서 *가 붙은 키워드를 하이라이트하고,
 * 터치하면 툴팁으로 상세 설명을 보여줍니다.
 */
export function AbilityText({ text, style }: AbilityTextProps) {
  const [tooltip, setTooltip] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);

  const handlePress = useCallback((keyword: string, event: { nativeEvent: { pageX: number; pageY: number } }) => {
    const description = GLOSSARY[keyword];
    if (!description) return;

    const screenWidth = Dimensions.get('window').width;
    const centerX = event.nativeEvent.pageX;

    const halfTooltip = TOOLTIP_MAX_WIDTH / 2;
    const clampedX = Math.max(
      SCREEN_PADDING + halfTooltip,
      Math.min(centerX, screenWidth - SCREEN_PADDING - halfTooltip),
    );

    setTooltip({
      text: description,
      x: clampedX,
      y: event.nativeEvent.pageY,
    });
  }, []);

  const dismissTooltip = useCallback(() => {
    setTooltip(null);
  }, []);

  const parts = parseAbilityText(text);

  return (
    <>
      <Text style={[styles.base, style]}>
        {parts.map((part, i) =>
          part.isKeyword ? (
            <Text
              key={`${part.display}-${i}`}
              style={[styles.base, style, styles.keyword]}
              onPress={(e) => handlePress(part.raw, e)}
            >
              {part.display}
            </Text>
          ) : (
            <Text key={`text-${i}`}>{part.text}</Text>
          ),
        )}
      </Text>

      {tooltip && (
        <Modal
          transparent
          animationType="fade"
          visible
          onRequestClose={dismissTooltip}
        >
          <Pressable style={styles.overlay} onPress={dismissTooltip}>
            <View
              style={[
                styles.tooltipContainer,
                {
                  left: tooltip.x,
                  top: tooltip.y - 8,
                },
              ]}
            >
              <View style={styles.tooltip}>
                <Text style={styles.tooltipText}>{tooltip.text}</Text>
              </View>
              <View style={styles.tooltipArrow} />
            </View>
          </Pressable>
        </Modal>
      )}
    </>
  );
}

type ParsedPart =
  | { isKeyword: true; raw: string; display: string }
  | { isKeyword: false; text: string };

function parseAbilityText(text: string): ParsedPart[] {
  const parts: ParsedPart[] = [];
  const regex = /(\S+)\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while (true) {
    match = regex.exec(text);
    if (!match) break;
    const fullMatch = match[0];
    const word = match[1];

    if (match.index > lastIndex) {
      parts.push({ isKeyword: false, text: text.slice(lastIndex, match.index) });
    }

    if (GLOSSARY[fullMatch]) {
      parts.push({ isKeyword: true, raw: fullMatch, display: word });
    } else {
      parts.push({ isKeyword: false, text: fullMatch });
    }

    lastIndex = match.index + fullMatch.length;
  }

  if (lastIndex < text.length) {
    parts.push({ isKeyword: false, text: text.slice(lastIndex) });
  }

  return parts;
}

const styles = StyleSheet.create({
  base: {
    color: '#b8b6b2',
    fontSize: 14,
    lineHeight: 20,
  },
  keyword: {
    color: '#e8c460',
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
  },
  overlay: {
    flex: 1,
  },
  tooltipContainer: {
    position: 'absolute',
    transform: [{ translateX: '-50%' }, { translateY: '-100%' }],
    alignItems: 'center',
  },
  tooltip: {
    backgroundColor: '#2a2a30',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e8c46040',
    maxWidth: TOOLTIP_MAX_WIDTH,
  },
  tooltipText: {
    color: '#e0ddd8',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  tooltipArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#2a2a30',
  },
});
