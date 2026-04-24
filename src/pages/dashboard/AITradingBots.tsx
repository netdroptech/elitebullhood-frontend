import { useState } from 'react'
import { Bot, TrendingUp, Activity, Play, Pause, Settings, BarChart2 } from 'lucide-react'
import { CryptoLogo } from '@/components/ui/CryptoLogo'

const BOTS = [
  {
    id: 1, name: 'Apex Alpha',      strategy: 'Trend Following',   pair: 'BTC/USDT',
    status: 'active', return: '+28.4%', winRate: '74%', trades: 312, runtime: '42 days',
    color: '#f59e0b', equity: [100,104,108,106,112,118,116,122,120,128],
    desc: 'Uses EMA crossovers and RSI to follow major BTC trends. Runs 24/7 with dynamic stop-loss.',
    risk: 'Medium', leverage: '3x',
  },
  {
    id: 2, name: 'Grid Master',      strategy: 'Grid Trading',       pair: 'ETH/USDT',
    status: 'active', return: '+19.2%', winRate: '82%', trades: 1840, runtime: '28 days',
    color: '#60a5fa', equity: [100,102,105,104,107,109,108,112,111,115],
    desc: 'Places buy/sell orders at regular intervals within a price range. Profits from volatility.',
    risk: 'Low', leverage: '1x',
  },
  {
    id: 3, name: 'Scalp Lightning',  strategy: 'Scalping',           pair: 'SOL/USDT',
    status: 'paused', return: '+8.1%',  winRate: '69%', trades: 4210, runtime: '15 days',
    color: '#a78bfa', equity: [100,101,102,101,103,104,103,105,104,106],
    desc: 'High-frequency scalping on SOL. Executes micro-trades capturing small price movements.',
    risk: 'High', leverage: '5x',
  },
  {
    id: 4, name: 'Mean Revert',      strategy: 'Mean Reversion',     pair: 'BNB/USDT',
    status: 'active', return: '+14.6%', winRate: '76%', trades: 248, runtime: '35 days',
    color: '#a78bfa', equity: [100,102,104,103,106,108,107,110,109,112],
    desc: 'Identifies when BNB deviates from its historical mean and trades the return to average.',
    risk: 'Low', leverage: '2x',
  },
  {
    id: 5, name: 'Breakout Hunter', strategy: 'Breakout',           pair: 'XRP/USDT',
    status: 'paused', return: '+6.3%',  winRate: '62%', trades: 91,  runtime: '22 days',
    color: '#a78bfa', equity: [100,101,103,102,104,105,104,106,105,107],
    desc: 'Monitors consolidation zones on XRP and enters positions when breakouts are confirmed.',
    risk: 'Medium', leverage: '3x',
  },
  {
    id: 6, name: 'Arbitrage Pro',   strategy: 'Arbitrage',          pair: 'Multi-asset',
    status: 'active', return: '+11.8%', winRate: '91%', trades: 2890, runtime: '60 days',
    color: '#fb923c', equity: [100,101,102,103,104,105,106,107,108,110],
    desc: 'Exploits micro price differences between spot and futures markets across multiple assets.',
    risk: 'Low', leverage: '1x',
  },
]

