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
  NIGHT_ACTIONS,
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
import { registerVoteHandlers } from './storytellerVote.js';

type PlayerNamespace = Namespace<ClientToServerEvents, ServerToClientEvents>;
type StorytellerNamespace = Namespace<
  StorytellerToServerEvents,
  ServerToStorytellerEvents
>;

function getNightOrder(day: number): string[] {
  return day <= 1 ? FIRST_NIGHT_ORDER : OTHER_NIGHT_ORDER;
}

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
    storytellerIo.emit('game:state', game.getStorytellerState());
  }
}

/**
 * 게임에 등장하지 않는 선한 역할 목록을 반환합니다.
 * Drunk의 drunkAs 역할도 "등장하는 역할"로 간주합니다.
 */
function getNotInPlayGoodRoles(game: GameManager) {
  const state = game.getState();
  const assignedRoleIds = new Set(
    state.players.flatMap((p) => [p.role?.id, p.drunkAs]).filter(Boolean),
  );
  return ALL_ROLES.filter(
    (r) =>
      (r.team === 'townsfolk' || r.team === 'outsider') &&
      !assignedRoleIds.has(r.id),
  );
}

/**
 * 블러프 역할 3개를 결정합니다.
 * 이야기꾼이 사전 선택한 블러프가 있으면 우선 사용하고,
 * 3개 미만이면 나머지를 랜덤으로 채웁니다.
 */
function resolveBluffRoles(
  game: GameManager,
  preselectedIds?: string[],
): { id: string; name: string }[] {
  const notInPlayGood = getNotInPlayGoodRoles(game);
  const notInPlayMap = new Map(notInPlayGood.map((r) => [r.id, r]));

  // 사전 선택된 블러프 중 유효한 것만 필터
  const selected: { id: string; name: string }[] = [];
  const usedIds = new Set<string>();
  if (preselectedIds) {
    for (const id of preselectedIds) {
      if (selected.length >= 3) break;
      const role = notInPlayMap.get(id);
      if (!role || usedIds.has(id)) continue;
      selected.push({ id: role.id, name: role.name });
      usedIds.add(id);
    }
  }

  // 나머지를 랜덤으로 채우기
  if (selected.length < 3) {
    const remaining = notInPlayGood.filter((r) => !usedIds.has(r.id));
    const shuffled = [...remaining].sort(() => Math.random() - 0.5);
    for (const r of shuffled) {
      if (selected.length >= 3) break;
      selected.push({ id: r.id, name: r.name });
    }
  }

  return selected;
}

/**
 * 악한 팀에게 정보 전송:
 * - 악마: 하수인 이름 + 블러프용 선한 역할 3개
 * - 하수인: 악마 이름 + 다른 하수인 이름
 */
function sendEvilInfo(
  playerIo: PlayerNamespace,
  game: GameManager,
  preselectedBluffIds?: string[],
): void {
  const state = game.getState();
  const bluffRoles = resolveBluffRoles(game, preselectedBluffIds);

  // 블러프를 GameManager에 저장 (이야기꾼 표시용)
  game.setBluffRoles(bluffRoles);

  const demons = state.players.filter((p) => p.role?.team === 'demon');
  const minions = state.players.filter((p) => p.role?.team === 'minion');

  // 악마에게 전송
  demons.forEach((demon) => {
    playerIo.to(demon.id).emit('evil:info', {
      minionNames: minions.map((m) => m.name),
      bluffRoles,
    });
  });

  // 하수인에게 전송
  minions.forEach((minion) => {
    const otherMinions = minions.filter((m) => m.id !== minion.id);
    playerIo.to(minion.id).emit('evil:info', {
      demonName: demons[0]?.name,
      otherMinionNames: otherMinions.map((m) => m.name),
    });
  });
}

function getPlayerInfoList(game: GameManager) {
  return game.getState().players.map(({ id, name, isAlive, deadVoteUsed }) => ({
    id,
    name,
    isAlive,
    deadVoteUsed,
  }));
}

export { startClockwiseVote } from './storytellerVote.js';

