import { ALL_ROLES, PLAYER_STATUS_LABELS } from '@clocktower/shared';
import type { TaggedCandidate } from '../components/QuickSuggestions';

/**
 * 채팅 자동완성 후보 목록을 생성한다.
 * 플레이어 이름, 역할 이름, 상태 라벨 순서로 중복 없이 추가한다.
 */
export function buildChatCandidates(
  playerNames: string[],
): TaggedCandidate[] {
  const items: TaggedCandidate[] = [];
  const seen = new Set<string>();

  for (const name of playerNames) {
    if (!seen.has(name)) {
      seen.add(name);
      items.push({ word: name, category: 'player' });
    }
  }
  for (const r of ALL_ROLES) {
    if (!seen.has(r.name)) {
      seen.add(r.name);
      items.push({ word: r.name, category: 'role' });
    }
  }
  for (const label of Object.values(PLAYER_STATUS_LABELS)) {
    if (!seen.has(label)) {
      seen.add(label);
      items.push({ word: label, category: 'status' });
    }
  }
  for (const extra of ['사망', '생존', '죽음', '이야기꾼']) {
    if (!seen.has(extra)) {
      seen.add(extra);
      items.push({ word: extra, category: 'status' });
    }
  }
  return items;
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
