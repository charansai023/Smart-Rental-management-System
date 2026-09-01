import { useMemo, useState } from "react";
import Icon from "../components/Icon";
import StatusChip from "../components/StatusChip";
import KpiCard from "../components/KpiCard";
import CheckoutModal from "../components/CheckoutModal";
import { useFleetData } from "../context/FleetDataContext";
import { formatDate, daysUntil } from "../lib/format";
import { siteName, operatorName } from "../lib/referenceData";

const STATUS_FILTERS = ["All", "ACTIVE", "ENDING_SOON", "OVERDUE", "COMPLETED"];

export default function RentalManagement() {
  const { rentals, equipment, checkin, notify } = useFleetData();
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const counts = useMemo(() => {
    const c = { ACTIVE: 0, ENDING_SOON: 0, OVERDUE: 0, COMPLETED: 0 };
    rentals.forEach((r) => (c[r.status] = (c[r.status] || 0) + 1));
    return c;
  }, [rentals]);

  const rows = useMemo(() => {
    let list = rentals;
    if (statusFilter !== "All") list = list.filter((r) => r.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.rental_id.toLowerCase().includes(q) ||
          r.equipment_id.toLowerCase().includes(q) ||
          operatorName(r.operator_id).toLowerCase().includes(q) ||
          siteName(r.site_id).toLowerCase().includes(q)
      );
    }
    return list;
  }, [rentals, statusFilter, search]);

  const equipmentByAsset = useMemo(() => new Map(equipment.map((e) => [e.equipment_id, e])), [equipment]);
  const availableEquipment = equipment.filter((e) => e.status === "AVAILABLE");

  const handleCheckin = async (rental) => {
    const eq = equipmentByAsset.get(rental.equipment_id);
    if (!eq) return;
    try {
      await checkin(eq.qr_code);
    } catch (err) {
      notify(err.message || "Check-in failed.", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Rental Lease Management</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Manage active machinery contracts, return schedules, and operator assignments</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowCreate(true)}
            disabled={availableEquipment.length === 0}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-4 py-2.5 bg-cat-yellow text-slate-950 rounded-xl shadow-sm hover:shadow-md hover:bg-cat-yellow-hover transition-all disabled:opacity-40 active:scale-[0.98]"
          >
            <Icon name="add" className="text-[18px]" /> Create Lease Agreement
          </button>
        </div>
      </div>

      {/* KPI Section */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Active Leases" value={counts.ACTIVE || 0} icon="description" accent="border-l-emerald-500" iconColor="text-emerald-600" />
        <KpiCard label="Expiring Soon" value={counts.ENDING_SOON || 0} icon="schedule" accent="border-l-amber-500" iconColor="text-amber-600" />
        <KpiCard label="Overdue Returns" value={counts.OVERDUE || 0} icon="warning" accent="border-l-rose-600" iconColor="text-rose-600" labelColor="text-rose-600" />
        <KpiCard label="Completed" value={counts.COMPLETED || 0} icon="task_alt" accent="border-l-slate-400" iconColor="text-slate-500" />
      </section>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between bg-slate-50/60">
          <div className="relative flex-1 min-w-[240px]">
            <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Lease ID, operator, asset..."
              className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-slate-900 font-medium"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-3.5 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-slate-900 font-semibold uppercase tracking-wider"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>
                Filter: {s === "All" ? "All Statuses" : s.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-3.5">Rental ID</th>
                <th className="px-6 py-3.5">Asset Machine</th>
                <th className="px-6 py-3.5">Assigned Operator</th>
                <th className="px-6 py-3.5">Deployment Site</th>
                <th className="px-6 py-3.5">Contract Schedule</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-800 font-medium">
              {rows.map((r) => {
                const left = daysUntil(r.expected_return_time);
                return (
                  <tr key={r.rental_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{r.rental_id}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 font-mono">{r.equipment_id}</div>
                      <div className="text-xs text-slate-500 font-normal">{equipmentByAsset.get(r.equipment_id)?.type || "—"}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-900">{operatorName(r.operator_id)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Icon name="location_on" className="text-[16px] text-slate-400" />
                        {siteName(r.site_id)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-semibold text-slate-900">
                        {formatDate(r.checkout_time)} – {formatDate(r.expected_return_time)}
                      </div>
                      <div className={`text-[11px] font-semibold mt-0.5 ${r.status === "OVERDUE" ? "text-rose-600 font-bold" : r.status === "ENDING_SOON" ? "text-amber-600" : "text-slate-500"}`}>
                        {r.status === "COMPLETED"
                          ? `Returned ${formatDate(r.checkin_time)}`
                          : r.status === "OVERDUE"
                          ? `${Math.abs(left)} days overdue!`
                          : `${left} days remaining`}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusChip
                        label={r.status.replace("_", " ")}
                        className={
                          r.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : r.status === "ENDING_SOON"
                            ? "bg-amber-50 text-amber-900 border-amber-300"
                            : r.status === "OVERDUE"
                            ? "bg-rose-50 text-rose-800 border-rose-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {r.status !== "COMPLETED" && (
                        <button
                          onClick={() => handleCheckin(r)}
                          className="text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3.5 py-1.5 rounded-lg border border-slate-200 uppercase tracking-wider transition-all active:scale-[0.98]"
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
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500 text-xs font-normal">
                    No rental contracts match the filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/60 text-xs font-medium text-slate-500">
          Showing {rows.length} of {rentals.length} active rental records
        </div>
      </div>

      {showCreate && <CheckoutModal equipmentOptions={availableEquipment} onClose={() => setShowCreate(false)} />}
    </div>
  );
}

