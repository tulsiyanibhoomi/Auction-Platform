import {
  getInitials,
  getRoleBadgeColor,
  formatCurrency,
} from "../utils/formatters";
import "./PlayerCard.css";

export default function PlayerCard({
  player,
  size = "md",
  showPrice = true,
  animate = false,
}) {
  if (!player) return null;

  return (
    <div
      className={`player-card player-card--${size} ${animate ? "player-card--animate" : ""}`}
    >
      <div
        className="player-card__avatar"
        style={{ borderColor: getRoleBadgeColor(player.role) }}
      >
        {player.photo ? (
          <img
            src={player.photo}
            alt={player.name}
            className="player-card__photo"
          />
        ) : (
          <span className="player-card__initials">
            {getInitials(player.name)}
          </span>
        )}
      </div>
      <div className="player-card__info">
        <h3 className="player-card__name">{player.name}</h3>
        <span
          className="player-card__role badge"
          style={{
            background: `${getRoleBadgeColor(player.role)}22`,
            color: getRoleBadgeColor(player.role),
          }}
        >
          {player.role}
        </span>
        {showPrice && (
          <div className="player-card__price">
            <span className="player-card__price-label">Base Price</span>
            <span className="player-card__price-value">
              {formatCurrency(player.basePrice)}
            </span>
          </div>
        )}
      </div>
      {player.status === "sold" && (
        <div className="player-card__sold-badge">SOLD</div>
      )}
      {player.status === "unsold" && (
        <div className="player-card__unsold-badge">UNSOLD</div>
      )}
    </div>
  );
}
