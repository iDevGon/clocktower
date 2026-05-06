export const colors = {
  surface: {
    base: '#121214',
    elevated: '#1a1a1e',
    overlay: 'rgba(0,0,0,0.7)',
  },
  border: {
    default: '#2e2e34',
    subtle: '#1e1e24',
  },
  text: {
    primary: '#e0ddd8',
    secondary: '#908e8a',
    tertiary: '#5c5a58',
    muted: '#b8b6b2',
  },
  phase: {
    night: '#8090c0',
    day: '#c4a050',
    vote: '#c47070',
    setup: '#908e8a',
    ended: '#b85c5c',
  },
  status: {
    poisoned: '#9b59b6',
    drunk: '#e67e22',
    protected: '#2ecc71',
    cursed: '#9b59b6',
  },
  badge: {
    player: { bg: '#1a2e1a', text: '#7dce82', border: '#2e4a2e' },
    role: { bg: '#1a1e2e', text: '#82a8ce', border: '#2e3a4e' },
    status: { bg: '#2e1a1e', text: '#ce8282', border: '#4e2e2e' },
  },
  team: {
    traveller: '#b07cc6',
  },
  arcane: {
    surface: {
      base: '#0d0703',
      raised: '#1e1005',
      parchment: '#362008',
      ledger: '#261606',
      apparatus: '#140b05',
    },
    border: {
      brass: '#b78642',
      brassDim: '#76542a',
      parchment: '#795a33',
      double: '#9f743c',
    },
    text: {
      primary: '#f0d8b3',
      strong: '#ffe8bf',
      muted: '#c8ae86',
      label: '#e9bd70',
      dead: '#7d7160',
    },
    action: {
      blood: '#8d3529',
      bloodHighlight: '#da7a50',
      bloodPressed: '#5e1d18',
    },
    accent: {
      prussianBlue: '#2f4f8f',
      sapphireLens: '#88aaf5',
      midnightInk: '#10182f',
    },
  },
  chat: {
    storyteller: {
      accent: '#8a6a8a',
      bubbleMine: '#2a2a4d',
      textMine: '#d0d0e8',
      senderLabel: '#8a6a8a',
      otherBorderColor: '#3a2a4a',
    },
    whisper: {
      accent: '#6a8a6a',
      bubbleMine: '#2a3d2a',
      textMine: '#d0e8d0',
      senderLabel: '#8a9a8a',
      otherBorderColor: '#2e2e34',
    },
  },
} as const;

export const typography = {
  fontFamily: {
    body: 'IBMPlexSansKR-Regular',
    bodyMedium: 'IBMPlexSansKR-Medium',
    bodyBold: 'IBMPlexSansKR-Bold',
    displayLight: 'SchoolSafeStarrySky-Light',
    display: 'SchoolSafeStarrySky-Bold',
  },
} as const;
