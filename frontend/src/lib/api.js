// Thin REST client over the CatFleet360 FastAPI backend.
// Every function here maps 1:1 to an endpoint documented in backend/README.md.

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let body = null;
    try {
      body = await res.json();
    } catch {
      /* no json body */
    }
    const message = body?.detail || `Request failed (${res.status})`;
    throw new ApiError(message, res.status, body);
  }
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return res.json();
  return res;
}

// ---- Equipment ----------------------------------------------------------
export const getEquipment = (status) =>
  request(`/equipment${status ? `?status=${encodeURIComponent(status)}` : ""}`);
export const getEquipmentById = (id) => request(`/equipment/${id}`);
export const getEquipmentQrUrl = (id) => `${API_BASE_URL}/equipment/${id}/qr`;

// ---- Rentals --------------------------------------------------------------
export const getRentals = () => request(`/rentals`);
export const checkoutRental = (payload) =>
  request(`/rentals/checkout`, { method: "POST", body: JSON.stringify(payload) });
export const checkinRental = (qr_code) =>
  request(`/rentals/checkin`, { method: "POST", body: JSON.stringify({ qr_code }) });

// ---- Telemetry --------------------------------------------------------------
export const getTelemetryHistory = (id, limit = 100) =>
  request(`/telemetry/${id}/history?limit=${limit}`);

// ---- Alerts --------------------------------------------------------------
export const getAlerts = (acknowledged) =>
  request(`/alerts${acknowledged !== undefined ? `?acknowledged=${acknowledged}` : ""}`);
export const acknowledgeAlert = (id) => request(`/alerts/${id}/ack`, { method: "POST" });

// ---- Forecast --------------------------------------------------------------
export const getForecast = () => request(`/forecast`);

// ---- Health --------------------------------------------------------------
export const getHealth = () => request(`/health`);

export { ApiError };
