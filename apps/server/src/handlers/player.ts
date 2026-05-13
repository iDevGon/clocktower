import {
  type ClientToServerEvents,
  type EvilInfoPayload,
  getRoleById,
  hasPoisonStatus,
  type Player,
  type ServerToClientEvents,
  type ServerToStorytellerEvents,
  type StorytellerToServerEvents,
  type WhisperMessage,
} from '@clocktower/shared/logic';
import type { Namespace } from 'socket.io';
import type { GameManager } from '../game.js';
import { registerPushToken } from '../pushNotifications.js';
import { WhisperTracker } from '../whisper.js';
import { pendingApprovals } from './pendingApprovals.js';
import { startClockwiseVote } from './storyteller.js';

type PlayerNamespace = Namespace<ClientToServerEvents, ServerToClientEvents>;
type StorytellerNamespace = Namespace<
  StorytellerToServerEvents,
  ServerToStorytellerEvents
>;

function getPlayerIdFromSocket(socket: {
  id: string;
  rooms: Set<string>;
}): string | undefined {
  const rooms = Array.from(socket.rooms);
  return rooms.find((r) => r !== socket.id);
}

function hasEffectiveRole(
  player: {
    role?: { id: string };
    drunkAs?: string;
    philosopherGrantedRole?: string;
  },
  roleId: string,
): boolean {
  return (
    player.role?.id === roleId ||
    (player.role?.id === 'drunk' && player.drunkAs === roleId) ||
    (player.role?.id === 'philosopher' &&
      player.philosopherGrantedRole === roleId)
  );
}

function isPoisonedOrDrunkStatus(statuses: Player['statuses']): boolean {
  return hasPoisonStatus(statuses) || statuses.includes('drunk');
}

function toPlayerInfo(player: Player) {
  return {
    id: player.id,
    name: player.name,
    isAlive: player.isAlive,
    deadVoteUsed: player.deadVoteUsed,
    isTraveller: player.isTraveller,
    travellerRoleId: player.isTraveller ? player.role?.id : undefined,
  };
}

function getRejoinNightCount(state: { phase: string; day: number }): number {
  if (state.phase === 'night') return state.day;
  return Math.max(0, state.day - 1);
}

