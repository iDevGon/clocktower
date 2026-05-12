import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(() => Promise.resolve(null)),
    setItem: vi.fn(() => Promise.resolve()),
    removeItem: vi.fn(() => Promise.resolve()),
  },
}));

import { usePlayerStore } from '../playerStore';

describe('playerStore', () => {
  beforeEach(() => {
    usePlayerStore.getState().reset();
  });

  it('addFeedback: 피드백 히스토리에 추가된다', () => {
    usePlayerStore.getState().addFeedback(1, { type: 'number', value: 2 });
    const history = usePlayerStore.getState().feedbackHistory;
    expect(history).toHaveLength(1);
    expect(history[0].day).toBe(1);
    expect(history[0].phase).toBe('night');
    expect(history[0].feedback).toEqual({ type: 'number', value: 2 });
  });

  it('addFeedback: 여러 피드백을 축적할 수 있다', () => {
    usePlayerStore.getState().addFeedback(1, { type: 'number', value: 1 });
    usePlayerStore.getState().addFeedback(2, { type: 'yes_no', value: true });
    expect(usePlayerStore.getState().feedbackHistory).toHaveLength(2);
  });

  it('좌석 예상 직업 메모를 저장하고 빈 값으로 삭제한다', () => {
    usePlayerStore.getState().setSeatingRoleNote('p1', '임프');
    expect(usePlayerStore.getState().seatingRoleNotes.p1).toBe('임프');

    usePlayerStore.getState().setSeatingRoleNote('p1', '   ');
    expect(usePlayerStore.getState().seatingRoleNotes.p1).toBeUndefined();
  });

  it('reset: 초기 상태로 복원된다', () => {
    usePlayerStore
      .getState()
      .set({ playerId: 'p1', playerName: 'Alice', isAlive: false });
    usePlayerStore.getState().addFeedback(1, { type: 'number', value: 1 });

    usePlayerStore.getState().reset();
    const state = usePlayerStore.getState();
    expect(state.playerId).toBe('');
    expect(state.isAlive).toBe(true);
    expect(state.feedbackHistory).toHaveLength(0);
  });
});
