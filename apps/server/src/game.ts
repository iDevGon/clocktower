import { randomUUID } from 'node:crypto';
import type {
  DaySubPhase,
  GameState,
  Nomination,
  Phase,
  Player,
  Role,
} from '@clocktower/shared';
import { getRoleById } from '@clocktower/shared';

export class GameManager {
  private state: GameState = {
    id: '',
    phase: 'setup',
    daySubPhase: null,
    day: 0,
    players: [],
    nominations: [],
    started: false,
  };

  create(): string {
    const id = randomUUID().slice(0, 8);
    this.state = {
      id,
      phase: 'setup',
      daySubPhase: null,
      day: 0,
      players: [],
      nominations: [],
      started: false,
    };
    return id;
  }

  reset(): void {
    this.state = {
      id: '',
      phase: 'setup',
      daySubPhase: null,
      day: 0,
      players: [],
      nominations: [],
      started: false,
    };
  }

  getState(): GameState {
    return { ...this.state };
  }

  getPlayer(playerId: string): Player | undefined {
    return this.state.players.find((p) => p.id === playerId);
  }

  addPlayer(name: string): Player | null {
    if (this.state.started) return null;

    const player: Player = {
      id: randomUUID().slice(0, 8),
      name,
      isAlive: true,
      hasNominatedToday: false,
      deadVoteUsed: false,
    };
    this.state.players.push(player);
    return player;
  }

  clearPlayers(): void {
    this.state.players = [];
  }

  start(): { success: boolean; error?: string } {
    if (this.state.started)
      return { success: false, error: '이미 게임이 시작되었습니다' };
    if (this.state.players.length < 5)
      return { success: false, error: '최소 5명의 플레이어가 필요합니다' };
    if (!this.state.players.every((p) => p.role))
      return { success: false, error: '모든 플레이어에게 역할을 배정해주세요' };

    this.state.started = true;
    this.state.phase = 'night';
    this.state.day = 1;
    return { success: true };
  }

  setPhase(phase: Phase): void {
    this.state.phase = phase;
    this.state.daySubPhase = null;
    if (phase === 'night') {
      this.state.nominations = [];
      for (const p of this.state.players) {
        p.hasNominatedToday = false;
      }
    }
    if (phase === 'day') {
      this.state.day++;
      this.state.daySubPhase = 'whisper';
    }
  }

  setDaySubPhase(subPhase: DaySubPhase): void {
    this.state.daySubPhase = subPhase;
  }

  assignRole(playerId: string, roleId: string): void {
    const player = this.getPlayer(playerId);
    if (!player) return;

    const registeredRole = getRoleById(roleId);
    const role: Role = registeredRole ?? {
      id: roleId,
      name: roleId,
      team: 'townsfolk',
      ability: '',
    };
    player.role = role;
  }

  kill(playerId: string): void {
    const player = this.getPlayer(playerId);
    if (player) player.isAlive = false;
  }

  revive(playerId: string): void {
    const player = this.getPlayer(playerId);
    if (player) player.isAlive = true;
  }

  nominate(
    nominatorId: string,
    nomineeId: string,
  ): { success: boolean; error?: string } {
    const nominator = this.getPlayer(nominatorId);
    const nominee = this.getPlayer(nomineeId);

    if (!nominator || !nominee)
      return { success: false, error: '플레이어를 찾을 수 없습니다' };
    if (!nominator.isAlive)
      return { success: false, error: '사망한 플레이어는 지목할 수 없습니다' };
    if (nominator.hasNominatedToday)
      return { success: false, error: '이미 오늘 지목을 사용했습니다' };
    if (nominatorId === nomineeId)
      return { success: false, error: '자기 자신은 지목할 수 없습니다' };

    nominator.hasNominatedToday = true;

    const nomination: Nomination = {
      nominatorId,
      nomineeId,
      votes: {},
    };
    this.state.nominations.push(nomination);
    return { success: true };
  }

  castVote(
    playerId: string,
    guilty: boolean,
  ): { success: boolean; error?: string } {
    const player = this.getPlayer(playerId);
    if (!player)
      return { success: false, error: '플레이어를 찾을 수 없습니다' };

    if (!player.isAlive) {
      if (player.deadVoteUsed)
        return {
          success: false,
          error: '사망한 플레이어는 게임당 한 번만 투표할 수 있습니다',
        };
      player.deadVoteUsed = true;
    }

    const current = this.state.nominations[this.state.nominations.length - 1];
    if (current) {
      current.votes[playerId] = guilty;
    }
    return { success: true };
  }

  returnToNomination(): void {
    this.state.phase = 'day';
    this.state.daySubPhase = 'nomination';
  }

  closeVote(): {
    nomineeId: string;
    nomineeName: string;
    guilty: boolean;
    votes: Record<string, boolean>;
  } | null {
    const current = this.state.nominations[this.state.nominations.length - 1];
    if (!current) return null;

    const alivePlayers = this.state.players.filter((p) => p.isAlive).length;
    const guiltyVotes = Object.values(current.votes).filter(Boolean).length;
    const guilty = guiltyVotes >= Math.ceil(alivePlayers / 2);

    const nominee = this.getPlayer(current.nomineeId);

    return {
      nomineeId: current.nomineeId,
      nomineeName: nominee?.name ?? current.nomineeId,
      guilty,
      votes: current.votes,
    };
  }
}
