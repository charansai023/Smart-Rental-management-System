import { Link } from "react-router-dom";
import { useMemo } from "react";
import KpiCard from "../components/KpiCard";
import StatusChip from "../components/StatusChip";
import Icon from "../components/Icon";
import MiniMap from "../components/MiniMap";
import { useFleetData } from "../context/FleetDataContext";
import { deriveUtilization, friendlyModel, healthBucket } from "../lib/format";
import { siteName, operatorName } from "../lib/referenceData";

export default function Dashboard() {
  const { equipment, alerts, forecast } = useFleetData();

  const counts = useMemo(() => {
    const c = { AVAILABLE: 0, RENTED: 0, IDLE: 0, MAINTENANCE: 0 };
    equipment.forEach((e) => (c[e.status] = (c[e.status] || 0) + 1));
    return c;
  }, [equipment]);

  const criticalAlerts = alerts.filter((a) => !a.acknowledged && a.level === "critical");

  const topRows = useMemo(() => {
    const order = { RENTED: 0, MAINTENANCE: 1, IDLE: 2, AVAILABLE: 3 };
    return [...equipment].sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9)).slice(0, 5);
  }, [equipment]);

  const recommendation = forecast?.recommendations?.[0];
  const lowHealth = [...equipment].sort((a, b) => a.health_score - b.health_score)[0];

  return (
    <div className="space-y-6">
      {/* Page Title & Subtitle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Fleet Operations Dashboard</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Real-time asset telemetry, lease status, and demand insights</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/fleet"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-4 py-2.5 bg-cat-yellow text-slate-950 rounded-xl shadow-sm hover:shadow-md hover:bg-cat-yellow-hover transition-all active:scale-[0.98]"
          >
            <Icon name="add" className="text-[18px]" /> Check Out Equipment
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard label="Total Fleet" value={equipment.length} icon="local_shipping" accent="border-l-slate-900" />
        <KpiCard label="Available" value={counts.AVAILABLE || 0} icon="check_circle" accent="border-l-emerald-500" iconColor="text-emerald-600" />
        <KpiCard label="On Lease" value={counts.RENTED || 0} icon="handshake" accent="border-l-amber-500" iconColor="text-amber-600" />
        <KpiCard label="Idle Units" value={counts.IDLE || 0} icon="pause_circle" accent="border-l-slate-400" iconColor="text-slate-500" />
        <KpiCard label="Maintenance" value={counts.MAINTENANCE || 0} icon="build" accent="border-l-rose-500" iconColor="text-rose-600" />
        <KpiCard
          label="Critical Alerts"
          value={criticalAlerts.length}
          icon="warning"
          accent="border-l-rose-600"
          iconColor="text-rose-600"
          labelColor="text-rose-600"
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          {/* Fleet Overview Table Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
              <div>
                <h2 className="text-base font-bold text-slate-900">Fleet Overview</h2>
                <p className="text-xs text-slate-500">Live operational status and asset utilization</p>
              </div>
              <Link
                to="/fleet"
                className="text-xs font-semibold px-3.5 py-1.5 border border-slate-200 rounded-lg text-slate-700 bg-white hover:bg-slate-50 shadow-2xs transition-all uppercase tracking-wider"
              >
                View Fleet →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/60 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-3.5">Asset ID</th>
                    <th className="px-6 py-3.5">Equipment Type</th>
                    <th className="px-6 py-3.5">Site / Operator</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Utilization</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-100 text-slate-800">
                  {topRows.map((eq) => {
                    const util = deriveUtilization(eq.idle_hours_today);
                    return (
                      <tr key={eq.equipment_id} className={`hover:bg-slate-50/80 transition-colors ${eq.status === "MAINTENANCE" ? "bg-rose-50/30" : ""}`}>
                        <td className="px-6 py-4 font-mono font-bold text-slate-900">
                          <Link to={`/fleet/${eq.equipment_id}`} className="hover:text-amber-600 hover:underline">
                            {eq.equipment_id}
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{eq.type}</div>
                          <div className="text-xs text-slate-500 font-medium">{friendlyModel(eq.type)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">{siteName(eq.site_id)}</div>
                          <div className="text-xs text-slate-500">{operatorName(eq.current_operator_id)}</div>
                        </td>
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
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2.5">
                            <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60 p-0.5">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  util >= 60 ? "bg-emerald-500" : util >= 30 ? "bg-amber-500" : "bg-rose-500"
                                }`}
                                style={{ width: `${util}%` }}
                              />
                            </div>
                            <span className="font-mono text-xs font-semibold w-8 text-right">{util}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {topRows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500 text-xs">
                        No equipment records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Smart Fleet Insights Banner */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-slate-800 shadow-md p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <Icon name="psychology" style={{ fontSize: 130 }} />
            </div>
            <div className="flex items-center gap-2.5 text-amber-400 font-bold text-xs uppercase tracking-wider mb-4">
              <Icon name="lightbulb" className="text-[18px]" /> Smart Fleet AI Insights
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 backdrop-blur-sm flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">Reallocation Opportunity</h4>
                  {recommendation ? (
                    <p className="text-xs text-slate-300 leading-relaxed mb-4">
                      <span className="font-mono font-bold text-amber-400">{recommendation.equipment_id}</span> sits idle at{" "}
                      <span className="font-semibold text-white">{siteName(recommendation.from_site)}</span> while{" "}
                      <span className="font-semibold text-white">{siteName(recommendation.to_site)}</span> shows high 7-day demand.
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">
                      No reallocation gaps detected — demand is evenly balanced across active job sites.
                    </p>
                  )}
                </div>
                <Link
                  to="/rentals"
                  className="inline-flex items-center justify-center gap-1.5 text-xs font-bold px-3.5 py-2 bg-cat-yellow text-slate-950 rounded-lg hover:bg-cat-yellow-hover transition-all uppercase tracking-wider shadow-sm"
                >
                  Review Reallocation →
                </Link>
              </div>

              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 backdrop-blur-sm flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">Predictive Health Score</h4>
                  {lowHealth ? (
                    <p className="text-xs text-slate-300 leading-relaxed mb-4">
                      <span className="font-mono font-bold text-amber-400">{lowHealth.equipment_id}</span> has lowest health index (
                      <span className="font-bold text-rose-400">{Math.round(lowHealth.health_score)}/100</span>,{" "}
                      {healthBucket(lowHealth.health_score).label.toLowerCase()}). Inspection recommended.
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">No equipment health alerts recorded.</p>
                  )}
                </div>
                {lowHealth && (
                  <Link
                    to={`/fleet/${lowHealth.equipment_id}`}
                    className="inline-flex items-center justify-center gap-1.5 text-xs font-bold px-3.5 py-2 bg-white text-slate-900 rounded-lg hover:bg-slate-100 transition-all uppercase tracking-wider shadow-sm"
                  >
                    Schedule Service →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6 flex flex-col">
          {/* 7-Day Forecast Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <h3 className="text-sm font-bold text-slate-900">7-Day Demand Forecast</h3>
              <p className="text-xs text-slate-500">Projected machine requirement per site</p>
            </div>
            <div className="p-6 space-y-3.5">
              {forecast?.forecast_by_site ? (
                Object.entries(forecast.forecast_by_site).map(([siteId, series]) => {
                  const total = series.reduce((a, b) => a + b, 0);
                  const max = Math.max(1, ...Object.values(forecast.forecast_by_site).map((s) => s.reduce((a, b) => a + b, 0)));
                  return (
                    <div key={siteId} className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-slate-700 w-28 truncate">{siteName(siteId)}</span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60 p-0.5">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all duration-500"
                          style={{ width: `${(total / max) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-900 w-10 text-right">{total.toFixed(1)}</span>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-500">Forecast model updating…</p>
              )}
            </div>
          </div>

          {/* Live Map Panel */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col flex-1 min-h-[320px] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Live GPS Fleet Tracking</h3>
                <p className="text-xs text-slate-500">Active machine pin locations</p>
              </div>
              <Link
                to="/map"
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 p-1.5 rounded-lg transition-colors"
                title="Expand Map"
              >
                <Icon name="fullscreen" className="text-[18px]" />
              </Link>
            </div>
            <div className="p-3 flex-1 flex flex-col">
              <MiniMap equipment={equipment} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

