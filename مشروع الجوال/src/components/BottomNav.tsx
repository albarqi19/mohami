import { NavLink } from "react-router-dom";
import { Briefcase, ClipboardCheck, Home, UsersRound } from "lucide-react";

const navItems = [
  { to: "/", label: "الرئيسية", icon: Home },
  { to: "/cases", label: "القضايا", icon: Briefcase },
  { to: "/tasks", label: "المهام", icon: ClipboardCheck },
  { to: "/clients", label: "العملاء", icon: UsersRound }
];

const BottomNav = () => {
  return (
    <nav className="safe-area-padder fixed bottom-0 left-0 right-0 z-50 mx-auto flex max-w-md items-center justify-around border-t border-slate-200 bg-white/95 p-2 shadow-[0_-8px_20px_-12px_rgba(15,23,42,0.2)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 rounded-full px-4 py-2 text-xs font-medium transition-all ${
              isActive
                ? "text-brand-500 dark:text-brand-300"
                : "text-slate-500 hover:text-brand-500 dark:text-slate-400 dark:hover:text-brand-200"
            }`
          }
        >
          <Icon className="h-5 w-5" strokeWidth={1.7} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
