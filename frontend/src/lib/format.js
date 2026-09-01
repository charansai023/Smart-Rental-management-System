export const EQUIPMENT_STATUS_META = {
  AVAILABLE: { label: "Available", chip: "bg-surface-variant text-on-surface-variant border border-outline-variant" },
  RENTED: { label: "On Rent", chip: "bg-primary-container text-on-primary-container" },
  IDLE: { label: "Idle", chip: "bg-surface-variant text-on-surface-variant border border-outline-variant" },
  MAINTENANCE: { label: "Maintenance", chip: "bg-error-container text-on-error-container" },
};

export const RENTAL_STATUS_META = {
  ACTIVE: { label: "Active", chip: "bg-status-success/15 text-status-success border border-status-success/40" },
  ENDING_SOON: { label: "Ending Soon", chip: "bg-status-warning/15 text-on-primary-fixed-variant border border-status-warning/50" },
  OVERDUE: { label: "Overdue", chip: "bg-status-error/10 text-status-error border border-status-error/40" },
  COMPLETED: { label: "Completed", chip: "bg-surface-variant text-on-surface-variant border border-outline-variant" },
};

export const ALERT_LEVEL_META = {
  critical: { label: "Critical", chip: "bg-status-error/10 text-status-error border border-status-error/40" },
  warning: { label: "Warning", chip: "bg-status-warning/15 text-on-primary-fixed-variant border border-status-warning/50" },
};

export function healthBucket(score) {
  if (score >= 80) return { label: "Good", color: "text-status-success", bar: "bg-status-success" };
  if (score >= 50) return { label: "Fair", color: "text-status-warning", bar: "bg-status-warning" };
  return { label: "Critical", color: "text-status-error", bar: "bg-status-error" };
}

// Backend doesn't track a distinct "utilization" metric — derive a
// glanceable proxy from today's idle hours (less idle time = more utilized).
export function deriveUtilization(idleHoursToday) {
  const pct = Math.round(Math.max(0, 100 - (idleHoursToday || 0) * 12));
  return Math.min(100, pct);
}

export function friendlyModel(type) {
  const models = {
    Excavator: "Cat 320D",
    Crane: "Cat CS56",
    Bulldozer: "Cat D6T",
    Grader: "Cat 140",
  };
  return models[type] || type;
}

export function formatDate(iso, opts) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", opts || { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function timeAgo(iso) {
  if (!iso) return "—";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export function daysUntil(iso) {
  if (!iso) return null;
  const diffMs = new Date(iso).getTime() - Date.now();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}
