import { useEffect } from 'react';
import { useAuction } from '../context/AuctionContext';
import { formatCurrency } from '../utils/formatters';
import PlayerCard from '../components/PlayerCard';
import Timer from '../components/Timer';
import BidHistory from '../components/BidHistory';
import Scoreboard from '../components/Scoreboard';
import SoldOverlay from '../components/SoldOverlay';
import './DisplayScreen.css';

export default function DisplayScreen() {
  const {
    teams, auction, currentPlayer, currentBidderTeam, connected,
    emit, soldInfo, unsoldInfo, setSoldInfo, setUnsoldInfo, players
  } = useAuction();

  useEffect(() => {
    emit('join', { role: 'display' });
  }, []);

  const getRecentSales = () => {
    return players
      .filter((p) => p.status === 'sold')
      .reverse()
      .slice(0, 5);
  };

  return (
    <div className="display">
      {/* Sold/Unsold Overlay */}
      <SoldOverlay
        soldInfo={soldInfo}
        unsoldInfo={unsoldInfo}
        onDismiss={() => { setSoldInfo(null); setUnsoldInfo(null); }}
      />

      {/* Header */}
      <header className="display__header">
        <div className="display__logo">🏏 IPL MEGA AUCTION 2026</div>
        <div className="display__round">ROUND {auction.round}</div>
        <div className="display__connection">
          <span className={`status-dot ${connected ? 'online' : 'offline'}`} style={{ width: '12px', height: '12px' }} />
          {connected ? 'LIVE' : 'OFFLINE'}
        </div>
      </header>

      {/* Main Content */}
      <main className="display__main">
        {/* Left: Player & Bidding */}
        <div className="display__center">
          {auction.status === 'idle' || !currentPlayer ? (
            <div className="display__waiting">
              <div className="display__waiting-logo">IPL MEGA AUCTION</div>
              <div className="display__waiting-text">GET READY FOR THE NEXT BIDDING WAR</div>
            </div>
          ) : (
            <>
              {/* Player Card (Massive) */}
              <div className="display__player-wrap animate-fade-in-scale">
                <PlayerCard player={currentPlayer} size="xl" animate />
              </div>

              {/* Current Bid Display */}
              <div className="display__bid-area">
                <div className="display__bid-title">CURRENT BID</div>
                <div className="display__bid-amount animate-count-up">
                  {formatCurrency(auction.currentBid)}
                </div>
                {currentBidderTeam ? (
                  <div className="display__bid-team" style={{ color: currentBidderTeam.color }}>
                    {currentBidderTeam.name}
                  </div>
                ) : (
                  <div className="display__bid-team" style={{ color: 'var(--text-muted)' }}>
                    WAITING FOR BIDS...
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right: Sidebar (Timer, History, Teams) */}
        <div className="display__sidebar">
          {currentPlayer && auction.status !== 'idle' && (
            <div className="display__timer-wrap">
              <Timer size="xl" />
            </div>
          )}

          {currentPlayer && auction.bidHistory.length > 0 && (
            <div className="display__history-wrap card">
              <h3 className="display__section-title">LATEST BIDS</h3>
              <BidHistory bidHistory={auction.bidHistory} />
            </div>
          )}

          <div className="display__teams-wrap">
            <Scoreboard teams={teams} compact />
          </div>
        </div>
      </main>

      {/* Footer Ticker */}
      <footer className="display__ticker">
        <div className="display__ticker-label">RECENT SALES</div>
        <div className="display__ticker-content">
          <div className="display__ticker-scroll">
            {getRecentSales().length > 0 ? (
              getRecentSales().map((p) => {
                const team = teams.find((t) => t.id === p.soldTo);
                return (
                  <div key={p.id} className="display__ticker-item">
                    <span className="display__ticker-name">{p.name}</span>
                    <span className="display__ticker-team" style={{ color: team?.color }}>
                      {team?.shortName}
                    </span>
                    <span className="display__ticker-price">{formatCurrency(p.soldPrice)}</span>
                  </div>
                );
              })
            ) : (
              <span className="display__ticker-empty">NO RECENT SALES</span>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
