import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Wallet, TrendingUp, Download, ArrowUpRight, Gift,
  Shield, X, Link as LinkIcon, AlertCircle, RefreshCw,
  ChevronDown, CheckCircle2, Clock, XCircle, Loader2,
  WalletCards, Zap, Crown, Sparkles, ChevronRight,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserStats {
  balance:          number
  totalDeposits:    number
  totalWithdrawals: number
  totalProfit:      number
  totalBonus:       number
  tradeProgress?:   number
  signalStrength?:  number
  kycStatus:        string
}

interface Transaction {
  id:            string
  type:          'DEPOSIT' | 'WITHDRAWAL' | 'PROFIT' | 'BONUS' | 'ADJUSTMENT'
  amount:        number
  currency:      string
  status:        'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED' | 'CANCELLED'
  note?:         string
  adminNote?:    string
  network?:      string
  walletAddress?:string
  createdAt:     string
  completedAt?:  string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 30)  return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const TX_TYPE_LABEL: Record<Transaction['type'], string> = {
  DEPOSIT:    'Deposit',
  WITHDRAWAL: 'Withdrawal',
  PROFIT:     'Profit',
  BONUS:      'Bonus',
  ADJUSTMENT: 'Adjustment',
}

const TX_STATUS_COLOR: Record<Transaction['status'], string> = {
  PENDING:    '#f59e0b',
  PROCESSING: '#60a5fa',
  COMPLETED:  '#a78bfa',
  REJECTED:   '#f87171',
  CANCELLED:  'hsl(240 5% 50%)',
}

function TxStatusIcon({ status }: { status: Transaction['status'] }) {
  const color = TX_STATUS_COLOR[status]
  if (status === 'COMPLETED')  return <CheckCircle2 size={14} style={{ color }} />
  if (status === 'REJECTED' || status === 'CANCELLED') return <XCircle size={14} style={{ color }} />
  return <Clock size={14} style={{ color }} />
}

// ─── Reusable card shell ─────────────────────────────────────────────────────

