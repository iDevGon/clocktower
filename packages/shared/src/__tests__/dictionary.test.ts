import { describe, expect, it } from 'vitest';
import { STATUS_ENTRIES } from '../dictionary.js';

describe('STATUS_ENTRIES', () => {
  it('사전에는 실제 그리모어에 올리는 상태/리마인더 표식만 노출한다', () => {
    expect(STATUS_ENTRIES.map((entry) => entry.id)).toEqual([
      'poisoned',
      'drunk',
      'protected',
      'cursed',
      'master',
      'witch_cursed',
      'cerenovus_mad',
      'good_twin',
      'evil_twin',
      'no_ability',
      'bone_collector_ability',
      'barista_sober_healthy',
      'barista_acts_twice',
      'no_dashii_poisoned',
      'vigormortis_poisoned',
      'vigormortis_retained',
    ]);

    expect(STATUS_ENTRIES.map((entry) => entry.id)).not.toContain(
      'misregistered',
    );
    expect(STATUS_ENTRIES.find((entry) => entry.id === 'cursed')?.label).toBe(
      '붉은 청어',
    );
  });
});
