import type { AppSettings } from '../types/luminary'

export function persistSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
  if (typeof window === 'undefined' || !window.luminary) return
  void window.luminary.settings.set(key, value)
}

export function persistOutputTypography(cfg: {
  fontFamily: string
  fontSize: number
  fontWeight: string
  shadowDepth: number
  glowDepth: number
}): void {
  if (typeof window === 'undefined' || !window.luminary) return
  void window.luminary.output.updateConfig(cfg)
}
