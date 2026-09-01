import { NavLink } from "react-router-dom";
import Icon from "./Icon";

const ITEMS = [
  { to: "/", label: "Dashboard", icon: "dashboard", end: true },
  { to: "/fleet", label: "Fleet", icon: "precision_manufacturing" },
  { to: "/rentals", label: "Rentals", icon: "contract" },
  { to: "/map", label: "Map", icon: "map" },
  { to: "/maintenance", label: "Maint.", icon: "build" },
];

export default function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-cat-charcoal border-t border-outline-variant flex justify-around items-stretch h-16 z-20">
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 flex-1 text-label-sm font-label-sm ${
              isActive ? "text-cat-yellow bg-cat-yellow/10" : "text-surface-variant/60"
            }`
          }
        >
          <Icon name={item.icon} className="text-[20px]" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
