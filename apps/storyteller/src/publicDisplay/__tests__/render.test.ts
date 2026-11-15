import { describe, expect, it } from 'vitest';
import type { PublicDisplayModel } from '../model';
import { formatDisplayTimer, renderPublicDisplay } from '../render';

const model: PublicDisplayModel = {
  gameId: 'game',
  day: 1,
  phase: 'day',
  phaseLabel: '낮 · 토론',
  players: [
    {
      id: 'p1',
      name: '<img src=x onerror=alert(1)>',
      isAlive: false,
      deadVoteUsed: false,
      isTraveller: false,
    },
  ],
  composition: { townsfolk: 5, outsider: 0, minion: 1, demon: 1 },
  regularCount: 7,
  travellerCount: 0,
  roles: [
    {
      id: 'imp',
      name: '임프',
      team: 'demon',
      ability: '<script>secret()</script>',
    },
  ],
  timer: null,
  nomination: null,
  confirmedVotes: {},
  voteResult: null,
  executionCandidate: null,
};

describe('public display HTML', () => {
  it('escapes all player names and abilities as text', () => {
    const sections = renderPublicDisplay(model);
    expect(sections.board).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(sections.board).not.toContain('<img');
    expect(sections.script).toContain('&lt;script&gt;secret()&lt;/script&gt;');
    expect(sections.script).not.toContain('<script>');
    expect(sections.composition).toContain('기본 인원 분배');
    expect(sections.board).toContain('유령표 보유');
  });

  it('does not label unknown night status as alive or dead', () => {
    const sections = renderPublicDisplay({
      ...model,
      phase: 'night',
      players: [{ ...model.players[0], isAlive: null, deadVoteUsed: null }],
    });
    expect(sections.board).toContain('아침에 공개');
    expect(sections.board).not.toContain('유령표 보유');
  });

  it('shows concise abilities while preserving the original text in an escaped tooltip', () => {
    const sections = renderPublicDisplay(model);
    expect(sections.script).toContain('능력 요약');
    expect(sections.script).toContain('첫 밤 이후 매일 1명 살해.');
    expect(sections.script).toContain(
      'title="&lt;script&gt;secret()&lt;/script&gt;"',
    );
    const custom = renderPublicDisplay({
      ...model,
      roles: [{ ...model.roles[0], id: 'custom', ability: '사용자 정의 능력' }],
    });
    expect(custom.script).toContain('>사용자 정의 능력</p>');
  });

  it('shows unavailable basic distributions without fabricating counts', () => {
    expect(
      renderPublicDisplay({ ...model, composition: null }).composition,
    ).toContain('5~20명');
  });

  it('graphs the basic composition proportionally and omits zero-size segments', () => {
    const sections = renderPublicDisplay(model);
    expect(sections.composition).toContain(
      'aria-label="기본 인원 분배: 마을주민 5명, 외지인 0명, 하수인 1명, 악마 1명"',
    );
    expect(sections.composition).toContain(
      'data-team="townsfolk" style="--team:#163f83;width:71.43%"',
    );
    expect(sections.composition).toContain(
      'data-team="demon" style="--team:#951b2c;width:14.29%"',
    );
    expect(sections.composition).not.toContain('data-team="outsider"');
    expect(
      renderPublicDisplay({ ...model, composition: null }).composition,
    ).not.toContain('composition-chart');
  });

  it('graphs public life status without revealing unknown night information', () => {
    const alive = {
      ...model.players[0],
      id: 'p2',
      name: '생존자',
      isAlive: true,
    };
    const view = { ...model, players: [model.players[0], alive] };
    expect(renderPublicDisplay(view).board).toContain(
      'aria-label="공개 생존 1명, 사망 1명"',
    );
    expect(renderPublicDisplay(view).board).toContain(
      'stroke-dasharray="50 100"',
    );
    expect(
      renderPublicDisplay({ ...view, players: [{ ...alive, isAlive: null }] })
        .board,
    ).not.toContain('survival-chart');
  });

  it('labels affirmative voters separately from the authoritative execution tally', () => {
    const sections = renderPublicDisplay({
      ...model,
      voteResult: { nomineeName: '후보', guiltyVoters: 2 },
      executionCandidate: { name: '후보', guiltyVotes: 4 },
    });
    expect(sections.activity).toContain('찬성 <strong>2명</strong>');
    expect(sections.activity).toContain('후보 · 4표');
  });

  it('counts down using absolute time and freezes paused timers', () => {
    expect(formatDisplayTimer(null, 0)).toBe('—');
    expect(
      formatDisplayTimer(
        { endsAt: 67000, paused: false, remainingMs: 67000 },
        5000,
      ),
    ).toBe('01:02');
    expect(
      formatDisplayTimer(
        { endsAt: 67000, paused: true, remainingMs: 12000 },
        90000,
      ),
    ).toBe('00:12 · 일시정지');
    expect(
      formatDisplayTimer({ endsAt: 1000, paused: false, remainingMs: 0 }, 5000),
    ).toBe('00:00');
  });
});
