import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const actionsSource = readFileSync(
  resolve(process.cwd(), 'src/hooks/useGameActions.ts'),
  'utf8',
);
const grimoireSource = readFileSync(
  resolve(process.cwd(), 'app/game/grimoire.tsx'),
  'utf8',
);

describe('traveller approval action wiring', () => {
  it('여행자 승인은 서버 콜백 결과의 playerId로 역할 배정 화면을 연다', () => {
    expect(actionsSource).toContain(
      "s.emit('traveller:approve', { socketId, playerName }, (res) => {",
    );
    expect(actionsSource).toContain('playerId?: string');
    expect(grimoireSource).toContain(
      'const approval = await approveTraveller(socketId, playerName);',
    );
    expect(grimoireSource).toContain(
      "params: { playerId: approval.playerId, travellerOnly: 'true' }",
    );
    expect(grimoireSource).not.toContain(
      'const newTraveller = state?.players.find',
    );
  });
});
