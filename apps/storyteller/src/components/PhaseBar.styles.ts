/**
 * 페이즈별 색상 토큰 — DaySubPhaseBar 및 log 화면에서 공유.
 *
 * PhaseBar 본체 스타일은 이제 tokens 기반으로 PhaseBar.tsx 안에서
 * 생성하지만, 하위 페이즈 색상 매핑은 다른 컴포넌트가 계속 참조하므로
 * 여기에서 export 한다.
 */
export const PHASE_COLORS = {
  night: {
    bg: '#1e2038',
    border: '#3a4878',
    text: '#8090c0',
    dot: '#6878b0',
  },
  day: {
    bg: '#302820',
    border: '#6a5a30',
    text: '#c4a050',
    dot: '#b09040',
  },
  vote: {
    bg: '#301c22',
    border: '#6a2838',
    text: '#c47070',
    dot: '#b06060',
  },
  ended: {
    bg: '#1e1e24',
    border: '#3a3a48',
    text: '#909098',
    dot: '#707078',
  },
} as const;
