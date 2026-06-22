import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const grimoireSource = readFileSync(
  resolve(process.cwd(), 'app/game/grimoire.tsx'),
  'utf8',
);
const socketSource = readFileSync(
  resolve(process.cwd(), 'src/hooks/useSocketConnection.ts'),
  'utf8',
);

describe('vote result server authority', () => {
  it('투표 종료는 로컬 과반 계산으로 처형 예정자를 지정하지 않는다', () => {
    expect(grimoireSource).not.toContain('setExecutedPlayerId(nom.nomineeId)');
  });

  it('투표 결과 리스너는 서버 executionCandidate 기준으로 처형 예정자를 추적한다', () => {
    expect(socketSource).toContain(
      'store.setLastExecutedPlayerId(data.executionCandidate.playerId)',
    );
    expect(socketSource).not.toContain(
      'store.setLastExecutedPlayerId(data.nomineeId)',
    );
  });
});
