/**
 * Holding — portfolio value + wallet balances.
 * Matches the IQCrest layout: big portfolio-value card on the left, list of
 * holdings (USD + any staked/held crypto) on the right.
 */
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { WalletBottomNav } from '@/components/ui/WalletBottomNav'

function fmtUSD(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function Holding() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const usdBalance = user?.balance ?? 0
  const portfolioValue = usdBalance // expand with crypto holdings later

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', minHeight: '100vh',
      background: 'hsl(260 87% 3%)', color: 'hsl(40 6% 90%)',
    }}>
      <div style={{ flex: 1, padding: '24px 20px', maxWidth: 1280, width: '100%', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16, marginBottom: 20 }}>

          {/* ── Portfolio Value Card ── */}
          <div style={{
            position: 'relative', overflow: 'hidden',
            borderRadius: 18, padding: '48px 24px', minHeight: 240,
            background: 'linear-gradient(135deg, hsl(240 60% 8%) 0%, hsl(260 80% 10%) 100%)',
            border: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            {/* Decorative candlestick background */}
            <svg
              width="100%" height="100%"
              viewBox="0 0 400 240" preserveAspectRatio="none"
              style={{ position: 'absolute', inset: 0, opacity: 0.18, pointerEvents: 'none' }}
            >
              {Array.from({ length: 22 }).map((_, i) => {
                const x = 10 + i * 18
                const isGreen = Math.random() > 0.4
                const h = 20 + Math.random() * 90
                const y = 60 + Math.random() * 60
                return (
                  <g key={i}>
                    <line x1={x + 4} x2={x + 4} y1={y - 15} y2={y + h + 15}
                      stroke={isGreen ? '#22c55e' : '#ef4444'} strokeWidth="1" />
                    <rect x={x} y={y} width={9} height={h} fill={isGreen ? '#22c55e' : '#ef4444'} />
                  </g>
                )
              })}
            </svg>

            {/* Value */}
            <p style={{ fontSize: 48, fontWeight: 800, color: 'hsl(40 6% 98%)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 6 }}>
              {fmtUSD(portfolioValue)}
            </p>
            <p style={{ fontSize: 13, color: 'hsl(240 5% 60%)', fontWeight: 500, letterSpacing: '0.02em' }}>
              portfolio value
            </p>
          </div>

          {/* ── Balances List ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* USD Holding */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'auto 1fr auto',
              alignItems: 'center', gap: 16,
              padding: '16px 18px', borderRadius: 14,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 10,
                background: 'linear-gradient(135deg, #dc2626, #1d4ed8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26, flexShrink: 0,
              }}>
                🇺🇸
              </div>
              <div>
                <p style={{ fontSize: 18, fontWeight: 700, color: 'hsl(40 6% 95%)' }}>{fmtUSD(usdBalance)}</p>
                <p style={{ fontSize: 12, color: 'hsl(240 5% 55%)' }}>Holding Balance</p>
              </div>
              <button
                onClick={() => navigate('/dashboard/deposit')}
                style={{
                  padding: '10px 20px', borderRadius: 10,
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  color: '#fff', border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 700, letterSpacing: '0.06em',
                }}
              >
                DEPOSIT
              </button>
            </div>

            {/* Empty state */}
            <div style={{
              padding: '24px 20px', borderRadius: 14, textAlign: 'center',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <p style={{ fontSize: 13, color: 'hsl(240 5% 60%)', letterSpacing: '0.03em' }}>
                YOU ARE NOT CURRENTLY HOLDING ANY ASSETS, CLICK{' '}
                <Link
                  to="/dashboard/assets"
                  style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: 700 }}
                >
                  HERE
                </Link>
                {' '}TO BUY ASSETS
              </p>
            </div>
          </div>
        </div>
      </div>

      <WalletBottomNav />
    </div>
  )
}
