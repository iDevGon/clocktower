import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(() => Promise.resolve(null)),
    setItem: vi.fn(() => Promise.resolve()),
    removeItem: vi.fn(() => Promise.resolve()),
  },
}));

import type { GameState } from '@clocktower/shared';
import { useGameStore } from '../gameStore';

function makeGameState(overrides?: Partial<GameState>): GameState {
  return {
    id: 'game1',
    phase: 'setup',
    daySubPhase: null,
    day: 0,
    players: [
      {
        id: 'p1',
        name: 'Player1',
        isAlive: true,
        hasNominatedToday: false,
        hasBeenNominatedToday: false,
        deadVoteUsed: false,
        statuses: ['poisoned'],
      },
      {
        id: 'p2',
        name: 'Player2',
        isAlive: true,
        hasNominatedToday: false,
        hasBeenNominatedToday: false,
        deadVoteUsed: false,
        statuses: [],
      },
    ],
    nominations: [],
    started: false,
    playerOrder: ['p1', 'p2'],
    settings: {
      whisperMode: 'chat',
      votingMode: 'online',
      voteClockSeconds: 3,
      whisperClockSeconds: 0,
      discussionClockSeconds: 0,
      nominationClockSeconds: 0,
      defenseClockSeconds: 0,
    },
    ...overrides,
  };
}

