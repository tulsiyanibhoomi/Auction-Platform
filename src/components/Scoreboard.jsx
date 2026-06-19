import { formatCurrency } from '../utils/formatters';
import './Scoreboard.css';

export default function Scoreboard({ teams = [], compact = false }) {
  const sortedTeams = [...teams].sort((a, b) => b.remaining - a.remaining);

  return (
    <div className={`scoreboard ${compact ? 'scoreboard--compact' : ''}`}>
      <h3 className="scoreboard__title">📊 Team Standings</h3>
      <div className="scoreboard__list">
        {sortedTeams.map((team, index) => {
          const pursePercent = team.purse > 0 ? (team.remaining / team.purse) * 100 : 0;
          return (
            <div key={team.id} className="scoreboard__item" style={{ '--team-color': team.color }}>
              <div className="scoreboard__rank">{index + 1}</div>
              <div className="scoreboard__logo" style={{ background: team.color }}>
                {team.shortName}
              </div>
              <div className="scoreboard__info">
                <span className="scoreboard__name">{team.name}</span>
                <div className="scoreboard__bar">
                  <div
                    className="scoreboard__bar-fill"
                    style={{ width: `${pursePercent}%`, background: team.color }}
                  />
                </div>
              </div>
              <div className="scoreboard__stats">
                <span className="scoreboard__purse">{formatCurrency(team.remaining)}</span>
                <span className="scoreboard__count">{team.players?.length || 0} 👤</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
