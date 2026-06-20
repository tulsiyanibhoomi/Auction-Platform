import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

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
  },
  settings: {
    defaultPurse: 10000000,
    timerDuration: 20,
    defaultIncrement: 500000,
    defaultBasePrice: 2000000,
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
  }));

  state.players = state.players.map((p) => ({
    ...p,
    status: "available",
    soldTo: null,
    soldPrice: null,
  }));

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