const RISK_COLOR: Record<string, { color: string; bg: string }> = {
  Low:    { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)'  },
  Medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
  High:   { color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const W = 200, H = 48
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W
    const y = H - ((v - min) / range) * (H - 8) - 4
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

export function AITradingBots() {
  const [bots, setBots] = useState(BOTS)

  const toggle = (id: number) =>
    setBots(b => b.map(bot => bot.id === id ? { ...bot, status: bot.status === 'active' ? 'paused' : 'active' } : bot))

  const activeBots  = bots.filter(b => b.status === 'active').length
  const totalReturn = bots.reduce((s, b) => s + parseFloat(b.return.replace(/[^0-9.]/g, '')), 0)
  const totalTrades = bots.reduce((s, b) => s + b.trades, 0)

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'hsl(40 6% 95%)' }}>AI Trading Bots</h1>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(148,163,184,0.12)', color: '#94a3b8' }}>AI</span>
          </div>
          <p style={{ fontSize: 13, color: 'hsl(240 5% 55%)' }}>Automated strategies running 24/7 on your behalf</p>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 1rem', borderRadius: '0.6rem', background: 'linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)', color: '#050505', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
          <Bot size={14} /> Create Bot
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        {[
          { label: 'Active Bots',     value: `${activeBots} / ${bots.length}`,   icon: Activity,   color: '#a78bfa', bg: 'rgba(167,139,250,0.1)'   },
          { label: 'Combined Return', value: `+${totalReturn.toFixed(1)}%`,       icon: TrendingUp, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)'  },
          { label: 'Total Trades',    value: totalTrades.toLocaleString(),         icon: BarChart2,  color: '#60a5fa', bg: 'rgba(96,165,250,0.1)'   },
        ].map(s => (
          <div key={s.label} style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.875rem', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '0.6rem', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <s.icon size={16} style={{ color: s.color }} />
            </div>
            <div>
              <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)', marginBottom: 2 }}>{s.label}</p>
              <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'hsl(40 6% 92%)' }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bot cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {bots.map(bot => {
          const isActive = bot.status === 'active'
          const risk = RISK_COLOR[bot.risk]
          return (
            <div key={bot.id} style={{ background: 'hsl(260 60% 5%)', border: `1px solid ${isActive ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.05)'}`, borderRadius: '0.875rem', padding: '1.25rem', display: 'flex', flexDirection: 'column', opacity: isActive ? 1 : 0.7, transition: 'all 0.2s' }}>
              {/* Header row */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div style={{ width: 38, height: 38, borderRadius: '0.625rem', background: `${bot.color}18`, border: `1px solid ${bot.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Bot size={16} style={{ color: bot.color }} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, color: 'hsl(40 6% 92%)', fontSize: 14 }}>{bot.name}</p>
                    <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)' }}>{bot.strategy}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: isActive ? '#a78bfa' : '#94a3b8', boxShadow: isActive ? '0 0 6px #a78bfa' : 'none' }} />
                  <span style={{ fontSize: 11, color: isActive ? '#a78bfa' : 'hsl(240 5% 50%)' }}>{isActive ? 'Active' : 'Paused'}</span>
                </div>
              </div>

              {/* Sparkline */}
              <div style={{ margin: '0 -0.25rem 0.625rem', height: 48 }}>
                <Sparkline data={bot.equity} color={isActive ? bot.color : '#475569'} />
              </div>

              {/* Return */}
              <div className="flex items-end justify-between mb-3">
                <div>
                  <p style={{ fontSize: '1.5rem', fontWeight: 800, color: isActive ? '#a78bfa' : 'hsl(240 5% 55%)', letterSpacing: '-0.02em' }}>{bot.return}</p>
                  <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)' }}>return · {bot.runtime}</p>
                </div>
                <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 999, fontWeight: 600, color: risk.color, background: risk.bg }}>{bot.risk} Risk</span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { label: 'Win Rate',   value: bot.winRate   },
                  { label: 'Trades',     value: bot.trades.toLocaleString() },
                  { label: 'Leverage',   value: bot.leverage  },
                ].map(s => (
                  <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '0.5rem', padding: '0.4rem 0.25rem', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'hsl(40 6% 85%)' }}>{s.value}</p>
                    <p style={{ fontSize: 10, color: 'hsl(240 5% 50%)', marginTop: 1 }}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Pair tag */}
              <div className="flex items-center gap-2 mb-4">
                {bot.pair !== 'Multi-asset' && <CryptoLogo symbol={bot.pair} size={20} />}
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', color: 'hsl(40 6% 70%)' }}>{bot.pair}</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.04)', color: 'hsl(240 5% 55%)' }}>{bot.strategy}</span>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 mt-auto">
                <button
                  onClick={() => toggle(bot.id)}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '0.55rem', borderRadius: '0.6rem', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', ...(isActive ? { background: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' } : { background: 'linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)', color: '#050505', border: 'none' }) }}
                >
                  {isActive ? <><Pause size={12} /> Pause</> : <><Play size={12} /> Start</>}
                </button>
                <button style={{ width: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.6rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'hsl(240 5% 55%)', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                  <Settings size={13} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
