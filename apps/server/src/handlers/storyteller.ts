import {
  distributeRoles,
  FIRST_NIGHT_ORDER,
  OTHER_NIGHT_ORDER,
} from '@clocktower/shared';
import type { Namespace } from 'socket.io';
import type { GameManager } from '../game.js';
import type { WhisperTracker } from '../whisper.js';

function getNightOrder(day: number): string[] {
  return day <= 1 ? FIRST_NIGHT_ORDER : OTHER_NIGHT_ORDER;
}

function getPlayerInfoList(game: GameManager) {
  return game.getState().players.map(({ id, name, isAlive }) => ({
    id,
    name,
    isAlive,
  }));
}

export function registerStorytellerHandlers(
  storytellerIo: Namespace,
  playerIo: Namespace,
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
      playerIo.emit('game:state', game.getState());
      storytellerIo.emit('game:state', game.getState());
    });

    socket.on('game:create', (callback) => {
      const gameId = game.create();
      callback({ success: true, gameId });
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
      playerIo.emit('night:activeRole', { roleId: null, order, players });
      storytellerIo.emit('game:state', state);
      callback({ success: true });
    });

    socket.on('game:setPhase', (phase) => {
      game.setPhase(phase);
      playerIo.emit('game:phase', phase);
      if (phase === 'night') {
        const state = game.getState();
        const order = getNightOrder(state.day);
        const players = getPlayerInfoList(game);
        playerIo.emit('night:activeRole', { roleId: null, order, players });
      }
      if (phase === 'day') {
        playerIo.emit('game:state', game.getState());
        playerIo.emit('day:subPhase', 'whisper');
        whisperTracker.clear();
      }
      storytellerIo.emit('game:state', game.getState());
    });

    socket.on('day:setSubPhase', (subPhase) => {
      game.setDaySubPhase(subPhase);
      playerIo.emit('day:subPhase', subPhase);
      storytellerIo.emit('game:state', game.getState());
    });

    socket.on('night:sendFeedback', ({ playerId, feedback }) => {
      playerIo.to(playerId).emit('night:feedback', { feedback });
      console.log(`Feedback -> ${playerId}: ${JSON.stringify(feedback)}`);
    });

    socket.on('night:setActiveRole', (roleId) => {
      const state = game.getState();
      const order = getNightOrder(state.day);
      const players = getPlayerInfoList(game);
      playerIo.emit('night:activeRole', { roleId, order, players });

      // Spy: automatically send grimoire
      if (roleId === 'spy') {
        const spyPlayer = state.players.find((p) => p.role?.id === 'spy');
        if (spyPlayer) {
          const entries = state.players.map((p) => ({
            name: p.name,
            roleName: p.role?.name ?? '???',
            team: p.role?.team ?? ('townsfolk' as const),
          }));
          playerIo
            .to(spyPlayer.id)
            .emit('night:feedback', {
              feedback: { type: 'grimoire', entries },
            });
        }
      }
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

    socket.on('game:distributeRoles', (callback) => {
      const state = game.getState();
      const playerIds = state.players.map((p) => p.id);
      const result = distributeRoles(playerIds);
      if (!result) {
        callback({
          success: false,
          error: `${playerIds.length}명은 지원하지 않습니다 (5~15명)`,
        });
        return;
      }
      for (const { playerId, role } of result.assignments) {
        game.assignRole(playerId, role.id);
        playerIo.to(playerId).emit('role:assign', {
          roleId: role.id,
          roleName: role.name,
        });
      }
      storytellerIo.emit('game:state', game.getState());
      callback({ success: true });
    });

    socket.on('game:assignRole', ({ playerId, roleId }) => {
      game.assignRole(playerId, roleId);
      const player = game.getPlayer(playerId);
      if (player?.role) {
        playerIo.to(playerId).emit('role:assign', {
          roleId: player.role.id,
          roleName: player.role.name,
        });
      }
      storytellerIo.emit('game:state', game.getState());
    });

    socket.on('game:kill', (playerId) => {
      game.kill(playerId);
      storytellerIo.emit('game:state', game.getState());
      const killedPlayer = game.getPlayer(playerId);
      if (killedPlayer) {
        playerIo.emit('game:playerUpdate', killedPlayer);
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

      game.setPhase('vote');
      const nominator = game.getPlayer(nominatorId);
      const nominee = game.getPlayer(nomineeId);
      playerIo.emit('game:phase', 'vote');
      playerIo.emit('vote:start', {
        nominatorId,
        nomineeId,
        nominatorName: nominator?.name ?? nominatorId,
        nomineeName: nominee?.name ?? nomineeId,
      });
      storytellerIo.emit('game:state', game.getState());
    });

    socket.on('vote:close', () => {
      const result = game.closeVote();
      if (result) {
        playerIo.emit('vote:result', result);
        game.returnToNomination();
        playerIo.emit('game:phase', 'day');
        playerIo.emit('day:subPhase', 'nomination');
        storytellerIo.emit('game:state', game.getState());
      }
    });

    socket.on('disconnect', () => {
      console.log('Storyteller disconnected');
    });
  });
}
