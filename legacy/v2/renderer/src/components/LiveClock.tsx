import { useState, useEffect } from 'react'
import { formatTime } from '../lib/utils'

export default function LiveClock() {
  const [time, setTime] = useState(formatTime())

  useEffect(() => {
    const interval = setInterval(() => setTime(formatTime()), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <span className="text-xs font-mono text-text-secondary tabular-nums">{time}</span>
  )
}
