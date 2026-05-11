export const PLAYER_VOTE_CLOCK_LAYER = {
  face: 10,
  smoke: 20,
  node: 50,
  timer: 90,
  center: 130,
  hand: 140,
} as const;

export const PLAYER_VOTE_STATE_BADGE = {
  minWidth: 44,
  iconSize: 24,
  showTextLabel: false,
  raised: {
    backgroundColor: '#a73539',
    borderColor: '#f0a080',
    color: '#fff4e8',
  },
  pending: {
    backgroundColor: '#56321f',
    borderColor: '#d19454',
    color: '#f2d3a0',
  },
  down: {
    backgroundColor: '#141720',
    borderColor: '#5a5660',
    color: '#c4bcb4',
  },
} as const;

export const PLAYER_VOTE_NODE_BADGE = {
  size: 24,
  iconSize: 22,
  edgeOffset: -10,
  borderRadius: 9999,
} as const;

export const PLAYER_VOTE_CLOCK_ORNAMENT = {
  showCenterDot: false,
} as const;

export const PLAYER_VOTE_HAND_ASSET_FILES = {
  raised: 'vote-hand-raised.webp',
  down: 'vote-hand-down.webp',
} as const;
