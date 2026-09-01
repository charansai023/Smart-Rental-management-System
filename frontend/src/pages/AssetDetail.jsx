import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Icon from "../components/Icon";
import StatusChip from "../components/StatusChip";
import CheckoutModal from "../components/CheckoutModal";
import { useFleetData } from "../context/FleetDataContext";
import * as api from "../lib/api";
import { healthBucket, deriveUtilization, friendlyModel, formatDateTime } from "../lib/format";
import { siteName, operatorName } from "../lib/referenceData";

const TABS = ["Overview", "Location", "Utilization", "Maintenance"];

export default function AssetDetail() {
  const { id } = useParams();
  const { equipment, alerts, checkin, notify } = useFleetData();
  const [tab, setTab] = useState("Overview");
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);

  const eq = equipment.find((e) => e.equipment_id === id);

  useEffect(() => {
    let cancelled = false;
    setHistoryLoading(true);
    api
      .getTelemetryHistory(id, 60)
      .then((rows) => !cancelled && setHistory(rows.reverse()))
      .catch(() => !cancelled && setHistory([]))
      .finally(() => !cancelled && setHistoryLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  const equipmentAlerts = useMemo(
    () => alerts.filter((a) => a.equipment_id === id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [alerts, id]
  );
  const latestAlert = equipmentAlerts.find((a) => !a.acknowledged) || equipmentAlerts[0];

  if (!eq) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
        <Icon name="search_off" className="text-[48px] text-slate-300 mb-2" />
        <p className="text-base font-bold text-slate-900">Asset "{id}" Not Found</p>
        <Link to="/fleet" className="text-xs font-bold text-amber-600 hover:underline uppercase tracking-wider mt-4 inline-block">
          ← Return to Fleet Directory
        </Link>
      </div>
    );
  }

  const bucket = healthBucket(eq.health_score);
  const util = deriveUtilization(eq.idle_hours_today);

  const healthTrend = history.map((h, i) => ({
    idx: i + 1,
    fuel: h.fuel_level,
  }));
  const fuelByDay = groupFuelByDay(history);

  const handleCheckin = async () => {
    try {
      await checkin(eq.qr_code);
    } catch (err) {
      notify(err.message || "Check-in failed.", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Asset Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <Link to="/fleet" className="hover:text-slate-700">
            Fleet Directory
          </Link>
          <Icon name="chevron_right" className="text-[14px]" />
          <span className="text-slate-600">{eq.type}s</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold font-mono text-slate-900 tracking-tight">{eq.equipment_id}</h1>
            <span className="text-lg font-semibold text-slate-500">- {friendlyModel(eq.type)}</span>
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
          </div>

          <div className="flex items-center gap-3">
            {eq.status === "AVAILABLE" && (
              <button
                onClick={() => setShowCheckout(true)}
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-4 py-2.5 bg-cat-yellow text-slate-950 rounded-xl shadow-sm hover:shadow-md hover:bg-cat-yellow-hover transition-all active:scale-[0.98]"
              >
                Check Out Asset
              </button>
            )}
            {eq.status === "RENTED" && (
              <button
                onClick={handleCheckin}
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-4 py-2.5 bg-cat-yellow text-slate-950 rounded-xl shadow-sm hover:shadow-md hover:bg-cat-yellow-hover transition-all active:scale-[0.98]"
              >
                <Icon name="check_circle" className="text-[18px]" /> Mark Available
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Segmented Navigation Tabs */}
      <div className="flex bg-slate-200/60 p-1 rounded-xl w-fit border border-slate-200/80 gap-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all uppercase tracking-wider ${
              tab === t ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <>
          {/* Top Metric Cards */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Health Score" icon="favorite" value={`${Math.round(eq.health_score)}`} suffix="/100" accent="border-l-emerald-500">
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60 p-0.5 mt-2">
                <div className={`h-full rounded-full ${bucket.bar}`} style={{ width: `${eq.health_score}%` }} />
              </div>
            </StatCard>
            <StatCard label="Engine Hours" icon="timer" value={Math.round(eq.engine_hours).toLocaleString()} suffix=" hrs" accent="border-l-slate-900" />
            <StatCard label="Fuel Level" icon="local_gas_station" value={`${Math.round(eq.fuel_level)}%`} accent="border-l-amber-500">
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60 p-0.5 mt-2">
                <div className="h-full rounded-full bg-amber-500" style={{ width: `${eq.fuel_level}%` }} />
              </div>
            </StatCard>
            <StatCard label="Daily Utilization" icon="trending_up" value={`${util}%`} accent="border-l-emerald-500">
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60 p-0.5 mt-2">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${util}%` }} />
              </div>
            </StatCard>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <ChartCard title="Fuel Level Stream (Telemetry)">
                {historyLoading ? (
                  <ChartPlaceholder text="Fetching telemetry logs…" />
                ) : healthTrend.length > 1 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={healthTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="idx" tick={{ fontSize: 10, fill: "#64748b" }} stroke="#cbd5e1" />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#64748b" }} stroke="#cbd5e1" />
                      <Tooltip />
                      <Line type="monotone" dataKey="fuel" stroke="#10b981" strokeWidth={2.5} dot={{ r: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <ChartPlaceholder text="No telemetry stream history logged — start the IoT simulator script." />
                )}
              </ChartCard>

              <ChartCard title="Engine Hours / Day">
                {historyLoading ? (
                  <ChartPlaceholder text="Fetching telemetry logs…" />
                ) : fuelByDay.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={fuelByDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#64748b" }} stroke="#cbd5e1" />
                      <YAxis tick={{ fontSize: 10, fill: "#64748b" }} stroke="#cbd5e1" />
                      <Tooltip />
                      <Bar dataKey="engineHours" fill="#ffcd00" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <ChartPlaceholder text="No telemetry stream history logged — start the IoT simulator script." />
                )}
              </ChartCard>
            </div>

            {/* Asset Info & AI Box */}
            <div className="space-y-6">
              {/* Caterpillar QR Tag Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Asset QR Tag</h3>
                  <span className="text-[10px] font-mono text-slate-400">Scannable</span>
                </div>
                <div className="flex items-center gap-4 pt-1">
                  <div className="w-24 h-24 bg-slate-50 border border-slate-200 rounded-xl p-1.5 shrink-0 flex items-center justify-center shadow-inner">
                    <img
                      src={api.getEquipmentQrUrl(eq.equipment_id)}
                      alt={`QR Code ${eq.equipment_id}`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="font-mono font-bold text-slate-900 text-sm">{eq.qr_code}</div>
                    <p className="text-xs text-slate-500">Scan tag at job site to check in/out instantly</p>
                    <a
                      href={api.getEquipmentQrUrl(eq.equipment_id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 uppercase tracking-wider transition-all"
                    >
                      <Icon name="print" className="text-[14px]" /> Print / View Tag
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">Technical Specification</h3>
                <DetailRow label="Machine Type" value={eq.type} />
                <DetailRow label="Site Assignment" value={siteName(eq.site_id)} />
                <DetailRow label="Active Operator" value={operatorName(eq.current_operator_id)} />
                <DetailRow label="QR Identifier" value={<span className="font-mono text-xs">{eq.qr_code}</span>} />
                <DetailRow label="Last Telemetry Pulse" value={formatDateTime(eq.updated_at)} />
                {eq.latitude && eq.longitude && (
                  <DetailRow label="Coordinates" value={<span className="font-mono text-xs">{eq.latitude.toFixed(4)}, {eq.longitude.toFixed(4)}</span>} />
                )}
              </div>

              <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-md p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
                  <Icon name="psychology" style={{ fontSize: 90 }} />
                </div>
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-2">
                  <Icon name="lightbulb" className="text-[18px]" /> Predictive Anomaly Insight
                </div>
                {latestAlert ? (
                  <>
                    <p className="text-xs text-slate-300 leading-relaxed mb-4 relative z-10">{latestAlert.body}</p>
                    <StatusChip
                      label={latestAlert.acknowledged ? "Resolved" : latestAlert.level === "critical" ? "Critical Anomaly" : "Warning"}
                      className={
                        latestAlert.acknowledged
                          ? "bg-slate-800 text-slate-300 border-slate-700"
                          : latestAlert.level === "critical"
                          ? "bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold"
                          : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      }
                    />
                  </>
                ) : (
                  <p className="text-xs text-slate-400 leading-relaxed relative z-10">No machine anomalies detected for this equipment unit.</p>
                )}
              </div>
            </div>

          </div>
        </>
      )}

      {tab === "Location" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 overflow-hidden h-[450px]">
          {eq.latitude && eq.longitude ? (
            <div className="relative w-full h-full flex items-center justify-center bg-slate-900 rounded-xl overflow-hidden">
              <div className="text-center z-10 bg-white/95 backdrop-blur-md p-6 rounded-2xl border border-slate-200 shadow-2xl max-w-sm">
                <Icon name="location_on" className="text-rose-500 text-[42px] mx-auto" />
                <p className="text-sm font-bold font-mono text-slate-900 mt-2">
                  {eq.latitude.toFixed(5)}, {eq.longitude.toFixed(5)}
                </p>
                <p className="text-xs text-slate-500 font-medium mt-1">Stationed at {siteName(eq.site_id)}</p>
                <Link
                  to="/map"
                  className="inline-flex items-center gap-1.5 mt-4 text-xs font-bold text-amber-600 hover:text-amber-700 uppercase tracking-wider bg-amber-50 px-4 py-2 rounded-lg border border-amber-200"
                >
                  View Full Map →
                </Link>
              </div>
            </div>
          ) : (
            <ChartPlaceholder text="No GPS coordinates recorded for this asset." />
          )}
        </div>
      )}

      {tab === "Utilization" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Engine Operating vs Idle Ratio</h3>
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Utilization {util}%</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 text-center">
              <div className="text-2xl font-bold text-emerald-600 font-mono">{eq.engine_hours.toFixed(1)}</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Total Engine Hours</div>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 text-center">
              <div className="text-2xl font-bold text-amber-600 font-mono">{eq.idle_hours_today.toFixed(1)}</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Idle Hours Today</div>
            </div>
          </div>
        </div>
      )}

      {tab === "Maintenance" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80">
            <h3 className="text-sm font-bold text-slate-900">Equipment Anomaly &amp; Alert History</h3>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-3.5">Logged Date</th>
                <th className="px-6 py-3.5">Anomaly Type</th>
                <th className="px-6 py-3.5">Details</th>
                <th className="px-6 py-3.5">Severity</th>
                <th className="px-6 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
              {equipmentAlerts.map((a) => (
                <tr key={a.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-mono">{formatDateTime(a.created_at)}</td>
                  <td className="px-6 py-4 capitalize font-semibold">{a.kind.replace("_", " ")}</td>
                  <td className="px-6 py-4 text-slate-600">{a.body}</td>
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
                  <td className="px-6 py-4">{a.acknowledged ? "Resolved" : "Open"}</td>
                </tr>
              ))}
              {equipmentAlerts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500 font-normal">
                    No maintenance alerts recorded for this machine.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showCheckout && (
        <CheckoutModal equipmentOptions={[eq]} defaultEquipmentId={eq.equipment_id} onClose={() => setShowCheckout(false)} />
      )}
    </div>
  );
}

function StatCard({ label, icon, value, suffix, accent, children }) {
  return (
    <div className={`bg-white rounded-xl border-l-4 ${accent} border border-slate-200/80 p-5 shadow-sm`}>
      <div className="flex justify-between items-start">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
        <Icon name={icon} className="text-slate-400 text-[18px]" />
      </div>
      <div className="flex items-baseline gap-1 mt-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono">{value}</span>
        {suffix && <span className="text-xs font-medium text-slate-500">{suffix}</span>}
      </div>
      {children}
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function ChartPlaceholder({ text }) {
  return <div className="h-[220px] flex items-center justify-center text-xs font-medium text-slate-400 text-center px-6">{text}</div>;
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between text-xs py-2 border-b border-slate-100 last:border-0">
      <span className="text-slate-500 font-medium">{label}</span>
      <span className="text-slate-900 font-semibold">{value}</span>
    </div>
  );
}

function groupFuelByDay(history) {
  if (!history.length) return [];
  const byDay = new Map();
  history.forEach((h) => {
    const day = new Date(h.timestamp).toLocaleDateString("en-IN", { weekday: "short" });
    const prev = byDay.get(day) || { day, engineHours: 0, count: 0, first: h.engine_hours, last: h.engine_hours };
    prev.last = h.engine_hours;
    prev.count += 1;
    byDay.set(day, prev);
  });
  return Array.from(byDay.values()).map((d) => ({ day: d.day, engineHours: Math.max(0, Number((d.last - d.first).toFixed(2))) || d.count * 0.05 }));
}

