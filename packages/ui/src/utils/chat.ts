import { ALL_ROLES, PLAYER_STATUS_LABELS } from '@clocktower/shared';
import type { TaggedCandidate } from '../components/QuickSuggestions';

export type HighlightedMessageSegment = {
  text: string;
  match: TaggedCandidate | null;
};

/**
 * 채팅 자동완성 후보 목록을 생성한다.
 * 플레이어 이름, 역할 이름, 상태 라벨 순서로 중복 없이 추가한다.
 */
export function buildChatCandidates(playerNames: string[]): TaggedCandidate[] {
  const items: TaggedCandidate[] = [];
  const seen = new Set<string>();

  const addUnique = (word: string, category: TaggedCandidate['category']) => {
    if (seen.has(word)) return;
    seen.add(word);
    items.push({ word, category });
  };

  playerNames.forEach((name) => {
    addUnique(name, 'player');
  });
  ALL_ROLES.forEach((r) => {
    addUnique(r.name, 'role');
  });
  Object.values(PLAYER_STATUS_LABELS).forEach((label) => {
    addUnique(label, 'status');
  });
  ['사망', '생존', '죽음', '이야기꾼'].forEach((extra) => {
    addUnique(extra, 'status');
  });
  return items;
}

function isWordChar(char: string | undefined): boolean {
  return char !== undefined && /[0-9A-Za-z가-힣ㄱ-ㅎㅏ-ㅣ]/.test(char);
}

function isValidKeywordMatch(
  message: string,
  index: number,
  keyword: string,
): boolean {
  if (keyword.length !== 1) return true;

  const before = message[index - 1];
  const after = message[index + keyword.length];
  return !isWordChar(before) && !isWordChar(after);
}

export function segmentHighlightedMessage(
  message: string,
  keywords: TaggedCandidate[],
): HighlightedMessageSegment[] {
  if (keywords.length === 0) return [{ text: message, match: null }];

  const sorted = [...keywords].sort((a, b) => b.word.length - a.word.length);

  const result: HighlightedMessageSegment[] = [];
  let offset = 0;

  while (offset < message.length) {
    let earliestIdx = message.length;
    let earliestMatch: TaggedCandidate | null = null;

    for (const kw of sorted) {
      let idx = message.indexOf(kw.word, offset);
      while (idx !== -1) {
        if (isValidKeywordMatch(message, idx, kw.word)) break;
        idx = message.indexOf(kw.word, idx + 1);
      }

      if (idx !== -1 && idx < earliestIdx) {
        earliestIdx = idx;
        earliestMatch = kw;
      }
    }

    if (!earliestMatch) {
      result.push({ text: message.slice(offset), match: null });
      break;
    }

    if (earliestIdx > offset) {
      result.push({ text: message.slice(offset, earliestIdx), match: null });
    }
    result.push({ text: earliestMatch.word, match: earliestMatch });
    offset = earliestIdx + earliestMatch.word.length;
  }

  return result;
}

/**
 * 타임스탬프를 HH:MM 형식 문자열로 변환한다.
 */
export function formatChatTime(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

/**
 * 자동완성 제안 선택 시 입력 텍스트의 마지막 단어를 교체한다.
 */
export function applySuggestion(text: string, word: string): string {
  const parts = text.split(/(\s+)/);
  parts[parts.length - 1] = word;
  return parts.join('');
}
