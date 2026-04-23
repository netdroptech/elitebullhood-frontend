import { useState, useEffect, useMemo } from 'react'
import { Download, Search, Filter, ArrowDownLeft, ArrowUpRight, TrendingUp, RefreshCw } from 'lucide-react'
import { api } from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Transaction {
  id:            string
  type:          string   // DEPOSIT | WITHDRAWAL | PROFIT | BONUS | ADJUSTMENT
  amount:        number
  currency:      string
  status:        string   // PENDING | COMPLETED | FAILED | CANCELLED
  note:          string | null
  adminNote:     string | null
  network:       string | null
  walletAddress: string | null
  createdAt:     string
  completedAt:   string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const TYPE_LABEL: Record<string, string> = {
  DEPOSIT:    'Deposit',
  WITHDRAWAL: 'Withdrawal',
  PROFIT:     'Trade',
  BONUS:      'Bonus',
  ADJUSTMENT: 'Adjustment',
}

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  COMPLETED:  { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)'  },
  PENDING:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
  FAILED:     { color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  CANCELLED:  { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
}

function isCredit(type: string) {
  return ['DEPOSIT', 'PROFIT', 'BONUS', 'ADJUSTMENT'].includes(type)
}

function amountColor(type: string, amount: number) {
  if (type === 'WITHDRAWAL') return '#f87171'
  return amount >= 0 ? '#a78bfa' : '#f87171'
}

function formatAmount(type: string, amount: number, currency = 'USD') {
  const abs = Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const prefix = type === 'WITHDRAWAL' ? '-' : '+'
  return `${prefix}$${abs}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function shortId(id: string) {
  // show last 8 chars as a short reference, or full if short
  return id.length > 12 ? 'TXN-' + id.slice(-8).toUpperCase() : id.toUpperCase()
}

function descriptionFor(tx: Transaction) {
  if (tx.note) return tx.note
  switch (tx.type) {
    case 'DEPOSIT':    return tx.network ? `${tx.network} Deposit` : 'Deposit'
    case 'WITHDRAWAL': return tx.network ? `${tx.network} Withdrawal` : 'Withdrawal'
    case 'PROFIT':     return 'Trading Profit'
    case 'BONUS':      return 'Bonus Credit'
    case 'ADJUSTMENT': return 'Account Adjustment'
    default:           return tx.type
  }
}

// ─── Balance-over-time chart (derived from real transactions) ─────────────────
function BalanceChart({ transactions }: { transactions: Transaction[] }) {
  // Group completed transactions by month and compute running balance
  const monthly = useMemo(() => {
    const map: Record<string, number> = {}
    const sorted = [...transactions]
      .filter(t => t.status === 'COMPLETED')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

    for (const tx of sorted) {
      const key = new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      const delta = tx.type === 'WITHDRAWAL' ? -tx.amount : tx.amount
      map[key] = (map[key] ?? 0) + delta
    }

    // Convert to cumulative balance
    const entries = Object.entries(map).slice(-6) // last 6 months
    let running = 0
    return entries.map(([month, delta]) => {
      running += delta
      return { month: month.split(' ')[0], balance: running }
    })
  }, [transactions])

  if (monthly.length === 0) {
    return (
      <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: 13, color: 'hsl(240 5% 45%)' }}>No data yet — transactions will appear here</p>
      </div>
    )
  }

  const max = Math.max(...monthly.map(d => d.balance), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120, padding: '0 4px' }}>
      {monthly.map((d, i) => {
        const pct = Math.max((d.balance / max) * 100, 2)
        const isLast = i === monthly.length - 1
        return (
          <div key={d.month + i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 10, color: 'hsl(240 5% 55%)', marginBottom: 2 }}>
              {d.balance >= 1000 ? `$${(d.balance / 1000).toFixed(1)}k` : `$${d.balance.toFixed(0)}`}
            </span>
            <div style={{
              width: '100%', height: `${pct}%`, minHeight: 4,
              borderRadius: '4px 4px 0 0',
              background: isLast ? 'linear-gradient(180deg,#a78bfa,#22d3ee)' : 'rgba(167,139,250,0.3)',
              transition: 'height 0.4s ease',
            }} />
            <span style={{ fontSize: 10, color: 'hsl(240 5% 50%)' }}>{d.month}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────
function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.875rem', ...style }}>
      {children}
    </div>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function Skeleton({ w = '100%', h = 14 }: { w?: string | number; h?: number }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: 6,
      background: 'rgba(255,255,255,0.06)',
      animation: 'skeletonPulse 1.4s ease-in-out infinite',
    }} />
  )
}

// ─── FILTERS ─────────────────────────────────────────────────────────────────
const FILTERS = ['All', 'Deposit', 'Withdrawal', 'Trade', 'Bonus']
const FILTER_TO_TYPE: Record<string, string> = {
  Deposit:    'DEPOSIT',
  Withdrawal: 'WITHDRAWAL',
  Trade:      'PROFIT',
  Bonus:      'BONUS',
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function AccountStatement() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)
  const [filter,       setFilter]       = useState('All')
  const [search,       setSearch]       = useState('')

  async function fetchTransactions() {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<{ success: boolean; data: Transaction[] }>('/user/transactions?limit=100')
      setTransactions(res.data)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load transactions.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTransactions() }, [])

  // ── Derived summary ─────────────────────────────────────────────────────────
  const totalIn = useMemo(() =>
    transactions
      .filter(t => t.status === 'COMPLETED' && isCredit(t.type))
      .reduce((s, t) => s + t.amount, 0),
  [transactions])

  const totalOut = useMemo(() =>
    transactions
      .filter(t => t.status === 'COMPLETED' && t.type === 'WITHDRAWAL')
      .reduce((s, t) => s + t.amount, 0),
  [transactions])

  // ── Filtered list ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const typeFilter = FILTER_TO_TYPE[filter]
    return transactions.filter(t => {
      const matchesType = !typeFilter || t.type === typeFilter
      const q = search.toLowerCase()
      const matchesSearch =
        !q ||
        descriptionFor(t).toLowerCase().includes(q) ||
        shortId(t.id).toLowerCase().includes(q) ||
        t.type.toLowerCase().includes(q) ||
        t.status.toLowerCase().includes(q)
      return matchesType && matchesSearch
    })
  }, [transactions, filter, search])

  // ── Export CSV ──────────────────────────────────────────────────────────────
  function exportCSV() {
    const rows = [
      ['Txn ID', 'Date', 'Description', 'Type', 'Amount', 'Currency', 'Status'],
      ...transactions.map(t => [
        shortId(t.id),
        formatDate(t.createdAt),
        descriptionFor(t),
        TYPE_LABEL[t.type] ?? t.type,
        (t.type === 'WITHDRAWAL' ? -t.amount : t.amount).toFixed(2),
        t.currency,
        t.status,
      ])
    ]
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `apex-statement-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto overflow-x-hidden">
      <style>{`@keyframes skeletonPulse { 0%,100%{opacity:.5} 50%{opacity:.15} }`}</style>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'hsl(40 6% 95%)', marginBottom: 3 }}>Account Statement</h1>
          <p style={{ fontSize: 13, color: 'hsl(240 5% 55%)' }}>Full history of your deposits, withdrawals and trades</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={fetchTransactions}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 0.875rem', borderRadius: '0.6rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'hsl(40 6% 75%)', fontSize: 13, cursor: 'pointer' }}
          >
            <RefreshCw size={13} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
          </button>
          <button
            onClick={exportCSV}
            disabled={transactions.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 1rem', borderRadius: '0.6rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(40 6% 85%)', fontSize: 13, cursor: transactions.length === 0 ? 'not-allowed' : 'pointer', opacity: transactions.length === 0 ? 0.5 : 1 }}
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Error banner */}
      {error && (
        <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 10, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#fca5a5', fontSize: 13 }}>
          {error} — <button onClick={fetchTransactions} style={{ color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}>Retry</button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        {loading
          ? [0,1,2].map(i => (
              <Card key={i} style={{ padding: '1.125rem 1.375rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <Skeleton w={120} h={12} />
                  <Skeleton w={30} h={30} />
                </div>
                <Skeleton w={100} h={28} />
              </Card>
            ))
          : [
              { label: 'Total Deposited', value: `$${totalIn.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,              icon: ArrowDownLeft, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)'  },
              { label: 'Total Withdrawn', value: `$${totalOut.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,             icon: ArrowUpRight,  color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
              { label: 'Net Balance',     value: `$${(totalIn - totalOut).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: TrendingUp,    color: '#a78bfa', bg: 'rgba(167,139,250,0.1)'  },
            ].map(s => (
              <Card key={s.label} style={{ padding: '1.125rem 1.375rem' }}>
                <div className="flex items-center justify-between mb-2">
                  <p style={{ fontSize: 12, color: 'hsl(240 5% 55%)' }}>{s.label}</p>
                  <div style={{ width: 30, height: 30, borderRadius: '0.5rem', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <s.icon size={14} style={{ color: s.color }} />
                  </div>
                </div>
                <p style={{ fontSize: '1.4rem', fontWeight: 700, color: 'hsl(40 6% 95%)', letterSpacing: '-0.02em' }}>{s.value}</p>
              </Card>
            ))
        }
      </div>

      {/* Balance chart */}
      <Card style={{ padding: '1.25rem 1.5rem', marginBottom: '1.25rem' }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'hsl(40 6% 88%)', marginBottom: '1rem' }}>Balance Over Time</p>
        {loading
          ? <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Skeleton w="80%" h={80} /></div>
          : <BalanceChart transactions={transactions} />
        }
      </Card>

      {/* Filter + search + table */}
      <Card>
        <div className="flex flex-wrap items-center gap-3 px-5 py-3.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex gap-1 flex-wrap">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{ padding: '0.3rem 0.75rem', borderRadius: 999, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: 'none', background: filter === f ? 'rgba(167,139,250,0.2)' : 'transparent', color: filter === f ? '#c4b5fd' : 'hsl(240 5% 55%)', transition: 'all 0.15s' }}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.6rem', padding: '0.4rem 0.75rem', flex: '1 1 180px', maxWidth: 280 }}>
            <Search size={13} style={{ color: 'hsl(240 5% 50%)', flexShrink: 0 }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search transactions…"
              style={{ background: 'none', border: 'none', outline: 'none', fontSize: 12, color: 'hsl(40 6% 88%)', width: '100%' }}
            />
          </div>
          <div className="flex items-center gap-1 ml-auto" style={{ fontSize: 12, color: 'hsl(240 5% 50%)', whiteSpace: 'nowrap' }}>
            <Filter size={12} /> {loading ? '…' : `${filtered.length} result${filtered.length !== 1 ? 's' : ''}`}
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Txn ID', 'Date', 'Description', 'Type', 'Amount', 'Status'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'hsl(240 5% 50%)', letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Loading skeletons */}
              {loading && [0,1,2,3,4].map(i => (
                <tr key={i}>
                  {[120, 90, 160, 70, 80, 70].map((w, j) => (
                    <td key={j} style={{ padding: '1rem 1.25rem' }}><Skeleton w={w} h={12} /></td>
                  ))}
                </tr>
              ))}

              {/* Empty state */}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '56px 20px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TrendingUp size={20} style={{ color: 'rgba(255,255,255,0.15)' }} />
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'hsl(240 5% 45%)' }}>
                        {transactions.length === 0 ? 'No transactions yet' : 'No results match your filter'}
                      </p>
                      <p style={{ fontSize: 12, color: 'hsl(240 5% 35%)' }}>
                        {transactions.length === 0
                          ? 'Your transaction history will appear here once you make a deposit.'
                          : 'Try changing the filter or search term.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {/* Real rows */}
              {!loading && filtered.map((t, i) => {
                const sc = STATUS_COLORS[t.status] ?? { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' }
                return (
                  <tr
                    key={t.id}
                    style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', transition: 'background 0.12s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '0.875rem 1.25rem', color: 'hsl(240 5% 55%)', fontFamily: 'monospace', fontSize: 11, whiteSpace: 'nowrap' }}>
                      {shortId(t.id)}
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem', color: 'hsl(240 5% 60%)', whiteSpace: 'nowrap' }}>
                      {formatDate(t.createdAt)}
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem', color: 'hsl(40 6% 88%)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {descriptionFor(t)}
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem' }}>
                      <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', color: 'hsl(40 6% 75%)', whiteSpace: 'nowrap' }}>
                        {TYPE_LABEL[t.type] ?? t.type}
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem', fontWeight: 600, color: amountColor(t.type, t.amount), whiteSpace: 'nowrap' }}>
                      {formatAmount(t.type, t.amount, t.currency)}
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem' }}>
                      <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 9px', borderRadius: 999, color: sc.color, background: sc.bg, whiteSpace: 'nowrap' }}>
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
