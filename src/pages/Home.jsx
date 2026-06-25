import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuction } from "../context/AuctionContext";
import AdminPasswordModal from "../components/AdminPasswordModal";
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();
  const { teams, connected } = useAuction();
  const [selectedTeam, setSelectedTeam] = useState("");
  const [showAdminModal, setShowAdminModal] = useState(false);
  const selectedTeamObj = teams.find((t) => t.id === selectedTeam);
  const noCaptain = selectedTeamObj && !selectedTeamObj.captain;

  const handleJoinCaptain = () => {
    if (selectedTeam) {
      navigate(`/captain/${encodeURIComponent(selectedTeam)}`);
    }
  };

  const handleAdminAuth = () => {
    sessionStorage.setItem("adminAuth", Date.now().toString());
    setShowAdminModal(false);
    navigate("/admin");
  };

  return (
    <div className="home">
      <div className="home__bg-effects">
        <div className="home__orb home__orb--1" />
        <div className="home__orb home__orb--2" />
        <div className="home__orb home__orb--3" />
      </div>

      <div className="home__content">
        <div className="home__hero animate-fade-in-up">
          <div className="home__trophy">🏏</div>
          <h1 className="home__title">
            IPL <span className="home__title-accent">MEGA</span> AUCTION
          </h1>
          <p className="home__subtitle">Real-Time Cricket Auction Platform</p>
          <div className="home__status">
            <span
              className={`status-dot ${connected ? "online" : "offline"}`}
            />
            <span>{connected ? "Connected to Server" : "Connecting..."}</span>
          </div>
        </div>

        <div className="home__cards">
          {/* Admin */}
          <div
            className="home__card animate-fade-in-up"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="home__card-icon">🎛️</div>
            <h2 className="home__card-title">Admin</h2>
            <p className="home__card-desc">
              Control the auction, manage teams & players
            </p>
            <button
              className="btn btn-gold btn-lg home__card-btn"
              onClick={() => setShowAdminModal(true)}
              id="join-admin-btn"
            >
              Enter Control Room
            </button>
          </div>

          {/* Captain */}
          <div
            className="home__card animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="home__card-icon">👨‍✈️</div>
            <h2 className="home__card-title">Captain</h2>
            <p className="home__card-desc">
              Join as team captain and place bids
            </p>
            <div className="home__card-form">
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                id="team-select"
              >
                <option value="">Select your team...</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
              <button
                className="btn btn-blue btn-lg home__card-btn"
                onClick={handleJoinCaptain}
                disabled={!selectedTeam || noCaptain}
                id="join-captain-btn"
              >
                Join Auction
              </button>
            </div>
            {teams.length === 0 && (
              <p className="home__card-hint">
                No teams added yet. Ask admin to add teams first.
              </p>
            )}
            {selectedTeam &&
              (() => {
                const t = teams.find((tm) => tm.id === selectedTeam);
                return t && !t.captain ? (
                  <p
                    className="home__card-hint"
                    style={{ color: "var(--accent-orange)" }}
                  >
                    ⚠️ No captain assigned to this team. Contact admin.
                  </p>
                ) : null;
              })()}
          </div>

          {/* Display */}
          <div
            className="home__card animate-fade-in-up"
            style={{ animationDelay: "0.3s" }}
          >
            <div className="home__card-icon">📺</div>
            <h2 className="home__card-title">Display</h2>
            <p className="home__card-desc">Stadium screen for TV / projector</p>
            <button
              className="btn btn-outline btn-lg home__card-btn"
              onClick={() => navigate("/display")}
              id="join-display-btn"
            >
              Open Display
            </button>
          </div>
        </div>
      </div>

      <AdminPasswordModal
        isOpen={showAdminModal}
        onSuccess={handleAdminAuth}
        onClose={() => setShowAdminModal(false)}
      />
    </div>
  );
}
