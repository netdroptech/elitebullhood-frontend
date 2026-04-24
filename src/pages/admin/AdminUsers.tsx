import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, ChevronRight, ChevronUp, ChevronDown, RefreshCw } from 'lucide-react'
import { adminApi } from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

interface RealUser {
  id:               string
  firstName:        string
  lastName:         string
  email:            string
  phone?:           string
  country?:         string
  status:           string
  kycStatus:        string
  plan:             string
  balance:          number
  totalDeposits:    number
  totalWithdrawals: number
  createdAt:        string
  lastLoginAt?:     string
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { c: string; bg: string; label: string }> = {
  ACTIVE:    { c: '#a78bfa', bg: 'rgba(167,139,250,0.12)',  label: 'Active' },
  PENDING:   { c: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  label: 'Pending' },
  SUSPENDED: { c: '#f87171', bg: 'rgba(248,113,113,0.12)', label: 'Suspended' },
  BANNED:    { c: '#f87171', bg: 'rgba(248,113,113,0.12)', label: 'Banned' },
}

const KYC_STYLES: Record<string, { c: string; bg: string; label: string }> = {
  APPROVED:      { c: '#a78bfa', bg: 'rgba(167,139,250,0.12)',   label: 'Approved' },
  PENDING:       { c: '#f59e0b', bg: 'rgba(245,158,11,0.12)',   label: 'Pending' },
  REJECTED:      { c: '#f87171', bg: 'rgba(248,113,113,0.12)',  label: 'Rejected' },
  NOT_SUBMITTED: { c: '#94a3b8', bg: 'rgba(148,163,184,0.1)',   label: 'None' },
}

const PLAN_COLORS: Record<string, string> = {
  ELITE: '#f59e0b', PREMIUM: '#a78bfa', STANDARD: '#60a5fa', FREE: '#94a3b8',
}

function formatLastSeen(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'Just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7)   return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

function initials(u: RealUser) {
  return `${u.firstName[0] ?? ''}${u.lastName[0] ?? ''}`.toUpperCase()
}

function avatarColor(email: string) {
  const colors = ['#a78bfa','#60a5fa','#a78bfa','#f59e0b','#f87171','#a78bfa']
  let h = 0
  for (const c of email) h = (h * 31 + c.charCodeAt(0)) & 0xffff
  return colors[h % colors.length]
}

type SortKey = 'name' | 'balance' | 'totalDeposits' | 'createdAt'

const filterBtnStyle = (active: boolean): React.CSSProperties => ({
  padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer',
  border: active ? '1px solid rgba(167,139,250,0.35)' : '1px solid rgba(255,255,255,0.08)',
  background: active ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.03)',
  color: active ? '#c4b5fd' : 'hsl(240 5% 55%)',
  transition: 'all 0.13s',
})

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminUsers() {
  const navigate = useNavigate()

  const [users,    setUsers]    = useState<RealUser[]>([])
  const [total,    setTotal]    = useState(0)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  const [search,        setSearch]        = useState('')
  const [statusFilter,  setStatusFilter]  = useState('ALL')
  const [kycFilter,     setKycFilter]     = useState('ALL')
  const [sortKey,       setSortKey]       = useState<SortKey>('createdAt')
  const [sortAsc,       setSortAsc]       = useState(false)
  const [page,          setPage]          = useState(1)
  const PER_PAGE = 15

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        page:  String(page),
        limit: String(PER_PAGE),
        ...(search       ? { search }              : {}),
        ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
        ...(kycFilter    !== 'ALL' ? { kycStatus: kycFilter } : {}),
      })
      const res = await adminApi.get<{ success: boolean; data: RealUser[]; meta: { total: number } }>(`/admin/users?${params}`)
      setUsers(res.data)
      setTotal(res.meta.total)
    } catch (err: any) {
      setError(err.message ?? 'Failed to load users.')
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, kycFilter])

  useEffect(() => { load() }, [load])

  // Auto-refresh every 10 s so balances stay current as trades resolve on the
  // server (open/win/loss all mutate users.balance in real time).
  useEffect(() => {
    const id = setInterval(() => load(), 10_000)
    return () => clearInterval(id)
  }, [load])

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(a => !a)
    else { setSortKey(key); setSortAsc(false) }
  }

  // Client-side sort of current page
  const sorted = [...users].sort((a, b) => {
    let diff = 0
    if (sortKey === 'name')          diff = `${a.firstName}${a.lastName}`.localeCompare(`${b.firstName}${b.lastName}`)
    if (sortKey === 'balance')       diff = a.balance - b.balance
    if (sortKey === 'totalDeposits') diff = a.totalDeposits - b.totalDeposits
    if (sortKey === 'createdAt')     diff = a.createdAt.localeCompare(b.createdAt)
    return sortAsc ? diff : -diff
  })

  const totalPages = Math.ceil(total / PER_PAGE)

  const SortIcon = ({ k }: { k: SortKey }) => sortKey === k
    ? (sortAsc ? <ChevronUp size={11} style={{ color: '#a78bfa' }} /> : <ChevronDown size={11} style={{ color: '#a78bfa' }} />)
    : <ChevronDown size={11} style={{ opacity: 0.2 }} />

  return (
    <div style={{ padding: '20px 16px 40px' }} className="md:p-8">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'hsl(40 10% 96%)' }}>All Users</h1>
          <p style={{ fontSize: 13, color: 'hsl(240 5% 50%)', marginTop: 3 }}>{total} total registered users</p>
        </div>
        <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'hsl(240 5% 55%)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'hsl(240 5% 42%)', pointerEvents: 'none' }} />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search name, email…" style={{ width: '100%', height: 36, paddingLeft: 30, paddingRight: 10, borderRadius: 8, fontSize: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'hsl(40 6% 88%)', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <Filter size={13} style={{ color: 'hsl(240 5% 42%)', flexShrink: 0 }} />
          {['ALL','ACTIVE','PENDING','SUSPENDED'].map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1) }} style={filterBtnStyle(statusFilter === s)}>
              {s === 'ALL' ? 'All Status' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.08)' }} />
          {['ALL','APPROVED','PENDING','REJECTED','NOT_SUBMITTED'].map(k => (
            <button key={k} onClick={() => { setKycFilter(k); setPage(1) }} style={filterBtnStyle(kycFilter === k)}>
              {k === 'ALL' ? 'All KYC' : k === 'NOT_SUBMITTED' ? 'No KYC' : 'KYC ' + k.charAt(0) + k.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ color: '#f87171', fontSize: 13 }}>{error}</p>
          <button onClick={load} style={{ fontSize: 11, color: '#f87171', background: 'none', border: 'none', cursor: 'pointer' }}>Retry</button>
        </div>
      )}

      {/* Table */}
      <div style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ width: 28, height: 28, border: '3px solid rgba(167,139,250,0.3)', borderTopColor: '#a78bfa', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ color: 'hsl(240 5% 50%)', fontSize: 13 }}>Loading users…</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 750 }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.025)' }}>
                  {[
                    { label: 'USER',           key: 'name'          as SortKey },
                    { label: 'COUNTRY',        key: null },
                    { label: 'STATUS',         key: null },
                    { label: 'KYC',            key: null },
                    { label: 'PLAN',           key: null },
                    { label: 'BALANCE',        key: 'balance'       as SortKey },
                    { label: 'TOTAL DEPOSITS', key: 'totalDeposits' as SortKey },
                    { label: 'JOINED',         key: 'createdAt'     as SortKey },
                    { label: 'LAST SEEN',      key: null },
                    { label: '',               key: null },
                  ].map((col, i) => (
                    <th key={i} onClick={() => col.key && handleSort(col.key as SortKey)}
                      style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'hsl(240 5% 42%)', letterSpacing: '0.07em', whiteSpace: 'nowrap', cursor: col.key ? 'pointer' : 'default', userSelect: 'none' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {col.label}
                        {col.key && <SortIcon k={col.key as SortKey} />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map(u => {
                  const ss  = STATUS_STYLES[u.status]  ?? { c: '#94a3b8', bg: 'rgba(148,163,184,0.1)', label: u.status }
                  const ks  = KYC_STYLES[u.kycStatus]  ?? { c: '#94a3b8', bg: 'rgba(148,163,184,0.1)', label: u.kycStatus }
                  const col = avatarColor(u.email)
                  const ini = initials(u)
                  return (
                    <tr key={u.id} onClick={() => navigate(`/admin/users/${u.id}`)}
                      style={{ borderTop: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 9, background: `${col}20`, border: `1px solid ${col}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: col, flexShrink: 0 }}>{ini}</div>
                          <div>
                            <p style={{ fontSize: 12.5, fontWeight: 700, color: 'hsl(40 6% 88%)', whiteSpace: 'nowrap' }}>{u.firstName} {u.lastName}</p>
                            <p style={{ fontSize: 11, color: 'hsl(240 5% 46%)' }}>{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: 12, color: 'hsl(240 5% 55%)', whiteSpace: 'nowrap' }}>{u.country || '—'}</td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 9px', borderRadius: 6, background: ss.bg, color: ss.c }}>{ss.label}</span>
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 9px', borderRadius: 6, background: ks.bg, color: ks.c }}>{ks.label}</span>
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: PLAN_COLORS[u.plan] || '#94a3b8' }}>{u.plan}</span>
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: 12.5, fontWeight: 700, color: '#a78bfa', whiteSpace: 'nowrap' }}>${Number(u.balance).toLocaleString()}</td>
                      <td style={{ padding: '11px 14px', fontSize: 12, color: 'hsl(240 5% 60%)', whiteSpace: 'nowrap' }}>${Number(u.totalDeposits).toLocaleString()}</td>
                      <td style={{ padding: '11px 14px', fontSize: 11, color: 'hsl(240 5% 48%)', whiteSpace: 'nowrap' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '11px 14px', fontSize: 11, color: u.lastLoginAt ? 'hsl(240 5% 55%)' : 'hsl(240 5% 35%)', whiteSpace: 'nowrap' }}>
                        {u.lastLoginAt ? formatLastSeen(u.lastLoginAt) : 'Never'}
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <button onClick={e => { e.stopPropagation(); navigate(`/admin/users/${u.id}`) }}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.25)', color: '#c4b5fd', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          Manage <ChevronRight size={11} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {sorted.length === 0 && !loading && (
                  <tr>
                    <td colSpan={10} style={{ padding: '48px', textAlign: 'center', fontSize: 13, color: 'hsl(240 5% 44%)' }}>
                      {search || statusFilter !== 'ALL' || kycFilter !== 'ALL' ? 'No users match your filters.' : 'No users registered yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap', gap: 10 }}>
            <p style={{ fontSize: 12, color: 'hsl(240 5% 48%)' }}>
              Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, total)} of {total}
            </p>
            <div style={{ display: 'flex', gap: 6 }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} style={{ width: 30, height: 30, borderRadius: 7, border: page === p ? '1px solid rgba(167,139,250,0.4)' : '1px solid rgba(255,255,255,0.08)', background: page === p ? 'rgba(167,139,250,0.18)' : 'rgba(255,255,255,0.03)', color: page === p ? '#c4b5fd' : 'hsl(240 5% 55%)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
