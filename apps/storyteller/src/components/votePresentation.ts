export const VOTE_CLOCK_LAYER = {
  face: 10,
  smoke: 20,
  token: 80,
  centerHub: 140,
  hand: 160,
} as const;

export const VOTE_CLOCK_ORNAMENT = {
  showCenterDot: false,
} as const;

export const VOTE_HAND_ASSET_FILES = {
  raised: 'vote-hand-raised.webp',
  down: 'vote-hand-down.webp',
} as const;

export const VOTE_STATE_BADGE = {
  minWidth: 52,
  iconSize: 30,
  showTextLabel: false,
  raised: {
    backgroundColor: '#9d2f33',
    borderColor: '#e88b74',
    color: '#fff4e8',
  },
  pending: {
    backgroundColor: '#53301f',
    borderColor: '#c88a4a',
    color: '#f1d4a0',
  },
  down: {
    backgroundColor: '#171821',
    borderColor: '#55505a',
    color: '#b5b0aa',
  },
} as const;

export const VOTE_TOKEN_BADGE = {
  size: 24,
  iconSize: 22,
  edgeOffset: -13,
  borderRadius: 9999,
  raised: {
    backgroundColor: 'rgba(82, 18, 25, 0.72)',
    borderColor: '#f09a82',
  },
  pending: {
    backgroundColor: 'rgba(72, 43, 22, 0.66)',
    borderColor: '#d69a5d',
  },
} as const;
