import { useState, useEffect, useCallback, useRef } from 'react'
import { adminApi } from '@/lib/api'
import { Plus, Pencil, Trash2, Play, Pause, RefreshCw, Clock, Zap, Users, DollarSign, X, ChevronDown, Search } from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────────────────────
interface AutoDeposit {
  id: string
  userId: string
  userName: string
  userEmail: string
  userBalance: number
  amount: number
  intervalMinutes: number
  intervalLabel: string
  isActive: boolean
  maxRuns: number | null
  totalRuns: number
  lastRunAt: string | null
  nextRunAt: string | null
  notes: string | null
  createdAt: string
}

interface UserOption {
  id: string
  fullName: string
  email: string
  balance: number
}

interface Stats {
  totalRules: string
  activeRules: string
  pausedRules: string
  totalAmountPerCycle: number
  totalDeposited: number
  totalRunsAll: string
}

// ─── Interval presets ─────────────────────────────────────────────────────────
const INTERVALS = [
  { label: '30 Minutes',  minutes: 30 },
  { label: '1 Hour',      minutes: 60 },
  { label: '2 Hours',     minutes: 120 },
  { label: '6 Hours',     minutes: 360 },
  { label: '12 Hours',    minutes: 720 },
  { label: '1 Day',       minutes: 1440 },
  { label: '2 Days',      minutes: 2880 },
  { label: '3 Days',      minutes: 4320 },
  { label: '1 Week',      minutes: 10080 },
  { label: '2 Weeks',     minutes: 20160 },
  { label: '1 Month',     minutes: 43200 },
]

const fmt = (n: number) =>
  `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const timeAgo = (iso: string | null) => {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}

const timeUntil = (iso: string | null) => {
  if (!iso) return '—'
  const diff = new Date(iso).getTime() - Date.now()
  if (diff <= 0) return 'soon'
  if (diff < 60000) return `${Math.floor(diff / 1000)}s`
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ${Math.floor((diff % 3600000) / 60000)}m`
  return `${Math.floor(diff / 86400000)}d`
}

// ─── Shared styles ─────────────────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: 'hsl(240 6% 9%)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 14,
  padding: '1.5rem',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  padding: '9px 12px',
  color: 'hsl(40 6% 90%)',
  fontSize: 13,
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: 'hsl(240 5% 55%)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 5,
  display: 'block',
}

// ─── Modal component ───────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
    }}>
      <div style={{
        width: '100%', maxWidth: 520,
        background: 'hsl(240 6% 9%)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 18,
        boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
        overflow: 'visible',
      }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '18px 18px 0 0', background: 'hsl(240 6% 9%)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'hsl(40 10% 94%)' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 50%)', padding: 4, display: 'flex' }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: '1.5rem', borderRadius: '0 0 18px 18px', background: 'hsl(240 6% 9%)', overflow: 'visible' }}>{children}</div>
      </div>
    </div>
  )
}

