/**
 * TradingAssets — list of tradeable assets (forex, crypto, stocks, commodities)
 * with category filter, sort, search, pagination, and per-row star toggle.
 *
 * Clicking an asset navigates to /dashboard/trade/{symbol} for the chart + trade panel.
 * Starred assets sync via the useFavorites hook (same storage as LiveMarkets / Star page).
 */
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronRight, Search, Star, Home, CandlestickChart, Briefcase, FileClock } from 'lucide-react'
import { CryptoLogo } from '@/components/ui/CryptoLogo'
import { useFavorites } from '@/hooks/useFavorites'

type Category = 'forex' | 'crypto' | 'stock' | 'commodity'

interface Asset {
  symbol:   string        // "BTC/USDT", "EUR/USD", "AAPL"
  code:     string        // "BTCUSDT", "EURUSD", "AAPL" — used in the URL
  category: Category
  price:    number
  ch1h:     number        // percent change
  ch24h:    number
  ch7d:     number
  flagEmoji?: string      // forex uses flag emoji
}

const ASSETS: Asset[] = [
  // ── Crypto ──
  { symbol: 'BTC/USDT',  code: 'BTCUSDT',  category: 'crypto',    price: 83552.00, ch1h: -0.12, ch24h: +2.34, ch7d: +5.21 },
  { symbol: 'ETH/USDT',  code: 'ETHUSDT',  category: 'crypto',    price: 3118.50,  ch1h: +0.24, ch24h: +1.12, ch7d: +3.88 },
  { symbol: 'SOL/USDT',  code: 'SOLUSDT',  category: 'crypto',    price: 185.22,   ch1h: -0.45, ch24h: -0.88, ch7d: -2.11 },
  { symbol: 'BNB/USDT',  code: 'BNBUSDT',  category: 'crypto',    price: 586.40,   ch1h: +0.11, ch24h: +0.45, ch7d: +1.74 },
  { symbol: 'XRP/USDT',  code: 'XRPUSDT',  category: 'crypto',    price: 0.6180,   ch1h: -0.18, ch24h: -1.22, ch7d: -3.02 },
  { symbol: 'ADA/USDT',  code: 'ADAUSDT',  category: 'crypto',    price: 0.4120,   ch1h: +0.61, ch24h: +3.10, ch7d: +4.52 },
  { symbol: 'DOGE/USDT', code: 'DOGEUSDT', category: 'crypto',    price: 0.1742,   ch1h: +1.02, ch24h: +5.22, ch7d: +8.91 },
  { symbol: 'AVAX/USDT', code: 'AVAXUSDT', category: 'crypto',    price: 38.42,    ch1h: -0.33, ch24h: -2.14, ch7d: -4.70 },
  { symbol: 'DOT/USDT',  code: 'DOTUSDT',  category: 'crypto',    price: 7.84,     ch1h: +0.22, ch24h: +0.92, ch7d: +2.18 },
  { symbol: 'LINK/USDT', code: 'LINKUSDT', category: 'crypto',    price: 14.22,    ch1h: +0.55, ch24h: +1.88, ch7d: +3.44 },
  { symbol: 'LTC/USDT',  code: 'LTCUSDT',  category: 'crypto',    price: 78.33,    ch1h: +0.18, ch24h: +0.88, ch7d: +1.62 },
  { symbol: 'MATIC/USDT',code: 'MATICUSDT',category: 'crypto',    price: 0.2214,   ch1h: -0.27, ch24h: -1.04, ch7d: -2.88 },
  { symbol: 'TRX/USDT',  code: 'TRXUSDT',  category: 'crypto',    price: 0.2410,   ch1h: +0.05, ch24h: +0.62, ch7d: +1.11 },
  { symbol: 'SHIB/USDT', code: 'SHIBUSDT', category: 'crypto',    price: 0.00002412,ch1h: +0.41, ch24h: +2.08, ch7d: +3.92 },
  { symbol: 'ARB/USDT',  code: 'ARBUSDT',  category: 'crypto',    price: 1.24,     ch1h: -0.15, ch24h: -0.82, ch7d: -1.68 },

  // ── Forex ──
  { symbol: 'EUR/USD',   code: 'EURUSD',  category: 'forex',      price: 1.08432,  ch1h: +0.04, ch24h: +0.14, ch7d: +0.32, flagEmoji: '🇪🇺' },
  { symbol: 'GBP/USD',   code: 'GBPUSD',  category: 'forex',      price: 1.26714,  ch1h: +0.02, ch24h: +0.08, ch7d: +0.21, flagEmoji: '🇬🇧' },
  { symbol: 'USD/JPY',   code: 'USDJPY',  category: 'forex',      price: 152.88,   ch1h: -0.08, ch24h: -0.24, ch7d: -0.66, flagEmoji: '🇯🇵' },
  { symbol: 'AUD/USD',   code: 'AUDUSD',  category: 'forex',      price: 0.6612,   ch1h: +0.11, ch24h: +0.57, ch7d: +1.02, flagEmoji: '🇦🇺' },
  { symbol: 'USD/CAD',   code: 'USDCAD',  category: 'forex',      price: 1.3682,   ch1h: -0.05, ch24h: -0.18, ch7d: -0.44, flagEmoji: '🇨🇦' },
  { symbol: 'USD/CHF',   code: 'USDCHF',  category: 'forex',      price: 0.9012,   ch1h: +0.03, ch24h: +0.12, ch7d: +0.28, flagEmoji: '🇨🇭' },
  { symbol: 'NZD/USD',   code: 'NZDUSD',  category: 'forex',      price: 0.6102,   ch1h: -0.07, ch24h: -0.22, ch7d: -0.58, flagEmoji: '🇳🇿' },
  { symbol: 'EUR/GBP',   code: 'EURGBP',  category: 'forex',      price: 0.8557,   ch1h: +0.04, ch24h: +0.11, ch7d: +0.24, flagEmoji: '🇪🇺' },
  { symbol: 'EUR/JPY',   code: 'EURJPY',  category: 'forex',      price: 165.78,   ch1h: -0.03, ch24h: -0.14, ch7d: -0.32, flagEmoji: '🇪🇺' },
  { symbol: 'GBP/JPY',   code: 'GBPJPY',  category: 'forex',      price: 193.72,   ch1h: -0.10, ch24h: -0.31, ch7d: -0.74, flagEmoji: '🇬🇧' },
  { symbol: 'AUD/JPY',   code: 'AUDJPY',  category: 'forex',      price: 101.10,   ch1h: +0.05, ch24h: +0.33, ch7d: +0.71, flagEmoji: '🇦🇺' },
  { symbol: 'AUD/CAD',   code: 'AUDCAD',  category: 'forex',      price: 0.9045,   ch1h: +0.02, ch24h: +0.08, ch7d: +0.17, flagEmoji: '🇦🇺' },
  { symbol: 'AUD/CHF',   code: 'AUDCHF',  category: 'forex',      price: 0.5962,   ch1h: +0.09, ch24h: +0.28, ch7d: +0.72, flagEmoji: '🇦🇺' },
  { symbol: 'AUD/NZD',   code: 'AUDNZD',  category: 'forex',      price: 1.0835,   ch1h: -0.02, ch24h: -0.11, ch7d: -0.24, flagEmoji: '🇦🇺' },

  // ── Stocks ──
  { symbol: 'AAPL',      code: 'AAPL',    category: 'stock',      price: 228.44,   ch1h: +0.18, ch24h: +0.88, ch7d: +2.34, flagEmoji: '🇺🇸' },
  { symbol: 'MSFT',      code: 'MSFT',    category: 'stock',      price: 421.11,   ch1h: -0.08, ch24h: -0.42, ch7d: +1.12, flagEmoji: '🇺🇸' },
  { symbol: 'GOOGL',     code: 'GOOGL',   category: 'stock',      price: 181.22,   ch1h: +0.24, ch24h: +1.18, ch7d: +3.02, flagEmoji: '🇺🇸' },
  { symbol: 'AMZN',      code: 'AMZN',    category: 'stock',      price: 198.72,   ch1h: +0.11, ch24h: +0.62, ch7d: +2.18, flagEmoji: '🇺🇸' },
  { symbol: 'TSLA',      code: 'TSLA',    category: 'stock',      price: 242.08,   ch1h: -0.55, ch24h: -2.44, ch7d: -4.88, flagEmoji: '🇺🇸' },
  { symbol: 'META',      code: 'META',    category: 'stock',      price: 564.30,   ch1h: +0.08, ch24h: +0.34, ch7d: +1.78, flagEmoji: '🇺🇸' },
  { symbol: 'NVDA',      code: 'NVDA',    category: 'stock',      price: 138.88,   ch1h: +0.72, ch24h: +3.22, ch7d: +6.42, flagEmoji: '🇺🇸' },
  { symbol: 'NFLX',      code: 'NFLX',    category: 'stock',      price: 722.40,   ch1h: +0.04, ch24h: +0.22, ch7d: +1.08, flagEmoji: '🇺🇸' },

  // ── Commodities ──
  { symbol: 'XAU/USD',   code: 'XAUUSD',  category: 'commodity',  price: 2318.50,  ch1h: -0.08, ch24h: -0.42, ch7d: +1.22, flagEmoji: '🥇' },
  { symbol: 'XAG/USD',   code: 'XAGUSD',  category: 'commodity',  price: 27.44,    ch1h: +0.12, ch24h: +0.68, ch7d: +2.02, flagEmoji: '🥈' },
  { symbol: 'WTI/USD',   code: 'WTIUSD',  category: 'commodity',  price: 78.22,    ch1h: -0.18, ch24h: -0.84, ch7d: -2.14, flagEmoji: '🛢️' },
  { symbol: 'BRENT',     code: 'BRENT',   category: 'commodity',  price: 82.14,    ch1h: -0.14, ch24h: -0.72, ch7d: -1.88, flagEmoji: '🛢️' },
  { symbol: 'NATGAS',    code: 'NATGAS',  category: 'commodity',  price: 2.842,    ch1h: +0.32, ch24h: +1.44, ch7d: +3.22, flagEmoji: '⛽' },
]

