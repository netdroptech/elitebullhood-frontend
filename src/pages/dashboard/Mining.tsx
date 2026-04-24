/**
 * Mining — cloud mining dashboard.
 * Mining balance + total mined summary, buy-contract CTA, a BTC chart widget,
 * and a list of mineable coins with their per-coin balance and hashrate.
 */
import { useState } from 'react'
import { CryptoLogo } from '@/components/ui/CryptoLogo'
import { WalletBottomNav } from '@/components/ui/WalletBottomNav'

interface Mineable {
  code: string
  name: string
  balance: number
  hashrate: number      // TH/s
}

const MINEABLES: Mineable[] = [
  { code: 'BTC',  name: 'Bitcoin',   balance: 0, hashrate: 0 },
  { code: 'DASH', name: 'Dash',      balance: 0, hashrate: 0 },
  { code: 'DOGE', name: 'Dogecoin',  balance: 0, hashrate: 0 },
  { code: 'LTC',  name: 'Litecoin',  balance: 0, hashrate: 0 },
  { code: 'XMR',  name: 'Monero',    balance: 0, hashrate: 0 },
  { code: 'ZEC',  name: 'Zcash',     balance: 0, hashrate: 0 },
]

const CONTRACTS = [
  { label: 'Starter',  hashrate: '10 TH/s',   price: '$99',   apr: '~0.0012 BTC / day', coin: 'BTC' },
  { label: 'Pro',      hashrate: '50 TH/s',   price: '$450',  apr: '~0.006 BTC / day',  coin: 'BTC' },
  { label: 'Whale',    hashrate: '200 TH/s',  price: '$1,600', apr: '~0.024 BTC / day', coin: 'BTC' },
]

function fmtUSD(n: number) { return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }

export function Mining() {
  const [tab, setTab] = useState<'buy' | 'mine' | null>(null)
  const miningBalance = 0
  const totalMined = 0

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', minHeight: '100vh',
      background: 'hsl(260 87% 3%)', color: 'hsl(40 6% 90%)',
    }}>
      <div style={{ flex: 1, padding: '24px 20px', maxWidth: 1280, width: '100%', margin: '0 auto' }}>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>

          {/* ── Left column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Balance card */}
            <div style={{
              borderRadius: 18, padding: '28px 24px', minHeight: 160,
              background: 'linear-gradient(135deg, hsl(240 60% 8%) 0%, hsl(280 80% 12%) 60%, hsl(320 60% 10%) 100%)',
              border: '1px solid rgba(255,255,255,0.06)',
              display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', textAlign: 'center',
            }}>
              <div>
                <p style={{ fontSize: 28, fontWeight: 800, color: 'hsl(40 6% 98%)', letterSpacing: '-0.02em' }}>{fmtUSD(miningBalance)}</p>
                <p style={{ fontSize: 11, color: 'hsl(240 5% 60%)', fontWeight: 600, letterSpacing: '0.1em', marginTop: 4 }}>MINING BALANCE</p>
              </div>
              <div>
                <p style={{ fontSize: 28, fontWeight: 800, color: 'hsl(40 6% 98%)', letterSpacing: '-0.02em' }}>{fmtUSD(totalMined)}</p>
                <p style={{ fontSize: 11, color: 'hsl(240 5% 60%)', fontWeight: 600, letterSpacing: '0.1em', marginTop: 4 }}>TOTAL MINED</p>
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button
                onClick={() => setTab('buy')}
                style={{
                  padding: '16px', borderRadius: 12, cursor: 'pointer',
                  background: 'rgba(167,139,250,0.08)',
                  border: '1px solid rgba(167,139,250,0.25)',
                  color: '#a78bfa', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em',
                }}
              >
                BUY CONTRACT
              </button>
              <button
                onClick={() => setTab('mine')}
                style={{
                  padding: '16px', borderRadius: 12, cursor: 'pointer',
                  background: 'rgba(167,139,250,0.08)',
                  border: '1px solid rgba(167,139,250,0.25)',
                  color: '#a78bfa', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em',
                }}
              >
                MY CONTRACTS
              </button>
            </div>

            {/* BTC mini chart widget */}
            <div style={{
              borderRadius: 12,
              background: 'hsl(260 60% 5%)',
              border: '1px solid rgba(255,255,255,0.08)',
              overflow: 'hidden', height: 220,
            }}>
              <iframe
                title="BTC/USD mini chart"
                src="https://s.tradingview.com/embed-widget/mini-symbol-overview/?locale=en#%7B%22symbol%22%3A%22BINANCE%3ABTCUSDT%22%2C%22width%22%3A%22100%25%22%2C%22height%22%3A%22100%25%22%2C%22locale%22%3A%22en%22%2C%22dateRange%22%3A%2212M%22%2C%22colorTheme%22%3A%22dark%22%2C%22isTransparent%22%3Afalse%2C%22autosize%22%3Atrue%2C%22largeChartUrl%22%3A%22%22%2C%22chartOnly%22%3Afalse%7D"
                style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
              />
            </div>

            {/* Modal-like inline panels for contracts / my contracts */}
            {tab === 'buy' && (
              <div style={{
                borderRadius: 12, padding: 16,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'hsl(40 6% 95%)', marginBottom: 12 }}>Available Contracts</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {CONTRACTS.map(c => (
                    <div key={c.label} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 14px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: 'hsl(40 6% 92%)' }}>{c.label}</p>
                        <p style={{ fontSize: 11, color: 'hsl(240 5% 55%)' }}>{c.hashrate} · {c.apr}</p>
                      </div>
                      <button style={{
                        padding: '7px 14px', borderRadius: 8,
                        background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                        color: '#fff', border: 'none', cursor: 'pointer',
                        fontSize: 11, fontWeight: 700,
                      }}>
                        Buy {c.price}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {tab === 'mine' && (
              <div style={{
                borderRadius: 12, padding: 24, textAlign: 'center',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: 'hsl(240 5% 55%)', fontSize: 13,
              }}>
                You don't have any active mining contracts yet.
              </div>
            )}
          </div>

          {/* ── Right column: mineable coins ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {MINEABLES.map(m => (
              <div key={m.code} style={{
                display: 'grid', gridTemplateColumns: 'auto 1fr auto',
                alignItems: 'center', gap: 16,
                padding: '14px 18px', borderRadius: 12,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <CryptoLogo symbol={m.code} size={44} />
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: 'hsl(40 6% 92%)' }}>{fmtUSD(m.balance)}</p>
                  <p style={{ fontSize: 11, color: 'hsl(240 5% 55%)', fontFamily: 'ui-monospace, monospace' }}>
                    {m.balance.toFixed(8)} {m.code}
                  </p>
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'hsl(40 6% 80%)' }}>
                  {m.hashrate} TH/s
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <WalletBottomNav />
    </div>
  )
}
