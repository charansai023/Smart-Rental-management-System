import Icon from "./Icon";

export default function KpiCard({ label, value, icon, accent = "border-l-cat-charcoal", iconColor = "text-slate-600", delta, labelColor = "text-slate-500" }) {
  return (
    <div className={`bg-white rounded-xl border-l-4 ${accent} border border-slate-200/80 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between`}>
      <div className="flex justify-between items-start">
        <span className={`text-xs font-semibold uppercase tracking-wider ${labelColor}`}>{label}</span>
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <Icon name={icon} className={`text-[18px] ${iconColor}`} />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2 mt-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900">{value}</span>
        {delta && (
          <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
            <Icon name="arrow_upward" className="text-[12px]" />
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}

