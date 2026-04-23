import { useState, useEffect, useMemo } from 'react'
import { usePlatformName } from '@/context/PlatformNameContext'
import { TrendingUp, TrendingDown, ArrowDownLeft, ArrowUpRight, Wallet, RefreshCw } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Transaction {
  id:          string
  type:        string
  amount:      number
  currency:    string
  status:      string
  note:        string | null
  network:     string | null
  createdAt:   string
  completedAt: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number, decimals = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
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

// ─── Portfolio Trend (SVG area chart from real running balance) ───────────────
function TrendChart({ points }: { points: { label: string; value: number }[] }) {
  if (points.length < 2) {
    return (
      <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: 13, color: 'hsl(240 5% 40%)' }}>Not enough data yet — make a deposit to see your trend</p>
      </div>
    )
  }
  const values = points.map(p => p.value)
  const min = Math.min(...values, 0)
  const max = Math.max(...values, 1)
  const W = 600, H = 140
  const pts = values.map((v, i) => ({
    x: (i / (values.length - 1)) * W,
    y: H - ((v - min) / (max - min)) * (H - 20) - 10,
  }))
  const line = pts.map(p => `${p.x},${p.y}`).join(' ')
  const area = `0,${H} ${line} ${W},${H}`

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 150 }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="ptGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#a78bfa" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#ptGrad)" />
        <polyline points={line} fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="4" fill="#a78bfa" />
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        {points.map((p, i) => (
          // Show every other label to avoid crowding
          (i % Math.ceil(points.length / 6) === 0 || i === points.length - 1) && (
            <span key={p.label + i} style={{ fontSize: 10, color: 'hsl(240 5% 50%)' }}>{p.label}</span>
          )
        ))}
      </div>
    </div>
  )
}

// ─── Donut chart (composition: deposits vs profit vs bonus) ───────────────────
const SLICE_COLORS = ['#a78bfa', '#60a5fa', '#f59e0b', '#f87171']
const SLICE_LABELS = ['Deposited', 'Profit', 'Bonus', 'Withdrawn']

