import type {
  ClientToServerEvents,
  ServerToClientEvents,
  ServerToStorytellerEvents,
  StorytellerToServerEvents,
} from '@clocktower/shared/logic';
import type { Namespace, Socket } from 'socket.io';
import type { GameManager } from '../game.js';
import { sendPushToAll } from '../pushNotifications.js';

type PlayerNamespace = Namespace<ClientToServerEvents, ServerToClientEvents>;
type StorytellerNamespace = Namespace<
  StorytellerToServerEvents,
  ServerToStorytellerEvents
>;
type StorytellerSocket = Socket<
  StorytellerToServerEvents,
  ServerToStorytellerEvents
>;

/** 탕녀 승계가 발생했으면 승계 플레이어에게 role:assign 전송 */
function emitPromotionIfAny(
  game: GameManager,
  playerIo: PlayerNamespace,
  storytellerIo: StorytellerNamespace,
): void {
  const promoted = game.consumePromotedPlayer();
  if (promoted?.role) {
    console.log(
      `Scarlet Woman promotion: ${promoted.name} promoted to ${promoted.role.name}`,
    );
    playerIo.to(promoted.id).emit('role:assign', {
      roleId: promoted.role.id,
      roleName: promoted.role.name,
    });
    storytellerIo.emit('game:state', game.getState());
  }
}

export function startClockwiseVote(
  game: GameManager,
  playerIo: PlayerNamespace,
  storytellerIo: StorytellerNamespace,
  nomineeId: string,
): void {
  const voteOrder = game.getClockwiseVoteOrder(nomineeId);
  if (voteOrder.length === 0) return;

  const fullOrder = game.getPlayerOrder();
  const totalPlayers = fullOrder.length;
  const durationMs = game.getSettings().voteClockSeconds * totalPlayers * 1000;

  // 투표 순서를 플레이어에게 전송
  const orderWithNames = voteOrder.map((id) => {
    const p = game.getPlayer(id);
    return { id, name: p?.name ?? id };
  });
  const fullOrderInfo = fullOrder.map((id) => {
    const p = game.getPlayer(id);
    return {
      id,
      name: p?.name ?? id,
      isAlive: p?.isAlive ?? false,
      deadVoteUsed: p?.deadVoteUsed ?? false,
    };
  });
  playerIo.emit('vote:order', {
    nomineeId,
    order: orderWithNames,
    fullOrder: fullOrderInfo,
  });

  // 시계 바늘 시작 알림
  playerIo.emit('vote:clockStart', { durationMs });
  storytellerIo.emit('vote:clockStart', { durationMs });

  // 각 투표자의 확정 시점 계산 (nominee 기준 상대 각도 → 시간)
  const nomineeFullIdx = fullOrder.indexOf(nomineeId);
  const confirmTimes: Array<{ playerId: string; timeMs: number }> = [];
  for (const voterId of voteOrder) {
    const voterFullIdx = fullOrder.indexOf(voterId);
    // nominee 기준 시계방향 상대 위치 (0 ~ N-1)
    const offset =
      (voterFullIdx - nomineeFullIdx + totalPlayers) % totalPlayers;
    // 확정 시점: 해당 위치를 지날 때 (offset/N 만큼 진행했을 때)
    // offset=0인 nominee는 한 바퀴 끝에서 확정
    const fraction = offset === 0 ? 1 : offset / totalPlayers;
    confirmTimes.push({ playerId: voterId, timeMs: fraction * durationMs });
  }
  // 확정 시점 순으로 정렬
  confirmTimes.sort((a, b) => a.timeMs - b.timeMs);

  let nextConfirmIdx = 0;
  const startTime = Date.now();

  const checkInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;

    // 아직 확정되지 않은 투표자들 확인
    while (nextConfirmIdx < confirmTimes.length) {
      const next = confirmTimes[nextConfirmIdx];
      if (elapsed >= next.timeMs) {
        // 프리셀렉트된 값으로 확정 (없으면 불참)
        // 집사 투표 제한: 주인이 투표하지 않았으면 강제 불참
        let voted = game.getPreselectedVote(next.playerId);
        if (voted && game.isButlerRestricted(next.playerId)) {
          voted = false;
        }
        if (voted) {
          game.castVote(next.playerId);
        }
        playerIo.emit('vote:confirmed', {
          playerId: next.playerId,
          guilty: voted,
        });
        storytellerIo.emit('vote:confirmed', {
          playerId: next.playerId,
          guilty: voted,
        });
        nextConfirmIdx++;
      } else {
        break;
      }
    }

    // 모든 투표 완료 → 자동 종료
    if (nextConfirmIdx >= confirmTimes.length || elapsed >= durationMs) {
      clearInterval(checkInterval);
      game.clearVoteTimer();
      const result = game.closeVote();
      if (result) {
        playerIo.emit('vote:result', result);
        storytellerIo.emit('vote:result', result);
        game.returnToNomination();
        playerIo.emit('game:phase', 'day');
        playerIo.emit('day:subPhase', 'nomination');
        storytellerIo.emit('game:state', game.getState());
      }
    }
  }, 100);

  game.setVoteClockInterval(checkInterval);
}

