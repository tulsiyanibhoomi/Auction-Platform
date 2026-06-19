import { useEffect, useState } from 'react';
import './SoldOverlay.css';

export default function SoldOverlay({ soldInfo, unsoldInfo, onDismiss }) {
  const [visible, setVisible] = useState(false);
  const info = soldInfo || unsoldInfo;
  const isSold = !!soldInfo;

  useEffect(() => {
    if (info) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => onDismiss?.(), 300);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [info]);

  if (!info) return null;

  return (
    <div className={`sold-overlay ${visible ? 'sold-overlay--visible' : ''}`}>
      <div className="sold-overlay__backdrop" />
      <div className="sold-overlay__content">
        {isSold ? (
          <>
            <div className="sold-overlay__stamp sold-overlay__stamp--sold">
              SOLD!
            </div>
            <div className="sold-overlay__details animate-fade-in-up">
              <div className="sold-overlay__player-name">{soldInfo.player?.name}</div>
              <div className="sold-overlay__to">
                <span>to</span>
                <span
                  className="sold-overlay__team-name"
                  style={{ color: soldInfo.team?.color || 'var(--accent-gold)' }}
                >
                  {soldInfo.team?.name}
                </span>
              </div>
              <div className="sold-overlay__price">
                ₹{(soldInfo.price || 0).toLocaleString('en-IN')}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="sold-overlay__stamp sold-overlay__stamp--unsold">
              UNSOLD
            </div>
            <div className="sold-overlay__details animate-fade-in-up">
              <div className="sold-overlay__player-name">{unsoldInfo.player?.name}</div>
              <div className="sold-overlay__subtitle">No bids received</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
