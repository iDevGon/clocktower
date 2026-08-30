import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/components/DictionaryModal.tsx', 'utf8');
const playerGameSource = readFileSync('../../apps/player/app/game.tsx', 'utf8');
const storytellerGameSource = readFileSync(
  '../../apps/storyteller/app/game/grimoire.tsx',
  'utf8',
);

describe('DictionaryModal flow source', () => {
  it('uses selected edition night order instead of static game flow copy', () => {
    expect(source).toContain('editionId?: string');
    expect(source).toContain('getDictionaryNightRoles');
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

  it('adds the base composition tab and handles unknown or unsupported counts', () => {
    expect(source).toContain("{ id: 'composition', label: '인원 구성' }");
    expect(source).toContain('regularPlayerCount?: number');
    expect(source).toContain('getDictionaryComposition');
  });

  it('has accessible, horizontally scrollable tabs for narrow or large-text layouts', () => {
    expect(source).toContain('accessibilityRole="tab"');
    expect(source).toContain(
      'accessibilityState={{ selected: activeTab === tab.id }}',
    );
    expect(source).toContain('<ScrollView horizontal');
    expect(source).toContain('tabBarContent');
  });

  it('player dictionary uses the configured active setup and regular-player count', () => {
    expect(playerGameSource).toContain('buildDictionarySetup');
    expect(playerGameSource).toContain('roleIds={dictionarySetup.roleIds}');
    expect(playerGameSource).toContain(
      'regularPlayerCount={dictionarySetup.regularPlayerCount}',
    );
    expect(playerGameSource).not.toContain('additionalRoleIds={');
  });

  it('storyteller dictionary uses the configured active setup and regular-player count', () => {
    expect(storytellerGameSource).toContain('buildDictionarySetup');
    expect(storytellerGameSource).toContain(
      'roleIds={dictionarySetup.roleIds}',
    );
    expect(storytellerGameSource).toContain(
      'regularPlayerCount={dictionarySetup.regularPlayerCount}',
    );
    expect(storytellerGameSource).not.toContain('additionalRoleIds={');
  });
});
