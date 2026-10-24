import { useState } from 'react'
import { Crown, Check, Zap, Shield, Star } from 'lucide-react'
import { useSettingsStore, type LicenseTier } from '../store/settingsStore'
import { cn } from '../lib/utils'

const TIERS: {
  id: LicenseTier
  name: string
  price: string
  period: string
  badge?: string
  features: string[]
  limits: string[]
}[] = [
  {
    id: 'community',
    name: 'Community',
    price: 'Free',
    period: 'forever',
    features: [
      '1 display output',
      'KJV + ASV translations',
      'Song library (unlimited)',
      'Basic media library',
      'Vosk AI (basic accuracy)',
      'Manual CCLI reporting',
    ],
    limits: [
      'No cloud sync',
      'No parallel view',
      'No NDI® output',
    ],
  },
  {
    id: 'standard',
    name: 'Standard',
    price: '$99',
    period: '/year',
    badge: 'MOST POPULAR',
    features: [
      'Dual display output',
      'All major translations',
      'Whisper Tiny AI (< 15% CPU)',
      'Cloud sync (Dropbox / Drive)',
      'Advanced transition FX',
      'Priority email support',
      'CCLI auto-reporting CSV',
    ],
    limits: [
      'No NDI® output',
      'No remote control API',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$199',
    period: '/year',
    features: [
      'Unlimited display outputs',
      'All translations + custom',
      'Whisper Small AI (best accuracy)',
      'NDI® live video output',
      'Live video overlay',
      'Remote control API',
      '24/7 concierge support',
      'Stage Display HD',
      'Multi-campus setlist sync',
    ],
    limits: [],
  },
]

export default function Licensing() {
  const { tier, licenseKey, setTier, setLicenseKey } = useSettingsStore()
  const [inputKey, setInputKey] = useState(licenseKey)
  const [activating, setActivating] = useState(false)
  const [activated, setActivated] = useState(false)

  const handleActivate = async () => {
    if (!inputKey.trim() || !window.luminary) return
    setActivating(true)
    try {
      const result = await window.luminary.license.validate(inputKey.trim())
      if (result.valid) {
        setTier(result.tier as LicenseTier)
        setLicenseKey(inputKey.trim())
        setActivated(true)
      }
    } finally {
      setActivating(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-surface">
      <div className="p-8 max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Crown className="w-6 h-6 text-tertiary" />
            <h1 className="text-2xl font-bold text-white">Architect Your Experience</h1>
          </div>
          <p className="text-sm text-text-secondary max-w-md mx-auto">
            Choose the tier that fits your ministry. All tiers include 100% offline operation and no runtime cloud dependency.
          </p>
        </div>

        {/* Current tier */}
        <div className="bg-surface-container rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <div>
              <span className="text-sm font-semibold text-white">
                Current Tier: <span className="text-primary capitalize">{tier}</span>
              </span>
              {tier === 'community' && (
                <p className="text-xs text-text-secondary">Upgrade to unlock additional features</p>
              )}
              {tier !== 'community' && (
                <p className="text-xs text-secondary">Active — Renewal: June 30, 2027 · 3/5 devices</p>
              )}
            </div>
          </div>
          {tier !== 'community' && (
            <button className="btn-secondary text-xs">Manage Subscription</button>
          )}
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-3 gap-5">
          {TIERS.map((t) => (
            <div
              key={t.id}
              className={cn(
                'relative rounded-2xl p-6 border transition-all duration-200 flex flex-col',
                tier === t.id
                  ? 'bg-primary/5 border-primary/40 shadow-glow'
                  : t.id === 'standard'
                  ? 'bg-surface-container border-outline-variant/20'
                  : 'bg-surface-container border-outline-variant/10'
              )}
            >
              {t.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="text-[9px] font-bold px-3 py-1 rounded-full bg-primary text-white uppercase tracking-widest shadow-glow">
                    {t.badge}
                  </span>
                </div>
              )}

              <div className="mb-5">
                <h3 className="text-base font-bold text-white mb-1">{t.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">{t.price}</span>
                  <span className="text-sm text-text-secondary">{t.period}</span>
                </div>
              </div>

              <div className="flex-1 space-y-2 mb-6">
                {t.features.map((f) => (
                  <div key={f} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-secondary shrink-0 mt-0.5" />
                    <span className="text-xs text-on-surface-variant">{f}</span>
                  </div>
                ))}
                {t.limits.map((l) => (
                  <div key={l} className="flex items-start gap-2 opacity-40">
                    <span className="w-3.5 h-3.5 shrink-0 mt-0.5 flex items-center justify-center text-text-secondary text-xs">—</span>
                    <span className="text-xs text-text-secondary">{l}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setTier(t.id)}
                className={cn(
                  'w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-150',
                  tier === t.id
                    ? 'bg-primary/20 text-primary border border-primary/30 cursor-default'
                    : t.id === 'community'
                    ? 'bg-surface-high text-on-surface-variant hover:bg-surface-bright border border-outline-variant/20'
                    : 'bg-primary-gradient text-white hover:opacity-90 shadow-glow'
                )}
              >
                {tier === t.id ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <Check className="w-4 h-4" /> Current Plan
                  </span>
                ) : t.id === 'community' ? (
                  'Downgrade'
                ) : (
                  <span className="flex items-center justify-center gap-1.5">
                    <Zap className="w-4 h-4" fill="currentColor" /> Upgrade to {t.name}
                  </span>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* License key activation */}
        <div className="bg-surface-container rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-4 h-4 text-tertiary" />
            <h3 className="text-sm font-bold text-white">License Key Activation</h3>
          </div>
          <div className="flex gap-3">
            <input
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="LUMINARY-XXXX-XXXX-XXXX-XXXX"
              className="input flex-1 font-mono text-sm"
            />
            <button
              onClick={handleActivate}
              disabled={activating || !inputKey.trim()}
              className={cn(
                'btn-primary px-5 shrink-0',
                (activating || !inputKey.trim()) && 'opacity-50 cursor-not-allowed'
              )}
            >
              {activating ? (
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Activating…
                </span>
              ) : activated ? (
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4" /> Activated
                </span>
              ) : 'Activate'}
            </button>
          </div>
          <p className="text-xs text-text-secondary mt-3">
            License validation is fully offline — hardware fingerprint only. No network calls required.
          </p>
        </div>

        {/* Footer links */}
        <div className="flex items-center justify-center gap-6 text-xs text-text-secondary/60">
          <button className="hover:text-text-secondary transition-colors">Sign In</button>
          <button className="hover:text-text-secondary transition-colors">Terms of Service</button>
          <button className="hover:text-text-secondary transition-colors">Privacy Policy</button>
          <button className="hover:text-text-secondary transition-colors">Support</button>
        </div>

        <p className="text-center text-xs text-text-secondary/40 pb-4">
          © 2026 Kennedy Muritu · Luminary v2.0 · All Rights Reserved
        </p>
      </div>
    </div>
  )
}
