/**
 * WalletBottomNav — shared bottom navigation used by Holding / Mining / Staking
 * and the main Trading dashboard.  Matches the IQCrest-style 4-tab layout.
 */
import { useNavigate, useLocation } from 'react-router-dom'
import { BarChart3, Wallet, Server, Database } from 'lucide-react'

const ITEMS: { label: string; path: string; icon: typeof BarChart3 }[] = [
  { label: 'Trading', path: '/dashboard/trade',   icon: BarChart3 },
  { label: 'Holding', path: '/dashboard/holding', icon: Wallet },
  { label: 'Mining',  path: '/dashboard/mining',  icon: Server },
  { label: 'Staking', path: '/dashboard/staking', icon: Database },
]

export function WalletBottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <div style={{
      display: 'flex', alignItems: 'stretch', justifyContent: 'space-around',
      borderTop: '1px solid rgba(255,255,255,0.07)',
      background: 'hsl(260 87% 4%)',
      padding: '8px 4px 12px',
      flexShrink: 0,
      position: 'sticky', bottom: 0, zIndex: 10,
    }}>
      {ITEMS.map(item => {
        const Icon = item.icon
        // Active match: exact path, or pathname starts with the item path + '/'
        const active = pathname === item.path || pathname.startsWith(item.path + '/')
        return (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
              padding: '6px 4px', borderRadius: 8, cursor: 'pointer',
              background: 'transparent', border: 'none',
              color: active ? '#c4b5fd' : 'hsl(240 5% 55%)',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'hsl(40 6% 85%)' }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'hsl(240 5% 55%)' }}
          >
            <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.02em' }}>{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}
