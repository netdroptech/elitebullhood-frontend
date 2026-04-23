import { useState, useEffect, useRef } from 'react'
import {
  Building2, Plus, Pencil, Trash2, X, AlertCircle, RefreshCw,
  TrendingUp, DollarSign, BarChart2, Search, ChevronDown,
} from 'lucide-react'
import { adminApi } from '@/lib/api'

/* ─── Types ─────────────────────────────────────────────────────────────────── */
interface LookupUser { id: string; fullName: string; email: string }

interface PropertyInvestment {
  id: string; userId: string
  propertyTitle: string; propertyImage: string | null
  location: string; type: string
  amountInvested: number; currentValue: number
  roi: number; returns: number
  status: string
  investedAt: string; maturityDate: string | null
  notes: string | null
  createdAt: string
  userName: string; userEmail: string
}

type Modal = 'add' | 'edit' | 'del' | null

/* ─── Helpers ───────────────────────────────────────────────────────────────── */
const fmtMoney = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtDate  = (iso: string | null) => iso
  ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  : '—'

function Skeleton({ w = '100%', h = 14 }: { w?: string | number; h?: string | number }) {
  return <div style={{ width: w, height: h, borderRadius: 6, background: 'rgba(255,255,255,0.07)', animation: 'skPulse 1.4s ease-in-out infinite' }} />
}

const STATUSES = ['Active', 'Completed', 'Pending', 'Cancelled']
const TYPES    = ['Apartment', 'Villa', 'Penthouse', 'Townhouse', 'Duplex', 'Studio', 'Loft', 'Commercial', 'Land']

const fieldStyle: React.CSSProperties = {
  width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
  color: 'hsl(40 6% 92%)', fontSize: 13, outline: 'none', boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600, color: 'hsl(240 5% 55%)', marginBottom: 4,
}

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  Active:    { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)'  },
  Completed: { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)'  },
  Pending:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
  Cancelled: { color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
}

const BLANK = {
  userId: '', propertyTitle: '', propertyImage: '', location: '', type: 'Apartment',
  amountInvested: '', currentValue: '', roi: '', returns: '',
  status: 'Active', investedAt: '', maturityDate: '', notes: '',
}

