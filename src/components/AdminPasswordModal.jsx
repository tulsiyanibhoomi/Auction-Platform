import { useState, useRef, useEffect } from 'react';
import './AdminPasswordModal.css';

export default function AdminPasswordModal({ isOpen, onSuccess, onClose }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
    if (isOpen) {
      setPassword('');
      setError('');
      setLoading(false);
      setShake(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Please enter the password');
      setShake(true);
      setTimeout(() => setShake(false), 600);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/verify-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (data.success) {
        onSuccess();
      } else {
        setError('Incorrect password. Access denied.');
        setShake(true);
        setTimeout(() => setShake(false), 600);
        setPassword('');
      }
    } catch {
      setError('Connection error. Please try again.');
      setShake(true);
      setTimeout(() => setShake(false), 600);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="admin-auth-overlay" onClick={onClose}>
      <div
        className={`admin-auth-modal ${shake ? 'admin-auth-modal--shake' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative glow */}
        <div className="admin-auth-modal__glow" />

        {/* Shield icon */}
        <div className="admin-auth-modal__icon-wrapper">
          <div className="admin-auth-modal__icon">🔐</div>
          <div className="admin-auth-modal__icon-ring" />
        </div>

        <h2 className="admin-auth-modal__title">Admin Access</h2>
        <p className="admin-auth-modal__subtitle">
          Enter the admin password to access the Control Room
        </p>

        <form onSubmit={handleSubmit} className="admin-auth-modal__form">
          <div className="admin-auth-modal__input-wrapper">
            <input
              ref={inputRef}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="Enter password..."
              className={`admin-auth-modal__input ${error ? 'admin-auth-modal__input--error' : ''}`}
              autoComplete="off"
              id="admin-password-input"
            />
            <button
              type="button"
              className="admin-auth-modal__toggle-vis"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>

          {error && (
            <div className="admin-auth-modal__error">
              <span className="admin-auth-modal__error-icon">⚠️</span>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-gold btn-lg admin-auth-modal__submit"
            disabled={loading}
            id="admin-auth-submit-btn"
          >
            {loading ? (
              <span className="admin-auth-modal__spinner" />
            ) : (
              <>
                <span>Unlock</span>
                <span className="admin-auth-modal__arrow">→</span>
              </>
            )}
          </button>
        </form>

        <button
          className="admin-auth-modal__close"
          onClick={onClose}
          aria-label="Close"
          id="admin-auth-close-btn"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