// ─── Rule Form (shared for Add + Edit) ───────────────────────────────────────
function RuleForm({
  users, initial, saving, onSave, onClose,
}: {
  users: UserOption[]
  initial?: Partial<AutoDeposit>
  saving: boolean
  onSave: (data: any) => void
  onClose: () => void
}) {
  const [userId,      setUserId]      = useState(initial?.userId || '')
  const [amount,      setAmount]      = useState(initial?.amount?.toString() || '')
  const [interval,    setInterval]    = useState<{ label: string; minutes: number }>(
    INTERVALS.find(i => i.minutes === initial?.intervalMinutes) || INTERVALS[5]
  )
  const [maxRuns,     setMaxRuns]     = useState(initial?.maxRuns?.toString() || '')
  const [notes,       setNotes]       = useState(initial?.notes || '')
  const [userSearch,  setUserSearch]  = useState('')
  const [dropOpen,    setDropOpen]    = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (dropOpen) setTimeout(() => searchRef.current?.focus(), 0)
  }, [dropOpen])

  const selectedUser = users.find(u => u.id === userId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      userId,
      amount:          Number(amount),
      intervalMinutes: interval.minutes,
      intervalLabel:   interval.label,
      maxRuns:         maxRuns ? Number(maxRuns) : null,
      notes:           notes || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* User */}
      <div>
        <label style={labelStyle}>User</label>
        {initial?.userId ? (
          /* Edit mode — read-only */
          <div style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed', display: 'flex', alignItems: 'center' }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedUser ? `${selectedUser.fullName} — ${selectedUser.email}` : userId}
            </span>
          </div>
        ) : (
          /* Add mode — searchable picker */
          <div style={{ position: 'relative' }}>
            {/* Transparent backdrop — closes dropdown when clicking outside */}
            {dropOpen && (
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 998 }}
                onClick={() => setDropOpen(false)}
              />
            )}

            {/* Trigger */}
            <div
              onClick={() => { setDropOpen(v => !v); setUserSearch('') }}
              style={{ ...inputStyle, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none', position: 'relative', zIndex: dropOpen ? 1000 : 1 }}
            >
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: userId ? 'hsl(40 6% 92%)' : 'hsl(240 5% 50%)' }}>
                {selectedUser ? `${selectedUser.fullName} — ${selectedUser.email}` : 'Select a user…'}
              </span>
              <ChevronDown size={13} style={{ color: 'hsl(240 5% 50%)', flexShrink: 0, transition: 'transform 0.15s', transform: dropOpen ? 'rotate(180deg)' : 'none' }} />
            </div>

            {/* Dropdown */}
            {dropOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 1000,
                background: 'hsl(240 6% 9%)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '0.5rem', boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              }}>
                {/* Search */}
                <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Search size={13} style={{ color: 'hsl(240 5% 50%)', flexShrink: 0 }} />
                  <input
                    ref={searchRef}
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    placeholder="Search by name or email…"
                    style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'hsl(40 6% 92%)', fontSize: 12, fontFamily: 'inherit' }}
                  />
                  {userSearch && (
                    <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => setUserSearch('')} style={{ background: 'none', border: 'none', color: 'hsl(240 5% 50%)', cursor: 'pointer', padding: 0, display: 'flex' }}>
                      <X size={11} />
                    </button>
                  )}
                </div>

                {/* List */}
                <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                  {users.length === 0 ? (
                    <div style={{ padding: '14px 12px', fontSize: 12, color: 'hsl(240 5% 50%)', textAlign: 'center' }}>
                      Loading users…
                    </div>
                  ) : (() => {
                    const q = userSearch.toLowerCase().trim()
                    const filtered = q
                      ? users.filter(u => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
                      : users
                    if (filtered.length === 0) {
                      return <div style={{ padding: '14px 12px', fontSize: 12, color: 'hsl(240 5% 50%)', textAlign: 'center' }}>No users match "{userSearch}"</div>
                    }
                    return filtered.map(u => (
                      <div
                        key={u.id}
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => { setUserId(u.id); setDropOpen(false); setUserSearch('') }}
                        style={{
                          padding: '9px 12px', cursor: 'pointer',
                          background: userId === u.id ? 'rgba(167,139,250,0.08)' : 'transparent',
                          borderLeft: userId === u.id ? '2px solid #a78bfa' : '2px solid transparent',
                        }}
                        onMouseEnter={e => { if (userId !== u.id) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                        onMouseLeave={e => { if (userId !== u.id) e.currentTarget.style.background = userId === u.id ? 'rgba(167,139,250,0.08)' : 'transparent' }}
                      >
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'hsl(40 6% 90%)' }}>{u.fullName}</p>
                        <p style={{ margin: 0, fontSize: 11, color: 'hsl(240 5% 55%)', marginTop: 1 }}>{u.email} · Balance: {fmt(u.balance)}</p>
                      </div>
                    ))
                  })()}
                </div>
              </div>
            )}
          </div>
        )}
        {selectedUser && !initial?.userId && (
          <p style={{ fontSize: 11, color: '#a78bfa', marginTop: 4 }}>
            Current balance: {fmt(selectedUser.balance)}
          </p>
        )}
      </div>

      {/* Amount */}
      <div>
        <label style={labelStyle}>Deposit Amount (USD)</label>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#a78bfa', fontWeight: 700, fontSize: 13 }}>$</span>
          <input
            required
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
            style={{ ...inputStyle, paddingLeft: 22 }}
          />
        </div>
      </div>

      {/* Interval */}
      <div>
        <label style={labelStyle}>Deposit Interval</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {INTERVALS.map(i => (
            <button
              key={i.minutes}
              type="button"
              onClick={() => setInterval(i)}
              style={{
                padding: '7px 0',
                borderRadius: 8,
                border: interval.minutes === i.minutes
                  ? '1px solid rgba(167,139,250,0.6)'
                  : '1px solid rgba(255,255,255,0.1)',
                background: interval.minutes === i.minutes
                  ? 'rgba(167,139,250,0.12)'
                  : 'rgba(255,255,255,0.03)',
                color: interval.minutes === i.minutes ? '#a78bfa' : 'hsl(240 5% 60%)',
                fontSize: 11.5,
                fontWeight: interval.minutes === i.minutes ? 700 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {i.label}
            </button>
          ))}
        </div>
        <p style={{ fontSize: 11, color: 'hsl(240 5% 45%)', marginTop: 6 }}>
          Selected: <span style={{ color: '#a78bfa' }}>{interval.label}</span>
          {amount && ` — ${fmt(Number(amount))} every ${interval.label.toLowerCase()}`}
        </p>
      </div>

      {/* Max runs */}
      <div>
        <label style={labelStyle}>Max Runs (leave blank for unlimited)</label>
        <input
          type="number"
          min="1"
          step="1"
          value={maxRuns}
          onChange={e => setMaxRuns(e.target.value)}
          placeholder="Unlimited"
          style={inputStyle}
        />
      </div>

      {/* Notes */}
      <div>
        <label style={labelStyle}>Internal Notes</label>
        <textarea
          rows={2}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Optional note…"
          style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }}
        />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
        <button
          type="button"
          onClick={onClose}
          style={{ flex: 1, padding: '10px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'hsl(240 5% 60%)', fontSize: 13, cursor: 'pointer' }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          style={{ flex: 2, padding: '10px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}
        >
          {saving ? 'Saving…' : initial?.id ? 'Save Changes' : 'Create Rule'}
        </button>
      </div>
    </form>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export function AdminAutoDeposit() {
  const [rules,   setRules]   = useState<AutoDeposit[]>([])
  const [users,   setUsers]   = useState<UserOption[]>([])
  const [stats,   setStats]   = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  // Modals
  const [addOpen,    setAddOpen]    = useState(false)
  const [editTarget, setEditTarget] = useState<AutoDeposit | null>(null)
  const [delTarget,  setDelTarget]  = useState<AutoDeposit | null>(null)
  const [saving,     setSaving]     = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [rulesRes, statsRes, usersRes] = await Promise.all([
        adminApi.get<{ success: boolean; data: AutoDeposit[] }>('/admin/auto-deposits'),
        adminApi.get<{ success: boolean; data: Stats }>('/admin/auto-deposits/stats'),
        adminApi.get<{ success: boolean; data: UserOption[] }>('/admin/auto-deposits/users'),
      ])
      setRules(rulesRes.data ?? [])
      setStats(statsRes.data ?? null)
      setUsers(usersRes.data ?? [])
      setError('')
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load auto deposits.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleCreate = async (data: any) => {
    setSaving(true)
    try {
      const res = await adminApi.post<{ success: boolean; data: AutoDeposit }>('/admin/auto-deposits', data)
      setRules(prev => [res.data, ...prev])
      setAddOpen(false)
      load()
    } catch (e: any) { alert(e?.message ?? 'Failed to create rule.') }
    finally { setSaving(false) }
  }

  const handleUpdate = async (data: any) => {
    if (!editTarget) return
    setSaving(true)
    try {
      await adminApi.put(`/admin/auto-deposits/${editTarget.id}`, data)
      setEditTarget(null)
      load()
    } catch (e: any) { alert(e?.message ?? 'Failed to update rule.') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!delTarget) return
    setSaving(true)
    try {
      await adminApi.delete(`/admin/auto-deposits/${delTarget.id}`)
      setRules(prev => prev.filter(r => r.id !== delTarget.id))
      setDelTarget(null)
      load()
    } catch (e: any) { alert(e?.message ?? 'Failed to delete rule.') }
    finally { setSaving(false) }
  }

  const handleToggle = async (rule: AutoDeposit) => {
    try {
      await adminApi.patch(`/admin/auto-deposits/${rule.id}/toggle`, {})
      load()
    } catch (e: any) { alert(e?.message ?? 'Failed to toggle rule.') }
  }

  return (
    <div style={{ padding: '1.75rem 1.5rem', maxWidth: 1100, margin: '0 auto', fontFamily: "'Geist Sans','Inter',system-ui,sans-serif" }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'hsl(40 10% 94%)', marginBottom: 4 }}>Auto Deposit</h1>
          <p style={{ fontSize: 13, color: 'hsl(240 5% 50%)' }}>Schedule automatic deposits for users at custom intervals</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={load}
            title="Refresh"
            style={{ width: 36, height: 36, borderRadius: 9, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'hsl(240 5% 55%)' }}
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={() => setAddOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            <Plus size={14} /> New Rule
          </button>
        </div>
      </div>

      {/* Stats bar */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: '1.75rem' }}>
          {[
            { icon: <Zap size={14} />,        label: 'Active Rules',        value: stats.activeRules,                        color: '#a78bfa' },
            { icon: <Pause size={14} />,       label: 'Paused Rules',        value: stats.pausedRules,                        color: '#f59e0b' },
            { icon: <DollarSign size={14} />,  label: 'Per Cycle (Total)',   value: fmt(stats.totalAmountPerCycle),            color: '#60a5fa' },
            { icon: <RefreshCw size={14} />,   label: 'Total Runs',          value: Number(stats.totalRunsAll).toLocaleString(), color: '#c084fc' },
            { icon: <DollarSign size={14} />,  label: 'Total Deposited',     value: fmt(stats.totalDeposited),                color: '#a78bfa' },
          ].map(s => (
            <div key={s.label} style={{ ...card, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
                {s.icon}
              </div>
              <div>
                <p style={{ fontSize: 16, fontWeight: 800, color: 'hsl(40 10% 94%)' }}>{s.value}</p>
                <p style={{ fontSize: 10.5, color: 'hsl(240 5% 50%)' }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div style={card}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'hsl(240 5% 45%)', fontSize: 13 }}>Loading rules…</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: '#f87171', fontSize: 13 }}>{error}</div>
        ) : rules.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <Clock size={32} style={{ color: 'hsl(240 5% 30%)', margin: '0 auto 12px' }} />
            <p style={{ fontSize: 14, color: 'hsl(240 5% 45%)' }}>No auto-deposit rules yet</p>
            <p style={{ fontSize: 12, color: 'hsl(240 5% 35%)', marginTop: 4 }}>Create one to start automatically crediting users</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {['User', 'Amount', 'Interval', 'Runs', 'Next Run', 'Last Run', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '0 10px 12px', fontSize: 10.5, fontWeight: 700, color: 'hsl(240 5% 45%)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rules.map(rule => (
                  <tr
                    key={rule.id}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.12s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* User */}
                    <td style={{ padding: '13px 10px' }}>
                      <div style={{ fontWeight: 600, color: 'hsl(40 10% 90%)', marginBottom: 2 }}>{rule.userName}</div>
                      <div style={{ fontSize: 11, color: 'hsl(240 5% 45%)' }}>{rule.userEmail}</div>
                    </td>

                    {/* Amount */}
                    <td style={{ padding: '13px 10px' }}>
                      <span style={{ fontWeight: 800, color: '#a78bfa', fontSize: 14 }}>{fmt(rule.amount)}</span>
                    </td>

                    {/* Interval */}
                    <td style={{ padding: '13px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Clock size={12} style={{ color: '#60a5fa' }} />
                        <span style={{ color: 'hsl(40 6% 80%)' }}>{rule.intervalLabel}</span>
                      </div>
                    </td>

                    {/* Runs */}
                    <td style={{ padding: '13px 10px' }}>
                      <span style={{ color: 'hsl(40 6% 80%)' }}>{rule.totalRuns}</span>
                      {rule.maxRuns && (
                        <span style={{ color: 'hsl(240 5% 40%)', fontSize: 11 }}> / {rule.maxRuns}</span>
                      )}
                    </td>

                    {/* Next run */}
                    <td style={{ padding: '13px 10px', color: rule.isActive ? '#60a5fa' : 'hsl(240 5% 40%)', fontSize: 12 }}>
                      {rule.isActive ? timeUntil(rule.nextRunAt) : '—'}
                    </td>

                    {/* Last run */}
                    <td style={{ padding: '13px 10px', color: 'hsl(240 5% 48%)', fontSize: 12 }}>
                      {timeAgo(rule.lastRunAt)}
                    </td>

                    {/* Status badge */}
                    <td style={{ padding: '13px 10px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
                        background: rule.isActive ? 'rgba(167,139,250,0.15)' : 'rgba(245,158,11,0.15)',
                        color: rule.isActive ? '#a78bfa' : '#f59e0b',
                      }}>
                        {rule.isActive ? 'Active' : 'Paused'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '13px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button
                          title={rule.isActive ? 'Pause' : 'Resume'}
                          onClick={() => handleToggle(rule)}
                          style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${rule.isActive ? 'rgba(245,158,11,0.3)' : 'rgba(167,139,250,0.3)'}`, background: rule.isActive ? 'rgba(245,158,11,0.1)' : 'rgba(167,139,250,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: rule.isActive ? '#f59e0b' : '#a78bfa' }}
                        >
                          {rule.isActive ? <Pause size={12} /> : <Play size={12} />}
                        </button>
                        <button
                          title="Edit"
                          onClick={() => setEditTarget(rule)}
                          style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid rgba(96,165,250,0.3)', background: 'rgba(96,165,250,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#60a5fa' }}
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          title="Delete"
                          onClick={() => setDelTarget(rule)}
                          style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#f87171' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add modal ── */}
      {addOpen && (
        <Modal title="New Auto Deposit Rule" onClose={() => setAddOpen(false)}>
          <RuleForm users={users} saving={saving} onSave={handleCreate} onClose={() => setAddOpen(false)} />
        </Modal>
      )}

      {/* ── Edit modal ── */}
      {editTarget && (
        <Modal title="Edit Auto Deposit Rule" onClose={() => setEditTarget(null)}>
          <RuleForm users={users} initial={editTarget} saving={saving} onSave={handleUpdate} onClose={() => setEditTarget(null)} />
        </Modal>
      )}

      {/* ── Delete confirm ── */}
      {delTarget && (
        <Modal title="Delete Rule" onClose={() => setDelTarget(null)}>
          <p style={{ fontSize: 14, color: 'hsl(40 6% 75%)', marginBottom: 8 }}>
            Are you sure you want to delete the auto deposit rule for{' '}
            <strong style={{ color: 'hsl(40 10% 92%)' }}>{delTarget.userName}</strong>?
          </p>
          <p style={{ fontSize: 12, color: 'hsl(240 5% 45%)', marginBottom: 20 }}>
            {fmt(delTarget.amount)} every {delTarget.intervalLabel} — {delTarget.totalRuns} runs completed.
            This cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setDelTarget(null)}
              style={{ flex: 1, padding: '10px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'hsl(240 5% 60%)', fontSize: 13, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={saving}
              style={{ flex: 1, padding: '10px', borderRadius: 9, border: 'none', background: 'rgba(239,68,68,0.9)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}
            >
              {saving ? 'Deleting…' : 'Delete Rule'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
