import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const componentSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../NightPanel.tsx'),
  'utf8',
);

const actionsSource = readFileSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    '../../hooks/useGameActions.ts',
  ),
  'utf8',
);

describe('NightPanel BMR assist callbacks', () => {
  it('BMR 판정 보조 액션은 서버 성공 콜백을 받은 뒤에만 완료 처리한다', () => {
    expect(actionsSource).toContain(
      'type BmrAssistCallback = (res: { success: boolean; error?: string }) => void',
    );
    expect(actionsSource).toContain(
      "socket?.emit('courtier:chooseRole', { courtierId, roleId }, callback)",
    );
    expect(actionsSource).toContain("'gambler:guess'");
    expect(actionsSource).toContain('callback,');
    expect(actionsSource).toContain(
      "socket?.emit('gossip:kill', { gossipId, targetPlayerId }, callback)",
    );
    expect(actionsSource).toContain("'moonchild:choose'");
    expect(componentSource).toContain('handleBmrAssistResult');
    expect(componentSource).toContain('if (!result.success) return;');
  });

  it('바리스타 효과는 서버 성공 콜백을 받은 뒤에만 완료 처리한다', () => {
    expect(actionsSource).toContain(
      "socket?.emit('barista:apply', { targetPlayerId, effect }, callback)",
    );
    expect(componentSource).toContain(
      'onApplyBaristaEffect?.(baristaTargetId, effect, handleBmrAssistResult)',
    );
  });

  it('도박사 판정 보조는 사망 플레이어도 대상 후보로 보여준다', () => {
    expect(componentSource).toContain('gamblerCandidatePlayers');
    expect(componentSource).toContain('gamblerCandidatePlayers.map');
  });

  it('사발로스가 깨어나지 않아도 토해내기 후보를 밤 패널에서 처리할 수 있다', () => {
    expect(componentSource).toContain('shabalothRegurgitateCandidates');
    expect(componentSource).toContain('showShabalothRegurgitationPanel');
    expect(componentSource).toContain('onShabalothRegurgitate?.(');
  });

  it('달의 자손 선택 후보는 공개상 생존한 플레이어만 보여준다', () => {
    expect(componentSource).toContain('moonchildCandidatePlayers');
    expect(componentSource).toContain(
      "!player.statuses.includes('zombuul_registers_dead')",
    );
  });
});
