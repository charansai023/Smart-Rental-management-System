// The backend seeds sites & operators (see backend/seed_data.py) but does not
// expose GET /sites or GET /operators endpoints — only their ids show up on
// equipment/rental records. We mirror the same seed rows here purely so the
// UI can show human-readable names instead of raw ids like "S003"/"OP101".
// If the backend seed data changes, update this file to match.

export const SITES = [
  { site_id: "S001", name: "Bengaluru Yard", latitude: 12.9716, longitude: 77.5946 },
  { site_id: "S002", name: "Chennai Site", latitude: 13.0827, longitude: 80.2707 },
  { site_id: "S003", name: "Hyderabad Site", latitude: 17.385, longitude: 78.4867 },
  { site_id: "S004", name: "Pune Site", latitude: 18.5204, longitude: 73.8567 },
  { site_id: "S005", name: "Mumbai Site", latitude: 19.076, longitude: 72.8777 },
  { site_id: "S006", name: "Nagpur Site", latitude: 21.1458, longitude: 79.0882 },
];

export const OPERATORS = [
  { operator_id: "OP101", name: "Ramesh Kumar" },
  { operator_id: "OP106", name: "Arjun Rao" },
  { operator_id: "OP114", name: "Vikram Singh" },
  { operator_id: "OP203", name: "Suresh Nair" },
  { operator_id: "OP301", name: "Manoj Patil" },
  { operator_id: "OP401", name: "Divya Menon" },
  { operator_id: "OP402", name: "Karthik Iyer" },
];

const siteMap = new Map(SITES.map((s) => [s.site_id, s]));
const operatorMap = new Map(OPERATORS.map((o) => [o.operator_id, o]));

export const siteName = (siteId) => siteMap.get(siteId)?.name || (siteId ? `Site ${siteId}` : "Unassigned");
export const siteById = (siteId) => siteMap.get(siteId) || null;
export const operatorName = (opId) => operatorMap.get(opId)?.name || (opId ? `Operator ${opId}` : "Unassigned");
