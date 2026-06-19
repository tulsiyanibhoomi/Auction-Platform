/**
 * Format a number as Indian Rupee currency
 * e.g., 1500000 → "₹15,00,000"
 */
export function formatCurrency(amount) {
  if (amount == null) return '₹0';
  return '₹' + amount.toLocaleString('en-IN');
}

/**
 * Short currency format for display
 * e.g., 1500000 → "₹15L", 10000000 → "₹1Cr"
 */
export function formatCurrencyShort(amount) {
  if (amount == null) return '₹0';
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(amount % 10000000 === 0 ? 0 : 1)}Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(amount % 100000 === 0 ? 0 : 1)}L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(0)}K`;
  }
  return `₹${amount}`;
}

/**
 * Format seconds into MM:SS
 */
export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m > 0 ? m + ':' : ''}${s.toString().padStart(2, '0')}`;
}

/**
 * Get role badge color
 */
export function getRoleBadgeColor(role) {
  const colors = {
    Batsman: '#F59E0B',
    Bowler: '#3B82F6',
    'All-rounder': '#8B5CF6',
    'Wicket-keeper': '#10B981',
  };
  return colors[role] || '#94A3B8';
}

/**
 * Generate initials from a name
 */
export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Generate a unique ID
 */
export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
}