function getEvilInfoForPlayer(
  game: GameManager,
  player: Player,
): EvilInfoPayload | null {
  const role = player.role;
  if (!role) return null;

  const state = game.getState();
  const demons = state.players.filter((p) => p.role?.team === 'demon');
  const minions = state.players.filter((p) => p.role?.team === 'minion');

  if (role.team === 'demon') {
    const bluffRoles = game.getBluffRoles();
    return {
      minionNames: minions.map((m) => m.name),
      ...(bluffRoles.length > 0 ? { bluffRoles } : {}),
    };
  }

  if (role.team === 'minion') {
    return {
      demonName: demons[0]?.name,
      otherMinionNames: minions
        .filter((m) => m.id !== player.id)
        .map((m) => m.name),
    };
  }

  if (player.isTraveller && player.travellerAlignment === 'evil') {
    return { demonName: demons[0]?.name };
  }

  return null;
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

export function registerPlayerHandlers(
  storytellerIo: StorytellerNamespace,
  playerIo: PlayerNamespace,
  game: GameManager,
  whisperTracker: WhisperTracker,
): void {
  playerIo.on('connection', (socket) => {
    socket.on('game:join', ({ playerName }, callback) => {
      const state = game.getState();
      if (!state.id) {
        callback({ success: false, error: '게임이 생성되지 않았습니다' });
        return;
      }
      // 게임이 이미 시작된 경우 이야기꾼에게 승인 요청
      if (state.started) {
        const trimmedName = playerName?.trim();
        if (!trimmedName || trimmedName.length > 20) {
          callback({ success: false, error: '유효하지 않은 이름입니다' });
          return;
        }
        // 즉시 "대기 중" 응답을 보내고, 승인/거절은 별도 이벤트로 전달
        callback({
          success: false,
          error: '이야기꾼의 승인을 기다리고 있습니다...',
          pending: true,
        });
        pendingApprovals.set(socket.id, {
          playerName: trimmedName,
          socket,
        });
        storytellerIo.emit('traveller:pendingApproval', {
          socketId: socket.id,
          playerName: trimmedName,
        });
        console.log(`Traveller approval requested: ${trimmedName}`);
        return;
      }
      const player = game.addPlayer(playerName);
      if (!player) {
        callback({ success: false, error: '참가할 수 없습니다' });
        return;
      }
      socket.join(player.id);
      callback({ success: true, playerId: player.id });
      // 설정 전송
      socket.emit('game:settings', game.getSettings());
      storytellerIo.emit('game:state', game.getStorytellerState());
      console.log(`Player joined: ${playerName}`);
    });

    // 여행자로 게임 참가 (게임 진행 중에도 가능)
    socket.on('game:joinAsTraveller', ({ playerName }, callback) => {
      const state = game.getState();
      if (!state.id) {
        callback({ success: false, error: '게임이 생성되지 않았습니다' });
        return;
      }
      const trimmedName = playerName?.trim();
      if (!trimmedName || trimmedName.length > 20) {
        callback({ success: false, error: '유효하지 않은 이름입니다' });
        return;
      }
      const player = game.addTraveller(trimmedName);
      if (!player) {
        callback({ success: false, error: '참가할 수 없습니다' });
        return;
      }
      socket.join(player.id);
      callback({ success: true, playerId: player.id });
      socket.emit('game:settings', game.getSettings());
      // 이야기꾼에게 알림 (역할 배정을 위해)
      storytellerIo.emit('game:state', game.getStorytellerState());
      playerIo.emit('game:state', game.getState());
      console.log(`Traveller joined lobby: ${playerName}`);
    });

    socket.on('game:rejoin', ({ playerId }, callback) => {
      const state = game.getState();
      if (!state.id) {
        callback({ success: false });
        return;
      }
      const player = game.getPlayer(playerId);
      if (!player) {
        callback({ success: false });
        return;
      }
      socket.join(player.id);
      // 주정뱅이에게는 가짜 역할 ID를 전송
      const roleIdForPlayer =
        player.role?.id === 'drunk' && player.drunkAs
          ? player.drunkAs
          : player.role?.id;

      const gamePlayers = state.players.map(toPlayerInfo);

      // 밤 페이즈일 때 진행 상태 포함
      let nightProgress:
        | {
            activeRoleId: string | null;
            order: string[];
            players: ReturnType<typeof toPlayerInfo>[];
          }
        | undefined;
      if (state.phase === 'night') {
        const np = game.getNightProgress();
        nightProgress = { ...np, players: gamePlayers };
      }

      // 집사의 주인 이름 조회
      const effectiveRoleId =
        player.role?.id === 'drunk' && player.drunkAs
          ? player.drunkAs
          : player.role?.id;
      let butlerMasterName: string | undefined;
      if (effectiveRoleId === 'butler') {
        const masterId = game.getButlerMaster(playerId);
        if (masterId) {
          const master = game.getPlayer(masterId);
          if (master) butlerMasterName = master.name;
        }
      }

      // 현재 지목/투표 진행 중인 경우 nomination 정보 포함
      let nomination:
        | {
            nominatorId: string;
            nomineeId: string;
            nominatorName: string;
            nomineeName: string;
          }
        | undefined;
      if (
        (state.daySubPhase === 'defense' || state.phase === 'vote') &&
        state.nominations.length > 0
      ) {
        const current = state.nominations[state.nominations.length - 1];
        const nominator = game.getPlayer(current.nominatorId);
        const nominee = game.getPlayer(current.nomineeId);
        nomination = {
          nominatorId: current.nominatorId,
          nomineeId: current.nomineeId,
          nominatorName: nominator?.name ?? current.nominatorId,
          nomineeName: nominee?.name ?? current.nomineeId,
        };
      }

      // 현재 처형 예정자 정보
      const execCandidate = game.getExecutionCandidate();
      let executionCandidate:
        | { playerId: string; playerName: string; guiltyVotes: number }
        | undefined;
      if (execCandidate) {
        const execPlayer = game.getPlayer(execCandidate.playerId);
        executionCandidate = {
          playerId: execCandidate.playerId,
          playerName: execPlayer?.name ?? execCandidate.playerId,
          guiltyVotes: execCandidate.guiltyVotes,
        };
      }

      callback({
        success: true,
        playerName: player.name,
        roleId: roleIdForPlayer,
        drunkAs: player.drunkAs ?? undefined,
        phase: state.phase,
        isAlive: player.isAlive,
        daySubPhase: state.daySubPhase,
        hasNominatedToday: player.hasNominatedToday,
        deadVoteUsed: player.deadVoteUsed,
        nightCount: getRejoinNightCount(state),
        nightProgress,
        gamePlayers,
        butlerMasterName,
        nomination,
        executionCandidate,
        evilInfo: getEvilInfoForPlayer(game, player),
      });
      // 설정 + 전체 상태 전송 (백그라운드 복귀 시 놓친 이벤트 보상)
      socket.emit('game:settings', state.settings);
      socket.emit('game:state', state);

      // 추방 투표 진행 중이면 상태 복원
      const exileVote = game.getExileVote();
      if (exileVote) {
        const proposer = game.getPlayer(exileVote.proposerId);
        const target = game.getPlayer(exileVote.targetId);
        socket.emit('exile:start', {
          proposerId: exileVote.proposerId,
          proposerName: proposer?.name ?? exileVote.proposerId,
          targetId: exileVote.targetId,
          targetName: target?.name ?? exileVote.targetId,
          targetRoleName: target?.role?.name ?? '???',
          totalPlayers: state.players.length,
        });
        socket.emit('exile:voteUpdate', {
          votes: exileVote.votes,
          guiltyCount: exileVote.guiltyCount,
          innocentCount: exileVote.innocentCount,
          totalPlayers: state.players.length,
        });
      }
      console.log(`Player rejoined: ${player.name}`);
    });

    socket.on('nominate:request', ({ nomineeId }, callback) => {
      const playerId = getPlayerIdFromSocket(socket);
      if (!playerId) {
        callback({ success: false, error: '플레이어를 찾을 수 없습니다' });
        return;
      }

      const state = game.getState();
      // 오프라인 투표 모드에서는 플레이어 지목 차단
      if (state.settings.votingMode === 'offline') {
        callback({ success: false, error: '투표는 오프라인으로 진행됩니다' });
        return;
      }
      if (state.phase !== 'day' || state.daySubPhase !== 'nomination') {
        callback({ success: false, error: '지금은 지목할 수 없습니다' });
        return;
      }

      // S&V: 마녀 저주 확인 (지명 전에 체크)
      const isWitchCursed = game.checkWitchCurse(playerId);

      const result = game.nominate(playerId, nomineeId);
      if (!result.success) {
        callback(result);
        return;
      }

      callback({ success: true });

      // S&V: 마녀 저주 발동 → 이야기꾼에게 확인 요청
      if (isWitchCursed) {
        const nominator = game.getPlayer(playerId);
        storytellerIo.emit('witch:curseDeath', {
          nominatorId: playerId,
          nominatorName: nominator?.name ?? playerId,
        });
      }

      // 성결자(Virgin) 트리거
      if (result.virginKill) {
        const virgin = game.getPlayer(nomineeId);
        const nominator = game.getPlayer(playerId);
        game.kill(result.virginKill);
        game.markExecution();
        emitDeathTriggers(nominator, storytellerIo, { isNight: false });
        playerIo.emit('virgin:triggered', {
          virginName: virgin?.name ?? nomineeId,
          nominatorName: nominator?.name ?? playerId,
          nominatorId: playerId,
        });
        storytellerIo.emit('virgin:triggered', {
          virginName: virgin?.name ?? nomineeId,
          nominatorName: nominator?.name ?? playerId,
          nominatorId: playerId,
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
        storytellerIo.emit('game:state', game.getStorytellerState());

        // 성결자 트리거 후 승리 조건 체크
        const winResult = game.checkWinCondition();
        if (winResult) {
          winResult.cause = 'virgin';
          playerIo.emit('game:end', winResult);
          playerIo.emit('game:phase', 'ended');
          storytellerIo.emit('game:end', winResult);
          storytellerIo.emit('game:state', game.getStorytellerState());
        }
        return;
      }

      // 변론 페이즈로 전환 (낮 페이즈 유지, 이야기꾼이 투표 시작을 제어)
      game.setDaySubPhase('defense');
      const nominator = game.getPlayer(playerId);
      const nominee = game.getPlayer(nomineeId);
      playerIo.emit('day:subPhase', 'defense');
      const voteStartData = {
        nominatorId: playerId,
        nomineeId,
        nominatorName: nominator?.name ?? playerId,
        nomineeName: nominee?.name ?? nomineeId,
      };
      playerIo.emit('vote:start', voteStartData);
      storytellerIo.emit('vote:start', voteStartData);
      storytellerIo.emit('game:state', game.getStorytellerState());
    });

    socket.on('vote:cast', (callback) => {
      const playerId = getPlayerIdFromSocket(socket);
      if (!playerId) return;

      const state = game.getState();
      if (state.settings.votingMode === 'offline') return;

      // 오프라인 모드가 아닌 비-시계방향 투표 시 즉시 확정 (항상 찬성)
      const result = game.castVote(playerId);
      if (result.success) {
        storytellerIo.emit('game:state', game.getStorytellerState());
      }
      if (typeof callback === 'function') callback(result);
    });

    socket.on('vote:preselect', ({ guilty }) => {
      const playerId = getPlayerIdFromSocket(socket);
      if (!playerId) return;

      // 이미 투표가 확정된 플레이어는 프리셀렉트 변경 불가
      const current = game.getState().nominations.at(-1);
      if (current && playerId in current.votes) return;

      // 유령 투표 제한: 이미 투표권을 사용한 유령은 찬성 프리셀렉트 불가
      if (guilty && game.isGhostVoteUsed(playerId)) return;

      // 집사 투표 제한: 찬성 프리셀렉트 시 주인이 투표/프리셀렉트하지 않았으면 거부
      if (guilty && game.isButlerRestricted(playerId)) return;

      game.preselectVote(playerId, guilty);
      playerIo.emit('vote:preselected', { playerId, guilty });
      storytellerIo.emit('vote:preselected', { playerId, guilty });
    });

    socket.on('night:action', ({ targets }) => {
      const playerId = getPlayerIdFromSocket(socket);
      if (playerId) {
        const player = game.getPlayer(playerId);
        if (player?.role) {
          // 밤 행동 타깃 기록 (임프 자해 감지용)
          game.recordNightAction(playerId, targets);

          // 행동 수행 시점의 효과적 역할 ID
          // - 주정뱅이: drunkAs (능력은 무효)
          // - 철학자: philosopherGrantedRole (실제 능력 보유)
          // - 그 외: 본 역할
          const effectiveRoleId =
            player.role.id === 'drunk' && player.drunkAs
              ? player.drunkAs
              : player.role.id === 'philosopher' &&
                  player.philosopherGrantedRole
                ? player.philosopherGrantedRole
                : player.role.id;

          // 집사(Butler) 주인 선택 저장 (철학자가 집사 능력 가진 경우 포함)
          if (effectiveRoleId === 'butler' && targets.length > 0) {
            game.setButlerMaster(playerId, targets[0]);
          }

          // 마녀(Witch) 저주 대상 저장 (철학자가 마녀 능력 가진 경우 포함)
          if (effectiveRoleId === 'witch' && targets.length > 0) {
            game.setWitchCursedTarget(targets[0]);
          }

          // 탕녀(Harlot): 선택 대상에게 동의 요청을 보내고, 결과는 대상 응답 후 이야기꾼이 처리
          if (effectiveRoleId === 'harlot' && targets.length > 0) {
            const request = game.requestHarlotConsent(playerId, targets[0]);
            if (request) {
              playerIo.to(request.target.id).emit('harlot:consentRequested', {
                harlotId: request.harlot.id,
                harlotName: request.harlot.name,
              });
            }
          }

          if (effectiveRoleId === 'pukka' && targets.length > 0) {
            game.resolvePukkaSelection(playerId, targets[0]);
            storytellerIo.emit('game:state', game.getStorytellerState());
            playerIo.emit('game:state', game.getState());
          }

          const reportRoleId = effectiveRoleId;
          // 점쟁이 판정: 선택된 2명 중 악마/Red Herring 포함 여부
          const fortuneTellerResult =
            reportRoleId === 'fortune_teller'
              ? game.judgeFortuneTeller(targets, playerId)
              : undefined;

          storytellerIo.emit('night:actionReceived', {
            playerId,
            playerName: player.name,
            roleId: reportRoleId,
            targets,
            fortuneTellerResult,
          });
          console.log(
            `Night action: ${player.name}(${player.role.name}) -> [${targets.join(', ')}]`,
          );
        }
      }
    });

    socket.on('harlot:respond', ({ harlotId, accepted }) => {
      const playerId = getPlayerIdFromSocket(socket);
      if (!playerId) return;

      const result = game.resolveHarlotConsent(playerId, harlotId, accepted);
      if (!result) return;

      const payload = {
        harlotId: result.harlot.id,
        harlotName: result.harlot.name,
        targetId: result.target.id,
        targetName: result.target.name,
        accepted: result.accepted,
        targetRoleName: result.targetRoleName,
        needsFalseInfo: result.needsFalseInfo,
      };
      storytellerIo.emit('harlot:consentResult', payload);
      playerIo.to(result.harlot.id).emit('harlot:consentResult', payload);
      playerIo.to(result.target.id).emit('harlot:consentResult', payload);
    });

    // 처단자(Slayer) 능력 사용
    socket.on('slayer:use', ({ targetId }, callback) => {
      const playerId = getPlayerIdFromSocket(socket);
      if (!playerId) {
        callback({ success: false, error: '플레이어를 찾을 수 없습니다' });
        return;
      }

      const player = game.getPlayer(playerId);
      if (!player) {
        callback({ success: false, error: '플레이어를 찾을 수 없습니다' });
        return;
      }

      const state = game.getState();
      if (state.phase !== 'day' && state.phase !== 'vote') {
        callback({ success: false, error: '낮에만 사용할 수 있습니다' });
        return;
      }

      // 누구나 처단자 선언 가능 (블러프). 실제 효과는 역할에 따라 결정
      const isSlayer = player.role?.id === 'slayer';
      const _isDrunkAsSlayer =
        player.role?.id === 'drunk' && player.drunkAs === 'slayer';

      if (game.isSlayerUsed(playerId)) {
        callback({
          success: false,
          error: '이미 처단자 능력을 사용했습니다',
        });
        return;
      }

      const target = game.getPlayer(targetId);
      if (!target || !target.isAlive) {
        callback({
          success: false,
          error: '대상 플레이어를 찾을 수 없습니다',
        });
        return;
      }

      game.markSlayerUsed(playerId);
      callback({ success: true });

      // 모든 플레이어와 이야기꾼에게 선언 알림
      playerIo.emit('slayer:declared', {
        slayerName: player.name,
        targetName: target.name,
        targetId,
      });
      storytellerIo.emit('slayer:declared', {
        slayerName: player.name,
        targetName: target.name,
        targetId,
      });

      // 실제 처단자이고 대상이 악마면 자동 사망 (취함/중독 상태면 무효)
      const killCondition =
        isSlayer &&
        !isPoisonedOrDrunkStatus(player.statuses) &&
        target.role?.team === 'demon';

      if (!killCondition) {
        // 능력이 효과 없음 (중독/주정뱅이/대상이 악마가 아님)
        playerIo.emit('slayer:noEffect', {
          slayerName: player.name,
          targetName: target.name,
        });
        storytellerIo.emit('slayer:noEffect', {
          slayerName: player.name,
          targetName: target.name,
        });

        // 투표 중 처단자 선언 → 시계 일시정지
        if (state.phase === 'vote') {
          const nomineeId = state.nominations.at(-1)?.nomineeId ?? '';
          game.pauseVoteClockForSlayer(nomineeId);
          playerIo.emit('vote:clockPause');
          storytellerIo.emit('vote:clockPause');
        }
        console.log(`Slayer: ${player.name} -> ${target.name}`);
        return;
      }

      game.kill(targetId);
      emitDeathTriggers(target, storytellerIo, {
        isNight: false,
      });
      const killedTarget = game.getPlayer(targetId);
      if (killedTarget) {
        playerIo.emit('execution:announced', {
          executedId: targetId,
          executedName: killedTarget.name,
          reason: 'slayer',
          detail: `${player.name}의 처단자 능력으로 ${killedTarget.name}이(가) 사망했습니다`,
        });
        storytellerIo.emit('execution:announced', {
          executedId: targetId,
          executedName: killedTarget.name,
          reason: 'slayer',
          detail: `${player.name}의 처단자 능력으로 ${killedTarget.name}이(가) 사망했습니다`,
        });
        playerIo.emit('game:playerUpdate', killedTarget);
      }
      storytellerIo.emit('game:state', game.getStorytellerState());

      const winResult = game.checkWinCondition();
      if (winResult) {
        winResult.cause = 'slayer';
        winResult.reason = `처단자 ${player.name}이(가) 악마를 처치했습니다`;
        playerIo.emit('game:end', winResult);
        playerIo.emit('game:phase', 'ended');
        storytellerIo.emit('game:end', winResult);
        storytellerIo.emit('game:state', game.getStorytellerState());
      }

      console.log(`Slayer: ${player.name} -> ${target.name}`);
    });

    // 처단자 선언 확인 (투표 일시정지 해제)
    socket.on('slayer:ack', () => {
      const playerId = getPlayerIdFromSocket(socket);
      if (!playerId) return;

      game.addSlayerAck(playerId);

      if (game.isAllSlayerAcked()) {
        playerIo.emit('slayer:allAcked');
        storytellerIo.emit('slayer:allAcked');

        // 투표 시계 재개
        const pausedNomineeId = game.getVoteClockPausedNomineeId();
        game.clearSlayerAckState();
        if (pausedNomineeId) {
          startClockwiseVote(game, playerIo, storytellerIo, pausedNomineeId);
        }
      }
    });

    // 철학자(Philosopher) 능력 사용: 부여받을 선한 역할 선택 (게임 중 1회)
    socket.on('philosopher:choose', ({ roleId }, callback) => {
      const playerId = getPlayerIdFromSocket(socket);
      if (!playerId) {
        callback({ success: false, error: '플레이어를 찾을 수 없습니다' });
        return;
      }
      const player = game.getPlayer(playerId);
      if (!player) {
        callback({ success: false, error: '플레이어를 찾을 수 없습니다' });
        return;
      }
      if (!player.isAlive) {
        callback({
          success: false,
          error: '사망한 상태에서는 사용할 수 없습니다',
        });
        return;
      }
      const state = game.getState();
      if (state.phase !== 'night') {
        callback({ success: false, error: '밤에만 사용할 수 있습니다' });
        return;
      }
      if (player.role?.id !== 'philosopher') {
        callback({ success: false, error: '철학자만 사용할 수 있습니다' });
        return;
      }
      if (game.isPhilosopherUsed(playerId)) {
        callback({ success: false, error: '이미 사용했습니다' });
        return;
      }
      const chosenRole = getRoleById(roleId);
      if (!chosenRole) {
        callback({ success: false, error: '존재하지 않는 역할입니다' });
        return;
      }
      if (chosenRole.id === 'philosopher') {
        callback({ success: false, error: '철학자 자신은 선택할 수 없습니다' });
        return;
      }
      if (chosenRole.team !== 'townsfolk' && chosenRole.team !== 'outsider') {
        callback({ success: false, error: '선한 역할만 선택할 수 있습니다' });
        return;
      }

      game.markPhilosopherUsed(playerId);
      player.philosopherGrantedRole = roleId;

      // 게임 내에 해당 역할 보유자가 있으면 중독시킴
      const holder = game.findPlayerByRoleId(roleId);
      let drunkenedPlayerId: string | undefined;
      let drunkenedPlayerName: string | undefined;
      if (holder && holder.id !== playerId) {
        if (!holder.statuses.includes('drunk')) {
          holder.statuses.push('drunk');
        }
        drunkenedPlayerId = holder.id;
        drunkenedPlayerName = holder.name;
      }

      // 점쟁이 능력 부여 시 Red Herring이 없으면 자동 배정 (이미 있으면 유지)
      if (roleId === 'fortune_teller') {
        game.ensureRedHerringForActor(playerId);
      }

      callback({ success: true });

      // 철학자 본인에게 갱신된 Player 정보 전달 (philosopherGrantedRole 동기화)
      playerIo.to(playerId).emit('game:playerUpdate', player);
      // 중독된 보유자가 있으면 해당 플레이어에게도 업데이트 전달
      if (holder && holder.id !== playerId) {
        playerIo.to(holder.id).emit('game:playerUpdate', holder);
      }
      // 이야기꾼에게 grant 알림 + 전체 상태 갱신
      storytellerIo.emit('philosopher:granted', {
        philosopherId: playerId,
        philosopherName: player.name,
        roleId,
        roleName: chosenRole.name,
        drunkenedPlayerId,
        drunkenedPlayerName,
      });
      storytellerIo.emit('game:state', game.getStorytellerState());
      console.log(
        `Philosopher: ${player.name} -> ${chosenRole.name}${
          drunkenedPlayerName ? ` (drunkened ${drunkenedPlayerName})` : ''
        }`,
      );
    });

    // 총잡이(Gunslinger) 낮에 오늘 첫 투표자 중 1명 사살 (하루 1회)
    socket.on('gunslinger:use', ({ targetId }, callback) => {
      const playerId = getPlayerIdFromSocket(socket);
      if (!playerId) {
        callback({ success: false, error: '플레이어를 찾을 수 없습니다' });
        return;
      }
      const player = game.getPlayer(playerId);
      if (!player) {
        callback({ success: false, error: '플레이어를 찾을 수 없습니다' });
        return;
      }
      if (!player.isAlive) {
        callback({
          success: false,
          error: '사망한 상태에서는 사용할 수 없습니다',
        });
        return;
      }
      if (player.role?.id !== 'gunslinger') {
        callback({ success: false, error: '총잡이만 사용할 수 있습니다' });
        return;
      }
      const state = game.getState();
      if (state.phase !== 'day' && state.phase !== 'vote') {
        callback({ success: false, error: '낮에만 사용할 수 있습니다' });
        return;
      }
      if (game.isGunslingerUsedToday(playerId)) {
        callback({ success: false, error: '오늘 이미 사용했습니다' });
        return;
      }
      const voters = game.getTodayFirstVoteGuiltyVoters();
      if (!voters) {
        callback({
          success: false,
          error: '오늘 첫 투표 집계 후에만 사용할 수 있습니다',
        });
        return;
      }
      if (!voters.includes(targetId)) {
        callback({
          success: false,
          error: '오늘 첫 투표에 찬성한 플레이어만 대상이 됩니다',
        });
        return;
      }
      const target = game.getPlayer(targetId);
      if (!target || !target.isAlive) {
        callback({ success: false, error: '대상이 유효하지 않습니다' });
        return;
      }

      game.markGunslingerUsedToday(playerId);
      const blocked = isPoisonedOrDrunkStatus(player.statuses);
      if (!blocked) {
        game.kill(targetId);
        emitDeathTriggers(target, storytellerIo, {
          isNight: false,
        });
      }

      callback({ success: true });

      const payload = {
        gunslingerId: playerId,
        gunslingerName: player.name,
        targetId,
        targetName: target.name,
        targetRoleName: target.role?.name ?? '알 수 없음',
        killed: !blocked,
      };
      playerIo.emit('gunslinger:fired', payload);
      storytellerIo.emit('gunslinger:fired', payload);
      const updatedTarget = game.getPlayer(targetId);
      if (updatedTarget) playerIo.emit('game:playerUpdate', updatedTarget);
      storytellerIo.emit('game:state', game.getStorytellerState());
      console.log(`Gunslinger: ${player.name} shot ${target.name}`);

      const winResult = blocked ? null : game.checkWinCondition();
      if (winResult) {
        winResult.cause = 'gunslinger';
        winResult.reason = `${player.name}(총잡이)이(가) ${target.name}을(를) 사살했습니다`;
        playerIo.emit('game:end', winResult);
        storytellerIo.emit('game:end', winResult);
      }
    });

    // 거지(Beggar)에게 죽은 플레이어가 투표 토큰 수여
    socket.on('beggar:giveToken', ({ beggarId }, callback) => {
      const playerId = getPlayerIdFromSocket(socket);
      if (!playerId) {
        callback({ success: false, error: '플레이어를 찾을 수 없습니다' });
        return;
      }
      const giver = game.getPlayer(playerId);
      if (!giver) {
        callback({ success: false, error: '플레이어를 찾을 수 없습니다' });
        return;
      }
      if (giver.isAlive) {
        callback({
          success: false,
          error: '죽은 플레이어만 토큰을 수여할 수 있습니다',
        });
        return;
      }
      if (giver.deadVoteUsed) {
        callback({
          success: false,
          error: '이미 죽은 표(또는 토큰 수여)를 사용했습니다',
        });
        return;
      }
      const beggar = game.getPlayer(beggarId);
      if (!beggar || !beggar.isAlive || beggar.role?.id !== 'beggar') {
        callback({ success: false, error: '유효한 거지가 아닙니다' });
        return;
      }
      giver.deadVoteUsed = true;
      const tokenCount = game.addBeggarToken(beggarId);
      const alignment = game.getPlayerAlignment(playerId);
      callback({ success: true });
      playerIo.to(beggarId).emit('beggar:tokenReceived', {
        giverId: playerId,
        giverName: giver.name,
        giverAlignment: alignment ?? 'good',
        tokenCount,
      });
      playerIo.emit('game:playerUpdate', giver);
      storytellerIo.emit('game:state', game.getStorytellerState());
      console.log(
        `Beggar token: ${giver.name} → ${beggar.name} (total ${tokenCount})`,
      );
    });

    // 곡예사(Juggler) 첫 낮 공개 추측 (1~5개, 게임 중 1회)
    socket.on('juggler:declare', ({ guesses }, callback) => {
      const playerId = getPlayerIdFromSocket(socket);
      if (!playerId) {
        callback({ success: false, error: '플레이어를 찾을 수 없습니다' });
        return;
      }
      const player = game.getPlayer(playerId);
      if (!player) {
        callback({ success: false, error: '플레이어를 찾을 수 없습니다' });
        return;
      }
      if (!player.isAlive) {
        callback({
          success: false,
          error: '사망한 상태에서는 사용할 수 없습니다',
        });
        return;
      }
      const state = game.getState();
      if (state.phase !== 'day') {
        callback({ success: false, error: '낮에만 사용할 수 있습니다' });
        return;
      }
      if (state.day > 2) {
        callback({ success: false, error: '첫 낮에만 사용할 수 있습니다' });
        return;
      }
      const effectiveRoleId =
        player.role?.id === 'drunk' && player.drunkAs
          ? player.drunkAs
          : player.role?.id;
      if (effectiveRoleId !== 'juggler') {
        callback({ success: false, error: '곡예사만 사용할 수 있습니다' });
        return;
      }
      if (game.isJugglerUsed(playerId)) {
        callback({ success: false, error: '이미 사용했습니다' });
        return;
      }
      if (!Array.isArray(guesses) || guesses.length < 1 || guesses.length > 5) {
        callback({
          success: false,
          error: '추측은 1~5개여야 합니다',
        });
        return;
      }

      // 추측 검증 + 메타데이터 (이름) 결합
      const enriched: Array<{
        playerId: string;
        playerName: string;
        roleId: string;
        roleName: string;
      }> = [];
      for (const g of guesses) {
        const target = game.getPlayer(g.playerId);
        const role = getRoleById(g.roleId);
        if (!target || !role) {
          callback({
            success: false,
            error: '잘못된 플레이어 또는 역할입니다',
          });
          return;
        }
        enriched.push({
          playerId: g.playerId,
          playerName: target.name,
          roleId: g.roleId,
          roleName: role.name,
        });
      }

      game.recordJugglerGuesses(
        playerId,
        guesses.map((g) => ({ playerId: g.playerId, roleId: g.roleId })),
      );
      const correctCount = game.judgeJuggler(playerId);

      callback({ success: true });

      // 모든 플레이어 + 이야기꾼에게 공개 선언 브로드캐스트
      playerIo.emit('juggler:announced', {
        jugglerId: playerId,
        jugglerName: player.name,
        guesses: enriched,
      });
      storytellerIo.emit('juggler:announced', {
        jugglerId: playerId,
        jugglerName: player.name,
        guesses: enriched,
      });
      // 이야기꾼에게만 정답 수 (밤 피드백 추천값)
      storytellerIo.emit('juggler:correctCount', {
        jugglerId: playerId,
        correctCount,
      });
      console.log(
        `Juggler 선언: ${player.name} → ${enriched.length}개 추측 (정답 ${correctCount})`,
      );
    });

    // 화가(Artist) 능력 사용 요청: 이야기꾼이 예/아니오로 답변 (게임 중 1회)
    socket.on('artist:use', (callback) => {
      const playerId = getPlayerIdFromSocket(socket);
      if (!playerId) {
        callback({ success: false, error: '플레이어를 찾을 수 없습니다' });
        return;
      }

      const player = game.getPlayer(playerId);
      if (!player) {
        callback({ success: false, error: '플레이어를 찾을 수 없습니다' });
        return;
      }

      if (!player.isAlive) {
        callback({
          success: false,
          error: '사망한 상태에서는 사용할 수 없습니다',
        });
        return;
      }

      if (!hasEffectiveRole(player, 'artist')) {
        callback({ success: false, error: '화가만 사용할 수 있습니다' });
        return;
      }

      const state = game.getState();
      if (state.phase !== 'day') {
        callback({ success: false, error: '낮에만 사용할 수 있습니다' });
        return;
      }

      if (game.isArtistUsed(playerId)) {
        callback({ success: false, error: '이미 사용했습니다' });
        return;
      }

      game.markArtistUsed(playerId);
      callback({ success: true });
      storytellerIo.emit('artist:requested', {
        playerId,
        playerName: player.name,
      });
      console.log(`Artist 요청: ${player.name}`);
    });

    // 백치천재(Savant) 능력 사용 요청: 이야기꾼에게 알림 → 이야기꾼이 참/거짓 정보 2개 입력
    socket.on('savant:use', (callback) => {
      const playerId = getPlayerIdFromSocket(socket);
      if (!playerId) {
        callback({ success: false, error: '플레이어를 찾을 수 없습니다' });
        return;
      }

      const player = game.getPlayer(playerId);
      if (!player) {
        callback({ success: false, error: '플레이어를 찾을 수 없습니다' });
        return;
      }

      if (!player.isAlive) {
        callback({
          success: false,
          error: '사망한 상태에서는 사용할 수 없습니다',
        });
        return;
      }

      if (!hasEffectiveRole(player, 'savant')) {
        callback({ success: false, error: '백치천재만 사용할 수 있습니다' });
        return;
      }

      const state = game.getState();
      if (state.phase !== 'day') {
        callback({ success: false, error: '낮에만 사용할 수 있습니다' });
        return;
      }

      if (game.isSavantUsedToday(playerId)) {
        callback({ success: false, error: '오늘 이미 사용했습니다' });
        return;
      }

      game.markSavantUsedToday(playerId);
      callback({ success: true });
      storytellerIo.emit('savant:requested', {
        playerId,
        playerName: player.name,
      });
      console.log(`Savant 요청: ${player.name}`);
    });

    // 변론 중 투표 동의 토글
    socket.on('vote:consentReady', ({ ready }) => {
      const playerId = getPlayerIdFromSocket(socket);
      if (!playerId) return;

      const state = game.getState();
      if (state.phase !== 'day' || state.daySubPhase !== 'defense') return;

      game.setVoteConsent(playerId, ready);
      const readyPlayerIds = game.getVoteConsentReadyIds();
      playerIo.emit('vote:consentStatus', { readyPlayerIds });
      storytellerIo.emit('vote:consentStatus', { readyPlayerIds });
    });

    socket.on('whisper:send', ({ conversationId, participantIds, message }) => {
      const state = game.getState();
      if (state.phase !== 'day' || state.daySubPhase !== 'whisper') return;
      // 오프라인 밀담 모드에서는 채팅 밀담 차단
      if (state.settings.whisperMode === 'offline') return;

      const fromId = getPlayerIdFromSocket(socket);
      if (!fromId) return;

      const fromPlayer = game.getPlayer(fromId);
      if (!fromPlayer) return;

      // Resolve participant list
      let resolvedIds: string[];
      if (participantIds && participantIds.length >= 2) {
        // New or existing group conversation
        resolvedIds = participantIds.includes(fromId)
          ? participantIds
          : [fromId, ...participantIds];
      } else if (conversationId) {
        // Existing conversation - extract participant IDs from conversationId
        resolvedIds = conversationId.split(':');
        if (!resolvedIds.includes(fromId)) return;
      } else {
        return;
      }

      // Validate all participants exist
      const resolvedPlayers = resolvedIds
        .map((pid) => game.getPlayer(pid))
        .filter((p): p is NonNullable<typeof p> => p != null);
      if (resolvedPlayers.length !== resolvedIds.length) return;
      const resolvedNames = resolvedPlayers.map((p) => p.name);

      const resolvedConversationId =
        conversationId || WhisperTracker.makeConversationId(...resolvedIds);

      const whisperMsg: WhisperMessage = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        fromId,
        fromName: fromPlayer.name,
        conversationId: resolvedConversationId,
        participantIds: resolvedIds,
        participantNames: resolvedNames,
        message,
        timestamp: Date.now(),
      };

      // Send to all participants
      resolvedIds.forEach((pid) => {
        playerIo.to(pid).emit('whisper:receive', whisperMsg);
      });

      whisperTracker.update(whisperMsg);
      const otherNames = resolvedNames
        .filter((_, i) => resolvedIds[i] !== fromId)
        .join(', ');
      console.log(`Whisper: ${fromPlayer.name} -> [${otherNames}]`);
    });

    socket.on('chat:sendToStoryteller', ({ message }) => {
      const playerId = getPlayerIdFromSocket(socket);
      if (!playerId) return;

      const player = game.getPlayer(playerId);
      if (!player) return;

      const chatMsg = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        playerId,
        playerName: player.name,
        message,
        fromStoryteller: false,
        timestamp: Date.now(),
      };

      // Send to storyteller
      storytellerIo.emit('chat:receiveFromPlayer', chatMsg);
      // Echo back to sender
      playerIo.to(playerId).emit('chat:receiveFromStoryteller', chatMsg);
      console.log(`Chat ${player.name} -> ST: ${message}`);
    });

    socket.on('player:leave', (callback) => {
      const playerId = getPlayerIdFromSocket(socket);
      if (!playerId) {
        callback({ success: false, error: '플레이어를 찾을 수 없습니다' });
        return;
      }
      const player = game.getPlayer(playerId);
      if (!player) {
        callback({ success: false, error: '플레이어를 찾을 수 없습니다' });
        return;
      }
      const playerName = player.name;
      game.removePlayer(playerId);
      socket.leave(playerId);
      callback({ success: true });

      // 나머지 플레이어와 이야기꾼에게 알림
      playerIo.emit('player:left', { playerId, playerName });
      storytellerIo.emit('player:left', { playerId, playerName });
      storytellerIo.emit('game:state', game.getStorytellerState());
      console.log(`Player left game: ${playerName}`);
    });

    // ── 추방 투표 ──

    socket.on('exile:propose', ({ targetId }, callback) => {
      const playerId = getPlayerIdFromSocket(socket);
      if (!playerId) {
        callback({ success: false, error: '플레이어를 찾을 수 없습니다' });
        return;
      }

      const result = game.startExileVote(playerId, targetId);
      if (!result.success) {
        callback(result);
        return;
      }

      const proposer = game.getPlayer(playerId);
      const target = game.getPlayer(targetId);
      callback({ success: true });

      const startData = {
        proposerId: playerId,
        proposerName: proposer?.name ?? playerId,
        targetId,
        targetName: target?.name ?? targetId,
        targetRoleName: target?.role?.name ?? '???',
        totalPlayers: result.totalPlayers ?? 0,
      };
      playerIo.emit('exile:start', startData);
      storytellerIo.emit('exile:start', startData);
      console.log(`Exile proposed: ${proposer?.name} -> ${target?.name}`);
    });

    socket.on('exile:vote', ({ guilty }, callback) => {
      const playerId = getPlayerIdFromSocket(socket);
      if (!playerId) {
        if (typeof callback === 'function')
          callback({ success: false, error: '플레이어를 찾을 수 없습니다' });
        return;
      }

      const result = game.castExileVote(playerId, guilty);
      if (!result.success) {
        if (typeof callback === 'function') callback(result);
        return;
      }
      if (typeof callback === 'function') callback({ success: true });

      const exileVote = game.getExileVote();
      if (exileVote) {
        const updateData = {
          votes: exileVote.votes,
          guiltyCount: exileVote.guiltyCount,
          innocentCount: exileVote.innocentCount,
          totalPlayers: game.getState().players.length,
        };
        playerIo.emit('exile:voteUpdate', updateData);
        storytellerIo.emit('exile:voteUpdate', updateData);
      }

      // 전원 투표 완료 시 자동 종료
      if (result.allVoted) {
        if (game.shouldRequestDeviantExileJudgement()) {
          const exileVote = game.getExileVote();
          const target = exileVote ? game.getPlayer(exileVote.targetId) : null;
          storytellerIo.emit('deviant:exileJudgement', {
            targetId: exileVote?.targetId ?? '',
            targetName: target?.name ?? exileVote?.targetId ?? '',
            guiltyCount: exileVote?.guiltyCount ?? 0,
            totalPlayers: game.getState().players.length,
          });
          return;
        }

        const closeResult = game.closeExileVote();
        if (closeResult) {
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
          console.log(
            `Exile vote closed: ${target?.name} - ${closeResult.exiled ? 'exiled' : 'survived'} (${closeResult.guiltyCount}/${closeResult.totalPlayers})`,
          );
        }
      }
    });

    socket.on('push:register', ({ token }) => {
      const playerId = getPlayerIdFromSocket(socket);
      if (playerId) {
        registerPushToken(playerId, token);
      }
    });

    socket.on('disconnect', () => {
      const playerId = getPlayerIdFromSocket(socket);
      if (!playerId) {
        console.log('Player disconnected (no room)');
        return;
      }

      const state = game.getState();
      if (!state.started) {
        // 게임 시작 전: 대기실에서 나간 플레이어를 목록에서 제거
        const player = game.getPlayer(playerId);
        const playerName = player?.name ?? playerId;
        game.removePlayer(playerId);
        storytellerIo.emit('game:state', game.getStorytellerState());
        console.log(`Player left lobby: ${playerName}`);
        return;
      }
      const player = game.getPlayer(playerId);
      console.log(`Player disconnected: ${player?.name ?? playerId}`);
    });
  });
}
