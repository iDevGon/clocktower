import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('JoinScreen automatic rejoin hydration gate', () => {
  const source = readFileSync(
    resolve(__dirname, '../../../app/index.tsx'),
    'utf8',
  );

  it('공통 hydration 구독 helper로 두 persist store의 완료를 기다린다', () => {
    expect(source).toContain('subscribeToPersistHydration');
    expect(source).toContain('storesHydrated');
  });

  it('hydration 이후 저장된 값 변화에 반응하되 같은 세션은 한 번만 시도한다', () => {
    expect(source).toContain('savedPlayerId');
    expect(source).toContain('rejoinAttemptedRef');
    expect(source).toMatch(
      /if \(!storesHydrated \|\| !savedServerUrl \|\| !savedPlayerId\)/,
    );
  });
});
