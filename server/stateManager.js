import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { randomBytes } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_FILE = join(__dirname, "state.json");

const DEFAULT_STATE = {
  teams: [],
  players: [],
  auction: {
    status: "idle", // idle | active | paused | sold | unsold
    currentPlayer: null,
    currentBid: 0,
    currentBidder: null,
    bidHistory: [],
    timer: 20,
    increment: 500000,
    soldPlayers: [],
    unsoldPlayers: [],
    round: 1,
    priorityQueue: [],
  },
  settings: {
    defaultPurse: 10000000,
    timerDuration: 20,
    defaultIncrement: 500000,
    defaultBasePrice: 2000000,
    maxPlayersPerTeam: 11,
    rosterLocked: false,
  },
};

let state = null;
let saveTimeout = null;

export function loadState() {
  try {
    if (existsSync(STATE_FILE)) {
      const raw = readFileSync(STATE_FILE, "utf-8");
      state = JSON.parse(raw);
      // Merge with defaults to handle missing fields after upgrades
      state = {
        ...DEFAULT_STATE,
        ...state,
        auction: { ...DEFAULT_STATE.auction, ...state.auction },
        settings: { ...DEFAULT_STATE.settings, ...state.settings },
      };
      // Ensure teams have new fields
      state.teams = state.teams.map((t) => ({
        captain: null,
        preAddedPlayers: [],
        ...t,
      }));
      console.log("[StateManager] Loaded state from state.json");
    } else {
      state = JSON.parse(JSON.stringify(DEFAULT_STATE));
      saveStateImmediate();
      console.log("[StateManager] Created new state.json");
    }
  } catch (err) {
    console.error(
      "[StateManager] Error loading state, resetting:",
      err.message,
    );
    state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    saveStateImmediate();
  }
  return state;
}

function saveStateImmediate() {
  try {
    writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.error("[StateManager] Error saving state:", err.message);
  }
}

export function saveState() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveStateImmediate();
  }, 100);
}

export function getState() {
  return state;
}

export function getTeams() {
  return state.teams;
}

export function getPlayers() {
  return state.players;
}

export function getAuction() {
  return state.auction;
}

export function getSettings() {
  return state.settings;
}

export function updateState(newState) {
  state = { ...state, ...newState };
  saveState();
  return state;
}

export function updateAuction(updates) {
  state.auction = { ...state.auction, ...updates };
  saveState();
  return state.auction;
}

export function updateSettings(updates) {
  state.settings = { ...state.settings, ...updates };
  saveState();
  return state.settings;
}

export function addTeam(team) {
  // Ensure new team has captain and preAddedPlayers fields
  if (!team.captain) team.captain = null;
  if (!team.preAddedPlayers) team.preAddedPlayers = [];
  state.teams.push(team);
  saveState();
  return state.teams;
}

export function removeTeam(teamId) {
  state.teams = state.teams.filter((t) => t.id !== teamId);
  saveState();
  return state.teams;
}

export function updateTeam(teamId, updates) {
  const idx = state.teams.findIndex((t) => t.id === teamId);
  if (idx !== -1) {
    state.teams[idx] = { ...state.teams[idx], ...updates };
    saveState();
  }
  return state.teams;
}

export function addPlayer(player) {
  state.players.push(player);
  saveState();
  return state.players;
}

export function removePlayer(playerId) {
  state.players = state.players.filter((p) => p.id !== playerId);
  // Also remove from any team's preAddedPlayers
  state.teams.forEach((t) => {
    if (t.preAddedPlayers) {
      t.preAddedPlayers = t.preAddedPlayers.filter((p) => p.id !== playerId);
    }
  });
  saveState();
  return state.players;
}

export function updatePlayer(playerId, updates) {
  const idx = state.players.findIndex((p) => p.id === playerId);
  if (idx !== -1) {
    state.players[idx] = { ...state.players[idx], ...updates };
    saveState();
  }
  return state.players;
}