const PAGE_SIZE = 10

const CATEGORY_LABELS: { value: Category | 'all'; label: string }[] = [
  { value: 'all',       label: 'ALL ASSETS' },
  { value: 'forex',     label: 'FOREX' },
  { value: 'crypto',    label: 'CRYPTO' },
  { value: 'stock',     label: 'STOCKS' },
  { value: 'commodity', label: 'COMMODITIES' },
]

type SortKey = 'default' | 'name' | 'price-desc' | 'price-asc' | 'ch24-desc' | 'ch24-asc'
const SORT_LABELS: { value: SortKey; label: string }[] = [
  { value: 'default',    label: 'ORDER BY' },
  { value: 'name',       label: 'Name A→Z' },
  { value: 'price-desc', label: 'Price: High → Low' },
  { value: 'price-asc',  label: 'Price: Low → High' },
  { value: 'ch24-desc',  label: '24h Change: High → Low' },
  { value: 'ch24-asc',   label: '24h Change: Low → High' },
]

function fmtPrice(p: number): string {
  if (p >= 1000)    return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
  if (p >= 1)       return p.toFixed(5).replace(/0+$/, '').replace(/\.$/, '')
  if (p >= 0.01)    return p.toFixed(5)
  return p.toFixed(8)
}

function fmtChange(c: number): string {
  const sign = c > 0 ? '+' : ''
  return `${sign}${c.toFixed(2)}%`
}

