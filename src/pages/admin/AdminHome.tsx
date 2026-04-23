import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, TrendingUp, ArrowDownCircle, ArrowUpCircle,
  ShieldCheck, DollarSign, Activity, Clock, ChevronRight,
  ArrowUp, ArrowDown, RefreshCw,
} from 'lucide-react'
import { adminApi } from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Stats {
  totalUsers:        number
  activeUsers:       number
  pendingKYC:        number
  totalDeposited:    number
  totalWithdrawn:    number
  pendingWithdrawals: number
  recentTransactions: RecentTx[]
}

interface RecentTx {
  id:        string
  type:      string
  amount:    number
  status:    string
  note?:     string
  createdAt: string
  user:      { firstName: string; lastName: string; email: string }
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, iconColor, iconBg, label, value, sub, subPositive }: {
  icon: React.ElementType; iconColor: string; iconBg: string
  label: string; value: string; sub: string; subPositive?: boolean
}) {
  return (
    <div style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'hsl(240 5% 52%)', letterSpacing: '0.03em' }}>{label}</p>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} style={{ color: iconColor }} />
        </div>
      </div>
      <div>
        <p style={{ fontSize: 24, fontWeight: 800, color: 'hsl(40 10% 95%)', lineHeight: 1 }}>{value}</p>
        <p style={{ fontSize: 11, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4, color: subPositive === undefined ? 'hsl(240 5% 50%)' : subPositive ? '#a78bfa' : '#f87171', fontWeight: 500 }}>
          {subPositive === true  && <ArrowUp size={10} />}
          {subPositive === false && <ArrowDown size={10} />}
          {sub}
        </p>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function AdminHome() {
  const navigate = useNavigate()
  const [stats,   setStats]   = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await adminApi.get<{ success: boolean; data: Stats }>('/admin/stats')
      setStats(res.data)
    } catch (err: any) {
      setError(err.message ?? 'Failed to load dashboard.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const fmtUSD = (n: number) =>
    `$${n >= 1_000_000 ? parseFloat((n / 1_000_000).toFixed(2)) + 'M' : n >= 1000 ? parseFloat((n / 1000).toFixed(1)) + 'K' : n.toLocaleString()}`

  const STATUS_COLORS: Record<string, { c: string; bg: string; label: string }> = {
    COMPLETED:  { c: '#a78bfa', bg: 'rgba(167,139,250,0.12)',  label: 'Completed' },
    PENDING:    { c: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  label: 'Pending' },
    PROCESSING: { c: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  label: 'Processing' },
    REJECTED:   { c: '#f87171', bg: 'rgba(248,113,113,0.12)', label: 'Rejected' },
  }

  const TYPE_META: Record<string, { c: string; label: string }> = {
    DEPOSIT:    { c: '#a78bfa', label: 'Deposit' },
    WITHDRAWAL: { c: '#f87171', label: 'Withdrawal' },
    TRADE_WIN:  { c: '#60a5fa', label: 'Trade Win' },
    TRADE_LOSS: { c: '#f87171', label: 'Trade Loss' },
    BONUS:      { c: '#f59e0b', label: 'Bonus' },
    REFERRAL:   { c: '#a78bfa', label: 'Referral' },
  }

  // ── Loading skeleton ──
  if (loading) return (
    <div style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 36, height: 36, border: '3px solid rgba(167,139,250,0.3)', borderTopColor: '#a78bfa', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: 'hsl(240 5% 50%)', fontSize: 13 }}>Loading dashboard…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  // ── Error state ──
  if (error) return (
    <div style={{ padding: 32 }}>
      <div style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <p style={{ color: '#f87171', fontSize: 13 }}>{error}</p>
        <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 7, background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          <RefreshCw size={12} /> Retry
        </button>
      </div>
    </div>
  )

  if (!stats) return null

  const netRevenue = (stats.totalDeposited ?? 0) - (stats.totalWithdrawn ?? 0)

  return (
    <div style={{ padding: '20px 16px 40px' }} className="md:p-8">

      {/* Page title */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'hsl(40 10% 96%)' }}>Admin Dashboard</h1>
          <p style={{ fontSize: 13, color: 'hsl(240 5% 50%)', marginTop: 3 }}>
            Platform overview · {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button onClick={load} title="Refresh" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 9, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'hsl(240 5% 55%)', fontSize: 12, cursor: 'pointer' }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Alert strip */}
      {(stats.pendingKYC > 0 || stats.pendingWithdrawals > 0) && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          {stats.pendingKYC > 0 && (
            <button onClick={() => navigate('/admin/kyc')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 9, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              <ShieldCheck size={14} /> {stats.pendingKYC} KYC applications awaiting review <ChevronRight size={12} />
            </button>
          )}
          {stats.pendingWithdrawals > 0 && (
            <button onClick={() => navigate('/admin/withdrawals')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 9, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              <ArrowUpCircle size={14} /> {stats.pendingWithdrawals} withdrawals pending approval <ChevronRight size={12} />
            </button>
          )}
        </div>
      )}

      {/* Stats row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" style={{ marginBottom: 24 }}>
        <StatCard icon={Users}           iconColor="#a78bfa" iconBg="rgba(167,139,250,0.12)" label="Total Users"       value={String(stats.totalUsers)}           sub={`${stats.activeUsers} active`} />
        <StatCard icon={DollarSign}      iconColor="#a78bfa" iconBg="rgba(167,139,250,0.12)"  label="Total AUM"         value={fmtUSD(stats.totalDeposited ?? 0)}  sub="Total deposited" />
        <StatCard icon={ArrowDownCircle} iconColor="#60a5fa" iconBg="rgba(96,165,250,0.12)"  label="Total Deposits"    value={fmtUSD(stats.totalDeposited ?? 0)}  sub="Completed deposits" subPositive />
        <StatCard icon={ArrowUpCircle}   iconColor="#f87171" iconBg="rgba(248,113,113,0.12)" label="Total Withdrawals" value={fmtUSD(stats.totalWithdrawn ?? 0)}  sub="Completed withdrawals" subPositive={false} />
      </div>

      {/* Stats row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" style={{ marginBottom: 28 }}>
        <StatCard icon={Activity}    iconColor="#a78bfa" iconBg="rgba(167,139,250,0.12)"  label="Active Users"       value={String(stats.activeUsers)}           sub="KYC approved" />
        <StatCard icon={ShieldCheck} iconColor="#f59e0b" iconBg="rgba(245,158,11,0.12)" label="KYC Pending"        value={String(stats.pendingKYC)}            sub="Need review" />
        <StatCard icon={Clock}       iconColor="#fb923c" iconBg="rgba(251,146,60,0.12)" label="Pending Withdrawals" value={String(stats.pendingWithdrawals)}   sub="Require approval" />
        <StatCard icon={TrendingUp}  iconColor="#a78bfa" iconBg="rgba(167,139,250,0.12)" label="Net Revenue"       value={fmtUSD(netRevenue)}                  sub="Deposits minus withdrawals" subPositive={netRevenue >= 0} />
      </div>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Recent Transactions */}
        <div style={{ gridColumn: 'span 2', background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'hsl(40 10% 94%)' }}>Recent Transactions</p>
            <button onClick={() => navigate('/admin/transactions')} style={{ fontSize: 12, fontWeight: 600, color: '#a78bfa', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>View all <ChevronRight size={13} /></button>
          </div>

          {stats.recentTransactions.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'hsl(240 5% 45%)', fontSize: 13 }}>
              No transactions yet
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                    {['User', 'Type', 'Amount', 'Date', 'Status'].map(h => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'hsl(240 5% 42%)', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.recentTransactions.map(tx => {
                    const tm = TYPE_META[tx.type]   ?? { c: '#94a3b8', label: tx.type }
                    const st = STATUS_COLORS[tx.status] ?? { c: '#94a3b8', bg: 'rgba(148,163,184,0.1)', label: tx.status }
                    const isOut = tx.type === 'WITHDRAWAL' || tx.type === 'TRADE_LOSS'
                    return (
                      <tr key={tx.id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '10px 14px', fontSize: 12, color: 'hsl(40 6% 85%)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {tx.user.firstName} {tx.user.lastName}
                          <div style={{ fontSize: 10, color: 'hsl(240 5% 45%)', fontWeight: 400 }}>{tx.user.email}</div>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: tm.c, background: `${tm.c}18`, padding: '3px 8px', borderRadius: 6 }}>{tm.label}</span>
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: 12, fontWeight: 700, color: isOut ? '#f87171' : '#a78bfa', whiteSpace: 'nowrap' }}>
                          {isOut ? '−' : '+'} ${Number(tx.amount).toLocaleString()}
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: 11, color: 'hsl(240 5% 48%)', whiteSpace: 'nowrap' }}>
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: st.bg, color: st.c }}>{st.label}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right panel: quick stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'hsl(40 10% 94%)', marginBottom: 16 }}>User Breakdown</p>
            {[
              { label: 'Active',    count: stats.activeUsers,                              total: stats.totalUsers || 1, color: '#a78bfa' },
              { label: 'KYC Pending', count: stats.pendingKYC,                            total: stats.totalUsers || 1, color: '#f59e0b' },
              { label: 'Withdrawals Pending', count: stats.pendingWithdrawals,             total: Math.max(stats.pendingWithdrawals, 1), color: '#f87171' },
            ].map(row => (
              <div key={row.label} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 5 }}>
                  <span style={{ color: 'hsl(240 5% 55%)' }}>{row.label}</span>
                  <span style={{ fontWeight: 700, color: row.color }}>{row.count}</span>
                </div>
                <div style={{ height: 5, borderRadius: 999, background: 'rgba(255,255,255,0.06)' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, (row.count / row.total) * 100)}%`, borderRadius: 999, background: row.color, transition: 'width 0.4s ease' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Quick links */}
          <div style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 16px' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'hsl(40 10% 94%)', marginBottom: 12 }}>Quick Actions</p>
            {[
              { label: 'Manage Users',       path: '/admin/users',        color: '#a78bfa' },
              { label: 'Review KYC',         path: '/admin/kyc',          color: '#f59e0b' },
              { label: 'All Transactions',   path: '/admin/transactions', color: '#60a5fa' },
              { label: 'Manage Wallets',     path: '/admin/wallets',      color: '#a78bfa' },
            ].map(item => (
              <button key={item.path} onClick={() => navigate(item.path)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 10px', borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 2, textAlign: 'left' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <span style={{ fontSize: 12, color: 'hsl(240 5% 65%)', fontWeight: 500 }}>{item.label}</span>
                <ChevronRight size={13} style={{ color: item.color }} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