export function registerVoteHandlers(
  socket: StorytellerSocket,
  storytellerIo: StorytellerNamespace,
  playerIo: PlayerNamespace,
  game: GameManager,
): void {
  socket.on('vote:nominate', ({ nominatorId, nomineeId }) => {
    const result = game.nominate(nominatorId, nomineeId);
    if (!result.success) return;

    // 성결자(Virgin) 트리거: 지명자가 마을주민이면 즉시 처형
    if (result.virginKill) {
      const virgin = game.getPlayer(nomineeId);
      const nominator = game.getPlayer(nominatorId);
      game.kill(result.virginKill);
      game.markExecution();
      playerIo.emit('virgin:triggered', {
        virginName: virgin?.name ?? nomineeId,
        nominatorName: nominator?.name ?? nominatorId,
        nominatorId,
      });
      storytellerIo.emit('virgin:triggered', {
        virginName: virgin?.name ?? nomineeId,
        nominatorName: nominator?.name ?? nominatorId,
        nominatorId,
      });
      const killedNominator = game.getPlayer(result.virginKill);
      if (killedNominator) {
        playerIo.emit('execution:announced', {
          executedId: result.virginKill,
          executedName: killedNominator.name,
          reason: 'virgin',
          detail: `${killedNominator.name}이(가) 성결자를 지목하여 처형되었습니다`,
        });
        storytellerIo.emit('execution:announced', {
          executedId: result.virginKill,
          executedName: killedNominator.name,
          reason: 'virgin',
          detail: `${killedNominator.name}이(가) 성결자를 지목하여 처형되었습니다`,
        });
        playerIo.emit('game:playerUpdate', killedNominator);
      }
      storytellerIo.emit('game:state', game.getState());

      // 성결자 트리거 후 승리 조건 체크
      const winResult = game.checkWinCondition();
      if (winResult) {
        winResult.cause = 'virgin';
        playerIo.emit('game:end', winResult);
        playerIo.emit('game:phase', 'ended');
        storytellerIo.emit('game:end', winResult);
        storytellerIo.emit('game:state', game.getState());
      } else {
        emitPromotionIfAny(game, playerIo, storytellerIo);
      }
      return;
    }

    // 변론 페이즈로 전환 (낮 페이즈 유지, 이야기꾼이 투표 시작을 제어)
    game.setDaySubPhase('defense');
    const nominator = game.getPlayer(nominatorId);
    const nominee = game.getPlayer(nomineeId);
    playerIo.emit('day:subPhase', 'defense');
    playerIo.emit('vote:start', {
      nominatorId,
      nomineeId,
      nominatorName: nominator?.name ?? nominatorId,
      nomineeName: nominee?.name ?? nomineeId,
    });
    storytellerIo.emit('game:state', game.getState());

    const state = game.getState();
    const allIds = state.players.map((p) => p.id);
    sendPushToAll(
      allIds,
      '⚖️ 지목되었습니다',
      `${nominator?.name ?? '???'}이(가) ${nominee?.name ?? '???'}을(를) 지목했습니다. 변론이 진행됩니다.`,
    );
  });

  socket.on('vote:proceedToVote', () => {
    const state = game.getState();
    const currentNomination = state.nominations[state.nominations.length - 1];
    if (!currentNomination) return;

    const nomineeId = currentNomination.nomineeId;

    // 변론 → 투표 페이즈 전환
    game.setPhase('vote');
    playerIo.emit('game:phase', 'vote');
    playerIo.emit('vote:proceedToVote');
    storytellerIo.emit('vote:proceedToVote');
    storytellerIo.emit('game:state', game.getState());

    // 시계방향 투표 시작 (온라인 투표 모드일 때만) - 5초 카운트다운 후 시작
    if (state.settings.votingMode === 'online') {
      const countdownTimeout = setTimeout(() => {
        startClockwiseVote(game, playerIo, storytellerIo, nomineeId);
      }, 5000);
      game.setVoteCountdownTimeout(countdownTimeout);
    }
  });

  socket.on('vote:castForPlayer', ({ playerId, guilty }) => {
    // 시계방향 투표 중이면 프리셀렉트로 처리
    game.preselectVote(playerId, guilty);
    playerIo.emit('vote:preselected', { playerId, guilty });
    storytellerIo.emit('vote:preselected', { playerId, guilty });
  });

  socket.on('vote:close', () => {
    const result = game.closeVote();
    if (result) {
      playerIo.emit('vote:result', result);
      storytellerIo.emit('vote:result', result);

      // 투표 종료 후 → 지목 단계로 복귀 (처형은 밤 전환 시 수행)
      game.returnToNomination();
      playerIo.emit('game:phase', 'day');
      playerIo.emit('day:subPhase', 'nomination');
      storytellerIo.emit('game:state', game.getState());
    }
  });

  socket.on('slayer:forceAck', () => {
    playerIo.emit('slayer:allAcked');
    storytellerIo.emit('slayer:allAcked');

    const pausedNomineeId = game.getVoteClockPausedNomineeId();
    game.clearSlayerAckState();
    if (pausedNomineeId) {
      startClockwiseVote(game, playerIo, storytellerIo, pausedNomineeId);
    }
    console.log('Storyteller forced slayer ack');
  });
}
