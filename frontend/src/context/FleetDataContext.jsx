import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as api from "../lib/api";
import { useDashboardSocket } from "../lib/useDashboardSocket";

const FleetDataContext = createContext(null);

export function FleetDataProvider({ children }) {
  const [equipment, setEquipment] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState(null);
  const [toast, setToast] = useState(null);

  const notify = useCallback((message, tone = "info") => {
    setToast({ message, tone, id: Date.now() });
  }, []);

  const refreshAll = useCallback(async () => {
    try {
      const [eq, rn, al, fc] = await Promise.all([
        api.getEquipment(),
        api.getRentals(),
        api.getAlerts(),
        api.getForecast().catch(() => null),
      ]);
      setEquipment(eq);
      setRentals(rn);
      setAlerts(al);
      setForecast(fc);
      setBackendError(null);
    } catch (err) {
      setBackendError(err.message || "Could not reach the CatFleet360 backend.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAll();
    const interval = setInterval(refreshAll, 30000); // periodic reconcile alongside live push
    return () => clearInterval(interval);
  }, [refreshAll]);

  const handleSocketEvent = useCallback((msg) => {
    if (!msg || !msg.type) return;
    switch (msg.type) {
      case "telemetry_update": {
        const t = msg.data;
        setEquipment((prev) =>
          prev.map((e) =>
            e.equipment_id === t.equipment_id
              ? { ...e, latitude: t.latitude, longitude: t.longitude, fuel_level: t.fuel_level, status: e.status }
              : e
          )
        );
        break;
      }
      case "new_alert": {
        setAlerts((prev) => [
          {
            id: msg.data.id,
            equipment_id: msg.data.equipment_id,
            level: msg.data.level,
            kind: msg.data.kind || "alert",
            title: msg.data.title,
            body: msg.data.body,
            created_at: new Date().toISOString(),
            acknowledged: false,
          },
          ...prev.filter((a) => a.id !== msg.data.id),
        ]);
        break;
      }
      case "rental_checkout":
      case "rental_checkin": {
        setRentals((prev) => {
          const next = prev.filter((r) => r.rental_id !== msg.data.rental_id);
          return [msg.data, ...next];
        });
        setEquipment((prev) =>
          prev.map((e) =>
            e.equipment_id === msg.data.equipment_id
              ? { ...e, status: msg.type === "rental_checkout" ? "RENTED" : "AVAILABLE" }
              : e
          )
        );
        break;
      }
      default:
        break;
    }
  }, []);

  const { connected: wsConnected } = useDashboardSocket(handleSocketEvent);

  const checkout = useCallback(
    async (payload) => {
      const rental = await api.checkoutRental(payload);
      await refreshAll();
      notify(`${rental.equipment_id} checked out — rental ${rental.rental_id} created.`, "success");
      return rental;
    },
    [refreshAll, notify]
  );

  const checkin = useCallback(
    async (qrCode) => {
      const rental = await api.checkinRental(qrCode);
      await refreshAll();
      notify(`${rental.equipment_id} checked in and marked available.`, "success");
      return rental;
    },
    [refreshAll, notify]
  );

  const ack = useCallback(
    async (alertId) => {
      await api.acknowledgeAlert(alertId);
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a)));
    },
    []
  );

  const value = useMemo(
    () => ({
      equipment,
      rentals,
      alerts,
      forecast,
      loading,
      backendError,
      wsConnected,
      toast,
      notify,
      refreshAll,
      checkout,
      checkin,
      ack,
    }),
    [equipment, rentals, alerts, forecast, loading, backendError, wsConnected, toast, notify, refreshAll, checkout, checkin, ack]
  );

  return <FleetDataContext.Provider value={value}>{children}</FleetDataContext.Provider>;
}

export function useFleetData() {
  const ctx = useContext(FleetDataContext);
  if (!ctx) throw new Error("useFleetData must be used within FleetDataProvider");
  return ctx;
}