// Logo renderer — crypto uses CryptoLogo, forex/stock/commodity uses flag emoji
function AssetLogo({ a }: { a: Asset }) {
  if (a.category === 'crypto') {
    return <CryptoLogo symbol={a.symbol} size={44} />
  }
  return (
    <div style={{
      width: 44, height: 44, borderRadius: 8,
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 22, flexShrink: 0,
    }}>
      {a.flagEmoji ?? '•'}
    </div>
  )
}

// Native-style dropdown (custom styled)
function Dropdown<T extends string>({
  value, options, onChange,
}: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  const [open, setOpen] = useState(false)
  const current = options.find(o => o.value === value)
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px', borderRadius: 12, cursor: 'pointer',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: 'hsl(40 6% 88%)', fontSize: 13, fontWeight: 700, letterSpacing: '0.05em',
        }}
      >
        {current?.label}
        <ChevronDown size={14} style={{ opacity: 0.6, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>
      {open && (
        <>
          {/* Click-outside backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
          />
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 50,
            background: 'hsl(260 60% 6%)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, padding: 4,
            boxShadow: '0 12px 36px rgba(0,0,0,0.5)',
          }}>
            {options.map(o => (
              <button
                key={o.value}
                onClick={() => { onChange(o.value); setOpen(false) }}
                style={{
                  width: '100%', textAlign: 'left', padding: '10px 14px',
                  borderRadius: 8, cursor: 'pointer', border: 'none',
                  background: o.value === value ? 'rgba(167,139,250,0.15)' : 'transparent',
                  color: o.value === value ? '#c4b5fd' : 'hsl(40 6% 85%)',
                  fontSize: 12, fontWeight: 600,
                }}
                onMouseEnter={e => { if (o.value !== value) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                onMouseLeave={e => { if (o.value !== value) e.currentTarget.style.background = 'transparent' }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export function TradingAssets() {
  const navigate = useNavigate()
  const { isFavorite, toggle } = useFavorites()
  const [category, setCategory] = useState<Category | 'all'>('all')
  const [sortBy,   setSortBy]   = useState<SortKey>('default')
  const [search,   setSearch]   = useState('')
  const [page,     setPage]     = useState(1)

  // Filter + sort pipeline
  const filtered = useMemo(() => {
    let list = ASSETS.slice()
    if (category !== 'all') list = list.filter(a => a.category === category)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(a => a.symbol.toLowerCase().includes(q) || a.code.toLowerCase().includes(q))
    }
    switch (sortBy) {
      case 'name':       list.sort((a, b) => a.symbol.localeCompare(b.symbol)); break
      case 'price-desc': list.sort((a, b) => b.price - a.price); break
      case 'price-asc':  list.sort((a, b) => a.price - b.price); break
      case 'ch24-desc':  list.sort((a, b) => b.ch24h - a.ch24h); break
      case 'ch24-asc':   list.sort((a, b) => a.ch24h - b.ch24h); break
    }
    return list
  }, [category, search, sortBy])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function onTrade(asset: Asset) {
    navigate(`/dashboard/trade/${asset.code}`)
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', minHeight: '100vh',
      background: 'hsl(260 87% 3%)', color: 'hsl(40 6% 90%)',
    }}>
      {/* ── Body ── */}
      <div style={{ flex: 1, padding: '24px 20px 16px', maxWidth: 1280, width: '100%', margin: '0 auto' }}>

        {/* Top filter row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
          <Dropdown
            value={category}
            options={CATEGORY_LABELS}
            onChange={(v) => { setCategory(v as Category | 'all'); setPage(1) }}
          />
          <Dropdown
            value={sortBy}
            options={SORT_LABELS}
            onChange={(v) => setSortBy(v as SortKey)}
          />
        </div>

        {/* Search + pagination row */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 20, alignItems: 'stretch' }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 10,
            padding: '14px 18px', borderRadius: 12,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <Search size={14} style={{ color: 'hsl(240 5% 50%)', flexShrink: 0 }} />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search"
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                fontSize: 13, color: 'hsl(40 6% 90%)',
              }}
            />
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 18px', borderRadius: 12,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              style={{
                background: 'none', border: 'none', cursor: currentPage <= 1 ? 'default' : 'pointer',
                color: currentPage <= 1 ? 'hsl(240 5% 30%)' : 'hsl(40 6% 85%)',
                padding: 0, display: 'flex', alignItems: 'center',
              }}
            >
              <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />
            </button>
            <span style={{ fontSize: 13, color: 'hsl(240 5% 60%)', whiteSpace: 'nowrap' }}>
              ({currentPage} / {totalPages})
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              style={{
                background: 'none', border: 'none', cursor: currentPage >= totalPages ? 'default' : 'pointer',
                color: currentPage >= totalPages ? 'hsl(240 5% 30%)' : 'hsl(40 6% 85%)',
                padding: 0, display: 'flex', alignItems: 'center',
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Asset list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {visible.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'hsl(240 5% 45%)', fontSize: 13 }}>
              No assets match your filters.
            </div>
          )}
          {visible.map(a => {
            const fav = isFavorite(a.symbol)
            return (
              <div
                key={a.code}
                onClick={() => onTrade(a)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '60px 1fr auto auto auto auto 44px',
                  gap: 14, alignItems: 'center',
                  padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.04)',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
              >
                <AssetLogo a={a} />
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'hsl(40 6% 92%)', letterSpacing: '0.02em' }}>
                    {a.symbol}
                  </p>
                  <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)', textTransform: 'lowercase' }}>
                    {a.category}
                  </p>
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'hsl(40 6% 85%)', fontFamily: 'ui-monospace, monospace' }}>
                  {fmtPrice(a.price)}
                </p>
                <span style={{ fontSize: 12, fontWeight: 600, color: a.ch1h >= 0 ? '#4ade80' : '#f87171', minWidth: 54, textAlign: 'right' }}>
                  {fmtChange(a.ch1h)}
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: a.ch24h >= 0 ? '#4ade80' : '#f87171', minWidth: 54, textAlign: 'right' }}>
                  {fmtChange(a.ch24h)}
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: a.ch7d >= 0 ? '#4ade80' : '#f87171', minWidth: 58, textAlign: 'right' }}>
                  {fmtChange(a.ch7d)}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); toggle(a.symbol) }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: 6,
                    color: fav ? '#f59e0b' : 'hsl(240 5% 35%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Star size={16} fill={fav ? '#f59e0b' : 'none'} />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Bottom Navigation ── */}
      <div style={{
        display: 'flex', alignItems: 'stretch', justifyContent: 'space-around',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        background: 'hsl(260 87% 4%)',
        padding: '8px 4px 10px',
        flexShrink: 0,
        position: 'sticky', bottom: 0,
      }}>
        {[
          { label: 'Home',          icon: Home,             path: '/dashboard' },
          { label: 'Assets',        icon: Briefcase,        path: '/dashboard/assets',        active: true },
          { label: 'Trade',         icon: CandlestickChart, path: '/dashboard/trade' },
          { label: 'Closed Trades', icon: FileClock,        path: '/dashboard/statement' },
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
                transition: 'color 0.15s',
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
