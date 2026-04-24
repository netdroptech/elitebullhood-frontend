import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  TrendingUp, TrendingDown, ArrowLeft, ChevronDown,
  Wallet, Clock, DollarSign, AlertCircle, CheckCircle2,
  CandlestickChart, Briefcase, FileClock, Star,
} from 'lucide-react'
import { CryptoLogo } from '@/components/ui/CryptoLogo'
import { useAuth } from '@/context/AuthContext'
import { useTrades, parseDurationSec } from '@/hooks/useTrades'

// ── Same metadata as TradingMarkets ───────────────────────────────────────
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
  TRXUSDT:   { pair: 'TRX/USDT',   name: 'TRON',          color: '#ff060a' },
  SHIBUSDT:  { pair: 'SHIB/USDT',  name: 'Shiba Inu',     color: '#ffa409' },
  ARBUSDT:   { pair: 'ARB/USDT',   name: 'Arbitrum',      color: '#28a0f0' },
  PEPEUSDT:  { pair: 'PEPE/USDT',  name: 'Pepe',          color: '#4caf50' },

  // ── Forex ──
  EURUSD:    { pair: 'EUR/USD',    name: 'Euro',                  color: '#1e3a8a' },
  GBPUSD:    { pair: 'GBP/USD',    name: 'British Pound',         color: '#7c3aed' },
  USDJPY:    { pair: 'USD/JPY',    name: 'Japanese Yen',          color: '#dc2626' },
  AUDUSD:    { pair: 'AUD/USD',    name: 'Australian Dollar',     color: '#059669' },
  USDCAD:    { pair: 'USD/CAD',    name: 'Canadian Dollar',       color: '#dc2626' },
  USDCHF:    { pair: 'USD/CHF',    name: 'Swiss Franc',           color: '#e11d48' },
  NZDUSD:    { pair: 'NZD/USD',    name: 'NZ Dollar',             color: '#0284c7' },
  EURGBP:    { pair: 'EUR/GBP',    name: 'Euro / GBP',            color: '#1e3a8a' },
  EURJPY:    { pair: 'EUR/JPY',    name: 'Euro / Yen',            color: '#1e3a8a' },
  GBPJPY:    { pair: 'GBP/JPY',    name: 'GBP / Yen',             color: '#7c3aed' },
  AUDJPY:    { pair: 'AUD/JPY',    name: 'AUD / Yen',             color: '#059669' },
  AUDCAD:    { pair: 'AUD/CAD',    name: 'AUD / CAD',             color: '#059669' },
  AUDCHF:    { pair: 'AUD/CHF',    name: 'AUD / CHF',             color: '#059669' },
  AUDNZD:    { pair: 'AUD/NZD',    name: 'AUD / NZD',             color: '#059669' },

  // ── Stocks ──
  AAPL:      { pair: 'AAPL',       name: 'Apple',                 color: '#a3a3a3' },
  MSFT:      { pair: 'MSFT',       name: 'Microsoft',             color: '#0078d4' },
  GOOGL:     { pair: 'GOOGL',      name: 'Alphabet',              color: '#4285f4' },
  AMZN:      { pair: 'AMZN',       name: 'Amazon',                color: '#ff9900' },
  TSLA:      { pair: 'TSLA',       name: 'Tesla',                 color: '#cc0000' },
  META:      { pair: 'META',       name: 'Meta',                  color: '#1877f2' },
  NVDA:      { pair: 'NVDA',       name: 'NVIDIA',                color: '#76b900' },
  NFLX:      { pair: 'NFLX',       name: 'Netflix',               color: '#e50914' },

  // ── Commodities ──
  XAUUSD:    { pair: 'XAU/USD',    name: 'Gold',                  color: '#fbbf24' },
  XAGUSD:    { pair: 'XAG/USD',    name: 'Silver',                color: '#cbd5e1' },
  WTIUSD:    { pair: 'WTI/USD',    name: 'WTI Crude Oil',         color: '#44403c' },
  BRENT:     { pair: 'BRENT',      name: 'Brent Crude Oil',       color: '#292524' },
  NATGAS:    { pair: 'NATGAS',     name: 'Natural Gas',           color: '#60a5fa' },
}

