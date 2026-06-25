import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import {
  loadState,
  getState,
  getTeams,
  getPlayers,
  getAuction,
  getSettings,
  addTeam,
  removeTeam,
  addPlayer,
  removePlayer,
  updateSettings,
  updateAuction,
  resetState,
  removeAllTeams,
  removeAllPlayers,
  getTeamById,
  setCaptain,
  regenerateCaptainPassword,
  addPrePlayer,
  removePrePlayer,
  updateTeamPurse,
} from "./stateManager.js";
import {
  startPlayerAuction,
  placeBid,
  markSold,
  markUnsold,
  pauseAuction,
  resumeAuction,
  getAuctionStats,
  getRemainingPlayers,
  stopTimer,
  endAuction,
  undoLastSold,
} from "./auctionEngine.js";

const app = express();
const server = createServer(app);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});

// Load state on startup
loadState();

// Parse JSON bodies for API endpoints
app.use(express.json());

app.get("/health", (req, res) => {
  res.send("OK");
});

// Admin password verification endpoint
app.post("/api/verify-admin", (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || "admin";
  if (password === adminPassword) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: "Incorrect password" });
  }
});

// Captain password verification endpoint
app.post("/api/verify-captain", (req, res) => {
  const { teamId, password } = req.body;
  if (!teamId || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Team ID and password are required" });
  }

  const team = getTeamById(teamId);
  if (!team) {
    return res
      .status(404)
      .json({ success: false, message: "Team not found" });
  }

  if (!team.captain) {
    return res
      .status(400)
      .json({ success: false, message: "No captain assigned to this team" });
  }

  if (team.captain.password === password) {
    res.json({ success: true, teamName: team.name });
  } else {
    res
      .status(401)
      .json({ success: false, message: "Incorrect captain password" });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", connections: io.engine.clientsCount });
});

const rootDir = path.join(__dirname, "..");

app.use(express.static(path.join(rootDir, "dist")));

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(rootDir, "dist", "index.html"));
});

// Track connected clients
const connectedClients = new Map();

