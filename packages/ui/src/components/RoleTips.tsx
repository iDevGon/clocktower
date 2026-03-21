import { getCharacterTips } from '@clocktower/shared';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface RoleTipsProps {
  roleId: string;
  /** 플레이 팁만 표시 (직업 카드용) */
  playOnly?: boolean;
}

export function RoleTips({ roleId, playOnly }: RoleTipsProps) {
  const tips = getCharacterTips(roleId);
  const [expanded, setExpanded] = useState(false);
  const toggle = useCallback(() => setExpanded((v) => !v), []);

  if (!tips) return null;

  return (
    <View style={tipStyles.container}>
      <Pressable onPress={toggle} style={tipStyles.toggleRow}>
        <Text style={tipStyles.toggleIcon}>{expanded ? '▾' : '▸'}</Text>
        <Text style={tipStyles.toggleText}>플레이 팁</Text>
      </Pressable>
      {expanded && (
        <View style={tipStyles.content}>
          {!playOnly && (
            <Text style={tipStyles.sectionLabel}>이 역할로 플레이할 때</Text>
          )}
          {tips.playTips.map((tip) => (
            <View key={tip} style={tipStyles.tipRow}>
              <Text style={tipStyles.bullet}>•</Text>
              <Text style={tipStyles.tipText}>{tip}</Text>
            </View>
          ))}
          {!playOnly && (
            <>
              <Text style={[tipStyles.sectionLabel, { marginTop: 10 }]}>
                이 역할을 상대할 때
              </Text>
              {tips.counterTips.map((tip) => (
                <View key={tip} style={tipStyles.tipRow}>
                  <Text style={tipStyles.bullet}>•</Text>
                  <Text style={tipStyles.tipText}>{tip}</Text>
                </View>
              ))}
            </>
          )}
        </View>
      )}
    </View>
  );
}

const tipStyles = StyleSheet.create({
  container: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#2e2e34',
    paddingTop: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  toggleIcon: {
    color: '#5dade2',
    fontSize: 12,
    width: 14,
  },
  toggleText: {
    color: '#5dade2',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    marginTop: 8,
  },
  sectionLabel: {
    color: '#7a7870',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  tipRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
    paddingLeft: 4,
  },
  bullet: {
    color: '#5c5a58',
    fontSize: 12,
    lineHeight: 18,
  },
  tipText: {
    color: '#908e8a',
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
});
