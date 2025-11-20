import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string;
  trend?: string;
  badge?: ReactNode;
  accent?: string;
}

const StatCard = ({ title, value, trend, badge, accent = "from-brand-100 to-white dark:from-brand-500/20 dark:to-slate-900" }: StatCardProps) => {
  return (
    <article className={`rounded-3xl border border-slate-100 bg-gradient-to-br ${accent} p-5 shadow-lg shadow-brand-500/10 dark:border-slate-800`}> 
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-slate-600 dark:text-slate-300">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{value}</p>
          {trend ? <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-300">{trend}</p> : null}
        </div>
        {badge}
      </div>
    </article>
  );
};

export default StatCard;
