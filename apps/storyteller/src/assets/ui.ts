import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

export const arcaneUiSprite = isWeb
  ? require('../../assets/ui/arcane-ui-sprite.webp')
  : require('../../assets/ui/arcane-ui-sprite.png');
export const voteClockFace = isWeb
  ? require('../../assets/ui/vote-clock-face.webp')
  : require('../../assets/ui/vote-clock-face.png');
export const voteClockHand = isWeb
  ? require('../../assets/ui/vote-clock-hand.webp')
  : require('../../assets/ui/vote-clock-hand.png');
export const voteHandRaised = isWeb
  ? require('../../assets/ui/vote-hand-raised.webp')
  : require('../../assets/ui/vote-hand-raised.png');
export const voteHandDown = isWeb
  ? require('../../assets/ui/vote-hand-down.webp')
  : require('../../assets/ui/vote-hand-down.png');

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
