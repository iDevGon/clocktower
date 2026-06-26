import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const lobbySource = readFileSync(
  resolve(process.cwd(), 'app/game/lobby.tsx'),
  'utf8',
);

describe('lobby seating source', () => {
  it('좌석 배치 화면은 드래그 토큰으로 플레이어 순서를 바꾼다', () => {
    expect(lobbySource).toContain('DraggablePlayerToken');
    expect(lobbySource).toContain('onSwap={handleSeatSwap}');
    expect(lobbySource).toContain('commitPlayerOrder(nextOrder)');
  });

  it('로비 참가자는 좌석 배치와 목록 보기 사이를 토글할 수 있다', () => {
    expect(lobbySource).toContain('showSeatingBoard');
    expect(lobbySource).toContain('setShowSeatingBoard');
    expect(lobbySource).toContain('renderPlayerList');
    expect(lobbySource).toContain('좌석 배치');
  });
});
