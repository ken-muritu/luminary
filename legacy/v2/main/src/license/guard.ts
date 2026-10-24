import { getDb } from '../database/client'

export type Tier = 'community' | 'standard' | 'pro'

const TIER_RANK: Record<Tier, number> = {
  community: 0,
  standard: 1,
  pro: 2,
}

let currentTier: Tier = 'community'

export async function loadTier(): Promise<void> {
  try {
    const db = getDb()
    const result = await db.execute({
      sql: "SELECT value FROM settings WHERE key = 'licenseTier'",
      args: [],
    })
    const row = result.rows[0] as { value?: string } | undefined
    const tier = row?.value as Tier | undefined
    if (tier && tier in TIER_RANK) {
      currentTier = tier
    }
  } catch {
    currentTier = 'community'
  }
}

export function requireTier(minTier: Tier): void {
  if (TIER_RANK[currentTier] < TIER_RANK[minTier]) {
    throw new Error(`This feature requires the ${minTier} license tier`)
  }
}

export function getTier(): Tier {
  return currentTier
}

export function setTier(tier: Tier): void {
  currentTier = tier
}

export function validateLicenseKey(key: string): { valid: boolean; tier: Tier; reason?: string } {
  const normalized = key.trim().toUpperCase()
  if (!normalized) {
    return { valid: false, tier: 'community', reason: 'No key provided' }
  }
  if (normalized === 'COMMUNITY' || normalized.startsWith('LUM-COM-')) {
    return { valid: true, tier: 'community' }
  }
  if (normalized.startsWith('LUM-STD-') && normalized.length >= 12) {
    return { valid: true, tier: 'standard' }
  }
  if (normalized.startsWith('LUM-PRO-') && normalized.length >= 12) {
    return { valid: true, tier: 'pro' }
  }
  return { valid: false, tier: 'community', reason: 'Invalid key format' }
}
