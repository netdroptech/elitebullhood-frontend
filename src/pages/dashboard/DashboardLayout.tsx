import { useState, useRef, useEffect, useCallback } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import logoImg from '@/assets/logo.png'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import {
  LayoutDashboard, FileText, TrendingUp, Briefcase, BarChart2,
  Activity, Copy, Bot, Zap, Download, ArrowUpRight, Menu, LogOut,
  Bell, Settings, Building2, CandlestickChart, UserCircle2, KeyRound,
  SlidersHorizontal, ShieldCheck, CreditCard, Globe, Lock, HelpCircle,
  ChevronRight as ChevronRight2, Clock, HeadphonesIcon, ShieldOff,
} from 'lucide-react'

const NAV = [
  {
    section: 'OVERVIEW',
    items: [
      { label: 'Dashboard',         path: '/dashboard',                   icon: LayoutDashboard },
      { label: 'Account Statement', path: '/dashboard/statement',         icon: FileText },
      { label: 'Trade',             path: '/dashboard/trade',             icon: CandlestickChart, badge: { label: 'Live', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' } },
    ],
  },
  {
    section: 'PORTFOLIO & INVESTMENTS',
    items: [
      { label: 'Investment Plans',  path: '/dashboard/plans',             icon: TrendingUp },
      { label: 'My Portfolio',      path: '/dashboard/portfolio',         icon: Briefcase },
      { label: 'Performance History', path: '/dashboard/performance',     icon: BarChart2 },
    ],
  },
  {
    section: 'TRADING & MARKETS',
    items: [
      { label: 'Live Markets',      path: '/dashboard/markets',           icon: Activity,  badge: { label: 'Live',    color: '#7c3aed', bg: 'rgba(124,58,237,0.15)' } },
      { label: 'Copy Trading',      path: '/dashboard/copy-trading',      icon: Copy,      badge: { label: 'Pro',     color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' } },
      { label: 'AI Trading Bots',   path: '/dashboard/ai-bots',           icon: Bot,       badge: { label: 'AI',      color: '#94a3b8', bg: 'rgba(148,163,184,0.15)' } },
    ],
  },
  {
    section: 'MARKET INTELLIGENCE',
    items: [
      { label: 'Premium Signals',   path: '/dashboard/signals',           icon: Zap,       badge: { label: 'Premium', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' } },
    ],
  },
  {
    section: 'WALLET & FUNDS',
    items: [
      { label: 'Deposit Funds',    path: '/dashboard/deposit',    icon: Download },
      { label: 'Withdrawal Funds', path: '/dashboard/withdrawal', icon: ArrowUpRight },
    ],
  },
  {
    section: 'REAL ESTATE',
    items: [
      { label: 'Property Listing', path: '/dashboard/properties', icon: Building2, badge: { label: 'New', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' } },
    ],
  },
]

// ─── Notification type colours ────────────────────────────────────────────────
const NOTIF_DOT: Record<string, string> = {
  SUCCESS: '#a78bfa',
  ERROR:   '#f87171',
  WARNING: '#f59e0b',
  INFO:    '#60a5fa',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs} hr ago`
  const days = Math.floor(hrs / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

export function DashboardLayout() {
  const { user, logout } = useAuth()
  const isPending    = user?.status === 'PENDING'
  const isSuspended  = user?.status === 'SUSPENDED'
  const isRestricted = isPending || isSuspended

  const [sidebarOpen,  setSidebarOpen]  = useState(false)
  const [accountOpen,  setAccountOpen]  = useState(false)
  const [notifOpen,    setNotifOpen]    = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const accountRef  = useRef<HTMLDivElement>(null)
  const notifRef    = useRef<HTMLDivElement>(null)
  const settingsRef = useRef<HTMLDivElement>(null)
  const navigate    = useNavigate()

  // ── Real notifications state ────────────────────────────────────────────
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount,   setUnreadCount]   = useState(0)
  const [notifLoading,  setNotifLoading]  = useState(false)

  const fetchNotifications = useCallback(async () => {
    setNotifLoading(true)
    try {
      const res = await api.get<{ success: boolean; data: any[]; meta: { unreadCount: number } }>('/notifications')
      setNotifications(res.data)
      setUnreadCount(res.meta.unreadCount)
    } catch {
      // silently fail — badge just stays at 0
    } finally {
      setNotifLoading(false)
    }
  }, [])

  // Fetch on mount
  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  // Re-fetch whenever the dropdown opens
  useEffect(() => { if (notifOpen) fetchNotifications() }, [notifOpen, fetchNotifications])

  async function handleMarkOneRead(id: string) {
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    setUnreadCount(c => Math.max(0, c - 1))
    try {
      await api.post(`/notifications/${id}/read`, {})
    } catch {
      fetchNotifications() // revert on error
    }
  }

  async function handleMarkAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnreadCount(0)
    try {
      await api.post('/notifications/read-all', {})
    } catch {
      fetchNotifications()
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    setNotifications(prev => prev.filter(n => n.id !== id))
    setUnreadCount(prev => {
      const wasUnread = notifications.find(n => n.id === id)?.isRead === false
      return wasUnread ? Math.max(0, prev - 1) : prev
    })
    try {
      await api.delete(`/notifications/${id}`)
    } catch {
      fetchNotifications()
    }
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (accountRef.current  && !accountRef.current.contains(e.target as Node))  setAccountOpen(false)
      if (notifRef.current    && !notifRef.current.contains(e.target as Node))    setNotifOpen(false)
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) setSettingsOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-hidden">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`apex-sidebar fixed top-0 left-0 h-full z-50 flex flex-col transition-transform duration-300 md:relative md:!translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          width: 260,
          background: 'hsl(260 87% 2.5%)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <img src={logoImg} alt="logo" style={{ height: 52, maxWidth: 160, objectFit: 'contain', objectPosition: 'left' }} />
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
            background: 'rgba(124,58,237,0.15)', color: '#a78bfa',
            padding: '3px 8px', borderRadius: 999, flexShrink: 0,
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa', display: 'inline-block', animation: 'liveBlink 1.2s ease-in-out infinite' }} />
            LIVE
          </span>
        </div>
        <style>{`@keyframes liveBlink { 0%,100%{opacity:1;box-shadow:0 0 6px #a78bfa} 50%{opacity:0.2;box-shadow:none} }`}</style>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3" style={{ scrollbarWidth: 'none' }}>
          {NAV.map(group => (
            <div key={group.section} className="mb-5">
              <p style={{
                fontSize: 10, fontWeight: 600, letterSpacing: '0.1em',
                color: 'hsl(240 5% 45%)', padding: '0 0.5rem', marginBottom: '0.375rem',
              }}>
                {group.section}
              </p>
              {group.items.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/dashboard'}
                  onClick={e => { if (isRestricted) e.preventDefault(); else setSidebarOpen(false) }}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: '0.625rem',
                    padding: '0.5rem 0.625rem', borderRadius: '0.6rem',
                    marginBottom: '0.125rem', cursor: isRestricted ? 'not-allowed' : 'pointer',
                    textDecoration: 'none', fontSize: '0.8125rem', fontWeight: 500,
                    background: isActive && !isRestricted ? 'rgba(167,139,250,0.2)' : 'transparent',
                    color: isRestricted ? 'hsl(240 5% 35%)' : isActive ? '#c4b5fd' : 'hsl(240 5% 60%)',
                    transition: 'all 0.15s ease',
                    pointerEvents: isRestricted ? 'none' : 'auto',
                    opacity: isRestricted ? 0.4 : 1,
                  })}
                  className="group hover:bg-white/5 hover:!text-foreground"
                >
                  <item.icon size={15} style={{ flexShrink: 0 }} />
                  <span className="flex-1 truncate">{item.label}</span>
                  {'badge' in item && item.badge && (
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 999,
                      color: item.badge.color, background: item.badge.bg, flexShrink: 0,
                    }}>
                      {item.badge.label}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Bottom user row */}
        <div className="px-3 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all text-sm"
          >
            <LogOut size={14} />
            <span>Back to site</span>
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="apex-topbar flex items-center justify-between px-3 py-3 md:px-6 md:py-4 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={18} />
            </button>
          </div>
          <div className="flex items-center gap-2">

            {/* ── Language Switcher ── */}
            <LanguageSwitcher />

            {/* ── Notifications Dropdown ── */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button
                onClick={() => { setNotifOpen(o => !o); setAccountOpen(false); setSettingsOpen(false) }}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all relative"
                style={{ border: notifOpen ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent' }}
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: 5, right: 5,
                    minWidth: 16, height: 16, borderRadius: 8,
                    background: '#ef4444', color: '#fff',
                    fontSize: 9, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    lineHeight: 1, padding: '0 3px',
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="apex-dropdown" style={{
                  position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                  width: 'min(340px, calc(100vw - 24px))', borderRadius: 14, zIndex: 200,
                  background: 'hsl(260 87% 5%)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                  overflow: 'hidden',
                  animation: 'dropIn 0.15s ease',
                }}>

                  {/* Header */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 16px 10px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'hsl(40 10% 94%)' }}>Notifications</p>
                      {unreadCount > 0 && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
                          background: 'rgba(239,68,68,0.15)', color: '#f87171',
                        }}>
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        style={{ fontSize: 11, fontWeight: 600, color: '#a78bfa', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* List */}
                  <div style={{ maxHeight: 360, overflowY: 'auto', scrollbarWidth: 'none' }}>

                    {/* Loading */}
                    {notifLoading && (
                      <div style={{ padding: '32px 0', display: 'flex', justifyContent: 'center' }}>
                        <div style={{ width: 20, height: 20, border: '2px solid rgba(167,139,250,0.2)', borderTopColor: '#a78bfa', borderRadius: '50%', animation: 'notifSpin 0.7s linear infinite' }} />
                        <style>{`@keyframes notifSpin { to { transform: rotate(360deg) } }`}</style>
                      </div>
                    )}

                    {/* Empty state */}
                    {!notifLoading && notifications.length === 0 && (
                      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                        <Bell size={28} style={{ color: 'rgba(255,255,255,0.12)', margin: '0 auto 10px' }} />
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'hsl(240 5% 45%)' }}>No notifications yet</p>
                        <p style={{ fontSize: 11.5, color: 'hsl(240 5% 36%)', marginTop: 4 }}>We'll notify you about deposits, trades, and account activity.</p>
                      </div>
                    )}

                    {/* Notification rows */}
                    {!notifLoading && notifications.map((n, i) => {
                      const dot = NOTIF_DOT[n.type] ?? '#60a5fa'
                      return (
                        <div
                          key={n.id}
                          onClick={() => !n.isRead && handleMarkOneRead(n.id)}
                          style={{
                            display: 'flex', alignItems: 'flex-start', gap: 11,
                            padding: '11px 14px',
                            background: n.isRead ? 'transparent' : 'rgba(167,139,250,0.04)',
                            borderBottom: i < notifications.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                            cursor: n.isRead ? 'default' : 'pointer',
                            transition: 'background 0.12s',
                            position: 'relative',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                          onMouseLeave={e => (e.currentTarget.style.background = n.isRead ? 'transparent' : 'rgba(167,139,250,0.04)')}
                        >
                          {/* Colour dot */}
                          <div style={{
                            width: 8, height: 8, borderRadius: '50%',
                            background: n.isRead ? 'rgba(255,255,255,0.1)' : dot,
                            flexShrink: 0, marginTop: 6,
                            boxShadow: n.isRead ? 'none' : `0 0 6px ${dot}99`,
                            transition: 'all 0.2s',
                          }} />

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
                              <p style={{
                                fontSize: 12.5,
                                fontWeight: n.isRead ? 500 : 700,
                                color: n.isRead ? 'hsl(240 5% 60%)' : 'hsl(40 10% 94%)',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              }}>
                                {n.title}
                              </p>
                              <span style={{ fontSize: 10, color: 'hsl(240 5% 40%)', flexShrink: 0 }}>
                                {timeAgo(n.createdAt)}
                              </span>
                            </div>
                            <p style={{ fontSize: 11.5, color: 'hsl(240 5% 52%)', lineHeight: 1.45 }}>{n.message}</p>
                          </div>

                          {/* Dismiss ×  */}
                          <button
                            onClick={(e) => handleDelete(n.id, e)}
                            title="Dismiss"
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: 'hsl(240 5% 38%)', padding: '2px 4px',
                              fontSize: 14, lineHeight: 1, flexShrink: 0,
                              opacity: 0.5, transition: 'opacity 0.15s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                            onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}
                          >
                            ×
                          </button>
                        </div>
                      )
                    })}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '10px 16px' }}>
                      <button
                        onClick={() => { fetchNotifications(); }}
                        style={{
                          width: '100%', height: 34, borderRadius: 8,
                          border: '1px solid rgba(255,255,255,0.08)',
                          background: 'rgba(255,255,255,0.03)', cursor: 'pointer',
                          fontSize: 12, fontWeight: 600, color: 'hsl(240 5% 55%)',
                          transition: 'all 0.12s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'hsl(40 6% 85%)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'hsl(240 5% 55%)' }}
                      >
                        Refresh
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* ── Settings Dropdown ── */}
            <div ref={settingsRef} style={{ position: 'relative' }}>
              <button
                onClick={() => { setSettingsOpen(o => !o); setNotifOpen(false); setAccountOpen(false) }}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
                style={{ border: settingsOpen ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent' }}
              >
                <Settings size={16} />
              </button>

              {settingsOpen && (
                <div className="apex-dropdown" style={{
                  position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                  width: 'min(260px, calc(100vw - 24px))', borderRadius: 14, zIndex: 200,
                  background: 'hsl(260 87% 5%)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                  overflow: 'hidden',
                  animation: 'dropIn 0.15s ease',
                }}>

                  {/* Header */}
                  <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'hsl(240 5% 45%)' }}>SETTINGS</p>
                  </div>

                  {/* Items */}
                  {[
                    {
                      icon: UserCircle2, iconColor: '#a78bfa', iconBg: 'rgba(167,139,250,0.18)',
                      label: 'Profile Settings',  sub: 'Update display name & avatar',
                      path: '/dashboard/settings/profile',
                    },
                    {
                      icon: SlidersHorizontal, iconColor: '#60a5fa', iconBg: 'rgba(96,165,250,0.15)',
                      label: 'Profile Update',    sub: 'Edit personal & contact info',
                      path: '/dashboard/settings/update',
                    },
                    {
                      icon: ShieldCheck, iconColor: '#a78bfa', iconBg: 'rgba(167,139,250,0.15)',
                      label: 'KYC Verification',  sub: 'Verify your identity',
                      badge: 'Pending',
                      path: '/dashboard/settings/kyc',
                    },
                    {
                      icon: CreditCard, iconColor: '#f59e0b', iconBg: 'rgba(245,158,11,0.15)',
                      label: 'Payment Methods',   sub: 'Cards, banks & crypto',
                      path: '/dashboard/settings/payments',
                    },
                    {
                      icon: Lock, iconColor: '#f87171', iconBg: 'rgba(248,113,113,0.15)',
                      label: 'Security & 2FA',    sub: 'Password, 2FA, sessions',
                      path: '/dashboard/settings/security',
                    },
                    {
                      icon: Globe, iconColor: '#38bdf8', iconBg: 'rgba(56,189,248,0.15)',
                      label: 'Language & Region', sub: 'Timezone and locale',
                      path: '/dashboard/settings/locale',
                    },
                    {
                      icon: HelpCircle, iconColor: '#94a3b8', iconBg: 'rgba(148,163,184,0.12)',
                      label: 'Help & Support',    sub: 'FAQs, live chat',
                      path: '/dashboard/settings/support',
                    },
                  ].map((item, i, arr) => (
                    <button
                      key={item.label}
                      onClick={() => { setSettingsOpen(false); navigate(item.path) }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 11,
                        padding: '10px 14px', background: 'transparent',
                        border: 'none', cursor: 'pointer', textAlign: 'left',
                        borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        transition: 'background 0.12s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{
                        width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                        background: item.iconBg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <item.icon size={15} style={{ color: item.iconColor }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12.5, fontWeight: 600, color: 'hsl(40 10% 93%)', lineHeight: 1.2 }}>{item.label}</p>
                        <p style={{ fontSize: 11, color: 'hsl(240 5% 52%)', lineHeight: 1.3 }}>{item.sub}</p>
                      </div>
                      {item.badge && (
                        <span style={{
                          fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 999,
                          background: 'rgba(245,158,11,0.15)', color: '#f59e0b',
                          flexShrink: 0, letterSpacing: '0.04em',
                        }}>
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight2 size={13} style={{ color: 'hsl(240 5% 38%)', flexShrink: 0 }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Avatar + Account Dropdown ── */}
            <div ref={accountRef} style={{ position: 'relative' }}>
              <button
                onClick={() => { setAccountOpen(o => !o); setNotifOpen(false); setSettingsOpen(false) }}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: '#050505', flexShrink: 0,
                  border: accountOpen ? '2px solid rgba(167,139,250,0.6)' : '2px solid transparent',
                  cursor: 'pointer', transition: 'border-color 0.15s',
                  outline: 'none',
                }}
              >
                E
              </button>

              {/* Dropdown */}
              {accountOpen && (
                <div className="apex-dropdown" style={{
                  position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                  width: 'min(240px, calc(100vw - 24px))', borderRadius: 14, zIndex: 200,
                  background: 'hsl(260 87% 5%)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                  overflow: 'hidden',
                  animation: 'dropIn 0.15s ease',
                }}>
                  <style>{`
                    @keyframes dropIn {
                      from { opacity: 0; transform: translateY(-6px) scale(0.97); }
                      to   { opacity: 1; transform: translateY(0)      scale(1);    }
                    }
                  `}</style>

                  {/* Section label */}
                  <p style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                    color: 'hsl(240 5% 45%)', padding: '14px 16px 8px',
                  }}>
                    MY ACCOUNT
                  </p>

                  {/* Profile */}
                  <button
                    onClick={() => { setAccountOpen(false); navigate('/dashboard/settings/profile') }}
                    style={{
                      width: 'calc(100% - 12px)', display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px', background: 'rgba(167,139,250,0.12)',
                      border: 'none', cursor: 'pointer', textAlign: 'left',
                      borderRadius: 8, margin: '0 6px',
                    }}
                  >
                    <div style={{
                      width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                      background: 'rgba(167,139,250,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <UserCircle2 size={18} style={{ color: '#a78bfa' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'hsl(40 10% 95%)', lineHeight: 1.2 }}>Profile</p>
                      <p style={{ fontSize: 11, color: 'hsl(240 5% 55%)', lineHeight: 1.3 }}>View your profile</p>
                    </div>
                  </button>

                  {/* Divider */}
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '6px 0' }} />

                  {/* API Management */}
                  <button
                    onClick={() => setAccountOpen(false)}
                    style={{
                      width: 'calc(100% - 12px)', display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px', background: 'transparent',
                      border: 'none', cursor: 'pointer', textAlign: 'left',
                      borderRadius: 8, margin: '0 6px',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{
                      width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                      background: 'rgba(139,92,246,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <KeyRound size={16} style={{ color: '#a78bfa' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'hsl(40 10% 95%)', lineHeight: 1.2 }}>API Management</p>
                      <p style={{ fontSize: 11, color: 'hsl(240 5% 55%)', lineHeight: 1.3 }}>Manage your API keys</p>
                    </div>
                  </button>

                  {/* Divider */}
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '6px 0' }} />

                  {/* Logout */}
                  <button
                    onClick={() => { setAccountOpen(false); navigate('/') }}
                    style={{
                      width: 'calc(100% - 12px)', display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px', background: 'transparent',
                      border: 'none', cursor: 'pointer', textAlign: 'left',
                      borderRadius: 8, margin: '0 6px 6px',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{
                      width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                      background: 'rgba(248,113,113,0.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <LogOut size={16} style={{ color: '#f87171' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#f87171', lineHeight: 1.2 }}>Logout</p>
                      <p style={{ fontSize: 11, color: 'hsl(240 5% 55%)', lineHeight: 1.3 }}>Logout from account</p>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent', position: 'relative' }}>
          <Outlet />

          {/* ── SUSPENDED ACCOUNT OVERLAY ── */}
          {isSuspended && (
            <div style={{
              position: 'fixed', inset: 0, zIndex: 100,
              background: 'rgba(5, 2, 12, 0.85)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '1.5rem',
            }}>
              <div style={{
                maxWidth: 460, width: '100%', textAlign: 'center',
                background: 'hsl(260 60% 5%)',
                border: '1px solid rgba(251,146,60,0.3)',
                borderRadius: 20,
                padding: '2.5rem 2rem',
                boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
              }}>
                {/* Icon */}
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'rgba(251,146,60,0.12)',
                  border: '1px solid rgba(251,146,60,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                }}>
                  <ShieldOff size={28} style={{ color: '#fb923c' }} />
                </div>

                {/* Title */}
                <p style={{ fontSize: 20, fontWeight: 800, color: 'hsl(40 6% 94%)', marginBottom: 10 }}>
                  Account Suspended
                </p>

                {/* Description */}
                <p style={{ fontSize: 13, color: 'hsl(240 5% 55%)', lineHeight: 1.7, marginBottom: 8 }}>
                  Your account has been temporarily suspended due to suspicious activity, a policy violation, or an admin action.
                </p>
                <p style={{ fontSize: 13, color: 'hsl(240 5% 55%)', lineHeight: 1.7, marginBottom: 28 }}>
                  All platform features are disabled during this period. If you believe this is a mistake, please contact our support team for assistance.
                </p>

                {/* Status pill */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '6px 14px', borderRadius: 999,
                  background: 'rgba(251,146,60,0.1)',
                  border: '1px solid rgba(251,146,60,0.3)',
                  marginBottom: 28,
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fb923c', display: 'inline-block' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#fb923c', letterSpacing: '0.04em' }}>ACCOUNT SUSPENDED</span>
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => navigate('/dashboard/settings/support')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7,
                      padding: '10px 20px', borderRadius: 10,
                      background: 'rgba(167,139,250,0.12)',
                      border: '1px solid rgba(167,139,250,0.28)',
                      color: '#a78bfa', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    <HeadphonesIcon size={14} /> Contact Support
                  </button>
                  <button
                    onClick={() => logout()}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7,
                      padding: '10px 20px', borderRadius: 10,
                      background: 'rgba(248,113,113,0.1)',
                      border: '1px solid rgba(248,113,113,0.25)',
                      color: '#f87171', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── PENDING ACCOUNT OVERLAY ── */}
          {isPending && (
            <div style={{
              position: 'fixed', inset: 0, zIndex: 100,
              background: 'rgba(5, 2, 12, 0.82)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '1.5rem',
            }}>
              <div style={{
                maxWidth: 440, width: '100%', textAlign: 'center',
                background: 'hsl(260 60% 5%)',
                border: '1px solid rgba(245,158,11,0.25)',
                borderRadius: 20,
                padding: '2.5rem 2rem',
                boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
              }}>
                {/* Icon */}
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'rgba(245,158,11,0.12)',
                  border: '1px solid rgba(245,158,11,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                }}>
                  <Clock size={28} style={{ color: '#f59e0b' }} />
                </div>

                {/* Title */}
                <p style={{ fontSize: 20, fontWeight: 800, color: 'hsl(40 6% 94%)', marginBottom: 10 }}>
                  Account Pending Review
                </p>

                {/* Description */}
                <p style={{ fontSize: 13, color: 'hsl(240 5% 55%)', lineHeight: 1.7, marginBottom: 8 }}>
                  Your account is currently under review by our team. During this time all platform features are temporarily restricted.
                </p>
                <p style={{ fontSize: 13, color: 'hsl(240 5% 55%)', lineHeight: 1.7, marginBottom: 28 }}>
                  You will be notified once your account has been approved and access is fully restored.
                </p>

                {/* Status pill */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '6px 14px', borderRadius: 999,
                  background: 'rgba(245,158,11,0.1)',
                  border: '1px solid rgba(245,158,11,0.25)',
                  marginBottom: 28,
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f59e0b', animation: 'liveBlink 1.4s ease-in-out infinite', display: 'inline-block' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', letterSpacing: '0.04em' }}>PENDING APPROVAL</span>
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => navigate('/dashboard/settings/support')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7,
                      padding: '10px 20px', borderRadius: 10,
                      background: 'rgba(167,139,250,0.12)',
                      border: '1px solid rgba(167,139,250,0.28)',
                      color: '#a78bfa', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    <HeadphonesIcon size={14} /> Contact Support
                  </button>
                  <button
                    onClick={() => logout()}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7,
                      padding: '10px 20px', borderRadius: 10,
                      background: 'rgba(248,113,113,0.1)',
                      border: '1px solid rgba(248,113,113,0.25)',
                      color: '#f87171', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
