import { Download, Monitor, Cpu, HardDrive, MemoryStick, CheckCircle2, ExternalLink } from 'lucide-react'

const DOWNLOAD_URL = 'https://github.com/kenmuritu/luminary/releases/latest/download/Luminary-Setup-2.0.0.exe'
const RELEASES_URL = 'https://github.com/kenmuritu/luminary/releases'

const REQUIREMENTS = [
  { icon: Monitor, label: 'OS', value: 'Windows 10 / 11 (64-bit)' },
  { icon: Cpu, label: 'Processor', value: 'Intel i5 or AMD Ryzen 5 (4th gen+)' },
  { icon: MemoryStick, label: 'RAM', value: '8 GB minimum · 16 GB recommended' },
  { icon: HardDrive, label: 'Storage', value: '500 MB for app · 2 GB+ for AI models' },
]

const WHATS_INCLUDED = [
  'Full Luminary v2.0 application',
  'KJV + ASV Bible bundled offline',
  'Vosk AI model (Community tier)',
  'Sample setlist and song library',
  'Auto-update installer',
]

export default function DownloadSection() {
  return (
    <section id="download" className="py-28 px-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-primary/8 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="rounded-3xl border border-primary/20 bg-surface-container overflow-hidden">
          {/* Top gradient bar */}
          <div className="h-1 bg-primary-gradient" />

          <div className="p-10 md:p-14">
            <div className="grid md:grid-cols-2 gap-12 items-start">
              {/* Left — CTA */}
              <div>
                <p className="section-label mb-4">Download</p>
                <h2 className="text-4xl font-black text-white tracking-tight mb-4">
                  Get Luminary
                  <br />
                  <span className="gradient-text">for Windows</span>
                </h2>
                <p className="text-on-surface-variant leading-relaxed mb-8">
                  Start with the free Community tier. No account required.
                  No credit card. No cloud dependency. Just download and run.
                </p>

                <a
                  href={DOWNLOAD_URL}
                  className="btn-primary text-base px-8 py-4 shadow-glow w-full sm:w-auto mb-4 block sm:inline-flex"
                >
                  <Download className="w-5 h-5" />
                  Download Luminary 2.0
                  <span className="text-white/60 text-sm font-normal">.exe · ~180 MB</span>
                </a>

                <div className="flex flex-col gap-2 mb-8">
                  {WHATS_INCLUDED.map((item) => (
                    <div key={item} className="flex items-center gap-2.5 text-sm text-on-surface-variant">
                      <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3">
                  <a
                    href={RELEASES_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline text-sm py-2 px-4"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    All releases
                  </a>
                </div>

                {/* Platform coming soon */}
                <div className="mt-6 flex gap-3">
                  {['macOS', 'Linux'].map((platform) => (
                    <div
                      key={platform}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-high border border-outline-variant/15"
                    >
                      <span className="text-xs text-text-secondary/60">{platform}</span>
                      <span className="text-[10px] bg-outline-variant/20 text-text-secondary/60 px-1.5 py-0.5 rounded font-medium">Soon</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right — System requirements */}
              <div>
                <h3 className="text-sm font-bold text-white mb-5 uppercase tracking-wider">
                  System Requirements
                </h3>

                <div className="space-y-3 mb-8">
                  {REQUIREMENTS.map((req) => {
                    const Icon = req.icon
                    return (
                      <div key={req.label} className="flex items-center gap-4 p-4 bg-surface-high rounded-xl border border-outline-variant/10">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <div className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider">{req.label}</div>
                          <div className="text-sm text-on-surface-variant font-medium">{req.value}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Installation note */}
                <div className="p-4 bg-secondary/5 border border-secondary/20 rounded-xl">
                  <p className="text-xs text-secondary font-semibold mb-1">Installation takes under 2 minutes</p>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Run the installer, complete the 3-step onboarding, and Luminary is ready for Sunday service.
                    No configuration files, no command line, no IT team required.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
