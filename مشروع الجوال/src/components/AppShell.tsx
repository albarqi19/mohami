import type { ReactNode } from "react";
import BottomNav from "@/components/BottomNav";

interface AppShellProps {
  header: ReactNode;
  children: ReactNode;
}

const AppShell = ({ header, children }: AppShellProps) => {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-white pb-24 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {header}
      <main className="flex-1 space-y-4 px-4 py-6">
        {children}
      </main>
      <BottomNav />
    </div>
  );
};

export default AppShell;
