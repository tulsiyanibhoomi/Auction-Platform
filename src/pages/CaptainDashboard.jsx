import { useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuction } from '../context/AuctionContext';
import { formatCurrency } from '../utils/formatters';
import PlayerCard from '../components/PlayerCard';
import Timer from '../components/Timer';
import BidButton from '../components/BidButton';
import BidHistory from '../components/BidHistory';
import SoldOverlay from '../components/SoldOverlay';
import './CaptainDashboard.css';

export default function CaptainDashboard() {
  const { teamId } = useParams();
  const {
    teams, auction, currentPlayer, currentBidderTeam, connected, error,
    emit, soldInfo, unsoldInfo, setSoldInfo, setUnsoldInfo,
  } = useAuction();

  const decodedTeamId = decodeURIComponent(teamId);
  const team = teams.find((t) => t.id === decodedTeamId);

  useEffect(() => {
    if (team) {
      emit('join', { role: 'captain', teamName: team.name });
    }
  }, [team?.id]);

  if (!team) {
    return (
      <div className="captain">
        <div className="captain__loading">
          <div className="empty-state">
            <div className="empty-state-icon">⏳</div>
            <h2>Loading team...</h2>
            <p>Make sure the team exists and the server is running</p>
            <a href="/" className="btn btn-outline" style={{ marginTop: '16px' }}>← Back to Home</a>
          </div>
        </div>
      </div>
    );
  }

  const isMyBid = auction.currentBidder === team.id;

  return (
    <div className="captain" style={{ '--team-color': team.color }}>
      {/* Sold/Unsold Overlay */}
      <SoldOverlay
        soldInfo={soldInfo}
        unsoldInfo={unsoldInfo}
        onDismiss={() => { setSoldInfo(null); setUnsoldInfo(null); }}
      />

      {/* Header */}
      <header className="captain__header">
        <a href="/" className="captain__back">←</a>
        <div className="captain__team-info">
          <div className="captain__team-logo" style={{ background: team.color }}>
            {team.shortName}
          </div>
          <div className="captain__team-details">
            <h1 className="captain__team-name">{team.name}</h1>
            <span className="captain__purse">
              Purse: <strong>{formatCurrency(team.remaining)}</strong>
            </span>
          </div>
        </div>
        <div className="captain__connection">
          <span className={`status-dot ${connected ? 'online' : 'offline'}`} />
        </div>
      </header>

      {/* Main Content */}
      <main className="captain__main">
        {auction.status === 'ended' ? (
          <div className="captain__ended-summary animate-fade-in-scale">
            <div className="captain__ended-icon">🏆</div>
            <h2>Auction Ended</h2>
            <p>Here is your final squad summary.</p>
            
            <div className="captain__ended-stats">
              <div className="captain__stat-box">
                <span className="captain__stat-label">Total Players</span>
                <span className="captain__stat-value">{team.players?.length || 0}</span>
              </div>
              <div className="captain__stat-box">
                <span className="captain__stat-label">Total Spent</span>
                <span className="captain__stat-value">{formatCurrency((team.purse || 10000000) - team.remaining)}</span>
              </div>
              <div className="captain__stat-box">
                <span className="captain__stat-label">Remaining Purse</span>
                <span className="captain__stat-value" style={{ color: 'var(--accent-green)' }}>
                  {formatCurrency(team.remaining)}
                </span>
              </div>
            </div>

            <div className="captain__squad-grid">
              {team.players && team.players.length > 0 ? (
                team.players.map((p) => (
                  <div key={p.id} className="captain__squad-card">
                    <div className="captain__squad-card-name">{p.name}</div>
                    <div className="captain__squad-card-role badge">{p.role || 'Player'}</div>
                    <div className="captain__squad-card-price">{formatCurrency(p.price)}</div>
                  </div>
                ))
              ) : (
                <p className="captain__no-players">No players purchased.</p>
              )}
            </div>
          </div>
        ) : auction.status === 'idle' || !currentPlayer ? (
          <div className="captain__waiting">
            <div className="captain__waiting-icon">🏏</div>
            <h2>Waiting for Auction to Start</h2>
            <p>The admin will begin the auction shortly...</p>
            <div className="captain__waiting-pulse" />
          </div>
        ) : (
          <div className="captain__auction-view">
            {/* Player Card */}
            <div className="captain__player-section animate-fade-in-scale">
              <PlayerCard player={currentPlayer} size="lg" animate />
            </div>

            {/* Timer */}
            <div className="captain__timer-section">
              <Timer size="lg" />
            </div>

            {/* Current Bid Display */}
            <div className={`captain__current-bid ${isMyBid ? 'captain__current-bid--mine' : ''}`}>
              <span className="captain__bid-label">Current Bid</span>
              <span className="captain__bid-amount">{formatCurrency(auction.currentBid)}</span>
              {currentBidderTeam && (
                <span className="captain__bid-team" style={{ color: currentBidderTeam.color }}>
                  {currentBidderTeam.name}
                </span>
              )}
            </div>

            {/* Bid Button */}
            <div className="captain__bid-section">
              <BidButton teamId={team.id} />
            </div>

            {/* Bid History */}
            <div className="captain__history">
              <BidHistory bidHistory={auction.bidHistory} compact />
            </div>
          </div>
        )}
      </main>

      {/* My Squad */}
      {team.players && team.players.length > 0 && (
        <div className="captain__squad">
          <h3 className="captain__squad-title">My Squad ({team.players.length})</h3>
          <div className="captain__squad-list">
            {team.players.map((p) => (
              <div key={p.id} className="captain__squad-item">
                <span>{p.name}</span>
                <span className="captain__squad-price">{formatCurrency(p.price)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && <div className="error-toast">{error}</div>}

      {/* Disconnected banner */}
      {!connected && <div className="connection-banner">⚠️ Disconnected — Reconnecting...</div>}
    </div>
  );
}
