import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  badge?: {
    text: string;
    tone: 'success' | 'warning' | 'danger' | 'neutral';
  };
}

const badgeStyles = {
  success: 'bg-emerald-950/70 text-emerald-300 border-emerald-700/50',
  warning: 'bg-amber-950/70 text-amber-300 border-amber-700/50',
  danger: 'bg-rose-950/80 text-rose-300 border-rose-700/60',
  neutral: 'bg-[#2a1019] text-[#e5b3c4] border-[#521e30]',
};

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
}: MetricCardProps) {
  return (
    <div className="rounded-2xl bg-gradient-to-b from-[#1b0c12] to-[#13080c] border border-[#3d1624] p-5 shadow-lg shadow-black/30 hover:border-[#6e223c] transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="p-2.5 rounded-xl bg-[#2b101a] border border-[#541d31] text-[#f472a1]">
          <Icon className="h-5 w-5" />
        </div>
        {badge && (
          <span
            className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${
              badgeStyles[badge.tone]
            }`}
          >
            {badge.text}
          </span>
        )}
      </div>

      <div className="mt-4">
        <p className="text-xs font-medium uppercase tracking-wider text-[#b38293]">
          {title}
        </p>
        <p className="mt-1.5 text-2xl font-bold tracking-tight text-[#fff5f8]">
          {value}
        </p>
        <p className="mt-1 text-xs text-[#9c6b7c]">{subtitle}</p>
      </div>
    </div>
  );
}
