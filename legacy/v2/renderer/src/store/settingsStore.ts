import { create } from 'zustand'
import { persistSetting, persistOutputTypography } from '../lib/persistSettings'

export type LicenseTier = 'community' | 'standard' | 'pro'

export interface DisplayOutput {
  id: string
  name: string
  resolution: string
  mapped: boolean
  type: 'main' | 'stage' | 'overflow'
}

interface SettingsState {
  tier: LicenseTier
  licenseKey: string
  defaultTranslation: string
  showVerseNumbers: boolean
  fontFamily: string
  baseFontSize: number
  fontWeight: 'bold' | 'black' | 'semibold'
  shadowDepth: number
  glowDepth: number
  displays: DisplayOutput[]
  autoBackup: boolean
  backupPath: string
  cloudSync: boolean
  reducedMotion: boolean
  largeFontMode: boolean
  language: string
  setTier: (t: LicenseTier) => void
  setLicenseKey: (k: string) => void
  setDefaultTranslation: (t: string) => void
  setShowVerseNumbers: (v: boolean) => void
  setFontFamily: (f: string) => void
  setBaseFontSize: (s: number) => void
  setFontWeight: (w: 'bold' | 'black' | 'semibold') => void
  setShadowDepth: (v: number) => void
  setGlowDepth: (v: number) => void
  setAutoBackup: (v: boolean) => void
  setBackupPath: (p: string) => void
  setCloudSync: (v: boolean) => void
  setReducedMotion: (v: boolean) => void
  setLargeFontMode: (v: boolean) => void
  setLanguage: (l: string) => void
  setDisplays: (d: DisplayOutput[]) => void
}

function pushTypography(state: SettingsState): void {
  persistOutputTypography({
    fontFamily: state.fontFamily,
    fontSize: state.baseFontSize,
    fontWeight: state.fontWeight,
    shadowDepth: state.shadowDepth,
    glowDepth: state.glowDepth,
  })
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  tier: 'community',
  licenseKey: '',
  defaultTranslation: 'KJV',
  showVerseNumbers: true,
  fontFamily: 'Inter',
  baseFontSize: 72,
  fontWeight: 'bold',
  shadowDepth: 50,
  glowDepth: 30,
  autoBackup: true,
  backupPath: '',
  cloudSync: false,
  reducedMotion: false,
  largeFontMode: false,
  language: 'en',
  displays: [],

  setTier: (t) => { persistSetting('licenseTier', t); set({ tier: t }) },
  setLicenseKey: (k) => { persistSetting('licenseKey', k); set({ licenseKey: k }) },
  setDefaultTranslation: (t) => { persistSetting('defaultTranslation', t); set({ defaultTranslation: t }) },
  setShowVerseNumbers: (v) => { persistSetting('showVerseNumbers', v); set({ showVerseNumbers: v }) },
  setFontFamily: (f) => {
    set({ fontFamily: f })
    persistSetting('fontFamily', f)
    pushTypography(get())
  },
  setBaseFontSize: (s) => {
    set({ baseFontSize: s })
    persistSetting('baseFontSize', s)
    pushTypography(get())
  },
  setFontWeight: (w) => {
    set({ fontWeight: w })
    persistSetting('fontWeight', w)
    pushTypography(get())
  },
  setShadowDepth: (v) => {
    set({ shadowDepth: v })
    persistSetting('shadowDepth', v)
    pushTypography(get())
  },
  setGlowDepth: (v) => {
    set({ glowDepth: v })
    persistSetting('glowDepth', v)
    pushTypography(get())
  },
  setAutoBackup: (v) => { persistSetting('autoBackup', v); set({ autoBackup: v }) },
  setBackupPath: (p) => { set({ backupPath: p }) },
  setCloudSync: (v) => { persistSetting('cloudSync', v); set({ cloudSync: v }) },
  setReducedMotion: (v) => { persistSetting('reducedMotion', v); set({ reducedMotion: v }) },
  setLargeFontMode: (v) => { persistSetting('largeFontMode', v); set({ largeFontMode: v }) },
  setLanguage: (l) => { persistSetting('language', l); set({ language: l }) },
  setDisplays: (d) => set({ displays: d }),
}))
