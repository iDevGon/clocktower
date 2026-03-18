import { ALL_ROLES, PLAYER_STATUS_LABELS } from '@clocktower/shared';
import { describe, expect, it } from 'vitest';
import {
  applySuggestion,
  buildChatCandidates,
  formatChatTime,
} from '../utils/chat';

describe('buildChatCandidates', () => {
  it('플레이어 이름이 후보 목록에 포함된다', () => {
    const candidates = buildChatCandidates(['홍길동', '김철수']);
    const playerWords = candidates
      .filter((c) => c.category === 'player')
      .map((c) => c.word);
    expect(playerWords).toContain('홍길동');
    expect(playerWords).toContain('김철수');
  });

  it('역할 이름이 후보 목록에 포함된다', () => {
    const candidates = buildChatCandidates([]);
    const roleWords = candidates
      .filter((c) => c.category === 'role')
      .map((c) => c.word);
    for (const role of ALL_ROLES) {
      expect(roleWords).toContain(role.name);
    }
  });

  it('상태 라벨이 후보 목록에 포함된다', () => {
    const candidates = buildChatCandidates([]);
    const statusWords = candidates
      .filter((c) => c.category === 'status')
      .map((c) => c.word);
    for (const label of Object.values(PLAYER_STATUS_LABELS)) {
      expect(statusWords).toContain(label);
    }
  });

  it('각 후보는 word와 category 속성을 가진다', () => {
    const candidates = buildChatCandidates(['테스트']);
    for (const c of candidates) {
      expect(c).toHaveProperty('word');
      expect(c).toHaveProperty('category');
      expect(typeof c.word).toBe('string');
      expect(['player', 'role', 'status']).toContain(c.category);
    }
  });

  it('빈 플레이어 배열을 전달하면 역할과 상태만 포함된다', () => {
    const candidates = buildChatCandidates([]);
    const playerCandidates = candidates.filter((c) => c.category === 'player');
    expect(playerCandidates).toHaveLength(0);
    expect(candidates.length).toBeGreaterThan(0);
  });

  it('중복된 플레이어 이름은 한 번만 포함된다', () => {
    const candidates = buildChatCandidates(['홍길동', '홍길동']);
    const playerWords = candidates.filter((c) => c.category === 'player');
    expect(playerWords).toHaveLength(1);
  });

  it('플레이어 이름이 역할 이름과 같으면 중복 제거된다', () => {
    const roleName = ALL_ROLES[0].name;
    const candidates = buildChatCandidates([roleName]);
    const matching = candidates.filter((c) => c.word === roleName);
    expect(matching).toHaveLength(1);
    expect(matching[0].category).toBe('player');
  });
});

describe('formatChatTime', () => {
  it('타임스탬프를 HH:MM 형식으로 변환한다', () => {
    // 2024-01-01 14:30 KST
    const d = new Date(2024, 0, 1, 14, 30);
    expect(formatChatTime(d.getTime())).toBe('14:30');
  });

  it('자정(00:00)을 올바르게 표시한다', () => {
    const d = new Date(2024, 0, 1, 0, 0);
    expect(formatChatTime(d.getTime())).toBe('00:00');
  });

  it('한 자리 시간과 분을 0으로 패딩한다', () => {
    const d = new Date(2024, 0, 1, 3, 5);
    expect(formatChatTime(d.getTime())).toBe('03:05');
  });

  it('23:59를 올바르게 표시한다', () => {
    const d = new Date(2024, 0, 1, 23, 59);
    expect(formatChatTime(d.getTime())).toBe('23:59');
  });
});

describe('applySuggestion', () => {
  it('마지막 단어를 제안 단어로 교체한다', () => {
    expect(applySuggestion('안녕하세요 홍길', '홍길동')).toBe(
      '안녕하세요 홍길동',
    );
  });

  it('단어가 하나일 때 전체를 교체한다', () => {
    expect(applySuggestion('홍길', '홍길동')).toBe('홍길동');
  });

  it('여러 단어가 있을 때 마지막 단어만 교체한다', () => {
    expect(applySuggestion('오늘 밤에 점쟁', '점쟁이')).toBe(
      '오늘 밤에 점쟁이',
    );
  });

  it('빈 텍스트에 제안을 적용하면 제안 단어만 반환된다', () => {
    expect(applySuggestion('', '홍길동')).toBe('홍길동');
  });

  it('공백이 여러 개여도 보존된다', () => {
    const result = applySuggestion('안녕  홍길', '홍길동');
    expect(result).toBe('안녕  홍길동');
  });
});
