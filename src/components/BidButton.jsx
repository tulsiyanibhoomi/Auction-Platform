import { useState } from 'react';
import { useAuction } from '../context/AuctionContext';
import { formatCurrency } from '../utils/formatters';
import './BidButton.css';

export default function BidButton({ teamId }) {
  const { auction, teams, settings, emit, currentBidderTeam } = useAuction();
  const [ripple, setRipple] = useState(false);
  const [customBid, setCustomBid] = useState('');

  const team = teams.find((t) => t.id === teamId);
  const isActive = auction.status === 'active';
  const isHighestBidder = auction.currentBidder === teamId;
  const defaultNextBid = auction.currentBidder
    ? auction.currentBid + auction.increment
    : auction.currentBid;
  
  const nextBidAmount = customBid ? Number(customBid) : defaultNextBid;
  const canAfford = team && nextBidAmount <= team.remaining;
  const maxPlayers = settings?.maxPlayersPerTeam || 11;
  const totalRoster = (team?.captain ? 1 : 0) + (team?.players?.length || 0) + (team?.preAddedPlayers?.length || 0);
  const isRosterFull = totalRoster >= maxPlayers;
  const canBid = isActive && !isHighestBidder && canAfford && !isRosterFull && auction.currentPlayer && (!customBid || Number(customBid) > auction.currentBid);

  const handleBid = () => {
    if (!canBid) return;
    setRipple(true);
    setTimeout(() => setRipple(false), 600);
    emit('captain:bid', { teamId, bidAmount: customBid ? Number(customBid) : undefined });
    setCustomBid('');
  };

  const handleQuickBid = (increment) => {
    const base = auction.currentBidder ? auction.currentBid : auction.currentBid;
    setCustomBid(String(base + increment));
  };

  return (
    <div className="bid-button-wrapper">
      {isHighestBidder && (
        <div className="bid-status bid-status--leading">
          ✅ You are the HIGHEST BIDDER!
        </div>
      )}
      {!isHighestBidder && auction.currentBidder && isActive && (
        <div className="bid-status bid-status--outbid">
          ⚠️ Outbid by {currentBidderTeam?.name || 'another team'}!
        </div>
      )}

      {isActive && !isHighestBidder && (
        <div className="bid-controls">
          <div className="bid-quick-actions">
            <button className="btn-quick" onClick={() => handleQuickBid(500000)}>+5L</button>
            <button className="btn-quick" onClick={() => handleQuickBid(1000000)}>+10L</button>
            <button className="btn-quick" onClick={() => handleQuickBid(2000000)}>+20L</button>
            <button className="btn-quick btn-quick--clear" onClick={() => setCustomBid('')}>Reset</button>
          </div>
          <input
            type="number"
            className="bid-custom-input"
            placeholder={`Custom (min ${formatCurrency(defaultNextBid)})`}
            value={customBid}
            onChange={(e) => setCustomBid(e.target.value)}
          />
        </div>
      )}

      <button
        className={`bid-button ${ripple ? 'bid-button--ripple' : ''} ${isHighestBidder ? 'bid-button--leading' : ''}`}
        onClick={handleBid}
        disabled={!canBid}
        id="bid-action-button"
      >
        <span className="bid-button__label">
          {!isActive
            ? 'Waiting for Auction...'
            : isHighestBidder
            ? 'HIGHEST BID'
            : isRosterFull
            ? 'ROSTER FULL'
            : !canAfford
            ? 'INSUFFICIENT PURSE'
            : 'PLACE BID'}
        </span>
        <span className="bid-button__amount">
          {isActive ? formatCurrency(isHighestBidder ? auction.currentBid : nextBidAmount) : '—'}
        </span>
      </button>

      {team && (
        <div className="bid-purse-info">
          <span>Remaining Purse:</span>
          <span className="bid-purse-amount">{formatCurrency(team.remaining)}</span>
        </div>
      )}
    </div>
  );
}
