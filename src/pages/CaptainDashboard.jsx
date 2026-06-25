import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuction } from "../context/AuctionContext";
import { formatCurrency } from "../utils/formatters";
import PlayerCard from "../components/PlayerCard";
import Timer from "../components/Timer";
import BidButton from "../components/BidButton";
import BidHistory from "../components/BidHistory";
import SoldOverlay from "../components/SoldOverlay";
import "./CaptainDashboard.css";

export default function CaptainDashboard() {
  const { teamId } = useParams();
  const {
    teams,
    players,
    auction,
    settings,
    currentPlayer,
    currentBidderTeam,
    connected,
    error,
    emit,
    soldInfo,
    unsoldInfo,
    setSoldInfo,
    setUnsoldInfo,
  } = useAuction();

  const [preAddPlayerId, setPreAddPlayerId] = useState("");

  const decodedTeamId = decodeURIComponent(teamId);
  const team = teams.find((t) => t.id === decodedTeamId);

  useEffect(() => {
    if (team) {
      emit("join", { role: "captain", teamName: team.name });
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
            <a
              href="/"
              className="btn btn-outline"
              style={{ marginTop: "16px" }}
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  const isMyBid = auction.currentBidder === team.id;
  const maxPlayers = settings.maxPlayersPerTeam || 11;
  const preAddedCount = team.preAddedPlayers?.length || 0;
  const auctionedCount = team.players?.length || 0;
  const totalRoster = (team.captain ? 1 : 0) + preAddedCount + auctionedCount;
  const slotsLeft = maxPlayers - totalRoster;
  const initialPurse = team.purse || settings.defaultPurse;
  const spent = initialPurse - team.remaining;

  // Available players for pre-add
  const availablePlayersForPreAdd = players.filter(
    (p) => p.status === "available" && !p.soldTo,
  );

  const handleAddPrePlayer = () => {
    if (!preAddPlayerId) return;
    emit("captain:addPrePlayer", { teamId: team.id, playerId: preAddPlayerId });
    setPreAddPlayerId("");
  };

  return (
    <div className="captain" style={{ "--team-color": team.color }}>
      {/* Sold/Unsold Overlay */}
      <SoldOverlay
        soldInfo={soldInfo}
        unsoldInfo={unsoldInfo}
        onDismiss={() => {
          setSoldInfo(null);
          setUnsoldInfo(null);
        }}
      />

      {/* Header */}
      <header className="captain__header">
        <a href="/" className="captain__back">
          ←
        </a>
        <div className="captain__team-info">
          <div
            className="captain__team-logo"
            style={{ background: team.color }}
          >
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
          <span className={`status-dot ${connected ? "online" : "offline"}`} />
        </div>
      </header>

      {/* Purse & Slots Info Bar */}
      <div className="captain__purse-bar">
        <div className="captain__purse-item">
          <span className="captain__purse-item-label">Initial</span>
          <span className="captain__purse-item-value">
            {formatCurrency(initialPurse)}
          </span>
        </div>
        <div className="captain__purse-item">
          <span className="captain__purse-item-label">Spent</span>
          <span
            className="captain__purse-item-value"
            style={{ color: "var(--accent-red-light)" }}
          >
            {formatCurrency(spent)}
          </span>
        </div>
        <div className="captain__purse-item">
          <span className="captain__purse-item-label">Remaining</span>
          <span
            className="captain__purse-item-value"
            style={{ color: "var(--accent-green-light)" }}
          >
            {formatCurrency(team.remaining)}
          </span>
        </div>
        <div className="captain__purse-item">
          <span className="captain__purse-item-label">Slots</span>
          <span className="captain__purse-item-value">
            <span className={slotsLeft > 0 ? "" : "captain__slots-full"}>
              {totalRoster}/{maxPlayers}
            </span>
          </span>
        </div>
      </div>

      {/* Main Content */}
      <main className="captain__main">
        {auction.status === "ended" ? (
          <div className="captain__ended-summary animate-fade-in-scale">
            <div className="captain__ended-icon">🏆</div>
            <h2>Auction Ended</h2>
            <p>Here is your final squad summary.</p>

            <div className="captain__ended-stats">
              <div className="captain__stat-box">
                <span className="captain__stat-label">Total Players</span>
                <span className="captain__stat-value">{totalRoster}</span>
              </div>
              <div className="captain__stat-box">
                <span className="captain__stat-label">Total Spent</span>
                <span className="captain__stat-value">
                  {formatCurrency(spent)}
                </span>
              </div>
              <div className="captain__stat-box">
                <span className="captain__stat-label">Remaining Purse</span>
                <span
                  className="captain__stat-value"
                  style={{ color: "var(--accent-green)" }}
                >
                  {formatCurrency(team.remaining)}
                </span>
              </div>
            </div>

            <div className="captain__squad-grid">
              {/* Captain */}
              {team.captain && (
                <div key="cap" className="captain__squad-card">
                  <div className="captain__squad-card-name">
                    {team.captain.name}
                  </div>
                  <div
                    className="captain__squad-card-role badge badge-gold"
                    style={{ fontSize: "0.65rem" }}
                  >
                    Captain
                  </div>
                </div>
              )}
              {/* Pre-added players */}
              {team.preAddedPlayers &&
                team.preAddedPlayers.length > 0 &&
                team.preAddedPlayers.map((p) => (
                  <div key={p.id} className="captain__squad-card">
                    <div className="captain__squad-card-name">{p.name}</div>
                    <div
                      className="captain__squad-card-role badge badge-purple"
                      style={{ fontSize: "0.65rem" }}
                    >
                      Pre-Added
                    </div>
                    <div
                      className="captain__squad-card-price badge badge-blue"
                      style={{ fontSize: "0.65rem" }}
                    >
                      {p.role}
                    </div>
                  </div>
                ))}
              {/* Auctioned players */}
              {team.players && team.players.length > 0
                ? team.players.map((p) => (
                    <div key={p.id} className="captain__squad-card">
                      <div className="captain__squad-card-name">{p.name}</div>
                      <div className="captain__squad-card-role badge">
                        {p.role || "Player"}
                      </div>
                      <div className="captain__squad-card-price">
                        {formatCurrency(p.price)}
                      </div>
                    </div>
                  ))
                : null}
              {totalRoster === 0 && (
                <p className="captain__no-players">No players in squad.</p>
              )}
            </div>
          </div>
        ) : auction.status === "idle" || !currentPlayer ? (
          <div className="captain__idle-view">
            <div className="captain__waiting">
              <div className="captain__waiting-icon">🏏</div>
              <h2>Waiting for Auction to Start</h2>
              <p>The admin will begin the auction shortly...</p>
              <div className="captain__waiting-pulse" />
            </div>

            {/* Pre-Auction Roster Management */}
            <div className="captain__pre-roster">
              <h3 className="captain__pre-roster-title">
                📋 Your Roster ({totalRoster}/{maxPlayers})
                {settings.rosterLocked && (
                  <span
                    className="badge badge-red"
                    style={{ marginLeft: "8px", fontSize: "0.65rem" }}
                  >
                    🔒 Locked
                  </span>
                )}
              </h3>

              {/* Pre-added players list */}
              {team.preAddedPlayers && team.preAddedPlayers.length > 0 && (
                <div className="captain__pre-roster-list">
                  {team.preAddedPlayers.map((p) => (
                    <div key={p.id} className="captain__pre-roster-item">
                      <span className="captain__pre-roster-name">{p.name}</span>
                      <span
                        className="badge badge-blue"
                        style={{ fontSize: "0.65rem" }}
                      >
                        {p.role}
                      </span>
                      {!settings.rosterLocked && (
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() =>
                            emit("captain:removePrePlayer", {
                              teamId: team.id,
                              playerId: p.id,
                            })
                          }
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add player form */}
              {!settings.rosterLocked && slotsLeft > 0 && (
                <div className="captain__pre-roster-add">
                  <select
                    value={preAddPlayerId}
                    onChange={(e) => setPreAddPlayerId(e.target.value)}
                  >
                    <option value="">Select player to add...</option>
                    {availablePlayersForPreAdd.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.role})
                      </option>
                    ))}
                  </select>
                  <button
                    className="btn btn-sm btn-gold"
                    onClick={handleAddPrePlayer}
                    disabled={!preAddPlayerId}
                  >
                    + Add
                  </button>
                </div>
              )}

              {!settings.rosterLocked && slotsLeft <= 0 && (
                <p className="captain__pre-roster-full">
                  Team roster is full ({maxPlayers}/{maxPlayers})
                </p>
              )}

              {settings.rosterLocked && (
                <p className="captain__pre-roster-locked-msg">
                  Roster has been locked by the admin. No changes can be made.
                </p>
              )}

              <div className="captain__pre-roster-slots">
                <span>
                  {slotsLeft} slot{slotsLeft !== 1 ? "s" : ""} available for
                  auction
                </span>
              </div>
            </div>
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
            <div
              className={`captain__current-bid ${isMyBid ? "captain__current-bid--mine" : ""}`}
            >
              <span className="captain__bid-label">Current Bid</span>
              <span className="captain__bid-amount">
                {formatCurrency(auction.currentBid)}
              </span>
              {currentBidderTeam && (
                <span
                  className="captain__bid-team"
                  style={{ color: currentBidderTeam.color }}
                >
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
      {auction.status !== "ended" && totalRoster > 0 && (
        <div className="captain__squad">
          <h3 className="captain__squad-title">
            My Squad ({totalRoster}/{maxPlayers})
          </h3>
          <div className="captain__squad-list">
            {team.captain && (
              <div key="cap" className="captain__squad-item">
                <span>{team.captain.name}</span>
                <span
                  className="badge badge-gold"
                  style={{ fontSize: "0.6rem" }}
                >
                  Captain
                </span>
              </div>
            )}
            {team.preAddedPlayers &&
              team.preAddedPlayers.map((p) => (
                <div key={p.id} className="captain__squad-item">
                  <span>{p.name}</span>
                  <span
                    className="badge badge-purple"
                    style={{ fontSize: "0.6rem" }}
                  >
                    Pre-Added
                  </span>
                </div>
              ))}
            {team.players &&
              team.players.map((p) => (
                <div key={p.id} className="captain__squad-item">
                  <span>{p.name}</span>
                  <span className="captain__squad-price">
                    {formatCurrency(p.price)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && <div className="error-toast">{error}</div>}

      {/* Disconnected banner */}
      {!connected && (
        <div className="connection-banner">
          ⚠️ Disconnected — Reconnecting...
        </div>
      )}
    </div>
  );
}
