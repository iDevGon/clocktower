import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const actionsSource = readFileSync('src/hooks/useGameActions.ts', 'utf8');
const modalSource = readFileSync('src/components/ExileVoteModal.tsx', 'utf8');

describe('ExileVoteModal action wiring', () => {
  it('추방 투표는 서버 성공 콜백 후에만 투표 완료 상태로 전환한다', () => {
    expect(actionsSource).toContain(
      "socket.emit('exile:vote', { guilty }, (res) => resolve(res));",
    );
    expect(modalSource).toContain('onVote(guilty).then((res) => {');
    expect(modalSource).toContain('if (res.success) setHasVoted(true);');
    expect(modalSource).not.toContain(`setHasVoted(true);
      onVote(guilty);`);
  });
});
