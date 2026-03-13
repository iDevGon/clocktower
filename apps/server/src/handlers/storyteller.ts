import type {
  ClientToServerEvents,
  ServerToClientEvents,
  ServerToStorytellerEvents,
  StorytellerToServerEvents,
} from '@clocktower/shared/logic';
import {
  ALL_ROLES,
  distributeRoles,
  FIRST_NIGHT_ORDER,
  getRoleById,
  OTHER_NIGHT_ORDER,
} from '@clocktower/shared/logic';
import type { Namespace } from 'socket.io';
import type { GameManager } from '../game.js';
import {
  clearPushTokens,
  sendPushNotification,
  sendPushToAll,
} from '../pushNotifications.js';
import type { WhisperTracker } from '../whisper.js';

type PlayerNamespace = Namespace<ClientToServerEvents, ServerToClientEvents>;
type StorytellerNamespace = Namespace<
  StorytellerToServerEvents,
  ServerToStorytellerEvents
>;

function getNightOrder(day: number): string[] {
  return day <= 1 ? FIRST_NIGHT_ORDER : OTHER_NIGHT_ORDER;
}

/**
 * 악한 팀에게 정보 전송:
 * - 악마: 하수인 이름 + 블러프용 선한 역할 3개
 * - 하수인: 악마 이름 + 다른 하수인 이름
 */
function sendEvilInfo(playerIo: PlayerNamespace, game: GameManager): void {
  const state = game.getState();
  const assignedRoleIds = new Set(
    state.players.map((p) => p.role?.id).filter(Boolean),
  );

  // 게임에 없는 선한 역할 중 3개를 블러프용으로 선택
  const notInPlayGood = ALL_ROLES.filter(
    (r) =>
      (r.team === 'townsfolk' || r.team === 'outsider') &&
      !assignedRoleIds.has(r.id),
  );
  const shuffled = [...notInPlayGood].sort(() => Math.random() - 0.5);
  const bluffRoles = shuffled
    .slice(0, 3)
    .map((r) => ({ id: r.id, name: r.name }));

  const demons = state.players.filter((p) => p.role?.team === 'demon');
  const minions = state.players.filter((p) => p.role?.team === 'minion');

  // 악마에게 전송
  for (const demon of demons) {
    playerIo.to(demon.id).emit('evil:info', {
      minionNames: minions.map((m) => m.name),
      bluffRoles,
    });
  }

  // 하수인에게 전송
  for (const minion of minions) {
    const otherMinions = minions.filter((m) => m.id !== minion.id);
    playerIo.to(minion.id).emit('evil:info', {
      demonName: demons[0]?.name,
      otherMinionNames: otherMinions.map((m) => m.name),
    });
  }
}

