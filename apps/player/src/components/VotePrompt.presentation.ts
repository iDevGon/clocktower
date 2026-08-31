export const VOTE_CONSENT_READY_ICON = {
  renderMode: 'glyph',
  glyph: '✓',
  size: 22,
} as const;

export function getVoteUnavailableMessage({
  isAlive,
  deadVoteUsed,
  hasPassed,
}: {
  isAlive: boolean;
  deadVoteUsed: boolean;
  hasPassed: boolean;
}) {
  if (!isAlive && deadVoteUsed) return '유령표를 이미 사용했습니다';
  if (hasPassed) return '투표 완료. 결과를 기다리는 중…';
  return '다른 플레이어의 투표를 기다리는 중…';
}
