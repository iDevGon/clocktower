import type {
  ClientToServerEvents,
  DeliveredFeedbackSource,
  NightFeedbackPayload,
  Player,
  Role,
  ServerToClientEvents,
  ServerToStorytellerEvents,
  StorytellerToServerEvents,
} from '@clocktower/shared/logic';
import {
  ALL_ROLES,
  distributeRoles,
  FIRST_NIGHT_ORDER,
  getNightOrderForEdition,
  getRoleById,
  NIGHT_ACTIONS,
  OTHER_NIGHT_ORDER,
} from '@clocktower/shared/logic';
import type { Namespace } from 'socket.io';
import type { GameManager } from '../game.js';
import {
  buildTrueGrimoireFeedback,
  shouldAutoSendSpyGrimoire,
} from '../nightFeedback.js';
import {
  clearPushTokens,
  sendPushNotification,
  sendPushToAll,
} from '../pushNotifications.js';
import type { WhisperTracker } from '../whisper.js';
import { pendingApprovals } from './pendingApprovals.js';
import { registerVoteHandlers } from './storytellerVote.js';

type PlayerNamespace = Namespace<ClientToServerEvents, ServerToClientEvents>;
type StorytellerNamespace = Namespace<
  StorytellerToServerEvents,
  ServerToStorytellerEvents
>;

function getNightOrder(day: number, editionId?: string): string[] {
  if (editionId) {
    return getNightOrderForEdition(editionId, day);
  }
  return day <= 1 ? FIRST_NIGHT_ORDER : OTHER_NIGHT_ORDER;
}

