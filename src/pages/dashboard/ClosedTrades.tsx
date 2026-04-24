/**
 * ClosedTrades — history of all resolved trades (wins + losses).
 * Shows open trades at the top (with live countdown), closed trades below,
 * and a running P/L total.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, TrendingDown, Home, CandlestickChart, Briefcase, FileClock, Star, Trash2 } from 'lucide-react'
import { useTrades, Trade } from '@/hooks/useTrades'
import { AssetLogo } from '@/components/ui/AssetLogo'

function fmtUSD(n: number): string {
  const sign = n > 0 ? '+' : n < 0 ? '-' : ''
  return `${sign}$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtTime(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function Countdown({ expiresAt }: { expiresAt: number }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000))
  const mins = Math.floor(remaining / 60).toString().padStart(2, '0')
  const secs = (remaining % 60).toString().padStart(2, '0')
  return (
    <span style={{
      fontSize: 13, fontWeight: 800, fontFamily: 'ui-monospace, monospace',
      color: remaining < 5 ? '#f87171' : 'hsl(40 6% 90%)',
    }}>
      {mins}:{secs}
    </span>
  )
}

function TradeRow({ trade, isOpen }: { trade: Trade; isOpen: boolean }) {
  const isCall = trade.direction === 'CALL'
  const won = trade.status === 'won'
  const lost = trade.status === 'lost'
  const pnlColor = won ? '#4ade80' : lost ? '#f87171' : 'hsl(240 5% 55%)'

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto auto',
      alignItems: 'center', gap: 14,
      padding: '14px 16px', borderRadius: 12,
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${won ? 'rgba(74,222,128,0.2)' : lost ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.06)'}`,
    }}>
      <AssetLogo symbol={trade.symbol} category={trade.category} flagEmoji={trade.flagEmoji} size={40} />
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'hsl(40 6% 92%)' }}>
          {trade.pair} <span style={{ fontSize: 11, color: 'hsl(240 5% 50%)', fontWeight: 500, marginLeft: 4 }}>· {trade.name}</span>
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            padding: '2px 7px', borderRadius: 6, fontSize: 10, fontWeight: 700,
            background: isCall ? 'rgba(167,139,250,0.15)' : 'rgba(248,113,113,0.15)',
            color: isCall ? '#a78bfa' : '#f87171', letterSpacing: '0.04em',
          }}>
            {isCall ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {trade.direction}
          </span>
          <span style={{ fontSize: 11, color: 'hsl(240 5% 55%)' }}>
            ${trade.amount.toFixed(2)} · {trade.durationLabel}
          </span>
        </div>
      </div>

      {/* Status / countdown */}
      <div style={{ textAlign: 'right', minWidth: 80 }}>
        {isOpen ? (
          <>
            <Countdown expiresAt={trade.expiresAt} />
            <p style={{ fontSize: 10, color: 'hsl(240 5% 55%)', marginTop: 2 }}>LIVE</p>
          </>
        ) : (
          <>
            <p style={{ fontSize: 11, fontWeight: 700, color: pnlColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {won ? 'Won' : 'Lost'}
            </p>
            <p style={{ fontSize: 10, color: 'hsl(240 5% 55%)' }}>{fmtTime(trade.expiresAt)}</p>
          </>
        )}
      </div>

      {/* P/L */}
      <div style={{ textAlign: 'right', minWidth: 80 }}>
        <p style={{ fontSize: 14, fontWeight: 800, color: pnlColor, fontFamily: 'ui-monospace, monospace' }}>
          {isOpen ? '—' : fmtUSD(trade.profit ?? 0)}
        </p>
      </div>
    </div>
  )
}

