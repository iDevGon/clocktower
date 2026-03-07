import { randomUUID } from "crypto";
import type { GameState, Player, Phase, Nomination, Role } from "@clocktower/shared";

export class GameManager {
  private state: GameState = {
    id: "",
    phase: "setup",
    day: 0,
    players: [],
    nominations: [],
  };

  create(): string {
    const id = randomUUID().slice(0, 8);
    this.state = {
      id,
      phase: "setup",
      day: 0,
      players: [],
      nominations: [],
    };
    return id;
  }

  getState(): GameState {
    return { ...this.state };
  }

  getPlayer(playerId: string): Player | undefined {
    return this.state.players.find((p) => p.id === playerId);
  }

  addPlayer(name: string): Player | null {
    if (this.state.phase !== "setup") return null;

    const player: Player = {
      id: randomUUID().slice(0, 8),
      name,
      isAlive: true,
      isNominated: false,
    };
    this.state.players.push(player);
    return player;
  }

  setPhase(phase: Phase): void {
    this.state.phase = phase;
    if (phase === "night") {
      this.state.nominations = [];
      this.state.players.forEach((p) => (p.isNominated = false));
    }
    if (phase === "day") {
      this.state.day++;
    }
  }

  assignRole(playerId: string, roleId: string): void {
    const player = this.getPlayer(playerId);
    if (!player) return;

    // TODO: Load roles from a role registry
    const role: Role = {
      id: roleId,
      name: roleId,
      team: "townsfolk",
      ability: "",
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

  nominate(nominatorId: string, nomineeId: string): void {
    const nominee = this.getPlayer(nomineeId);
    if (nominee) nominee.isNominated = true;

    const nomination: Nomination = {
      nominatorId,
      nomineeId,
      votes: {},
    };
    this.state.nominations.push(nomination);
  }

  castVote(playerId: string, guilty: boolean): void {
    const current = this.state.nominations[this.state.nominations.length - 1];
    if (current) {
      current.votes[playerId] = guilty;
    }
  }

  closeVote(): { nomineeId: string; guilty: boolean; votes: Record<string, boolean> } | null {
    const current = this.state.nominations[this.state.nominations.length - 1];
    if (!current) return null;

    const alivePlayers = this.state.players.filter((p) => p.isAlive).length;
    const guiltyVotes = Object.values(current.votes).filter(Boolean).length;
    const guilty = guiltyVotes >= Math.ceil(alivePlayers / 2);

    return {
      nomineeId: current.nomineeId,
      guilty,
      votes: current.votes,
    };
  }
}
