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

  it('푸카가 중독/취함이면 수동 판정 컨트롤을 제공한다', () => {
    expect(source).toContain('푸카가 중독/취함 상태라 자동 판정 미적용');
    expect(source).toContain('이전 푸카 중독 대상 사망 처리');
    expect(source).toContain("onSetStatus?.(targetId, 'pukka_poisoned')");
  });

  it('사발로스 부활과 무효 수동 판정 컨트롤을 제공한다', () => {
    expect(source).toContain('사발로스가 토해내 부활시킬 수 있는 대상');
    expect(source).toContain('사발로스가 중독/취함 상태라 자동 판정 미적용');
    expect(source).toContain('onSetStatus?.');
    expect(source).toContain('onRemoveStatus?.');
    expect(source).toContain('shabaloth_marked_dead');
  });

  it('포가 중독/취함이면 휴식과 처치 수동 판정 컨트롤을 제공한다', () => {
    expect(source).toContain('포가 중독/취함 상태라 자동 휴식 미적용');
    expect(source).toContain('포 휴식 처리');
    expect(source).toContain('포가 중독/취함 상태라 자동 판정 미적용');
    expect(source).toContain('po_chose_no_one');
    expect(source).toContain('po-manual-kill');
  });

  it('교수 부활과 무효 수동 판정 컨트롤을 제공한다', () => {
    expect(source).toContain("professor: { label: '부활 처리'");
    expect(source).toContain('교수가 중독/취함 상태라 자동 부활 미적용');
    expect(source).toContain('교수 능력 소모 처리');
    expect(source).toContain('onSetStatus?.');
    expect(source).toContain('professor_spent');
    expect(source).toContain('professor-manual-revive');
  });

  it('여관 주인 보호와 취함 수동 판정 컨트롤을 제공한다', () => {
    expect(source).toContain("innkeeper: { label: '보호 처리'");
    expect(source).toContain('여관 주인이 중독/취함 상태라 자동 판정 미적용');
    expect(source).toContain('여관 주인 취함 처리');
    expect(source).toContain('innkeeper_protected');
    expect(source).toContain('innkeeper_drunk');
  });

  it('악마의 변호사 보호 컨트롤을 제공한다', () => {
    expect(source).toContain("devils_advocate: { label: '처형 보호'");
    expect(source).toContain('devils_advocate_protected');
  });
});
