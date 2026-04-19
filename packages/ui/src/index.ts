// Reduced motion

export type { FontFamilyName } from './fonts';

// Font assets — for useFonts in each app's root _layout.tsx
export { fontAssets } from './fonts';
export {
  ReducedMotionProvider,
  useReducedMotion,
} from './ReducedMotionContext';

// Design tokens

// Chat styles
export { createChatStyles } from './chatStyles';
export { AbilityText } from './components/AbilityText';
export type { BaseToastProps } from './components/BaseToast';
// Components
export { BaseToast } from './components/BaseToast';
export type { ButtonSize, ButtonTone } from './components/Button';
export { Button } from './components/Button';
export type { CardVariant } from './components/Card';
export { Card } from './components/Card';
export { Chapter } from './components/Chapter';
export { CountdownTimer } from './components/CountdownTimer';
export { DictionaryModal } from './components/DictionaryModal';
export { FullScreenVignette } from './components/FullScreenVignette';
export { GameTip } from './components/GameTip';
export { HighlightedMessage } from './components/HighlightedMessage';
export { InkBlot } from './components/InkBlot';
export type { ModalKind } from './components/Modal';
export { Modal } from './components/Modal';
export type { OrnamentKind } from './components/Ornament';
export { Ornament } from './components/Ornament';
export type { ParchmentTone } from './components/ParchmentSurface';
export { ParchmentSurface } from './components/ParchmentSurface';
export type {
  CandidateCategory,
  TaggedCandidate,
} from './components/QuickSuggestions';
export { QuickSuggestions } from './components/QuickSuggestions';
export { RoleTips } from './components/RoleTips';
export { RotatingGameTip } from './components/RotatingGameTip';
export type { SigilTeam } from './components/Sigil';
export { Sigil } from './components/Sigil';
export type { ParticleConfig } from './components/SmokeParticles';
export {
  PLAYER_SMOKE_PARTICLES,
  SmokeParticles,
  STORYTELLER_SMOKE_PARTICLES,
} from './components/SmokeParticles';
export type { SealGlyph, SealTone } from './components/WaxSeal';
export { WaxSeal } from './components/WaxSeal';
export type {
  RadiiToken,
  SizeToken,
  SpaceToken,
  WeightToken,
} from './tokens';
export {
  accent,
  colors,
  elevation,
  motion,
  radii,
  space,
  strokes,
  surfaces,
  typography,
} from './tokens';
// Utils
export {
  applySuggestion,
  buildChatCandidates,
  formatChatTime,
} from './utils/chat';
export { getChosung, isChosungOnly, matchQuery } from './utils/chosung';
