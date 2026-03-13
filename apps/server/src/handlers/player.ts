import type {
  ClientToServerEvents,
  ServerToClientEvents,
  ServerToStorytellerEvents,
  StorytellerToServerEvents,
  WhisperMessage,
} from '@clocktower/shared';
import type { Namespace } from 'socket.io';
import type { GameManager } from '../game.js';
import { registerPushToken } from '../pushNotifications.js';
import { WhisperTracker } from '../whisper.js';

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
      if (state.started) {
        callback({ success: false, error: '게임이 이미 진행 중입니다' });
        return;
      }
      const player = game.addPlayer(playerName);
      if (player) {
        socket.join(player.id);
        callback({ success: true, playerId: player.id });
        // 설정 전송
        socket.emit('game:settings', game.getSettings());
        storytellerIo.emit('game:state', game.getState());
        console.log(`Player joined: ${playerName}`);
      } else {
        callback({ success: false, error: '참가할 수 없습니다' });
      }
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

      // 밤 페이즈일 때 진행 상태 포함
      let nightProgress:
        | {
            activeRoleId: string | null;
            order: string[];
            players: { id: string; name: string; isAlive: boolean }[];
          }
        | undefined;
      if (state.phase === 'night') {
        const np = game.getNightProgress();
        const players = state.players.map((p) => ({
          id: p.id,
          name: p.name,
          isAlive: p.isAlive,
        }));
        nightProgress = { ...np, players };
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
        nightProgress,
      });
      // 설정 전송
      socket.emit('game:settings', state.settings);
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

      const result = game.nominate(playerId, nomineeId);
      if (!result.success) {
        callback(result);
        return;
      }

      callback({ success: true });

      // 성결자(Virgin) 트리거
      if (result.virginKill) {
        const virgin = game.getPlayer(nomineeId);
        const nominator = game.getPlayer(playerId);
        game.kill(result.virginKill);
        game.markExecution();
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
      const nominator = game.getPlayer(playerId);
      const nominee = game.getPlayer(nomineeId);
      playerIo.emit('day:subPhase', 'defense');
      playerIo.emit('vote:start', {
        nominatorId: playerId,
        nomineeId,
        nominatorName: nominator?.name ?? playerId,
        nomineeName: nominee?.name ?? nomineeId,
      });
      storytellerIo.emit('game:state', game.getState());
    });

    socket.on('vote:cast', ({ guilty }) => {
      const playerId = getPlayerIdFromSocket(socket);
      if (!playerId) return;

      const state = game.getState();
      if (state.settings.votingMode === 'offline') return;

      // 오프라인 모드가 아닌 비-시계방향 투표 시 즉시 확정
      const result = game.castVote(playerId, guilty);
      if (result.success) {
        storytellerIo.emit('game:state', game.getState());
      }
    });

    socket.on('vote:preselect', ({ guilty }) => {
      const playerId = getPlayerIdFromSocket(socket);
      if (!playerId) return;

      // 이미 투표가 확정된 플레이어는 프리셀렉트 변경 불가
      const current = game.getState().nominations.at(-1);
      if (current && playerId in current.votes) return;

      game.preselectVote(playerId, guilty);
      // 모든 플레이어와 이야기꾼에게 프리셀렉트 알림
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

          // 집사(Butler) 주인 선택 저장
          if (player.role.id === 'butler' && targets.length > 0) {
            game.setButlerMaster(playerId, targets[0]);
          }

          // 주정뱅이는 가짜 역할 ID로 행동을 보고
          const reportRoleId =
            player.role.id === 'drunk' && player.drunkAs
              ? player.drunkAs
              : player.role.id;
          // 점쟁이 판정: 선택된 2명 중 악마/Red Herring 포함 여부
          const fortuneTellerResult =
            reportRoleId === 'fortune_teller'
              ? game.judgeFortuneTeller(targets)
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
      if (state.phase !== 'day') {
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

      // 실제 처단자이고 대상이 악마면 자동 사망 (중독 상태면 무효)
      const killCondition =
        isSlayer &&
        !player.statuses.includes('poisoned') &&
        target.role?.team === 'demon';

      if (killCondition) {
        game.kill(targetId);
        game.markExecution(); // 처단자 처형은 처형으로 간주 → 더 이상 지목 불가
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
        storytellerIo.emit('game:state', game.getState());

        const winResult = game.checkWinCondition();
        if (winResult) {
          winResult.cause = 'slayer';
          winResult.reason = `처단자 ${player.name}이(가) 악마를 처치했습니다`;
          playerIo.emit('game:end', winResult);
          playerIo.emit('game:phase', 'ended');
          storytellerIo.emit('game:end', winResult);
          storytellerIo.emit('game:state', game.getState());
        }
      } else {
        // 능력이 효과 없음 (중독/주정뱅이/대상이 악마가 아님)
        playerIo.emit('slayer:noEffect', {
          slayerName: player.name,
          targetName: target.name,
        });
        storytellerIo.emit('slayer:noEffect', {
          slayerName: player.name,
          targetName: target.name,
        });
      }

      console.log(`Slayer: ${player.name} -> ${target.name}`);
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
      const resolvedNames: string[] = [];
      for (const pid of resolvedIds) {
        const p = game.getPlayer(pid);
        if (!p) return;
        resolvedNames.push(p.name);
      }

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
      for (const pid of resolvedIds) {
        playerIo.to(pid).emit('whisper:receive', whisperMsg);
      }

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

    socket.on('push:register', ({ token }) => {
      const playerId = getPlayerIdFromSocket(socket);
      if (playerId) {
        registerPushToken(playerId, token);
      }
    });

    socket.on('disconnect', () => {
      console.log('Player disconnected');
    });
  });
}
