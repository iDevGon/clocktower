import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/components/FeedbackHistoryModal.tsx', 'utf8');

describe('FeedbackHistoryModal scrolling', () => {
  it('does not wrap the modal container in a Pressable that can steal scroll gestures', () => {
    expect(source).not.toContain('<Pressable style={styles.container}');
  });

  it('keeps the feedback history list configured as a nested scroll area', () => {
    const historyScroll = source.match(
      /<ScrollView[\s\S]*?style=\{styles\.list\}[\s\S]*?>/,
    )?.[0];

    expect(historyScroll).toContain('nestedScrollEnabled');
  });
});
