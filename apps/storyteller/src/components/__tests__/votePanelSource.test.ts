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
const votePanelSource = readFileSync(
  resolve(process.cwd(), 'src/components/VotePanel.tsx'),
  'utf8',
);

describe('VotePanel action wiring', () => {
  it('이야기꾼 수동 투표 입력은 서버 성공 콜백을 받을 수 있다', () => {
    expect(actionsSource).toContain(
      "socket?.emit('vote:castForPlayer', { playerId, guilty }, callback)",
    );
    expect(grimoireSource).toContain('castVoteForPlayer(playerId, guilty,');
  });

  it('투표 시작 직후에는 투표 종료 버튼을 비활성화한다', () => {
    expect(votePanelSource).toContain('VOTE_CLOSE_LOCK_MS');
    expect(votePanelSource).toContain('isCloseVoteDisabled');
    expect(votePanelSource).toContain('disabled={isCloseVoteDisabled}');
  });
});
