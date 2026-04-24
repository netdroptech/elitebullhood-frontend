/**
 * CryptoLogo — round crypto logo with graceful fallback.
 *
 * Pulls the color SVG from atomiclabs/cryptocurrency-icons via jsDelivr CDN
 * (1000+ coins, MIT-licensed). If the fetch errors, falls back to initials on
 * a tinted circle so nothing looks broken.
 *
 * Usage:
 *   <CryptoLogo symbol="BTC/USDT" size={30} />
 *   <CryptoLogo symbol="ETH" size={24} fallbackColor="#60a5fa" />
 */
import { useState } from 'react'

interface Props {
  symbol: string              // "BTC", "BTC/USDT", "bitcoin" all accepted
  size?: number               // outer circle diameter in px; default 30
  fallbackColor?: string      // tint used when logo fails to load
  style?: React.CSSProperties // extra wrapper style
}

function baseTicker(symbol: string): string {
  const s = symbol.split('/')[0].split('-')[0].trim()
  return s.toLowerCase()
}

export function CryptoLogo({ symbol, size = 30, fallbackColor = '#a78bfa', style }: Props) {
  const [failed, setFailed] = useState(false)
  const base = baseTicker(symbol)
  const src  = `https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@master/svg/color/${base}.svg`
  const inner = Math.round(size * 0.75)

  const wrapper: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
    background: failed ? `${fallbackColor}22` : 'rgba(255,255,255,0.04)',
    border: failed ? `1px solid ${fallbackColor}44` : '1px solid rgba(255,255,255,0.08)',
    color: failed ? fallbackColor : undefined,
    fontSize: Math.max(8, Math.round(size * 0.3)),
    fontWeight: 800,
    letterSpacing: 0,
    ...style,
  }

  if (failed) {
    return <div style={wrapper}>{base.slice(0, 3).toUpperCase()}</div>
  }

  return (
    <div style={wrapper}>
      <img
        src={src}
        alt={symbol}
        width={inner}
        height={inner}
        loading="lazy"
        onError={() => setFailed(true)}
        style={{ display: 'block' }}
      />
    </div>
  )
}