// Order for the pair dropdown — most-popular-first
const PAIR_LIST: string[] = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT',
  'ADAUSDT', 'DOGEUSDT', 'AVAXUSDT', 'DOTUSDT', 'LINKUSDT',
  'LTCUSDT', 'MATICUSDT', 'NEARUSDT', 'APTUSDT', 'ATOMUSDT',
  'UNIUSDT', 'TRXUSDT', 'SHIBUSDT', 'ARBUSDT', 'PEPEUSDT',
]

/**
 * Map any of our internal codes to a TradingView-native symbol.
 * TradingView uses exchange prefixes; picking the right one makes the chart
 * actually show data. Falls back to Coinbase BTCUSD if nothing matches.
 */
function tvSymbol(code: string): string {
  const c = code.toUpperCase()

  // ── Crypto on Binance ─────────────────────────────────────────────
  const binanceCrypto = new Set([
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT', 'SOLUSDT',
    'DOTUSDT', 'DOGEUSDT', 'AVAXUSDT', 'MATICUSDT', 'LINKUSDT', 'LTCUSDT',
    'UNIUSDT', 'ATOMUSDT', 'NEARUSDT', 'APTUSDT', 'TRXUSDT', 'SHIBUSDT',
    'ARBUSDT', 'PEPEUSDT',
  ])
  if (binanceCrypto.has(c)) return `BINANCE:${c}`

  // ── Forex on OANDA ────────────────────────────────────────────────
  const oandaForex = new Set([
    'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'USDCHF', 'NZDUSD',
    'EURGBP', 'EURJPY', 'GBPJPY', 'AUDJPY', 'AUDCAD', 'AUDCHF', 'AUDNZD',
    'EURCHF', 'EURCAD', 'EURAUD', 'GBPCHF', 'GBPCAD', 'GBPAUD',
  ])
  if (oandaForex.has(c)) return `OANDA:${c}`

  // ── Stocks on NASDAQ / NYSE ───────────────────────────────────────
  const nasdaqStocks = new Set(['AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'ADBE', 'INTC', 'AMD'])
  if (nasdaqStocks.has(c)) return `NASDAQ:${c}`
  const nyseStocks = new Set(['JPM', 'BAC', 'V', 'MA', 'DIS', 'KO', 'PEP'])
  if (nyseStocks.has(c)) return `NYSE:${c}`

  // ── Commodities & indices ─────────────────────────────────────────
  const tvcOverrides: Record<string, string> = {
    XAUUSD: 'TVC:GOLD',
    XAGUSD: 'TVC:SILVER',
    WTIUSD: 'TVC:USOIL',
    BRENT:  'TVC:UKOIL',
    NATGAS: 'NYMEX:NG1!',
    SPX:    'TVC:SPX',
    NDX:    'TVC:NDX',
    DJI:    'TVC:DJI',
    US500:  'TVC:SPX',
  }
  if (tvcOverrides[c]) return tvcOverrides[c]

  // ── Fallback: assume crypto-like and try Coinbase BTCUSD (never blank) ──
  return 'COINBASE:BTCUSD'
}

interface TickerData {
  lastPrice:          string
  priceChangePercent: string
  highPrice:          string
  lowPrice:           string
  quoteVolume:        string
}

function fmtPrice(p: number) {
  if (p >= 10000) return p.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })
  if (p >= 100)   return p.toFixed(4)
  if (p >= 1)     return p.toFixed(4)
  return p.toFixed(4)
}

function fmtVolume(v: number) {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(3)}B`
  if (v >= 1_000_000)     return `$${(v / 1_000_000).toFixed(3)}M`
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: 3 })}`
}

function CoinIcon({ symbol, color, size = 42 }: { symbol: string; color: string; size?: number }) {
  return <CryptoLogo symbol={symbol} size={size} fallbackColor={color} />
}

const DURATIONS = ['30 seconds', '1 minute', '2 minutes', '5 minutes', '10 minutes', '15 minutes', '30 minutes', '1 hour']
const QUICK_AMOUNTS = [10, 25, 50, 100, 250, 500]

// Chart view modes — drives which TradingView widget URL is rendered.
type ChartMode = 'LIVE' | '7 DAY' | '30 DAY' | 'SIMPLE' | 'TECHNICAL'
const CHART_MODES: ChartMode[] = ['LIVE', '7 DAY', '30 DAY', 'SIMPLE', 'TECHNICAL']

