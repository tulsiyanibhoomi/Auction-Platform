import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminPasswordModal from './AdminPasswordModal';

export default function ProtectedAdminRoute({ children }) {
  const navigate = useNavigate();
  const [isAuthed, setIsAuthed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Check if admin was authenticated in this session
    const authTimestamp = sessionStorage.getItem('adminAuth');
    if (authTimestamp) {
      // Auth is valid for 4 hours
      const elapsed = Date.now() - Number(authTimestamp);
      if (elapsed < 4 * 60 * 60 * 1000) {
        setIsAuthed(true);
        setChecked(true);
        return;
      }
      sessionStorage.removeItem('adminAuth');
    }
    // Not authenticated — show the password modal
    setShowModal(true);
    setChecked(true);
  }, []);

  const handleSuccess = () => {
    sessionStorage.setItem('adminAuth', Date.now().toString());
    setIsAuthed(true);
    setShowModal(false);
  };

  const handleClose = () => {
    setShowModal(false);
    navigate('/', { replace: true });
  };

  if (!checked) return null;

  if (isAuthed) return children;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <AdminPasswordModal
        isOpen={showModal}
        onSuccess={handleSuccess}
        onClose={handleClose}
      />
    </div>
  );
}
