import { formatCurrency } from '../utils/formatters';
import './TeamCard.css';

export default function TeamCard({ team, isHighlighted = false, compact = false }) {
  if (!team) return null;

  const purseUsed = team.purse - team.remaining;
  const pursePercent = team.purse > 0 ? (team.remaining / team.purse) * 100 : 0;

  return (
    <div
      className={`team-card ${compact ? 'team-card--compact' : ''} ${isHighlighted ? 'team-card--highlighted' : ''}`}
      style={{ '--team-color': team.color }}
    >
      <div className="team-card__accent" />
      <div className="team-card__header">
        <div className="team-card__logo" style={{ background: team.color }}>
          {team.shortName}
        </div>
        <div className="team-card__title">
          <h4 className="team-card__name">{team.name}</h4>
          <span className="team-card__players-count">
            {team.players?.length || 0} players
          </span>
        </div>
      </div>

      {!compact && (
        <>
          <div className="team-card__purse">
            <div className="team-card__purse-header">
              <span className="team-card__purse-label">Remaining Purse</span>
              <span className="team-card__purse-value">{formatCurrency(team.remaining)}</span>
            </div>
            <div className="team-card__purse-bar">
              <div
                className="team-card__purse-fill"
                style={{
                  width: `${pursePercent}%`,
                  background: pursePercent > 50 ? 'var(--accent-green)' : pursePercent > 20 ? 'var(--accent-orange)' : 'var(--accent-red)',
                }}
              />
            </div>
            <div className="team-card__purse-spent">
              Spent: {formatCurrency(purseUsed)}
            </div>
          </div>

          {team.players && team.players.length > 0 && (
            <div className="team-card__squad">
              {team.players.map((p) => (
                <div key={p.id} className="team-card__squad-item">
                  <span>{p.name}</span>
                  <span className="team-card__squad-price">{formatCurrency(p.price)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
