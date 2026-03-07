import type { GameState, Player, Phase } from "./types";

export interface ServerToClientEvents {
  "game:state": (state: GameState) => void;
  "game:phase": (phase: Phase) => void;
  "game:playerUpdate": (player: Player) => void;
  "role:assign": (role: { roleId: string; roleName: string }) => void;
  "vote:start": (data: { nominatorId: string; nomineeId: string }) => void;
  "vote:result": (data: { nomineeId: string; guilty: boolean; votes: Record<string, boolean> }) => void;
}

export interface ClientToServerEvents {
  "game:join": (data: { playerName: string }, callback: (res: { success: boolean; playerId?: string }) => void) => void;
  "vote:cast": (data: { guilty: boolean }) => void;
}

export interface StorytellerToServerEvents {
  "game:create": (callback: (res: { success: boolean; gameId?: string }) => void) => void;
  "game:setPhase": (phase: Phase) => void;
  "game:assignRole": (data: { playerId: string; roleId: string }) => void;
  "game:kill": (playerId: string) => void;
  "game:revive": (playerId: string) => void;
  "vote:nominate": (data: { nominatorId: string; nomineeId: string }) => void;
  "vote:close": () => void;
}
