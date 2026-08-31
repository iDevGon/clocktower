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

const grimoireSource = readFileSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    '../../../app/game/grimoire.tsx',
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
    expect(actionsSource).toContain(".emit('gambler:reviewGuess'");
    expect(actionsSource).not.toContain("'gambler:guess'");
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

  it('철학자 fallback은 도박사에만 적용하고 다른 BMR 판정 패널은 유지한다', () => {
    expect(componentSource).toMatch(
      /activeNightRoleId === 'gambler' &&\s+p\.role\?\.id === 'philosopher' &&\s+p\.philosopherGrantedRole === activeNightRoleId/,
    );
    expect(componentSource).not.toMatch(
      /\(p\.role\?\.id === 'philosopher' &&\s+p\.philosopherGrantedRole === activeNightRoleId\)/,
    );
  });

  it('도박사 제출을 편집해 승인하거나 반려할 수 있도록 pending 요청을 연결한다', () => {
    expect(grimoireSource).toContain(
      'pendingGamblerGuess={gameState.pendingGamblerGuess ?? null}',
    );
    expect(grimoireSource).toContain(
      'onReviewGamblerGuess={reviewGamblerGuess}',
    );
    expect(componentSource).toContain('플레이어 제출 대기 중');
    expect(componentSource).toContain('accessibilityLabel="도박사 추측 승인"');
    expect(componentSource).toContain('accessibilityLabel="도박사 추측 반려"');
    expect(componentSource).toContain('승인');
    expect(componentSource).toContain('반려');
  });

  it('도박사 승인과 반려 버튼은 모두 48px 이상의 터치 영역을 가진다', () => {
    const reviewButtons = componentSource.match(
      /accessibilityLabel="도박사 추측 (?:승인|반려)"[\s\S]{0,700}?minHeight: 48/g,
    );

    expect(reviewButtons).toHaveLength(2);
  });

  it('도박사 검토는 역할 전체 완료 처리 대신 요청 단위 pending 상태로 제어한다', () => {
    expect(componentSource).toContain(
      "activeNightRoleId === 'gambler' && pendingGamblerGuess != null",
    );
    expect(componentSource).not.toMatch(
      /onReviewGamblerGuess[\s\S]{0,500}handleBmrAssistResult/,
    );
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

  it('궁정대신과 도박사 역할 후보는 현재 스크립트 역할만 사용한다', () => {
    expect(componentSource).toContain(
      'const gameRoles = useGameEditionRoles(players)',
    );
    expect(componentSource).toContain('gameRoles.map((role)');
    expect(componentSource).not.toContain('ALL_ROLES.map((role)');
  });

  it('BMR 행동 차례에 역할별 판정 보조 안내를 보여준다', () => {
    expect(componentSource).toContain('BMR_ROLE_ASSIST_NOTES');
    expect(componentSource).toContain(
      '하녀가 선택한 두 플레이어 중 오늘 밤 자기 능력으로 깨어난 수',
    );
    expect(componentSource).toContain(
      '푸카는 이전 중독자를 먼저 사망 처리하고 새 중독 대상을 기록',
    );
    expect(componentSource).toContain(
      '포가 아무도 선택하지 않으면 다음 밤 3명 처치가 가능',
    );
  });
});
