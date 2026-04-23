import { useState, useEffect, useCallback } from 'react'
import { Check, Shield, Zap, Crown, Loader2, TrendingUp as TrendingUpIcon } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Plan {
  id:         string
  name:       string
  badge:      string | null
  roi:        number
  roiPeriod:  string
  duration:   string
  minDeposit: number
  maxDeposit: number | null
  features:   string[]
  isActive:   boolean
  sortOrder:  number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0 })
}

function TrendingUpSvg(props: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg width={props.size || 16} height={props.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  )
}

// Map plan name → icon + color (falls back gracefully for custom plans)
function planVisuals(name: string, badge: string | null) {
  const n = name.toLowerCase()
  if (n.includes('elite') || badge === 'Elite')
    return { Icon: Crown,          iconColor: '#f59e0b', iconBg: 'rgba(245,158,11,0.12)' }
  if (n.includes('pro') || badge === 'Pro')
    return { Icon: Zap,            iconColor: '#a78bfa', iconBg: 'rgba(167,139,250,0.12)' }
  if (n.includes('growth') || n.includes('popular') || badge === 'Popular')
    return { Icon: TrendingUpSvg,  iconColor: '#a78bfa', iconBg: 'rgba(167,139,250,0.12)' }
  return   { Icon: Shield,         iconColor: '#60a5fa', iconBg: 'rgba(96,165,250,0.12)' }
}

function planCtaStyle(badge: string | null) {
  if (badge === 'Popular')
    return { background: 'linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)', border: 'none', color: '#050505', fontWeight: 600, boxShadow: '0 4px 20px rgba(167,139,250,0.2)' }
  if (badge === 'Elite')
    return { background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#fcd34d' }
  if (badge === 'Pro')
    return { background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)', color: '#c4b5fd' }
  return { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'hsl(40 6% 88%)' }
}

const BADGE_STYLES: Record<string, { bg: string; color: string }> = {
  Popular: { bg: 'rgba(167,139,250,0.15)',  color: '#a78bfa' },
  Pro:     { bg: 'rgba(167,139,250,0.12)',  color: '#c4b5fd' },
  Elite:   { bg: 'rgba(245,158,11,0.15)', color: '#fcd34d' },
}

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.875rem', ...style }}>{children}</div>
}

// ─── Component ───────────────────────────────────────────────────────────────

