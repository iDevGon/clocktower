import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  resolve(process.cwd(), 'app/game/grimoire.tsx'),
  'utf8',
);

describe('grimoire ability malfunction warnings', () => {
  it('S&V daytime information requests receive poisoning/drunkenness warnings', () => {
    expect(source).toContain('getAbilityMalfunctionWarning');
    expect(source).toContain('const savantWarningText = useMemo');
    expect(source).toContain('const artistWarningText = useMemo');
    expect(source).toContain('warningText={savantWarningText}');
    expect(source).toContain('warningText={artistWarningText}');
  });

  it('detects all scripted editions before choosing night order helpers', () => {
    expect(source).toContain('BAD_MOON_RISING_ROLES');
    expect(source).toContain('SECTS_AND_VIOLETS_ROLES');
    expect(source).toContain("return 'bad_moon_rising'");
    expect(source).toContain("hasSv ? 'sects_and_violets'");
  });

  it('얼뜨기 선택 모달은 서버 성공 콜백 후에 닫는다', () => {
    expect(source).toContain('klutzChoose(klutzDiedPending.klutzId, playerId,');
    expect(source).toContain('if (result.success) setKlutzDiedPending(null)');
  });

  it('사악한 쌍둥이 모달은 서버 성공 콜백 후에 닫는다', () => {
    expect(source).toContain('assignGoodTwin(activeEvilTwin.id, playerId,');
    expect(source).toContain(
      'if (result.success) setEvilTwinModalDismissed(true)',
    );
  });

  it('이발사 교환 모달은 서버 성공 콜백 후에 닫는다', () => {
    expect(source).toContain('barberSwapRoles(playerId1, playerId2,');
    expect(source).toContain('if (result.success) setBarberDiedPending(null)');
  });

  it('이발사 교환 모달 닫기는 서버의 대기 교환도 스킵 처리한다', () => {
    expect(source).toContain('barberSkipSwap((result) => {');
    expect(source).toContain('if (result.success) setBarberDiedPending(null)');
  });

  it('사랑꾼 취함 모달은 서버 성공 콜백 후에 닫거나 스킵한다', () => {
    expect(source).toContain('sweetheartDrunk(playerId, (result) => {');
    expect(source).toContain('sweetheartSkipDrunk((result) => {');
    expect(source).toContain('if (result.success) clearSweetheartDied()');
  });

  it('시장 리다이렉트 모달은 서버 성공 콜백 후에 닫거나 스킵한다', () => {
    expect(source).toContain(
      'mayorRedirect(mayorNightDeathId, playerId, (result) => {',
    );
    expect(source).toContain(
      'mayorSkipRedirect(mayorNightDeathId, (result) => {',
    );
    expect(source).toContain('if (result.success) clearMayorNightDeath()');
  });

  it('희생양 교체 제안은 서버 성공 콜백 후에 닫는다', () => {
    expect(source).toContain('scapegoatSwap(scapegoatOffer.scapegoatId,');
    expect(source).toContain('if (result.success) setScapegoatOffer(null)');
  });

  it('이단아 추방 판정 모달은 서버 성공 콜백 후에 닫는다', () => {
    expect(source).toContain('forceCloseExile(true, (result) => {');
    expect(source).toContain('forceCloseExile(false, (result) => {');
    expect(source).toContain(
      'if (result.success) setDeviantExileJudgement(null)',
    );
  });

  it('마녀 저주 확인 모달은 서버 성공 콜백 후에 닫는다', () => {
    expect(source).toMatch(
      /confirmWitchCurseDeath\(\s*witchCursePending\.nominatorId,\s*true,\s*\(result\) => \{/,
    );
    expect(source).toMatch(
      /confirmWitchCurseDeath\(\s*witchCursePending\.nominatorId,\s*false,\s*\(result\) => \{/,
    );
    expect(source).toContain('if (result.success) setWitchCursePending(null)');
  });

  it('레드헤링 수동 지정 모달은 서버 성공 후에 닫는다', () => {
    expect(source).toContain('await assignRedHerring(');
    expect(source).not.toContain(`assignRedHerring(playerId);
      setShowRedHerringModal(false);`);
  });
});
