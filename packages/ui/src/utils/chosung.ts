const CHOSUNG = [
  'ㄱ',
  'ㄲ',
  'ㄴ',
  'ㄷ',
  'ㄸ',
  'ㄹ',
  'ㅁ',
  'ㅂ',
  'ㅃ',
  'ㅅ',
  'ㅆ',
  'ㅇ',
  'ㅈ',
  'ㅉ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ',
];

export function getChosung(str: string): string {
  return [...str]
    .map((ch) => {
      const code = ch.charCodeAt(0) - 0xac00;
      if (code < 0 || code > 11171) return ch;
      return CHOSUNG[Math.floor(code / 588)];
    })
    .join('');
}

export function isChosungOnly(str: string): boolean {
  return [...str].every((ch) => CHOSUNG.includes(ch));
}

export function matchQuery(candidate: string, query: string): boolean {
  const lower = query.toLowerCase();
  if (candidate.toLowerCase().includes(lower)) return true;
  if (isChosungOnly(query)) {
    return getChosung(candidate).startsWith(query);
  }
  return false;
}
