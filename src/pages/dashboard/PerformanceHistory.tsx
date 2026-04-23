import { useState, useEffect, useMemo } from 'react'
import { TrendingUp, TrendingDown, Award, Target, RefreshCw } from 'lucide-react'
import { api } from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Transaction {
  id:          string
  type:        string
  amount:      number
  currency:    string
  status:      string
  note:        string | null
  adminNote:   string | null
  network:     string | null
  createdAt:   string
  completedAt: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number, decimals = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function monthKey(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function shortMonthKey(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short' })
}

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.875rem', ...style }}>
      {children}
    </div>
  )
}

function Skeleton({ w = '100%', h = 14 }: { w?: string | number; h?: number }) {
  return (
    <div style={{ width: w, height: h, borderRadius: 6, background: 'rgba(255,255,255,0.06)', animation: 'skPulse 1.4s ease-in-out infinite' }} />
  )
}

// ─── Equity Curve (SVG area from running balance) ────────────────────────────
function EquityCurve({ points }: { points: { label: string; value: number }[] }) {
  if (points.length < 2) {
    return (
      <div style={{ height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: 13, color: 'hsl(240 5% 40%)' }}>Not enough data — your equity curve will appear once transactions are posted</p>
      </div>
    )
  }
  const values = points.map(p => p.value)
  const min = Math.min(...values, 0)
  const max = Math.max(...values, 1)
  const W = 600, H = 140
  const pts = values.map((v, i) => ({
    x: (i / (values.length - 1)) * W,
    y: H - ((v - min) / (max - min)) * (H - 16) - 8,
  }))
  const line = pts.map(p => `${p.x},${p.y}`).join(' ')
  const area = `0,${H} ${line} ${W},${H}`

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 150 }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#a78bfa" stopOpacity={0.22} />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#eqGrad)" />
        <polyline points={line} fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="4" fill="#a78bfa" />
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        {points.filter((_, i) => i % Math.ceil(points.length / 7) === 0 || i === points.length - 1).map((p, i) => (
          <span key={p.label + i} style={{ fontSize: 10, color: 'hsl(240 5% 50%)' }}>{p.label}</span>
        ))}
      </div>
    </div>
  )
}

