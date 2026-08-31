import { getRoleById } from '@clocktower/shared';
import { describe, expect, it } from 'vitest';
import { buildRejoinStatePatch } from '../rejoinState';

describe('buildRejoinStatePatch', () => {
  it('처형 후 재접속하면 서버 상태를 복원하고 일시적인 사망 연출을 해제한다', () => {
    const previous = {
      playerId: 'p1',
      playerName: 'Old name',
      nightCount: 1,
      gamePlayers: [],
      justDied: true,
      deathReason: 'execution' as const,
      executionAnnouncement: {
        executedId: 'p1',
        executedName: 'Player1',
        reason: 'execution' as const,
        detail: 'Player1 처형',
      },
      nightDeathAnnouncement: [{ id: 'p1', name: 'Player1' }],
      slayerFizzle: { slayerName: 'A', targetName: 'B' },
      rolePromotion: getRoleById('imp') ?? null,
      pendingRolePromotion: getRoleById('imp') ?? null,
    };
    const nomination = {
      nominatorId: 'p2',
      nomineeId: 'p1',
      nominatorName: 'Player2',
      nomineeName: 'Player1',
    };
    const executionCandidate = {
      playerId: 'p1',
      playerName: 'Player1',
      guiltyVotes: 5,
    };
    const gamePlayers = [
      { id: 'p1', name: 'Player1', isAlive: false, deadVoteUsed: false },
      { id: 'p2', name: 'Player2', isAlive: true, deadVoteUsed: false },
    ];

    const patch = buildRejoinStatePatch(previous, {
      success: true,
      playerName: 'Player1',
      roleId: 'empath',
      phase: 'day',
      isAlive: false,
      deadVoteUsed: false,
      nomination,
      executionCandidate,
      gamePlayers,
    });

    expect(patch).toMatchObject({
      playerId: 'p1',
      playerName: 'Player1',
      isAlive: false,
      deadVoteUsed: false,
      nomination,
      executionCandidate,
      gamePlayers,
      justDied: false,
      deathReason: null,
      executionAnnouncement: null,
      nightDeathAnnouncement: null,
      slayerFizzle: null,
      rolePromotion: null,
      pendingRolePromotion: null,
    });
    expect(patch.role?.id).toBe('empath');
  });

  it('밤 사망 후 재접속해도 서버의 사망 상태를 유지하고 중복 연출을 해제한다', () => {
    const previous = {
      playerId: 'p1',
      playerName: 'Player1',
      nightCount: 2,
      gamePlayers: [
        { id: 'p1', name: 'Player1', isAlive: true, deadVoteUsed: false },
      ],
      justDied: true,
      deathReason: 'night_kill' as const,
      executionAnnouncement: null,
      nightDeathAnnouncement: [{ id: 'p1', name: 'Player1' }],
      slayerFizzle: null,
      rolePromotion: null,
      pendingRolePromotion: null,
    };
    const patch = buildRejoinStatePatch(previous, {
      success: true,
      playerName: 'Player1',
      roleId: 'ravenkeeper',
      phase: 'night',
      isAlive: false,
      deadVoteUsed: true,
      nightCount: 3,
      gamePlayers: [
        { id: 'p1', name: 'Player1', isAlive: false, deadVoteUsed: true },
      ],
    });

    expect(patch).toMatchObject({
      currentPhase: 'night',
      isAlive: false,
      deadVoteUsed: true,
      nightCount: 3,
      justDied: false,
      deathReason: null,
      executionAnnouncement: null,
      nightDeathAnnouncement: null,
      slayerFizzle: null,
      rolePromotion: null,
      pendingRolePromotion: null,
    });
  });

  it('재접속 응답의 게임 설정을 다른 상태와 같은 패치에 포함한다', () => {
    const gameSettings = {
      whisperMode: 'offline' as const,
      votingMode: 'offline' as const,
      voteClockSeconds: 9,
      whisperClockSeconds: 8,
      discussionClockSeconds: 7,
      nominationClockSeconds: 6,
      defenseClockSeconds: 5,
      setupEditionId: 'custom-edition',
      additionalRoleIds: ['chef'],
      excludedRoleIds: ['imp'],
      showVoteHistory: false,
    };
    const patch = buildRejoinStatePatch(
      {
        playerId: 'p1',
        playerName: 'Player1',
        nightCount: 1,
        gamePlayers: [],
        justDied: false,
        deathReason: null,
        executionAnnouncement: null,
        nightDeathAnnouncement: null,
        slayerFizzle: null,
        rolePromotion: null,
        pendingRolePromotion: null,
      },
      {
        success: true,
        playerName: 'Player1',
        phase: 'day',
        gameSettings,
      },
    );

    expect(patch).toMatchObject({ gameSettings });
  });

  it.each([
    ['pending', 'pending-request'],
    ['rejected', 'rejected-request'],
  ] as const)('도박사 %s 검토 상태를 재제출 가능한 밤 차례로 복원한다', (gamblerGuessStatus, gamblerGuessRequestId) => {
    const patch = buildRejoinStatePatch(
      {
        playerId: 'p1',
        playerName: 'Player1',
        nightCount: 2,
        gamePlayers: [],
        justDied: false,
        deathReason: null,
        executionAnnouncement: null,
        nightDeathAnnouncement: null,
        slayerFizzle: null,
        rolePromotion: null,
        pendingRolePromotion: null,
        nightWakeUp: null,
        nightActionSubmitted: true,
      },
      {
        success: true,
        playerName: 'Player1',
        roleId: 'gambler',
        phase: 'night',
        gamblerGuessStatus,
        gamblerGuessRequestId,
      },
    );

    expect(patch).toMatchObject({
      gamblerGuessStatus,
      gamblerGuessRequestId,
      nightWakeUp: 'gambler',
      nightActionSubmitted: false,
    });
    expect(patch).not.toHaveProperty('targetPlayerId');
    expect(patch).not.toHaveProperty('guessedRoleId');
    expect(patch).not.toHaveProperty('correct');
  });

  it('도박사 idle 재접속은 오래된 요청과 wakeUp을 제거한다', () => {
    const patch = buildRejoinStatePatch(
      {
        playerId: 'p1',
        playerName: 'Player1',
        nightCount: 2,
        gamePlayers: [],
        justDied: false,
        deathReason: null,
        executionAnnouncement: null,
        nightDeathAnnouncement: null,
        slayerFizzle: null,
        rolePromotion: null,
        pendingRolePromotion: null,
        nightWakeUp: 'gambler',
        nightActionSubmitted: true,
      },
      {
        success: true,
        playerName: 'Player1',
        roleId: 'gambler',
        phase: 'night',
        gamblerGuessStatus: 'idle',
      },
    );

    expect(patch).toMatchObject({
      gamblerGuessStatus: 'idle',
      gamblerGuessRequestId: null,
      nightWakeUp: null,
      nightActionSubmitted: false,
    });
  });

  it('도박사가 아닌 재접속은 기존 밤 행동 상태를 보존한다', () => {
    const patch = buildRejoinStatePatch(
      {
        playerId: 'p2',
        playerName: 'Player2',
        nightCount: 2,
        gamePlayers: [],
        justDied: false,
        deathReason: null,
        executionAnnouncement: null,
        nightDeathAnnouncement: null,
        slayerFizzle: null,
        rolePromotion: null,
        pendingRolePromotion: null,
        nightWakeUp: 'ravenkeeper',
        nightActionSubmitted: true,
      },
      {
        success: true,
        playerName: 'Player2',
        roleId: 'ravenkeeper',
        phase: 'night',
        gamblerGuessStatus: 'idle',
      },
    );

    expect(patch).toMatchObject({
      gamblerGuessStatus: 'idle',
      gamblerGuessRequestId: null,
      nightWakeUp: 'ravenkeeper',
      nightActionSubmitted: true,
    });
  });
});
