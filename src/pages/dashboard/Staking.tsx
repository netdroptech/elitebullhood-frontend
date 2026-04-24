/**
 * Staking — per-coin staking dashboard.
 * Left: staking balance card + Deposit / Plans buttons.
 * Right: list of stakeable coins with STAKED and EARNED columns.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CryptoLogo } from '@/components/ui/CryptoLogo'
import { WalletBottomNav } from '@/components/ui/WalletBottomNav'

interface Stakeable {
  code: string
  name: string
  staked: number    // USD value
  stakedCoin: number
  earned: number    // USD value
  earnedCoin: number
  apr: number       // percent
}

const STAKEABLES: Stakeable[] = [
  { code: 'ADA',   name: 'Cardano',   staked: 0, stakedCoin: 0, earned: 0, earnedCoin: 0, apr: 3.2 },
  { code: 'ATOM',  name: 'Cosmos',    staked: 0, stakedCoin: 0, earned: 0, earnedCoin: 0, apr: 18.5 },
  { code: 'AVAX',  name: 'Avalanche', staked: 0, stakedCoin: 0, earned: 0, earnedCoin: 0, apr: 7.8 },
  { code: 'DOT',   name: 'Polkadot',  staked: 0, stakedCoin: 0, earned: 0, earnedCoin: 0, apr: 13.2 },
  { code: 'ETH',   name: 'Ethereum',  staked: 0, stakedCoin: 0, earned: 0, earnedCoin: 0, apr: 3.8 },
  { code: 'MATIC', name: 'Polygon',   staked: 0, stakedCoin: 0, earned: 0, earnedCoin: 0, apr: 4.5 },
  { code: 'NEAR',  name: 'NEAR',      staked: 0, stakedCoin: 0, earned: 0, earnedCoin: 0, apr: 10.2 },
  { code: 'SOL',   name: 'Solana',    staked: 0, stakedCoin: 0, earned: 0, earnedCoin: 0, apr: 6.9 },
]

function fmtUSD(n: number) { return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }

export function Staking() {
  const navigate = useNavigate()
  const [activeCoin, setActiveCoin] = useState<string | null>('ETH')
  const [showPlans, setShowPlans]   = useState(false)
  const stakingBalance = 0

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', minHeight: '100vh',
      background: 'hsl(260 87% 3%)', color: 'hsl(40 6% 90%)',
    }}>
      <div style={{ flex: 1, padding: '24px 20px', maxWidth: 1280, width: '100%', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>

          {/* ── Left: balance + action buttons ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Balance card */}
            <div style={{
              borderRadius: 18, padding: '48px 24px', minHeight: 180,
              background: 'linear-gradient(135deg, hsl(240 60% 8%) 0%, hsl(280 80% 12%) 60%, hsl(320 60% 10%) 100%)',
              border: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
              <p style={{ fontSize: 44, fontWeight: 800, color: 'hsl(40 6% 98%)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 6 }}>
                {fmtUSD(stakingBalance)}
              </p>
              <p style={{ fontSize: 11, color: 'hsl(240 5% 60%)', fontWeight: 600, letterSpacing: '0.12em' }}>
                STAKING BALANCE
              </p>
            </div>

            {/* Deposit / Plans buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button
                onClick={() => navigate('/dashboard/deposit')}
                style={{
                  padding: '18px', borderRadius: 12, cursor: 'pointer',
                  background: 'rgba(167,139,250,0.08)',
                  border: '1px solid rgba(167,139,250,0.25)',
                  color: '#a78bfa', fontSize: 13, fontWeight: 700, letterSpacing: '0.08em',
                }}
              >
                DEPOSIT
              </button>
              <button
                onClick={() => setShowPlans(v => !v)}
                style={{
                  padding: '18px', borderRadius: 12, cursor: 'pointer',
                  background: 'rgba(167,139,250,0.08)',
                  border: '1px solid rgba(167,139,250,0.25)',
                  color: '#a78bfa', fontSize: 13, fontWeight: 700, letterSpacing: '0.08em',
                }}
              >
                PLANS
              </button>
            </div>

            {/* Plans panel */}
            {showPlans && (
              <div style={{
                borderRadius: 12, padding: 16,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'hsl(40 6% 95%)', marginBottom: 12 }}>Staking Plans</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {STAKEABLES.slice(0, 5).map(s => (
                    <div key={s.code} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <CryptoLogo symbol={s.code} size={32} />
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 700, color: 'hsl(40 6% 92%)' }}>{s.name}</p>
                          <p style={{ fontSize: 11, color: 'hsl(240 5% 55%)' }}>Flexible · APR {s.apr}%</p>
                        </div>
                      </div>
                      <button style={{
                        padding: '6px 12px', borderRadius: 8,
                        background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                        color: '#fff', border: 'none', cursor: 'pointer',
                        fontSize: 11, fontWeight: 700,
                      }}>
                        Stake
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right: stakeable coins list ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {STAKEABLES.map(s => {
              const active = activeCoin === s.code
              return (
                <div
                  key={s.code}
                  onClick={() => setActiveCoin(active ? null : s.code)}
                  style={{
                    display: 'grid', gridTemplateColumns: 'auto 1fr 1fr',
                    alignItems: 'center', gap: 16,
                    padding: '14px 18px', borderRadius: 12, cursor: 'pointer',
                    background: active ? 'rgba(167,139,250,0.08)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? 'rgba(167,139,250,0.25)' : 'rgba(255,255,255,0.06)'}`,
                    transition: 'background 0.12s, border-color 0.12s',
                  }}
                >
                  <CryptoLogo symbol={s.code} size={44} />
                  <div>
                    <p style={{ fontSize: 10, color: 'hsl(240 5% 55%)', fontWeight: 600, letterSpacing: '0.08em', marginBottom: 4 }}>STAKED</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'hsl(40 6% 92%)' }}>{fmtUSD(s.staked)}</p>
                    <p style={{ fontSize: 11, color: 'hsl(240 5% 55%)', fontFamily: 'ui-monospace, monospace', marginTop: 2 }}>
                      {s.stakedCoin.toFixed(4)} {s.code}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, color: 'hsl(240 5% 55%)', fontWeight: 600, letterSpacing: '0.08em', marginBottom: 4 }}>EARNED</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#a78bfa' }}>{fmtUSD(s.earned)}</p>
                    <p style={{ fontSize: 11, color: 'hsl(240 5% 55%)', fontFamily: 'ui-monospace, monospace', marginTop: 2 }}>
                      {s.earnedCoin.toFixed(4)} {s.code}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <WalletBottomNav />
    </div>
  )
}
