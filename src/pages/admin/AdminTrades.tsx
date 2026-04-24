/**
 * AdminTrades — platform-wide trade history visible to admins.
 * Tabs: Open / Closed / All.  Filter by user.  Summary stats at the top.
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import { TrendingUp, TrendingDown, Search, RefreshCw, Loader2 } from 'lucide-react'
import { adminApi } from '@/lib/api'
import { AssetLogo } from '@/components/ui/AssetLogo'

interface AdminTrade {
  id:               string
  userId:           string
  symbol:           string
  pair:             string
  name:             string
  category:         'crypto' | 'forex' | 'stock' | 'commodity'
  flagEmoji?:       string | null
  direction:        'CALL' | 'PUT'
  amount:           number
  payoutMultiplier: number
  openPrice:        number
  openTime:         string
  expiresAt:        string
  durationLabel:    string
  durationSec:      number
  status:           'OPEN' | 'WON' | 'LOST'
  closePrice?:      number | null
  profit?:          number | null
  user: { id: string; firstName: string; lastName: string; email: string }
}

interface Stats {
  openTrades:  number
  wonTrades:   number
  lostTrades:  number
  totalStaked: number
  netUserPnl:  number
}

function fmtUSD(n: number): string {
  const sign = n > 0 ? '+' : n < 0 ? '-' : ''
  return `${sign}$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function Countdown({ iso }: { iso: string }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id) }, [])
  const remaining = Math.max(0, Math.floor((new Date(iso).getTime() - now) / 1000))
  const m = Math.floor(remaining / 60).toString().padStart(2, '0')
  const s = (remaining % 60).toString().padStart(2, '0')
  return <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 800, color: remaining < 5 ? '#f87171' : 'hsl(40 6% 90%)' }}>{m}:{s}</span>
}

export function AdminTrades() {
  const [tab,      setTab]      = useState<'open' | 'closed' | 'all'>('open')
  const [search,   setSearch]   = useState('')
  const [trades,   setTrades]   = useState<AdminTrade[]>([])
  const [stats,    setStats]    = useState<Stats | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true)
    try {
      const [tradesRes, statsRes] = await Promise.all([
        adminApi.get(`/trades?status=${tab}&limit=500`),
        adminApi.get('/trades/stats'),
      ])
      setTrades((tradesRes.data?.data ?? []) as AdminTrade[])
      setStats(statsRes.data?.data ?? null)
    } catch (err) {
      console.error('Failed to load admin trades:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [tab])

  // Initial load + poll every 5s for real-time feel
  useEffect(() => {
    setLoading(true)
    load()
    const id = setInterval(() => load(false), 5000)
    return () => clearInterval(id)
  }, [load])

  // Client-side search filter
  const filtered = useMemo(() => {
    if (!search.trim()) return trades
    const q = search.trim().toLowerCase()
    return trades.filter(t =>
      t.user.firstName.toLowerCase().includes(q) ||
      t.user.lastName.toLowerCase().includes(q) ||
      t.user.email.toLowerCase().includes(q) ||
      t.pair.toLowerCase().includes(q) ||
      t.symbol.toLowerCase().includes(q)
    )
  }, [trades, search])

  return (
    <div style={{ padding: '24px 28px', color: 'hsl(40 6% 90%)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'hsl(40 6% 95%)', marginBottom: 4 }}>Trade History</h1>
          <p style={{ fontSize: 13, color: 'hsl(240 5% 60%)' }}>
            Real-time view of every open and closed trade across the platform.
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 10,
            background: 'rgba(167,139,250,0.1)',
            border: '1px solid rgba(167,139,250,0.25)',
            color: '#a78bfa', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}
        >
          {refreshing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          Refresh
        </button>
      </div>

      {/* Stats strip */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Open',        value: stats.openTrades,             color: '#a78bfa' },
            { label: 'Won',         value: stats.wonTrades,              color: '#4ade80' },
            { label: 'Lost',        value: stats.lostTrades,             color: '#f87171' },
            { label: 'Total Staked',value: fmtUSD(stats.totalStaked),    color: 'hsl(40 6% 90%)' },
            { label: 'User P/L',    value: fmtUSD(stats.netUserPnl),     color: stats.netUserPnl >= 0 ? '#4ade80' : '#f87171' },
          ].map(s => (
            <div key={s.label} style={{
              padding: '14px 16px', borderRadius: 12,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <p style={{ fontSize: 10, color: 'hsl(240 5% 55%)', fontWeight: 600, letterSpacing: '0.08em', marginBottom: 4 }}>
                {s.label.toUpperCase()}
              </p>
              <p style={{ fontSize: 18, fontWeight: 800, color: s.color, fontFamily: 'ui-monospace, monospace' }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs + search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        marginBottom: 16, flexWrap: 'wrap',
      }}>
        <div style={{
          display: 'inline-flex', padding: 4, borderRadius: 12,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          {(['open', 'closed', 'all'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '9px 22px', borderRadius: 9, cursor: 'pointer', border: 'none',
                background: tab === t ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' : 'transparent',
                color: tab === t ? '#fff' : 'hsl(240 5% 65%)',
                fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
              }}
            >
              {t}
            </button>
          ))}
        </div>
        <div style={{
          flex: 1, minWidth: 240, maxWidth: 400,
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', borderRadius: 10,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <Search size={14} style={{ color: 'hsl(240 5% 50%)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by user, email, or pair…"
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 13, color: 'hsl(40 6% 90%)' }}
          />
        </div>
      </div>

      {/* Trades table */}
      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'hsl(240 5% 50%)' }}>
          <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto' }} />
          <p style={{ marginTop: 10 }}>Loading trades…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          padding: 60, borderRadius: 12, textAlign: 'center',
          background: 'rgba(255,255,255,0.02)',
          border: '1px dashed rgba(255,255,255,0.08)',
          color: 'hsl(240 5% 50%)', fontSize: 13,
        }}>
          No trades match your filters.
        </div>
      ) : (
        <div style={{
          borderRadius: 12, overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.02)',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Asset', 'User', 'Direction', 'Stake', 'Duration', 'Opened', 'Status', 'P/L'].map(h => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: 'hsl(240 5% 55%)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => {
                const isCall = t.direction === 'CALL'
                const isOpen = t.status === 'OPEN'
                const won    = t.status === 'WON'
                const lost   = t.status === 'LOST'
                const pnlColor = won ? '#4ade80' : lost ? '#f87171' : 'hsl(240 5% 55%)'
                return (
                  <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <AssetLogo symbol={t.symbol} category={t.category} flagEmoji={t.flagEmoji ?? undefined} size={30} />
                        <div>
                          <p style={{ fontWeight: 700, color: 'hsl(40 6% 92%)' }}>{t.pair}</p>
                          <p style={{ fontSize: 10, color: 'hsl(240 5% 55%)' }}>{t.name}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <p style={{ fontWeight: 600, color: 'hsl(40 6% 88%)' }}>
                        {t.user.firstName} {t.user.lastName}
                      </p>
                      <p style={{ fontSize: 10, color: 'hsl(240 5% 55%)' }}>{t.user.email}</p>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                        background: isCall ? 'rgba(167,139,250,0.15)' : 'rgba(248,113,113,0.15)',
                        color:      isCall ? '#a78bfa'                : '#f87171',
                      }}>
                        {isCall ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {t.direction}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', fontFamily: 'ui-monospace, monospace', fontWeight: 700 }}>
                      ${t.amount.toFixed(2)}
                    </td>
                    <td style={{ padding: '10px 14px', color: 'hsl(240 5% 70%)' }}>
                      {t.durationLabel}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 11, color: 'hsl(240 5% 65%)' }}>
                      {fmtDateTime(t.openTime)}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {isOpen ? (
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '3px 8px', borderRadius: 6,
                          background: 'rgba(167,139,250,0.12)', color: '#a78bfa',
                          fontSize: 11, fontWeight: 700,
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa', animation: 'pulse 1.2s infinite' }} />
                          LIVE · <Countdown iso={t.expiresAt} />
                        </div>
                      ) : (
                        <span style={{
                          padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                          background: won ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
                          color:      won ? '#4ade80'                : '#f87171',
                        }}>
                          {t.status}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '10px 14px', fontFamily: 'ui-monospace, monospace', fontWeight: 800, color: pnlColor }}>
                      {isOpen ? '—' : fmtUSD(t.profit ?? 0)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>
    </div>
  )
}
