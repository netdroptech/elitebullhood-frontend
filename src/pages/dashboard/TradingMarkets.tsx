import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, TrendingDown, ChevronRight, RefreshCw, Search, Star, BarChart2, Wifi, WifiOff } from 'lucide-react'

// ── Static metadata (colors, names, pairs) ────────────────────────────────
const PAIR_META: Record<string, { pair: string; name: string; color: string }> = {
  BTCUSDT:   { pair: 'BTC/USDT',   name: 'Bitcoin',       color: '#f7931a' },
  ETHUSDT:   { pair: 'ETH/USDT',   name: 'Ethereum',      color: '#627eea' },
  BNBUSDT:   { pair: 'BNB/USDT',   name: 'BNB',           color: '#f3ba2f' },
  ADAUSDT:   { pair: 'ADA/USDT',   name: 'Cardano',       color: '#4a9eff' },
  XRPUSDT:   { pair: 'XRP/USDT',   name: 'XRP',           color: '#00aae4' },
  SOLUSDT:   { pair: 'SOL/USDT',   name: 'Solana',        color: '#9945ff' },
  DOTUSDT:   { pair: 'DOT/USDT',   name: 'Polkadot',      color: '#e6007a' },
  DOGEUSDT:  { pair: 'DOGE/USDT',  name: 'Dogecoin',      color: '#c2a633' },
  AVAXUSDT:  { pair: 'AVAX/USDT',  name: 'Avalanche',     color: '#e84142' },
  MATICUSDT: { pair: 'MATIC/USDT', name: 'Polygon',       color: '#8247e5' },
  LINKUSDT:  { pair: 'LINK/USDT',  name: 'Chainlink',     color: '#375bd2' },
  LTCUSDT:   { pair: 'LTC/USDT',   name: 'Litecoin',      color: '#bfbbbb' },
  UNIUSDT:   { pair: 'UNI/USDT',   name: 'Uniswap',       color: '#ff007a' },
  ATOMUSDT:  { pair: 'ATOM/USDT',  name: 'Cosmos',        color: '#6f7390' },
  NEARUSDT:  { pair: 'NEAR/USDT',  name: 'NEAR Protocol', color: '#00ec97' },
  APTUSDT:   { pair: 'APT/USDT',   name: 'Aptos',         color: '#00bcd4' },
}

const SYMBOLS = Object.keys(PAIR_META)

// ── Seed / fallback data ──────────────────────────────────────────────────
const SEED: PairData[] = [
  { symbol: 'BTCUSDT',   price: 83241.52,  change: 1.23,  volume: 1_812_344_201 },
  { symbol: 'ETHUSDT',   price: 1581.40,   change: -0.87, volume:   643_120_998 },
  { symbol: 'BNBUSDT',   price: 584.30,    change: 0.42,  volume:    71_204_881 },
  { symbol: 'ADAUSDT',   price: 0.6312,    change: 2.11,  volume:    39_441_203 },
  { symbol: 'XRPUSDT',   price: 2.0814,    change: 1.75,  volume:   210_987_345 },
  { symbol: 'SOLUSDT',   price: 121.44,    change: 3.02,  volume:   319_887_123 },
  { symbol: 'DOTUSDT',   price: 3.812,     change: -0.55, volume:    11_320_441 },
  { symbol: 'DOGEUSDT',  price: 0.1572,    change: 2.88,  volume:    82_334_219 },
  { symbol: 'AVAXUSDT',  price: 18.76,     change: 4.12,  volume:    34_219_887 },
  { symbol: 'MATICUSDT', price: 0.2214,    change: -1.04, volume:   142_887_334 },
  { symbol: 'LINKUSDT',  price: 12.44,     change: 2.97,  volume:    29_112_441 },
  { symbol: 'LTCUSDT',   price: 78.33,     change: 0.88,  volume:    22_448_110 },
  { symbol: 'UNIUSDT',   price: 5.712,     change: 1.44,  volume:    31_990_221 },
  { symbol: 'ATOMUSDT',  price: 4.219,     change: -0.62, volume:    17_334_005 },
  { symbol: 'NEARUSDT',  price: 2.448,     change: 6.11,  volume:    44_221_987 },
  { symbol: 'APTUSDT',   price: 4.987,     change: 3.22,  volume:    26_448_991 },
]

interface PairData {
  symbol:  string
  price:   number
  change:  number
  volume:  number
}

// ── Binance 24hr ticker fetch ────────────────────────────────────────────
const BINANCE_URL =
  `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(SYMBOLS))}`

async function fetchLivePrices(): Promise<PairData[]> {
  const res = await fetch(BINANCE_URL)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((t) => ({
    symbol: t.symbol as string,
    price:  parseFloat(t.lastPrice),
    change: parseFloat(t.priceChangePercent),
    volume: parseFloat(t.quoteVolume),   // quoteVolume = USDT volume
  }))
}

