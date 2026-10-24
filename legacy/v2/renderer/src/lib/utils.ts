import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(date: Date = new Date()): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

export function formatDate(date: Date = new Date()): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n - 1) + '…' : str
}

export function confidenceColor(confidence: number): string {
  if (confidence >= 0.9) return 'text-secondary'
  if (confidence >= 0.75) return 'text-tertiary'
  return 'text-destructive'
}

export function confidenceBg(confidence: number): string {
  if (confidence >= 0.9) return 'bg-secondary/10 border-secondary/30'
  if (confidence >= 0.75) return 'bg-tertiary/10 border-tertiary/30'
  return 'bg-destructive/10 border-destructive/30'
}
