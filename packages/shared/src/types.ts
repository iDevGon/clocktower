export type Phase = "setup" | "night" | "day" | "vote" | "ended";

export type Team = "townsfolk" | "outsider" | "minion" | "demon";

export interface Role {
  id: string;
  name: string;
  team: Team;
  ability: string;
}

export interface Player {
  id: string;
  name: string;
  role?: Role;
  isAlive: boolean;
  isNominated: boolean;
}

export interface GameState {
  id: string;
  phase: Phase;
  day: number;
  players: Player[];
  nominations: Nomination[];
}

export interface Nomination {
  nominatorId: string;
  nomineeId: string;
  votes: Record<string, boolean>;
}
