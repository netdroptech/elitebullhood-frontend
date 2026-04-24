/**
 * AdminTrades — platform-wide trade history visible to admins.
 * Tabs: Open / Closed / All.  Filter by user.  Summary stats at the top.
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import { TrendingUp, TrendingDown, Search, RefreshCw, Loader2, Edit3, X, Check } from 'lucide-react'
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
  forcedOutcome?:   'WON' | 'LOST' | null
  forcedProfit?:    number | null
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
  const [editing,  setEditing]  = useState<AdminTrade | null>(null)

  const load = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true)
    try {
      const [tradesRes, statsRes] = await Promise.all([
        adminApi.get<{ success: boolean; data: AdminTrade[] }>(`/admin/trades?status=${tab}&limit=500`),
        adminApi.get<{ success: boolean; data: Stats }>('/admin/trades/stats'),
      ])
      setTrades(tradesRes.data ?? [])
      setStats(statsRes.data ?? null)
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
                {['Asset', 'User', 'Direction', 'Stake', 'Duration', 'Opened', 'Status', 'P/L', ''].map(h => (
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
                      {isOpen
                        ? (t.forcedOutcome
                            ? <span style={{ fontSize: 11, color: t.forcedOutcome === 'WON' ? '#4ade80' : '#f87171' }}>
                                SET: {t.forcedOutcome === 'WON' ? '+' : '-'}${Math.abs(t.forcedProfit ?? 0).toFixed(2)}
                              </span>
                            : '—')
                        : fmtUSD(t.profit ?? 0)
                      }
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      {isOpen && (
                        <button
                          onClick={() => setEditing(t)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '6px 10px', borderRadius: 7, cursor: 'pointer',
                            background: 'rgba(167,139,250,0.12)',
                            border: '1px solid rgba(167,139,250,0.3)',
                            color: '#a78bfa', fontSize: 11, fontWeight: 600,
                          }}
                        >
                          <Edit3 size={11} />
                          Modify
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Edit modal ── */}
      {editing && (
        <EditTradeModal
          trade={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(false) }}
        />
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>
    </div>
  )
}

// ─── Modal: force-set the outcome of an open trade ────────────────────────
function EditTradeModal({
  trade, onClose, onSaved,
}: {
  trade: AdminTrade
  onClose: () => void
  onSaved: () => void
}) {
  const defaultProfit = trade.forcedProfit != null
    ? Math.abs(trade.forcedProfit)
    : +(trade.amount * (trade.payoutMultiplier - 1)).toFixed(2)
  const defaultLoss = trade.forcedProfit != null && trade.forcedProfit < 0
    ? Math.abs(trade.forcedProfit)
    : trade.amount

  const [outcome, setOutcome] = useState<'WON' | 'LOST' | 'RANDOM'>(
    trade.forcedOutcome ?? 'RANDOM',
  )
  const [amount,  setAmount]  = useState<string>(
    trade.forcedOutcome === 'LOST' ? String(defaultLoss) : String(defaultProfit),
  )
  const [saving,  setSaving]  = useState(false)
  const [err,     setErr]     = useState('')

  async function save() {
    setErr('')
    setSaving(true)
    try {
      const body: any = { outcome: outcome === 'RANDOM' ? null : outcome }
      if (outcome !== 'RANDOM') body.profit = Number(amount)
      await adminApi.patch<{ success: boolean }>(`/admin/trades/${trade.id}`, body)
      onSaved()
    } catch (e: any) {
      setErr(e?.message ?? 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 460,
          background: 'hsl(260 80% 6%)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 18, padding: 24,
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: 'hsl(40 6% 98%)' }}>Modify Live Trade</h2>
            <p style={{ fontSize: 11, color: 'hsl(240 5% 60%)', marginTop: 3 }}>
              {trade.user.firstName} {trade.user.lastName} · {trade.pair} · {trade.direction} · ${trade.amount.toFixed(2)}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8, padding: 6, cursor: 'pointer', color: 'hsl(240 5% 70%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Outcome selector */}
        <p style={{ fontSize: 12, color: 'hsl(240 5% 60%)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 8 }}>
          OUTCOME
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 18 }}>
          {[
            { value: 'WON',    label: 'WIN',    color: '#4ade80', bg: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.35)' },
            { value: 'LOST',   label: 'LOSS',   color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.35)' },
            { value: 'RANDOM', label: 'RANDOM', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.35)' },
          ].map(opt => {
            const active = outcome === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => setOutcome(opt.value as any)}
                style={{
                  padding: '12px', borderRadius: 10, cursor: 'pointer',
                  background: active ? opt.bg    : 'rgba(255,255,255,0.03)',
                  border:     active ? `1.5px solid ${opt.border}` : '1px solid rgba(255,255,255,0.08)',
                  color:      active ? opt.color : 'hsl(240 5% 60%)',
                  fontSize: 12, fontWeight: 800, letterSpacing: '0.06em',
                }}
              >
                {opt.label}
              </button>
            )
          })}
        </div>

        {/* Profit/Loss amount input — only when outcome is not RANDOM */}
        {outcome !== 'RANDOM' && (
          <>
            <p style={{ fontSize: 12, color: 'hsl(240 5% 60%)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 8 }}>
              {outcome === 'WON' ? 'PROFIT AMOUNT (USD)' : 'LOSS AMOUNT (USD)'}
            </p>
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <span style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                color: 'hsl(240 5% 50%)', fontSize: 15, fontWeight: 700, pointerEvents: 'none',
              }}>
                {outcome === 'WON' ? '+$' : '-$'}
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                style={{
                  width: '100%', height: 48, paddingLeft: 40, paddingRight: 14,
                  borderRadius: 10, fontSize: 16, fontWeight: 700,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'hsl(40 6% 92%)', outline: 'none',
                }}
              />
            </div>
            <p style={{ fontSize: 11, color: 'hsl(240 5% 55%)', marginBottom: 18, lineHeight: 1.5 }}>
              {outcome === 'WON'
                ? `User will receive back their $${trade.amount.toFixed(2)} stake PLUS $${amount || '0'} profit when the timer expires.`
                : `User will lose $${amount || '0'} when the timer expires.`}
            </p>
          </>
        )}

        {outcome === 'RANDOM' && (
          <p style={{ fontSize: 11, color: 'hsl(240 5% 55%)', marginBottom: 18, lineHeight: 1.5 }}>
            No override — the system will decide the outcome randomly when the timer expires (~48 % win rate).
          </p>
        )}

        {err && (
          <p style={{ fontSize: 12, color: '#f87171', marginBottom: 12 }}>{err}</p>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              flex: 1, padding: '12px', borderRadius: 10, cursor: 'pointer',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'hsl(240 5% 70%)', fontSize: 13, fontWeight: 600,
            }}
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            style={{
              flex: 1, padding: '12px', borderRadius: 10,
              cursor: saving ? 'default' : 'pointer',
              background: saving ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg,#8b5cf6,#7c3aed)',
              color: '#fff', border: 'none',
              fontSize: 13, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            {saving
              ? <Loader2 size={13} style={{ animation: 'spin 0.7s linear infinite' }} />
              : <><Check size={14} /> Save Override</>}
          </button>
        </div>
      </div>
    </div>
  )
}
