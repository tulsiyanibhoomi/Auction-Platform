import {
  getState,
  getAuction,
  getTeams,
  getPlayers,
  getSettings,
  updateAuction,
  updatePlayer,
  updateTeam,
  getTeamById,
  getPlayerById,
  saveState,
} from './stateManager.js';

let timerInterval = null;

export function pickNextPlayer() {
  let players = getPlayers();
  let auction = getAuction();
  let available = players.filter(
    (p) =>
      p.status === 'available' &&
      !auction.soldPlayers.includes(p.id) &&
      !auction.unsoldPlayers.includes(p.id)
  );

  if (available.length === 0) {
    // Check if there are unsold players to relist for a second round
    if (auction.unsoldPlayers.length > 0) {
      // Reset each unsold player's status back to 'available'
      auction.unsoldPlayers.forEach(id => updatePlayer(id, { status: 'available' }));
      // Clear the unsoldPlayers list
      updateAuction({ unsoldPlayers: [], round: (auction.round || 1) + 1 });
      // Re-read fresh state after mutations
      players = getPlayers();
      auction = getAuction();
      available = players.filter(
        (p) =>
          p.status === 'available' &&
          !auction.soldPlayers.includes(p.id) &&
          !auction.unsoldPlayers.includes(p.id)
      );
    }
    if (available.length === 0) {
      return null;
    }
  }

  return available[0];
}

export function startPlayerAuction(io) {
  const player = pickNextPlayer();
  if (!player) return { error: 'No more players available' };

  const settings = getSettings();
  stopTimer();

  updateAuction({
    status: 'active',
    currentPlayer: player.id,
    currentBid: player.basePrice,
    currentBidder: null,
    bidHistory: [],
    timer: settings.timerDuration,
    increment: settings.defaultIncrement,
  });

  startTimer(io);

  return {
    player,
    auction: getAuction(),
  };
}

export function placeBid(teamId, io, customBidAmount) {
  const auction = getAuction();
  const settings = getSettings();

  if (auction.status !== 'active') {
    return { error: 'Auction is not active' };
  }

  if (auction.currentBidder === teamId) {
    return { error: 'You are already the highest bidder' };
  }

  const team = getTeamById(teamId);
  if (!team) return { error: 'Team not found' };

  let bidAmount = auction.currentBidder
    ? auction.currentBid + auction.increment
    : auction.currentBid;
    
  if (customBidAmount) {
    if (customBidAmount <= auction.currentBid) {
      return { error: 'Bid amount must be higher than current bid' };
    }
    bidAmount = customBidAmount;
  }

  if (bidAmount > team.remaining) {
    return { error: 'Insufficient purse balance' };
  }

  const bidEntry = {
    teamId,
    teamName: team.name,
    teamColor: team.color,
    amount: bidAmount,
    timestamp: Date.now(),
  };

  updateAuction({
    currentBid: bidAmount,
    currentBidder: teamId,
    bidHistory: [...auction.bidHistory, bidEntry],
    timer: settings.timerDuration,
  });

  // Reset timer on every bid
  stopTimer();
  startTimer(io);

  return {
    bidEntry,
    auction: getAuction(),
  };
}

export function markSold(io) {
  const auction = getAuction();

  if (!auction.currentPlayer) {
    return { error: 'No player currently being auctioned' };
  }

  if (!auction.currentBidder) {
    return { error: 'No bids placed yet' };
  }

  stopTimer();

  const player = getPlayerById(auction.currentPlayer);
  const team = getTeamById(auction.currentBidder);

  if (!player || !team) {
    return { error: 'Player or team not found' };
  }

  // Update player
  updatePlayer(player.id, {
    status: 'sold',
    soldTo: team.id,
    soldPrice: auction.currentBid,
  });

  // Update team
  updateTeam(team.id, {
    remaining: team.remaining - auction.currentBid,
    players: [...team.players, { id: player.id, name: player.name, role: player.role, price: auction.currentBid }],
  });

  // Update auction state
  updateAuction({
    status: 'sold',
    soldPlayers: [...auction.soldPlayers, player.id],
  });

  return {
    player: { ...player, soldTo: team.id, soldPrice: auction.currentBid },
    team: { ...team, remaining: team.remaining - auction.currentBid },
    price: auction.currentBid,
  };
}

export function markUnsold(io) {
  const auction = getAuction();

  if (!auction.currentPlayer) {
    return { error: 'No player currently being auctioned' };
  }

  stopTimer();

  const player = getPlayerById(auction.currentPlayer);
  if (!player) return { error: 'Player not found' };

  updatePlayer(player.id, { status: 'unsold' });

  updateAuction({
    status: 'unsold',
    unsoldPlayers: [...auction.unsoldPlayers, player.id],
  });

  return { player };
}

export function pauseAuction() {
  const auction = getAuction();
  if (auction.status !== 'active') {
    return { error: 'Auction is not active' };
  }

  stopTimer();
  updateAuction({ status: 'paused' });
  return { auction: getAuction() };
}

export function resumeAuction(io) {
  const auction = getAuction();
  if (auction.status !== 'paused') {
    return { error: 'Auction is not paused' };
  }

  updateAuction({ status: 'active' });
  startTimer(io);
  return { auction: getAuction() };
}

export function endAuction() {
  stopTimer();
  updateAuction({ status: 'ended' });
  return { auction: getAuction() };
}

function startTimer(io) {
  stopTimer();
  timerInterval = setInterval(() => {
    const auction = getAuction();
    if (auction.status !== 'active') {
      stopTimer();
      return;
    }

    const newTime = auction.timer - 1;

    if (newTime <= 0) {
      stopTimer();
      updateAuction({ timer: 0 });
      io.emit('auction:timerTick', { remaining: 0 });

      // Auto-trigger sold or unsold when timer expires
      if (auction.currentBidder) {
        const result = markSold(io);
        if (!result.error) {
          io.emit('auction:sold', {
            player: result.player,
            team: result.team,
            price: result.price,
          });
          io.emit('teams:update', { teams: getTeams() });
          io.emit('players:update', { players: getPlayers() });
        }
      } else {
        const result = markUnsold(io);
        if (!result.error) {
          io.emit('auction:unsold', { player: result.player });
          io.emit('players:update', { players: getPlayers() });
        }
      }
      io.emit('auction:update', { auction: getAuction() });
      return;
    }

    updateAuction({ timer: newTime });
    io.emit('auction:timerTick', { remaining: newTime });
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

export function getRemainingPlayers() {
  const players = getPlayers();
  const auction = getAuction();
  return players.filter(
    (p) =>
      p.status === 'available' &&
      !auction.soldPlayers.includes(p.id) &&
      !auction.unsoldPlayers.includes(p.id)
  ).length;
}

export function getAuctionStats() {
  const teams = getTeams();
  const players = getPlayers();
  const auction = getAuction();

  const totalPlayers = players.length;
  const soldCount = auction.soldPlayers.length;
  const unsoldCount = auction.unsoldPlayers.length;
  const remaining = totalPlayers - soldCount - unsoldCount;
  const totalSpent = teams.reduce((sum, t) => {
    const defaultPurse = getSettings().defaultPurse;
    return sum + (defaultPurse - t.remaining);
  }, 0);

  const topBuys = players
    .filter((p) => p.status === 'sold' && p.soldPrice)
    .sort((a, b) => b.soldPrice - a.soldPrice)
    .slice(0, 5);

  return {
    totalPlayers,
    soldCount,
    unsoldCount,
    remaining,
    totalSpent,
    topBuys,
  };
}

export { stopTimer };
