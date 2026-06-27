import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  resolve(process.cwd(), 'app/game/nominate.tsx'),
  'utf8',
);

describe('NominateScreen source', () => {
  it('이야기꾼 지명 화면은 서버 성공 콜백 후에만 뒤로 이동한다', () => {
    expect(source).toContain('nominate(nominatorId, nomineeId, (result) => {');
    expect(source).toContain('if (result.success) router.back()');
  });

  it('피지목자는 사망 플레이어도 선택할 수 있다', () => {
    expect(source).toContain('nominatorPlayers');
    expect(source).toContain('nomineePlayers');
    expect(source).toContain('players.filter((p) => p.isAlive)');
    expect(source).toContain('players.filter((p) => p.id !== nominatorId)');
  });
});
