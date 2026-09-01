import { healthBucket } from "../lib/format";

export default function HealthBar({ score, showLabel = true, width = "w-20" }) {
  const bucket = healthBucket(score);
  return (
    <div className="flex items-center gap-2">
      <div className={`${width} h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/80 p-0.5 shadow-inner`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${bucket.bar}`}
          style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
        />
      </div>
      {showLabel && <span className={`text-xs font-semibold ${bucket.color}`}>{bucket.label}</span>}
    </div>
  );
}

