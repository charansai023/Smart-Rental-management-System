export default function StatusChip({ label, className = "" }) {
  let dotColor = "bg-slate-400";
  if (className.includes("success") || label.toLowerCase().includes("avail") || label.toLowerCase().includes("active") || label.toLowerCase().includes("resolv")) {
    dotColor = "bg-emerald-500";
  } else if (className.includes("warning") || label.toLowerCase().includes("rent") || label.toLowerCase().includes("soon")) {
    dotColor = "bg-amber-500";
  } else if (className.includes("error") || label.toLowerCase().includes("overdue") || label.toLowerCase().includes("maint") || label.toLowerCase().includes("crit")) {
    dotColor = "bg-rose-500";
  } else if (label.toLowerCase().includes("idle")) {
    dotColor = "bg-slate-400";
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide whitespace-nowrap shadow-2xs border transition-all ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`} />
      {label}
    </span>
  );
}

