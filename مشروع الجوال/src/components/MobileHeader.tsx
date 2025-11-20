import { Menu, Bell } from "lucide-react";
import type { ReactNode } from "react";
import ThemeToggleButton from "@/components/ThemeToggleButton";

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  rightSlot?: ReactNode;
  leftSlot?: ReactNode;
}

const MobileHeader = ({ title, subtitle, rightSlot, leftSlot }: MobileHeaderProps) => {
  const defaultLeftSlot = (
    <button
      type="button"
      className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200"
      aria-label="فتح القائمة"
    >
      <Menu className="h-5 w-5" />
    </button>
  );

  return (
    <header className="flex items-center justify-between gap-3 px-4 pt-6">
      {leftSlot ?? defaultLeftSlot}
      <div className="flex flex-1 flex-col text-center text-slate-800 dark:text-slate-100">
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        {subtitle ? <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
      </div>
      {rightSlot ?? (
        <div className="flex items-center gap-2">
          <ThemeToggleButton />
          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200"
            aria-label="الإشعارات"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 inline-flex h-2 w-2 rounded-full bg-rose-500" />
          </button>
        </div>
      )}
    </header>
  );
};

export default MobileHeader;
