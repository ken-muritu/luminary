import { Mic2, WifiOff, Monitor, Music2, ListOrdered, Zap, BarChart3, Shield } from 'lucide-react'

const FEATURES = [
  {
    icon: Mic2,
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/15',
    title: 'Whisper AI in the Browser',
    desc: 'Passive on-device listening powered by Whisper WASM. Detects Bible references as you preach — no push-to-talk, no cloud API. Models run locally after first download.',
  },
  {
    icon: WifiOff,
    color: 'text-secondary',
    bg: 'bg-secondary/10',
    border: 'border-secondary/15',
    title: '100% Offline',
    desc: 'Every feature — AI inference, Bible lookup, song playback — runs entirely on your machine. No internet required. No audio ever leaves the room.',
  },
  {
    icon: Monitor,
    color: 'text-tertiary',
    bg: 'bg-tertiary/10',
    border: 'border-tertiary/15',
    title: 'PWA + Desktop',
    desc: 'Run Luminary v3 in Chrome or Edge as an installable PWA, or use the Tauri desktop shell for native multi-window projection.',
  },
  {
    icon: Music2,
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/15',
    title: 'Song Library',
    desc: 'Unlimited songs with CCLI tracking built in. Lyrics editor, key and BPM management, auto-tag, and usage history for compliance reporting.',
  },
  {
    icon: ListOrdered,
    color: 'text-secondary',
    bg: 'bg-secondary/10',
    border: 'border-secondary/15',
    title: 'Smart Setlists',
    desc: 'Plan your entire service — from pre-service countdown to closing benediction. Songs, verses, media, timers, and announcements in one ordered flow.',
  },
  {
    icon: Zap,
    color: 'text-tertiary',
    bg: 'bg-tertiary/10',
    border: 'border-tertiary/15',
    title: '<1.5s Detection',
    desc: 'From spoken word to projected verse in under 1.5 seconds. Confidence-scored detections surface as operator cue cards before committing to screen.',
  },
  {
    icon: BarChart3,
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/15',
    title: 'CCLI Reporting',
    desc: 'Automatic song usage logging for CCLI compliance. Generate and export your quarterly report in one click — no manual tracking.',
  },
  {
    icon: Shield,
    color: 'text-secondary',
    bg: 'bg-secondary/10',
    border: 'border-secondary/15',
    title: 'Offline License',
    desc: 'Hardware-fingerprint licensing with zero network calls. Validate your key once during activation — it never phones home again.',
  },
]

export default function Features() {
  return (
    <section id="features" className="py-28 px-6 relative">
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-primary/4 blur-[120px] rounded-full pointer-events-none -translate-y-1/2" />

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="section-label mb-4">Built Different</p>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-5">
            Everything your worship tech{' '}
            <span className="gradient-text">needs to disappear</span>
          </h2>
          <p className="text-on-surface-variant max-w-xl mx-auto leading-relaxed">
            The best projection software is the one the congregation never notices.
            Luminary is built so your team can focus on worship — not slides.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => {
            const Icon = f.icon
            return (
              <div
                key={f.title}
                className={`card-hover p-6 border ${f.border} group`}
                style={{ animationDelay: `${i * 75}ms` }}
              >
                <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h3 className="text-sm font-bold text-white mb-2">{f.title}</h3>
                <p className="text-xs text-text-secondary leading-relaxed">{f.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