function DonutChart({ slices }: { slices: number[] }) {
  const total = slices.reduce((s, v) => s + v, 0)
  if (total === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 11, color: 'hsl(240 5% 40%)', textAlign: 'center', padding: '0 16px' }}>No data</span>
        </div>
      </div>
    )
  }
  let offset = 0
  const segs = slices.map((v, i) => {
    const pct = (v / total) * 100
    const seg = { color: SLICE_COLORS[i], pct, start: offset }
    offset += pct
    return seg
  }).filter(s => s.pct > 0)

  const gradient = segs.map(s => `${s.color} ${s.start}% ${s.start + s.pct}%`).join(', ')
  const activeCount = segs.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ position: 'relative', width: 160, height: 160 }}>
        <div style={{ width: 160, height: 160, borderRadius: '50%', background: `conic-gradient(${gradient})` }} />
        <div style={{ position: 'absolute', inset: 28, borderRadius: '50%', background: 'hsl(260 60% 5%)' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'hsl(40 6% 92%)' }}>{activeCount}</span>
          <span style={{ fontSize: 10, color: 'hsl(240 5% 50%)' }}>sources</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
        {slices.map((v, i) => v > 0 && (
          <div key={SLICE_LABELS[i]} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: SLICE_COLORS[i] }} />
              <span style={{ fontSize: 12, color: 'hsl(40 6% 72%)' }}>{SLICE_LABELS[i]}</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'hsl(40 6% 85%)' }}>
              {((v / total) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function MyPortfolio() {
  const { platformName } = usePlatformName()
  const { user } = useAuth()
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
      setError(e?.message ?? 'Failed to load portfolio data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTx() }, [])

  // ── Derived numbers from real transactions ──────────────────────────────────
  const completed = useMemo(() => transactions.filter(t => t.status === 'COMPLETED'), [transactions])

  const totalDeposited  = useMemo(() => completed.filter(t => t.type === 'DEPOSIT').reduce((s, t) => s + t.amount, 0), [completed])
  const totalProfit     = useMemo(() => completed.filter(t => t.type === 'PROFIT').reduce((s, t) => s + t.amount, 0), [completed])
  const totalBonus      = useMemo(() => completed.filter(t => t.type === 'BONUS').reduce((s, t) => s + t.amount, 0), [completed])
  const totalWithdrawn  = useMemo(() => completed.filter(t => t.type === 'WITHDRAWAL').reduce((s, t) => s + t.amount, 0), [completed])

  const balance = user?.balance ?? 0
  const returnPct = totalDeposited > 0 ? ((totalProfit / totalDeposited) * 100) : 0

  // ── Running balance trend by month ──────────────────────────────────────────
  const trendPoints = useMemo(() => {
    const sorted = [...completed].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    const map: Record<string, number> = {}
    for (const tx of sorted) {
      const key = new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      const delta = tx.type === 'WITHDRAWAL' ? -tx.amount : tx.amount
      map[key] = (map[key] ?? 0) + delta
    }
    let running = 0
    return Object.entries(map).map(([label, delta]) => {
      running += delta
      return { label: label.split(' ')[0], value: running }
    })
  }, [completed])

  // ── Recent PROFIT transactions (shown as "Active Positions") ─────────────────
  const profitTx = useMemo(() =>
    transactions.filter(t => t.type === 'PROFIT').slice(0, 10),
  [transactions])

  // ── Donut slices ─────────────────────────────────────────────────────────────
  const donutSlices = [totalDeposited, totalProfit, totalBonus, totalWithdrawn]

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto overflow-x-hidden">
      <style>{`@keyframes skPulse { 0%,100%{opacity:.5} 50%{opacity:.15} } @keyframes spin { to{transform:rotate(360deg)} }`}</style>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'hsl(40 6% 95%)', marginBottom: 3 }}>My Portfolio</h1>
          <p style={{ fontSize: 13, color: 'hsl(240 5% 55%)' }}>Your financial position and growth overview</p>
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

      {/* Top stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {loading
          ? [0,1,2,3].map(i => (
              <Card key={i} style={{ padding: '1.125rem 1.375rem' }}>
                <Skeleton w={100} h={11} />
                <div style={{ marginTop: 10 }}><Skeleton w={120} h={24} /></div>
                <div style={{ marginTop: 8 }}><Skeleton w={70} h={11} /></div>
              </Card>
            ))
          : [
              {
                label: 'Current Balance',
                value: `$${fmt(balance)}`,
                sub: 'Available to withdraw',
                icon: Wallet,
                color: '#a78bfa', bg: 'rgba(167,139,250,0.1)',
              },
              {
                label: 'Total Deposited',
                value: `$${fmt(totalDeposited)}`,
                sub: 'All-time deposits',
                icon: ArrowDownLeft,
                color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',
              },
              {
                label: 'Total Profit',
                value: `$${fmt(totalProfit)}`,
                sub: returnPct !== 0 ? `${returnPct >= 0 ? '+' : ''}${returnPct.toFixed(1)}% return` : `From ${platformName} returns`,
                icon: TrendingUp,
                color: totalProfit >= 0 ? '#a78bfa' : '#f87171',
                bg:    totalProfit >= 0 ? 'rgba(167,139,250,0.1)' : 'rgba(248,113,113,0.1)',
              },
              {
                label: 'Total Withdrawn',
                value: `$${fmt(totalWithdrawn)}`,
                sub: 'All-time withdrawals',
                icon: ArrowUpRight,
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
                <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'hsl(40 6% 95%)', letterSpacing: '-0.02em', marginBottom: 4 }}>{s.value}</p>
                <span style={{ fontSize: 11, color: 'hsl(240 5% 50%)' }}>{s.sub}</span>
              </Card>
            ))
        }
      </div>

      {/* Trend + Donut */}
      <div className="grid lg:grid-cols-[1fr_280px] gap-5 mb-5">
        <Card style={{ padding: '1.25rem 1.5rem' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'hsl(40 6% 88%)', marginBottom: '1rem' }}>Portfolio Value Over Time</p>
          {loading
            ? <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Skeleton w="90%" h={100} /></div>
            : <TrendChart points={trendPoints} />
          }
        </Card>

        <Card style={{ padding: '1.25rem 1.5rem' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'hsl(40 6% 88%)', marginBottom: '1rem' }}>Composition</p>
          {loading
            ? <div style={{ display: 'flex', justifyContent: 'center' }}><Skeleton w={160} h={160} /></div>
            : <DonutChart slices={donutSlices} />
          }
        </Card>
      </div>

      {/* Recent Earnings / Profit Transactions */}
      <Card>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'hsl(40 6% 92%)' }}>Earnings History</p>
          {!loading && profitTx.length > 0 && (
            <span style={{ fontSize: 11, color: 'hsl(240 5% 50%)' }}>{profitTx.length} entries</span>
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
              {loading && [0,1,2,3].map(i => (
                <tr key={i}>
                  {[90, 180, 70, 80, 70].map((w, j) => (
                    <td key={j} style={{ padding: '1rem 1.25rem' }}><Skeleton w={w} h={12} /></td>
                  ))}
                </tr>
              ))}

              {/* Empty state */}
              {!loading && profitTx.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '52px 20px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(167,139,250,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TrendingUp size={18} style={{ color: 'rgba(167,139,250,0.3)' }} />
                      </div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'hsl(240 5% 42%)' }}>No earnings yet</p>
                      <p style={{ fontSize: 12, color: 'hsl(240 5% 32%)' }}>Profit credits from {platformName} will appear here.</p>
                    </div>
                  </td>
                </tr>
              )}

              {/* Real rows */}
              {!loading && profitTx.map((t, i) => {
                const isPos = t.amount >= 0
                const statusColor = t.status === 'COMPLETED' ? { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' }
                  : t.status === 'PENDING' ? { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' }
                  : { color: '#f87171', bg: 'rgba(248,113,113,0.12)' }
                const desc = `${t.note || platformName + " Return"}`
                return (
                  <tr
                    key={t.id}
                    style={{ borderBottom: i < profitTx.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', transition: 'background 0.12s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '0.875rem 1.25rem', color: 'hsl(240 5% 60%)', whiteSpace: 'nowrap' }}>
                      {new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem', color: 'hsl(40 6% 85%)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {desc}
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem' }}>
                      <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 999, background: 'rgba(96,165,250,0.12)', color: '#60a5fa' }}>
                        {t.type === 'PROFIT' ? 'Profit' : t.type === 'BONUS' ? 'Bonus' : t.type}
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem', fontWeight: 600, color: isPos ? '#a78bfa' : '#f87171', whiteSpace: 'nowrap' }}>
                      {isPos ? '+' : ''}${fmt(Math.abs(t.amount))}
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
