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

  it('adds the base composition tab and handles unknown or unsupported counts', () => {
    expect(source).toContain("{ id: 'composition', label: '인원 구성' }");
    expect(source).toContain('regularPlayerCount?: number');
    expect(source).toContain('getBaseRoleCounts');
    expect(source).toContain('일반 참가자 수를 확인할 수 없습니다.');
    expect(source).toContain('기본 인원 구성은 지원하지 않습니다.');
  });

  it('uses active setup roles and additions for dictionary night-order examples', () => {
    expect(source).toContain('additionalRoleIds?: string[]');
    expect(source).toContain(
      'getNightOrderForEdition(flowEditionId, 1, additionalRoleIds)',
    );
    expect(source).toContain(
      'getNightOrderForEdition(flowEditionId, 2, additionalRoleIds)',
    );
  });

  it('player dictionary uses the configured active setup and regular-player count', () => {
    expect(playerGameSource).toContain('getActiveRoles');
    expect(playerGameSource).toContain(
      'excludedRoleIds: gameSettings.excludedRoleIds',
    );
    expect(playerGameSource).toContain(
      'additionalRoleIds: gameSettings.additionalRoleIds',
    );
    expect(playerGameSource).toContain(
      'additionalRoleIds={dictionaryAdditionalRoleIds}',
    );
    expect(playerGameSource).toContain(
      'regularPlayerCount={regularPlayerCount}',
    );
    expect(playerGameSource).toContain(
      'gamePlayers.filter((player) => !player.isTraveller)',
    );
  });

  it('storyteller dictionary uses the configured active setup and regular-player count', () => {
    expect(storytellerGameSource).toContain('getActiveRoles');
    expect(storytellerGameSource).toContain(
      'excludedRoleIds: gameState.settings.excludedRoleIds',
    );
    expect(storytellerGameSource).toContain(
      'additionalRoleIds: gameState.settings.additionalRoleIds',
    );
    expect(storytellerGameSource).toContain(
      'additionalRoleIds={dictionaryAdditionalRoleIds}',
    );
    expect(storytellerGameSource).toContain(
      'regularPlayerCount={regularPlayerCount}',
    );
    expect(storytellerGameSource).toContain(
      'players.filter((player) => !player.isTraveller)',
    );
  });
});
