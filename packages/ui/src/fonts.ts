/**
 * Font assets — shared between storyteller and player apps.
 *
 * Use with `expo-font`'s `useFonts` hook in each app's root `_layout.tsx`.
 * Font family names map 1:1 to the values exported from `tokens.ts` `typography.family`.
 *
 * Example:
 *   const [loaded] = useFonts(fontAssets);
 *   if (!loaded) return null;
 */

export const fontAssets = {
  // Display — 세리프, 페이지 제목·역할 공개·판결
  'MaruBuri-Bold': require('./assets/fonts/MaruBuri-Bold.otf'),
  'MaruBuri-SemiBold': require('./assets/fonts/MaruBuri-SemiBold.otf'),
  // `MaruBuri` 별칭 — tokens.typography.family.display 와 매칭
  MaruBuri: require('./assets/fonts/MaruBuri-Bold.otf'),

  // Body — 프리텐다드, 본문·버튼
  'Pretendard-Regular': require('./assets/fonts/Pretendard-Regular.otf'),
  'Pretendard-SemiBold': require('./assets/fonts/Pretendard-SemiBold.otf'),
  'Pretendard-Bold': require('./assets/fonts/Pretendard-Bold.otf'),
  Pretendard: require('./assets/fonts/Pretendard-Regular.otf'),

  // Mono — D2Coding, 타이머·숫자
  D2Coding: require('./assets/fonts/D2Coding.ttf'),
} as const;

export type FontFamilyName = keyof typeof fontAssets;
