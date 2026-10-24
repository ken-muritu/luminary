import { useState } from 'react'
import { Zap, Globe, BookOpen, Mic2, CheckCircle2, ChevronRight } from 'lucide-react'
import { useServiceStore } from '../store/serviceStore'
import { useSettingsStore } from '../store/settingsStore'
import { cn } from '../lib/utils'

const STEPS = ['Welcome', 'Preferences', 'Audio Calibration']

const TRANSLATIONS = ['KJV', 'ASV', 'NIV', 'ESV', 'NASB', 'NKJV']
const LANGUAGES = ['English', 'Swahili', 'French', 'Spanish', 'Portuguese', 'Arabic']

export default function Onboarding() {
  const [step, setStep] = useState(0)
  const [lang, setLang] = useState('English')
  const [translation, setTranslation] = useState('KJV')
  const [audioLevel, setAudioLevel] = useState(-12.4)
  const [calibrating, setCalibrating] = useState(false)
  const [calibrated, setCalibrated] = useState(false)

  const { setIsOnboarded } = useServiceStore()
  const { setDefaultTranslation } = useSettingsStore()

  const runCalibration = () => {
    setCalibrating(true)
    let t = 0
    const interval = setInterval(() => {
      setAudioLevel(-12 + Math.random() * 4 - 2)
      t += 100
      if (t >= 3000) {
        clearInterval(interval)
        setCalibrating(false)
        setCalibrated(true)
      }
    }, 100)
  }

  const complete = async () => {
    setDefaultTranslation(translation)
    useSettingsStore.getState().setLanguage(
      lang === 'English' ? 'en' : lang.toLowerCase().slice(0, 2)
    )
    if (typeof window !== 'undefined' && window.luminary) {
      await window.luminary.settings.setBulk({
        defaultTranslation: translation,
        language: lang === 'English' ? 'en' : lang.toLowerCase().slice(0, 2),
        isOnboarded: true,
      })
      if (calibrated) {
        await window.luminary.ai.calibrate()
      }
    }
    setIsOnboarded(true)
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-8 relative overflow-hidden">
      {/* Background atmosphere */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-12 h-12 rounded-2xl bg-primary-gradient shadow-glow flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" fill="currentColor" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Luminary</h1>
            <p className="text-xs text-text-secondary">Church Projection & Worship Media</p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300',
                  i < step
                    ? 'bg-secondary text-surface'
                    : i === step
                    ? 'bg-primary text-white shadow-glow'
                    : 'bg-surface-high text-text-secondary'
                )}
              >
                {i < step ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn('w-8 h-px', i < step ? 'bg-secondary' : 'bg-outline-variant/30')} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="bg-surface-container rounded-2xl p-8 shadow-float border border-outline-variant/10">
          {step === 0 && (
            <div className="text-center animate-fade-in">
              <div className="text-4xl mb-4">✦</div>
              <h2 className="text-2xl font-bold text-white mb-3">Architect of Sacred Light</h2>
              <p className="text-on-surface-variant text-sm leading-relaxed mb-6">
                Luminary brings zero-delay worship projection to your church. AI-powered verse detection,
                offline-first Bible engine, and a design built for reverence — not utility.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-6 text-left">
                {[
                  { icon: BookOpen, label: '100% Offline', desc: 'No internet required' },
                  { icon: Mic2, label: 'AI Listening', desc: 'Auto verse detection' },
                  { icon: Globe, label: 'All Translations', desc: 'KJV, NIV, ESV & more' },
                  { icon: Zap, label: '<1.5s Detection', desc: 'Near-zero delay' },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="flex items-start gap-3 bg-surface-high rounded-xl p-3">
                    <Icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-white">{label}</div>
                      <div className="text-[11px] text-text-secondary">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs text-text-secondary justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                System ready — all services offline
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-white mb-1">Preferences</h2>
              <p className="text-sm text-text-secondary mb-6">Set up your primary language and Bible translation.</p>

              <div className="space-y-5">
                <div>
                  <label className="section-label mb-3 block">Primary Language</label>
                  <div className="grid grid-cols-3 gap-2">
                    {LANGUAGES.map((l) => (
                      <button
                        key={l}
                        onClick={() => setLang(l)}
                        className={cn(
                          'px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                          lang === l
                            ? 'bg-primary text-white shadow-glow'
                            : 'bg-surface-high text-on-surface-variant hover:bg-surface-bright'
                        )}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="section-label mb-3 block">Default Bible Translation</label>
                  <div className="grid grid-cols-3 gap-2">
                    {TRANSLATIONS.map((t) => (
                      <button
                        key={t}
                        onClick={() => setTranslation(t)}
                        className={cn(
                          'px-3 py-2 rounded-lg text-sm font-bold transition-all duration-150',
                          translation === t
                            ? 'bg-primary text-white shadow-glow'
                            : 'bg-surface-high text-on-surface-variant hover:bg-surface-bright',
                          (t === 'NIV' || t === 'ESV' || t === 'NASB' || t === 'NKJV') &&
                            translation !== t
                            ? 'opacity-60'
                            : ''
                        )}
                      >
                        {t}
                        {(t === 'NIV' || t === 'ESV' || t === 'NASB' || t === 'NKJV') && (
                          <span className="block text-[8px] opacity-70">License req.</span>
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-text-secondary mt-2">
                    KJV & ASV included in Community tier. Licensed translations require activation.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-white mb-1">Audio Calibration</h2>
              <p className="text-sm text-text-secondary mb-6">
                Configure your microphone input for AI verse detection.
              </p>

              <div className="space-y-5">
                <div>
                  <label className="section-label mb-2 block">Input Source</label>
                  <select className="input">
                    <option>Default Microphone</option>
                    <option>USB Audio Interface</option>
                    <option>Line-In (Mixing Board)</option>
                  </select>
                </div>

                <div>
                  <label className="section-label mb-2 block">Input Level</label>
                  <div className="bg-surface-high rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Mic2 className={cn('w-4 h-4', calibrating ? 'text-secondary animate-pulse' : 'text-text-secondary')} />
                      <span className="font-mono text-sm text-on-surface-variant">
                        {audioLevel.toFixed(1)} dB
                      </span>
                      {calibrated && (
                        <span className="ml-auto flex items-center gap-1 text-secondary text-xs font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Calibrated
                        </span>
                      )}
                    </div>
                    {/* VU Meter */}
                    <div className="flex gap-0.5 h-4 items-end">
                      {Array.from({ length: 20 }).map((_, i) => {
                        const threshold = (i / 20) * 24 - 24
                        const active = audioLevel > threshold - 2
                        return (
                          <div
                            key={i}
                            className={cn(
                              'flex-1 rounded-sm transition-all duration-75',
                              active
                                ? i > 16 ? 'bg-destructive' : i > 12 ? 'bg-tertiary' : 'bg-secondary'
                                : 'bg-surface-bright'
                            )}
                            style={{ height: `${40 + i * 3}%` }}
                          />
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div className="bg-tertiary/10 border border-tertiary/20 rounded-xl p-4">
                  <p className="text-xs text-tertiary font-medium mb-1">Calibration Tip</p>
                  <p className="text-xs text-on-surface-variant">
                    For best results, use a direct line-in connection from the church mixing board
                    rather than a room microphone. This reduces acoustic interference.
                  </p>
                </div>

                <button
                  onClick={runCalibration}
                  disabled={calibrating}
                  className={cn(
                    'w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-150',
                    calibrating
                      ? 'bg-surface-high text-text-secondary cursor-not-allowed'
                      : 'bg-surface-high text-on-surface-variant hover:bg-surface-bright border border-outline-variant/20'
                  )}
                >
                  {calibrating ? 'Calibrating…' : calibrated ? 'Re-run Calibration' : 'Run Auto-Test'}
                </button>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className={cn(
                'text-sm text-text-secondary hover:text-on-surface-variant transition-colors',
                step === 0 && 'invisible'
              )}
            >
              Back
            </button>

            {step < 2 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="btn-primary flex items-center gap-2"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={complete} className="btn-primary flex items-center gap-2">
                Complete Setup <Zap className="w-4 h-4" fill="currentColor" />
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-text-secondary mt-6 opacity-60">
          © 2026 Kennedy Muritu · Luminary v2.0
        </p>
      </div>
    </div>
  )
}