export function ClosedTrades() {
  const navigate = useNavigate()
  const { openList, closedList, clearAll } = useTrades()
  const sortedOpen   = [...openList].sort((a, b) => a.expiresAt - b.expiresAt)
  const sortedClosed = [...closedList].sort((a, b) => b.expiresAt - a.expiresAt)

  const totalWon  = closedList.filter(t => t.status === 'won').length
  const totalLost = closedList.filter(t => t.status === 'lost').length
  const netPnl    = closedList.reduce((sum, t) => sum + (t.profit ?? 0), 0)

  // Default to Open tab if any open trades exist, otherwise Closed.
  const [tab, setTab] = useState<'open' | 'closed'>(openList.length > 0 ? 'open' : 'closed')

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', minHeight: '100vh',
      background: 'hsl(260 87% 3%)', color: 'hsl(40 6% 90%)',
    }}>
      <div style={{ flex: 1, padding: '24px 20px', maxWidth: 1080, width: '100%', margin: '0 auto' }}>

        {/* Summary strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Open',     value: openList.length,  color: '#a78bfa' },
            { label: 'Wins',     value: totalWon,          color: '#4ade80' },
            { label: 'Losses',   value: totalLost,         color: '#f87171' },
            { label: 'Net P/L',  value: fmtUSD(netPnl),   color: netPnl >= 0 ? '#4ade80' : '#f87171' },
          ].map(s => (
            <div key={s.label} style={{
              padding: '12px 14px', borderRadius: 12,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <p style={{ fontSize: 10, color: 'hsl(240 5% 55%)', fontWeight: 600, letterSpacing: '0.08em', marginBottom: 4 }}>
                {s.label.toUpperCase()}
              </p>
              <p style={{ fontSize: 16, fontWeight: 800, color: s.color, fontFamily: 'ui-monospace, monospace' }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* ── Open / Closed tab toggle ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 14, gap: 12, flexWrap: 'wrap',
        }}>
          <div style={{
            display: 'inline-flex', padding: 4, borderRadius: 12,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <button
              onClick={() => setTab('open')}
              style={{
                padding: '9px 22px', borderRadius: 9, cursor: 'pointer', border: 'none',
                background: tab === 'open' ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' : 'transparent',
                color: tab === 'open' ? '#fff' : 'hsl(240 5% 65%)',
                fontSize: 12, fontWeight: 700, letterSpacing: '0.06em',
                display: 'flex', alignItems: 'center', gap: 7,
              }}
            >
              OPEN
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                minWidth: 20, height: 18, padding: '0 6px', borderRadius: 9,
                background: tab === 'open' ? 'rgba(255,255,255,0.2)' : 'rgba(167,139,250,0.15)',
                color: tab === 'open' ? '#fff' : '#a78bfa',
                fontSize: 10, fontWeight: 800,
              }}>
                {openList.length}
              </span>
            </button>
            <button
              onClick={() => setTab('closed')}
              style={{
                padding: '9px 22px', borderRadius: 9, cursor: 'pointer', border: 'none',
                background: tab === 'closed' ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' : 'transparent',
                color: tab === 'closed' ? '#fff' : 'hsl(240 5% 65%)',
                fontSize: 12, fontWeight: 700, letterSpacing: '0.06em',
                display: 'flex', alignItems: 'center', gap: 7,
              }}
            >
              CLOSED
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                minWidth: 20, height: 18, padding: '0 6px', borderRadius: 9,
                background: tab === 'closed' ? 'rgba(255,255,255,0.2)' : 'rgba(167,139,250,0.15)',
                color: tab === 'closed' ? '#fff' : '#a78bfa',
                fontSize: 10, fontWeight: 800,
              }}>
                {sortedClosed.length}
              </span>
            </button>
          </div>

          {/* Clear history — only visible on Closed tab */}
          {tab === 'closed' && sortedClosed.length > 0 && (
            <button
              onClick={() => { if (confirm('Clear all trade history?')) clearAll() }}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '7px 12px', borderRadius: 8, cursor: 'pointer',
                background: 'rgba(248,113,113,0.08)',
                border: '1px solid rgba(248,113,113,0.2)',
                color: '#f87171', fontSize: 11, fontWeight: 600,
              }}
            >
              <Trash2 size={11} />
              Clear history
            </button>
          )}
        </div>

        {/* ── Trade list for current tab ── */}
        {tab === 'open' ? (
          sortedOpen.length === 0 ? (
            <div style={{
              padding: '50px 20px', borderRadius: 12, textAlign: 'center',
              background: 'rgba(255,255,255,0.02)',
              border: '1px dashed rgba(255,255,255,0.08)',
              color: 'hsl(240 5% 50%)', fontSize: 13,
            }}>
              No open trades. Place one on the Trade page.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sortedOpen.map(t => <TradeRow key={t.id} trade={t} isOpen />)}
            </div>
          )
        ) : (
          sortedClosed.length === 0 ? (
            <div style={{
              padding: '50px 20px', borderRadius: 12, textAlign: 'center',
              background: 'rgba(255,255,255,0.02)',
              border: '1px dashed rgba(255,255,255,0.08)',
              color: 'hsl(240 5% 50%)', fontSize: 13,
            }}>
              You haven't closed any trades yet. Go place one!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sortedClosed.map(t => <TradeRow key={t.id} trade={t} isOpen={false} />)}
            </div>
          )
        )}
      </div>

      {/* Bottom nav — same as TradeDetail for context */}
      <div style={{
        display: 'flex', alignItems: 'stretch', justifyContent: 'space-around',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        background: 'hsl(260 87% 4%)',
        padding: '8px 4px 12px',
        flexShrink: 0, position: 'sticky', bottom: 0,
      }}>
        {[
          { label: 'Home',          icon: Home,             path: '/dashboard' },
          { label: 'Assets',        icon: Briefcase,        path: '/dashboard/assets' },
          { label: 'Trade',         icon: CandlestickChart, path: '/dashboard/trade' },
          { label: 'Closed Trades', icon: FileClock,        path: '/dashboard/closed-trades', active: true },
          { label: 'Star',          icon: Star,             path: '/dashboard/markets?tab=Favourites' },
        ].map(item => {
          const Icon = item.icon
          const active = !!item.active
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: '6px 4px', borderRadius: 8, cursor: 'pointer',
                background: 'transparent', border: 'none',
                color: active ? '#c4b5fd' : 'hsl(240 5% 55%)',
              }}
            >
              <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.02em' }}>{item.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