function chartUrl(sym: string, mode: ChartMode): string {
  const tvSym = tvSymbol(sym)
  const encoded = encodeURIComponent(tvSym)
  const common = 'theme=dark&locale=en&toolbar_bg=131722&withdateranges=0&hotlist=0&calendar=0&show_popup_button=0&no_referral_id=1&utm_medium=widget_new&utm_campaign=chart'

  switch (mode) {
    case 'LIVE':
      // Area chart, 1-minute — streaming feel
      return `https://s.tradingview.com/widgetembed/?symbol=${encoded}&interval=1&style=3&hide_side_toolbar=1&details=0&studies=[]&${common}`
    case '7 DAY':
      // Line chart, hourly candles, 7-day window
      return `https://s.tradingview.com/widgetembed/?symbol=${encoded}&interval=60&style=2&range=7D&hide_side_toolbar=1&details=1&studies=[]&${common}`
    case '30 DAY':
      // Line chart, daily candles, 1-month window
      return `https://s.tradingview.com/widgetembed/?symbol=${encoded}&interval=D&style=2&range=1M&hide_side_toolbar=1&details=1&studies=[]&${common}`
    case 'SIMPLE':
      // Mini symbol overview — clean area chart with current price, 24h, 1W, 1M, 3M ranges
      return `https://s.tradingview.com/embed-widget/mini-symbol-overview/?locale=en#${encodeURIComponent(JSON.stringify({
        symbol: tvSym,
        width: '100%',
        height: '100%',
        locale: 'en',
        dateRange: '12M',
        colorTheme: 'dark',
        isTransparent: false,
        autosize: true,
        largeChartUrl: '',
        chartOnly: false,
      }))}`
    case 'TECHNICAL':
    default:
      // Full advanced chart — candlesticks + side toolbar + indicators
      return `https://s.tradingview.com/widgetembed/?symbol=${encoded}&interval=1&style=1&hide_side_toolbar=0&details=0&studies=[]&${common}`
  }
}

