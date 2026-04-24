import { useState, useRef, useEffect, useCallback } from 'react'
import { usePlatformName } from '@/context/PlatformNameContext'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, ArrowDownCircle, ArrowUpCircle,
  ShieldCheck, Bell, LogOut, Menu, X,
  TrendingUp, FileText, Sliders, AlertTriangle,
  PanelLeftClose, PanelLeftOpen, Building2, Wallet, Copy, History,
  Send, Loader2, Repeat, UserSquare, Activity,
} from 'lucide-react'
import { adminApi } from '@/lib/api'

const SIDEBAR_FULL  = 248
const SIDEBAR_ICONS = 64

// Nav structure — counts are injected dynamically from real API data
const buildNav = (counts: { totalUsers: number; pendingKYC: number; suspended: number }) => [
  { section: 'OVERVIEW', items: [
    { label: 'Dashboard',        path: '/admin',             icon: LayoutDashboard, exact: true },
    { label: 'Analytics',        path: '/admin/analytics',   icon: TrendingUp },
  ]},
  { section: 'USER MANAGEMENT', items: [
    { label: 'All Users',        path: '/admin/users',       icon: Users,         count: counts.totalUsers },
    { label: 'KYC Verification', path: '/admin/kyc',         icon: ShieldCheck,   count: counts.pendingKYC,  color: '#f59e0b' },
    { label: 'Suspensions',      path: '/admin/suspensions', icon: AlertTriangle, count: counts.suspended,   color: '#f87171' },
  ]},
  { section: 'FINANCES', items: [
    { label: 'Deposits',         path: '/admin/deposits',      icon: ArrowDownCircle },
    { label: 'Withdrawals',      path: '/admin/withdrawals',   icon: ArrowUpCircle },
    { label: 'Transactions',     path: '/admin/transactions',  icon: FileText },
    { label: 'Auto Deposit',     path: '/admin/auto-deposit',  icon: Repeat },
  ]},
  { section: 'REAL ESTATE', items: [
    { label: 'Property Listings',    path: '/admin/properties',           icon: Building2 },
    { label: 'Property Investments', path: '/admin/property-investments', icon: Building2 },
  ]},
  { section: 'FINANCE', items: [
    { label: 'Update Wallet',     path: '/admin/wallets',     icon: Wallet },
  ]},
  { section: 'TRADING', items: [
    { label: 'Trade History',      path: '/admin/trades',             icon: Activity },
    { label: 'Copy Traders',       path: '/admin/copy-traders',       icon: Copy },
    { label: 'Copy History',       path: '/admin/copy-history',       icon: History },
    { label: 'Investment Plans',   path: '/admin/investment-plans',   icon: TrendingUp },
  ]},
  { section: 'PLATFORM', items: [
    { label: 'Notifications',    path: '/admin/notifications', icon: Send        },
    { label: 'Leadership Team',  path: '/admin/team',          icon: UserSquare  },
    { label: 'System Settings',  path: '/admin/settings',      icon: Sliders     },
  ]},
]

