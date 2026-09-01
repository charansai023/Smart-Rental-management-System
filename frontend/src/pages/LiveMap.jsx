import { useMemo, useState } from "react";
import Icon from "../components/Icon";
import MiniMap from "../components/MiniMap";
import { useFleetData } from "../context/FleetDataContext";
import { timeAgo } from "../lib/format";

const EQUIPMENT_TYPES = ["All Equipment", "Excavator", "Crane", "Bulldozer", "Grader"];

export default function LiveMap() {
  const { equipment, alerts, ack, notify } = useFleetData();
  const [typeFilter, setTypeFilter] = useState("All Equipment");
  const [dismissedBanner, setDismissedBanner] = useState(null);

  const filtered = useMemo(
    () => (typeFilter === "All Equipment" ? equipment : equipment.filter((e) => e.type === typeFilter)),
    [equipment, typeFilter]
  );

  const counts = useMemo(() => {
    const c = { AVAILABLE: 0, RENTED: 0, IDLE: 0 };
    equipment.forEach((e) => (c[e.status] = (c[e.status] || 0) + 1));
    return c;
  }, [equipment]);

  const activeAlerts = alerts.filter((a) => !a.acknowledged);
  const topAlert = activeAlerts.find((a) => a.id !== dismissedBanner);
  const alertEquipment = topAlert ? equipment.find((e) => e.equipment_id === topAlert.equipment_id) : null;

  const handleTakeAction = async () => {
    if (!topAlert) return;
    try {
      await ack(topAlert.id);
      notify(`${topAlert.equipment_id} alert acknowledged.`, "success");
    } catch (err) {
      notify(err.message || "Could not acknowledge alert.", "error");
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col -m-4 sm:-m-6 lg:-m-8 relative rounded-2xl overflow-hidden shadow-sm border border-slate-200">
      <div className="relative flex-1 flex overflow-hidden">
        <div className="flex-1 relative">
          <MiniMap equipment={filtered} height="h-full" />
        </div>

        {/* Floating Controls Overlay (Desktop) */}
        <div className="absolute top-6 right-6 w-full max-w-sm space-y-4 hidden lg:block z-20">
          {topAlert && (
            <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-rose-200 shadow-2xl overflow-hidden p-5 animate-fadeIn">
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 text-rose-600 text-xs font-bold uppercase tracking-wider">
                  <Icon name="warning" className="text-[16px] text-rose-600" />{" "}
                  {topAlert.level === "critical" ? "Critical Anomaly" : "Warning Alert"}
                </span>
                <span className="text-[11px] font-semibold text-slate-400">{timeAgo(topAlert.created_at)}</span>
              </div>
              <h4 className="text-base font-bold text-slate-900">
                {topAlert.equipment_id} <span className="text-xs font-medium text-slate-500">({alertEquipment?.type})</span>
              </h4>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{topAlert.body}</p>
              <div className="flex gap-2.5 mt-4">
                <button
                  onClick={handleTakeAction}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg uppercase tracking-wider shadow-sm transition-all active:scale-[0.98]"
                >
                  Resolve Alert
                </button>
                <button
                  onClick={() => setDismissedBanner(topAlert.id)}
                  className="flex-1 border border-slate-300 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-lg uppercase tracking-wider hover:bg-slate-100 transition-all"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-2xl overflow-hidden p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Live Fleet Telemetry</h3>
            <div className="grid grid-cols-2 gap-3">
              <StatusStat color="bg-emerald-500" label="Available" value={counts.AVAILABLE || 0} />
              <StatusStat color="bg-amber-500" label="On Lease" value={counts.RENTED || 0} />
              <StatusStat color="bg-slate-400" label="Idle" value={counts.IDLE || 0} />
              <StatusStat color="bg-rose-500" label="Alerts" value={activeAlerts.length} valueClass="text-rose-600" />
            </div>
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Filter Equipment Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3.5 py-2 text-xs font-semibold bg-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-slate-900"
              >
                {EQUIPMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      <div className="lg:hidden p-4 space-y-3 bg-slate-900 text-white">
        {topAlert && (
          <div className="bg-slate-800 rounded-xl border border-rose-500/40 p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="flex items-center gap-1.5 text-rose-400 text-xs font-bold uppercase">
                <Icon name="warning" className="text-[16px]" /> Alert
              </span>
              <span className="text-xs text-slate-400">{timeAgo(topAlert.created_at)}</span>
            </div>
            <h4 className="text-sm font-bold text-white">{topAlert.equipment_id}</h4>
            <p className="text-xs text-slate-300 mt-1">{topAlert.body}</p>
            <div className="flex gap-2 mt-3">
              <button onClick={handleTakeAction} className="flex-1 bg-rose-600 text-white text-xs font-bold py-2 rounded-lg uppercase">
                Resolve
              </button>
              <button onClick={() => setDismissedBanner(topAlert.id)} className="flex-1 border border-slate-600 text-xs font-semibold py-2 rounded-lg uppercase">
                Dismiss
              </button>
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2.5">
          <StatusStat color="bg-emerald-500" label="Available" value={counts.AVAILABLE || 0} card />
          <StatusStat color="bg-amber-500" label="On Lease" value={counts.RENTED || 0} card />
          <StatusStat color="bg-slate-400" label="Idle" value={counts.IDLE || 0} card />
          <StatusStat color="bg-rose-500" label="Alerts" value={activeAlerts.length} valueClass="text-rose-400" card />
        </div>
      </div>
    </div>
  );
}

function StatusStat({ color, label, value, valueClass = "text-slate-900", card = false }) {
  return (
    <div className={card ? "bg-slate-800 border border-slate-700 rounded-xl p-3" : "bg-slate-50 border border-slate-200/80 rounded-xl p-3"}>
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
        <span className={`w-2 h-2 rounded-full ${color}`} /> {label}
      </div>
      <div className={`text-xl font-bold tracking-tight mt-1 ${card ? "text-white" : valueClass}`}>{value}</div>
    </div>
  );
}