// ─── Monthly P&L Bar Chart ────────────────────────────────────────────────────
function MonthlyPnL({ months }: { months: { label: string; pnl: number }[] }) {
  if (months.length === 0) {
    return (
      <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: 13, color: 'hsl(240 5% 40%)' }}>Monthly P&L will appear here once profits are credited</p>
      </div>
    )
  }
  const max = Math.max(...months.map(d => Math.abs(d.pnl)), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120, padding: '0 4px' }}>
      {months.map(d => {
        const pct = (Math.abs(d.pnl) / max) * 85
        const isPos = d.pnl >= 0
        return (
          <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 4, height: '100%' }}>
            <span style={{ fontSize: 9, color: isPos ? '#a78bfa' : '#f87171', fontWeight: 600 }}>
              {isPos ? '+' : ''}
              {Math.abs(d.pnl) >= 1000 ? `$${(d.pnl / 1000).toFixed(1)}k` : `$${d.pnl.toFixed(0)}`}
            </span>
            <div style={{ height: `${Math.max(pct, 4)}%`, width: '100%', borderRadius: '3px 3px 0 0', background: isPos ? 'rgba(167,139,250,0.7)' : 'rgba(248,113,113,0.7)' }} />
            <span style={{ fontSize: 10, color: 'hsl(240 5% 50%)' }}>{d.label}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function PerformanceHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)

  async function fetchTx() {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<{ success: boolean; data: Transaction[] }>('/user/transactions?limit=100')
      setTransactions(res.data)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load performance data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTx() }, [])

  // ── All completed transactions ───────────────────────────────────────────────
  const completed = useMemo(() => transactions.filter(t => t.status === 'COMPLETED'), [transactions])

  // ── Equity curve: running balance from all completed transactions ────────────
  const equityCurve = useMemo(() => {
    const sorted = [...completed].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    const map: Record<string, number> = {}
    for (const tx of sorted) {
      const key = new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const delta = tx.type === 'WITHDRAWAL' ? -tx.amount : tx.amount
      map[key] = (map[key] ?? 0) + delta
    }
    let running = 0
    return Object.entries(map).map(([label, delta]) => {
      running += delta
      return { label, value: running }
    })
  }, [completed])

  // ── Monthly P&L from PROFIT + BONUS transactions ────────────────────────────
  const monthlyData = useMemo(() => {
    const map: Record<string, number> = {}
    for (const tx of completed) {
      if (tx.type !== 'PROFIT' && tx.type !== 'BONUS') continue
      const key = monthKey(tx.createdAt)
      map[key] = (map[key] ?? 0) + tx.amount
    }
    // Keep last 7 months
    return Object.entries(map)
      .slice(-7)
      .map(([key, pnl]) => ({
        label: key.split(' ')[0], // "Jan", "Feb" etc.
        fullLabel: key,
        pnl,
      }))
  }, [completed])

  // ── KPIs ────────────────────────────────────────────────────────────────────
  const profitTx    = useMemo(() => completed.filter(t => t.type === 'PROFIT'), [completed])
  const totalProfit = useMemo(() => profitTx.reduce((s, t) => s + t.amount, 0), [profitTx])
  const totalDep    = useMemo(() => completed.filter(t => t.type === 'DEPOSIT').reduce((s, t) => s + t.amount, 0), [completed])

  const winCount    = profitTx.filter(t => t.amount > 0).length
  const lossCount   = profitTx.filter(t => t.amount < 0).length
  const totalCount  = profitTx.length
  const winRate     = totalCount > 0 ? ((winCount / totalCount) * 100) : 0
  const returnPct   = totalDep > 0 ? ((totalProfit / totalDep) * 100) : 0

  const bestMonth   = useMemo(() => {
    if (monthlyData.length === 0) return null
    return monthlyData.reduce((best, m) => m.pnl > best.pnl ? m : best, monthlyData[0])
  }, [monthlyData])

  const worstMonth  = useMemo(() => {
    if (monthlyData.length === 0) return null
    return monthlyData.reduce((worst, m) => m.pnl < worst.pnl ? m : worst, monthlyData[0])
  }, [monthlyData])

  // ── Recent profit/bonus entries (shown as "trade history") ──────────────────
  const recentEntries = useMemo(() =>
    transactions.filter(t => t.type === 'PROFIT' || t.type === 'BONUS').slice(0, 15),
  [transactions])

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto overflow-x-hidden">
      <style>{`@keyframes skPulse { 0%,100%{opacity:.5} 50%{opacity:.15} } @keyframes spin { to{transform:rotate(360deg)} }`}</style>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'hsl(40 6% 95%)', marginBottom: 3 }}>Performance History</h1>
          <p style={{ fontSize: 13, color: 'hsl(240 5% 55%)' }}>Detailed breakdown of your returns and earnings over time</p>
        </div>
        <button
          onClick={fetchTx}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 0.875rem', borderRadius: '0.6rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(40 6% 85%)', fontSize: 13, cursor: 'pointer' }}
        >
          <RefreshCw size={13} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 10, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#fca5a5', fontSize: 13 }}>
          {error} — <button onClick={fetchTx} style={{ color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}>Retry</button>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {loading
          ? [0,1,2,3].map(i => (
              <Card key={i} style={{ padding: '1.125rem 1.375rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <Skeleton w={100} h={11} />
                  <Skeleton w={30} h={30} />
                </div>
                <Skeleton w={80} h={26} />
                <div style={{ marginTop: 8 }}><Skeleton w={100} h={11} /></div>
              </Card>
            ))
          : [
              {
                label: 'Total Return',
                value: `${returnPct >= 0 ? '+' : ''}${returnPct.toFixed(1)}%`,
                sub:   `$${fmt(totalProfit)} net profit`,
                icon:  TrendingUp,
                color: totalProfit >= 0 ? '#a78bfa' : '#f87171',
                bg:    totalProfit >= 0 ? 'rgba(167,139,250,0.1)' : 'rgba(248,113,113,0.1)',
              },
              {
                label: 'Win Rate',
                value: totalCount > 0 ? `${winRate.toFixed(0)}%` : '—',
                sub:   totalCount > 0 ? `${winCount}W / ${lossCount}L of ${totalCount}` : 'No profit entries yet',
                icon:  Target,
                color: '#a78bfa', bg: 'rgba(167,139,250,0.1)',
              },
              {
                label: 'Best Month',
                value: bestMonth ? `+$${fmt(bestMonth.pnl)}` : '—',
                sub:   bestMonth ? bestMonth.fullLabel : 'No monthly data yet',
                icon:  Award,
                color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',
              },
              {
                label: 'Worst Month',
                value: worstMonth && worstMonth.pnl < 0 ? `-$${fmt(Math.abs(worstMonth.pnl))}` : '—',
                sub:   worstMonth && worstMonth.pnl < 0 ? worstMonth.fullLabel : 'No negative months',
                icon:  TrendingDown,
                color: '#f87171', bg: 'rgba(248,113,113,0.1)',
              },
            ].map(s => (
              <Card key={s.label} style={{ padding: '1.125rem 1.375rem' }}>
                <div className="flex items-center justify-between mb-2">
                  <p style={{ fontSize: 12, color: 'hsl(240 5% 55%)' }}>{s.label}</p>
                  <div style={{ width: 30, height: 30, borderRadius: '0.5rem', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <s.icon size={14} style={{ color: s.color }} />
                  </div>
                </div>
                <p style={{ fontSize: '1.4rem', fontWeight: 700, color: 'hsl(40 6% 95%)', letterSpacing: '-0.02em', marginBottom: 2 }}>{s.value}</p>
                <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)' }}>{s.sub}</p>
              </Card>
            ))
        }
      </div>

      {/* Equity curve */}
      <Card style={{ padding: '1.25rem 1.5rem', marginBottom: '1.25rem' }}>
        <div className="flex items-center justify-between mb-4">
          <p style={{ fontSize: 13, fontWeight: 600, color: 'hsl(40 6% 88%)' }}>Equity Curve</p>
          <div className="flex items-center gap-1.5">
            <div style={{ width: 8, height: 2, background: '#a78bfa', borderRadius: 1 }} />
            <span style={{ fontSize: 11, color: 'hsl(240 5% 55%)' }}>Running Balance</span>
          </div>
        </div>
        {loading
          ? <div style={{ height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Skeleton w="90%" h={100} /></div>
          : <EquityCurve points={equityCurve} />
        }
      </Card>

      {/* Monthly P&L */}
      <Card style={{ padding: '1.25rem 1.5rem', marginBottom: '1.25rem' }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'hsl(40 6% 88%)', marginBottom: '1rem' }}>Monthly P&amp;L</p>
        {loading
          ? <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Skeleton w="80%" h={80} /></div>
          : <MonthlyPnL months={monthlyData} />
        }
      </Card>

      {/* Earnings / Profit log */}
      <Card>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'hsl(40 6% 92%)' }}>Earnings Log</p>
          {!loading && recentEntries.length > 0 && (
            <div className="flex items-center gap-3 text-xs" style={{ color: 'hsl(240 5% 50%)' }}>
              <span style={{ color: '#a78bfa' }}>● {winCount} positive</span>
              <span style={{ color: '#f87171' }}>● {lossCount} negative</span>
            </div>
          )}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Date', 'Description', 'Type', 'Amount', 'Status'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'hsl(240 5% 50%)', letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Loading */}
              {loading && [0,1,2,3,4].map(i => (
                <tr key={i}>
                  {[90, 200, 70, 80, 70].map((w, j) => (
                    <td key={j} style={{ padding: '1rem 1.25rem' }}><Skeleton w={w} h={12} /></td>
                  ))}
                </tr>
              ))}

              {/* Empty */}
              {!loading && recentEntries.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '52px 20px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(167,139,250,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TrendingUp size={18} style={{ color: 'rgba(167,139,250,0.3)' }} />
                      </div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'hsl(240 5% 42%)' }}>No earnings recorded yet</p>
                      <p style={{ fontSize: 12, color: 'hsl(240 5% 32%)' }}>
                        When the admin credits returns to your account they will appear here.
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {/* Real rows */}
              {!loading && recentEntries.map((t, i) => {
                const isPos = t.amount >= 0
                const statusColor =
                  t.status === 'COMPLETED' ? { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' }
                  : t.status === 'PENDING'  ? { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  }
                  : { color: '#f87171', bg: 'rgba(248,113,113,0.12)' }
                const desc = t.note || t.adminNote || (t.type === 'PROFIT' ? 'APEX Return' : 'Bonus Credit')
                return (
                  <tr
                    key={t.id}
                    style={{ borderBottom: i < recentEntries.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', transition: 'background 0.12s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '0.875rem 1.25rem', color: 'hsl(240 5% 60%)', whiteSpace: 'nowrap' }}>
                      {new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem', color: 'hsl(40 6% 85%)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {desc}
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem' }}>
                      <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 999, background: t.type === 'BONUS' ? 'rgba(245,158,11,0.12)' : 'rgba(167,139,250,0.12)', color: t.type === 'BONUS' ? '#f59e0b' : '#a78bfa' }}>
                        {t.type === 'PROFIT' ? 'Profit' : 'Bonus'}
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem', fontWeight: 600, color: isPos ? '#a78bfa' : '#f87171', whiteSpace: 'nowrap' }}>
                      {isPos ? '+' : '-'}${fmt(Math.abs(t.amount))}
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem' }}>
                      <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 9px', borderRadius: 999, color: statusColor.color, background: statusColor.bg }}>
                        {t.status.charAt(0) + t.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
