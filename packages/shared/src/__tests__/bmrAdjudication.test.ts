import { describe, expect, it } from 'vitest';
import {
  PLAYER_STATUS_COLORS,
  PLAYER_STATUS_DESCRIPTIONS,
  PLAYER_STATUS_LABELS,
  type PlayerStatus,
} from '../types.js';

const BMR_STATUSES = [
  'innkeeper_protected',
  'devils_advocate_protected',
  'tea_lady_protected',
  'sailor_drunk',
  'innkeeper_drunk',
  'courtier_drunk',
  'minstrel_drunk',
  'goon_drunk',
  'pukka_poisoned',
  'zombuul_registers_dead',
  'fool_spent',
  'assassin_spent',
  'professor_spent',
  'courtier_spent',
  'po_chose_no_one',
  'shabaloth_marked_dead',
] as const satisfies readonly PlayerStatus[];

describe('BMR 판정 상태', () => {
  it('모든 BMR 상태는 라벨, 색상, 설명을 가진다', () => {
    for (const status of BMR_STATUSES) {
      expect(PLAYER_STATUS_LABELS[status]).toBeTruthy();
      expect(PLAYER_STATUS_COLORS[status]).toMatch(/^#/);
      expect(PLAYER_STATUS_DESCRIPTIONS[status]).toBeTruthy();
    }
  });
});