describe('gameStore', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
  });

  describe('setGameState', () => {
    it('playerStatuses를 동기화한다', () => {
      useGameStore.getState().setGameState(makeGameState());
      const ps = useGameStore.getState().playerStatuses;
      expect(ps.p1).toEqual(['poisoned']);
      expect(ps.p2).toEqual([]);
    });

    it('새 gameId면 채팅을 초기화한다', () => {
      useGameStore.getState().setGameState(makeGameState({ id: 'old-game' }));
      useGameStore.getState().addChatMessage({
        id: 'msg1',
        playerId: 'p1',
        playerName: 'Player1',
        message: 'hello',
        fromStoryteller: false,
        timestamp: Date.now(),
      });
      expect(Object.keys(useGameStore.getState().chatMessages)).toHaveLength(1);

      useGameStore.getState().setGameState(makeGameState({ id: 'new-game' }));
      expect(useGameStore.getState().chatMessages).toEqual({});
    });

    it('vote 페이즈 전환 시 voteResult를 리셋한다', () => {
      useGameStore.getState().setGameState(makeGameState({ phase: 'day' }));
      useGameStore.getState().setVoteResult({
        nomineeId: 'p1',
        nomineeName: 'Player1',
        guilty: true,
        votes: {},
        executionCandidate: null,
      });

      useGameStore.getState().setGameState(makeGameState({ phase: 'vote' }));
      expect(useGameStore.getState().voteResult).toBeNull();
    });
  });

  describe('addPlayerStatus', () => {
    it('중복 방지', () => {
      useGameStore.getState().setGameState(makeGameState());
      useGameStore.getState().addPlayerStatus('p1', 'poisoned');
      expect(useGameStore.getState().playerStatuses.p1).toEqual(['poisoned']);
    });

    it('새 상태 추가', () => {
      useGameStore.getState().setGameState(makeGameState());
      useGameStore.getState().addPlayerStatus('p1', 'drunk');
      expect(useGameStore.getState().playerStatuses.p1).toEqual([
        'poisoned',
        'drunk',
      ]);
    });
  });

  describe('deliveredFeedbackHistory', () => {
    it('건넨정보 기록을 최신순으로 누적하고 새 게임에서 초기화한다', () => {
      useGameStore.getState().setGameState(makeGameState({ id: 'game-old' }));
      useGameStore.getState().addDeliveredFeedback({
        playerId: 'p1',
        playerName: 'Player1',
        roleId: 'spy',
        roleName: '첩자',
        day: 1,
        timestamp: 1000,
        source: 'manual',
        feedback: { type: 'number', value: 2 },
      });

      expect(useGameStore.getState().deliveredFeedbackHistory).toHaveLength(1);

      useGameStore.getState().setGameState(makeGameState({ id: 'game-new' }));

      expect(useGameStore.getState().deliveredFeedbackHistory).toEqual([]);
    });
  });

  describe('removePlayerStatus', () => {
    it('상태를 제거한다', () => {
      useGameStore.getState().setGameState(makeGameState());
      useGameStore.getState().removePlayerStatus('p1', 'poisoned');
      expect(useGameStore.getState().playerStatuses.p1).toEqual([]);
    });
  });

  describe('swapPlayerOrder', () => {
    it('인덱스를 교환한다', () => {
      useGameStore.getState().setPlayerOrder(['a', 'b', 'c']);
      useGameStore.getState().swapPlayerOrder(0, 2);
      expect(useGameStore.getState().playerOrder).toEqual(['c', 'b', 'a']);
    });

    it('범위 밖이면 변경 없음', () => {
      useGameStore.getState().setPlayerOrder(['a', 'b', 'c']);
      useGameStore.getState().swapPlayerOrder(-1, 2);
      expect(useGameStore.getState().playerOrder).toEqual(['a', 'b', 'c']);
    });
  });

  describe('setVotePreselection', () => {
    it('투표 사전 선택을 설정한다', () => {
      useGameStore.getState().setVotePreselection('p1', true);
      expect(useGameStore.getState().votePreselections.p1).toBe(true);
    });

    it('null로 설정할 수 있다', () => {
      useGameStore.getState().setVotePreselection('p1', true);
      useGameStore.getState().setVotePreselection('p1', null);
      expect(useGameStore.getState().votePreselections.p1).toBeNull();
    });
  });

  describe('applyScapegoatSwap', () => {
    it('희생양 교체 후 처형 예정자와 장의사 기준 대상을 희생양으로 갱신한다', () => {
      useGameStore.getState().setExecutionCandidate({
        playerId: 'original',
        playerName: 'Original',
        guiltyVotes: 4,
      });
      useGameStore.getState().setLastExecutedPlayerId('original');

      useGameStore.getState().applyScapegoatSwap({
        originalId: 'original',
        originalName: 'Original',
        scapegoatId: 'scapegoat',
        scapegoatName: 'Scapegoat',
        guiltyVotes: 4,
      });

      expect(useGameStore.getState().executionCandidate).toEqual({
        playerId: 'scapegoat',
        playerName: 'Scapegoat',
        guiltyVotes: 4,
      });
      expect(useGameStore.getState().lastExecutedPlayerId).toBe('scapegoat');
      expect(useGameStore.getState().scapegoatOffer).toBeNull();
    });
  });

  describe('addChatMessage', () => {
    it('비활성 채팅이면 unread 증가', () => {
      useGameStore.getState().addChatMessage({
        id: 'msg1',
        playerId: 'p1',
        playerName: 'Player1',
        message: 'hello',
        fromStoryteller: false,
        timestamp: Date.now(),
      });

      expect(useGameStore.getState().chatUnreadCounts.p1).toBe(1);
    });

    it('이야기꾼 메시지는 unread 미증가', () => {
      useGameStore.getState().addChatMessage({
        id: 'msg1',
        playerId: 'p1',
        playerName: 'Player1',
        message: 'hello',
        fromStoryteller: true,
        timestamp: Date.now(),
      });

      expect(useGameStore.getState().chatUnreadCounts.p1 ?? 0).toBe(0);
    });

    it('활성 채팅 플레이어이면 unread 미증가', () => {
      useGameStore.getState().setActiveChatPlayerId('p1');
      useGameStore.getState().addChatMessage({
        id: 'msg1',
        playerId: 'p1',
        playerName: 'Player1',
        message: 'hello',
        fromStoryteller: false,
        timestamp: Date.now(),
      });

      expect(useGameStore.getState().chatUnreadCounts.p1).toBe(0);
    });
  });

  describe('reset', () => {
    it('초기 상태로 복원된다', () => {
      useGameStore.getState().setGameState(makeGameState());
      useGameStore.getState().addChatMessage({
        id: 'msg1',
        playerId: 'p1',
        playerName: 'Player1',
        message: 'hello',
        fromStoryteller: false,
        timestamp: Date.now(),
      });

      useGameStore.getState().reset();
      expect(useGameStore.getState().gameId).toBeNull();
      expect(useGameStore.getState().gameState).toBeNull();
      expect(useGameStore.getState().chatMessages).toEqual({});
    });
  });
});
