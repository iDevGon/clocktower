import { PUBLIC_ABILITY_SUMMARIES } from './abilitySummaries';
import type { PublicDisplayModel } from './model';

const TEAMS = [
  { id: 'townsfolk', name: '마을주민', color: '#163f83', tint: '#e4edf8' },
  { id: 'outsider', name: '외지인', color: '#07515a', tint: '#e1efec' },
  { id: 'minion', name: '하수인', color: '#863218', tint: '#f5e8db' },
  { id: 'demon', name: '악마', color: '#951b2c', tint: '#f5e2e3' },
] as const;

function escapeHtml(text: string) {
  return text.replace(
    /[&<>"']/g,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        char
      ] ?? char,
  );
}

export function formatDisplayTimer(
  timer: PublicDisplayModel['timer'],
  now = Date.now(),
) {
  if (!timer) return '—';
  const seconds = Math.ceil(
    Math.max(0, timer.paused ? timer.remainingMs : timer.endsAt - now) / 1000,
  );
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}${timer.paused ? ' · 일시정지' : ''}`;
}

export function renderPublicDisplay(model: PublicDisplayModel) {
  const players = model.players;
  const known = players.every((p) => p.isAlive !== null);
  const alive = players.filter((p) => p.isAlive).length;
  const survivalChart =
    known && players.length > 0
      ? `<svg class="survival-chart" viewBox="0 0 160 160" role="img" aria-label="공개 생존 ${alive}명, 사망 ${players.length - alive}명"><circle class="survival-track" cx="80" cy="80" r="70" fill="none" stroke-width="12"/><circle class="survival-alive" cx="80" cy="80" r="70" fill="none" stroke-width="12" pathLength="100" stroke-dasharray="${(alive / players.length) * 100} 100" transform="rotate(-90 80 80)"/></svg>`
      : '';
  const board = `<div class="section-heading board-heading"><h2>마을 좌석</h2><span>${players.length}명 · 시계 방향</span></div><div class="seating" style="--seat-width:${Math.max(56, Math.min(108, 1250 / Math.max(1, players.length)))}px">
    <div class="ring"></div><div class="center">${survivalChart}<strong>${known ? `${alive}<small> / ${players.length}</small>` : '밤'}</strong><span>${known ? '생존 / 전체' : '생존 상태는 아침에 공개'}</span></div>
    ${players
      .map((p, i) => {
        const angle = (2 * Math.PI * i) / players.length;
        const state =
          p.isAlive === null
            ? '아침에 공개'
            : p.isAlive
              ? '생존'
              : p.deadVoteUsed
                ? '사망 · 유령표 사용'
                : '사망 · 유령표 보유';
        const vote = model.confirmedVotes[p.id];
        return `<div class="seat ${p.isAlive === false ? 'dead' : ''}" style="left:${50 + 42 * Math.sin(angle)}%;top:${50 - 42 * Math.cos(angle)}%"><span class="seat-number">${i + 1}${p.isTraveller ? ' · 여행자' : ''}</span><strong>${escapeHtml(p.name)}</strong><span>${state}</span>${vote !== undefined ? `<b class="vote">${vote ? '찬성' : '반대'}</b>` : ''}</div>`;
      })
      .join('')}
    ${players.length ? '' : '<p class="empty">참가자를 기다리고 있습니다.</p>'}</div>`;
  const distribution = model.composition;
  const distributionTotal = distribution
    ? Object.values(distribution).reduce((sum, count) => sum + count, 0)
    : 0;
  const compositionChart =
    distribution && distributionTotal > 0
      ? `<div class="composition-chart" role="img" aria-label="기본 인원 분배: ${TEAMS.map((team) => `${team.name} ${distribution[team.id]}명`).join(', ')}">${TEAMS.filter(
          (team) => distribution[team.id] > 0,
        )
          .map(
            (team) =>
              `<span data-team="${team.id}" style="--team:${team.color};width:${((distribution[team.id] / distributionTotal) * 100).toFixed(2)}%"></span>`,
          )
          .join('')}</div>`
      : '';
  const composition = `<div class="section-heading"><h2>기본 인원 분배</h2><span>일반 ${model.regularCount}명${model.travellerCount ? ` · 여행자 ${model.travellerCount}명` : ''}</span></div>
    ${compositionChart}${distribution ? `<div class="counts">${TEAMS.map((team) => `<div style="--team:${team.color};--tint:${team.tint}"><span>${team.name}</span><strong>${distribution[team.id]}<small>명</small></strong></div>`).join('')}</div>` : '<p class="muted">일반 참가자 5~20명의 기본 분배를 표시합니다.</p>'}
    <p class="muted note">직업 능력에 따른 인원 변동은 반영하지 않습니다.</p>`;
  const scriptTeams = [
    ...TEAMS,
    {
      id: 'traveller',
      name: '참가 중인 여행자',
      color: '#61307c',
      tint: '#eee4f4',
    },
  ];
  const script = `<div class="section-heading"><h2>등장 가능한 직업</h2><span>${model.roles.length}종 · 능력 요약</span></div><p class="muted note">실제 배정 여부는 공개하지 않습니다. 원문은 직업 설명에 마우스를 올려 확인하세요.</p>${scriptTeams
    .map((team) => {
      const roles = model.roles.filter((r) => r.team === team.id);
      return roles.length
        ? `<section class="role-group" style="--team:${team.color};--tint:${team.tint}"><h3>${team.name}<span>${roles.length}종</span></h3><div class="role-grid">${roles.map((r) => `<article><h4>${escapeHtml(r.name)}</h4><p title="${escapeHtml(r.ability)}">${escapeHtml(PUBLIC_ABILITY_SUMMARIES[r.id] ?? r.ability)}</p></article>`).join('')}</div></section>`
        : '';
    })
    .join('')}`;
  const activity = `${model.nomination ? `<div><span class="eyebrow">최근 지명</span><p>${escapeHtml(model.nomination.nominator)} → <strong>${escapeHtml(model.nomination.nominee)}</strong></p></div>` : ''}
    ${model.voteResult ? `<div><span class="eyebrow">투표 결과</span><p>${escapeHtml(model.voteResult.nomineeName)} · 찬성 <strong>${model.voteResult.guiltyVoters}명</strong></p></div>` : ''}
    <div><span class="eyebrow">처형 후보</span><p>${model.executionCandidate ? `${escapeHtml(model.executionCandidate.name)} · ${model.executionCandidate.guiltyVotes}표` : '없음'}</p></div>`;
  return {
    board,
    composition,
    script,
    activity,
    heading: `${model.day}일차 · ${model.phaseLabel}`,
  };
}

export const PUBLIC_DISPLAY_CSS = `
  :root { color-scheme:light; font-family:system-ui,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif; --paper:#f7f2e7; --ink:#292820; --muted:#4b4439; --brass:#947444; --rule:#c8bca5; background:#e7decd; color:var(--ink); font-weight:500 }
  * { box-sizing:border-box } html,body { margin:0; width:100%; height:100%; overflow:hidden }
  #display-canvas { position:absolute; width:1600px; min-height:900px; transform-origin:top left; background:var(--paper); box-shadow:0 12px 48px #382d2018 }
  button { cursor:pointer; font:inherit; font-size:16px; font-weight:600; color:#f5eddd; background:transparent; border:1px solid #a99b7f; padding:8px 14px; border-radius:6px } button:hover { background:#35485a } button:focus-visible { outline:3px solid #ead3a3; outline-offset:4px }
  header { display:flex; align-items:center; gap:24px; padding:14px 20px; background:#263747; color:#f5eddd; border-bottom:3px solid #b49965 } header h1 { font-size:30px; font-weight:700; margin:0; letter-spacing:-.5px } header .eyebrow { display:none } .eyebrow { color:var(--muted); font-size:16px; font-weight:700; letter-spacing:0 } #connection { margin-left:auto; color:#e4dccb; font-size:16px; font-weight:500 } #timer { font-size:40px; font-weight:700; font-variant-numeric:tabular-nums; white-space:nowrap; color:#f5eddd; padding:0 14px; border-left:1px solid #74808a }
  main { display:grid; grid-template-columns:500px minmax(0,1fr) } .overview { padding:14px 16px; min-width:0; background:#eee6d6; border-right:1px solid var(--rule); display:flex; flex-direction:column; gap:12px } #board,#composition,#activity { background:#fcf8ee; border:1px solid #bcac8d; border-radius:8px } .board-heading { padding:10px 12px 0 } #composition { padding:12px } #script { padding:16px 20px; min-width:0; background:var(--paper) } .seating { position:relative; aspect-ratio:1; width:100%; margin:0 auto } .ring { position:absolute; inset:8%; border:1px solid #aa9060; border-radius:50%; box-shadow:0 0 0 8px #eee6d6,0 0 0 9px #c8b89a }
  .center { position:absolute; inset:32% 24%; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:6px; text-align:center; color:var(--muted); font-size:16px; font-weight:600 } .center>strong,.center>span { position:relative; z-index:1 } .survival-chart { position:absolute; width:180px; height:180px; top:50%; left:50%; transform:translate(-50%,-50%) } .survival-track { stroke:#d1c6b2 } .survival-alive { stroke:#235e51 } .center strong { font-family:Georgia,serif; font-size:48px; color:#263747; font-weight:700 } .center small { font-size:24px; color:var(--muted) } .seat { position:absolute; transform:translate(-50%,-50%); width:var(--seat-width); min-height:60px; border:2px solid #9b8258; border-radius:10px; padding:5px 4px; display:flex; flex-direction:column; align-items:center; gap:2px; text-align:center; background:#fff9ed; box-shadow:0 3px 0 #a68e6526 } .seat strong { font-size:20px; font-weight:700; max-width:100%; overflow-wrap:anywhere; line-height:1.2 } .seat span { font-size:14px; font-weight:600; color:var(--ink) } .seat .seat-number { color:var(--muted); font-size:14px; font-weight:600 } .seat.dead { border-style:dashed; border-color:#867a65; background:#dfd6c6; box-shadow:none } .seat.dead strong { color:var(--ink) } .vote { color:#263747; border-top:2px solid #9b8258; font-size:16px; font-weight:700 }
  .section-heading { display:flex; align-items:center; justify-content:space-between; gap:10px } h2 { font-size:22px; font-weight:700; margin:0; color:#263747; letter-spacing:-.3px } .section-heading>span { color:var(--muted); font-size:16px; font-weight:600 } .counts { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:8px; margin-top:12px } .counts>div { padding:8px 4px; border:1px solid #c6bda9; border-top:4px solid var(--team); border-radius:5px; background:var(--tint); display:flex; flex-direction:column; align-items:center; gap:4px } .counts span { color:var(--team); font-size:18px; font-weight:700 } .composition-chart { display:flex; height:22px; margin:14px 0 0; border-radius:5px; overflow:hidden; background:#d1c6b2 } .composition-chart>span { background:var(--team); flex-shrink:1; border-right:2px solid #fcf8ee } .composition-chart>span:last-child { border-right:0 } .counts strong small { margin-left:3px; font-size:15px; font-weight:600; color:var(--team) } .counts strong { font-size:32px; font-weight:700; color:#263747; font-variant-numeric:tabular-nums }
  .muted { color:var(--muted); font-size:16px; font-weight:500; line-height:1.4 } .note { margin:6px 0 12px } .role-group { margin-top:12px; border:1px solid #bcac8d; border-left:5px solid var(--team); border-radius:8px; overflow:hidden; background:var(--tint) } h3 { color:var(--team); font-size:20px; font-weight:700; border-bottom:1px solid #bcac8d; padding:8px 12px; margin:0; display:flex; align-items:center; gap:10px } h3 span { font-size:16px; min-width:26px; text-align:center; padding:1px 6px; border-radius:4px; background:#fcf8ee; color:var(--team) } .role-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:0 18px; padding:0 12px; background:#fcf8ee } article { min-width:0; line-height:1.45; display:grid; grid-template-columns:124px minmax(0,1fr); column-gap:10px; align-items:start; padding:10px 0; border-bottom:1px solid #d5c9b4 } article:nth-last-child(-n+2) { border-bottom:0 } article h4 { display:block; overflow-wrap:anywhere; background:var(--tint); border-radius:4px; padding:3px 6px; color:var(--team); margin:0 8px 0 0; font-size:22px; font-weight:700 } article p { display:block; color:var(--ink); margin:0; line-height:1.45; font-size:18px; font-weight:600; overflow-wrap:anywhere } #activity { display:flex; flex-wrap:wrap; gap:0; padding:0 } #activity>div { flex:1 1 140px; min-width:0; overflow-wrap:anywhere; padding:12px; border-right:1px solid #c8bca5 } #activity>div:last-child { border-right:0 } #activity p { color:#263747; font-size:20px; font-weight:700; margin:5px 0 10px } .empty { position:absolute; inset:75% 0 0; text-align:center; color:var(--muted); font-size:18px; font-weight:600 }
`;