export function AdminLayout() {
  const { platformName } = usePlatformName()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed,  setCollapsed]  = useState(false)
  const [notifOpen,  setNotifOpen]  = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // Real counts for navbar badges
  const [navCounts, setNavCounts] = useState({ totalUsers: 0, pendingKYC: 0, suspended: 0 })

  const adminName  = localStorage.getItem('apex_admin_name')  || 'Admin'
  const adminEmail = localStorage.getItem('apex_admin_email') || ''
  const adminInitials = adminName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || 'AD'

  // Real activity feed for the bell
  const [activity,     setActivity]     = useState<any[]>([])
  const [urgentCount,  setUrgentCount]  = useState(0)
  const [actLoading,   setActLoading]   = useState(false)

  // Fetch real stats for sidebar badges
  useEffect(() => {
    adminApi.get<{ success: boolean; data: { totalUsers: number; pendingKYC: number; suspendedUsers: number } }>('/admin/stats')
      .then(res => {
        setNavCounts({
          totalUsers: res.data.totalUsers,
          pendingKYC: res.data.pendingKYC,
          suspended:  res.data.suspendedUsers,
        })
      })
      .catch(() => {/* silently ignore — badges just show 0 */})
  }, [])

  const fetchActivity = useCallback(async () => {
    setActLoading(true)
    try {
      const res = await adminApi.get<{ success: boolean; data: { items: any[]; urgentCount: number } }>('/admin/activity')
      setActivity(res.data.items)
      setUrgentCount(res.data.urgentCount)
    } catch { /* silent */ }
    finally { setActLoading(false) }
  }, [])

  // Load on mount, reload when bell opens
  useEffect(() => { fetchActivity() }, [fetchActivity])
  useEffect(() => { if (notifOpen) fetchActivity() }, [notifOpen, fetchActivity])

  const ADMIN_NAV = buildNav(navCounts)

  useEffect(() => {
    function h(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const sidebarW   = collapsed ? SIDEBAR_ICONS : SIDEBAR_FULL
  const pendingCount = urgentCount

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: 'hsl(260 87% 3%)',
      color: 'hsl(40 6% 90%)',
      overflow: 'hidden',
      fontFamily: "'Geist Sans','Inter',system-ui,sans-serif",
    }}>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.65)' }}
          className="md:hidden"
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: sidebarW,
        flexShrink: 0,
        background: 'hsl(260 87% 2%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0, left: 0, height: '100%',
        zIndex: 50,
        /* mobile: slide in/out; desktop: always visible */
        transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'width 0.22s ease, transform 0.25s ease',
        overflow: 'hidden',
      }}
        /* on md+ always show */
        className="md:!translate-x-0"
      >

        {/* ── Logo row + collapse toggle ── */}
        <div style={{
          padding: collapsed ? '16px 0' : '16px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: 8,
          flexShrink: 0,
          minHeight: 64,
        }}>
          {/* Logo (hide text when collapsed) */}
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ShieldCheck size={17} style={{ color: '#fff' }} />
              </div>
              <div style={{ overflow: 'hidden' }}>
                <p style={{ fontSize: 14, fontWeight: 800, color: '#fff', lineHeight: 1.1, whiteSpace: 'nowrap' }}>{platformName} Admin</p>
                <p style={{ fontSize: 10, color: '#a78bfa', fontWeight: 600, whiteSpace: 'nowrap' }}>Control Panel</p>
              </div>
            </div>
          )}

          {/* Collapse toggle (desktop) */}
          <button
            onClick={() => setCollapsed(v => !v)}
            className="hidden md:flex"
            style={{
              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
              background: 'rgba(167,139,250,0.1)',
              border: '1px solid rgba(167,139,250,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#a78bfa',
              transition: 'background 0.15s',
            }}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed
              ? <PanelLeftOpen  size={15} />
              : <PanelLeftClose size={15} />
            }
          </button>

          {/* Mobile close */}
          <button onClick={() => setMobileOpen(false)} className="md:hidden" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 50%)', padding: 4 }}>
            <X size={16} />
          </button>
        </div>

        {/* Admin badge (hidden when collapsed) */}
        {!collapsed && (
          <div style={{ margin: '10px 12px', padding: '10px 12px', borderRadius: 10, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{adminInitials}</div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'hsl(40 10% 94%)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{adminName}</p>
              <p style={{ fontSize: 10, color: '#a78bfa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{adminEmail}</p>
            </div>
          </div>
        )}

        {/* Collapsed avatar */}
        {collapsed && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0', flexShrink: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff' }}>{adminInitials}</div>
          </div>
        )}

        {/* ── Nav ── */}
        <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: collapsed ? '4px 0 16px' : '4px 10px 16px', scrollbarWidth: 'none' }}>
          {ADMIN_NAV.map(group => (
            <div key={group.section} style={{ marginBottom: collapsed ? 8 : 18 }}>
              {/* Section label — hide when collapsed */}
              {!collapsed && (
                <p style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.1em', color: 'hsl(240 5% 38%)', padding: '0 8px', marginBottom: 5, whiteSpace: 'nowrap' }}>{group.section}</p>
              )}
              {collapsed && <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '4px 10px 6px' }} />}

              {group.items.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={'exact' in item ? (item as { exact?: boolean }).exact : undefined}
                  onClick={() => setMobileOpen(false)}
                  title={collapsed ? item.label : undefined}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    gap: collapsed ? 0 : 9,
                    padding: collapsed ? '9px 0' : '8px 10px',
                    margin: collapsed ? '0 10px 2px' : '0 0 2px',
                    borderRadius: 8,
                    textDecoration: 'none',
                    fontSize: 12.5, fontWeight: 500,
                    background: isActive ? 'rgba(167,139,250,0.18)' : 'transparent',
                    color: isActive ? '#c4b5fd' : 'hsl(240 5% 58%)',
                    transition: 'all 0.13s',
                    position: 'relative',
                  })}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon size={collapsed ? 17 : 14} style={{ flexShrink: 0 }} />
                      {!collapsed && (
                        <>
                          <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
                          {'count' in item && item.count !== undefined && item.count > 0 && (
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 999, background: (item as any).color ? `${(item as any).color}20` : 'rgba(167,139,250,0.2)', color: (item as any).color || '#a78bfa', flexShrink: 0 }}>
                              {item.count}
                            </span>
                          )}
                        </>
                      )}
                      {/* Collapsed badge dot */}
                      {collapsed && 'count' in item && item.count !== undefined && item.count > 0 && (
                        <span style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: '50%', background: (item as any).color || '#a78bfa', border: '1.5px solid hsl(260 87% 2%)' }} />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer buttons */}
        <div style={{ padding: collapsed ? '10px 10px' : '10px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
          <button
            onClick={() => {
              localStorage.removeItem('apex_admin_session')
              localStorage.removeItem('apex_admin_email')
              navigate('/admin/login')
            }}
            title={collapsed ? 'Sign Out' : undefined}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: 8, padding: collapsed ? '9px 0' : '8px 10px', borderRadius: 8, background: 'rgba(248,113,113,0.07)', border: 'none', cursor: 'pointer', color: '#f87171', fontSize: 12, fontWeight: 600 }}
          >
            <LogOut size={13} style={{ flexShrink: 0 }} />
            {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        /* Always offset by sidebar width on md+; 0 on mobile (sidebar overlays) */
        marginLeft: 0,
        transition: 'margin-left 0.22s ease',
      }}
        /* Use a CSS custom property set via a style tag below */
        className="admin-main"
      >
        {/* Top bar */}
        <header style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 0 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, background: 'hsl(260 87% 2.5%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Mobile hamburger */}
            <button onClick={() => setMobileOpen(true)} className="md:hidden" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 55%)', padding: 4, display: 'flex', alignItems: 'center' }}>
              <Menu size={18} />
            </button>
            {/* Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: '#a78bfa', fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'rgba(167,139,250,0.12)' }}>ADMIN</span>
              <span style={{ fontSize: 11, color: 'hsl(240 5% 40%)' }}>/</span>
              <span style={{ fontSize: 12, color: 'hsl(40 6% 75%)', fontWeight: 500 }}>Control Panel</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Live pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 20, background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.15)' }} className="hidden sm:flex">
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa', display: 'inline-block', animation: 'adminPulse 1.5s ease-in-out infinite' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa' }}>LIVE</span>
            </div>

            {/* Notifications */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button onClick={() => setNotifOpen(v => !v)} style={{ position: 'relative', width: 34, height: 34, borderRadius: 8, background: notifOpen ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'hsl(240 5% 60%)' }}>
                <Bell size={15} />
                {pendingCount > 0 && <span style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: '50%', background: '#ef4444', border: '1.5px solid hsl(260 87% 2.5%)' }} />}
              </button>
              {notifOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 'min(320px, calc(100vw - 24px))', borderRadius: 12, background: 'hsl(260 87% 5%)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 16px 40px rgba(0,0,0,0.5)', zIndex: 200, overflow: 'hidden', animation: 'adminDropIn 0.15s ease' }}>
                  {/* Header */}
                  <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'hsl(40 10% 94%)' }}>Admin Alerts</p>
                    {urgentCount > 0 && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
                        {urgentCount} urgent
                      </span>
                    )}
                  </div>

                  {/* Activity list */}
                  <div style={{ maxHeight: 300, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.06) transparent' }}>
                    {actLoading ? (
                      <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
                        <Loader2 size={16} style={{ color: '#a78bfa', animation: 'spin 1s linear infinite' }} />
                      </div>
                    ) : activity.length === 0 ? (
                      <p style={{ fontSize: 12, color: 'hsl(240 5% 45%)', textAlign: 'center', padding: '20px 14px' }}>
                        No pending activity
                      </p>
                    ) : (
                      activity.map((n: any) => (
                        <div
                          key={n.id}
                          onClick={() => { navigate(n.link); setNotifOpen(false) }}
                          style={{ display: 'flex', gap: 10, padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'background 0.12s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.dot, flexShrink: 0, marginTop: 4 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 12, fontWeight: 700, color: 'hsl(40 10% 92%)', marginBottom: 1 }}>{n.title}</p>
                            <p style={{ fontSize: 11, color: 'hsl(240 5% 52%)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {n.body} · {new Date(n.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  <div style={{ padding: '8px 14px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => { navigate('/admin/transactions'); setNotifOpen(false) }}
                      style={{ flex: 1, padding: '7px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', fontSize: 11, fontWeight: 600, color: 'hsl(240 5% 52%)', cursor: 'pointer' }}
                    >
                      Transactions
                    </button>
                    <button
                      onClick={() => { navigate('/admin/notifications'); setNotifOpen(false) }}
                      style={{ flex: 1, padding: '7px', borderRadius: 7, border: '1px solid rgba(167,139,250,0.2)', background: 'rgba(167,139,250,0.06)', fontSize: 11, fontWeight: 600, color: '#a78bfa', cursor: 'pointer' }}
                    >
                      Send Alert
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Admin avatar */}
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', cursor: 'pointer', flexShrink: 0 }}>{adminInitials}</div>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}>
          <Outlet />
        </main>
      </div>

      {/* Dynamic margin injection — keeps main content clear of sidebar */}
      <style>{`
        @media (min-width: 768px) {
          .admin-main { margin-left: ${sidebarW}px !important; }
        }
        @keyframes adminPulse   { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes adminDropIn  { from{opacity:0;transform:translateY(-5px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin         { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  )
}