export function resetState() {
  // Keep existing teams and players, but reset their auction-related stats
  state.teams = state.teams.map((t) => ({
    ...t,
    remaining: t.purse || state.settings.defaultPurse,
    players: [],
    // Preserve captain and preAddedPlayers on reset
    captain: t.captain || null,
    preAddedPlayers: t.preAddedPlayers || [],
  }));

  state.players = state.players.map((p) => {
    if (p.status === "pre-added") {
      return p;
    }
    return {
      ...p,
      status: "available",
      soldTo: null,
      soldPrice: null,
    };
  });

  // Reset auction state to default
  state.auction = JSON.parse(JSON.stringify(DEFAULT_STATE.auction));

  saveStateImmediate();
  console.log("[StateManager] Auction state reset (teams and players retained)");
  return state;
}

export function removeAllTeams() {
  state.teams = [];
  saveStateImmediate();
  console.log("[StateManager] All teams removed");
  return state.teams;
}

export function removeAllPlayers() {
  state.players = [];
  // Also clear preAddedPlayers from all teams
  state.teams.forEach((t) => {
    t.preAddedPlayers = [];
  });
  saveStateImmediate();
  console.log("[StateManager] All players removed");
  return state.players;
}

export function getTeamById(teamId) {
  return state.teams.find((t) => t.id === teamId) || null;
}

export function getPlayerById(playerId) {
  return state.players.find((p) => p.id === playerId) || null;
}

// ===== Captain Management =====

function generatePassword() {
  return randomBytes(4).toString("hex"); // 8-char hex string
}

export function setCaptain(teamId, captainName) {
  const team = getTeamById(teamId);
  if (!team) return { error: "Team not found" };

  const password = generatePassword();
  team.captain = { name: captainName, password };
  saveState();
  console.log(`[StateManager] Captain set for ${team.name}: ${captainName}`);
  return { captain: team.captain };
}

export function regenerateCaptainPassword(teamId) {
  const team = getTeamById(teamId);
  if (!team) return { error: "Team not found" };
  if (!team.captain) return { error: "No captain assigned" };

  team.captain.password = generatePassword();
  saveState();
  console.log(`[StateManager] Password regenerated for captain of ${team.name}`);
  return { captain: team.captain };
}

// ===== Pre-Auction Player Management =====

export function addPrePlayer(teamId, playerId) {
  const team = getTeamById(teamId);
  if (!team) return { error: "Team not found" };

  const player = getPlayerById(playerId);
  if (!player) return { error: "Player not found" };

  // Check if player is available
  if (player.status !== "available") {
    return { error: "Player is not available" };
  }

  // Check if player is already pre-added to any team
  for (const t of state.teams) {
    if (t.preAddedPlayers && t.preAddedPlayers.some((p) => p.id === playerId)) {
      return { error: `Player already assigned to ${t.name}` };
    }
  }

  // Check max players per team
  const maxPlayers = state.settings.maxPlayersPerTeam;
  const totalPlayers = (team.captain ? 1 : 0) + (team.players?.length || 0) + (team.preAddedPlayers?.length || 0);
  if (totalPlayers >= maxPlayers) {
    return { error: `Team has reached maximum size (${maxPlayers})` };
  }

  if (!team.preAddedPlayers) team.preAddedPlayers = [];
  team.preAddedPlayers.push({
    id: player.id,
    name: player.name,
    role: player.role,
  });

  // Mark player as pre-added
  updatePlayer(playerId, { status: "pre-added", soldTo: teamId });

  saveState();
  console.log(`[StateManager] Pre-added ${player.name} to ${team.name}`);
  return { team, player };
}

export function removePrePlayer(teamId, playerId) {
  const team = getTeamById(teamId);
  if (!team) return { error: "Team not found" };

  if (!team.preAddedPlayers) return { error: "No pre-added players" };

  const idx = team.preAddedPlayers.findIndex((p) => p.id === playerId);
  if (idx === -1) return { error: "Player not found in pre-added list" };

  team.preAddedPlayers.splice(idx, 1);

  // Reset player status back to available
  updatePlayer(playerId, { status: "available", soldTo: null });

  saveState();
  console.log(`[StateManager] Removed pre-added player ${playerId} from ${team.name}`);
  return { team };
}

// ===== Purse Adjustment =====

export function updateTeamPurse(teamId, newRemaining) {
  const team = getTeamById(teamId);
  if (!team) return { error: "Team not found" };

  team.remaining = Number(newRemaining);
  saveState();
  console.log(`[StateManager] Purse adjusted for ${team.name}: ₹${newRemaining}`);
  return { team };
}
