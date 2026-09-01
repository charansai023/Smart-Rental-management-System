import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon";
import KpiCard from "../components/KpiCard";
import StatusChip from "../components/StatusChip";
import { useFleetData } from "../context/FleetDataContext";
import { formatDateTime, timeAgo } from "../lib/format";

export default function Maintenance() {
  const { equipment, alerts, ack, notify } = useFleetData();
  const [search, setSearch] = useState("");

  const inMaintenance = equipment.filter((e) => e.status === "MAINTENANCE");
  const critical = alerts.filter((a) => !a.acknowledged && a.level === "critical");
  const warning = alerts.filter((a) => !a.acknowledged && a.level === "warning");
  const ackedToday = alerts.filter((a) => a.acknowledged);

  const openIssues = useMemo(() => {
    let list = [...alerts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((a) => a.equipment_id.toLowerCase().includes(q) || a.kind.toLowerCase().includes(q));
    }
    return list;
  }, [alerts, search]);

  const handleAck = async (alertId, assetId) => {
    try {
      await ack(alertId);
      notify(`Marked ${assetId} issue as resolved.`, "success");
    } catch (err) {
      notify(err.message || "Could not update alert.", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Maintenance &amp; Anomaly Logs</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Real-time telemetry diagnostics, low fuel notifications, idle warnings, and overdue returns
          </p>
        </div>
      </div>

      {/* KPI Section */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Critical Anomalies" value={critical.length} icon="warning" accent="border-l-rose-600" iconColor="text-rose-600" labelColor="text-rose-600" />
        <KpiCard label="Warning Alerts" value={warning.length} icon="error_outline" accent="border-l-amber-500" iconColor="text-amber-600" />
        <KpiCard label="Out of Service" value={inMaintenance.length} icon="build" accent="border-l-slate-900" />
        <KpiCard label="Resolved Issues" value={ackedToday.length} icon="task_alt" accent="border-l-emerald-500" iconColor="text-emerald-600" />
      </section>

      {/* Out of Service Cards */}
      {inMaintenance.length > 0 && (
        <div className="bg-rose-50/50 rounded-2xl border border-rose-200/80 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 text-rose-800">
            <Icon name="build" className="text-[20px] text-rose-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Machinery Currently Out of Service</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {inMaintenance.map((eq) => (
              <Link
                key={eq.equipment_id}
                to={`/fleet/${eq.equipment_id}`}
                className="bg-white border border-rose-200/80 rounded-xl p-4 shadow-2xs hover:shadow-md hover:border-rose-300 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-900 text-sm">{eq.equipment_id}</span>
                  <StatusChip label="Maintenance" className="bg-rose-100 text-rose-900 border-rose-200 text-xs font-bold" />
                </div>
                <div className="text-xs text-slate-600 font-semibold mt-2">{eq.type}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Active & Historical Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3 bg-slate-50/60">
          <h2 className="text-sm font-bold text-slate-900">Active &amp; Historical Anomaly Logs</h2>
          <div className="relative">
            <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search asset ID or anomaly..."
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
                <th className="px-6 py-3.5">Anomaly Details</th>
                <th className="px-6 py-3.5">Severity</th>
                <th className="px-6 py-3.5">Raised Date</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-800 font-medium">
              {openIssues.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <Link to={`/fleet/${a.equipment_id}`} className="font-mono font-bold text-slate-900 hover:text-amber-600 hover:underline">
                      {a.equipment_id}
                    </Link>
                  </td>
                  <td className="px-6 py-4 max-w-sm whitespace-normal">
                    <div className="font-semibold text-slate-900 capitalize">{a.kind.replace("_", " ")}</div>
                    <div className="text-xs text-slate-500 font-normal mt-0.5">{a.body}</div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusChip
                      label={a.level}
                      className={
                        a.level === "critical"
                          ? "bg-rose-50 text-rose-800 border-rose-200 capitalize font-bold"
                          : "bg-amber-50 text-amber-900 border-amber-300 capitalize"
                      }
                    />
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-500" title={formatDateTime(a.created_at)}>
                    {timeAgo(a.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    {a.acknowledged ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        <Icon name="check_circle" className="text-[14px]" /> Resolved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Open Issue
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {!a.acknowledged && (
                      <button
                        onClick={() => handleAck(a.id, a.equipment_id)}
                        className="text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-3.5 py-1.5 rounded-lg uppercase tracking-wider transition-all shadow-2xs active:scale-[0.98]"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {openIssues.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 text-xs font-normal">
                    No maintenance issues recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

