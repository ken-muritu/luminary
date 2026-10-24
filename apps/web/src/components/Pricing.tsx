import { Check, Zap, Crown } from 'lucide-react'
import { cn } from '../lib/utils'

const TIERS = [
  {
    id: 'community',
    name: 'Community',
    price: 'Free',
    period: 'forever',
    badge: null,
    highlight: true,
    cta: 'Try Luminary v3',
    ctaHref: '#try',
    features: [
      'Browser PWA — installable',
      '1 projection output',
      'KJV, NKJV, NLT, AMP offline',
      'Unlimited song library',
      'Whisper Tiny AI',
      'Turso local database',
      'Community support',
    ],
    limits: ['Desktop shell optional', 'No team sync yet'],
  },
  {
    id: 'standard',
    name: 'Standard',
    price: '$99',
    period: '/year',
    badge: 'Coming soon',
    highlight: false,
    cta: 'Join waitlist',
    ctaHref: '#try',
    features: [
      'Everything in Community',
      'Whisper Base AI',
      'Dual display output',
      'Auto-project detected verses',
      'CCLI export',
      'Priority email support',
    ],
    limits: ['Billing not active in v3 beta'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$199',
    period: '/year',
    badge: null,
    highlight: false,
    cta: 'Join waitlist',
    ctaHref: '#try',
    features: [
      'Everything in Standard',
      'Whisper Small AI',
      'Tauri desktop builds',
      'Multi-display routing',
      'Stage display mode',
      'Team setlist sync (planned)',
    ],
    limits: [],
  },
]

export default function Pricing() {
  return (
    <section id="pricing" className="py-28 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="section-label mb-4">Pricing</p>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
            Start free in the browser
          </h2>
          <p className="text-on-surface-variant max-w-xl mx-auto">
            Luminary v3 is free to try today. Paid tiers unlock advanced AI and team features as we
            ship them.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              className={cn(
                'relative rounded-2xl border p-8 flex flex-col',
                tier.highlight
                  ? 'border-primary/40 bg-surface-container shadow-glow'
                  : 'border-outline-variant/15 bg-surface-high'
              )}
            >
              {tier.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold bg-primary text-white px-3 py-1 rounded-full">
                  {tier.badge}
                </span>
              )}

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  {tier.id === 'pro' ? (
                    <Crown className="w-5 h-5 text-tertiary" />
                  ) : (
                    <Zap className="w-5 h-5 text-primary" fill="currentColor" />
                  )}
                  <h3 className="text-lg font-bold text-white">{tier.name}</h3>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">{tier.price}</span>
                  <span className="text-text-secondary text-sm">{tier.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-on-surface-variant">
                    <Check className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href={tier.ctaHref}
                className={cn(
                  'w-full justify-center text-sm py-3',
                  tier.highlight ? 'btn-primary' : 'btn-outline'
                )}
              >
                {tier.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
