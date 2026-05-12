import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../NightActionLog.tsx'),
  'utf8',
);

describe('NightActionLog BMR wiring', () => {
  it('BMR 사망 역할을 행동 버튼 대상으로 등록한다', () => {
    for (const roleId of [
      'zombuul',
      'pukka',
      'shabaloth',
      'po',
      'assassin',
      'godfather',
      'gossip',
      'gambler',
      'moonchild',
      'grandmother',
    ]) {
      expect(source).toContain(`${roleId}: { label: '사망 처리'`);
    }
  });

  it('공유 BMR 판정 경고를 렌더링한다', () => {
    expect(source).toContain('getBmrDeathWarnings');
    expect(source).toContain('bmrWarningBadge');
    expect(source).toContain('warning.message');
  });
});
