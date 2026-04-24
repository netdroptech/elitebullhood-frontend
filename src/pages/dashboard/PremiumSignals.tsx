import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, TrendingDown, Zap, Clock, Target, Shield, Bell, Lock } from 'lucide-react'
import { usePlatformName } from '@/context/PlatformNameContext'
import { CryptoLogo } from '@/components/ui/CryptoLogo'

const SIGNALS = [
  {
    id: 1, pair: 'BTC/USDT', direction: 'BUY', timeframe: '4H',
    entry: '$82,400 – $83,100', target1: '$86,500', target2: '$89,200', stopLoss: '$80,800',
    confidence: 92, riskReward: '1:3.2', status: 'active',
    time: '2h ago', analyst: 'Apex AI', category: 'Crypto',
    note: 'Strong support at $82,400 confluence with 200 EMA. RSI divergence on 4H with volume spike suggests bullish continuation.',
    pnl: '+4.8%', color: '#a78bfa',
  },
  {
    id: 2, pair: 'ETH/USDT', direction: 'BUY', timeframe: '1D',
    entry: '$3,050 – $3,110', target1: '$3,420', target2: '$3,680', stopLoss: '$2,920',
    confidence: 87, riskReward: '1:2.8', status: 'active',
    time: '5h ago', analyst: 'Apex AI', category: 'Crypto',
    note: 'Bullish flag pattern forming on daily chart. Ethereum ETF inflows increasing. Key level breakout imminent.',
    pnl: '+2.3%', color: '#a78bfa',
  },
  {
    id: 3, pair: 'SOL/USDT', direction: 'SELL', timeframe: '1H',
    entry: '$187 – $189', target1: '$178', target2: '$172', stopLoss: '$193',
    confidence: 78, riskReward: '1:2.1', status: 'active',
    time: '1h ago', analyst: 'Apex AI', category: 'Crypto',
    note: 'Rejection at major resistance zone. Bearish engulfing candle on 1H. Short-term correction expected before next leg up.',
    pnl: '-1.1%', color: '#f87171',
  },
  {
    id: 4, pair: 'BNB/USDT', direction: 'BUY', timeframe: '4H',
    entry: '$578 – $582', target1: '$608', target2: '$624', stopLoss: '$562',
    confidence: 83, riskReward: '1:2.5', status: 'pending',
    time: '30m ago', analyst: 'Apex AI', category: 'Crypto',
    note: 'Accumulation pattern visible on OBV. BNB ecosystem activity surging. Entry pending confirmation candle close.',
    pnl: null, color: '#a78bfa',
  },
  {
    id: 5, pair: 'XRP/USDT', direction: 'BUY', timeframe: '1D',
    entry: '$0.600 – $0.612', target1: '$0.680', target2: '$0.720', stopLoss: '$0.568',
    confidence: 81, riskReward: '1:2.2', status: 'closed',
    time: '1d ago', analyst: 'Apex AI', category: 'Crypto',
    note: 'Legal clarity catalyst. Cup-and-handle pattern completed. Target 1 hit.',
    pnl: '+11.4%', color: '#a78bfa',
  },
  {
    id: 6, pair: 'AVAX/USDT', direction: 'SELL', timeframe: '4H',
    entry: '$39.50 – $40.20', target1: '$36.00', target2: '$33.50', stopLoss: '$41.80',
    confidence: 74, riskReward: '1:2.0', status: 'closed',
    time: '2d ago', analyst: 'Apex AI', category: 'Crypto',
    note: 'Head and shoulders pattern. Neckline broken. Downside momentum confirmed by MACD cross.',
    pnl: '-2.8%', color: '#f87171',
  },
]

const STATS = [
  { label: 'Win Rate',        value: '78.4%',  sub: 'Last 30 days',     color: '#a78bfa', bg: 'rgba(167,139,250,0.1)'   },
  { label: 'Active Signals',  value: '4',      sub: 'Right now',         color: '#a78bfa', bg: 'rgba(167,139,250,0.1)'  },
  { label: 'Avg. R:R',        value: '1:2.6',  sub: 'Risk/Reward ratio', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)'   },
  { label: 'Avg. Confidence', value: '82%',    sub: 'Signal accuracy',   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)'   },
]

const TABS = ['All', 'Active', 'Pending', 'Closed']

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.875rem', ...style }}>{children}</div>
}

function ConfidenceBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ width: '100%', height: 5, borderRadius: 999, background: 'rgba(255,255,255,0.06)' }}>
      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 999, background: color, transition: 'width 0.4s ease' }} />
    </div>
  )
}

export function PremiumSignals() {
  const { platformName } = usePlatformName()
  const navigate = useNavigate()
  const [tab, setTab] = useState('All')
  const [expanded, setExpanded] = useState<number | null>(null)

  const filtered = SIGNALS.filter(s => tab === 'All' || s.status === tab.toLowerCase())

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto overflow-x-hidden">

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'hsl(40 6% 95%)' }}>Premium Signals</h1>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(245,158,11,0.15)', color: '#fcd34d' }}>
              <Lock size={9} style={{ display: 'inline', marginRight: 3, verticalAlign: 'middle' }} />Premium
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'hsl(240 5% 55%)' }}>AI-powered trade signals with entry, target & stop-loss levels</p>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 1rem', borderRadius: '0.6rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(40 6% 85%)', fontSize: 13, cursor: 'pointer', flexShrink: 0 }}>
          <Bell size={14} /> Notify me
        </button>
      </div>

      {/* Upgrade banner */}
      <div style={{ borderRadius: '0.875rem', padding: '1.125rem 1.5rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(245,158,11,0.04) 100%)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div className="flex items-center gap-3">
          <div style={{ width: 38, height: 38, borderRadius: '0.6rem', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Zap size={18} style={{ color: '#fcd34d' }} />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'hsl(40 6% 92%)', marginBottom: 2 }}>Unlock unlimited signals with a Premium or Elite plan</p>
            <p style={{ fontSize: 12, color: 'hsl(240 5% 50%)' }}>You're viewing 6 of 24 signals available today. Upgrade to see all signals in real time.</p>
          </div>
        </div>
        <button onClick={() => navigate('/dashboard/deposit')} style={{ padding: '0.5rem 1.25rem', borderRadius: '0.6rem', background: 'linear-gradient(135deg, #fcd34d 0%, #f59e0b 100%)', color: '#1a0a00', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}>
          Upgrade Now
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {STATS.map(s => (
          <Card key={s.label} style={{ padding: '1rem 1.25rem' }}>
            <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)', marginBottom: 6 }}>{s.label}</p>
            <p style={{ fontSize: '1.4rem', fontWeight: 700, color: s.color, letterSpacing: '-0.02em', marginBottom: 3 }}>{s.value}</p>
            <p style={{ fontSize: 11, color: 'hsl(240 5% 45%)' }}>{s.sub}</p>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '0.375rem 0.875rem', borderRadius: 999, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: 'none', background: tab === t ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.04)', color: tab === t ? '#c4b5fd' : 'hsl(240 5% 55%)', transition: 'all 0.15s' }}>
            {t}
            {t === 'Active' && <span style={{ marginLeft: 6, fontSize: 10, padding: '1px 5px', borderRadius: 999, background: 'rgba(167,139,250,0.2)', color: '#a78bfa' }}>4</span>}
          </button>
        ))}
      </div>

      {/* Signal cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {filtered.map(sig => {
          const isBuy = sig.direction === 'BUY'
          const isExpanded = expanded === sig.id
          const statusColor = sig.status === 'active' ? '#a78bfa' : sig.status === 'pending' ? '#f59e0b' : 'hsl(240 5% 50%)'
          const statusBg   = sig.status === 'active' ? 'rgba(167,139,250,0.1)' : sig.status === 'pending' ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.05)'

          return (
            <Card key={sig.id} style={{ overflow: 'hidden', cursor: 'pointer' }} >
              {/* Main row */}
              <div className="flex items-center gap-4 p-4" onClick={() => setExpanded(isExpanded ? null : sig.id)}>

                {/* Direction badge */}
                <div style={{ width: 52, height: 52, borderRadius: '0.75rem', background: isBuy ? 'rgba(167,139,250,0.1)' : 'rgba(248,113,113,0.1)', border: `1px solid ${isBuy ? 'rgba(167,139,250,0.25)' : 'rgba(248,113,113,0.25)'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, gap: 2 }}>
                  {isBuy ? <TrendingUp size={16} style={{ color: '#a78bfa' }} /> : <TrendingDown size={16} style={{ color: '#f87171' }} />}
                  <span style={{ fontSize: 10, fontWeight: 800, color: isBuy ? '#a78bfa' : '#f87171', letterSpacing: '0.04em' }}>{sig.direction}</span>
                </div>

                {/* Pair + timeframe */}
                <div style={{ minWidth: 130, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CryptoLogo symbol={sig.pair} size={32} />
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: 'hsl(40 6% 95%)', marginBottom: 2 }}>{sig.pair}</p>
                    <div className="flex items-center gap-1.5">
                      <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', color: 'hsl(240 5% 60%)' }}>{sig.timeframe}</span>
                      <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 999, background: statusBg, color: statusColor, fontWeight: 600 }}>{sig.status}</span>
                    </div>
                  </div>
                </div>

                {/* Levels */}
                <div className="hidden md:grid grid-cols-3 gap-6 flex-1">
                  <div>
                    <p style={{ fontSize: 10, color: 'hsl(240 5% 50%)', marginBottom: 2 }}>Entry</p>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'hsl(40 6% 85%)' }}>{sig.entry}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, color: 'hsl(240 5% 50%)', marginBottom: 2 }}>Targets</p>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#a78bfa' }}>{sig.target1} · {sig.target2}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, color: 'hsl(240 5% 50%)', marginBottom: 2 }}>Stop Loss</p>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#f87171' }}>{sig.stopLoss}</p>
                  </div>
                </div>

                {/* Right side */}
                <div className="ml-auto flex items-center gap-4 shrink-0">
                  {/* Confidence */}
                  <div style={{ textAlign: 'right', minWidth: 72 }}>
                    <p style={{ fontSize: 10, color: 'hsl(240 5% 50%)', marginBottom: 4 }}>Confidence</p>
                    <ConfidenceBar pct={sig.confidence} color={sig.confidence >= 85 ? '#a78bfa' : sig.confidence >= 75 ? '#f59e0b' : '#f87171'} />
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'hsl(40 6% 88%)', marginTop: 3 }}>{sig.confidence}%</p>
                  </div>

                  {/* P&L */}
                  {sig.pnl && (
                    <div style={{ minWidth: 56, textAlign: 'right' }}>
                      <p style={{ fontSize: 10, color: 'hsl(240 5% 50%)', marginBottom: 2 }}>P&amp;L</p>
                      <p style={{ fontSize: 14, fontWeight: 700, color: sig.pnl.startsWith('+') ? '#a78bfa' : '#f87171' }}>{sig.pnl}</p>
                    </div>
                  )}

                  {/* Time */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'hsl(240 5% 45%)', fontSize: 11 }}>
                    <Clock size={11} />
                    {sig.time}
                  </div>
                </div>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.015)' }}>
                  <div className="grid md:grid-cols-[1fr_auto] gap-4 items-start">
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 600, color: 'hsl(240 5% 50%)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Analysis</p>
                      <p style={{ fontSize: 13, color: 'hsl(40 6% 78%)', lineHeight: 1.6 }}>{sig.note}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 180 }}>
                      {[
                        { label: 'Risk/Reward', value: sig.riskReward, icon: Target },
                        { label: 'Analyst',     value: `${platformName} AI`, icon: Zap    },
                        { label: 'Timeframe',   value: sig.timeframe,  icon: Clock  },
                      ].map(item => (
                        <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.04)', borderRadius: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <item.icon size={12} style={{ color: 'hsl(240 5% 50%)' }} />
                            <span style={{ fontSize: 11, color: 'hsl(240 5% 55%)' }}>{item.label}</span>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'hsl(40 6% 85%)' }}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button style={{ padding: '0.5rem 1.125rem', borderRadius: '0.5rem', background: 'linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)', color: '#050505', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                      Copy Trade
                    </button>
                    <button style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(40 6% 80%)', fontSize: 12, cursor: 'pointer' }}>
                      Set Alert
                    </button>
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* Disclaimer */}
      <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: 8, padding: '0.875rem 1rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <Shield size={14} style={{ color: 'hsl(240 5% 45%)', flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 11, color: 'hsl(240 5% 45%)', lineHeight: 1.6 }}>
          Signals are generated by {platformName} AI and are for informational purposes only. Past performance does not guarantee future results. Always apply your own risk management. Cryptocurrency trading involves significant risk of loss.
        </p>
      </div>
    </div>
  )
}