function getPlayerInfoList(game: GameManager) {
  return game.getState().players.map(({ id, name, isAlive }) => ({
    id,
    name,
    isAlive,
  }));
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
  const durationMs = game.getSettings().voteClockSeconds * 1000;

  // 투표 순서를 플레이어에게 전송
  const orderWithNames = voteOrder.map((id) => {
    const p = game.getPlayer(id);
    return { id, name: p?.name ?? id };
  });
  const fullOrderInfo = fullOrder.map((id) => {
    const p = game.getPlayer(id);
    return { id, name: p?.name ?? id, isAlive: p?.isAlive ?? false };
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
        // 프리셀렉트된 값으로 확정 (없으면 반대)
        const guilty = game.getPreselectedVote(next.playerId);
        game.castVote(next.playerId, guilty, true);
        playerIo.emit('vote:confirmed', { playerId: next.playerId, guilty });
        storytellerIo.emit('vote:confirmed', {
          playerId: next.playerId,
          guilty,
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

export function registerStorytellerHandlers(
  storytellerIo: StorytellerNamespace,
  playerIo: PlayerNamespace,
  game: GameManager,
  whisperTracker: WhisperTracker,
): void {
  storytellerIo.on('connection', (socket) => {
    console.log('Storyteller connected');

    // Send current game state on reconnect
    const currentState = game.getState();
    if (currentState.id) {
      socket.emit('game:state', currentState);
    }

    socket.on('game:reset', () => {
      game.reset();
      clearPushTokens();
      playerIo.emit('game:state', game.getState());
      storytellerIo.emit('game:state', game.getState());
    });

    socket.on('game:restart', (callback) => {
      const newId = game.restart();
      clearPushTokens();
      // 플레이어에게 새 게임 상태 전송 (플레이어 목록 유지, 역할/상태 초기화)
      playerIo.emit('game:phase', 'setup');
      playerIo.emit('game:state', game.getState());
      storytellerIo.emit('game:state', game.getState());
      callback({ success: true, gameId: newId });
    });

    socket.on('game:create', (callback) => {
      game.create();
      storytellerIo.emit('game:state', game.getState());
      callback({ success: true });
    });

    socket.on('game:start', (callback) => {
      const result = game.start();
      if (!result.success) {
        callback(result);
        return;
      }
      const state = game.getState();
      playerIo.emit('game:phase', 'night');
      const order = getNightOrder(state.day);
      const players = getPlayerInfoList(game);
      game.setNightProgress(null, order);
      playerIo.emit('night:activeRole', { roleId: null, order, players });
      storytellerIo.emit('game:state', state);
      callback({ success: true });
    });

    socket.on('game:setPhase', (phase) => {
      // 밤 전환 시 → 최다 투표 후보 처형 실행
      if (phase === 'night') {
        const candidate = game.getExecutionCandidate();
        if (candidate) {
          game.kill(candidate.playerId);
          game.markExecution();
          const killedPlayer = game.getPlayer(candidate.playerId);
          if (killedPlayer) {
            // 처형 알림을 먼저 전송 (사망 알림보다 먼저)
            playerIo.emit('execution:announced', {
              executedId: candidate.playerId,
              executedName: killedPlayer.name,
              reason: 'execution',
              detail: `${killedPlayer.name}이(가) 투표로 처형되었습니다`,
            });
            storytellerIo.emit('execution:announced', {
              executedId: candidate.playerId,
              executedName: killedPlayer.name,
              reason: 'execution',
              detail: `${killedPlayer.name}이(가) 투표로 처형되었습니다`,
            });
            playerIo.emit('game:playerUpdate', killedPlayer);
          }
          // 처형 후 승리 조건 체크
          const executedRoleId = killedPlayer?.role?.id;
          const winResult = game.checkWinCondition(executedRoleId);
          if (winResult) {
            winResult.cause = 'execution';
            playerIo.emit('game:end', winResult);
            playerIo.emit('game:phase', 'ended');
            storytellerIo.emit('game:end', winResult);
            storytellerIo.emit('game:state', game.getState());
            return;
          }
        }
      }

      game.setPhase(phase);
      playerIo.emit('game:phase', phase);
      if (phase === 'night') {
        const state = game.getState();
        const order = getNightOrder(state.day);
        const players = getPlayerInfoList(game);
        game.setNightProgress(null, order);
        playerIo.emit('night:activeRole', { roleId: null, order, players });
        const allIds = state.players.map((p) => p.id);
        sendPushToAll(allIds, '🌙 밤이 되었습니다', '눈을 감으세요...');
      }
      if (phase === 'day') {
        // 밤 중 사망한 플레이어들 알림
        const pendingKills = game.flushPendingNightKills();
        const nightDeaths: Array<{ id: string; name: string }> = [];
        for (const killId of pendingKills) {
          const killed = game.getPlayer(killId);
          if (killed) {
            playerIo.emit('game:playerUpdate', killed);
            nightDeaths.push({ id: killed.id, name: killed.name });
          }
        }
        // 모든 플레이어에게 간밤 사망자 알림 (오버레이 표시용)
        // 사망자가 없어도 전송하여 "아무도 사망하지 않았습니다" 표시
        playerIo.emit('night:deaths', { deaths: nightDeaths });
        playerIo.emit('game:state', game.getState());
        playerIo.emit('day:subPhase', 'whisper');
        whisperTracker.clear();
        const whisperSec = game.getSettings().whisperClockSeconds;
        if (whisperSec > 0) {
          const durationMs = whisperSec * 1000;
          playerIo.emit('whisper:clockStart', { durationMs });
          storytellerIo.emit('whisper:clockStart', { durationMs });
        }
        const state = game.getState();
        const allIds = state.players.map((p) => p.id);
        sendPushToAll(allIds, '☀️ 낮이 되었습니다', '토론을 시작하세요!');
      }
      storytellerIo.emit('game:state', game.getState());
    });

    socket.on('day:setSubPhase', (subPhase) => {
      game.setDaySubPhase(subPhase);
      playerIo.emit('day:subPhase', subPhase);
      storytellerIo.emit('game:state', game.getState());

      if (subPhase === 'whisper') {
        const whisperSec = game.getSettings().whisperClockSeconds;
        if (whisperSec > 0) {
          const durationMs = whisperSec * 1000;
          playerIo.emit('whisper:clockStart', { durationMs });
          storytellerIo.emit('whisper:clockStart', { durationMs });
        }
      }
    });

    socket.on('night:sendFeedback', ({ playerId, feedback }) => {
      playerIo.to(playerId).emit('night:feedback', { feedback });
      console.log(`Feedback -> ${playerId}: ${JSON.stringify(feedback)}`);
    });

    socket.on('night:setActiveRole', (roleId) => {
      const state = game.getState();
      const order = getNightOrder(state.day);
      const players = getPlayerInfoList(game);
      game.setNightProgress(roleId, order);
      playerIo.emit('night:activeRole', { roleId, order, players });

      // Push notification to the active role's player
      if (roleId) {
        const activePlayer = state.players.find((p) => p.role?.id === roleId);
        if (activePlayer) {
          const role = getRoleById(roleId);
          const roleName = role?.name ?? roleId;
          sendPushNotification(
            activePlayer.id,
            '🌙 당신의 차례입니다',
            `${roleName}, 행동을 수행하세요`,
          );
        }
        // 주정뱅이: 가짜 역할의 차례에 알림 전송
        const drunkPlayer = state.players.find(
          (p) => p.role?.id === 'drunk' && p.drunkAs === roleId,
        );
        if (drunkPlayer) {
          const role = getRoleById(roleId);
          const roleName = role?.name ?? roleId;
          sendPushNotification(
            drunkPlayer.id,
            '🌙 당신의 차례입니다',
            `${roleName}, 행동을 수행하세요`,
          );
        }
      }

      // Spy: automatically send grimoire
      if (roleId === 'spy') {
        const spyPlayer = state.players.find((p) => p.role?.id === 'spy');
        if (spyPlayer) {
          const entries = state.players.map((p) => ({
            name: p.name,
            roleName: p.role?.name ?? '???',
            team: p.role?.team ?? ('townsfolk' as const),
            isAlive: p.isAlive,
            statuses: p.statuses ?? [],
          }));
          playerIo.to(spyPlayer.id).emit('night:feedback', {
            feedback: { type: 'grimoire', entries },
          });
        }
      }
    });

    socket.on('player:setStatuses', ({ playerId, statuses }) => {
      game.setPlayerStatuses(playerId, statuses);
    });

    socket.on('game:setSettings', (settings) => {
      game.setSettings(settings);
      const newSettings = game.getSettings();
      playerIo.emit('game:settings', newSettings);
      storytellerIo.emit('game:state', game.getState());
    });

    socket.on('game:setPlayerOrder', (order) => {
      game.setPlayerOrder(order);
      storytellerIo.emit('game:state', game.getState());
    });

    socket.on('game:addDummyPlayers', (count) => {
      const names = [
        '앨리스',
        '밥',
        '찰리',
        '다이앤',
        '에드',
        '프랭크',
        '그레이스',
        '헬렌',
        '아이작',
        '재클린',
        '케빈',
        '루시',
        '마이크',
        '낸시',
        '올리버',
        '페니',
        '퀸',
        '로버트',
        '수잔',
        '토마스',
      ];
      const existing = game.getState().players.length;
      for (let i = 0; i < count && existing + i < names.length; i++) {
        game.addPlayer(names[existing + i]);
      }
      storytellerIo.emit('game:state', game.getState());
    });

    socket.on('game:removeDummyPlayers', () => {
      game.clearPlayers();
      storytellerIo.emit('game:state', game.getState());
    });

    socket.on('game:distributeRoles', (options, callback) => {
      const state = game.getState();
      const playerIds = state.players.map((p) => p.id);
      const result = distributeRoles(playerIds, options);
      if (!result) {
        const hasExcluded =
          options.excludedRoleIds && options.excludedRoleIds.length > 0;
        callback({
          success: false,
          error: hasExcluded
            ? `역할 배분 불가: 제외된 역할이 너무 많거나 플레이어 수(${playerIds.length}명)가 맞지 않습니다`
            : `${playerIds.length}명은 지원하지 않습니다 (5~20명)`,
        });
        return;
      }
      for (const { playerId, role, drunkAs } of result.assignments) {
        game.assignRole(playerId, role.id, drunkAs);
        if (role.id === 'drunk' && drunkAs) {
          // 주정뱅이에게는 가짜 마을주민 역할을 전송
          const fakeRole = getRoleById(drunkAs);
          playerIo.to(playerId).emit('role:assign', {
            roleId: drunkAs,
            roleName: fakeRole?.name ?? drunkAs,
            drunkAs,
          });
        } else {
          playerIo.to(playerId).emit('role:assign', {
            roleId: role.id,
            roleName: role.name,
          });
        }
      }
      sendEvilInfo(playerIo, game);
      // 점쟁이가 배정되면 Red Herring 자동 지정
      game.assignFortuneTellerRedHerring();
      storytellerIo.emit('game:state', game.getState());
      callback({ success: true });
    });

    socket.on('game:assignRole', ({ playerId, roleId, drunkAs }) => {
      // 이미 다른 플레이어가 같은 역할을 갖고 있으면 스왑
      const state = game.getState();
      const currentPlayer = state.players.find((p) => p.id === playerId);
      const existingOwner = state.players.find(
        (p) => p.id !== playerId && p.role?.id === roleId,
      );

      if (existingOwner && currentPlayer) {
        // 스왑: 기존 소유자에게 현재 플레이어의 역할을 부여
        const oldRole = currentPlayer.role;
        if (oldRole) {
          game.assignRole(existingOwner.id, oldRole.id);
          playerIo.to(existingOwner.id).emit('role:assign', {
            roleId: oldRole.id,
            roleName: oldRole.name,
          });
        } else {
          // 현재 플레이어에게 역할이 없으면 기존 소유자의 역할을 해제
          game.unassignRole(existingOwner.id);
        }
      }

      if (roleId === 'drunk') {
        // 수동 주정뱅이 배정: 이야기꾼이 가짜 역할을 지정하거나, 없으면 랜덤 선택
        let fakeRoleId = drunkAs;
        if (!fakeRoleId) {
          const freshState = game.getState();
          const assignedRoleIds = freshState.players
            .filter((p) => p.id !== playerId)
            .map((p) => p.role?.id)
            .filter(Boolean);
          const availableTownsfolk = ALL_ROLES.filter(
            (r) => r.team === 'townsfolk' && !assignedRoleIds.includes(r.id),
          );
          fakeRoleId =
            availableTownsfolk.length > 0
              ? availableTownsfolk[
                  Math.floor(Math.random() * availableTownsfolk.length)
                ].id
              : undefined;
        }
        game.assignRole(playerId, roleId, fakeRoleId);
        if (fakeRoleId) {
          const fakeRole = getRoleById(fakeRoleId);
          playerIo.to(playerId).emit('role:assign', {
            roleId: fakeRoleId,
            roleName: fakeRole?.name ?? fakeRoleId,
            drunkAs: fakeRoleId,
          });
        }
      } else {
        game.assignRole(playerId, roleId);
        const player = game.getPlayer(playerId);
        if (player?.role) {
          playerIo.to(playerId).emit('role:assign', {
            roleId: player.role.id,
            roleName: player.role.name,
          });
        }
      }
      // 모든 플레이어에게 역할이 배정되면 악한 팀 정보 전송
      const updatedState = game.getState();
      if (updatedState.players.every((p) => p.role)) {
        sendEvilInfo(playerIo, game);
        // 점쟁이가 배정되면 Red Herring 자동 지정
        game.assignFortuneTellerRedHerring();
      }
      storytellerIo.emit('game:state', game.getState());
    });

    socket.on('game:kill', (playerId) => {
      const killedPlayer = game.getPlayer(playerId);
      const isNight = game.getState().phase === 'night';

      // 임프 자해 감지: 사망 처리 전에 체크
      const isImpSelfKill = killedPlayer?.role?.id === 'imp' && isNight;

      game.kill(playerId);

      // 임프 자해 → 하수인 승계
      if (isImpSelfKill) {
        const promoted = game.handleImpSelfKill(playerId);
        if (promoted) {
          console.log(`Imp self-kill: ${promoted.name} promoted to Imp`);
          storytellerIo.emit('game:state', game.getState());
        }
      }

      storytellerIo.emit('game:state', game.getState());

      // 승리 조건 체크
      const winResult = game.checkWinCondition();
      if (winResult) {
        playerIo.emit('game:end', winResult);
        playerIo.emit('game:phase', 'ended');
        storytellerIo.emit('game:end', winResult);
        storytellerIo.emit('game:state', game.getState());
      } else if (killedPlayer) {
        if (isNight) {
          // 밤 중 사망: 낮 전환 시까지 플레이어 알림 보류
          game.addPendingNightKill(playerId);
        } else {
          const updatedPlayer = game.getPlayer(playerId);
          if (updatedPlayer) playerIo.emit('game:playerUpdate', updatedPlayer);
        }
      }
    });

    socket.on('game:revive', (playerId) => {
      game.revive(playerId);
      storytellerIo.emit('game:state', game.getState());
      const revivedPlayer = game.getPlayer(playerId);
      if (revivedPlayer) {
        playerIo.emit('game:playerUpdate', revivedPlayer);
      }
    });

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

    socket.on('chat:sendToPlayer', ({ playerId, message }) => {
      const player = game.getPlayer(playerId);
      if (!player) return;

      const chatMsg = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        playerId,
        playerName: player.name,
        message,
        fromStoryteller: true,
        timestamp: Date.now(),
      };

      // Send to the target player
      playerIo.to(playerId).emit('chat:receiveFromStoryteller', chatMsg);
      // Echo back to storyteller
      storytellerIo.emit('chat:receiveFromPlayer', chatMsg);
      console.log(`ST Chat -> ${player.name}: ${message}`);
    });

    socket.on('disconnect', () => {
      console.log('Storyteller disconnected');
    });
  });
}