function emitDeliveredFeedbackRecord(
  game: GameManager,
  storytellerIo: StorytellerNamespace,
  data: {
    player: Player;
    roleId: string | null;
    feedback: NightFeedbackPayload;
    source: DeliveredFeedbackSource;
  },
): void {
  const role = data.roleId ? getRoleById(data.roleId) : null;
  storytellerIo.emit('night:feedbackSent', {
    playerId: data.player.id,
    playerName: data.player.name,
    roleId: data.roleId,
    roleName: role?.name ?? data.roleId ?? '정보',
    day: game.getState().day,
    timestamp: Date.now(),
    feedback: data.feedback,
    source: data.source,
  });
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
 * 게임에 배정된 역할들의 에디션에 속하는 역할만 후보로 반환합니다.
 */
function getNotInPlayGoodRoles(game: GameManager) {
  const state = game.getState();
  const assignedRoles = state.players
    .map((p) => p.role)
    .filter((r): r is Role => !!r);
  const assignedRoleIds = new Set(
    state.players.flatMap((p) => [p.role?.id, p.drunkAs]).filter(Boolean),
  );
  const activeEditions = new Set(assignedRoles.map((r) => r.edition));
  return ALL_ROLES.filter(
    (r) =>
      (r.team === 'townsfolk' || r.team === 'outsider') &&
      !assignedRoleIds.has(r.id) &&
      activeEditions.has(r.edition),
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

function emitDeathTriggers(
  player: Player | undefined,
  storytellerIo: StorytellerNamespace,
  options: { isNight: boolean },
): void {
  if (!player?.role) return;
  if (player.role.id === 'sweetheart') {
    storytellerIo.emit('sweetheart:died', {
      sweetheartName: player.name,
    });
  }
  if (player.role.id === 'mayor' && options.isNight) {
    storytellerIo.emit('mayor:nightDeath', {
      mayorId: player.id,
      mayorName: player.name,
    });
  }
  if (player.role.id === 'barber') {
    storytellerIo.emit('barber:died', {
      barberName: player.name,
    });
  }
  if (player.role.id === 'klutz') {
    storytellerIo.emit('klutz:died', {
      klutzId: player.id,
      klutzName: player.name,
    });
  }
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
  return game
    .getState()
    .players.map(({ id, name, isAlive, deadVoteUsed, isTraveller, role }) => ({
      id,
      name,
      isAlive,
      deadVoteUsed,
      ...(isTraveller && { isTraveller }),
      ...(isTraveller && role?.id && { travellerRoleId: role.id }),
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

    socket.on('game:unassignAllRoles', () => {
      game.unassignAllRoles();
      // 플레이어에게 역할 해제 알림
      for (const player of game.getState().players) {
        if (!player.isTraveller) {
          playerIo.to(player.id).emit('role:assign', {
            roleId: '',
            roleName: '',
          });
        }
      }
      storytellerIo.emit('game:state', game.getStorytellerState());
    });

    socket.on('game:restart', (callback) => {
      const newId = game.restart();
      // 플레이어 유지이므로 푸시 토큰은 유지 (clearPushTokens 호출하지 않음)
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
      // 에디션 자동 감지 (역할 기반)
      game.detectEdition();
      // 악한 팀 정보 전송 (블러프 포함)
      sendEvilInfo(playerIo, game, game.getPreselectedBluffIds());
      game.clearPreselectedBluffIds();

      const state = game.getState();
      playerIo.emit('game:phase', 'night');
      const order = getNightOrder(state.day, game.getEditionId());
      const players = getPlayerInfoList(game);
      game.setNightProgress(null, order);
      playerIo.emit('night:activeRole', { roleId: null, order, players });
      storytellerIo.emit('game:state', game.getStorytellerState());
      callback({ success: true });
    });

    socket.on('game:setPhase', (phase, options) => {
      // 밤 전환 시 → 최다 투표 후보 처형 실행
      if (phase === 'night') {
        const candidate = game.getExecutionCandidate();
        if (candidate) {
          if (options?.skipExecution) {
            game.markExecution();
          } else {
            const candidatePlayer = game.getPlayer(candidate.playerId);
            game.kill(candidate.playerId);
            game.markExecution();
            const killedPlayer = game.getPlayer(candidate.playerId);
            emitDeathTriggers(candidatePlayer, storytellerIo, {
              isNight: false,
            });
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
            const winResult = game.checkWinCondition(
              executedRoleId,
              candidate.playerId,
            );
            if (winResult) {
              winResult.cause = 'execution';
              playerIo.emit('game:end', winResult);
              playerIo.emit('game:phase', 'ended');
              storytellerIo.emit('game:end', winResult);
              storytellerIo.emit('game:state', game.getStorytellerState());
              return;
            }
            emitPromotionIfAny(game, playerIo, storytellerIo);
            const butcher = game.getButcherExtraNominator();
            if (butcher) {
              game.consumeButcherExtraNominationWindow();
              game.returnToNomination();
              playerIo.emit('game:phase', 'day');
              playerIo.emit('day:subPhase', 'nomination');
              storytellerIo.emit('butcher:extraNomination', {
                butcherId: butcher.id,
                butcherName: butcher.name,
              });
              storytellerIo.emit('game:state', game.getStorytellerState());
              return;
            }
          }
        }

        // S&V: 보르톡스 - 처형 없는 날 → 악 팀 승리
        if (!candidate && game.hasVortox() && game.getState().day > 1) {
          const result = game.checkVortoxNoExecutionWin();
          if (result) {
            playerIo.emit('game:end', result);
            playerIo.emit('game:phase', 'ended');
            storytellerIo.emit('game:end', result);
            storytellerIo.emit('game:state', game.getStorytellerState());
            return;
          }
        }
      }

      game.setPhase(phase);
      playerIo.emit('game:phase', phase);
      if (phase === 'night') {
        const state = game.getState();
        const order = getNightOrder(state.day, game.getEditionId());
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
      const prevSubPhase = game.getState().daySubPhase;
      game.setDaySubPhase(subPhase);
      playerIo.emit('day:subPhase', subPhase);
      storytellerIo.emit('game:state', game.getStorytellerState());

      const settings = game.getSettings();

      if (subPhase === 'whisper') {
        if (settings.whisperClockSeconds > 0) {
          const durationMs = settings.whisperClockSeconds * 1000;
          playerIo.emit('whisper:clockStart', { durationMs });
          storytellerIo.emit('whisper:clockStart', { durationMs });
        }
      }

      if (subPhase === 'discussion') {
        game.clearNominationTimer();
        if (settings.discussionClockSeconds > 0) {
          const durationMs = settings.discussionClockSeconds * 1000;
          playerIo.emit('discussion:clockStart', { durationMs });
          storytellerIo.emit('discussion:clockStart', { durationMs });
        }
      }

      if (subPhase === 'nomination') {
        // nomination으로 돌아온 경우: 타이머 재개
        if (
          prevSubPhase === 'defense' &&
          game.getNominationRemainingMs() !== null
        ) {
          const remainingMs = game.resumeNominationTimer();
          if (remainingMs !== null && remainingMs > 0) {
            playerIo.emit('nomination:clockResume', { remainingMs });
            storytellerIo.emit('nomination:clockResume', { remainingMs });
          }
        } else if (settings.nominationClockSeconds > 0) {
          // 새로운 지목 페이즈 시작
          const durationMs = settings.nominationClockSeconds * 1000;
          game.startNominationTimer(durationMs);
          playerIo.emit('nomination:clockStart', { durationMs });
          storytellerIo.emit('nomination:clockStart', { durationMs });
        }
      }

      // defense/vote 진입 시 지목 타이머 일시정지
      if (subPhase === 'defense') {
        if (game.getNominationRemainingMs() !== null) {
          game.pauseNominationTimer();
          playerIo.emit('nomination:clockPause');
          storytellerIo.emit('nomination:clockPause');
        }
        if (settings.defenseClockSeconds > 0) {
          const durationMs = settings.defenseClockSeconds * 1000;
          playerIo.emit('defense:clockStart', { durationMs });
          storytellerIo.emit('defense:clockStart', { durationMs });
        }
      }
    });

    socket.on('night:sendFeedback', ({ playerId, feedback }) => {
      // 백치천재 정보는 정보 노출 순서로 참/거짓이 추론되지 않도록 50% 확률로 swap
      const deliveredFeedback =
        feedback.type === 'savant_info' && Math.random() < 0.5
          ? {
              type: 'savant_info' as const,
              info1: feedback.info2,
              info2: feedback.info1,
            }
          : feedback;
      playerIo
        .to(playerId)
        .emit('night:feedback', { feedback: deliveredFeedback });
      console.log(`Feedback -> ${playerId}: ${JSON.stringify(feedback)}`);
      const targetPlayer = game
        .getState()
        .players.find((player) => player.id === playerId);
      if (targetPlayer) {
        emitDeliveredFeedbackRecord(game, storytellerIo, {
          player: targetPlayer,
          roleId: game.getNightProgress().activeRoleId,
          feedback: deliveredFeedback,
          source: 'manual',
        });
      }

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
      const order = getNightOrder(state.day, game.getEditionId());
      const players = getPlayerInfoList(game);
      game.setNightProgress(roleId, order);
      playerIo.emit('night:activeRole', { roleId, order, players });

      // 대상 플레이어 수집 → 셔플 → 첫 번째만 wakeUp, 나머지는 큐
      game.clearNightWakeUpQueue();
      if (roleId) {
        const actionDef = NIGHT_ACTIONS[roleId];
        const isOnlyWhenDead = actionDef?.onlyWhenDead === true;

        // 실제 역할 + 주정뱅이(drunkAs) + 철학자(philosopherGrantedRole) 모두 수집.
        // 철학자가 활성화될 때(roleId === 'philosopher')도 본인 포함되어야 하므로 그대로 매치
        const baseCandidates = state.players.filter((p) => {
          const roleMatches =
            p.role?.id === roleId ||
            (p.role?.id === 'drunk' && p.drunkAs === roleId) ||
            (p.role?.id === 'philosopher' &&
              p.philosopherGrantedRole === roleId);
          if (!roleMatches) return false;
          return isOnlyWhenDead
            ? !p.isAlive && game.hasPendingNightKill(p.id)
            : p.isAlive ||
                p.statuses.includes('zombuul_registers_dead') ||
                p.statuses.includes('vigormortis_retained') ||
                p.statuses.includes('bone_collector_ability');
        });
        const candidates = baseCandidates.flatMap((p) =>
          !isOnlyWhenDead && p.statuses.includes('barista_acts_twice')
            ? [p, p]
            : [p],
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
        if (shouldAutoSendSpyGrimoire(spyPlayer)) {
          const feedback = buildTrueGrimoireFeedback(state.players);
          playerIo.to(spyPlayer.id).emit('night:feedback', {
            feedback,
          });
          emitDeliveredFeedbackRecord(game, storytellerIo, {
            player: spyPlayer,
            roleId,
            feedback,
            source: 'auto',
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
      storytellerIo.emit('game:state', game.getStorytellerState());
      playerIo.emit('game:state', game.getState());
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
      // 여행자는 역할 배분에서 제외
      const regularPlayers = state.players.filter((p) => !p.isTraveller);
      const playerIds = regularPlayers.map((p) => p.id);
      // 블러프 역할은 배분 대상에서 제외
      const excludedRoleIds = [
        ...(options.excludedRoleIds ?? []),
        ...(options.bluffRoleIds ?? []),
      ];
      const result = distributeRoles(playerIds, {
        ...options,
        excludedRoleIds,
      });
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
      // 블러프 사전 선택 저장 (게임 시작 시 sendEvilInfo에서 사용)
      if (options.bluffRoleIds && options.bluffRoleIds.length > 0) {
        game.setPreselectedBluffIds(options.bluffRoleIds);
        const resolved = resolveBluffRoles(game, options.bluffRoleIds);
        game.setBluffRoles(resolved);
      }
      storytellerIo.emit('game:state', game.getStorytellerState());
      callback({ success: true });
    });

    socket.on(
      'game:assignRole',
      ({ playerId, roleId, drunkAs, bluffRoleIds }) => {
        // 이미 다른 플레이어가 같은 역할을 갖고 있으면 스왑
        const state = game.getState();
        const currentPlayer = state.players.find((p) => p.id === playerId);
        const existingOwner = state.players.find(
          (p) => p.id !== playerId && p.role?.id === roleId,
        );

        // 여행자에게 일반 역할을 배정하면 일반 플레이어로 전환
        if (currentPlayer?.isTraveller) {
          currentPlayer.isTraveller = false;
          currentPlayer.travellerAlignment = undefined;
        }

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
        // 악마 역할 배정 시 블러프 ID 저장
        const assignedRole = getRoleById(roleId);
        if (assignedRole?.team === 'demon' && bluffRoleIds) {
          if (bluffRoleIds.length > 0) {
            // 이야기꾼이 직접 선택 → 즉시 resolve하여 bluffRoles에 저장
            game.setPreselectedBluffIds(bluffRoleIds);
            const resolved = resolveBluffRoles(game, bluffRoleIds);
            game.setBluffRoles(resolved);
          } else {
            // 랜덤 선택 → bluffRoles 초기화 (게임 시작 시 resolve)
            game.setPreselectedBluffIds([]);
            game.setBluffRoles([]);
          }
        }

        // 에디션 자동 감지 (역할 기반)
        game.detectEdition();

        // 모든 플레이어에게 역할이 배정되면 점쟁이 Red Herring 자동 지정
        const updatedState = game.getState();
        if (updatedState.players.every((p) => p.role)) {
          game.assignFortuneTellerRedHerring();
        }
        storytellerIo.emit('game:state', game.getStorytellerState());
      },
    );

    socket.on('game:kill', (playerId) => {
      const killedPlayer = game.getPlayer(playerId);
      const isNight = game.getState().phase === 'night';

      // 임프 자해 감지: 사망 처리 전에 체크
      const isImpSelfKill = killedPlayer?.role?.id === 'imp' && isNight;

      game.kill(playerId);

      // 임프 자해 → 하수인 승계 예약 (낮 전환 시 실행)
      if (isImpSelfKill) {
        game.handleImpSelfKill(playerId);
      }

      storytellerIo.emit('game:state', game.getStorytellerState());

      emitDeathTriggers(killedPlayer, storytellerIo, { isNight });

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

    // ── 여행자(Traveller) 관리 ──

    // 게임 중 참가 승인
    socket.on('traveller:approve', ({ socketId, playerName }) => {
      const pending = pendingApprovals.get(socketId);
      if (!pending) return;
      pendingApprovals.delete(socketId);

      const traveller = game.addTraveller(playerName);
      if (!traveller) {
        pending.socket.emit('traveller:rejected', {
          error: '참가할 수 없습니다',
        });
        return;
      }
      pending.socket.join(traveller.id);
      pending.socket.emit('traveller:approved', { playerId: traveller.id });
      pending.socket.emit('game:settings', game.getSettings());
      // 현재 게임 상태 동기화
      const state = game.getState();
      pending.socket.emit('game:state', state);
      pending.socket.emit('game:phase', state.phase);
      if (state.daySubPhase) {
        pending.socket.emit('day:subPhase', state.daySubPhase);
      }
      const players = getPlayerInfoList(game);
      pending.socket.emit('game:playerUpdate', traveller);
      // 좌석 배치 동기화
      pending.socket.emit('vote:order', {
        nomineeId: '',
        order: players,
        fullOrder: players,
      });
      storytellerIo.emit('game:state', game.getStorytellerState());
      console.log(`Traveller approved: ${playerName}`);
    });

    // 게임 중 참가 거절
    socket.on('traveller:reject', ({ socketId }) => {
      const pending = pendingApprovals.get(socketId);
      if (!pending) return;
      pendingApprovals.delete(socketId);
      pending.socket.emit('traveller:rejected', {
        error: '이야기꾼이 참가를 거절했습니다',
      });
    });

    socket.on('traveller:add', ({ playerId, roleId, alignment }, callback) => {
      const player = game.getPlayer(playerId);
      if (!player) {
        callback({ success: false, error: '플레이어를 찾을 수 없습니다' });
        return;
      }
      // 일반 플레이어도 여행자로 전환 가능
      if (!player.isTraveller) {
        player.isTraveller = true;
        // 기존 역할이 있으면 해제
        if (player.role) {
          game.unassignRole(playerId);
        }
      }
      const success = game.assignTravellerRole(playerId, roleId, alignment);
      if (!success) {
        callback({ success: false, error: '여행자 역할 배정에 실패했습니다' });
        return;
      }
      const role = getRoleById(roleId);
      // 여행자 본인에게 역할 알림
      playerIo.to(playerId).emit('role:assign', {
        roleId,
        roleName: role?.name ?? roleId,
      });
      // 악한 여행자에게 악마 및 하수인 정보 전송
      if (alignment === 'evil') {
        const state = game.getState();
        const demons = state.players.filter((p) => p.role?.team === 'demon');
        if (demons.length > 0) {
          playerIo.to(playerId).emit('evil:info', {
            demonName: demons[0].name,
          });
        }
      }
      // 전체 알림
      playerIo.emit('traveller:joined', {
        playerId,
        playerName: player.name,
        roleId,
        roleName: role?.name ?? roleId,
      });
      storytellerIo.emit('traveller:joined', {
        playerId,
        playerName: player.name,
        roleId,
        roleName: role?.name ?? roleId,
      });
      playerIo.emit('game:state', game.getState());
      storytellerIo.emit('game:state', game.getStorytellerState());
      callback({ success: true });
      console.log(
        `Traveller added: ${player.name} as ${role?.name ?? roleId} (${alignment})`,
      );
    });

    socket.on('traveller:exile', (playerId, callback) => {
      const player = game.getPlayer(playerId);
      if (!player) {
        callback({ success: false, error: '플레이어를 찾을 수 없습니다' });
        return;
      }
      if (!player.isTraveller) {
        callback({ success: false, error: '여행자만 추방할 수 있습니다' });
        return;
      }
      if (!player.isAlive) {
        callback({ success: false, error: '이미 사망한 여행자입니다' });
        return;
      }
      game.exileTraveller(playerId);
      const roleName = player.role?.name ?? '???';
      // 추방 알림 (처형이 아닌 추방)
      playerIo.emit('traveller:exiled', {
        playerId,
        playerName: player.name,
        roleName,
      });
      storytellerIo.emit('traveller:exiled', {
        playerId,
        playerName: player.name,
        roleName,
      });
      playerIo.emit('game:playerUpdate', player);
      storytellerIo.emit('game:state', game.getStorytellerState());
      callback({ success: true });
      console.log(`Traveller exiled: ${player.name} (${roleName})`);
    });

    // ── 추방 투표 강제 종료 ──

    socket.on('exile:forceClose', ({ exiled }, callback) => {
      if (!game.isExileVoteInProgress()) {
        if (typeof callback === 'function')
          callback({ success: false, error: '추방 투표가 진행 중이 아닙니다' });
        return;
      }

      const closeResult = game.closeExileVote(exiled);
      if (!closeResult) {
        if (typeof callback === 'function')
          callback({ success: false, error: '추방 투표 종료 실패' });
        return;
      }

      const target = game.getPlayer(closeResult.targetId);
      const resultData = {
        targetId: closeResult.targetId,
        targetName: target?.name ?? closeResult.targetId,
        targetRoleName: target?.role?.name ?? '???',
        exiled: closeResult.exiled,
        guiltyCount: closeResult.guiltyCount,
        totalPlayers: closeResult.totalPlayers,
      };
      playerIo.emit('exile:result', resultData);
      storytellerIo.emit('exile:result', resultData);

      if (closeResult.exiled) {
        playerIo.emit('traveller:exiled', {
          playerId: closeResult.targetId,
          playerName: target?.name ?? closeResult.targetId,
          roleName: target?.role?.name ?? '???',
        });
        storytellerIo.emit('traveller:exiled', {
          playerId: closeResult.targetId,
          playerName: target?.name ?? closeResult.targetId,
          roleName: target?.role?.name ?? '???',
        });
        if (target) playerIo.emit('game:playerUpdate', target);
        storytellerIo.emit('game:state', game.getStorytellerState());
      }

      if (typeof callback === 'function') callback({ success: true });
      console.log(
        `Exile force-closed by storyteller: ${target?.name} - ${closeResult.exiled ? 'exiled' : 'survived'}`,
      );
    });

    socket.on(
      'boneCollector:restore',
      ({ boneCollectorId, targetPlayerId }) => {
        const success = game.restoreBoneCollectorAbility(
          boneCollectorId,
          targetPlayerId,
        );
        if (!success) return;
        const collector = game.getPlayer(boneCollectorId);
        const target = game.getPlayer(targetPlayerId);
        if (collector) playerIo.emit('game:playerUpdate', collector);
        if (target) playerIo.emit('game:playerUpdate', target);
        storytellerIo.emit('game:state', game.getStorytellerState());
      },
    );

    socket.on('barista:apply', ({ targetPlayerId, effect }) => {
      const success = game.applyBaristaEffect(targetPlayerId, effect);
      if (!success) return;
      const target = game.getPlayer(targetPlayerId);
      if (target) {
        playerIo.to(target.id).emit('night:feedback', {
          feedback: {
            type: 'players',
            playerNames: [target.name],
            message:
              effect === 'sober_healthy'
                ? '바리스타 효과: 맑은 정신이고 건강합니다.'
                : '바리스타 효과: 능력이 두 번 작동합니다.',
          },
        });
        playerIo.emit('game:playerUpdate', target);
      }
      storytellerIo.emit('game:state', game.getStorytellerState());
    });

    // ── Sects & Violets 전용 핸들러 ──

    socket.on('witch:confirmCurseDeath', ({ nominatorId, kill }) => {
      if (!kill) return;
      const nominator = game.getPlayer(nominatorId);
      if (!nominator) return;
      game.kill(nominatorId);
      emitDeathTriggers(nominator, storytellerIo, { isNight: false });
      playerIo.emit('witch:curseDeath', {
        nominatorId,
        nominatorName: nominator.name,
      });
      playerIo.emit('execution:announced', {
        executedId: nominatorId,
        executedName: nominator.name,
        reason: 'witch_curse',
        detail: `${nominator.name}이(가) 마녀의 저주로 사망했습니다`,
      });
      storytellerIo.emit('execution:announced', {
        executedId: nominatorId,
        executedName: nominator.name,
        reason: 'witch_curse',
        detail: `${nominator.name}이(가) 마녀의 저주로 사망했습니다`,
      });
      const killedPlayer = game.getPlayer(nominatorId);
      if (killedPlayer) {
        playerIo.emit('game:playerUpdate', killedPlayer);
      }
      storytellerIo.emit('game:state', game.getStorytellerState());

      const winResult = game.checkWinCondition();
      if (winResult) {
        winResult.cause = 'witch_curse';
        playerIo.emit('game:end', winResult);
        playerIo.emit('game:phase', 'ended');
        storytellerIo.emit('game:end', winResult);
        storytellerIo.emit('game:state', game.getStorytellerState());
      }
    });

    socket.on('barber:swapRoles', ({ playerId1, playerId2 }) => {
      game.swapPlayerRoles(playerId1, playerId2);
      // 역할이 바뀐 플레이어에게 새 역할 알림
      const p1 = game.getPlayer(playerId1);
      const p2 = game.getPlayer(playerId2);
      if (p1?.role) {
        playerIo.to(playerId1).emit('role:assign', {
          roleId: p1.role.id,
          roleName: p1.role.name,
        });
      }
      if (p2?.role) {
        playerIo.to(playerId2).emit('role:assign', {
          roleId: p2.role.id,
          roleName: p2.role.name,
        });
      }
      storytellerIo.emit('game:state', game.getStorytellerState());
    });

    socket.on('klutz:choose', ({ chosenPlayerId }) => {
      const chosen = game.getPlayer(chosenPlayerId);
      if (!chosen) return;
      const isEvil = game.getPlayerAlignment(chosenPlayerId) === 'evil';
      if (isEvil) {
        // 얼뜨기가 악한 플레이어를 선택 → 악 팀 승리
        const winResult = game.checkWinCondition();
        if (!winResult) {
          // 강제 종료
          game.endGame();
          const state = game.getState();
          const result = {
            winningTeam: 'evil' as const,
            reason: '얼뜨기가 악한 플레이어를 선택했습니다',
            cause: 'klutz' as const,
            players: state.players.map((p) => ({
              id: p.id,
              name: p.name,
              role: p.role ?? {
                id: 'unknown',
                name: '???',
                team: 'townsfolk' as const,
                ability: '',
                edition: '',
              },
              isAlive: p.isAlive,
              team: (p.role?.team ?? 'townsfolk') as 'townsfolk',
            })),
          };
          playerIo.emit('game:end', result);
          playerIo.emit('game:phase', 'ended');
          storytellerIo.emit('game:end', result);
          storytellerIo.emit('game:state', game.getStorytellerState());
        }
      }
      // 선한 플레이어 선택 → 게임 계속
    });

    socket.on('fangGu:confirmJump', ({ oldDemonId, newDemonId }) => {
      const result = game.handleFangGuJump(oldDemonId, newDemonId);
      if (!result) return;

      // 새 악마에게 역할 알림
      const fangGuRole = getRoleById('fang_gu');
      if (fangGuRole) {
        playerIo.to(newDemonId).emit('role:assign', {
          roleId: fangGuRole.id,
          roleName: fangGuRole.name,
        });
      }
      game.addPendingNightKill(oldDemonId);
      storytellerIo.emit('fangGu:jumped', {
        oldDemonId,
        oldDemonName: result.oldDemon.name,
        newDemonId,
        newDemonName: result.newDemon.name,
      });
      storytellerIo.emit('game:state', game.getStorytellerState());
    });

    socket.on('snakeCharmer:swap', ({ snakeCharmerId, demonId }) => {
      const result = game.handleSnakeCharmerSwap(snakeCharmerId, demonId);
      if (!result) return;

      if (result.oldSnakeCharmer.role) {
        playerIo.to(snakeCharmerId).emit('role:assign', {
          roleId: result.oldSnakeCharmer.role.id,
          roleName: result.oldSnakeCharmer.role.name,
        });
      }
      if (result.oldDemon.role) {
        playerIo.to(demonId).emit('role:assign', {
          roleId: result.oldDemon.role.id,
          roleName: result.oldDemon.role.name,
        });
      }

      storytellerIo.emit('snakeCharmer:swapped', {
        snakeCharmerId,
        snakeCharmerName: result.oldSnakeCharmer.name,
        demonId,
        demonName: result.oldDemon.name,
      });
      storytellerIo.emit('game:state', game.getStorytellerState());
    });

    socket.on(
      'vigormortis:killMinion',
      ({ vigormortisId, minionId, poisonedNeighborId }) => {
        const result = game.handleVigormortisMinionKill(
          vigormortisId,
          minionId,
          poisonedNeighborId,
        );
        if (!result) return;

        game.addPendingNightKill(minionId);
        storytellerIo.emit('game:state', game.getStorytellerState());
      },
    );

    socket.on(
      'pitHag:changeRole',
      ({ pitHagId, targetPlayerId, newRoleId }) => {
        const success = game.changePlayerRole(
          targetPlayerId,
          newRoleId,
          pitHagId,
        );
        if (!success) return;
        const player = game.getPlayer(targetPlayerId);
        if (player?.role) {
          playerIo.to(targetPlayerId).emit('role:assign', {
            roleId: player.role.id,
            roleName: player.role.name,
          });
        }
        // 에디션 재감지 (새로운 역할이 다른 에디션일 수 있음)
        game.detectEdition();
        storytellerIo.emit('game:state', game.getStorytellerState());
      },
    );

    socket.on(
      'evilTwin:assignGoodTwin',
      ({ evilTwinPlayerId, goodTwinPlayerId }) => {
        game.setEvilTwinPair(evilTwinPlayerId, goodTwinPlayerId);
        storytellerIo.emit('game:state', game.getStorytellerState());
      },
    );

    socket.on('player:kick', (playerId, callback) => {
      const player = game.getPlayer(playerId);
      if (!player) {
        callback({ success: false, error: '플레이어를 찾을 수 없습니다' });
        return;
      }
      const playerName = player.name;
      game.removePlayer(playerId);

      // 강퇴 대상에게 알림 후 방에서 제거
      playerIo.to(playerId).emit('player:kicked');
      playerIo.in(playerId).socketsLeave(playerId);

      // 나머지 플레이어와 이야기꾼에게 알림
      playerIo.emit('player:left', { playerId, playerName });
      storytellerIo.emit('player:left', { playerId, playerName });
      storytellerIo.emit('game:state', game.getStorytellerState());
      callback({ success: true });
      console.log(`Player kicked: ${playerName}`);
    });

    socket.on('disconnect', () => {
      console.log('Storyteller disconnected');
    });
  });
}
