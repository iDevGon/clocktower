import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('useConnection rejoin state restore', () => {
  const source = readFileSync(
    resolve(__dirname, '../useConnection.ts'),
    'utf8',
  );

  it('직접 재접속 경로에서도 진행 중인 지목과 처형 후보를 복원한다', () => {
    expect(source).toContain('nomination: res.nomination ?? null');
    expect(source).toContain(
      'executionCandidate: res.executionCandidate ?? null',
    );
  });
});
