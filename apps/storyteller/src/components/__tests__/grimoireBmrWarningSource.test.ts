import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  resolve(process.cwd(), 'app/game/grimoire.tsx'),
  'utf8',
);

describe('grimoire BMR death warnings', () => {
  it('수동 사망 처리 전에 공유 BMR 판정 경고를 확인한다', () => {
    expect(source).toContain('getBmrDeathWarnings');
    expect(source).toContain('showDeathWarningModal');
    expect(source).toContain("getDeathWarningText(playerId, 'manual'");
    expect(source).toContain('생존 처리');
    expect(source).toContain("applyPlayerStatus(playerId, 'fool_spent')");
    expect(source).toContain(
      "applyPlayerStatus(playerId, 'zombuul_registers_dead')",
    );
    expect(source).toContain('그래도 사망 처리');
  });

  it('낮에서 밤으로 전환하기 전에 처형 예정자 판정 경고를 보여준다', () => {
    expect(source).toContain('getExecutionTransitionWarningText');
    expect(source).toContain(
      "getDeathWarningText(candidateId, 'execution', 'day')",
    );
    expect(source).toContain('players: gameState?.players');
    expect(source).toContain('pacifist_may_save_good');
    expect(source).toContain('평화주의자 생존 처리');
    expect(source).toContain('skipExecution: true');
    expect(source).toContain('처형 판정 확인');
  });

  it('달의 자손 낮 사망 후 공개 선택을 앱에서 예약할 수 있다', () => {
    expect(source).toContain('showMoonchildChoiceModal');
    expect(source).toContain('달의 자손 선택 처리');
    expect(source).toContain('deferToNight: true');
  });
});