function Card({ children, className = '', style = {} }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties
}) {
  return (
    <div
      className={className}
      style={{
        background: 'hsl(260 60% 5%)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '0.875rem',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ─── Small stat card ─────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, loading }: {
  label: string; value: string; sub: string; icon: React.ElementType; loading?: boolean
}) {
  return (
    <Card className="taskk-card" style={{ padding: '1.25rem 1.375rem', position: 'relative', overflow: 'hidden' }}>
      <div className="taskk-card__dots" />
      <div className="taskk-card__glow" />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div className="flex items-start justify-between mb-3">
          <div style={{
            width: 32, height: 32, borderRadius: '0.5rem',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={15} style={{ color: 'hsl(240 5% 65%)' }} />
          </div>
          <p style={{ fontSize: 13, color: 'hsl(240 5% 60%)' }}>{label}</p>
        </div>
        {loading ? (
          <div style={{ height: '2.6rem', display: 'flex', alignItems: 'center' }}>
            <Loader2 size={18} style={{ color: 'hsl(240 5% 40%)', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : (
          <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'hsl(40 6% 97%)', letterSpacing: '-0.02em', lineHeight: 1 }}>
            {value}
          </p>
        )}
        <div className="flex items-center gap-1.5 mt-2">
          <span style={{ fontSize: 11, color: 'hsl(240 5% 50%)' }}>{sub}</span>
        </div>
      </div>
    </Card>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DashboardHome() {
  const navigate  = useNavigate()
  const { user, refreshUser } = useAuth()

  const [walletBannerDismissed, setWalletBannerDismissed] = useState(false)

  // Stats
  const [stats,        setStats]        = useState<UserStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  // Transactions
  const [txList,     setTxList]     = useState<Transaction[]>([])
  const [txLoading,  setTxLoading]  = useState(true)

  // Wallet
  const [walletAddress,  setWalletAddress]  = useState<string | null>(null)
  const [walletVerified, setWalletVerified] = useState(false)
  const [walletLoading,  setWalletLoading]  = useState(true)
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [walletInput,    setWalletInput]    = useState('')
  const [walletSaving,   setWalletSaving]   = useState(false)
  const [walletSaveErr,  setWalletSaveErr]  = useState('')

  // ── Fetch stats ─────────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const res = await api.get<{ success: boolean; data: UserStats }>('/user/stats')
      setStats(res.data)
    } catch (err) {
      console.error('[fetchStats]', err)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  // ── Fetch recent transactions ────────────────────────────────────────────────
  const fetchTransactions = useCallback(async () => {
    setTxLoading(true)
    try {
      const res = await api.get<{ success: boolean; data: Transaction[] }>('/user/transactions?limit=10')
      setTxList(res.data)
    } catch (err) {
      console.error('[fetchTransactions]', err)
    } finally {
      setTxLoading(false)
    }
  }, [])

  // ── Fetch wallet status ──────────────────────────────────────────────────────
  const fetchWallet = useCallback(async () => {
    setWalletLoading(true)
    try {
      const res = await api.get<{ success: boolean; data: { address: string | null; verified: boolean } }>('/user/wallet')
      setWalletAddress(res.data.address)
      setWalletVerified(res.data.verified)
    } catch (err) {
      console.error('[fetchWallet]', err)
    } finally {
      setWalletLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
    fetchTransactions()
    fetchWallet()
    // Also refresh the auth user so header balance stays up-to-date
    refreshUser()
  }, [fetchStats, fetchTransactions, fetchWallet])

  // ── Connect wallet handler ────────────────────────────────────────────────────
  async function handleConnectWallet() {
    if (!walletInput.trim()) return
    setWalletSaving(true)
    setWalletSaveErr('')
    try {
      await api.post('/user/wallet/connect', { address: walletInput.trim() })
      setWalletAddress(walletInput.trim())
      setWalletVerified(false)
      setShowWalletModal(false)
      setWalletInput('')
    } catch (err: any) {
      setWalletSaveErr(err?.response?.data?.message ?? 'Failed to save recovery phrase.')
    } finally {
      setWalletSaving(false)
    }
  }

  // ── Derived values ──────────────────────────────────────────────────────────
  const balance  = stats?.balance          ?? 0
  const deposits = stats?.totalDeposits    ?? 0
  const withdrawals = stats?.totalWithdrawals ?? 0
  const profit   = stats?.totalProfit      ?? 0
  const bonus    = stats?.totalBonus       ?? 0
  const tradeProgress  = Math.max(0, Math.min(100, stats?.tradeProgress  ?? 0))
  const signalStrength = Math.max(0, Math.min(100, stats?.signalStrength ?? 0))
  const kycStatus = stats?.kycStatus ?? user?.kycStatus ?? 'NOT_SUBMITTED'
  const firstName = user?.firstName ?? ''
  const lastName  = user?.lastName  ?? ''
  const fullName  = [firstName, lastName].filter(Boolean).join(' ') || 'there'

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto overflow-x-hidden">
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 767px) {
          .dash-stats-grid { grid-template-columns: 1fr !important; grid-template-rows: auto !important; }
          .dash-stats-grid > *[style*="gridRow"] { grid-row: auto !important; }
        }
        /* ── Taskk-style card (dot grid + purple glow) ── */
        .taskk-card {
          background: linear-gradient(180deg, rgba(20,18,32,0.9) 0%, rgba(12,10,22,0.95) 100%) !important;
          border: 1px solid rgba(255,255,255,0.06) !important;
          border-radius: 18px !important;
        }
        .taskk-card__dots {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px);
          background-size: 14px 14px;
          -webkit-mask-image: radial-gradient(ellipse at 50% 30%, #000 20%, transparent 75%);
          mask-image: radial-gradient(ellipse at 50% 30%, #000 20%, transparent 75%);
          pointer-events: none;
          opacity: 0.55;
        }
        /* Animated glow — small stat cards */
        .taskk-card__glow {
          position: absolute;
          left: 0;
          right: 0;
          bottom: -35%;
          height: 110%;
          background: radial-gradient(ellipse 55% 50% at 50% 60%, rgba(139,92,246,0.55) 0%, rgba(139,92,246,0.20) 38%, transparent 70%);
          filter: blur(14px);
          pointer-events: none;
          transform-origin: center bottom;
          animation: taskkGlowDrift 7s ease-in-out infinite;
          will-change: transform, opacity;
        }
        /* Stronger animated glow — Account Balance (main amount) card */
        .taskk-card__glow--lg {
          background:
            radial-gradient(ellipse 48% 55% at 25% 72%, rgba(139,92,246,0.85) 0%, rgba(139,92,246,0.25) 35%, transparent 68%),
            radial-gradient(ellipse 46% 52% at 75% 78%, rgba(34,211,238,0.65) 0%, rgba(34,211,238,0.20) 36%, transparent 68%),
            radial-gradient(ellipse 42% 48% at 50% 88%, rgba(168,85,247,0.72) 0%, rgba(168,85,247,0.25) 36%, transparent 65%);
          filter: blur(18px);
          animation: taskkGlowDriftLg 9s ease-in-out infinite;
        }
        @keyframes taskkGlowDrift {
          0%, 100% { transform: translateX(-10%) scale(1);    opacity: 0.85; }
          50%      { transform: translateX(10%)  scale(1.12); opacity: 1;    }
        }
        @keyframes taskkGlowDriftLg {
          0%, 100% { transform: translateX(-8%) scale(1);    }
          33%      { transform: translateX(6%)  scale(1.10); }
          66%      { transform: translateX(-4%) scale(1.06); }
        }
        @media (prefers-reduced-motion: reduce) {
          .taskk-card__glow,
          .taskk-card__glow--lg { animation: none; }
        }
      `}</style>

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'hsl(40 6% 95%)', marginBottom: 4 }}>
            Welcome back, {fullName}!
          </h1>
          <p style={{ fontSize: 13, color: 'hsl(240 5% 55%)' }}>Your investment dashboard overview</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard/deposit')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 1rem', borderRadius: '0.6rem',
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.04)',
              color: 'hsl(40 6% 90%)', fontSize: 13, fontWeight: 500,
              cursor: 'pointer', transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
          >
            <Wallet size={14} />
            Wallet
          </button>
          <button
            onClick={() => navigate('/dashboard/plans')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 1.125rem', borderRadius: '0.6rem',
              background: 'linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)',
              color: '#050505', fontSize: 13, fontWeight: 600,
              border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(167,139,250,0.2)',
              transition: 'opacity 0.15s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <TrendingUp size={14} />
            Invest Now
          </button>
        </div>
      </div>

      {/* ── Stats grid ── */}
      <div className="grid gap-4 mb-5 dash-stats-grid" style={{ gridTemplateColumns: '1.15fr 1fr 1fr', gridTemplateRows: 'auto auto' }}>

        {/* Account Balance — spans 2 rows */}
        <Card className="taskk-card" style={{ gridRow: 'span 2', padding: '1.625rem', position: 'relative', overflow: 'hidden' }}>
          <div className="taskk-card__dots" />
          <div className="taskk-card__glow taskk-card__glow--lg" />
          <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="flex items-center gap-2 mb-4">
            <div style={{
              width: 32, height: 32, borderRadius: '0.5rem',
              background: 'rgba(167,139,250,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Wallet size={15} style={{ color: '#c4b5fd' }} />
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'hsl(40 6% 92%)' }}>Account Balance</p>
              <p style={{ fontSize: 12, color: 'hsl(240 5% 55%)' }}>Your available funds</p>
            </div>
          </div>

          {statsLoading ? (
            <div style={{ height: '3.5rem', display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
              <Loader2 size={22} style={{ color: 'hsl(240 5% 40%)', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : (
            <p style={{ fontSize: '2.75rem', fontWeight: 800, color: 'hsl(40 6% 95%)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '1rem' }}>
              {fmt(balance)}
            </p>
          )}

          {/* Available for withdrawal badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 999, padding: '0.25rem 0.75rem', marginBottom: '0.875rem',
          }}>
            <RefreshCw size={11} style={{ color: 'hsl(240 5% 55%)' }} />
            <span style={{ fontSize: 12, color: 'hsl(240 5% 60%)' }}>Available for Withdrawal</span>
          </div>

          {/* KYC status */}
          <div className="flex items-center gap-1.5 mb-3">
            {kycStatus === 'APPROVED' ? (
              <>
                <CheckCircle2 size={13} style={{ color: '#a78bfa' }} />
                <span style={{ fontSize: 13, color: '#a78bfa', fontWeight: 500 }}>Verified</span>
              </>
            ) : (
              <>
                <AlertCircle size={13} style={{ color: '#f87171' }} />
                <span style={{ fontSize: 13, color: '#f87171', fontWeight: 500 }}>
                  {kycStatus === 'PENDING' ? 'KYC Pending Review' : 'Unverified'}
                </span>
              </>
            )}
          </div>

          <p style={{ fontSize: 11, color: 'hsl(240 5% 45%)', marginBottom: '1.25rem' }}>
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/dashboard/deposit')}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '0.375rem', padding: '0.6rem', borderRadius: '0.625rem',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'hsl(40 6% 90%)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
            >
              <Download size={13} />
              Deposit
            </button>
            <button
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '0.375rem', padding: '0.6rem', borderRadius: '0.625rem',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'hsl(40 6% 90%)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
            >
              <ArrowUpRight size={13} />
              Withdraw
            </button>
          </div>
          </div>
        </Card>

        {/* Total Profit */}
        <StatCard label="Total Profit" value={fmt(profit)} sub="All time" icon={TrendingUp} loading={statsLoading} />
        {/* Total Deposit */}
        <StatCard label="Total Deposit" value={fmt(deposits)} sub="All time" icon={Download} loading={statsLoading} />
        {/* Total Withdrawal */}
        <StatCard label="Total Withdrawal" value={fmt(withdrawals)} sub="All time" icon={ArrowUpRight} loading={statsLoading} />
        {/* Bonus */}
        <StatCard label="Bonus" value={fmt(bonus)} sub="All time" icon={Gift} loading={statsLoading} />
      </div>

      {/* ── Trade Progress + Signal Strength ── */}
      <div className="grid gap-4 mb-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        {/* Trade Progress */}
        <Card className="taskk-card" style={{ padding: '1.25rem 1.375rem', position: 'relative', overflow: 'hidden' }}>
          <div className="taskk-card__dots" />
          <div className="taskk-card__glow" />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="flex items-center justify-between mb-3">
              <p style={{ fontSize: 13, fontWeight: 600, color: 'hsl(40 6% 88%)' }}>Trade Progress</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#60a5fa' }}>{tradeProgress}%</p>
            </div>
            <div style={{
              height: 10,
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 999,
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{
                height: '100%',
                width: `${tradeProgress}%`,
                background: 'linear-gradient(90deg, #2563eb 0%, #3b82f6 50%, #60a5fa 100%)',
                borderRadius: 999,
                boxShadow: '0 0 12px rgba(59,130,246,0.55)',
                transition: 'width 0.6s cubic-bezier(.4,0,.2,1)',
              }} />
            </div>
            <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)', marginTop: 8 }}>
              Overall trade completion status
            </p>
          </div>
        </Card>

        {/* Signal Strength */}
        <Card className="taskk-card" style={{ padding: '1.25rem 1.375rem', position: 'relative', overflow: 'hidden' }}>
          <div className="taskk-card__dots" />
          <div className="taskk-card__glow" />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="flex items-center justify-between mb-3">
              <p style={{ fontSize: 13, fontWeight: 600, color: 'hsl(40 6% 88%)' }}>Signal Strength</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa' }}>{signalStrength}%</p>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {Array.from({ length: 12 }).map((_, i) => {
                const threshold = ((i + 1) / 12) * 100
                const lit = threshold <= signalStrength
                return (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: 22,
                      borderRadius: 3,
                      background: lit
                        ? 'linear-gradient(180deg, #c4b5fd 0%, #8b5cf6 50%, #6d28d9 100%)'
                        : 'rgba(255,255,255,0.05)',
                      border: lit ? '1px solid rgba(167,139,250,0.5)' : '1px solid rgba(255,255,255,0.04)',
                      boxShadow: lit ? '0 0 8px rgba(139,92,246,0.45)' : 'none',
                      transition: 'background 0.4s ease, box-shadow 0.4s ease',
                    }}
                  />
                )
              })}
            </div>
            <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)', marginTop: 8 }}>
              Real-time signal confidence
            </p>
          </div>
        </Card>
      </div>

      {/* ── Identity Verification banner ── */}
      {kycStatus !== 'APPROVED' && (
        <Card style={{ padding: '1.25rem 1.5rem', marginBottom: '1rem' }}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div style={{
                width: 42, height: 42, borderRadius: '0.75rem', flexShrink: 0,
                background: 'rgba(167,139,250,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Shield size={20} style={{ color: '#a78bfa' }} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'hsl(40 6% 92%)', marginBottom: 2 }}>
                  Identity Verification
                </p>
                <p style={{ fontSize: 12, color: 'hsl(240 5% 55%)' }}>
                  {kycStatus === 'PENDING'
                    ? 'Your documents are under review. We\'ll notify you once approved.'
                    : 'Complete verification to access all features'}
                </p>
              </div>
            </div>
            {kycStatus !== 'PENDING' && (
              <button
                onClick={() => navigate('/dashboard/kyc')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.5rem 1rem', borderRadius: '0.6rem',
                  background: 'linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)',
                  color: '#050505', fontSize: 13, fontWeight: 600,
                  border: 'none', cursor: 'pointer', flexShrink: 0,
                  boxShadow: '0 4px 16px rgba(167,139,250,0.2)',
                  transition: 'opacity 0.15s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                View Details
                <ChevronDown size={13} />
              </button>
            )}
          </div>
        </Card>
      )}

      {/* ── Connect Wallet banner / status card ── */}
      {walletLoading ? null : walletVerified ? (
        /* ── STATE 3: Verified ── */
        <Card style={{ padding: '1.25rem 1.5rem', background: 'hsl(262 30% 6%)', border: '1px solid rgba(167,139,250,0.3)', marginBottom: '1rem' }}>
          <div className="flex items-center gap-4">
            <div style={{
              width: 42, height: 42, borderRadius: '0.75rem', flexShrink: 0,
              background: 'rgba(167,139,250,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CheckCircle2 size={20} style={{ color: '#a78bfa' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#a78bfa', marginBottom: 2 }}>
                Wallet Connected Successfully
              </p>
              <p style={{ fontSize: 12, color: 'hsl(240 5% 55%)', wordBreak: 'break-all' }}>
                {walletAddress}
              </p>
            </div>
          </div>
        </Card>
      ) : walletAddress ? (
        /* ── STATE 2: Pending verification ── */
        <Card style={{ padding: '1.25rem 1.5rem', background: 'hsl(40 30% 5%)', border: '1px solid rgba(245,158,11,0.3)', marginBottom: '1rem' }}>
          <div className="flex items-center gap-4">
            <div style={{
              width: 42, height: 42, borderRadius: '0.75rem', flexShrink: 0,
              background: 'rgba(245,158,11,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Clock size={20} style={{ color: '#f59e0b' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'hsl(40 6% 92%)', marginBottom: 2 }}>
                Wallet Pending Verification
              </p>
              <p style={{ fontSize: 12, color: 'hsl(240 5% 55%)', wordBreak: 'break-all' }}>
                {walletAddress}
              </p>
              <p style={{ fontSize: 11, color: '#f59e0b', marginTop: 3 }}>
                Awaiting admin confirmation — you'll be notified once verified.
              </p>
            </div>
          </div>
        </Card>
      ) : !walletBannerDismissed ? (
        /* ── STATE 1: Not connected ── */
        <Card style={{ padding: '1.25rem 1.5rem', background: 'hsl(260 40% 8%)', border: '1px solid rgba(167,139,250,0.2)', marginBottom: '1rem' }}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div style={{
                width: 42, height: 42, borderRadius: '0.75rem', flexShrink: 0,
                background: 'linear-gradient(135deg, rgba(167,139,250,0.3) 0%, rgba(139,92,246,0.3) 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <WalletCards size={18} style={{ color: '#c4b5fd' }} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'hsl(40 6% 92%)', marginBottom: 2 }}>
                  Connect Your Wallet to Start Earning
                </p>
                <p style={{ fontSize: 12, color: 'hsl(240 5% 55%)', maxWidth: 560 }}>
                  Connect your cryptocurrency wallet to unlock daily earning opportunities of up to{' '}
                  <strong style={{ color: 'hsl(40 6% 85%)' }}>$3000</strong> per day.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => { setShowWalletModal(true); setWalletInput(''); setWalletSaveErr('') }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.5rem 1rem', borderRadius: '0.6rem',
                  background: 'linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)',
                  color: '#050505', fontSize: 13, fontWeight: 600,
                  border: 'none', cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(167,139,250,0.2)',
                  transition: 'opacity 0.15s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <LinkIcon size={13} />
                Connect Wallet
              </button>
              <button
                onClick={() => setWalletBannerDismissed(true)}
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'hsl(240 5% 55%)',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
              >
                <X size={12} />
              </button>
            </div>
          </div>
        </Card>
      ) : null}

      {/* ── Connect Wallet Modal ── */}
      {showWalletModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}
          onClick={e => { if (e.target === e.currentTarget) setShowWalletModal(false) }}
        >
          <div style={{
            background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '1rem', padding: '1.75rem', width: '100%', maxWidth: 440,
          }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div style={{
                  width: 36, height: 36, borderRadius: '0.625rem',
                  background: 'rgba(167,139,250,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <WalletCards size={16} style={{ color: '#c4b5fd' }} />
                </div>
                <p style={{ fontSize: 15, fontWeight: 600, color: 'hsl(40 6% 92%)' }}>12-Word Recovery Phrase</p>
              </div>
              <button
                onClick={() => setShowWalletModal(false)}
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'hsl(240 5% 55%)',
                }}
              >
                <X size={13} />
              </button>
            </div>

            <p style={{ fontSize: 13, color: 'hsl(240 5% 60%)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
              Enter your 12-word recovery phrase below to connect your wallet. An admin will verify and confirm the connection.
            </p>

            {/* Input */}
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'hsl(240 5% 65%)', marginBottom: 6 }}>
              12-Word Recovery Phrase
            </label>
            <textarea
              value={walletInput}
              onChange={e => setWalletInput(e.target.value)}
              placeholder="e.g. apple banana cherry dragon eagle frost grape honey iris jungle kite lemon"
              rows={3}
              style={{
                width: '100%', padding: '0.65rem 0.875rem', borderRadius: '0.625rem',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'hsl(40 6% 90%)', fontSize: 13, outline: 'none',
                boxSizing: 'border-box', fontFamily: 'inherit',
                transition: 'border-color 0.15s ease',
                resize: 'none', lineHeight: 1.6,
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'rgba(167,139,250,0.5)'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
              autoFocus
            />

            {walletSaveErr && (
              <p style={{ fontSize: 12, color: '#f87171', marginTop: '0.5rem' }}>{walletSaveErr}</p>
            )}

            {/* Buttons */}
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowWalletModal(false)}
                style={{
                  flex: 1, padding: '0.65rem', borderRadius: '0.625rem',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'hsl(40 6% 80%)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConnectWallet}
                disabled={walletSaving || !walletInput.trim()}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem',
                  padding: '0.65rem', borderRadius: '0.625rem',
                  background: walletSaving || !walletInput.trim()
                    ? 'rgba(167,139,250,0.4)' : 'linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)',
                  color: '#050505', fontSize: 13, fontWeight: 600, border: 'none',
                  cursor: walletSaving || !walletInput.trim() ? 'not-allowed' : 'pointer',
                  transition: 'opacity 0.15s ease',
                }}
              >
                {walletSaving
                  ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</>
                  : <><LinkIcon size={13} /> Submit</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Active Plan Card ── */}
      <div className="mt-4">
        {(() => {
          const plan = user?.plan ?? 'BASIC'

          if (plan === 'BASIC') {
            // No custom plan selected
            return (
              <Card style={{ padding: '1.25rem 1.5rem', background: 'hsl(260 40% 7%)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    <div style={{
                      width: 44, height: 44, borderRadius: '0.75rem', flexShrink: 0,
                      background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Sparkles size={18} style={{ color: 'hsl(240 5% 45%)' }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p style={{ fontSize: 14, fontWeight: 600, color: 'hsl(40 6% 82%)' }}>No Investment Plan Selected</p>
                        <span style={{
                          fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                          padding: '2px 8px', borderRadius: 999,
                          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                          color: 'hsl(240 5% 55%)',
                        }}>INACTIVE</span>
                      </div>
                      <p style={{ fontSize: 12, color: 'hsl(240 5% 50%)', maxWidth: 480 }}>
                        You haven't subscribed to an investment plan yet. Choose a plan to start growing your portfolio with daily returns.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/dashboard/plans')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0,
                      padding: '0.5rem 1.125rem', borderRadius: '0.6rem',
                      background: 'linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)',
                      color: '#050505', fontSize: 13, fontWeight: 600,
                      border: 'none', cursor: 'pointer',
                      boxShadow: '0 4px 16px rgba(167,139,250,0.18)',
                      transition: 'opacity 0.15s ease',
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    Browse Plans
                    <ChevronRight size={13} />
                  </button>
                </div>
              </Card>
            )
          }

          // SILVER or GOLD plan
          const isSilver = plan === 'SILVER'
          const isGold   = plan === 'GOLD'

          const planConfig = isSilver ? {
            label:     'Silver Plan',
            Icon:      Zap,
            iconColor: '#60a5fa',
            iconBg:    'rgba(96,165,250,0.15)',
            badgeBg:   'rgba(96,165,250,0.12)',
            badgeBorder: 'rgba(96,165,250,0.3)',
            badgeColor: '#93c5fd',
            cardBg:    'hsl(230 40% 7%)',
            cardBorder: 'rgba(96,165,250,0.2)',
            description: 'Your Silver plan is active. Enjoy enhanced daily returns and priority support.',
            badge:     'ACTIVE',
          } : {
            label:     'Gold Plan',
            Icon:      Crown,
            iconColor: '#f59e0b',
            iconBg:    'rgba(245,158,11,0.15)',
            badgeBg:   'rgba(245,158,11,0.12)',
            badgeBorder: 'rgba(245,158,11,0.35)',
            badgeColor: '#fcd34d',
            cardBg:    'hsl(40 30% 5%)',
            cardBorder: 'rgba(245,158,11,0.25)',
            description: 'Your Gold plan is active. You have access to our highest returns and premium features.',
            badge:     'ACTIVE',
          }

          const { label, Icon, iconColor, iconBg, badgeBg, badgeBorder, badgeColor, cardBg, cardBorder, description } = planConfig

          return (
            <Card style={{ padding: '1.25rem 1.5rem', background: cardBg, border: `1px solid ${cardBorder}` }}>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <div style={{
                    width: 44, height: 44, borderRadius: '0.75rem', flexShrink: 0,
                    background: iconBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={20} style={{ color: iconColor }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'hsl(40 6% 92%)' }}>{label}</p>
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                        padding: '2px 8px', borderRadius: 999,
                        background: badgeBg, border: `1px solid ${badgeBorder}`,
                        color: badgeColor,
                      }}>ACTIVE</span>
                    </div>
                    <p style={{ fontSize: 12, color: 'hsl(240 5% 55%)', maxWidth: 480 }}>
                      {description}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/dashboard/plans')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0,
                    padding: '0.5rem 1rem', borderRadius: '0.6rem',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'hsl(40 6% 80%)', fontSize: 12, fontWeight: 500,
                    cursor: 'pointer', transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                  View Plans
                  <ChevronRight size={12} />
                </button>
              </div>
            </Card>
          )
        })()}
      </div>

      {/* ── Recent Activity ── */}
      <div className="mt-5">
        <Card>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'hsl(40 6% 92%)' }}>Recent Activity</p>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchTransactions}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 50%)', display: 'flex', alignItems: 'center' }}
                title="Refresh"
              >
                <RefreshCw size={13} style={txLoading ? { animation: 'spin 1s linear infinite' } : {}} />
              </button>
              <button style={{ fontSize: 12, color: '#a78bfa', background: 'none', border: 'none', cursor: 'pointer' }}>
                View all
              </button>
            </div>
          </div>

          {/* Loading */}
          {txLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={22} style={{ color: 'hsl(240 5% 40%)', animation: 'spin 1s linear infinite' }} />
            </div>
          )}

          {/* Empty state */}
          {!txLoading && txList.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div style={{
                width: 48, height: 48, borderRadius: '0.875rem', marginBottom: '1rem',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <TrendingUp size={20} style={{ color: 'hsl(240 5% 45%)' }} />
              </div>
              <p style={{ fontSize: 14, fontWeight: 500, color: 'hsl(40 6% 75%)', marginBottom: 4 }}>
                No transactions yet
              </p>
              <p style={{ fontSize: 12, color: 'hsl(240 5% 50%)' }}>
                Your activity will appear here once you make a deposit.
              </p>
            </div>
          )}

          {/* Transaction list */}
          {!txLoading && txList.length > 0 && (
            <div>
              {txList.map((tx, i) => (
                <div
                  key={tx.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.875rem 1.25rem',
                    borderBottom: i < txList.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  }}
                >
                  {/* Left: icon + label */}
                  <div className="flex items-center gap-3">
                    <div style={{
                      width: 36, height: 36, borderRadius: '0.625rem', flexShrink: 0,
                      background: tx.type === 'DEPOSIT'    ? 'rgba(167,139,250,0.12)'  :
                                  tx.type === 'WITHDRAWAL' ? 'rgba(248,113,113,0.12)' :
                                  tx.type === 'PROFIT'     ? 'rgba(96,165,250,0.12)'  :
                                  tx.type === 'BONUS'      ? 'rgba(251,191,36,0.12)'  :
                                  'rgba(255,255,255,0.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {tx.type === 'DEPOSIT'    && <Download    size={15} style={{ color: '#a78bfa' }} />}
                      {tx.type === 'WITHDRAWAL' && <ArrowUpRight size={15} style={{ color: '#f87171' }} />}
                      {tx.type === 'PROFIT'     && <TrendingUp  size={15} style={{ color: '#60a5fa' }} />}
                      {tx.type === 'BONUS'      && <Gift        size={15} style={{ color: '#fbbf24' }} />}
                      {tx.type === 'ADJUSTMENT' && <RefreshCw   size={15} style={{ color: 'hsl(240 5% 55%)' }} />}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: 'hsl(40 6% 90%)', marginBottom: 2 }}>
                        {TX_TYPE_LABEL[tx.type]}
                        {tx.network && <span style={{ fontSize: 11, color: 'hsl(240 5% 50%)', marginLeft: 6 }}>· {tx.network}</span>}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <TxStatusIcon status={tx.status} />
                        <span style={{ fontSize: 11, color: TX_STATUS_COLOR[tx.status] }}>
                          {tx.status.charAt(0) + tx.status.slice(1).toLowerCase()}
                        </span>
                        <span style={{ fontSize: 11, color: 'hsl(240 5% 40%)' }}>· {timeAgo(tx.createdAt)}</span>
                      </div>
                      {tx.adminNote && (
                        <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)', marginTop: 2 }}>{tx.adminNote}</p>
                      )}
                    </div>
                  </div>

                  {/* Right: amount */}
                  <p style={{
                    fontSize: 14, fontWeight: 600, flexShrink: 0,
                    color: tx.type === 'WITHDRAWAL' ? '#f87171' :
                           tx.type === 'DEPOSIT'    ? '#a78bfa'  :
                           tx.type === 'PROFIT'     ? '#60a5fa'  :
                           tx.type === 'BONUS'      ? '#fbbf24'  :
                           'hsl(40 6% 85%)',
                  }}>
                    {tx.type === 'WITHDRAWAL' ? '-' : '+'}{fmt(tx.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

    </div>
  )
}
