import { useAuction } from '../context/AuctionContext';
import './Timer.css';

export default function Timer({ size = 'md' }) {
  const { auction } = useAuction();
  const remaining = auction.timer;
  const total = 15; // default
  const isUrgent = remaining <= 5 && remaining > 0;
  const isExpired = remaining <= 0;
  const isActive = auction.status === 'active';

  // Calculate stroke dash for circular timer
  const radius = size === 'xl' ? 90 : size === 'lg' ? 70 : size === 'md' ? 50 : 35;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? (remaining / total) : 0;
  const strokeDash = circumference * progress;

  const getColor = () => {
    if (isExpired) return 'var(--accent-red)';
    if (isUrgent) return 'var(--accent-red)';
    if (remaining <= 10) return 'var(--accent-orange)';
    return 'var(--accent-green)';
  };

  return (
    <div className={`timer timer--${size} ${isUrgent ? 'timer--urgent' : ''} ${isExpired ? 'timer--expired' : ''}`}>
      <svg className="timer__svg" viewBox={`0 0 ${(radius + 10) * 2} ${(radius + 10) * 2}`}>
        {/* Background circle */}
        <circle
          className="timer__track"
          cx={radius + 10}
          cy={radius + 10}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={size === 'xl' ? 8 : 6}
        />
        {/* Progress circle */}
        <circle
          className="timer__progress"
          cx={radius + 10}
          cy={radius + 10}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={size === 'xl' ? 8 : 6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - strokeDash}
          transform={`rotate(-90 ${radius + 10} ${radius + 10})`}
          style={{ transition: 'stroke-dashoffset 0.5s linear, stroke 0.3s ease' }}
        />
      </svg>
      <div className="timer__display">
        <span className="timer__seconds" style={{ color: getColor() }}>
          {isActive || auction.status === 'paused' ? remaining : '--'}
        </span>
        <span className="timer__label">
          {auction.status === 'paused' ? 'PAUSED' : isActive ? 'SEC' : ''}
        </span>
      </div>
    </div>
  );
}