io.on("connection", (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Send full state on initial connect
  socket.emit("state:init", getState());

  // --- Join ---
  socket.on("join", ({ role, teamName }) => {
    connectedClients.set(socket.id, { role, teamName });
    console.log(
      `[Socket] ${socket.id} joined as ${role}${teamName ? ` (${teamName})` : ""}`,
    );
    socket.join(role);
    if (teamName) socket.join(`team:${teamName}`);
  });

  // --- Admin: Team Management ---
  socket.on("admin:addTeam", (data) => {
    const { name, shortName, color, purse } = data;
    if (!name || !shortName) {
      socket.emit("error", {
        message: "Team name and short name are required",
      });
      return;
    }

    const settings = getSettings();
    const team = {
      id: `team_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name,
      shortName: shortName.toUpperCase(),
      color: color || "#3B82F6",
      purse: purse || settings.defaultPurse,
      remaining: purse || settings.defaultPurse,
      players: [],
      captain: null,
      preAddedPlayers: [],
    };

    addTeam(team);
    io.emit("teams:update", { teams: getTeams() });
    console.log(`[Admin] Team added: ${name}`);
  });

  socket.on("admin:removeTeam", ({ teamId }) => {
    // Before removing team, reset any pre-added players back to available
    const team = getTeamById(teamId);
    if (team && team.preAddedPlayers) {
      team.preAddedPlayers.forEach((p) => {
        const player = getPlayers().find((pl) => pl.id === p.id);
        if (player && player.status === "pre-added") {
          player.status = "available";
          player.soldTo = null;
        }
      });
    }
    removeTeam(teamId);
    io.emit("teams:update", { teams: getTeams() });
    io.emit("players:update", { players: getPlayers() });
    console.log(`[Admin] Team removed: ${teamId}`);
  });

  // --- Admin: Player Management ---
  socket.on("admin:addPlayer", (data) => {
    const { name, role, basePrice, photo } = data;
    if (!name || !role) {
      socket.emit("error", { message: "Player name and role are required" });
      return;
    }

    const settings = getSettings();
    const finalBasePrice = basePrice
      ? Number(basePrice)
      : settings.defaultBasePrice || 2000000;

    const player = {
      id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name,
      role,
      basePrice: finalBasePrice,
      photo: photo || "",
      status: "available",
      soldTo: null,
      soldPrice: null,
    };

    addPlayer(player);
    io.emit("players:update", { players: getPlayers() });
    console.log(`[Admin] Player added: ${name}`);
  });

  socket.on("admin:removePlayer", ({ playerId }) => {
    removePlayer(playerId);
    io.emit("players:update", { players: getPlayers() });
    io.emit("teams:update", { teams: getTeams() });
    console.log(`[Admin] Player removed: ${playerId}`);
  });

  // --- Admin: Captain Management ---
  socket.on("admin:setCaptain", ({ teamId, captainName }) => {
    if (!teamId || !captainName) {
      socket.emit("error", {
        message: "Team ID and captain name are required",
      });
      return;
    }
    const result = setCaptain(teamId, captainName);
    if (result.error) {
      socket.emit("error", { message: result.error });
      return;
    }
    io.emit("teams:update", { teams: getTeams() });
    console.log(`[Admin] Captain assigned: ${captainName} to team ${teamId}`);
  });

  socket.on("admin:regenerateCaptainPassword", ({ teamId }) => {
    const result = regenerateCaptainPassword(teamId);
    if (result.error) {
      socket.emit("error", { message: result.error });
      return;
    }
    io.emit("teams:update", { teams: getTeams() });
    console.log(`[Admin] Captain password regenerated for team ${teamId}`);
  });

  // --- Admin: Pre-Auction Player Management ---
  socket.on("admin:addPrePlayer", ({ teamId, playerId }) => {
    const result = addPrePlayer(teamId, playerId);
    if (result.error) {
      socket.emit("error", { message: result.error });
      return;
    }
    io.emit("teams:update", { teams: getTeams() });
    io.emit("players:update", { players: getPlayers() });
    console.log(`[Admin] Pre-added player ${playerId} to team ${teamId}`);
  });

  socket.on("admin:removePrePlayer", ({ teamId, playerId }) => {
    const result = removePrePlayer(teamId, playerId);
    if (result.error) {
      socket.emit("error", { message: result.error });
      return;
    }
    io.emit("teams:update", { teams: getTeams() });
    io.emit("players:update", { players: getPlayers() });
    console.log(`[Admin] Removed pre-added player ${playerId} from team ${teamId}`);
  });

  // --- Admin: Purse Adjustment ---
  socket.on("admin:adjustPurse", ({ teamId, newRemaining }) => {
    const result = updateTeamPurse(teamId, newRemaining);
    if (result.error) {
      socket.emit("error", { message: result.error });
      return;
    }
    io.emit("teams:update", { teams: getTeams() });
    console.log(`[Admin] Purse adjusted for team ${teamId}: ₹${newRemaining}`);
  });

  // --- Admin: Roster Lock ---
  socket.on("admin:lockRoster", () => {
    updateSettings({ rosterLocked: true });
    io.emit("settings:update", { settings: getSettings() });
    console.log("[Admin] Roster locked");
  });

  socket.on("admin:unlockRoster", () => {
    updateSettings({ rosterLocked: false });
    io.emit("settings:update", { settings: getSettings() });
    console.log("[Admin] Roster unlocked");
  });

  // --- Admin: Undo Last Sold ---
  socket.on("admin:undoLastSold", () => {
    const result = undoLastSold();
    if (result.error) {
      socket.emit("error", { message: result.error });
      return;
    }
    io.emit("teams:update", { teams: getTeams() });
    io.emit("players:update", { players: getPlayers() });
    io.emit("auction:update", { auction: getAuction() });
    console.log(`[Admin] Undo last sold: ${result.player.name}`);
  });

  // --- Admin: Auction Controls ---
  socket.on("admin:startAuction", () => {
    const result = startPlayerAuction(io);
    if (result.error) {
      socket.emit("error", { message: result.error });
      return;
    }

    io.emit("auction:playerUp", {
      player: result.player,
      auction: result.auction,
    });
    io.emit("auction:update", { auction: result.auction });
    console.log(`[Auction] Player up: ${result.player.name}`);
  });

  socket.on("admin:nextPlayer", () => {
    const result = startPlayerAuction(io);
    if (result.error) {
      socket.emit("error", { message: result.error });
      return;
    }

    io.emit("auction:playerUp", {
      player: result.player,
      auction: result.auction,
    });
    io.emit("auction:update", { auction: result.auction });
    console.log(`[Auction] Next player: ${result.player.name}`);
  });

  socket.on("admin:markSold", () => {
    const result = markSold(io);
    if (result.error) {
      socket.emit("error", { message: result.error });
      return;
    }

    io.emit("auction:sold", {
      player: result.player,
      team: result.team,
      price: result.price,
    });
    io.emit("auction:update", { auction: getAuction() });
    io.emit("teams:update", { teams: getTeams() });
    io.emit("players:update", { players: getPlayers() });
    console.log(
      `[Auction] SOLD: ${result.player.name} to ${result.team.name} for ₹${result.price}`,
    );
  });

  socket.on("admin:markUnsold", () => {
    const result = markUnsold(io);
    if (result.error) {
      socket.emit("error", { message: result.error });
      return;
    }

    io.emit("auction:unsold", { player: result.player });
    io.emit("auction:update", { auction: getAuction() });
    io.emit("players:update", { players: getPlayers() });
    console.log(`[Auction] UNSOLD: ${result.player.name}`);
  });

  socket.on("admin:pauseAuction", () => {
    const result = pauseAuction();
    if (result.error) {
      socket.emit("error", { message: result.error });
      return;
    }
    io.emit("auction:paused", {});
    io.emit("auction:update", { auction: getAuction() });
    console.log("[Auction] Paused");
  });

  socket.on("admin:resumeAuction", () => {
    const result = resumeAuction(io);
    if (result.error) {
      socket.emit("error", { message: result.error });
      return;
    }
    io.emit("auction:resumed", { timer: getAuction().timer });
    io.emit("auction:update", { auction: getAuction() });
    console.log("[Auction] Resumed");
  });

  socket.on("admin:resetAuction", () => {
    stopTimer();
    resetState();
    io.emit("auction:reset", {});
    io.emit("state:init", getState());
    console.log("[Admin] Full auction reset");
  });

  socket.on("admin:removeAllTeams", () => {
    removeAllTeams();
    io.emit("teams:update", { teams: getTeams() });
    console.log("[Admin] All teams removed");
  });

  socket.on("admin:removeAllPlayers", () => {
    removeAllPlayers();
    io.emit("players:update", { players: getPlayers() });
    io.emit("teams:update", { teams: getTeams() });
    console.log("[Admin] All players removed");
  });

  socket.on("admin:endAuction", () => {
    const result = endAuction();
    io.emit("auction:ended", {});
    io.emit("auction:update", { auction: result.auction });
    console.log("[Auction] Ended manually by admin");
  });

  socket.on("admin:updateSettings", (updates) => {
    updateSettings(updates);
    io.emit("settings:update", { settings: getSettings() });
    console.log("[Admin] Settings updated:", updates);
  });

  // --- Captain: Bidding ---
  socket.on("captain:bid", ({ teamId, bidAmount }) => {
    if (!teamId) {
      socket.emit("error", { message: "Team ID is required" });
      return;
    }

    const result = placeBid(teamId, io, bidAmount);
    if (result.error) {
      socket.emit("error", { message: result.error });
      return;
    }

    io.emit("auction:bidPlaced", {
      bidEntry: result.bidEntry,
      auction: result.auction,
    });
    io.emit("auction:update", { auction: result.auction });
    console.log(
      `[Bid] ${result.bidEntry.teamName} bid ₹${result.bidEntry.amount}`,
    );
  });

  // --- Captain: Pre-Auction Player Management ---
  socket.on("captain:addPrePlayer", ({ teamId, playerId }) => {
    const settings = getSettings();
    if (settings.rosterLocked) {
      socket.emit("error", { message: "Roster is locked by admin" });
      return;
    }
    const result = addPrePlayer(teamId, playerId);
    if (result.error) {
      socket.emit("error", { message: result.error });
      return;
    }
    io.emit("teams:update", { teams: getTeams() });
    io.emit("players:update", { players: getPlayers() });
    console.log(`[Captain] Pre-added player ${playerId} to team ${teamId}`);
  });

  socket.on("captain:removePrePlayer", ({ teamId, playerId }) => {
    const settings = getSettings();
    if (settings.rosterLocked) {
      socket.emit("error", { message: "Roster is locked by admin" });
      return;
    }
    const result = removePrePlayer(teamId, playerId);
    if (result.error) {
      socket.emit("error", { message: result.error });
      return;
    }
    io.emit("teams:update", { teams: getTeams() });
    io.emit("players:update", { players: getPlayers() });
    console.log(`[Captain] Removed pre-added player ${playerId} from team ${teamId}`);
  });

  // --- Stats ---
  socket.on("admin:getStats", () => {
    socket.emit("stats:update", getAuctionStats());
  });

  // --- Disconnect ---
  socket.on("disconnect", () => {
    const client = connectedClients.get(socket.id);
    connectedClients.delete(socket.id);
    console.log(
      `[Socket] Client disconnected: ${socket.id}${client ? ` (${client.role})` : ""}`,
    );
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🏏 IPL Auction Server running on port ${PORT}`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Network: http://0.0.0.0:${PORT}\n`);
});
