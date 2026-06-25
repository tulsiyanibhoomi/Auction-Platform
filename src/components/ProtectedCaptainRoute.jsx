import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuction } from '../context/AuctionContext';
import CaptainPasswordModal from './CaptainPasswordModal';

export default function ProtectedCaptainRoute({ children }) {
  const navigate = useNavigate();
  const { teamId } = useParams();
  const { teams, authedCaptains, setCaptainAuth } = useAuction();
  const [isAuthed, setIsAuthed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [checked, setChecked] = useState(false);

  const decodedTeamId = decodeURIComponent(teamId);
  const team = teams.find((t) => t.id === decodedTeamId);

  useEffect(() => {
    if (!team) {
      // Team data might not have loaded yet, wait for it
      if (teams.length > 0) {
        // Teams loaded but this team doesn't exist
        setChecked(true);
        return;
      }
      return; // Still loading
    }

    // If team has no captain assigned, allow access (no password protection)
    if (!team.captain) {
      setIsAuthed(true);
      setChecked(true);
      return;
    }

    // Check if captain was authenticated in this in-memory session
    if (authedCaptains[decodedTeamId]) {
      setIsAuthed(true);
      setChecked(true);
      return;
    }
    // Not authenticated — show the password modal
    setShowModal(true);
    setChecked(true);
  }, [team?.id, teams.length]);

  const handleSuccess = () => {
    setCaptainAuth(decodedTeamId, true);
    setIsAuthed(true);
    setShowModal(false);
  };

  const handleClose = () => {
    setShowModal(false);
    navigate('/', { replace: true });
  };

  // Still loading teams
  if (!checked && teams.length === 0) return null;

  if (!checked) return null;

  // Team not found
  if (!team) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <div className="empty-state">
          <div className="empty-state-icon">⚠️</div>
          <p>Team not found</p>
          <a href="/" className="btn btn-outline" style={{ marginTop: '16px' }}>← Back to Home</a>
        </div>
      </div>
    );
  }

  if (isAuthed) return children;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <CaptainPasswordModal
        isOpen={showModal}
        onSuccess={handleSuccess}
        onClose={handleClose}
        teamId={decodedTeamId}
        teamName={team?.name}
      />
    </div>
  );
}