// ── Formatters ────────────────────────────────────────────────────────────
function fmtPrice(p: number) {
  if (p >= 10000) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (p >= 100)   return p.toFixed(2)
  if (p >= 1)     return p.toFixed(4)
  return p.toFixed(4)
}

function fmtVolume(v: number) {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(3)}B`
  if (v >= 1_000_000)     return `$${(v / 1_000_000).toFixed(3)}M`
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`
}

function fmtCountdown(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, '0')
  const sec = (s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}

// ── Sub-components ────────────────────────────────────────────────────────
function CoinIcon({ symbol, color }: { symbol: string; color: string }) {
  const letter = symbol.replace('USDT', '').charAt(0)
  return (
    <div style={{
      width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg, ${color}55 0%, ${color}22 100%)`,
      border: `1.5px solid ${color}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13, fontWeight: 800, color,
    }}>
      {letter}
    </div>
  )
}

function Sparkline({ up }: { up: boolean }) {
  const pts = up
    ? '0,14 8,12 16,13 24,9 32,10 40,6 48,7 56,4 64,5 72,2 80,3'
    : '0,4 8,5 16,4 24,8 32,6 40,9 48,8 56,11 64,10 72,13 80,14'
  return (
    <svg width={80} height={18} viewBox="0 0 80 18" fill="none">
      <polyline
        points={pts}
        stroke={up ? '#a78bfa' : '#f87171'}
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ── Flash animation styles ─────────────────────────────────────────────────
const FLASH_CSS = `
@keyframes flashGreen { 0%,100%{background:transparent} 30%{background:rgba(167,139,250,0.12)} }
@keyframes flashRed   { 0%,100%{background:transparent} 30%{background:rgba(248,113,113,0.12)} }
.flash-green { animation: flashGreen 0.7s ease; }
.flash-red   { animation: flashRed   0.7s ease; }
`

// ── Main component ─────────────────────────────────────────────────────────
const REFRESH_SECS = 120 // 2 minutes

export function TradingMarkets() {
  const navigate = useNavigate()
  const [pairs, setPairs]         = useState<PairData[]>(SEED)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [countdown, setCountdown] = useState(REFRESH_SECS)
  const [loading, setLoading]     = useState(false)
  const [online, setOnline]       = useState(true)
  const [search, setSearch]       = useState('')
  const [watchlist, setWatchlist] = useState<string[]>(['BTCUSDT', 'ETHUSDT'])
  const [tab, setTab]             = useState<'all' | 'watchlist'>('all')
  const [activePair, setActivePair] = useState<string | null>(null)
  const flashRef = useRef<Record<string, string>>({})
  const prevPrices = useRef<Record<string, number>>({})

  const doFetch = useCallback(async (manual = false) => {
    if (manual) setLoading(true)
    try {
      const live = await fetchLivePrices()

      // compute flash classes based on price movement
      const flashes: Record<string, string> = {}
      live.forEach(p => {
        const prev = prevPrices.current[p.symbol]
        if (prev !== undefined) {
          if (p.price > prev) flashes[p.symbol] = 'flash-green'
          else if (p.price < prev) flashes[p.symbol] = 'flash-red'
        }
        prevPrices.current[p.symbol] = p.price
      })
      flashRef.current = flashes

      setPairs(live)
      setLastRefresh(new Date())
      setOnline(true)
      setCountdown(REFRESH_SECS)

      // Clear flash classes after animation
      setTimeout(() => { flashRef.current = {} }, 800)
    } catch {
      setOnline(false)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch on mount
  useEffect(() => { doFetch() }, [doFetch])

  // Countdown + auto-refresh every 2 mins
  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          doFetch()
          return REFRESH_SECS
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(tick)
  }, [doFetch])

  // Merge live data with static metadata for rendering
  const display = pairs
    .filter(p => PAIR_META[p.symbol])
    .map(p => ({ ...PAIR_META[p.symbol], ...p }))

  const filtered = display.filter(p =>
    (tab === 'watchlist' ? watchlist.includes(p.symbol) : true) &&
    (search === '' ||
      p.symbol.toLowerCase().includes(search.toLowerCase()) ||
      p.name.toLowerCase().includes(search.toLowerCase()))
  )

  const topGainer = [...display].sort((a, b) => b.change - a.change)[0]
  const topLoser  = [...display].sort((a, b) => a.change - b.change)[0]
  const totalVol  = display.reduce((s, p) => s + p.volume, 0)

  // Progress bar fill
  const progress = ((REFRESH_SECS - countdown) / REFRESH_SECS) * 100

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto overflow-x-hidden">
      <style>{FLASH_CSS}</style>

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
              color: '#a78bfa', background: 'rgba(167,139,250,0.1)',
              padding: '3px 10px', borderRadius: 999,
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <span style={{
                width: 5, height: 5, borderRadius: '50%', background: '#a78bfa',
                animation: 'liveBlink 1.2s ease-in-out infinite', display: 'inline-block',
              }} />
              LIVE PRICES
            </span>
            {!online && (
              <span style={{
                fontSize: 11, fontWeight: 600, color: '#f87171',
                background: 'rgba(248,113,113,0.1)', padding: '3px 10px', borderRadius: 999,
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <WifiOff size={11} /> Offline — showing cached
              </span>
            )}
          </div>
          <h1 style={{
            fontSize: 26, fontWeight: 700, color: 'hsl(40 10% 96%)',
            letterSpacing: '-0.02em', lineHeight: 1.2,
          }}>Trade</h1>
          <p style={{ fontSize: 13, color: 'hsl(240 5% 55%)', marginTop: 4 }}>
            Binance spot markets — prices refresh automatically every 2 minutes.
          </p>
        </div>

        {/* Refresh button + countdown */}
        <div style={{ flexShrink: 0 }}>
          <button
            onClick={() => doFetch(true)}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10, padding: '8px 14px', cursor: loading ? 'default' : 'pointer',
              color: loading ? 'hsl(240 5% 35%)' : 'hsl(240 5% 60%)',
              fontSize: 12, fontWeight: 500, transition: 'all 0.15s',
              marginBottom: 8,
            }}
          >
            <RefreshCw
              size={13}
              style={{
                color: online ? '#a78bfa' : '#f87171',
                animation: loading ? 'spin 0.8s linear infinite' : 'none',
              }}
            />
            {loading ? 'Fetching…' : `Auto-refresh in ${fmtCountdown(countdown)}`}
          </button>

          {/* Progress bar */}
          <div style={{
            height: 3, borderRadius: 4,
            background: 'rgba(255,255,255,0.06)', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: 4,
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #a78bfa, #22d3ee)',
              transition: 'width 1s linear',
            }} />
          </div>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Pairs',      value: `${display.length}`,  sub: 'Active markets',     color: '#c4b5fd' },
          { label: 'Top Gainer',       value: topGainer ? topGainer.symbol.replace('USDT','') : '—',
            sub: topGainer ? `+${topGainer.change.toFixed(2)}% today` : '',   color: '#a78bfa' },
          { label: 'Top Loser',        value: topLoser ? topLoser.symbol.replace('USDT','') : '—',
            sub: topLoser ? `${topLoser.change.toFixed(2)}% today` : '',      color: '#f87171' },
          { label: '24h Total Volume', value: fmtVolume(totalVol),  sub: 'Across all pairs',   color: '#38bdf8' },
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 16, padding: '16px 18px',
          }}>
            <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)', fontWeight: 500, marginBottom: 5, letterSpacing: '0.04em' }}>
              {stat.label}
            </p>
            <p style={{ fontSize: 20, fontWeight: 700, color: stat.color, lineHeight: 1, letterSpacing: '-0.01em' }}>
              {stat.value}
            </p>
            <p style={{ fontSize: 11, color: 'hsl(240 5% 45%)', marginTop: 4 }}>{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Last refresh + connection status ── */}
      {lastRefresh && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          marginBottom: 16, fontSize: 12, color: 'hsl(240 5% 45%)',
        }}>
          {online
            ? <Wifi size={12} style={{ color: '#a78bfa' }} />
            : <WifiOff size={12} style={{ color: '#f87171' }} />}
          Prices last fetched from Binance at {lastRefresh.toLocaleTimeString()}
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div style={{
          display: 'flex', gap: 4,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 10, padding: 4,
        }}>
          {(['all', 'watchlist'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '6px 16px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                background: tab === t ? 'rgba(167,139,250,0.25)' : 'transparent',
                color: tab === t ? '#c4b5fd' : 'hsl(240 5% 50%)',
              }}
            >
              {t === 'all' ? 'All Markets' : '⭐ Watchlist'}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{
            position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
            color: 'hsl(240 5% 45%)', pointerEvents: 'none',
          }} />
          <input
            type="text"
            placeholder="Search pair or coin name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', height: 38, paddingLeft: 32, paddingRight: 12,
              borderRadius: 10, fontSize: 13,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'hsl(40 6% 95%)', outline: 'none',
            }}
          />
        </div>
      </div>

      {/* ── Loading skeleton or cards ── */}
      {loading && pairs === SEED ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} style={{
              height: 200, borderRadius: 16,
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.07)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(pair => {
            const up        = pair.change >= 0
            const isActive  = activePair === pair.symbol
            const isWatched = watchlist.includes(pair.symbol)
            const flashClass = flashRef.current[pair.symbol] ?? ''

            return (
              <div
                key={pair.symbol}
                className={flashClass}
                onClick={() => setActivePair(isActive ? null : pair.symbol)}
                style={{
                  background: isActive ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.028)',
                  border: isActive
                    ? '1px solid rgba(167,139,250,0.45)'
                    : '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 16, padding: '18px 18px 0',
                  cursor: 'pointer', transition: 'all 0.18s',
                  position: 'relative', overflow: 'hidden',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.borderColor = 'rgba(167,139,250,0.3)'
                    el.style.background  = 'rgba(255,255,255,0.045)'
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.borderColor = 'rgba(255,255,255,0.07)'
                    el.style.background  = 'rgba(255,255,255,0.028)'
                  }
                }}
              >
                {/* Color stripe top */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                  background: isActive ? `linear-gradient(90deg, ${pair.color}, transparent)` : 'transparent',
                  transition: 'background 0.2s',
                }} />

                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <CoinIcon symbol={pair.symbol} color={pair.color} />
                    <div>
                      <p style={{ fontSize: 13.5, fontWeight: 700, color: 'hsl(40 10% 94%)', lineHeight: 1.2 }}>
                        {pair.symbol}
                      </p>
                      <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)', lineHeight: 1 }}>{pair.pair}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        setWatchlist(prev =>
                          prev.includes(pair.symbol)
                            ? prev.filter(x => x !== pair.symbol)
                            : [...prev, pair.symbol]
                        )
                      }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                    >
                      <Star size={13} style={{
                        fill: isWatched ? '#f59e0b' : 'none',
                        color: isWatched ? '#f59e0b' : 'hsl(240 5% 40%)',
                      }} />
                    </button>
                    <ChevronRight size={15} style={{
                      color: 'hsl(240 5% 40%)',
                      transform: isActive ? 'rotate(90deg)' : 'none',
                      transition: 'transform 0.2s',
                    }} />
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-center justify-between mb-2.5">
                  <div>
                    <p style={{ fontSize: 11, color: 'hsl(240 5% 48%)', marginBottom: 2 }}>Price</p>
                    <p style={{
                      fontSize: 17, fontWeight: 800, color: 'hsl(40 6% 94%)',
                      letterSpacing: '-0.015em', lineHeight: 1,
                    }}>
                      ${fmtPrice(pair.price)}
                    </p>
                  </div>
                  <Sparkline up={up} />
                </div>

                {/* 24h Change */}
                <div className="flex items-center justify-between mb-2">
                  <p style={{ fontSize: 12, color: 'hsl(240 5% 48%)' }}>24h Change</p>
                  <span style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 13, fontWeight: 700,
                    color: up ? '#a78bfa' : '#f87171',
                  }}>
                    {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                    {up ? '+' : ''}{pair.change.toFixed(2)}%
                  </span>
                </div>

                {/* 24h Volume */}
                <div className="flex items-center justify-between mb-4">
                  <p style={{ fontSize: 12, color: 'hsl(240 5% 48%)' }}>24h Volume</p>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'hsl(240 5% 70%)' }}>
                    {fmtVolume(pair.volume)}
                  </p>
                </div>

                {/* CTA */}
                <div style={{ margin: '0 -18px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <button
                    onClick={e => { e.stopPropagation(); navigate(`/dashboard/trade/${pair.symbol}`) }}
                    style={{
                      width: '100%', height: 42,
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                      fontSize: 13, fontWeight: 600,
                      color: isActive ? '#c4b5fd' : 'hsl(240 5% 55%)',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLButtonElement
                      el.style.color = '#c4b5fd'
                      el.style.background = 'rgba(167,139,250,0.08)'
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLButtonElement
                      el.style.color = isActive ? '#c4b5fd' : 'hsl(240 5% 55%)'
                      el.style.background = 'transparent'
                    }}
                  >
                    <BarChart2 size={14} />
                    Start Trading
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty watchlist */}
      {tab === 'watchlist' && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '64px 24px', color: 'hsl(240 5% 50%)' }}>
          <Star size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: 'hsl(240 5% 65%)', marginBottom: 6 }}>
            Your watchlist is empty
          </p>
          <p style={{ fontSize: 13 }}>Click the ★ on any market card to add it.</p>
        </div>
      )}

      {/* ── Disclaimer ── */}
      <p style={{
        marginTop: 40, fontSize: 11, color: 'hsl(240 5% 40%)',
        lineHeight: 1.7, textAlign: 'center',
      }}>
        Live prices sourced from Binance public API. Cryptocurrency trading involves substantial risk of loss.
        Past performance does not guarantee future results.
      </p>
    </div>
  )
}
