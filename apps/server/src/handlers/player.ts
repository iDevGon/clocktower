import type { WhisperMessage } from '@clocktower/shared';
import type { Namespace } from 'socket.io';
import type { GameManager } from '../game.js';
import type { WhisperTracker } from '../whisper.js';

function getPlayerIdFromSocket(socket: {
  id: string;
  rooms: Set<string>;
}): string | undefined {
  const rooms = Array.from(socket.rooms);
  return rooms.find((r) => r !== socket.id);
}

export function registerPlayerHandlers(
  storytellerIo: Namespace,
  playerIo: Namespace,
  game: GameManager,
  whisperTracker: WhisperTracker,
): void {
  playerIo.on('connection', (socket) => {
    socket.on('game:join', ({ playerName, gameCode }, callback) => {
      const state = game.getState();
      if (!state.id || state.id !== gameCode) {
        callback({ success: false });
        return;
      }
      const player = game.addPlayer(playerName);
      if (player) {
        socket.join(player.id);
        callback({ success: true, playerId: player.id });
        storytellerIo.emit('game:state', game.getState());
        console.log(`Player joined: ${playerName}`);
      } else {
        callback({ success: false });
      }
    });

    socket.on('game:rejoin', ({ playerId, gameCode }, callback) => {
      const state = game.getState();
      if (!state.id || state.id !== gameCode) {
        callback({ success: false });
        return;
      }
      const player = game.getPlayer(playerId);
      if (!player) {
        callback({ success: false });
        return;
      }
      socket.join(player.id);
      callback({
        success: true,
        playerName: player.name,
        roleId: player.role?.id,
        phase: state.phase,
        isAlive: player.isAlive,
        daySubPhase: state.daySubPhase,
        hasNominatedToday: player.hasNominatedToday,
        deadVoteUsed: player.deadVoteUsed,
      });
      console.log(`Player rejoined: ${player.name}`);
    });

    socket.on('nominate:request', ({ nomineeId }, callback) => {
      const playerId = getPlayerIdFromSocket(socket);
      if (!playerId) {
        callback({ success: false, error: '플레이어를 찾을 수 없습니다' });
        return;
      }

      const state = game.getState();
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

      game.setPhase('vote');
      const nominator = game.getPlayer(playerId);
      const nominee = game.getPlayer(nomineeId);
      playerIo.emit('game:phase', 'vote');
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
      if (playerId) {
        const result = game.castVote(playerId, guilty);
        if (result.success) {
          storytellerIo.emit('game:state', game.getState());
        }
      }
    });

    socket.on('night:action', ({ targets }) => {
      const playerId = getPlayerIdFromSocket(socket);
      if (playerId) {
        const player = game.getPlayer(playerId);
        if (player?.role) {
          storytellerIo.emit('night:actionReceived', {
            playerId,
            playerName: player.name,
            roleId: player.role.id,
            targets,
          });
          console.log(
            `Night action: ${player.name}(${player.role.name}) -> [${targets.join(', ')}]`,
          );
        }
      }
    });

    socket.on('whisper:send', ({ toId, message }) => {
      const state = game.getState();
      if (state.phase !== 'day' || state.daySubPhase !== 'whisper') return;

      const fromId = getPlayerIdFromSocket(socket);
      if (!fromId) return;

      const fromPlayer = game.getPlayer(fromId);
      const toPlayer = game.getPlayer(toId);
      if (!fromPlayer || !toPlayer) return;

      const whisperMsg: WhisperMessage = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        fromId,
        fromName: fromPlayer.name,
        toId,
        toName: toPlayer.name,
        message,
        timestamp: Date.now(),
      };

      // Send to recipient
      playerIo.to(toId).emit('whisper:receive', whisperMsg);
      // Echo back to sender
      playerIo.to(fromId).emit('whisper:receive', whisperMsg);

      whisperTracker.update(whisperMsg);
      console.log(`Whisper: ${fromPlayer.name} -> ${toPlayer.name}`);
    });

    socket.on('disconnect', () => {
      console.log('Player disconnected');
    });
  });
}
