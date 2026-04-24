/**
 * AssetLogo — unified logo renderer for any tradeable asset.
 * Crypto → CryptoLogo.  Everything else → flag / emoji tile.
 */
import { CryptoLogo } from './CryptoLogo'

interface Props {
  symbol:    string             // "BTCUSDT", "EURUSD", "AAPL", "XAUUSD"
  category?: 'crypto' | 'forex' | 'stock' | 'commodity'
  flagEmoji?: string
  size?:     number
}

const FALLBACK_FLAGS: Record<string, string> = {
  // Forex
  EURUSD: '🇪🇺', GBPUSD: '🇬🇧', USDJPY: '🇯🇵', AUDUSD: '🇦🇺',
  USDCAD: '🇨🇦', USDCHF: '🇨🇭', NZDUSD: '🇳🇿', EURGBP: '🇪🇺',
  EURJPY: '🇪🇺', GBPJPY: '🇬🇧', AUDJPY: '🇦🇺', AUDCAD: '🇦🇺',
  AUDCHF: '🇦🇺', AUDNZD: '🇦🇺',
  // Stocks (all US)
  AAPL: '🇺🇸', MSFT: '🇺🇸', GOOGL: '🇺🇸', AMZN: '🇺🇸',
  TSLA: '🇺🇸', META: '🇺🇸', NVDA: '🇺🇸', NFLX: '🇺🇸',
  // Commodities
  XAUUSD: '🥇', XAGUSD: '🥈', WTIUSD: '🛢️', BRENT: '🛢️', NATGAS: '⛽',
}

function inferCategory(symbol: string): 'crypto' | 'forex' | 'stock' | 'commodity' {
  const s = symbol.toUpperCase()
  if (s.endsWith('USDT') || s.endsWith('BTC') || s.endsWith('ETH')) return 'crypto'
  if (FALLBACK_FLAGS[s]) {
    if (['XAUUSD', 'XAGUSD', 'WTIUSD', 'BRENT', 'NATGAS'].includes(s)) return 'commodity'
    if (['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX'].includes(s)) return 'stock'
    return 'forex'
  }
  return 'crypto'
}

export function AssetLogo({ symbol, category, flagEmoji, size = 44 }: Props) {
  const cat = category ?? inferCategory(symbol)
  if (cat === 'crypto') {
    return <CryptoLogo symbol={symbol} size={size} />
  }
  const emoji = flagEmoji ?? FALLBACK_FLAGS[symbol.toUpperCase()] ?? '•'
  return (
    <div style={{
      width: size, height: size, borderRadius: Math.round(size * 0.2),
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.55), flexShrink: 0,
    }}>
      {emoji}
    </div>
  )
}
