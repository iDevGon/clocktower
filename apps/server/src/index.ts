import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import os from "os";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  StorytellerToServerEvents,
} from "@clocktower/shared";
import { GameManager } from "./game.js";

const app = express();
app.use(cors());

const httpServer = createServer(app);

const io = new Server<
  ClientToServerEvents & StorytellerToServerEvents,
  ServerToClientEvents
>(httpServer, {
  cors: { origin: "*" },
});

const game = new GameManager();

// Storyteller namespace
const storytellerIo = io.of("/storyteller");
storytellerIo.on("connection", (socket) => {
  console.log("Storyteller connected");

  socket.on("game:create", (callback) => {
    const gameId = game.create();
    callback({ success: true, gameId });
  });

  socket.on("game:setPhase", (phase) => {
    game.setPhase(phase);
    io.of("/player").emit("game:phase", phase);
    storytellerIo.emit("game:state", game.getState());
  });

  socket.on("game:assignRole", ({ playerId, roleId }) => {
    game.assignRole(playerId, roleId);
    const player = game.getPlayer(playerId);
    if (player?.role) {
      io.of("/player").to(playerId).emit("role:assign", {
        roleId: player.role.id,
        roleName: player.role.name,
      });
    }
    storytellerIo.emit("game:state", game.getState());
  });

  socket.on("game:kill", (playerId) => {
    game.kill(playerId);
    storytellerIo.emit("game:state", game.getState());
    io.of("/player").emit("game:playerUpdate", game.getPlayer(playerId)!);
  });

  socket.on("game:revive", (playerId) => {
    game.revive(playerId);
    storytellerIo.emit("game:state", game.getState());
    io.of("/player").emit("game:playerUpdate", game.getPlayer(playerId)!);
  });

  socket.on("vote:nominate", ({ nominatorId, nomineeId }) => {
    game.nominate(nominatorId, nomineeId);
    io.of("/player").emit("vote:start", { nominatorId, nomineeId });
    storytellerIo.emit("game:state", game.getState());
  });

  socket.on("vote:close", () => {
    const result = game.closeVote();
    if (result) {
      io.of("/player").emit("vote:result", result);
      storytellerIo.emit("game:state", game.getState());
    }
  });

  socket.on("disconnect", () => {
    console.log("Storyteller disconnected");
  });
});

// Player namespace
const playerIo = io.of("/player");
playerIo.on("connection", (socket) => {
  socket.on("game:join", ({ playerName }, callback) => {
    const player = game.addPlayer(playerName);
    if (player) {
      socket.join(player.id);
      callback({ success: true, playerId: player.id });
      storytellerIo.emit("game:state", game.getState());
      console.log(`Player joined: ${playerName}`);
    } else {
      callback({ success: false });
    }
  });

  socket.on("vote:cast", ({ guilty }) => {
    // Find player ID from socket rooms
    const rooms = Array.from(socket.rooms);
    const playerId = rooms.find((r) => r !== socket.id);
    if (playerId) {
      game.castVote(playerId, guilty);
      storytellerIo.emit("game:state", game.getState());
    }
  });

  socket.on("disconnect", () => {
    console.log("Player disconnected");
  });
});

// Health check
app.get("/", (_req, res) => {
  res.json({ status: "ok", game: game.getState() });
});

const PORT = 3000;
httpServer.listen(PORT, () => {
  const localIP = getLocalIP();
  console.log(`\nServer running on:`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Network: http://${localIP}:${PORT}`);
  console.log(`\nPlayers can connect to: http://${localIP}:${PORT}`);
});

function getLocalIP(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] ?? []) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}
