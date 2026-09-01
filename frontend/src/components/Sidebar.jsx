import { NavLink } from "react-router-dom";
import Icon from "./Icon";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: "dashboard", end: true },
  { to: "/fleet", label: "Fleet Assets", icon: "precision_manufacturing" },
  { to: "/rentals", label: "Rental Leases", icon: "contract" },
  { to: "/map", label: "Live Fleet Map", icon: "map" },
  { to: "/maintenance", label: "Maintenance", icon: "build" },
];

export default function Sidebar() {
  return (
    <aside className="bg-cat-charcoal text-slate-100 left-0 h-screen w-64 border-r border-slate-800 flex flex-col py-5 space-y-2 hidden md:flex shrink-0 shadow-xl z-20">
      {/* Brand Header */}
      <div className="px-6 mb-6 flex flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cat-yellow flex items-center justify-center text-slate-950 font-black text-lg shadow-sm">
            C
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white leading-none">CatFleet360</h1>
            <p className="text-[11px] font-medium text-slate-400 mt-1 uppercase tracking-wider">Industrial Asset OS</p>
          </div>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-1.5 text-sm font-medium">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center px-3.5 py-2.5 gap-3 rounded-xl transition-all duration-150 ease-in-out font-medium ${
                isActive
                  ? "bg-cat-yellow text-slate-950 font-semibold shadow-sm"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
              }`
            }
          >
            <Icon name={item.icon} className="text-[20px]" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer Info */}
      <div className="px-4 pt-4 mx-3 border-t border-slate-800/80">
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-800/40 text-xs font-medium text-slate-400">
          <Icon name="verified_user" className="text-cat-yellow text-[18px]" />
          <div>
            <div className="text-slate-200 font-semibold">Caterpillar Fleet</div>
            <div className="text-[10px] text-slate-400">Enterprise v1.0</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

