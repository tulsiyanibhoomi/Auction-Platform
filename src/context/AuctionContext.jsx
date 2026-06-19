import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import socket from '../socket';

const AuctionContext = createContext(null);

export function AuctionProvider({ children }) {
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [auction, setAuction] = useState({
    status: 'idle',
    currentPlayer: null,
    currentBid: 0,
    currentBidder: null,
    bidHistory: [],
    timer: 15,
    increment: 500000,
    soldPlayers: [],
    unsoldPlayers: [],
    round: 1,
  });
  const [settings, setSettings] = useState({
    defaultPurse: 10000000,
    timerDuration: 15,
    defaultIncrement: 500000,
  });
  const [connected, setConnected] = useState(socket.connected);
  const [lastEvent, setLastEvent] = useState(null);
  const [error, setError] = useState(null);

  // Track overlay states
  const [soldInfo, setSoldInfo] = useState(null);
  const [unsoldInfo, setUnsoldInfo] = useState(null);

  useEffect(() => {
    // Connection events
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    // Initial state sync
    const onStateInit = (state) => {
      setTeams(state.teams || []);
      setPlayers(state.players || []);
      setAuction(state.auction || {});
      setSettings(state.settings || {});
    };

    // Granular updates
    const onTeamsUpdate = ({ teams }) => setTeams(teams);
    const onPlayersUpdate = ({ players }) => setPlayers(players);
    const onAuctionUpdate = ({ auction }) => setAuction((prev) => ({ ...prev, ...auction }));
    const onSettingsUpdate = ({ settings }) => setSettings(settings);

    // Timer tick - lightweight update
    const onTimerTick = ({ remaining }) => {
      setAuction((prev) => ({ ...prev, timer: remaining }));
    };

    // Auction events
    const onPlayerUp = ({ player, auction: auctionState }) => {
      setAuction((prev) => ({ ...prev, ...auctionState }));
      setSoldInfo(null);
      setUnsoldInfo(null);
      setLastEvent({ type: 'playerUp', player });
    };

    const onBidPlaced = ({ bidEntry, auction: auctionState }) => {
      setAuction((prev) => ({ ...prev, ...auctionState }));
      setLastEvent({ type: 'bid', bidEntry, timestamp: Date.now() });
    };

    const onSold = ({ player, team, price }) => {
      setSoldInfo({ player, team, price });
      setLastEvent({ type: 'sold', player, team, price });
    };

    const onUnsold = ({ player }) => {
      setUnsoldInfo({ player });
      setLastEvent({ type: 'unsold', player });
    };

    const onPaused = () => {
      setAuction((prev) => ({ ...prev, status: 'paused' }));
    };

    const onResumed = ({ timer }) => {
      setAuction((prev) => ({ ...prev, status: 'active', timer }));
    };

    const onEnded = () => {
      setAuction((prev) => ({ ...prev, status: 'ended' }));
    };

    const onReset = () => {
      setTeams([]);
      setPlayers([]);
      setAuction({
        status: 'idle',
        currentPlayer: null,
        currentBid: 0,
        currentBidder: null,
        bidHistory: [],
        timer: 15,
        increment: 500000,
        soldPlayers: [],
        unsoldPlayers: [],
        round: 1,
      });
      setSoldInfo(null);
      setUnsoldInfo(null);
      setLastEvent({ type: 'reset' });
    };

    const onError = ({ message }) => {
      setError(message);
      setTimeout(() => setError(null), 3000);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('state:init', onStateInit);
    socket.on('teams:update', onTeamsUpdate);
    socket.on('players:update', onPlayersUpdate);
    socket.on('auction:update', onAuctionUpdate);
    socket.on('settings:update', onSettingsUpdate);
    socket.on('auction:timerTick', onTimerTick);
    socket.on('auction:playerUp', onPlayerUp);
    socket.on('auction:bidPlaced', onBidPlaced);
    socket.on('auction:sold', onSold);
    socket.on('auction:unsold', onUnsold);
    socket.on('auction:paused', onPaused);
    socket.on('auction:resumed', onResumed);
    socket.on('auction:ended', onEnded);
    socket.on('auction:reset', onReset);
    socket.on('error', onError);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('state:init', onStateInit);
      socket.off('teams:update', onTeamsUpdate);
      socket.off('players:update', onPlayersUpdate);
      socket.off('auction:update', onAuctionUpdate);
      socket.off('settings:update', onSettingsUpdate);
      socket.off('auction:timerTick', onTimerTick);
      socket.off('auction:playerUp', onPlayerUp);
      socket.off('auction:bidPlaced', onBidPlaced);
      socket.off('auction:sold', onSold);
      socket.off('auction:unsold', onUnsold);
      socket.off('auction:paused', onPaused);
      socket.off('auction:resumed', onResumed);
      socket.off('auction:ended', onEnded);
      socket.off('auction:reset', onReset);
      socket.off('error', onError);
    };
  }, []);

  const emit = useCallback((event, data = {}) => {
    socket.emit(event, data);
  }, []);

  // Get current player object
  const currentPlayer = auction.currentPlayer
    ? players.find((p) => p.id === auction.currentPlayer) || null
    : null;

  // Get current bidder team
  const currentBidderTeam = auction.currentBidder
    ? teams.find((t) => t.id === auction.currentBidder) || null
    : null;

  const value = {
    teams,
    players,
    auction,
    settings,
    connected,
    lastEvent,
    error,
    soldInfo,
    unsoldInfo,
    currentPlayer,
    currentBidderTeam,
    emit,
    setSoldInfo,
    setUnsoldInfo,
  };

  return (
    <AuctionContext.Provider value={value}>
      {children}
    </AuctionContext.Provider>
  );
}

export function useAuction() {
  const ctx = useContext(AuctionContext);
  if (!ctx) throw new Error('useAuction must be used within AuctionProvider');
  return ctx;
}

export default AuctionContext;
