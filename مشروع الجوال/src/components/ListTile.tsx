import type { KeyboardEvent, ReactNode } from "react";

interface ListTileProps {
  title: string;
  subtitle?: string;
  meta?: string;
  footer?: ReactNode;
  accent?: string;
  onClick?: () => void;
  trailing?: ReactNode;
}

const defaultAccent =
  "bg-white/90 border border-slate-200 hover:bg-white dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-slate-900";

const ListTile = ({ title, subtitle, meta, footer, onClick, trailing, accent }: ListTileProps) => {
  const classes = `w-full rounded-2xl p-4 text-right shadow-sm shadow-slate-200/50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 dark:shadow-black/30 ${
    accent ?? defaultAccent
  } ${onClick ? "cursor-pointer" : "cursor-default"}`;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onClick) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={classes}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-800 dark:text-white">{title}</p>
          {subtitle ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
        </div>
        <div className="flex flex-col items-end gap-2">
          {meta ? <span className="text-xs text-slate-500 dark:text-slate-300">{meta}</span> : null}
          {trailing ? <div onClick={(event) => event.stopPropagation()}>{trailing}</div> : null}
        </div>
      </div>
      {footer ? <div className="mt-3 text-xs text-slate-500 dark:text-slate-300">{footer}</div> : null}
    </div>
  );
};

export default ListTile;
