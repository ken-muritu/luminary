import { useEffect, useState } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useServiceStore } from './store/serviceStore'
import { useSettingsStore } from './store/settingsStore'
import AppShell from './components/AppShell'
import Onboarding from './pages/Onboarding'
import ServiceMode from './pages/ServiceMode'
import Bible from './pages/Bible'
import Songs from './pages/Songs'
import Media from './pages/Media'
import Setlist from './pages/Setlist'
import AIEngine from './pages/AIEngine'
import Settings from './pages/Settings'
import Reports from './pages/Reports'
import Licensing from './pages/Licensing'

export default function App() {
  const { isOnboarded, setIsOnboarded } = useServiceStore()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    let cancelled = false
    const finish = () => { if (!cancelled) setHydrated(true) }

    const timeout = window.setTimeout(finish, 3000)

    if (typeof window === 'undefined' || !window.luminary) {
      finish()
      return () => { cancelled = true; window.clearTimeout(timeout) }
    }

    window.luminary.settings.getAll().then((s) => {
      if (s.isOnboarded !== undefined) setIsOnboarded(s.isOnboarded as boolean)
      useSettingsStore.setState({
        ...(s.licenseTier ? { tier: s.licenseTier as 'community' | 'standard' | 'pro' } : {}),
        ...(s.licenseKey ? { licenseKey: s.licenseKey as string } : {}),
        ...(s.fontFamily ? { fontFamily: s.fontFamily as string } : {}),
        ...(s.baseFontSize ? { baseFontSize: Number(s.baseFontSize) } : {}),
        ...(s.fontWeight ? { fontWeight: s.fontWeight as 'bold' | 'black' | 'semibold' } : {}),
        ...(s.shadowDepth !== undefined ? { shadowDepth: Number(s.shadowDepth) } : {}),
        ...(s.glowDepth !== undefined ? { glowDepth: Number(s.glowDepth) } : {}),
        ...(s.defaultTranslation ? { defaultTranslation: s.defaultTranslation as string } : {}),
        ...(s.showVerseNumbers !== undefined ? { showVerseNumbers: Boolean(s.showVerseNumbers) } : {}),
        ...(s.autoBackup !== undefined ? { autoBackup: Boolean(s.autoBackup) } : {}),
        ...(s.cloudSync !== undefined ? { cloudSync: Boolean(s.cloudSync) } : {}),
        ...(s.reducedMotion !== undefined ? { reducedMotion: Boolean(s.reducedMotion) } : {}),
        ...(s.largeFontMode !== undefined ? { largeFontMode: Boolean(s.largeFontMode) } : {}),
        ...(s.language ? { language: s.language as string } : {}),
      })
    }).catch(() => {}).finally(finish)

    return () => { cancelled = true; window.clearTimeout(timeout) }
  }, [])

  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface text-on-surface-variant">
        Loading Luminary…
      </div>
    )
  }

  return (
    <HashRouter>
      <Routes>
        {!isOnboarded ? (
          <>
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="*" element={<Navigate to="/onboarding" replace />} />
          </>
        ) : (
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/service" replace />} />
            <Route path="/service" element={<ServiceMode />} />
            <Route path="/bible" element={<Bible />} />
            <Route path="/songs" element={<Songs />} />
            <Route path="/media" element={<Media />} />
            <Route path="/setlist" element={<Setlist />} />
            <Route path="/ai-engine" element={<AIEngine />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/licensing" element={<Licensing />} />
            <Route path="*" element={<Navigate to="/service" replace />} />
          </Route>
        )}
      </Routes>
    </HashRouter>
  )
}
