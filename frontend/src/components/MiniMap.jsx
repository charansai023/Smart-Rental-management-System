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
    <div className={`relative flex-1 min-h-[240px] ${height} bg-[#f0f3f5] rounded-xl overflow-hidden border border-slate-300 shadow-inner`}>
      {/* Abstract Map Terrain Features */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Fake Water Bodies */}
        <div className="absolute -bottom-32 -right-10 w-[400px] h-[400px] bg-[#dbeafe] rounded-[100px] rotate-12 blur-xl opacity-80" />
        <div className="absolute top-10 -left-20 w-[300px] h-[300px] bg-[#dbeafe] rounded-full blur-xl opacity-80" />
        
        {/* Fake Parks / Land */}
        <div className="absolute top-1/4 right-1/4 w-48 h-48 bg-[#dcfce7] rounded-full blur-xl opacity-60" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-[#dcfce7] rounded-[80px] rotate-45 blur-xl opacity-60" />
      </div>

      {/* Main Street Grid */}
      <div
        className="absolute inset-0 opacity-70 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#ffffff 2px, transparent 2px), linear-gradient(90deg, #ffffff 2px, transparent 2px)",
          backgroundSize: "80px 80px",
          backgroundPosition: "center",
        }}
      />
      {/* Sub Street Grid */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          backgroundPosition: "center",
        }}
      />

      {/* Map Zone Labels */}
      <div className="absolute top-[25%] left-[60%] text-[10px] font-bold text-slate-400 uppercase tracking-widest select-none pointer-events-none mix-blend-multiply">North Sector</div>
      <div className="absolute bottom-[35%] right-[65%] text-[10px] font-bold text-slate-400 uppercase tracking-widest select-none pointer-events-none mix-blend-multiply">South Sector</div>
      
      {/* Inner Shadow for depth */}
      <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.05)] pointer-events-none" />

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

