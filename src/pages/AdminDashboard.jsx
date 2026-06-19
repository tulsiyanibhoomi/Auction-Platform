import { useState } from 'react';
import { useAuction } from '../context/AuctionContext';
import { formatCurrency } from '../utils/formatters';
import PlayerCard from '../components/PlayerCard';
import Timer from '../components/Timer';
import TeamCard from '../components/TeamCard';
import BidHistory from '../components/BidHistory';
import Scoreboard from '../components/Scoreboard';
import SoldOverlay from '../components/SoldOverlay';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const {
    teams, players, auction, settings, connected, currentPlayer, currentBidderTeam,
    emit, error, soldInfo, unsoldInfo, setSoldInfo, setUnsoldInfo,
  } = useAuction();

  // Form states
  const [teamForm, setTeamForm] = useState({ name: '', shortName: '', color: '#F59E0B', purse: '' });
  const [playerForm, setPlayerForm] = useState({ name: '', role: 'Batsman', basePrice: '' });
  const [activeTab, setActiveTab] = useState('auction');
  const [showEndModal, setShowEndModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  const handleAddTeam = (e) => {
    e.preventDefault();
    emit('admin:addTeam', {
      ...teamForm,
      purse: teamForm.purse ? Number(teamForm.purse) : settings.defaultPurse,
    });
    setTeamForm({ name: '', shortName: '', color: '#F59E0B', purse: '' });
  };

  const handleAddPlayer = (e) => {
    e.preventDefault();
    emit('admin:addPlayer', {
      ...playerForm,
      basePrice: Number(playerForm.basePrice),
    });
    setPlayerForm({ name: '', role: 'Batsman', basePrice: '' });
  };

  const soldCount = auction.soldPlayers?.length || 0;
  const unsoldCount = auction.unsoldPlayers?.length || 0;
  const remaining = players.length - soldCount - unsoldCount;

  return (
    <div className="admin">
      {/* Sold/Unsold Overlay */}
      <SoldOverlay
        soldInfo={soldInfo}
        unsoldInfo={unsoldInfo}
        onDismiss={() => { setSoldInfo(null); setUnsoldInfo(null); }}
      />

      {/* Header */}
      <header className="admin__header">
        <div className="admin__header-left">
          <a href="/" className="admin__back">← Home</a>
          <h1 className="admin__title">🎛️ Auction Control Center</h1>
        </div>
        <div className="admin__header-right">
          <span className={`status-dot ${connected ? 'online' : 'offline'}`} />
          <span className="admin__status-text">{connected ? 'Live' : 'Offline'}</span>
          <span className="badge badge-gold">{auction.status?.toUpperCase()}</span>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="admin__tabs">
        {['auction', 'teams', 'players', 'stats'].map((tab) => (
          <button
            key={tab}
            className={`admin__tab ${activeTab === tab ? 'admin__tab--active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'auction' && '🏏 '}
            {tab === 'teams' && '👥 '}
            {tab === 'players' && '🎯 '}
            {tab === 'stats' && '📊 '}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>

      <div className="admin__content">
        {/* ===== AUCTION TAB ===== */}
        {activeTab === 'auction' && (
          <div className="admin__auction">
            {/* Controls */}
            <div className="admin__controls card">
              <h3 className="admin__section-title">Auction Controls</h3>
              <div className="admin__controls-grid">
                <button
                  className="btn btn-gold"
                  onClick={() => emit(auction.status === 'idle' ? 'admin:startAuction' : 'admin:nextPlayer')}
                  disabled={players.length === 0 || auction.status === 'active' || auction.status === 'ended'}
                  id="start-auction-btn"
                >
                  {auction.status === 'idle' ? '▶ Start Auction' : '⏭ Next Player'}
                </button>
                {(auction.status === 'active' || auction.status === 'paused') && (
                  <>
                    <button
                      className="btn btn-green"
                      onClick={() => emit('admin:markSold')}
                      disabled={!auction.currentBidder || auction.status !== 'active'}
                      id="mark-sold-btn"
                    >
                      ✅ Mark SOLD
                    </button>
                    <button
                      className="btn btn-red"
                      onClick={() => emit('admin:markUnsold')}
                      disabled={!auction.currentPlayer || auction.status !== 'active'}
                      id="mark-unsold-btn"
                    >
                      ❌ Mark UNSOLD
                    </button>
                  </>
                )}
                {auction.status === 'active' ? (
                  <button className="btn btn-outline" onClick={() => emit('admin:pauseAuction')} id="pause-btn">
                    ⏸ Pause
                  </button>
                ) : auction.status === 'paused' ? (
                  <button className="btn btn-blue" onClick={() => emit('admin:resumeAuction')} id="resume-btn">
                    ▶ Resume
                  </button>
                ) : null}
                <button
                  className="btn btn-red"
                  onClick={() => setShowEndModal(true)}
                  disabled={auction.status === 'idle' || auction.status === 'ended'}
                  id="end-auction-btn"
                >
                  🛑 End Auction
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => setShowResetModal(true)}
                  id="reset-btn"
                >
                  🔄 Reset All
                </button>
              </div>
            </div>

            {/* Ended Summary View */}
            {auction.status === 'ended' ? (
              <div className="admin__ended-view">
                <div className="admin__ended-banner card">
                  <div className="admin__ended-icon">🏆</div>
                  <h2 className="admin__ended-title">Auction Complete</h2>
                  <p className="admin__ended-subtitle">Final results and team acquisitions</p>
                </div>

                {/* Final Stats Row */}
                <div className="admin__quick-stats">
                  <div className="admin__stat card">
                    <span className="admin__stat-value">{players.length}</span>
                    <span className="admin__stat-label">Total Players</span>
                  </div>
                  <div className="admin__stat card">
                    <span className="admin__stat-value" style={{ color: 'var(--accent-green)' }}>{soldCount}</span>
                    <span className="admin__stat-label">Sold</span>
                  </div>
                  <div className="admin__stat card">
                    <span className="admin__stat-value" style={{ color: 'var(--accent-red)' }}>{unsoldCount}</span>
                    <span className="admin__stat-label">Unsold</span>
                  </div>
                  <div className="admin__stat card">
                    <span className="admin__stat-value" style={{ color: 'var(--accent-gold)' }}>
                      {formatCurrency(teams.reduce((sum, t) => sum + ((t.purse || settings.defaultPurse) - t.remaining), 0))}
                    </span>
                    <span className="admin__stat-label">Total Spent</span>
                  </div>
                </div>

                {/* Team-wise Final Results */}
                <div className="admin__ended-teams-grid">
                  {teams.map(team => {
                    const spent = (team.purse || settings.defaultPurse) - team.remaining;
                    return (
                      <div key={team.id} className="admin__ended-team-card card" style={{ borderTop: `4px solid ${team.color}` }}>
                        <div className="admin__ended-team-header">
                          <div className="admin__ended-team-logo" style={{ background: team.color }}>{team.shortName}</div>
                          <div className="admin__ended-team-info">
                            <h3>{team.name}</h3>
                            <div className="admin__ended-team-meta">
                              <span>Spent: <strong style={{ color: 'var(--accent-gold)' }}>{formatCurrency(spent)}</strong></span>
                              <span>Remaining: <strong style={{ color: 'var(--accent-green)' }}>{formatCurrency(team.remaining)}</strong></span>
                            </div>
                          </div>
                        </div>
                        <div className="admin__ended-team-players">
                          {team.players && team.players.length > 0 ? (
                            team.players.map((p, idx) => (
                              <div key={p.id} className="admin__ended-player-row">
                                <span className="admin__ended-player-idx">{idx + 1}</span>
                                <span className="admin__ended-player-name">{p.name}</span>
                                <span className="admin__ended-player-role badge">{p.role || '—'}</span>
                                <span className="admin__ended-player-price">{formatCurrency(p.price)}</span>
                              </div>
                            ))
                          ) : (
                            <div className="admin__ended-no-players">No players purchased</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <>
                {/* Live View */}
                <div className="admin__live">
                  <div className="admin__live-main">
                    {currentPlayer ? (
                      <div className="admin__current-player card">
                        <h3 className="admin__section-title">Current Player</h3>
                        <PlayerCard player={currentPlayer} size="lg" animate />
                        <div className="admin__bid-info">
                          <div className="admin__bid-amount">
                            <span className="admin__bid-label">Current Bid</span>
                            <span className="admin__bid-value">{formatCurrency(auction.currentBid)}</span>
                          </div>
                          {currentBidderTeam && (
                            <div className="admin__bidder">
                              <span className="admin__bid-label">Highest Bidder</span>
                              <span className="admin__bidder-name" style={{ color: currentBidderTeam.color }}>
                                {currentBidderTeam.name}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="admin__current-player card">
                        <div className="empty-state">
                          <div className="empty-state-icon">🏏</div>
                          <p>No player on the block</p>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {players.length === 0 ? 'Add players first, then start the auction' : 'Click "Start Auction" or "Next Player"'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="admin__live-sidebar">
                    <div className="admin__timer-section card">
                      <Timer size="md" />
                    </div>
                    <div className="admin__history card">
                      <h3 className="admin__section-title">Bid History</h3>
                      <BidHistory bidHistory={auction.bidHistory} compact />
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="admin__quick-stats">
                  <div className="admin__stat card">
                    <span className="admin__stat-value">{players.length}</span>
                    <span className="admin__stat-label">Total Players</span>
                  </div>
                  <div className="admin__stat card">
                    <span className="admin__stat-value" style={{ color: 'var(--accent-green)' }}>{soldCount}</span>
                    <span className="admin__stat-label">Sold</span>
                  </div>
                  <div className="admin__stat card">
                    <span className="admin__stat-value" style={{ color: 'var(--accent-red)' }}>{unsoldCount}</span>
                    <span className="admin__stat-label">Unsold</span>
                  </div>
                  <div className="admin__stat card">
                    <span className="admin__stat-value" style={{ color: 'var(--accent-blue)' }}>{remaining}</span>
                    <span className="admin__stat-label">Remaining</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ===== TEAMS TAB ===== */}
        {activeTab === 'teams' && (
          <div className="admin__teams">
            {auction.status !== 'ended' && (
              <div className="admin__add-form card">
                <h3 className="admin__section-title">Add New Team</h3>
                <form onSubmit={handleAddTeam} className="admin__form-row">
                  <div className="form-group">
                    <label>Team Name</label>
                    <input
                      type="text"
                      placeholder="e.g., Royal Strikers"
                      value={teamForm.name}
                      onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                      required
                      id="team-name-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Short Code</label>
                    <input
                      type="text"
                      placeholder="e.g., RS"
                      maxLength={4}
                      value={teamForm.shortName}
                      onChange={(e) => setTeamForm({ ...teamForm, shortName: e.target.value })}
                      required
                      id="team-short-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Color</label>
                    <input
                      type="color"
                      value={teamForm.color}
                      onChange={(e) => setTeamForm({ ...teamForm, color: e.target.value })}
                      className="admin__color-input"
                      id="team-color-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Purse (₹)</label>
                    <input
                      type="number"
                      placeholder={settings.defaultPurse}
                      value={teamForm.purse}
                      onChange={(e) => setTeamForm({ ...teamForm, purse: e.target.value })}
                      id="team-purse-input"
                    />
                  </div>
                  <button type="submit" className="btn btn-gold" id="add-team-btn">+ Add Team</button>
                </form>
              </div>
            )}

            <div className="admin__teams-grid">
              {teams.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">👥</div>
                  <p>No teams added yet</p>
                </div>
              ) : (
                teams.map((team) => (
                  <div key={team.id} className="admin__team-wrapper">
                    <TeamCard team={team} />
                    {auction.status !== 'ended' && (
                      <button
                        className="btn btn-sm btn-outline admin__remove-btn"
                        onClick={() => emit('admin:removeTeam', { teamId: team.id })}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ===== PLAYERS TAB ===== */}
        {activeTab === 'players' && (
          <div className="admin__players">
            {auction.status !== 'ended' && (
              <div className="admin__add-form card">
                <h3 className="admin__section-title">Add New Player</h3>
                <form onSubmit={handleAddPlayer} className="admin__form-row">
                  <div className="form-group">
                    <label>Player Name</label>
                    <input
                      type="text"
                      placeholder="e.g., Virat Kohli"
                      value={playerForm.name}
                      onChange={(e) => setPlayerForm({ ...playerForm, name: e.target.value })}
                      required
                      id="player-name-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Role</label>
                    <select
                      value={playerForm.role}
                      onChange={(e) => setPlayerForm({ ...playerForm, role: e.target.value })}
                      id="player-role-select"
                    >
                      <option value="Batsman">Batsman</option>
                      <option value="Bowler">Bowler</option>
                      <option value="All-rounder">All-rounder</option>
                      <option value="Wicket-keeper">Wicket-keeper</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Base Price (₹) <span style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>(Optional, default 20L)</span></label>
                    <input
                      type="number"
                      placeholder={`e.g., ${settings.defaultBasePrice || 2000000}`}
                      value={playerForm.basePrice}
                      onChange={(e) => setPlayerForm({ ...playerForm, basePrice: e.target.value })}
                      id="player-price-input"
                    />
                  </div>
                  <button type="submit" className="btn btn-gold" id="add-player-btn">+ Add Player</button>
                </form>
              </div>
            )}

            <div className="admin__players-list">
              {players.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🎯</div>
                  <p>No players added yet</p>
                </div>
              ) : (
                <div className="admin__players-grid">
                  {players.map((player) => (
                    <div key={player.id} className="admin__player-wrapper">
                      <PlayerCard player={player} size="sm" />
                      <div className="admin__player-meta">
                        <span className={`badge ${player.status === 'sold' ? 'badge-green' : player.status === 'unsold' ? 'badge-red' : 'badge-blue'}`}>
                          {player.status}
                        </span>
                        <span className="admin__player-price">{formatCurrency(player.basePrice)}</span>
                      </div>
                      {player.status === 'available' && auction.status !== 'ended' && (
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => emit('admin:removePlayer', { playerId: player.id })}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== STATS TAB ===== */}
        {activeTab === 'stats' && (
          <div className="admin__stats-tab">
            <Scoreboard teams={teams} />
            <div className="admin__top-buys card">
              <h3 className="admin__section-title">🏆 Top Buys</h3>
              <div className="admin__top-buys-list">
                {players
                  .filter((p) => p.status === 'sold' && p.soldPrice)
                  .sort((a, b) => b.soldPrice - a.soldPrice)
                  .slice(0, 10)
                  .map((p, i) => {
                    const team = teams.find((t) => t.id === p.soldTo);
                    return (
                      <div key={p.id} className="admin__top-buy-item">
                        <span className="admin__top-buy-rank">#{i + 1}</span>
                        <span className="admin__top-buy-name">{p.name}</span>
                        <span className="admin__top-buy-team" style={{ color: team?.color }}>
                          {team?.shortName}
                        </span>
                        <span className="admin__top-buy-price">{formatCurrency(p.soldPrice)}</span>
                      </div>
                    );
                  })}
                {!players.some((p) => p.status === 'sold') && (
                  <div className="empty-state">
                    <p>No players sold yet</p>
                  </div>
                )}
              </div>
            </div>

            <div className="admin__team-summary card">
              <h3 className="admin__section-title">📊 Team-wise Summary</h3>
              <div className="admin__team-summary-grid">
                {teams.length === 0 ? (
                  <div className="empty-state">
                    <p>No teams added yet</p>
                  </div>
                ) : (
                  teams.map(team => {
                    const spent = (team.purse || settings.defaultPurse) - team.remaining;
                    return (
                      <div key={team.id} className="admin__team-summary-card" style={{ borderTop: `4px solid ${team.color}` }}>
                        <div className="admin__team-summary-header">
                          <h4>{team.name} ({team.shortName})</h4>
                          <span className="admin__team-summary-purse">Purse Left: {formatCurrency(team.remaining)}</span>
                        </div>
                        <div className="admin__team-summary-stats">
                          <span>Players: {team.players?.length || 0}</span>
                          <span>Spent: {formatCurrency(spent)}</span>
                        </div>
                        <div className="admin__team-summary-players">
                          {team.players && team.players.length > 0 ? (
                            team.players.map(p => (
                              <div key={p.id} className="admin__team-summary-player">
                                <span>{p.name}</span>
                                <span>{formatCurrency(p.price)}</span>
                              </div>
                            ))
                          ) : (
                            <div className="admin__team-summary-empty">No players yet</div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* End Auction Modal */}
      {showEndModal && (
        <div className="admin__modal-overlay">
          <div className="admin__modal card">
            <h3 className="admin__modal-title">End Auction?</h3>
            <p className="admin__modal-message">Are you sure you want to officially end the auction? This action cannot be undone.</p>
            <div className="admin__modal-actions">
              <button className="btn btn-outline" onClick={() => setShowEndModal(false)}>Cancel</button>
              <button 
                className="btn btn-red" 
                onClick={() => {
                  emit('admin:endAuction');
                  setShowEndModal(false);
                }}
              >
                Yes, End Auction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Auction Modal */}
      {showResetModal && (
        <div className="admin__modal-overlay">
          <div className="admin__modal card" style={{ border: '1px solid var(--accent-red)' }}>
            <h3 className="admin__modal-title" style={{ color: 'var(--accent-red)' }}>Reset Auction?</h3>
            <p className="admin__modal-message">Are you absolutely sure you want to reset the entire auction? All teams, players, and bids will be permanently deleted.</p>
            <div className="admin__modal-actions">
              <button className="btn btn-outline" onClick={() => setShowResetModal(false)}>Cancel</button>
              <button 
                className="btn btn-red" 
                onClick={() => {
                  emit('admin:resetAuction');
                  setShowResetModal(false);
                }}
              >
                Yes, Reset All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && <div className="error-toast">{error}</div>}
    </div>
  );
}
