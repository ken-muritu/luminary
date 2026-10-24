import { useState, useEffect } from 'react'
import { Zap, Menu, X } from 'lucide-react'
import { cn } from '../lib/utils'

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Try v3', href: '#try' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed top-0 inset-x-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-surface-low/90 backdrop-blur-xl border-b border-outline-variant/10 shadow-float'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-primary-gradient shadow-glow-sm flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" fill="currentColor" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">Luminary</span>
          <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">v3</span>
        </a>

        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:text-white transition-colors duration-150"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <a href="#try" className="btn-primary text-sm py-2 px-5">
            Try free
          </a>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-text-secondary hover:text-white hover:bg-surface-high transition-colors"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-surface-low border-b border-outline-variant/10 px-6 py-4 space-y-1">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block py-2.5 text-sm text-text-secondary hover:text-white transition-colors"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-3">
            <a href="#try" className="btn-primary text-sm w-full justify-center">
              Try free
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
