import { useState } from 'react'
import { TrendingUp, TrendingDown, Search, Star } from 'lucide-react'
import { CryptoLogo } from '@/components/ui/CryptoLogo'

const MARKETS = [
  { name: 'Bitcoin',   symbol: 'BTC/USDT', price: 83552.00, change: +2.34, vol: '$28.4B', cap: '$1.64T',  data: [78000,79200,81000,80400,82100,83552], color: '#f59e0b', starred: true  },
  { name: 'Ethereum',  symbol: 'ETH/USDT', price: 3118.50,  change: +1.12, vol: '$12.1B', cap: '$374B',   data: [3050,3070,3090,3060,3100,3118],     color: '#60a5fa', starred: true  },
  { name: 'Solana',    symbol: 'SOL/USDT', price: 185.22,   change: -0.88, vol: '$3.2B',  cap: '$85B',    data: [192,190,188,186,185,185],           color: '#a78bfa', starred: false },
  { name: 'BNB',       symbol: 'BNB/USDT', price: 586.40,   change: +0.45, vol: '$1.8B',  cap: '$88B',    data: [578,580,582,580,584,586],           color: '#fbbf24', starred: false },
  { name: 'XRP',       symbol: 'XRP/USDT', price: 0.618,    change: -1.22, vol: '$2.1B',  cap: '$67B',    data: [0.64,0.63,0.62,0.61,0.62,0.618],   color: '#a78bfa', starred: false },
  { name: 'Cardano',   symbol: 'ADA/USDT', price: 0.412,    change: +3.10, vol: '$0.9B',  cap: '$14B',    data: [0.39,0.39,0.40,0.41,0.41,0.412],   color: '#a78bfa', starred: false },
  { name: 'Dogecoin',  symbol: 'DOGE/USDT',price: 0.1742,   change: +5.22, vol: '$1.4B',  cap: '$25B',    data: [0.164,0.166,0.168,0.170,0.172,0.1742],color: '#fde68a',starred: false },
  { name: 'Avalanche', symbol: 'AVAX/USDT',price: 38.42,    change: -2.14, vol: '$0.6B',  cap: '$16B',    data: [40,39.5,39,38.8,38.5,38.42],       color: '#fb923c', starred: false },
  { name: 'Polkadot',  symbol: 'DOT/USDT', price: 7.84,     change: +0.92, vol: '$0.4B',  cap: '$11B',    data: [7.6,7.65,7.7,7.72,7.8,7.84],      color: '#e879f9', starred: false },
  { name: 'Chainlink', symbol: 'LINK/USDT',price: 14.22,    change: +1.88, vol: '$0.7B',  cap: '$9B',     data: [13.8,13.9,14.0,14.1,14.15,14.22], color: '#38bdf8', starred: false },
]

const OVERVIEW = [
  { label: 'Total Market Cap', value: '$2.61T',      change: '+1.8%',  up: true  },
  { label: 'BTC Dominance',    value: '62.8%',        change: '+0.3%',  up: true  },
  { label: '24h Volume',       value: '$94.2B',       change: '-5.2%',  up: false },
  { label: 'Fear & Greed',     value: '72 — Greed',   change: 'Bullish', up: true },
]

const TABS = ['All', 'Favourites', 'Top Gainers', 'Top Losers']

/** Pure SVG sparkline — zero dependencies */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const W = 80, H = 32
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W
    const y = H - ((v - min) / range) * (H - 6) - 3
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.875rem', ...style }}>{children}</div>
}

export function LiveMarkets() {
  const [tab, setTab] = useState('All')
  const [search, setSearch] = useState('')
  const [starred, setStarred] = useState<string[]>(['BTC/USDT', 'ETH/USDT'])

  const filtered = MARKETS.filter(m => {
    if (tab === 'Favourites' && !starred.includes(m.symbol)) return false
    if (tab === 'Top Gainers' && m.change <= 0) return false
    if (tab === 'Top Losers'  && m.change >= 0) return false
    if (search && !m.name.toLowerCase().includes(search.toLowerCase()) && !m.symbol.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto overflow-x-hidden">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'hsl(40 6% 95%)' }}>Live Markets</h1>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: 'rgba(167,139,250,0.15)', color: '#a78bfa', letterSpacing: '0.05em' }}>● LIVE</span>
          </div>
          <p style={{ fontSize: 13, color: 'hsl(240 5% 55%)' }}>Real-time cryptocurrency prices and market data</p>
        </div>
      </div>

      {/* Overview strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {OVERVIEW.map(o => (
          <Card key={o.label} style={{ padding: '1rem 1.25rem' }}>
            <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)', marginBottom: 5 }}>{o.label}</p>
            <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'hsl(40 6% 95%)', letterSpacing: '-0.01em', marginBottom: 3 }}>{o.value}</p>
            <span style={{ fontSize: 11, fontWeight: 600, color: o.up ? '#a78bfa' : '#f87171' }}>{o.change}</span>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <div className="flex flex-wrap items-center gap-3 px-5 py-3.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex gap-1">
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: '0.3rem 0.75rem', borderRadius: 999, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: 'none', background: tab === t ? 'rgba(167,139,250,0.2)' : 'transparent', color: tab === t ? '#c4b5fd' : 'hsl(240 5% 55%)', transition: 'all 0.15s' }}>
                {t}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-auto" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.6rem', padding: '0.4rem 0.75rem', width: '100%', maxWidth: 220 }}>
            <Search size={13} style={{ color: 'hsl(240 5% 50%)', flexShrink: 0 }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search markets…" style={{ background: 'none', border: 'none', outline: 'none', fontSize: 12, color: 'hsl(40 6% 88%)', width: '100%' }} />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['','#','Asset','Price','24h Change','Volume','Market Cap','7d',''].map((h, i) => (
                  <th key={i} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'hsl(240 5% 50%)', letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => (
                <tr key={m.symbol} style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '0.75rem 0.5rem 0.75rem 1rem', width: 32 }}>
                    <button onClick={() => setStarred(s => s.includes(m.symbol) ? s.filter(x => x !== m.symbol) : [...s, m.symbol])} style={{ background: 'none', border: 'none', cursor: 'pointer', color: starred.includes(m.symbol) ? '#f59e0b' : 'hsl(240 5% 40%)', padding: 0 }}>
                      <Star size={13} fill={starred.includes(m.symbol) ? '#f59e0b' : 'none'} />
                    </button>
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem', color: 'hsl(240 5% 45%)', fontSize: 12 }}>{i + 1}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div className="flex items-center gap-2.5">
                      <CryptoLogo symbol={m.symbol} size={30} fallbackColor={m.color} />
                      <div>
                        <p style={{ fontWeight: 600, color: 'hsl(40 6% 92%)', fontSize: 13 }}>{m.name}</p>
                        <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)' }}>{m.symbol}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'hsl(40 6% 92%)', whiteSpace: 'nowrap' }}>
                    ${m.price >= 1 ? m.price.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : m.price.toFixed(4)}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: m.change >= 0 ? '#a78bfa' : '#f87171', fontWeight: 600 }}>
                      {m.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {m.change >= 0 ? '+' : ''}{m.change.toFixed(2)}%
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'hsl(240 5% 65%)' }}>{m.vol}</td>
                  <td style={{ padding: '0.75rem 1rem', color: 'hsl(240 5% 65%)' }}>{m.cap}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <Sparkline data={m.data} color={m.change >= 0 ? '#a78bfa' : '#f87171'} />
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <button style={{ padding: '0.3rem 0.75rem', borderRadius: '0.5rem', background: 'linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)', color: '#050505', fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      Trade
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
