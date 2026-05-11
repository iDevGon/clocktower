export const uiIcon = {
  chat: 0,
  settings: 1,
  seating: 2,
  log: 3,
  dictionary: 4,
  veiledEye: 5,
  openEye: 6,
  whisper: 7,
  nominate: 8,
  verdict: 9,
  memo: 10,
  traveller: 11,
  voteGuilty: 12,
  votePending: 13,
  voteReady: 14,
  menu: 15,
} as const;

export type UiIconName = keyof typeof uiIcon;
