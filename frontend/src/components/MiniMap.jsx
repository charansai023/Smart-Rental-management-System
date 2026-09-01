import { Link } from "react-router-dom";

const BOUNDS = { latMin: 8, latMax: 29, lngMin: 68, lngMax: 89 };

const DOT_COLOR = {
  AVAILABLE: "bg-emerald-500 ring-emerald-300",
  RENTED: "bg-amber-500 ring-amber-300",
  IDLE: "bg-slate-400 ring-slate-200",
  MAINTENANCE: "bg-rose-500 ring-rose-300",
};

function project(lat, lng) {
  const x = ((lng - BOUNDS.lngMin) / (BOUNDS.lngMax - BOUNDS.lngMin)) * 100;
  const y = 100 - ((lat - BOUNDS.latMin) / (BOUNDS.latMax - BOUNDS.latMin)) * 100;
  return { x: Math.min(94, Math.max(6, x)), y: Math.min(94, Math.max(6, y)) };
}

export default function MiniMap({ equipment, linkToDetail = true, height = "" }) {
  const withLocation = equipment.filter((e) => e.latitude && e.longitude);

  return (
    <div className={`relative flex-1 min-h-[240px] ${height} bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-inner`}>
      {/* Grid pattern evoking map view */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-transparent to-slate-900/60" />

      {withLocation.map((eq) => {
        const { x, y } = project(eq.latitude, eq.longitude);
        const dot = DOT_COLOR[eq.status] || DOT_COLOR.IDLE;
        const Pin = (
          <div
            key={eq.equipment_id}
            className="absolute -translate-x-1/2 -translate-y-1/2 group z-10 hover:z-30 cursor-pointer"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <div className={`w-3.5 h-3.5 rounded-full ${dot} ring-4 shadow-lg transition-transform group-hover:scale-125`} />
            <div className="absolute left-1/2 -translate-x-1/2 top-5 whitespace-nowrap text-xs font-mono font-bold bg-slate-950 text-amber-400 px-2 py-1 rounded-md border border-slate-700 shadow-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none">
              {eq.equipment_id} <span className="text-slate-300 font-sans font-normal">({eq.type})</span>
            </div>
          </div>
        );
        return linkToDetail ? (
          <Link key={eq.equipment_id} to={`/fleet/${eq.equipment_id}`} className="contents">
            {Pin}
          </Link>
        ) : (
          Pin
        );
      })}

      {withLocation.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-slate-400">
          No live GPS telemetry streams recorded — launch the IoT simulator.
        </div>
      )}
    </div>
  );
}

