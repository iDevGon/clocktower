export type VoteRightState = 'alive' | 'ghost_available' | 'ghost_spent';

interface VoteRightPresentationInput {
  isAlive: boolean;
  deadVoteUsed: boolean;
}

interface VoteRightPresentation {
  label: string;
  state: VoteRightState;
}

export function getVoteRightPresentation({
  isAlive,
  deadVoteUsed,
}: VoteRightPresentationInput): VoteRightPresentation {
  if (isAlive) return { label: '투표 가능', state: 'alive' };
  if (deadVoteUsed) return { label: '유령표 사용', state: 'ghost_spent' };
  return { label: '유령표 보유', state: 'ghost_available' };
}
