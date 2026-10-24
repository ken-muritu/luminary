import { useState, useEffect, useCallback } from 'react'
import {
  BarChart3, Download, AlertTriangle, CheckCircle2,
  TrendingUp, Music2, Calendar, Filter, Loader2
} from 'lucide-react'
import { cn } from '../lib/utils'
import type { TopSongRow, MonthlyCount, ReportSummary } from '../types/luminary'

const FILTER_DAYS: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }

export default function Reports() {
  const [dateFilter, setDateFilter] = useState('30d')
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<ReportSummary>({ total: 0, unique: 0, missingCcli: 0 })
  const [topSongs, setTopSongs] = useState<TopSongRow[]>([])
  const [monthly, setMonthly] = useState<MonthlyCount[]>([])

  const days = FILTER_DAYS[dateFilter] ?? 30

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [s, t, m] = await Promise.all([
        window.luminary.reports.getSummary({ days }),
        window.luminary.reports.getTopSongs({ days, limit: 20 }),
        window.luminary.reports.getMonthlyTotals({ months: 12 }),
      ])
      setSummary(s)
      setTopSongs(t.rows)
      setMonthly(m.rows)
    } catch { /* keep previous data on error */ }
    finally { setLoading(false) }
  }, [days])

  useEffect(() => { load() }, [load])

  const handleExport = async () => {
    try {
      const { csv, count } = await window.luminary.reports.exportCCLI({ days })
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `luminary-ccli-${dateFilter}.csv`; a.click()
      URL.revokeObjectURL(url)
      console.log(`Exported ${count} rows`)
    } catch { /* silent */ }
  }

  const maxBar = monthly.length > 0 ? Math.max(...monthly.map((m) => m.count), 1) : 1
  const missingSongs = topSongs.filter((s) => !s.ccli_number)

  return (
    <div className="h-full overflow-y-auto bg-surface">
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white mb-1">CCLI Song Reporting</h1>
            <p className="text-sm text-text-secondary">Automated song usage log for CCLI compliance reporting.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-surface-container rounded-xl p-1 gap-1">
              {['7d', '30d', '90d', '1y'].map((f) => (
                <button
                  key={f}
                  onClick={() => setDateFilter(f)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150',
                    dateFilter === f
                      ? 'bg-primary text-white shadow-glow'
                      : 'text-text-secondary hover:text-on-surface-variant'
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
            <button onClick={handleExport} className="btn-primary text-xs flex items-center gap-1.5 py-2">
              <Download className="w-3.5 h-3.5" />
              Generate CCLI Report
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12 text-text-secondary">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Projections', value: summary.total.toLocaleString(), delta: `last ${dateFilter}`, icon: BarChart3, color: 'text-primary', alert: false },
            { label: 'Unique Songs', value: String(summary.unique), delta: `last ${dateFilter}`, icon: Music2, color: 'text-secondary', alert: false },
            { label: 'Top Songs Period', value: dateFilter, delta: `${topSongs.length} tracked`, icon: TrendingUp, color: 'text-tertiary', alert: false },
            { label: 'Missing CCLI', value: String(summary.missingCcli), delta: 'songs in library', icon: AlertTriangle, color: 'text-destructive', alert: summary.missingCcli > 0 },
          ].map(({ label, value, delta, icon: Icon, color, alert }) => (
            <div key={label} className={cn('bg-surface-container rounded-2xl p-5 border', alert ? 'border-destructive/20' : 'border-transparent')}>
              <div className="flex items-center justify-between mb-3">
                <span className="section-label">{label}</span>
                <Icon className={cn('w-4 h-4', color)} />
              </div>
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className={cn('text-xs mt-1', alert ? 'text-destructive' : 'text-text-secondary')}>{delta}</div>
            </div>
          ))}
        </div>

        {/* Missing CCLI alert */}
        {missingSongs.length > 0 && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-destructive mb-1">
                Missing CCLI Data — {missingSongs.length} Songs
              </div>
              <p className="text-xs text-on-surface-variant mb-2">
                The following songs are missing CCLI numbers. Update them in Song Manager for full compliance.
              </p>
              <div className="flex flex-wrap gap-2">
                {missingSongs.map((s, i) => (
                  <span key={i} className="text-xs bg-destructive/10 text-destructive px-2.5 py-1 rounded-full">
                    {s.song_title}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Monthly projection bar chart */}
        <div className="bg-surface-container rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-white">Monthly Projection Totals</h3>
            {monthly.length === 0 && !loading && (
              <span className="text-xs text-text-secondary">No data yet — project songs to populate</span>
            )}
          </div>
          {monthly.length > 0 ? (
            <div className="flex items-end gap-1 h-32">
              {monthly.map((m) => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1 group">
                  <div
                    className="w-full rounded-t-md bg-primary/40 hover:bg-primary/80 transition-all duration-150 cursor-default"
                    style={{ height: `${(m.count / maxBar) * 100}%` }}
                    title={`${m.month}: ${m.count} projections`}
                  />
                  <span className="text-[9px] text-text-secondary">{m.month.slice(5)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-text-secondary text-xs">
              No projection data
            </div>
          )}
        </div>

        {/* Status cards row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-container rounded-2xl p-5">
            <div className="section-label mb-3">Reporting Status</div>
            <div className="flex items-center gap-2">
              {summary.missingCcli === 0
                ? <><CheckCircle2 className="w-5 h-5 text-secondary" /><span className="font-bold text-secondary">Compliant</span></>
                : <><AlertTriangle className="w-5 h-5 text-tertiary" /><span className="font-bold text-tertiary">{summary.missingCcli} songs need CCLI numbers</span></>
              }
            </div>
          </div>
          <div className="bg-surface-container rounded-2xl p-5">
            <div className="section-label mb-3">Next CCLI Reporting Period</div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <div>
                <div className="text-sm font-semibold text-white">Export CSV to submit</div>
                <div className="text-xs text-text-secondary">Use "Generate CCLI Report" above</div>
              </div>
            </div>
          </div>
        </div>

        {/* Song history table */}
        <div className="bg-surface-container rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant/10 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Top Songs — Last {dateFilter}</h3>
            <button onClick={load} className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-on-surface-variant transition-colors">
              <Filter className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>

          <div>
            <div className="px-6 py-2 flex items-center gap-4 text-[10px] text-text-secondary border-b border-outline-variant/5">
              <span className="flex-1">Song</span>
              <span className="w-24">CCLI #</span>
              <span className="w-24">Last Projected</span>
              <span className="w-32">Play Count</span>
            </div>

            {topSongs.length === 0 && !loading && (
              <div className="px-6 py-8 text-center text-text-secondary text-xs">
                No song usage logged yet — project songs from the Songs or Service Mode pages
              </div>
            )}

            {topSongs.map((song, idx) => (
              <div key={idx} className="px-6 py-3.5 flex items-center gap-4 border-b border-outline-variant/5 hover:bg-surface-high transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Music2 className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-on-surface-variant truncate">{song.song_title}</div>
                    </div>
                  </div>
                </div>
                <div className="w-24">
                  {song.ccli_number
                    ? <span className="text-xs font-mono text-on-surface-variant">{song.ccli_number}</span>
                    : <span className="text-xs text-destructive flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Missing</span>
                  }
                </div>
                <div className="w-24 text-xs text-text-secondary">{song.last_projected?.slice(5) ?? '—'}</div>
                <div className="w-32">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-surface-bright overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${topSongs[0]?.count ? (song.count / topSongs[0].count) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-text-secondary w-8 text-right">{song.count}×</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Export footer */}
        <div className="flex items-center justify-between text-xs text-text-secondary">
          <span>Showing data for the last {dateFilter === '30d' ? '30 days' : dateFilter}</span>
          <button onClick={handleExport} className="flex items-center gap-1.5 hover:text-on-surface-variant transition-colors">
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>
    </div>
  )
}
