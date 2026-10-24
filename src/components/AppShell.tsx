import { cn } from "@/lib/utils";
import { useServiceStore } from "@/stores/serviceStore";
import { BookOpen, LayoutDashboard, Music2, Settings } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import LiveClock from "./LiveClock";

const NAV = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/songs", icon: Music2, label: "Songs" },
  { to: "/bible", icon: BookOpen, label: "Bible" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function AppShell() {
  const { isLive, goLive, endLive } = useServiceStore();

  return (
    <div className="flex h-screen w-screen bg-[#13131a] text-white overflow-hidden">
      <aside className="w-20 flex flex-col py-4 bg-[#1B1B22] border-r border-[#2A2931] shrink-0">
        <div className="px-2 mb-6 text-center">
          <div className="text-[#6c5ce7] font-bold text-xs tracking-widest">LUM</div>
        </div>
        <nav className="flex-1 flex flex-col gap-1 px-2">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              title={label}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center py-3 rounded-xl transition-colors",
                  isActive ? "bg-[#6c5ce7] text-white" : "text-[#C8C4D7] hover:bg-[#2A2931]",
                )
              }
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-[9px] uppercase tracking-widest">{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 flex items-center justify-between px-4 border-b border-[#2A2931] bg-[#1B1B22]/80">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                isLive ? "bg-red-500/20 text-red-400" : "bg-[#2A2931] text-[#C8C4D7]",
              )}
            >
              {isLive ? "Live" : "Standby"}
            </span>
            <button
              type="button"
              onClick={() => (isLive ? endLive() : void goLive())}
              className={cn(
                "px-4 py-1.5 rounded-lg text-sm font-medium transition-colors",
                isLive ? "bg-red-600 hover:bg-red-500" : "bg-[#6c5ce7] hover:bg-[#5b4bd4]",
              )}
            >
              {isLive ? "End Live" : "Go Live"}
            </button>
          </div>
          <LiveClock />
        </header>
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
