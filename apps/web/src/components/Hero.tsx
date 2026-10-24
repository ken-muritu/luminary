import { ArrowRight, Download, Shield, Wifi, Zap } from 'lucide-react'
import { DESKTOP_RELEASES_URL } from '../lib/config'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16 overflow-hidden">
      <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-[400px] h-[400px] rounded-full bg-secondary/5 blur-[100px] pointer-events-none" />

      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(#6C5CE7 1px, transparent 1px), linear-gradient(to right, #6C5CE7 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-widest mb-8 animate-fade-up">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
          Luminary v3 — Browser PWA + Desktop
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.05] tracking-tight mb-6 animate-fade-up animate-delay-100">
          Architect of{' '}
          <span className="gradient-text">Sacred Light</span>
        </h1>

        <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto leading-relaxed mb-10 animate-fade-up animate-delay-200">
          Church projection that listens as you preach. Luminary v3 runs in your browser with
          Whisper AI verse detection, offline Bible, and projection to any display — zero typing,
          zero distraction.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14 animate-fade-up animate-delay-300">
          <a href="#try" className="btn-primary text-base px-8 py-4 shadow-glow group">
            <Zap className="w-5 h-5" fill="currentColor" />
            Try Luminary v3 free
            <span className="text-white/60 text-sm font-normal">PWA · No install wizard</span>
          </a>
          <a href="#features" className="btn-outline text-base px-8 py-4 group">
            See all features
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-text-secondary animate-fade-up animate-delay-400">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-secondary" />
            Free to start
          </span>
          <span className="w-px h-3 bg-outline-variant/40" />
          <span className="flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5 text-secondary" />
            Offline-first after first load
          </span>
          <span className="w-px h-3 bg-outline-variant/40" />
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-secondary" fill="currentColor" />
            Whisper verse detection
          </span>
        </div>

        <p className="mt-8 text-xs text-text-secondary/70 animate-fade-up animate-delay-400">
          Need the desktop shell?{' '}
          <a href={DESKTOP_RELEASES_URL} className="text-primary hover:underline inline-flex items-center gap-1">
            <Download className="w-3 h-3" />
            Tauri builds on GitHub
          </a>
        </p>
      </div>

      {/* v3 app mockup */}
      <div className="relative z-10 mt-16 w-full max-w-4xl mx-auto animate-fade-up animate-delay-500">
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container shadow-float overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-surface-high border-b border-outline-variant/10">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <span className="text-xs text-text-secondary ml-2">Luminary v3 — Dashboard</span>
          </div>
          <div className="grid grid-cols-3 gap-0 min-h-[200px] text-left text-xs">
            <div className="border-r border-outline-variant/10 p-4 space-y-2">
              <p className="text-text-secondary uppercase tracking-wider">Setlist</p>
              <div className="bg-primary/20 text-white rounded px-2 py-1">Opening Worship</div>
              <div className="bg-surface-high rounded px-2 py-1 text-on-surface-variant">Sermon</div>
            </div>
            <div className="p-4 flex items-center justify-center">
              <p className="text-white text-lg text-center font-medium">
                For God so loved the world…
                <span className="block text-text-secondary text-sm mt-2">John 3:16 · KJV</span>
              </p>
            </div>
            <div className="border-l border-outline-variant/10 p-4 space-y-2">
              <p className="text-text-secondary uppercase tracking-wider">AI Detected</p>
              <div className="bg-secondary/10 border border-secondary/20 rounded px-2 py-1 text-secondary">
                John 3:16
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
