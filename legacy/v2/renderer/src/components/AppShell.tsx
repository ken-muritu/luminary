import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  Radio, BookOpen, Music2, Image, ListOrdered, Mic2,
  Settings, BarChart3, Zap, Crown, MonitorPlay,
  PlayCircle, Library, LayoutList, Brain, FileText, Cloud
} from 'lucide-react'
import { useServiceStore } from '../store/serviceStore'
import { useAIStore } from '../store/aiStore'
import { cn } from '../lib/utils'
import LiveClock from './LiveClock'

const NAV_ITEMS = [
  { to: '/service', icon: Radio, label: 'Service', iconName: 'play_circle' },
  { to: '/bible', icon: BookOpen, label: 'Bible', iconName: 'auto_stories' },
  { to: '/songs', icon: Music2, label: 'Songs', iconName: 'library_music' },
  { to: '/media', icon: Image, label: 'Media', iconName: 'play_circle' },
  { to: '/setlist', icon: ListOrdered, label: 'Setlist', iconName: 'playlist_play' },
  { to: '/ai-engine', icon: Brain, label: 'AI Engine', iconName: 'psychology' },
  { to: '/reports', icon: BarChart3, label: 'Reports', iconName: 'analytics' },
  { to: '/settings', icon: Settings, label: 'Settings', iconName: 'settings' },
  { to: '/licensing', icon: Crown, label: 'License', iconName: 'workspace_premium' },
]

export default function AppShell() {
  const { isLive, isBlackout, projectionText, projectionSubtext, goLive, stopLive, clearBlackout } = useServiceStore()
  const { isListening } = useAIStore()

  const handleGoLiveToggle = async () => {
    if (!window.luminary) return
    if (isLive) {
      stopLive()
      await window.luminary.output.endLive()
      return
    }
    clearBlackout()
    goLive()
    await window.luminary.output.goLive()
    if (projectionText.trim()) {
      await window.luminary.output.setSlide({
        type: 'song',
        text: projectionText,
        subtext: projectionSubtext || undefined,
      })
    }
  }

  return (
    <div className="flex h-screen w-screen bg-[#13131a] overflow-hidden select-none font-['Inter',sans-serif]">
      {/* SideNavBar - Matching user design */}
      <aside className="w-24 flex flex-col py-4 bg-[#1B1B22] shrink-0 z-10 border-r border-[#2A2931]">
        {/* Library Header */}
        <div className="px-4 mb-8 text-center">
          <p className="font-medium text-[10px] uppercase tracking-widest text-[#C8C4D7] mb-1">Library</p>
          <div className="h-1 w-4 bg-[#6c5ce7] mx-auto rounded-full"></div>
        </div>

        {/* Nav Links - Matching user design */}
        <nav className="flex-1 flex flex-col gap-2 px-2">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              title={label}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center py-3 rounded-xl mx-2 transition-all duration-300 ease-in-out',
                  isActive
                    ? 'bg-[#6c5ce7] text-white'
                    : 'text-[#C8C4D7] hover:text-white hover:bg-[#2A2931]'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="w-5 h-5 mb-1" />
                  <span className="text-[9px] font-medium uppercase tracking-widest">{label}</span>
                  {to === '/ai-engine' && isListening && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#4bddb7] animate-pulse" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="px-2 mt-auto flex flex-col gap-2">
          <button
            onClick={() => void handleGoLiveToggle()}
            className={cn(
              'w-full py-3 font-bold text-[10px] tracking-widest uppercase rounded-xl transition-all',
              isLive
                ? 'bg-[#ffb4ab]/20 text-[#ffb4ab] border border-[#ffb4ab]/30'
                : 'bg-[#02b894] text-[#004233] hover:opacity-90'
            )}
          >
            {isLive ? 'END LIVE' : 'GO LIVE'}
          </button>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center text-[#C8C4D7] py-2 hover:text-white transition-all',
                isActive && 'text-white'
              )
            }
          >
            <Settings className="w-4 h-4" />
          </NavLink>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TopAppBar - Matching user design */}
        <header className="h-16 flex items-center justify-between px-6 bg-[#13131a] shrink-0">
          <div className="flex items-center gap-8">
            <span className="text-xl font-black tracking-tighter text-white">Luminary</span>
            <nav className="hidden md:flex gap-6 items-center">
              <span className="font-bold tracking-tight text-white">Service Mode</span>
              <span className="text-[#C8C4D7] hover:text-white transition-colors cursor-pointer">Clock</span>
              <span className="text-[#C8C4D7] hover:text-white transition-colors cursor-pointer">Status</span>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {isLive && (
              <div className="flex items-center gap-2 text-[#4bddb7]">
                <span className="w-2 h-2 rounded-full bg-[#4bddb7] animate-pulse"></span>
                <span className="text-xs font-bold uppercase tracking-widest">Live</span>
              </div>
            )}
            {isListening && (
              <div className="flex items-center gap-2 text-[#C8C4D7]">
                <Mic2 className="w-4 h-4" />
                <span className="text-xs uppercase tracking-widest">AI Listening</span>
              </div>
            )}
            <button className="p-2 text-[#C8C4D7] hover:bg-[#2A2931] rounded-xl transition-all">
              <Settings className="w-5 h-5" />
            </button>
            <button className="p-2 text-[#C8C4D7] hover:bg-[#2A2931] rounded-xl transition-all">
              <Crown className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>

        {/* BottomNavBar - Matching user design */}
        <footer className="h-10 flex justify-between items-center px-6 bg-[#13131a] border-t border-[#1B1B22] shrink-0">
          <div className="flex gap-8">
            <div className="flex items-center gap-2 cursor-pointer group">
              <MonitorPlay className="w-4 h-4 text-[#00b894]" />
              <span className="text-[10px] uppercase tracking-widest text-[#00b894] font-bold">Audio Levels</span>
            </div>
            <div className="flex items-center gap-2 cursor-pointer group">
              <Brain className="w-4 h-4 text-[#C8C4D7] group-hover:text-white transition-colors" />
              <span className="text-[10px] uppercase tracking-widest text-[#C8C4D7] group-hover:text-white transition-colors">AI Status</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4bddb7] shadow-[0_0_8px_#4bddb7]"></span>
              <span className="text-[9px] uppercase tracking-widest text-[#928ea0]">v2.4.0-PRO</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
