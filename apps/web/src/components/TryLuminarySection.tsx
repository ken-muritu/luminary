import { useState, type FormEvent } from 'react'
import { ArrowRight, Loader2, Sparkles } from 'lucide-react'
import { appSignupUrl } from '../lib/config'

export default function TryLuminarySection() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    if (!trimmedName || !trimmedEmail) {
      setError('Please enter your name and email.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid email address.')
      return
    }
    setLoading(true)
    try {
      localStorage.setItem(
        'luminary-signup',
        JSON.stringify({ name: trimmedName, email: trimmedEmail, at: Date.now() }),
      )
      window.location.href = appSignupUrl(trimmedName, trimmedEmail)
    } catch {
      setError('Could not start Luminary. Please try again.')
      setLoading(false)
    }
  }

  return (
    <section id="try" className="py-28 px-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-primary/8 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="rounded-3xl border border-primary/20 bg-surface-container overflow-hidden">
          <div className="h-1 bg-primary-gradient" />

          <div className="p-10 md:p-14 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="section-label mb-4">Try Luminary v3</p>
              <h2 className="text-4xl font-black text-white tracking-tight mb-4">
                Start projecting
                <br />
                <span className="gradient-text">in your browser</span>
              </h2>
              <p className="text-on-surface-variant leading-relaxed mb-6">
                Sign up free and launch the Luminary v3 PWA — passive Whisper verse detection,
                offline Bible, songs, and multi-display projection. No Windows installer required.
              </p>
              <ul className="space-y-2 text-sm text-on-surface-variant">
                {[
                  'Installable PWA — works offline after first load',
                  'Whisper AI verse detection in the browser',
                  'KJV, NKJV, NLT, AMP bundled locally',
                  'Desktop app (Tauri) available for power users',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-secondary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-outline-variant/15 bg-surface-high p-6 space-y-4"
            >
              <h3 className="text-lg font-bold text-white">Create your free account</h3>
              <p className="text-xs text-text-secondary">
                We&apos;ll open Luminary v3 in a new tab. Your setup stays on your device.
              </p>
              <div>
                <label htmlFor="signup-name" className="text-xs text-text-secondary block mb-1">
                  Name
                </label>
                <input
                  id="signup-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Pastor John"
                  className="w-full rounded-lg bg-surface px-3 py-2.5 text-sm text-white border border-outline-variant/20 focus:border-primary/50 outline-none"
                  autoComplete="name"
                />
              </div>
              <div>
                <label htmlFor="signup-email" className="text-xs text-text-secondary block mb-1">
                  Email
                </label>
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@church.org"
                  className="w-full rounded-lg bg-surface px-3 py-2.5 text-sm text-white border border-outline-variant/20 focus:border-primary/50 outline-none"
                  autoComplete="email"
                />
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center text-base py-3"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Try Luminary v3
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              <p className="text-[10px] text-text-secondary/70 text-center">
                By continuing you agree to use Luminary for ministry purposes. No spam.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