export function TradeDetail() {
  const { symbol = 'BTCUSDT' } = useParams<{ symbol: string }>()
  const navigate = useNavigate()
  const sym = symbol.toUpperCase()
  const meta = PAIR_META[sym] ?? { pair: sym, name: sym, color: '#7c7c7c' }
  const { user } = useAuth()
  const { openList, balanceDelta, openTrade } = useTrades()

  // Filter open trades for THIS symbol (shown under the chart).
  const symOpenTrades = openList.filter(t => t.symbol === sym)

  // Effective balance shown to the user = backend balance + running delta.
  const effectiveBalance = (user?.balance ?? 0) + balanceDelta

  const [ticker, setTicker]     = useState<TickerData | null>(null)
  const [tradeType, setTradeType] = useState<'CALL' | 'PUT'>('CALL')
  const [amount, setAmount]     = useState('')
  const [duration, setDuration] = useState('1 minute')
  const [placing, setPlacing]   = useState(false)
  const [placed, setPlaced]     = useState(false)
  const [error, setError]       = useState('')
  const [chartMode, setChartMode] = useState<ChartMode>('TECHNICAL')
  const [modeOpen, setModeOpen]   = useState(false)
  const [pairOpen, setPairOpen]   = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Fetch live ticker — only for Binance crypto pairs; TV chart carries the
  // price for everything else, header stats just show "—".
  useEffect(() => {
    const tv = tvSymbol(sym)
    if (!tv.startsWith('BINANCE:')) {
      setTicker(null)
      return
    }
    const load = async () => {
      try {
        const res  = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${sym}`)
        const data = await res.json()
        setTicker(data)
      } catch { /* keep null */ }
    }
    load()
    const id = setInterval(load, 10_000)   // refresh price header every 10s
    return () => clearInterval(id)
  }, [sym])

  const price  = ticker ? parseFloat(ticker.lastPrice) : 0
  const change = ticker ? parseFloat(ticker.priceChangePercent) : 0
  const high   = ticker ? parseFloat(ticker.highPrice)  : 0
  const low    = ticker ? parseFloat(ticker.lowPrice)   : 0
  const vol    = ticker ? parseFloat(ticker.quoteVolume): 0
  const up     = change >= 0

  // TradingView widget URL — depends on currently-selected chart mode
  const tvUrl = chartUrl(sym, chartMode)

  function handlePlace() {
    const amt = parseFloat(amount)
    if (!amount || isNaN(amt) || amt <= 0) {
      setError('Please enter a valid amount.')
      return
    }
    if (amt < 1) {
      setError('Minimum trade amount is $1.')
      return
    }
    if (amt > effectiveBalance) {
      setError('Insufficient funds. Please deposit or lower your stake.')
      return
    }
    setError('')
    setPlacing(true)

    // Small delay for UX, then actually open the trade
    setTimeout(() => {
      // Infer asset category & flag from our static maps / symbol shape
      const category = inferCategory(sym)
      const flag = FALLBACK_FLAGS[sym]
      openTrade({
        symbol:          sym,
        pair:            meta.pair,
        name:            meta.name,
        category,
        flagEmoji:       flag,
        direction:       tradeType,
        amount:          amt,
        payoutMultiplier: 1.85,
        openPrice:       price || 0,
        durationLabel:   duration,
        durationSec:     parseDurationSec(duration),
      })
      setPlacing(false)
      setPlaced(true)
      setAmount('')
      setTimeout(() => setPlaced(false), 4000)
    }, 900)
  }

  // Infer asset category from symbol shape (keeps TradeDetail self-contained)
  function inferCategory(s: string): 'crypto' | 'forex' | 'stock' | 'commodity' {
    const upper = s.toUpperCase()
    if (upper.endsWith('USDT')) return 'crypto'
    if (['XAUUSD', 'XAGUSD', 'WTIUSD', 'BRENT', 'NATGAS'].includes(upper)) return 'commodity'
    if (['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX'].includes(upper)) return 'stock'
    if (upper.length === 6 && /^[A-Z]{6}$/.test(upper)) return 'forex'
    return 'crypto'
  }

  // Emoji flags for non-crypto assets (used when opening a trade)
  const FALLBACK_FLAGS: Record<string, string> = {
    EURUSD: '🇪🇺', GBPUSD: '🇬🇧', USDJPY: '🇯🇵', AUDUSD: '🇦🇺',
    USDCAD: '🇨🇦', USDCHF: '🇨🇭', NZDUSD: '🇳🇿', EURGBP: '🇪🇺',
    EURJPY: '🇪🇺', GBPJPY: '🇬🇧', AUDJPY: '🇦🇺', AUDCAD: '🇦🇺',
    AUDCHF: '🇦🇺', AUDNZD: '🇦🇺',
    AAPL: '🇺🇸', MSFT: '🇺🇸', GOOGL: '🇺🇸', AMZN: '🇺🇸',
    TSLA: '🇺🇸', META: '🇺🇸', NVDA: '🇺🇸', NFLX: '🇺🇸',
    XAUUSD: '🥇', XAGUSD: '🥈', WTIUSD: '🛢️', BRENT: '🛢️', NATGAS: '⛽',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'hsl(260 87% 3%)' }}>
      <style>{`
        @media (max-width: 767px) {
          .trade-body   { flex-direction: column !important; overflow: visible !important; }
          .trade-chart  { min-height: 300px !important; height: 300px !important; border-right: none !important; border-bottom: 1px solid rgba(255,255,255,0.07) !important; }
          .trade-panel  { width: 100% !important; max-height: none !important; }
          .trade-header-stats { display: none !important; }
          .trade-header-row { flex-direction: column !important; align-items: flex-start !important; gap: 10px !important; padding: 12px 14px !important; }
          .trade-coin-row { flex-wrap: wrap !important; gap: 10px !important; }
          .trade-stats-inline { display: flex !important; gap: 8px !important; flex-wrap: wrap !important; }
        }
      `}</style>

      {/* ── Top Header Bar ── */}
      <div className="trade-header-row" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
        background: 'hsl(260 87% 4%)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        flexShrink: 0, flexWrap: 'wrap', gap: 10,
      }}>
        {/* Left: back + coin info + price */}
        <div className="trade-coin-row" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/dashboard/trade')}
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8, padding: '6px 10px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
              color: 'hsl(240 5% 60%)', fontSize: 12, flexShrink: 0,
            }}
          >
            <ArrowLeft size={14} />
            Back
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CoinIcon symbol={sym} color={meta.color} size={36} />
            <div>
              <p style={{ fontSize: 16, fontWeight: 800, color: 'hsl(40 10% 96%)', lineHeight: 1.1 }}>{sym}</p>
              <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)', lineHeight: 1 }}>{meta.pair}</p>
            </div>
          </div>

          {/* Live price */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 19, fontWeight: 800, color: 'hsl(40 6% 95%)', letterSpacing: '-0.02em' }}>
              {price > 0 ? `$${fmtPrice(price)}` : '—'}
            </span>
            {ticker && (
              <span style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 12, fontWeight: 700, padding: '3px 8px', borderRadius: 7,
                color: up ? '#a78bfa' : '#f87171',
                background: up ? 'rgba(167,139,250,0.1)' : 'rgba(248,113,113,0.1)',
              }}>
                {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {up ? '+' : ''}{change.toFixed(2)}%
              </span>
            )}
          </div>

          {/* Inline stats for mobile — hidden on desktop via trade-stats-inline, hidden on mobile via trade-header-stats */}
          <div className="trade-stats-inline" style={{ display: 'none' }}>
            {[
              { label: '24h High', value: high > 0 ? `$${fmtPrice(high)}` : '—' },
              { label: '24h Low',  value: low  > 0 ? `$${fmtPrice(low)}`  : '—' },
              { label: 'Volume',   value: vol  > 0 ? fmtVolume(vol)        : '—' },
            ].map(s => (
              <div key={s.label} style={{
                padding: '5px 10px', borderRadius: 8,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}>
                <p style={{ fontSize: 9, color: 'hsl(240 5% 50%)', marginBottom: 1 }}>{s.label}</p>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'hsl(40 6% 92%)' }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: 24h stats — desktop only */}
        <div className="trade-header-stats" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: '24h High',   value: high > 0 ? `$${fmtPrice(high)}` : '—' },
            { label: '24h Low',    value: low  > 0 ? `$${fmtPrice(low)}`  : '—' },
            { label: '24h Volume', value: vol  > 0 ? fmtVolume(vol)        : '—' },
          ].map(stat => (
            <div key={stat.label} style={{
              padding: '8px 14px', borderRadius: 10,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              textAlign: 'center', minWidth: 100,
            }}>
              <p style={{ fontSize: 10, color: 'hsl(240 5% 50%)', fontWeight: 500, letterSpacing: '0.04em', marginBottom: 3 }}>
                {stat.label}
              </p>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'hsl(40 6% 92%)' }}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main Body ── */}
      <div className="trade-body" style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* ── Chart Panel ── */}
        <div className="trade-chart" style={{
          flex: 1, position: 'relative', minWidth: 0,
          borderRight: '1px solid rgba(255,255,255,0.07)',
          background: '#131722', minHeight: 480,
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Chart toolbar — chart mode (left) + currency pair (middle) */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px',
            background: 'hsl(260 87% 4%)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            flexShrink: 0,
          }}>
            {/* Chart Mode dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => { setModeOpen(v => !v); setPairOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 12px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'hsl(40 6% 90%)', fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', letterSpacing: '0.04em', minWidth: 120, justifyContent: 'space-between',
                }}
              >
                {chartMode}
                <ChevronDown size={12} style={{ opacity: 0.6 }} />
              </button>
              {modeOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 50,
                  background: 'hsl(260 60% 6%)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10, padding: 4, minWidth: 140,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }}>
                  {CHART_MODES.map(m => (
                    <button
                      key={m}
                      onClick={() => { setChartMode(m); setModeOpen(false) }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                        padding: '8px 10px', borderRadius: 7, cursor: 'pointer',
                        background: m === chartMode ? 'rgba(167,139,250,0.15)' : 'transparent',
                        border: 'none', color: m === chartMode ? '#c4b5fd' : 'hsl(40 6% 85%)',
                        fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', textAlign: 'left',
                      }}
                      onMouseEnter={e => { if (m !== chartMode) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                      onMouseLeave={e => { if (m !== chartMode) e.currentTarget.style.background = 'transparent' }}
                    >
                      {m === chartMode && <CheckCircle2 size={12} style={{ color: '#a78bfa', flexShrink: 0 }} />}
                      <span style={{ marginLeft: m === chartMode ? 0 : 20 }}>{m}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Currency Pair dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => { setPairOpen(v => !v); setModeOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 12px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'hsl(40 6% 90%)', fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', letterSpacing: '0.02em',
                }}
              >
                <CoinIcon symbol={sym} color={meta.color} size={22} />
                {sym.replace('USDT', 'USD')}
                <ChevronDown size={12} style={{ opacity: 0.6 }} />
              </button>
              {pairOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 50,
                  background: 'hsl(260 60% 6%)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10, padding: 4, minWidth: 200, maxHeight: 360, overflowY: 'auto',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }}>
                  {PAIR_LIST.map(ps => {
                    const info = PAIR_META[ps]
                    const active = ps === sym
                    return (
                      <button
                        key={ps}
                        onClick={() => { setPairOpen(false); navigate(`/dashboard/trade/${ps}`) }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                          padding: '7px 10px', borderRadius: 7, cursor: 'pointer',
                          background: active ? 'rgba(167,139,250,0.15)' : 'transparent',
                          border: 'none', color: active ? '#c4b5fd' : 'hsl(40 6% 85%)',
                          fontSize: 12, fontWeight: 600, textAlign: 'left',
                        }}
                        onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                        onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                      >
                        <CoinIcon symbol={ps} color={info.color} size={20} />
                        <span style={{ flex: 1 }}>{info.pair}</span>
                        <span style={{ fontSize: 10, color: 'hsl(240 5% 50%)' }}>{info.name}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Iframe itself — keyed on mode+sym to force full reload on change */}
          <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
            <iframe
              key={`${chartMode}-${sym}`}
              ref={iframeRef}
              src={tvUrl}
              title={`TradingView Chart — ${sym}`}
              style={{ width: '100%', height: '100%', border: 'none', display: 'block', position: 'absolute', inset: 0 }}
              allowFullScreen
            />
          </div>
        </div>

        {/* ── Manual Trading Panel ── */}
        <div className="trade-panel" style={{
          width: 340, flexShrink: 0, overflowY: 'auto',
          background: 'hsl(260 87% 4%)',
          padding: '24px 20px',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.08) transparent',
        }}>

          {/* Panel header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #6d28d9, #6d28d9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <TrendingUp size={18} style={{ color: '#fff' }} />
            </div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'hsl(40 10% 95%)' }}>Manual Trading</h2>
          </div>

          {/* Success toast */}
          {placed && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)',
              borderRadius: 10, padding: '12px 14px', marginBottom: 16,
              animation: 'fadeIn 0.3s ease',
            }}>
              <CheckCircle2 size={16} style={{ color: '#a78bfa', flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: '#a78bfa', fontWeight: 500 }}>
                {tradeType} trade placed on {sym}!
              </p>
            </div>
          )}

          {/* ── Trade Type ── */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 12, color: 'hsl(240 5% 55%)', fontWeight: 500, marginBottom: 8 }}>
              Trade Type
            </p>
            <div style={{ display: 'flex', gap: 0, borderRadius: 10, overflow: 'hidden' }}>
              <button
                onClick={() => setTradeType('CALL')}
                style={{
                  flex: 1, height: 44, border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  fontSize: 14, fontWeight: 700, transition: 'all 0.15s',
                  background: tradeType === 'CALL'
                    ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
                    : 'rgba(255,255,255,0.05)',
                  color: tradeType === 'CALL' ? '#fff' : 'hsl(240 5% 50%)',
                  borderRight: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <TrendingUp size={15} />
                CALL
              </button>
              <button
                onClick={() => setTradeType('PUT')}
                style={{
                  flex: 1, height: 44, border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  fontSize: 14, fontWeight: 700, transition: 'all 0.15s',
                  background: tradeType === 'PUT'
                    ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                    : 'rgba(255,255,255,0.05)',
                  color: tradeType === 'PUT' ? '#fff' : 'hsl(240 5% 50%)',
                }}
              >
                <TrendingDown size={15} />
                PUT
              </button>
            </div>
          </div>

          {/* ── Wallet ── */}
          <div style={{ marginBottom: 20 }}>
            <p style={{
              fontSize: 12, color: 'hsl(240 5% 55%)', fontWeight: 500, marginBottom: 8,
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <Wallet size={12} /> Wallet
            </p>
            <div style={{
              height: 44, paddingLeft: 14, paddingRight: 14, borderRadius: 10,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.09)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 13, color: 'hsl(240 5% 55%)' }}>Main Account</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'hsl(40 6% 92%)', fontFamily: 'ui-monospace, monospace' }}>
                ${effectiveBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* ── Amount ── */}
          <div style={{ marginBottom: 20 }}>
            <p style={{
              fontSize: 12, color: 'hsl(240 5% 55%)', fontWeight: 500, marginBottom: 8,
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <DollarSign size={12} /> Amount (USD)
            </p>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
                color: 'hsl(240 5% 45%)', fontSize: 14, fontWeight: 600, pointerEvents: 'none',
              }}>$</span>
              <input
                type="number"
                min="1"
                step="1"
                placeholder="0.00"
                value={amount}
                onChange={e => { setAmount(e.target.value); setError('') }}
                style={{
                  width: '100%', height: 44, paddingLeft: 26, paddingRight: 14,
                  borderRadius: 10, fontSize: 15, fontWeight: 600,
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${error ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.09)'}`,
                  color: 'hsl(40 6% 90%)', outline: 'none',
                }}
              />
            </div>
            {/* Quick-select amounts */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {QUICK_AMOUNTS.map(a => (
                <button
                  key={a}
                  onClick={() => { setAmount(String(a)); setError('') }}
                  style={{
                    padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', border: '1px solid rgba(255,255,255,0.09)',
                    background: amount === String(a) ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.04)',
                    color: amount === String(a) ? '#c4b5fd' : 'hsl(240 5% 55%)',
                    transition: 'all 0.12s',
                  }}
                >
                  ${a}
                </button>
              ))}
            </div>
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
                <AlertCircle size={12} style={{ color: '#f87171' }} />
                <p style={{ fontSize: 12, color: '#f87171' }}>{error}</p>
              </div>
            )}
          </div>

          {/* ── Duration ── */}
          <div style={{ marginBottom: 28 }}>
            <p style={{
              fontSize: 12, color: 'hsl(240 5% 55%)', fontWeight: 500, marginBottom: 8,
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <Clock size={12} /> Duration
            </p>
            <div style={{ position: 'relative' }}>
              <select
                value={duration}
                onChange={e => setDuration(e.target.value)}
                style={{
                  width: '100%', height: 44, paddingLeft: 14, paddingRight: 36, borderRadius: 10,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  color: 'hsl(40 6% 85%)', fontSize: 13, cursor: 'pointer', outline: 'none',
                  appearance: 'none',
                }}
              >
                {DURATIONS.map(d => (
                  <option key={d} value={d} style={{ background: 'hsl(260 87% 6%)' }}>{d}</option>
                ))}
              </select>
              <ChevronDown size={14} style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                color: 'hsl(240 5% 45%)', pointerEvents: 'none',
              }} />
            </div>
          </div>

          {/* Trade summary */}
          {amount && parseFloat(amount) > 0 && (
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 10, padding: '12px 14px', marginBottom: 16,
            }}>
              <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)', fontWeight: 500, marginBottom: 8, letterSpacing: '0.04em' }}>
                TRADE SUMMARY
              </p>
              {[
                { label: 'Asset',     value: sym },
                { label: 'Direction', value: tradeType, color: tradeType === 'CALL' ? '#a78bfa' : '#f87171' },
                { label: 'Amount',    value: `$${parseFloat(amount).toFixed(2)}` },
                { label: 'Duration',  value: duration },
                { label: 'Potential Payout', value: `$${(parseFloat(amount) * 1.85).toFixed(2)}`, color: '#a78bfa' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: 'hsl(240 5% 50%)' }}>{row.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: row.color ?? 'hsl(40 6% 85%)' }}>{row.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── Place Trade CTA ── */}
          <button
            onClick={handlePlace}
            disabled={placing}
            style={{
              width: '100%', height: 50, borderRadius: 12, border: 'none',
              cursor: placing ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              fontSize: 15, fontWeight: 700, transition: 'all 0.2s',
              background: placing
                ? 'rgba(255,255,255,0.06)'
                : tradeType === 'CALL'
                  ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                  : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: placing ? 'hsl(240 5% 45%)' : '#fff',
              boxShadow: placing ? 'none'
                : tradeType === 'CALL'
                  ? '0 4px 20px rgba(139,92,246,0.3)'
                  : '0 4px 20px rgba(239,68,68,0.3)',
            }}
          >
            {placing ? (
              <>
                <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                Placing Trade…
              </>
            ) : (
              <>
                {tradeType === 'CALL' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                Place {tradeType} Trade
              </>
            )}
          </button>

          {/* Disclaimer */}
          <p style={{ fontSize: 10, color: 'hsl(240 5% 38%)', lineHeight: 1.6, marginTop: 16, textAlign: 'center' }}>
            Trading involves risk. Only invest what you can afford to lose.
            This is a simulated trading interface.
          </p>

          {/* ── Open Trades on this symbol ── */}
          <div style={{ marginTop: 24 }}>
            <p style={{ fontSize: 11, color: 'hsl(240 5% 55%)', fontWeight: 600, letterSpacing: '0.06em', marginBottom: 10 }}>
              OPEN TRADES ({symOpenTrades.length})
            </p>
            {symOpenTrades.length === 0 ? (
              <div style={{
                padding: '20px', borderRadius: 10, textAlign: 'center',
                background: 'rgba(255,255,255,0.02)',
                border: '1px dashed rgba(255,255,255,0.08)',
                color: 'hsl(240 5% 45%)', fontSize: 11, letterSpacing: '0.05em',
              }}>
                NO OPEN TRADES
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {symOpenTrades.map(t => (
                  <OpenTradeRow key={t.id} trade={t} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom Navigation ── */}
      <div style={{
        display: 'flex', alignItems: 'stretch', justifyContent: 'space-around',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        background: 'hsl(260 87% 4%)',
        padding: '8px 4px 10px',
        flexShrink: 0,
      }}>
        {[
          { label: 'Assets',        icon: Briefcase,         path: '/dashboard/assets' },
          { label: 'Trade',         icon: CandlestickChart,  path: '/dashboard/trade',       active: true },
          { label: 'Closed Trades', icon: FileClock,         path: '/dashboard/closed-trades' },
          { label: 'Star',          icon: Star,              path: '/dashboard/markets?tab=Favourites' },
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
              onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'hsl(40 6% 85%)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'hsl(240 5% 55%)' }}
            >
              <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.02em' }}>{item.label}</span>
            </button>
          )
        })}
      </div>

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg) } }
        @keyframes fadeIn  { from { opacity:0; transform:translateY(-4px) } to { opacity:1; transform:none } }
        @keyframes liveBlink { 0%,100%{opacity:1;box-shadow:0 0 6px #a78bfa} 50%{opacity:0.2;box-shadow:none} }
      `}</style>
    </div>
  )
}

// ─── Open Trade row — shows countdown + stake + direction ─────────────────
function OpenTradeRow({ trade }: { trade: import('@/hooks/useTrades').Trade }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const remaining = Math.max(0, Math.floor((trade.expiresAt - now) / 1000))
  const mins = Math.floor(remaining / 60).toString().padStart(2, '0')
  const secs = (remaining % 60).toString().padStart(2, '0')
  const isCall = trade.direction === 'CALL'
  const color  = isCall ? '#a78bfa' : '#f87171'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 12px', borderRadius: 10,
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${color}33`,
    }}>
      <span style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
        width: 32, height: 32, borderRadius: 8,
        background: `${color}1a`, color,
      }}>
        {isCall ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: 'hsl(40 6% 92%)' }}>
          ${trade.amount.toFixed(2)} · {trade.direction}
        </p>
        <p style={{ fontSize: 10, color: 'hsl(240 5% 55%)' }}>
          {trade.durationLabel}
        </p>
      </div>
      <div style={{
        fontSize: 14, fontWeight: 800, fontFamily: 'ui-monospace, monospace',
        color: remaining < 5 ? '#f87171' : 'hsl(40 6% 90%)',
        letterSpacing: '0.02em',
      }}>
        {mins}:{secs}
      </div>
    </div>
  )
}