export function registerStorytellerHandlers(
  storytellerIo: StorytellerNamespace,
  playerIo: PlayerNamespace,
  game: GameManager,
  whisperTracker: WhisperTracker,
): void {
  storytellerIo.on('connection', (socket) => {
    console.log('Storyteller connected');

    // Send current game state on reconnect (or notify no active game)
    const currentState = game.getStorytellerState();
    if (currentState.id) {
      socket.emit('game:state', currentState);
    } else {
      socket.emit('game:reset');
    }

    socket.on('game:reset', () => {
      game.reset();
      clearPushTokens();
      playerIo.emit('game:state', game.getState());
      storytellerIo.emit('game:state', game.getStorytellerState());
    });

    socket.on('game:restart', (callback) => {
      const newId = game.restart();
      clearPushTokens();
      // 플레이어에게 새 게임 상태 전송 (플레이어 목록 유지, 역할/상태 초기화)
      playerIo.emit('game:phase', 'setup');
      playerIo.emit('game:state', game.getState());
      storytellerIo.emit('game:state', game.getStorytellerState());
      callback({ success: true, gameId: newId });
    });

    socket.on('game:create', (callback) => {
      game.create();
      storytellerIo.emit('game:state', game.getStorytellerState());
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
            storytellerIo.emit('game:state', game.getStorytellerState());
            return;
          }
          emitPromotionIfAny(game, playerIo, storytellerIo);
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
        // 임프 자해 승계 실행
        const impPromoted = game.flushImpPromotion();
        if (impPromoted?.role) {
          console.log(
            `Imp self-kill promotion: ${impPromoted.name} promoted to ${impPromoted.role.name}`,
          );
          playerIo.to(impPromoted.id).emit('role:assign', {
            roleId: impPromoted.role.id,
            roleName: impPromoted.role.name,
          });
        }

        // 밤 중 사망한 플레이어들 알림
        const pendingKills = game.flushPendingNightKills();
        const nightDeaths: Array<{ id: string; name: string }> = [];
        pendingKills.forEach((killId) => {
          const killed = game.getPlayer(killId);
          if (killed) {
            playerIo.emit('game:playerUpdate', killed);
            nightDeaths.push({ id: killed.id, name: killed.name });
          }
        });
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
      storytellerIo.emit('game:state', game.getStorytellerState());
    });

    socket.on('day:setSubPhase', (subPhase) => {
      game.setDaySubPhase(subPhase);
      playerIo.emit('day:subPhase', subPhase);
      storytellerIo.emit('game:state', game.getStorytellerState());

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

      // 대기열에 다음 플레이어가 있으면 순차 wakeUp
      const next = game.popNightWakeUp();
      if (next) {
        const role = getRoleById(next.roleId);
        const roleName = role?.name ?? next.roleId;
        sendPushNotification(
          next.playerId,
          '🌙 당신의 차례입니다',
          `${roleName}, 행동을 수행하세요`,
        );
        playerIo
          .to(next.playerId)
          .emit('night:wakeUp', { roleId: next.roleId });
      }
    });

    socket.on('night:setActiveRole', (roleId) => {
      const state = game.getState();
      const order = getNightOrder(state.day);
      const players = getPlayerInfoList(game);
      game.setNightProgress(roleId, order);
      playerIo.emit('night:activeRole', { roleId, order, players });

      // 대상 플레이어 수집 → 셔플 → 첫 번째만 wakeUp, 나머지는 큐
      game.clearNightWakeUpQueue();
      if (roleId) {
        const actionDef = NIGHT_ACTIONS[roleId];
        const isOnlyWhenDead = actionDef?.onlyWhenDead === true;

        // 실제 역할 + 주정뱅이(drunkAs) 모두 수집
        const candidates = state.players.filter(
          (p) =>
            (p.role?.id === roleId ||
              (p.role?.id === 'drunk' && p.drunkAs === roleId)) &&
            (isOnlyWhenDead
              ? !p.isAlive && game.hasPendingNightKill(p.id)
              : p.isAlive),
        );

        // Fisher-Yates 셔플
        for (let i = candidates.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
        }

        // 이야기꾼에게 실제 wakeUp 대상 목록 전송
        const candidateIds = candidates.map((p) => p.id);
        storytellerIo.emit('night:wakeUpTargets', { candidateIds });

        if (candidates.length > 0) {
          // 첫 번째 플레이어에게 즉시 wakeUp
          const first = candidates[0];
          const role = getRoleById(roleId);
          const roleName = role?.name ?? roleId;
          sendPushNotification(
            first.id,
            '🌙 당신의 차례입니다',
            `${roleName}, 행동을 수행하세요`,
          );
          playerIo.to(first.id).emit('night:wakeUp', { roleId });

          // 나머지는 대기열에 저장 (night:sendFeedback 시 순차 전송)
          if (candidates.length > 1) {
            const remaining = candidates.slice(1).map((p) => p.id);
            game.setNightWakeUpQueue(remaining, roleId);
          }
        }
      }

      // Spy: automatically send grimoire
      if (roleId === 'spy') {
        const spyPlayer = state.players.find(
          (p) => p.isAlive && p.role?.id === 'spy',
        );
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
      storytellerIo.emit('game:state', game.getStorytellerState());
    });

    socket.on('game:setPlayerOrder', (order) => {
      game.setPlayerOrder(order);
      const state = game.getState();
      storytellerIo.emit('game:state', state);
      playerIo.emit('game:state', state);
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
        game.addPlayer(names[existing + i], true);
      }
      storytellerIo.emit('game:state', game.getStorytellerState());
    });

    socket.on('game:removeDummyPlayers', () => {
      game.removeDummyPlayers();
      storytellerIo.emit('game:state', game.getStorytellerState());
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
      result.assignments.forEach(({ playerId, role, drunkAs: origDrunkAs }) => {
        let drunkAs = origDrunkAs;
        // 주정뱅이인데 가짜 역할이 없으면 자동 배정
        if (role.id === 'drunk' && !drunkAs) {
          const assignedRoleIds = result.assignments
            .filter((a) => a.playerId !== playerId)
            .map((a) => a.role.id);
          const availableTownsfolk = ALL_ROLES.filter(
            (r) => r.team === 'townsfolk' && !assignedRoleIds.includes(r.id),
          );
          const candidates =
            availableTownsfolk.length > 0
              ? availableTownsfolk
              : ALL_ROLES.filter((r) => r.team === 'townsfolk');
          if (candidates.length > 0) {
            drunkAs =
              candidates[Math.floor(Math.random() * candidates.length)].id;
          }
        }
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
      });
      sendEvilInfo(playerIo, game, options.bluffRoleIds);
      storytellerIo.emit('game:state', game.getStorytellerState());
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
      storytellerIo.emit('game:state', game.getStorytellerState());
    });

    socket.on('game:kill', (playerId) => {
      const killedPlayer = game.getPlayer(playerId);
      const isNight = game.getState().phase === 'night';

      // 임프 자해 감지: 사망 처리 전에 체크
      const isImpSelfKill = killedPlayer?.role?.id === 'imp' && isNight;

      // 사랑꾼 사망 감지: 사망 처리 전에 체크
      const isSweetheartDeath = killedPlayer?.role?.id === 'sweetheart';

      // 시장 밤 사망 감지: 사망 처리 전에 체크
      const isMayorNightDeath = killedPlayer?.role?.id === 'mayor' && isNight;

      game.kill(playerId);

      // 임프 자해 → 하수인 승계 예약 (낮 전환 시 실행)
      if (isImpSelfKill) {
        game.handleImpSelfKill(playerId);
      }

      storytellerIo.emit('game:state', game.getStorytellerState());

      // 사랑꾼 사망 → 이야기꾼에게 취하게 할 대상 선택 요청
      if (isSweetheartDeath && killedPlayer) {
        storytellerIo.emit('sweetheart:died', {
          sweetheartName: killedPlayer.name,
        });
      }

      // 시장 밤 사망 → 이야기꾼에게 대신 죽일 대상 선택 요청
      if (isMayorNightDeath && killedPlayer) {
        storytellerIo.emit('mayor:nightDeath', {
          mayorId: playerId,
          mayorName: killedPlayer.name,
        });
      }

      // 승리 조건 체크
      const winResult = game.checkWinCondition();
      if (winResult) {
        playerIo.emit('game:end', winResult);
        playerIo.emit('game:phase', 'ended');
        storytellerIo.emit('game:end', winResult);
        storytellerIo.emit('game:state', game.getStorytellerState());
        return;
      }
      emitPromotionIfAny(game, playerIo, storytellerIo);
      if (!killedPlayer) return;
      if (isNight) {
        // 밤 중 사망: 낮 전환 시까지 플레이어 알림 보류
        game.addPendingNightKill(playerId);
        return;
      }
      const updatedPlayer = game.getPlayer(playerId);
      if (updatedPlayer) playerIo.emit('game:playerUpdate', updatedPlayer);
    });

    socket.on('game:revive', (playerId) => {
      game.revive(playerId);
      storytellerIo.emit('game:state', game.getStorytellerState());
      const revivedPlayer = game.getPlayer(playerId);
      if (revivedPlayer) {
        playerIo.emit('game:playerUpdate', revivedPlayer);
      }
    });

    // 투표 관련 핸들러 등록 (별도 모듈)
    registerVoteHandlers(socket, storytellerIo, playerIo, game);

    socket.on('game:assignRedHerring', (playerId) => {
      game.setRedHerring(playerId);
      storytellerIo.emit('game:state', game.getStorytellerState());
    });

    socket.on('game:mayorRedirect', ({ mayorId, redirectTargetId }) => {
      // 시장 부활
      game.revive(mayorId);
      game.removePendingNightKill(mayorId);
      // 대신 사망할 플레이어 처리
      game.kill(redirectTargetId);
      game.addPendingNightKill(redirectTargetId);
      storytellerIo.emit('game:state', game.getStorytellerState());
    });

    socket.on('game:sweetheartDrunk', (playerId) => {
      const player = game.getPlayer(playerId);
      if (!player) return;
      if (!player.statuses.includes('drunk')) {
        player.statuses.push('drunk');
      }
      storytellerIo.emit('game:state', game.getStorytellerState());
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
