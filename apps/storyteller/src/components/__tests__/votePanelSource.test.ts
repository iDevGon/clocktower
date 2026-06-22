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

describe('VotePanel action wiring', () => {
  it('이야기꾼 수동 투표 입력은 서버 성공 콜백을 받을 수 있다', () => {
    expect(actionsSource).toContain(
      "socket?.emit('vote:castForPlayer', { playerId, guilty }, callback)",
    );
    expect(grimoireSource).toContain('castVoteForPlayer(playerId, guilty,');
  });
});
