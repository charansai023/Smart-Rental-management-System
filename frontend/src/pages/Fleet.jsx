import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon";
import StatusChip from "../components/StatusChip";
import HealthBar from "../components/HealthBar";
import CheckoutModal from "../components/CheckoutModal";
import QrScannerModal from "../components/QrScannerModal";
import { useFleetData } from "../context/FleetDataContext";
import { deriveUtilization, friendlyModel } from "../lib/format";
import { siteName } from "../lib/referenceData";

const TABS = [
  { key: "ALL", label: "All Assets" },
  { key: "AVAILABLE", label: "Available" },
  { key: "RENTED", label: "On Lease" },
  { key: "IDLE", label: "Idle" },
  { key: "MAINTENANCE", label: "Maintenance" },
];

export default function Fleet() {
  const { equipment, rentals, checkin, checkout, notify } = useFleetData();
  const [tab, setTab] = useState("ALL");
  const [search, setSearch] = useState("");
  const [checkoutTarget, setCheckoutTarget] = useState(null); // "any" | equipment_id | null
  const [qrScanMode, setQrScanMode] = useState(null); // "checkout" | "checkin" | null

  const counts = useMemo(() => {
    const c = { ALL: equipment.length, AVAILABLE: 0, RENTED: 0, IDLE: 0, MAINTENANCE: 0 };
    equipment.forEach((e) => (c[e.status] = (c[e.status] || 0) + 1));
    return c;
  }, [equipment]);

  const rows = useMemo(() => {
    let list = tab === "ALL" ? equipment : equipment.filter((e) => e.status === tab);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((e) => e.equipment_id.toLowerCase().includes(q) || e.type.toLowerCase().includes(q) || siteName(e.site_id).toLowerCase().includes(q));
    }
    return list;
  }, [equipment, tab, search]);

  const availableEquipment = equipment.filter((e) => e.status === "AVAILABLE");
  const rentedEquipment = equipment.filter((e) => e.status === "RENTED");

  const handleQuickCheckin = async (eq) => {
    try {
      await checkin(eq.qr_code);
    } catch (err) {
      notify(err.message || "Check-in failed.", "error");
    }
  };

  const handleQrScanSuccess = async (qrPayload, eqId) => {
    setQrScanMode(null);
    if (qrScanMode === "checkin") {
      try {
        await checkin(qrPayload);
      } catch (err) {
        notify(err.message || `Check-in failed for ${eqId}.`, "error");
      }
    } else {
      setCheckoutTarget(eqId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Fleet Management</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Directory of machinery, status, engine telemetry, and site assignments</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setQrScanMode("checkin")}
            disabled={rentedEquipment.length === 0}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-4 py-2.5 bg-slate-900 text-amber-400 rounded-xl shadow-sm hover:shadow-md hover:bg-slate-800 transition-all disabled:opacity-40 active:scale-[0.98]"
          >
            <Icon name="qr_code_scanner" className="text-[18px]" /> Scan QR Check-In
          </button>
          <button
            onClick={() => setCheckoutTarget("any")}
            disabled={availableEquipment.length === 0}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-4 py-2.5 bg-cat-yellow text-slate-950 rounded-xl shadow-sm hover:shadow-md hover:bg-cat-yellow-hover transition-all disabled:opacity-40 active:scale-[0.98]"
          >
            <Icon name="add" className="text-[18px]" /> Check Out Asset
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 border-b border-slate-100 bg-slate-50/60">
          {/* Segmented Filter Pills */}
          <div className="flex bg-slate-200/60 p-1 rounded-xl overflow-x-auto gap-1 border border-slate-200/60">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-all uppercase tracking-wider ${
                  tab === t.key
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                {t.label} ({counts[t.key] || 0})
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ID, type, site..."
              className="w-full sm:w-64 border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-slate-900 font-medium"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-3.5">Asset ID</th>
                <th className="px-6 py-3.5">Model / Machinery Type</th>
                <th className="px-6 py-3.5">Deployment Site</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Utilization</th>
                <th className="px-6 py-3.5 text-right">Engine Hours</th>
                <th className="px-6 py-3.5">Health Score</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-800 font-medium">
              {rows.map((eq) => {
                const util = deriveUtilization(eq.idle_hours_today);
                return (
                  <tr key={eq.equipment_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <Link to={`/fleet/${eq.equipment_id}`} className="font-mono font-bold text-slate-900 hover:text-amber-600 hover:underline">
                        {eq.equipment_id}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{friendlyModel(eq.type)}</div>
                      <div className="text-xs text-slate-500 font-normal">{eq.type}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">{siteName(eq.site_id)}</td>
                    <td className="px-6 py-4">
                      <StatusChip
                        label={eq.status}
                        className={
                          eq.status === "AVAILABLE"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : eq.status === "RENTED"
                            ? "bg-amber-50 text-amber-900 border-amber-300"
                            : eq.status === "IDLE"
                            ? "bg-slate-100 text-slate-700 border-slate-200"
                            : "bg-rose-50 text-rose-800 border-rose-200"
                        }
                      />
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-xs">
                      {eq.status === "MAINTENANCE" ? "N/A" : `${util}%`}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-semibold text-slate-900">
                      {Math.round(eq.engine_hours).toLocaleString()} hrs
                    </td>
                    <td className="px-6 py-4">
                      <HealthBar score={eq.health_score} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {eq.status === "AVAILABLE" && (
                        <button
                          onClick={() => setCheckoutTarget(eq.equipment_id)}
                          className="text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all shadow-2xs active:scale-[0.98]"
                        >
                          Check Out
                        </button>
                      )}
                      {eq.status === "RENTED" && (
                        <button
                          onClick={() => handleQuickCheckin(eq)}
                          className="text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 uppercase tracking-wider transition-all active:scale-[0.98]"
                        >
                          Check In
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500 text-xs font-normal">
                    No equipment matches the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/60 text-xs font-medium text-slate-500">
          Showing {rows.length} of {equipment.length} equipment assets
        </div>
      </div>

      {checkoutTarget && (
        <CheckoutModal
          equipmentOptions={availableEquipment}
          defaultEquipmentId={checkoutTarget === "any" ? null : checkoutTarget}
          onClose={() => setCheckoutTarget(null)}
        />
      )}

      {qrScanMode && (
        <QrScannerModal
          mode={qrScanMode}
          equipmentList={qrScanMode === "checkin" ? rentedEquipment : availableEquipment}
          onScanSuccess={handleQrScanSuccess}
          onClose={() => setQrScanMode(null)}
        />
      )}
    </div>
  );
}


