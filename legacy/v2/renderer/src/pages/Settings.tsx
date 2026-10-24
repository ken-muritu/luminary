import { useState, useEffect } from 'react'
import {
  Monitor, Type, BookOpen, HardDrive, RefreshCw,
  CheckCircle2, AlertCircle, Eye, EyeOff
} from 'lucide-react'
import { useSettingsStore } from '../store/settingsStore'
import { cn } from '../lib/utils'

const SECTIONS = [
  { id: 'display', label: 'Display Mapping', icon: Monitor },
  { id: 'typography', label: 'Global Typography', icon: Type },
  { id: 'bible', label: 'Bible & Scripture', icon: BookOpen },
  { id: 'backup', label: 'Backup & Sync', icon: HardDrive },
]

const WEIGHTS = ['semibold', 'bold', 'black'] as const

export default function Settings() {
  const [activeSection, setActiveSection] = useState('display')
  const [showKey, setShowKey] = useState(false)

  const {
    displays, baseFontSize, fontWeight, fontFamily,
    shadowDepth, glowDepth, showVerseNumbers, defaultTranslation,
    autoBackup, cloudSync, setDisplays,
    setBaseFontSize, setFontWeight, setFontFamily, setShadowDepth, setGlowDepth,
    setShowVerseNumbers, setDefaultTranslation, setAutoBackup, setCloudSync,
  } = useSettingsStore()

  useEffect(() => {
    if (typeof window === 'undefined' || !window.luminary) return
    window.luminary.output.getDisplays().then((screens) => {
      setDisplays(
        screens.map((d, idx) => ({
          id: String(d.id),
          name: `Display ${idx + 1}`,
          resolution: `${d.bounds.width}×${d.bounds.height}`,
          mapped: idx === 0,
          type: idx === 0 ? 'main' : idx === 1 ? 'stage' : 'overflow',
        }))
      )
    }).catch(() => {})
  }, [setDisplays])

  return (
    <div className="flex h-full bg-surface">
      {/* Sidebar */}
      <div className="w-[220px] shrink-0 flex flex-col bg-surface-low border-r border-outline-variant/10 p-4">
        <h2 className="text-sm font-bold text-white mb-4">Settings</h2>
        <nav className="space-y-1">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={cn(
                'w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all duration-150',
                activeSection === id
                  ? 'bg-primary/15 text-primary'
                  : 'text-on-surface-variant hover:bg-surface-high'
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-4 border-t border-outline-variant/10">
          <div className="flex items-center gap-2 px-3 py-2">
            <CheckCircle2 className="w-4 h-4 text-secondary" />
            <div>
              <div className="text-xs font-semibold text-secondary">System Operational</div>
              <div className="text-[10px] text-text-secondary">All services nominal</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl space-y-6">

          {activeSection === 'display' && (
            <>
              <div>
                <h2 className="text-lg font-bold text-white mb-1">Display Mapping</h2>
                <p className="text-sm text-text-secondary">Configure and map each connected monitor to a display role.</p>
              </div>

              <div className="space-y-3">
                {(displays.length ? displays : [{ id: '0', name: 'Primary Display', resolution: '—', mapped: true, type: 'main' as const }]).map((display, idx) => (
                  <div key={display.id} className="bg-surface-container rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center',
                          display.mapped ? 'bg-secondary/20' : 'bg-surface-high'
                        )}>
                          <Monitor className={cn('w-4 h-4', display.mapped ? 'text-secondary' : 'text-text-secondary')} />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">Output {String(idx + 1).padStart(2, '0')}</div>
                          <div className="text-xs text-text-secondary">{display.name} · {display.resolution}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {display.mapped
                          ? <span className="text-xs font-semibold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">Mapped</span>
                          : <span className="text-xs text-text-secondary bg-surface-high px-2 py-0.5 rounded-full">Unmapped</span>
                        }
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn-secondary text-xs py-1.5 px-3">Identify</button>
                      <button className="btn-secondary text-xs py-1.5 px-3">Calibrate</button>
                      <select className="input flex-1 text-xs" value={display.type} onChange={() => {}}>
                        <option value="main">Main Congregation</option>
                        <option value="stage">Stage Monitor</option>
                        <option value="overflow">Lobby / Overflow</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeSection === 'typography' && (
            <>
              <div>
                <h2 className="text-lg font-bold text-white mb-1">Global Typography</h2>
                <p className="text-sm text-text-secondary">Control how projected text appears on all display outputs.</p>
              </div>

              <div className="bg-surface-container rounded-2xl p-5 space-y-5">
                <div>
                  <label className="section-label mb-2 block">Font Family</label>
                  <select className="input" value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}>
                    <option value="Inter">Inter (Default)</option>
                    <option value="Georgia">Georgia (Serif)</option>
                    <option value="Helvetica Neue">Helvetica Neue</option>
                    <option value="Noto Sans">Noto Sans (Multi-language)</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="section-label">Base Font Size</label>
                    <span className="text-sm font-bold text-primary">{baseFontSize}px</span>
                  </div>
                  <input
                    type="range" min={32} max={120} value={baseFontSize}
                    onChange={(e) => setBaseFontSize(parseInt(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between mt-1 text-[10px] text-text-secondary">
                    <span>32px — Small</span>
                    <span>120px — Large</span>
                  </div>
                </div>

                <div>
                  <label className="section-label mb-2 block">Font Weight</label>
                  <div className="flex gap-2">
                    {WEIGHTS.map((w) => (
                      <button
                        key={w}
                        onClick={() => setFontWeight(w)}
                        className={cn(
                          'flex-1 py-2 rounded-lg text-sm capitalize transition-all',
                          fontWeight === w
                            ? 'bg-primary text-white'
                            : 'bg-surface-high text-text-secondary hover:bg-surface-bright'
                        )}
                        style={{ fontWeight: w === 'black' ? 900 : w === 'bold' ? 700 : 600 }}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="section-label">Shadow Depth</label>
                    <span className="text-sm font-bold text-primary">{shadowDepth}%</span>
                  </div>
                  <input
                    type="range" min={0} max={100} value={shadowDepth}
                    onChange={(e) => setShadowDepth(parseInt(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="section-label">Glow Depth</label>
                    <span className="text-sm font-bold text-primary">{glowDepth}%</span>
                  </div>
                  <input
                    type="range" min={0} max={100} value={glowDepth}
                    onChange={(e) => setGlowDepth(parseInt(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>

                {/* Live preview */}
                <div>
                  <label className="section-label mb-2 block">Live Preview</label>
                  <div className="bg-[#0D0D14] rounded-xl p-6 flex items-center justify-center min-h-[100px]">
                    <p
                      className="text-white text-center leading-tight"
                      style={{
                        fontSize: `${Math.min(baseFontSize, 48)}px`,
                        fontWeight: fontWeight === 'black' ? 900 : fontWeight === 'bold' ? 700 : 600,
                        textShadow: `0 2px ${shadowDepth / 5}px rgba(0,0,0,${shadowDepth / 100})`,
                      }}
                    >
                      For God so loved the world
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeSection === 'bible' && (
            <>
              <div>
                <h2 className="text-lg font-bold text-white mb-1">Bible & Scripture</h2>
                <p className="text-sm text-text-secondary">Configure default translation and display preferences.</p>
              </div>

              <div className="bg-surface-container rounded-2xl p-5 space-y-5">
                <div>
                  <label className="section-label mb-2 block">Default Translation</label>
                  <select
                    value={defaultTranslation}
                    onChange={(e) => setDefaultTranslation(e.target.value)}
                    className="input"
                  >
                    {['KJV', 'ASV', 'NIV', 'ESV', 'NASB', 'NKJV'].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                  <p className="text-xs text-text-secondary mt-1.5">
                    KJV and ASV are included in Community tier. Licensed translations require separate activation.
                  </p>
                </div>

                <div className="flex items-center justify-between py-3 border-t border-outline-variant/10">
                  <div>
                    <div className="text-sm font-medium text-on-surface-variant">Show Verse Numbers</div>
                    <div className="text-xs text-text-secondary">Display verse numbers alongside text on screen</div>
                  </div>
                  <button
                    onClick={() => setShowVerseNumbers(!showVerseNumbers)}
                    className={cn(
                      'w-10 h-6 rounded-full transition-all duration-200 relative',
                      showVerseNumbers ? 'bg-primary' : 'bg-surface-high'
                    )}
                  >
                    <div className={cn(
                      'absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200 shadow',
                      showVerseNumbers ? 'left-5' : 'left-1'
                    )} />
                  </button>
                </div>
              </div>
            </>
          )}

          {activeSection === 'backup' && (
            <>
              <div>
                <h2 className="text-lg font-bold text-white mb-1">Backup & Sync</h2>
                <p className="text-sm text-text-secondary">Protect your songs, setlists, and settings with automatic backups.</p>
              </div>

              <div className="space-y-4">
                <div className="bg-surface-container rounded-2xl p-5 space-y-4">
                  <h3 className="text-sm font-bold text-white">Full System Backup</h3>
                  <div className="flex gap-3">
                    <button
                      onClick={() => window.luminary?.backup.create()}
                      className="btn-primary text-xs flex items-center gap-1.5"
                    >
                      <HardDrive className="w-3.5 h-3.5" /> Export Archive
                    </button>
                    <button
                      onClick={() => window.luminary?.backup.import()}
                      className="btn-secondary text-xs"
                    >
                      Restore from File
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-3 border-t border-outline-variant/10">
                    <div>
                      <div className="text-sm font-medium text-on-surface-variant">Auto-Backup</div>
                      <div className="text-xs text-text-secondary">Weekly local backup to configured path</div>
                    </div>
                    <button
                      onClick={() => setAutoBackup(!autoBackup)}
                      className={cn('w-10 h-6 rounded-full transition-all relative', autoBackup ? 'bg-primary' : 'bg-surface-high')}
                    >
                      <div className={cn('absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow', autoBackup ? 'left-5' : 'left-1')} />
                    </button>
                  </div>
                </div>

                <div className="bg-surface-container rounded-2xl p-5 space-y-4">
                  <h3 className="text-sm font-bold text-white">Cloud Sync</h3>
                  <p className="text-xs text-text-secondary">Optional sync to cloud storage. App does not depend on this feature.</p>
                  <div className="flex gap-2">
                    {['Dropbox', 'Google Drive', 'OneDrive'].map((service) => (
                      <button key={service} className="btn-secondary text-xs py-1.5 px-3">{service}</button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between py-3 border-t border-outline-variant/10">
                    <div>
                      <div className="text-sm font-medium text-on-surface-variant">Cloud Sync Enabled</div>
                      <div className="text-xs text-text-secondary">Sync with configured cloud folder</div>
                    </div>
                    <button
                      onClick={() => setCloudSync(!cloudSync)}
                      className={cn('w-10 h-6 rounded-full transition-all relative', cloudSync ? 'bg-primary' : 'bg-surface-high')}
                    >
                      <div className={cn('absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow', cloudSync ? 'left-5' : 'left-1')} />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
