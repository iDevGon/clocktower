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
    day: '#a68a64',
    vote: '#c47070',
    setup: '#908e8a',
    ended: '#b85c5c',
  },
  status: {
    poisoned: '#9b59b6',
    drunk: '#b07f5c',
    protected: '#2ecc71',
    cursed: '#9b59b6',
  },
  badge: {
    player: { bg: '#10182f', text: '#88aaf5', border: '#2f4f8f' },
    role: { bg: '#2a2118', text: '#b79b72', border: '#62513d' },
    status: { bg: '#5e1d18', text: '#da7a50', border: '#8d3529' },
  },
  team: {
    traveller: '#b07cc6',
  },
  arcane: {
    surface: {
      base: '#0d0906',
      raised: '#1a130d',
      parchment: '#2a2118',
      ledger: '#211911',
      apparatus: '#120d09',
    },
    border: {
      brass: '#8e7758',
      brassDim: '#5f503d',
      parchment: '#62513d',
      double: '#7d674c',
    },
    text: {
      primary: '#d8c8b2',
      strong: '#e6d7c0',
      muted: '#a99a86',
      label: '#b79b72',
      dead: '#746b60',
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
      accent: '#88aaf5',
      bubbleMine: '#10182f',
      textMine: '#dbe7ff',
      senderLabel: '#88aaf5',
      otherBorderColor: '#5f503d',
    },
    whisper: {
      accent: '#8e7758',
      bubbleMine: '#2a2118',
      textMine: '#d8c8b2',
      senderLabel: '#b79b72',
      otherBorderColor: '#62513d',
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
