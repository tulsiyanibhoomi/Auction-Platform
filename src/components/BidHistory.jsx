import { formatCurrency } from '../utils/formatters';
import './BidHistory.css';

export default function BidHistory({ bidHistory = [], compact = false }) {
  if (bidHistory.length === 0) {
    return (
      <div className="bid-history bid-history--empty">
        <span className="bid-history__empty-text">No bids yet</span>
      </div>
    );
  }

  const reversedHistory = [...bidHistory].reverse();

  return (
    <div className={`bid-history ${compact ? 'bid-history--compact' : ''}`}>
      <div className="bid-history__list">
        {reversedHistory.map((bid, index) => (
          <div
            key={bid.timestamp}
            className={`bid-history__item ${index === 0 ? 'bid-history__item--latest' : ''}`}
            style={{ '--bid-team-color': bid.teamColor }}
          >
            <div className="bid-history__item-dot" style={{ background: bid.teamColor }} />
            <div className="bid-history__item-info">
              <span className="bid-history__item-team" style={{ color: bid.teamColor }}>
                {bid.teamName}
              </span>
              <span className="bid-history__item-amount">
                {formatCurrency(bid.amount)}
              </span>
            </div>
            {index === 0 && (
              <span className="badge badge-gold bid-history__item-badge">LEADING</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
