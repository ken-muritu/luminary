import { Mic2, Cpu, MonitorPlay } from 'lucide-react'

const STEPS = [
  {
    number: '01',
    icon: Mic2,
    color: 'text-primary',
    glow: 'shadow-glow-sm',
    bg: 'bg-primary/10 border-primary/20',
    title: 'Listen',
    desc: 'Connect your church mixing board or microphone. Luminary runs silently in the background, monitoring the audio feed without interrupting your workflow.',
    detail: 'Supports any audio input — USB interface, XLR mixing board tap, or room mic. Zero configuration after initial setup.',
  },
  {
    number: '02',
    icon: Cpu,
    color: 'text-secondary',
    glow: 'shadow-glow-green',
    bg: 'bg-secondary/10 border-secondary/20',
    title: 'Detect',
    desc: 'On-device AI transcribes speech in real-time and scores every possible verse reference by confidence. False positives are filtered before they reach your operator.',
    detail: 'Confidence threshold is configurable. High-confidence detections can auto-project; low-confidence ones queue for operator review.',
  },
  {
    number: '03',
    icon: MonitorPlay,
    color: 'text-tertiary',
    glow: 'shadow-glow',
    bg: 'bg-tertiary/10 border-tertiary/20',
    title: 'Project',
    desc: 'The operator sees a timed cue card. One click confirms and the verse appears on all mapped display outputs in the configured font, style, and translation.',
    detail: 'In Auto mode, confirmed verses project instantly without operator input. Blackout and clear controls are always one key away.',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-28 px-6 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/3 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <p className="section-label mb-4">The Pipeline</p>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-5">
            From spoken word to{' '}
            <span className="gradient-text-green">projected verse</span>
          </h2>
          <p className="text-on-surface-variant max-w-xl mx-auto leading-relaxed">
            Three stages. Under 1.5 seconds. Entirely on your hardware.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Connector lines */}
          <div className="hidden md:block absolute top-16 left-1/3 right-1/3 h-px bg-gradient-to-r from-primary/30 via-secondary/30 to-tertiary/30" />

          {STEPS.map((step) => {
            const Icon = step.icon
            return (
              <div key={step.number} className="relative flex flex-col">
                {/* Step number */}
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-12 h-12 rounded-2xl border ${step.bg} flex items-center justify-center ${step.glow} shrink-0`}>
                    <Icon className={`w-5 h-5 ${step.color}`} />
                  </div>
                  <span className="text-5xl font-black text-white/5 select-none leading-none">
                    {step.number}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed mb-4">{step.desc}</p>

                <div className={`mt-auto p-4 rounded-xl border ${step.bg}`}>
                  <p className="text-xs text-text-secondary leading-relaxed">{step.detail}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Timing badge */}
        <div className="flex justify-center mt-16">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-surface-container border border-outline-variant/20">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span className="text-sm text-on-surface-variant">
              Average detection latency: <span className="text-secondary font-bold">1.2 seconds</span>
            </span>
            <span className="text-outline-variant/40">·</span>
            <span className="text-sm text-text-secondary">Tested on Intel i5 / 8GB RAM</span>
          </div>
        </div>
      </div>
    </section>
  )
}
