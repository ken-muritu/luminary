import { Zap } from 'lucide-react'

const LINKS = {
  Product: [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Try v3', href: '#try' },
  ],
  Resources: [
    { label: 'GitHub', href: 'https://github.com/kenmuritu/luminary' },
    { label: 'Releases', href: 'https://github.com/kenmuritu/luminary/releases' },
    { label: 'PWA deploy', href: 'https://github.com/kenmuritu/luminary/tree/main/apps/pwa' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
  ],
}

export default function Footer() {
  return (
    <footer className="border-t border-outline-variant/10 py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-primary-gradient flex items-center justify-center shadow-glow-sm">
                <Zap className="w-4 h-4 text-white" fill="currentColor" />
              </div>
              <span className="text-white font-bold text-lg">Luminary</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed max-w-[200px]">
              Browser-first church projection with Whisper AI verse detection. Built for reverence.
            </p>
            <p className="text-xs text-text-secondary/50 mt-4">
              © 2026 Kennedy Muritu.
              <br />
              All rights reserved.
            </p>
          </div>

          {Object.entries(LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-xs font-semibold text-white uppercase tracking-widest mb-4">{heading}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-text-secondary hover:text-white transition-colors duration-150"
                      target={link.href.startsWith('http') ? '_blank' : undefined}
                      rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-outline-variant/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-secondary/50">
            Luminary v3 · Built in Nairobi, Kenya
          </p>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
            <span className="text-xs text-secondary font-medium">Offline-first PWA</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