export function InvestmentPlans() {
  const { user } = useAuth()
  const [plans,   setPlans]   = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPlans = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get<{ success: boolean; data: Plan[] }>('/user/plans')
      setPlans(res.data)
    } catch {
      // silently keep empty — show "no plans" state
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPlans() }, [fetchPlans])

  // Max ROI for the progress bar scale
  const maxRoi = plans.length > 0 ? Math.max(...plans.map(p => p.roi)) : 100

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div className="mb-6">
        <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'hsl(40 6% 95%)', marginBottom: 3 }}>Investment Plans</h1>
        <p style={{ fontSize: 13, color: 'hsl(240 5% 55%)' }}>Choose a plan that matches your investment goals. All plans include capital protection.</p>
      </div>

      {/* Active plan banner */}
      <Card style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', background: 'hsl(260 40% 7%)', border: '1px solid rgba(167,139,250,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div className="flex items-center gap-3">
          <TrendingUpIcon size={18} style={{ color: '#a78bfa' }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'hsl(40 6% 92%)' }}>
              {user?.kycStatus === 'APPROVED'
                ? 'Select a plan below to start investing'
                : 'No active plan — verify your identity to start investing'}
            </p>
            <p style={{ fontSize: 12, color: 'hsl(240 5% 50%)' }}>
              {user?.kycStatus === 'APPROVED'
                ? 'Your account is verified and ready to invest'
                : 'Complete KYC verification to unlock all investment plans'}
            </p>
          </div>
        </div>
        {user?.kycStatus !== 'APPROVED' && (
          <button style={{ padding: '0.45rem 1rem', borderRadius: '0.6rem', background: 'linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)', color: '#050505', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', flexShrink: 0 }}>
            Verify Now
          </button>
        )}
      </Card>

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
          <Loader2 size={28} style={{ color: 'hsl(240 5% 40%)', animation: 'spin 1s linear infinite' }} />
        </div>
      )}

      {/* No plans */}
      {!loading && plans.length === 0 && (
        <Card style={{ padding: '3rem', textAlign: 'center' }}>
          <TrendingUpIcon size={28} style={{ color: 'hsl(240 5% 45%)', margin: '0 auto 0.75rem' }} />
          <p style={{ fontSize: 14, fontWeight: 500, color: 'hsl(40 6% 75%)', marginBottom: 4 }}>No investment plans available</p>
          <p style={{ fontSize: 12, color: 'hsl(240 5% 50%)' }}>Check back later or contact support.</p>
        </Card>
      )}

      {!loading && plans.length > 0 && (
        <>
          {/* ROI comparison bars */}
          <Card style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'hsl(40 6% 88%)', marginBottom: '1.25rem' }}>
              {plans[0]?.roiPeriod === 'daily' ? 'Daily' : plans[0]?.roiPeriod === 'weekly' ? 'Weekly' : 'Monthly'} ROI Comparison
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {plans.map(p => {
                const { iconColor } = planVisuals(p.name, p.badge)
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 12, color: 'hsl(240 5% 60%)', width: 88, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                    <div style={{ flex: 1, height: 10, borderRadius: 999, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(p.roi / maxRoi) * 100}%`, borderRadius: 999, background: `linear-gradient(90deg, ${iconColor}88, ${iconColor})`, transition: 'width 0.6s ease' }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: iconColor, width: 44, textAlign: 'right', flexShrink: 0 }}>{p.roi}%</span>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Plan cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map(plan => {
              const { Icon, iconColor, iconBg } = planVisuals(plan.name, plan.badge)
              const ctaStyle = planCtaStyle(plan.badge)
              const bs = plan.badge ? (BADGE_STYLES[plan.badge] ?? { bg: 'rgba(255,255,255,0.1)', color: 'hsl(40 6% 80%)' }) : null
              const isPopular = plan.badge === 'Popular'

              return (
                <div key={plan.id} style={{
                  background: 'hsl(260 60% 5%)',
                  border: isPopular ? '1px solid rgba(167,139,250,0.25)' : '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '0.875rem', padding: '1.5rem',
                  display: 'flex', flexDirection: 'column', gap: 0,
                  position: 'relative', overflow: 'hidden',
                }}>
                  {/* Popular top line */}
                  {isPopular && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #a78bfa, #22d3ee)' }} />
                  )}

                  {/* Badge */}
                  {bs && (
                    <span style={{ position: 'absolute', top: 12, right: 12, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: bs.bg, color: bs.color }}>
                      {plan.badge}
                    </span>
                  )}

                  {/* Icon + name */}
                  <div className="flex items-center gap-2.5 mb-4">
                    <div style={{ width: 36, height: 36, borderRadius: '0.6rem', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={16} style={{ color: iconColor }} />
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: 'hsl(40 6% 92%)' }}>{plan.name}</p>
                  </div>

                  {/* ROI */}
                  <p style={{ fontSize: '2.25rem', fontWeight: 800, color: 'hsl(40 6% 95%)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 4 }}>
                    {plan.roi}%
                  </p>
                  <p style={{ fontSize: 12, color: 'hsl(240 5% 50%)', marginBottom: '1.25rem' }}>
                    {plan.roiPeriod} returns · {plan.duration}
                  </p>

                  {/* Deposit range */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.625rem 0.75rem', background: 'rgba(255,255,255,0.04)', borderRadius: '0.5rem', marginBottom: '1.25rem' }}>
                    <div>
                      <p style={{ fontSize: 10, color: 'hsl(240 5% 50%)', marginBottom: 1 }}>Min Deposit</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'hsl(40 6% 88%)' }}>{fmt(plan.minDeposit)}</p>
                    </div>
                    <div style={{ width: 1, background: 'rgba(255,255,255,0.07)' }} />
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 10, color: 'hsl(240 5% 50%)', marginBottom: 1 }}>Max Deposit</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'hsl(40 6% 88%)' }}>
                        {plan.maxDeposit != null ? fmt(plan.maxDeposit) : 'Unlimited'}
                      </p>
                    </div>
                  </div>

                  {/* Features */}
                  <ul style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    {plan.features.map((f, fi) => (
                      <li key={fi} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: 12, color: 'hsl(240 5% 65%)' }}>
                        <Check size={12} style={{ color: iconColor, marginTop: 1, flexShrink: 0 }} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '0.625rem', fontSize: 13, cursor: 'pointer', transition: 'opacity 0.15s', ...ctaStyle }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    {plan.badge === 'Elite' ? 'Contact Us' : 'Start Investing'}
                  </button>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
