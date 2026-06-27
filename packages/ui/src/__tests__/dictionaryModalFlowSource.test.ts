import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/components/DictionaryModal.tsx', 'utf8');

describe('DictionaryModal flow source', () => {
  it('uses selected edition night order instead of static game flow copy', () => {
    expect(source).toContain('editionId?: string');
    expect(source).toContain('getNightOrderForEdition');
    expect(source).toContain('flowEditionId');
    expect(source).not.toContain('GAME_FLOW.map');
  });

  it('renders a node and arrow flow map above labeled phase bands', () => {
    expect(source).toContain('flowRails');
    expect(source).toContain('flowNode');
    expect(source).toContain('flowArrow');
    expect(source).toContain('flowBandLabel');
    expect(source).toContain("'첫째 밤'");
    expect(source).toContain("'모든 밤'");
    expect(source).toContain("'이후 밤'");
    expect(source).toContain("'황혼'");
  });
});