/* ─── Main Component ────────────────────────────────────────────────────────── */
export function AdminPropertyInvestments() {
  const [investments, setInvestments] = useState<PropertyInvestment[]>([])
  const [users,       setUsers]       = useState<LookupUser[]>([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)
  const [modal,       setModal]       = useState<Modal>(null)
  const [selected,    setSelected]    = useState<PropertyInvestment | null>(null)
  const [formError,   setFormError]   = useState('')
  const [saving,      setSaving]      = useState(false)
  const [form,        setForm]        = useState(BLANK)
  const [userSearch,  setUserSearch]  = useState('')
  const [userDropOpen, setUserDropOpen] = useState(false)
  const userPickerRef = useRef<HTMLDivElement>(null)

  /* ─── Close user dropdown on outside click ──────────────────────────────── */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userPickerRef.current && !userPickerRef.current.contains(e.target as Node)) {
        setUserDropOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  /* ─── Fetch ─────────────────────────────────────────────────────────────── */
  async function fetchAll() {
    setLoading(true); setError(null)
    try {
      const [inv, usr] = await Promise.all([
        adminApi.get<{ success: boolean; data: PropertyInvestment[] }>('/admin/property-investments'),
        adminApi.get<{ success: boolean; data: LookupUser[] }>('/admin/property-investments/users'),
      ])
      setInvestments(inv.data ?? [])
      setUsers(usr.data ?? [])
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load data')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  /* ─── Modal helpers ─────────────────────────────────────────────────────── */
  function openAdd() {
    setForm(BLANK); setFormError(''); setUserSearch(''); setUserDropOpen(false); setModal('add')
  }
  function openEdit(inv: PropertyInvestment) {
    setSelected(inv)
    setForm({
      userId:         inv.userId,
      propertyTitle:  inv.propertyTitle,
      propertyImage:  inv.propertyImage ?? '',
      location:       inv.location,
      type:           inv.type,
      amountInvested: String(inv.amountInvested),
      currentValue:   String(inv.currentValue),
      roi:            String(inv.roi),
      returns:        String(inv.returns),
      status:         inv.status,
      investedAt:     inv.investedAt ? new Date(inv.investedAt).toISOString().slice(0, 16) : '',
      maturityDate:   inv.maturityDate ? new Date(inv.maturityDate).toISOString().slice(0, 16) : '',
      notes:          inv.notes ?? '',
    })
    setFormError(''); setModal('edit')
  }
  function openDel(inv: PropertyInvestment) { setSelected(inv); setModal('del') }

  /* ─── Submit ────────────────────────────────────────────────────────────── */
  async function handleSubmit() {
    if (!form.userId)        { setFormError('User is required'); return }
    if (!form.propertyTitle) { setFormError('Property title is required'); return }
    if (!form.amountInvested){ setFormError('Invested amount is required'); return }
    setSaving(true); setFormError('')
    try {
      const body = {
        userId:         form.userId,
        propertyTitle:  form.propertyTitle,
        propertyImage:  form.propertyImage || null,
        location:       form.location,
        type:           form.type,
        amountInvested: parseFloat(form.amountInvested),
        currentValue:   form.currentValue ? parseFloat(form.currentValue) : parseFloat(form.amountInvested),
        roi:            parseFloat(form.roi || '0'),
        returns:        parseFloat(form.returns || '0'),
        status:         form.status,
        investedAt:     form.investedAt   || null,
        maturityDate:   form.maturityDate || null,
        notes:          form.notes        || null,
      }
      if (modal === 'add') {
        await adminApi.post('/admin/property-investments', body)
      } else {
        await adminApi.put(`/admin/property-investments/${selected!.id}`, body)
      }
      setModal(null); await fetchAll()
    } catch (e: any) { setFormError(e?.message ?? 'Save failed') }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    setSaving(true)
    try {
      await adminApi.delete(`/admin/property-investments/${selected!.id}`)
      setModal(null); await fetchAll()
    } catch (e: any) { setFormError(e?.message ?? 'Delete failed') }
    finally { setSaving(false) }
  }

  /* ─── Derived stats ─────────────────────────────────────────────────────── */
  const totalInvested = investments.reduce((s, i) => s + i.amountInvested, 0)
  const totalReturns  = investments.reduce((s, i) => s + i.returns, 0)
  const activeCount   = investments.filter(i => i.status === 'Active').length

  /* ─── Render ────────────────────────────────────────────────────────────── */
  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
      <style>{`@keyframes skPulse{0%,100%{opacity:.5}50%{opacity:.15}} @keyframes fadeIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}`}</style>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Building2 size={20} style={{ color: '#a78bfa' }} />
            <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'hsl(40 6% 95%)' }}>Property Investments</h1>
          </div>
          <p style={{ fontSize: 13, color: 'hsl(240 5% 55%)' }}>Add and manage user property investment history</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={fetchAll}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 0.875rem', borderRadius: '0.6rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(40 6% 85%)', fontSize: 13, cursor: 'pointer' }}>
            <RefreshCw size={13} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
          </button>
          <button onClick={openAdd}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 1rem', borderRadius: '0.6rem', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)', color: '#050505', border: 'none', boxShadow: '0 4px 16px rgba(167,139,250,0.18)' }}>
            <Plus size={14} /> Add Investment
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        {[
          { label: 'Active Investments', value: loading ? '...' : String(activeCount),          icon: Building2,   color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
          { label: 'Total Invested',     value: loading ? '...' : `$${fmtMoney(totalInvested)}`, icon: DollarSign,  color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
          { label: 'Total Returns',      value: loading ? '...' : `$${fmtMoney(totalReturns)}`,  icon: TrendingUp,  color: totalReturns >= 0 ? '#a78bfa' : '#f87171', bg: 'rgba(167,139,250,0.1)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.875rem', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '0.6rem', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <s.icon size={16} style={{ color: s.color }} />
            </div>
            <div>
              <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)', marginBottom: 2 }}>{s.label}</p>
              <p style={{ fontSize: '1.1rem', fontWeight: 700, color: s.color }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 10, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#fca5a5', fontSize: 13 }}>{error}</div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[0,1,2,3].map(i => <div key={i} style={{ height: 56, borderRadius: '0.75rem', background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)' }}><Skeleton w="100%" h="100%" /></div>)}
        </div>
      ) : investments.length === 0 ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.875rem' }}>
          <Building2 size={36} style={{ color: 'rgba(255,255,255,0.1)', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: 'hsl(240 5% 42%)' }}>No property investments yet</p>
          <p style={{ fontSize: 13, color: 'hsl(240 5% 32%)', marginTop: 4 }}>Click "Add Investment" to create the first entry.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.875rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {['User','Property','Location','Type','Invested','Current Value','ROI','Returns','Status','Date','Actions'].map(h => (
                  <th key={h} style={{ padding: '0.625rem 0.875rem', textAlign: 'left', color: 'hsl(240 5% 50%)', fontWeight: 600, whiteSpace: 'nowrap', fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {investments.map(inv => {
                const sc = STATUS_COLORS[inv.status] ?? STATUS_COLORS.Active
                return (
                  <tr key={inv.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '0.75rem 0.875rem' }}>
                      <p style={{ color: 'hsl(40 6% 90%)', fontWeight: 600, whiteSpace: 'nowrap' }}>{inv.userName || '—'}</p>
                      <p style={{ fontSize: 10, color: 'hsl(240 5% 45%)', marginTop: 1 }}>{inv.userEmail}</p>
                    </td>
                    <td style={{ padding: '0.75rem 0.875rem', maxWidth: 180 }}>
                      <p style={{ color: 'hsl(40 6% 88%)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inv.propertyTitle}</p>
                    </td>
                    <td style={{ padding: '0.75rem 0.875rem', color: 'hsl(240 5% 60%)', whiteSpace: 'nowrap' }}>{inv.location || '—'}</td>
                    <td style={{ padding: '0.75rem 0.875rem', color: 'hsl(240 5% 60%)' }}>{inv.type}</td>
                    <td style={{ padding: '0.75rem 0.875rem', color: 'hsl(40 6% 85%)', fontWeight: 600, whiteSpace: 'nowrap' }}>${fmtMoney(inv.amountInvested)}</td>
                    <td style={{ padding: '0.75rem 0.875rem', color: 'hsl(40 6% 85%)', whiteSpace: 'nowrap' }}>${fmtMoney(inv.currentValue)}</td>
                    <td style={{ padding: '0.75rem 0.875rem' }}>
                      <span style={{ color: inv.roi >= 0 ? '#a78bfa' : '#f87171', fontWeight: 700 }}>{inv.roi >= 0 ? '+' : ''}{inv.roi}%</span>
                    </td>
                    <td style={{ padding: '0.75rem 0.875rem' }}>
                      <span style={{ color: inv.returns >= 0 ? '#a78bfa' : '#f87171', fontWeight: 700 }}>
                        {inv.returns >= 0 ? '+' : ''}${fmtMoney(inv.returns)}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 0.875rem' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, color: sc.color, background: sc.bg }}>{inv.status}</span>
                    </td>
                    <td style={{ padding: '0.75rem 0.875rem', color: 'hsl(240 5% 50%)', whiteSpace: 'nowrap' }}>{fmtDate(inv.investedAt)}</td>
                    <td style={{ padding: '0.75rem 0.875rem' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => openEdit(inv)}
                          style={{ padding: '4px 8px', borderRadius: '0.4rem', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', cursor: 'pointer', color: '#c4b5fd' }}>
                          <Pencil size={12} />
                        </button>
                        <button onClick={() => openDel(inv)}
                          style={{ padding: '4px 8px', borderRadius: '0.4rem', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', cursor: 'pointer', color: '#f87171' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══════ ADD / EDIT MODAL ═══════ */}
      {(modal === 'add' || modal === 'edit') && (
        <div onClick={() => setModal(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: 'hsl(260 60% 6%)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '1.125rem', padding: '2rem', maxWidth: 600, width: '100%', animation: 'fadeIn 0.18s ease', boxShadow: '0 24px 64px rgba(0,0,0,0.6)', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>

            <button onClick={() => setModal(null)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 50%)', padding: 4 }}>
              <X size={16} />
            </button>

            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'hsl(40 6% 95%)', marginBottom: '1.5rem' }}>
              {modal === 'add' ? 'Add Property Investment' : 'Edit Property Investment'}
            </h3>

            {formError && (
              <div style={{ marginBottom: 12, padding: '8px 12px', borderRadius: '0.5rem', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#fca5a5', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertCircle size={13} /> {formError}
              </div>
            )}

            {/* User & Status */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <span style={labelStyle}>User *</span>
                {modal === 'edit' ? (
                  /* Edit mode — show read-only display */
                  <div style={{ ...fieldStyle, display: 'flex', alignItems: 'center', gap: 8, opacity: 0.6, cursor: 'not-allowed' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {users.find(u => u.id === form.userId)
                        ? `${users.find(u => u.id === form.userId)!.fullName} (${users.find(u => u.id === form.userId)!.email})`
                        : form.userId}
                    </span>
                  </div>
                ) : (
                  /* Add mode — searchable picker */
                  <div ref={userPickerRef} style={{ position: 'relative' }}>
                    {/* Trigger / selected display */}
                    <div
                      onClick={() => { setUserDropOpen(v => !v); setUserSearch('') }}
                      style={{
                        ...fieldStyle,
                        display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                        userSelect: 'none',
                      }}
                    >
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: form.userId ? 'hsl(40 6% 92%)' : 'hsl(240 5% 50%)' }}>
                        {form.userId
                          ? (() => { const u = users.find(u => u.id === form.userId); return u ? `${u.fullName} (${u.email})` : form.userId })()
                          : 'Select user…'}
                      </span>
                      <ChevronDown size={13} style={{ color: 'hsl(240 5% 50%)', flexShrink: 0, transform: userDropOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                    </div>

                    {/* Dropdown */}
                    {userDropOpen && (
                      <div style={{
                        position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 999,
                        background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '0.5rem', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                        overflow: 'hidden',
                      }}>
                        {/* Search input */}
                        <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 7 }}>
                          <Search size={13} style={{ color: 'hsl(240 5% 50%)', flexShrink: 0 }} />
                          <input
                            autoFocus
                            value={userSearch}
                            onChange={e => setUserSearch(e.target.value)}
                            placeholder="Search by name or email…"
                            onClick={e => e.stopPropagation()}
                            style={{
                              flex: 1, background: 'none', border: 'none', outline: 'none',
                              color: 'hsl(40 6% 92%)', fontSize: 12,
                              fontFamily: 'inherit',
                            }}
                          />
                          {userSearch && (
                            <button onClick={e => { e.stopPropagation(); setUserSearch('') }} style={{ background: 'none', border: 'none', color: 'hsl(240 5% 50%)', cursor: 'pointer', padding: 0, display: 'flex' }}>
                              <X size={11} />
                            </button>
                          )}
                        </div>

                        {/* Options list */}
                        <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                          {(() => {
                            const q = userSearch.toLowerCase()
                            const filtered = q
                              ? users.filter(u => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
                              : users
                            if (filtered.length === 0) {
                              return (
                                <div style={{ padding: '12px 12px', fontSize: 12, color: 'hsl(240 5% 50%)', textAlign: 'center' }}>
                                  No users match "{userSearch}"
                                </div>
                              )
                            }
                            return filtered.map(u => (
                              <div
                                key={u.id}
                                onClick={() => { setForm(f => ({ ...f, userId: u.id })); setUserDropOpen(false); setUserSearch('') }}
                                style={{
                                  padding: '8px 12px', cursor: 'pointer',
                                  background: form.userId === u.id ? 'rgba(167,139,250,0.08)' : 'transparent',
                                  borderLeft: form.userId === u.id ? '2px solid #a78bfa' : '2px solid transparent',
                                  transition: 'background 0.1s',
                                }}
                                onMouseEnter={e => { if (form.userId !== u.id) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                                onMouseLeave={e => { if (form.userId !== u.id) e.currentTarget.style.background = 'transparent' }}
                              >
                                <p style={{ fontSize: 12, fontWeight: 600, color: 'hsl(40 6% 90%)', margin: 0 }}>{u.fullName}</p>
                                <p style={{ fontSize: 11, color: 'hsl(240 5% 55%)', margin: 0 }}>{u.email}</p>
                              </div>
                            ))
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <label>
                <span style={labelStyle}>Status</span>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={fieldStyle}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
            </div>

            {/* Property info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <label>
                <span style={labelStyle}>Property Title *</span>
                <input type="text" value={form.propertyTitle} onChange={e => setForm({ ...form, propertyTitle: e.target.value })} placeholder="e.g. Dubai Marina Penthouse" style={fieldStyle} />
              </label>
              <label>
                <span style={labelStyle}>Type</span>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={fieldStyle}>
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <label>
                <span style={labelStyle}>Location</span>
                <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Dubai, UAE" style={fieldStyle} />
              </label>
              <label>
                <span style={labelStyle}>Property Image URL</span>
                <input type="text" value={form.propertyImage} onChange={e => setForm({ ...form, propertyImage: e.target.value })} placeholder="https://..." style={fieldStyle} />
              </label>
            </div>

            {/* Financial info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              <label>
                <span style={labelStyle}>Amount Invested ($)</span>
                <input type="number" step="0.01" value={form.amountInvested} onChange={e => setForm({ ...form, amountInvested: e.target.value })} style={fieldStyle} />
              </label>
              <label>
                <span style={labelStyle}>Current Value ($)</span>
                <input type="number" step="0.01" value={form.currentValue} onChange={e => setForm({ ...form, currentValue: e.target.value })} placeholder="Same as invested" style={fieldStyle} />
              </label>
              <label>
                <span style={labelStyle}>ROI (%)</span>
                <input type="number" step="0.1" value={form.roi} onChange={e => setForm({ ...form, roi: e.target.value })} placeholder="0.0" style={fieldStyle} />
              </label>
              <label>
                <span style={labelStyle}>Returns ($)</span>
                <input type="number" step="0.01" value={form.returns} onChange={e => setForm({ ...form, returns: e.target.value })} placeholder="0.00" style={fieldStyle} />
              </label>
            </div>

            {/* Dates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <label>
                <span style={labelStyle}>Investment Date</span>
                <input type="datetime-local" value={form.investedAt} onChange={e => setForm({ ...form, investedAt: e.target.value })} style={fieldStyle} />
              </label>
              <label>
                <span style={labelStyle}>Maturity Date</span>
                <input type="datetime-local" value={form.maturityDate} onChange={e => setForm({ ...form, maturityDate: e.target.value })} style={fieldStyle} />
              </label>
            </div>

            {/* Notes */}
            <label style={{ display: 'block', marginBottom: '1.5rem' }}>
              <span style={labelStyle}>Notes</span>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Optional notes..." style={{ ...fieldStyle, resize: 'vertical' }} />
            </label>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModal(null)}
                style={{ flex: 1, padding: '0.65rem', borderRadius: '0.6rem', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(240 5% 65%)' }}>
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={saving}
                style={{ flex: 2, padding: '0.65rem', borderRadius: '0.6rem', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)', color: '#050505', border: 'none' }}>
                {saving ? 'Saving...' : modal === 'add' ? 'Add Investment' : 'Update Investment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ DELETE CONFIRM ═══════ */}
      {modal === 'del' && selected && (
        <div onClick={() => setModal(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: 'hsl(260 60% 6%)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '1.125rem', padding: '2rem', maxWidth: 380, width: '100%', animation: 'fadeIn 0.18s ease' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'hsl(40 6% 95%)', marginBottom: 8 }}>Delete Investment?</h3>
            <p style={{ fontSize: 13, color: 'hsl(240 5% 55%)', lineHeight: 1.6, marginBottom: '0.5rem' }}>
              This will permanently remove the investment record for <strong style={{ color: 'hsl(40 6% 88%)' }}>{selected.userName}</strong>:
            </p>
            <p style={{ fontSize: 13, color: '#c4b5fd', fontWeight: 600, marginBottom: '1.5rem' }}>{selected.propertyTitle}</p>
            {formError && <p style={{ fontSize: 12, color: '#f87171', marginBottom: 12 }}>{formError}</p>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModal(null)}
                style={{ flex: 1, padding: '0.6rem', borderRadius: '0.6rem', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(240 5% 65%)' }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={saving}
                style={{ flex: 1, padding: '0.6rem', borderRadius: '0.6rem', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171' }}>
                {saving ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
