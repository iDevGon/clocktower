import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/components/NightOrderPanel.tsx', 'utf8');

describe('NightOrderPanel source', () => {
  it('filters traveller night order entries unless that traveller is in play', () => {
    expect(source).toContain("role?.team !== 'traveller'");
    expect(source).toContain('activeRoleIds.includes(roleId)');
    expect(source).toContain('visibleOrder');
  });
});
