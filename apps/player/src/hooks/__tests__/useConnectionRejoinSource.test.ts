import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('useConnection rejoin state restore', () => {
  const source = readFileSync(
    resolve(__dirname, '../useConnection.ts'),
    'utf8',
  );

  it('직접 재접속 경로도 공통 상태 패치로 서버 상태를 복원한다', () => {
    expect(source).toContain('buildRejoinStatePatch');
    expect(source).toContain('{ ...previous, playerId }');
  });
});
