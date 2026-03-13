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
