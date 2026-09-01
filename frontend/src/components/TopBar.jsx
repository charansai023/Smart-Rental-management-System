import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "./Icon";
import { useFleetData } from "../context/FleetDataContext";

export default function TopBar() {
  const { alerts, wsConnected, equipment } = useFleetData();
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const unacked = alerts.filter((a) => !a.acknowledged);

  const onSearch = (e) => {
    e.preventDefault();
    const q = query.trim().toUpperCase();
    if (!q) return;
    const match = equipment.find((e) => e.equipment_id.toUpperCase().includes(q));
    if (match) navigate(`/fleet/${match.equipment_id}`);
  };

  return (
    <header className="bg-cat-charcoal border-b border-slate-800 shadow-md flex justify-between items-center w-full px-4 md:px-6 h-16 shrink-0 z-10">
      <div className="flex items-center gap-6 min-w-0">
        <Link to="/" className="text-xl font-bold tracking-tight text-white md:hidden shrink-0 flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-cat-yellow text-slate-950 flex items-center justify-center font-black text-sm">C</span>
          CatFleet360
        </Link>
      </div>

      <div className="flex items-center gap-3 md:gap-4 ml-auto">
        <form onSubmit={onSearch} className="relative hidden sm:block">
          <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-400 rounded-full pl-10 pr-4 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-cat-yellow/50 focus:border-cat-yellow w-48 md:w-64 transition-all shadow-inner"
            placeholder="Search asset ID or site..."
            type="text"
          />
        </form>

        {/* Live Status Badge */}
        <span
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border transition-all ${
            wsConnected
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 shadow-2xs"
              : "border-rose-500/40 bg-rose-500/10 text-rose-400"
          }`}
          title={wsConnected ? "Real-time socket stream connected" : "Socket disconnected"}
        >
          <span className={`w-2 h-2 rounded-full ${wsConnected ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
          {wsConnected ? "LIVE TELEMETRY" : "OFFLINE"}
        </span>

        {/* Alerts Bell */}
        <Link
          to="/maintenance"
          className="text-slate-300 hover:text-white hover:bg-slate-800 p-2 rounded-xl transition-all relative"
          title="Active Alerts"
        >
          <Icon name="notifications" className="text-[20px]" />
          {unacked.length > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-cat-charcoal animate-pulse" />
          )}
        </Link>

        {/* User Avatar */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-cat-yellow text-slate-950 font-bold flex items-center justify-center text-xs shadow-sm ring-2 ring-cat-yellow/30">
            OP
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-semibold text-slate-100">Fleet Admin</div>
            <div className="text-[10px] text-slate-400">Caterpillar Inc.</div>
          </div>
        </div>
      </div>
    </header>
  );
}

