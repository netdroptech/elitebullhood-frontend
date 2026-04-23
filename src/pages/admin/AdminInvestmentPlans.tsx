import { useState, useEffect, useCallback } from 'react'
import {
  TrendingUp, Plus, Pencil, Trash2, X, AlertCircle, Check,
  ToggleLeft, ToggleRight, Loader2, ChevronUp, ChevronDown,
  Shield, Zap, Crown, Star, DollarSign,
} from 'lucide-react'
import { adminApi } from '@/lib/api'

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
  createdAt:  string
}

type ModalMode = 'add' | 'edit' | 'delete' | null

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0 })
}

const BADGE_STYLES: Record<string, { bg: string; color: string }> = {
  Popular: { bg: 'rgba(167,139,250,0.15)',  color: '#a78bfa' },
  Pro:     { bg: 'rgba(167,139,250,0.12)',  color: '#c4b5fd' },
  Elite:   { bg: 'rgba(245,158,11,0.15)', color: '#fcd34d' },
  New:     { bg: 'rgba(96,165,250,0.15)', color: '#60a5fa' },
}
function badgeStyle(b: string | null) {
  if (!b) return null
  return BADGE_STYLES[b] ?? { bg: 'rgba(255,255,255,0.1)', color: 'hsl(40 6% 80%)' }
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AdminInvestmentPlans() {
  const [plans,       setPlans]       = useState<Plan[]>([])
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [modal,       setModal]       = useState<ModalMode>(null)
  const [editTarget,  setEditTarget]  = useState<Plan | null>(null)
  const [deleteTarget,setDeleteTarget]= useState<Plan | null>(null)
  const [apiError,    setApiError]    = useState('')
  const [saveFlash,   setSaveFlash]   = useState(false)

  // ── Form state ─────────────────────────────────────────────────────────────
  const EMPTY = {
    name: '', badge: '', roi: '', roiPeriod: 'monthly', duration: '30 days',
    minDeposit: '', maxDeposit: '', features: [''], isActive: true, sortOrder: '0',
  }
  const [form,      setForm]      = useState(EMPTY)
  const [formError, setFormError] = useState('')

  // ── Load ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    setApiError('')
    try {
      const res = await adminApi.get<{ success: boolean; data: Plan[] }>('/admin/plans')
      setPlans(res.data)
    } catch (err: any) {
      setApiError(err.message ?? 'Failed to load plans.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── Modal helpers ─────────────────────────────────────────────────────────
  function openAdd() {
    setForm(EMPTY)
    setFormError('')
    setModal('add')
  }

  function openEdit(p: Plan) {
    setForm({
      name:       p.name,
      badge:      p.badge ?? '',
      roi:        String(p.roi),
      roiPeriod:  p.roiPeriod,
      duration:   p.duration,
      minDeposit: String(p.minDeposit),
      maxDeposit: p.maxDeposit != null ? String(p.maxDeposit) : '',
      features:   p.features.length > 0 ? p.features : [''],
      isActive:   p.isActive,
      sortOrder:  String(p.sortOrder),
    })
    setFormError('')
    setEditTarget(p)
    setModal('edit')
  }

  function openDelete(p: Plan) {
    setDeleteTarget(p)
    setModal('delete')
  }

  // ── Feature list helpers ──────────────────────────────────────────────────
  function setFeature(i: number, val: string) {
    setForm(f => { const arr = [...f.features]; arr[i] = val; return { ...f, features: arr } })
  }
  function addFeature() {
    setForm(f => ({ ...f, features: [...f.features, ''] }))
  }
  function removeFeature(i: number) {
    setForm(f => ({ ...f, features: f.features.filter((_, idx) => idx !== i) }))
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!form.name.trim())   { setFormError('Plan name is required.'); return }
    if (!form.roi)           { setFormError('ROI % is required.'); return }
    if (!form.minDeposit)    { setFormError('Min deposit is required.'); return }

    const cleanFeatures = form.features.map(f => f.trim()).filter(Boolean)

    setSaving(true)
    setFormError('')
    try {
      const payload = {
        name:       form.name.trim(),
        badge:      form.badge.trim() || null,
        roi:        parseFloat(form.roi),
        roiPeriod:  form.roiPeriod,
        duration:   form.duration,
        minDeposit: parseFloat(form.minDeposit),
        maxDeposit: form.maxDeposit ? parseFloat(form.maxDeposit) : null,
        features:   cleanFeatures,
        isActive:   form.isActive,
        sortOrder:  parseInt(form.sortOrder) || 0,
      }

      if (modal === 'add') {
        const res = await adminApi.post<{ success: boolean; data: Plan }>('/admin/plans', payload)
        setPlans(prev => [...prev, res.data].sort((a, b) => a.sortOrder - b.sortOrder))
      } else if (modal === 'edit' && editTarget) {
        const res = await adminApi.put<{ success: boolean; data: Plan }>(`/admin/plans/${editTarget.id}`, payload)
        setPlans(prev => prev.map(p => p.id === editTarget.id ? res.data : p))
      }

      setSaveFlash(true)
      setTimeout(() => setSaveFlash(false), 2500)
      setModal(null)
    } catch (err: any) {
      setFormError(err.message ?? 'Failed to save plan.')
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteTarget) return
    setSaving(true)
    try {
      await adminApi.delete(`/admin/plans/${deleteTarget.id}`)
      setPlans(prev => prev.filter(p => p.id !== deleteTarget.id))
      setModal(null)
    } catch (err: any) {
      setApiError(err.message ?? 'Failed to delete plan.')
      setModal(null)
    } finally {
      setSaving(false)
    }
  }

  // ── Toggle active ─────────────────────────────────────────────────────────
  async function toggleActive(p: Plan) {
    setPlans(prev => prev.map(x => x.id === p.id ? { ...x, isActive: !x.isActive } : x))
    try {
      await adminApi.put(`/admin/plans/${p.id}`, { ...p, isActive: !p.isActive })
    } catch {
      setPlans(prev => prev.map(x => x.id === p.id ? { ...x, isActive: p.isActive } : x))
    }
  }

  // ── Move order ────────────────────────────────────────────────────────────
  async function moveOrder(p: Plan, dir: 'up' | 'down') {
    const sorted = [...plans].sort((a, b) => a.sortOrder - b.sortOrder)
    const idx    = sorted.findIndex(x => x.id === p.id)
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return

    const other = sorted[swapIdx]
    const newSelf  = { ...p, sortOrder: other.sortOrder }
    const newOther = { ...other, sortOrder: p.sortOrder }

    setPlans(prev => prev.map(x => x.id === p.id ? newSelf : x.id === other.id ? newOther : x))
    try {
      await Promise.all([
        adminApi.put(`/admin/plans/${p.id}`,     { sortOrder: other.sortOrder }),
        adminApi.put(`/admin/plans/${other.id}`,  { sortOrder: p.sortOrder }),
      ])
    } catch {
      setPlans(prev => prev.map(x => x.id === p.id ? p : x.id === other.id ? other : x))
    }
  }

  const sorted = [...plans].sort((a, b) => a.sortOrder - b.sortOrder)

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 md:p-8 min-h-screen" style={{ color: 'hsl(40 6% 95%)' }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(139,92,246,0.18)', border: '1px solid rgba(139,92,246,0.3)' }}>
              <TrendingUp size={18} style={{ color: '#a78bfa' }} />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Investment Plans</h1>
          </div>
          <p className="text-sm" style={{ color: 'hsl(240 5% 65%)' }}>
            Manage the investment plans displayed to clients. Changes reflect on the user dashboard immediately.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-[1.03] active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', color: '#fff', boxShadow: '0 4px 20px rgba(139,92,246,0.35)' }}
        >
          <Plus size={15} /> Add Plan
        </button>
      </div>

      {/* ── Flash / Error ── */}
      {saveFlash && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
          style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa' }}>
          <Check size={14} /> Plan saved successfully
        </div>
      )}
      {apiError && (
        <div className="flex items-center gap-2 mb-6 px-4 py-3 rounded-xl text-sm"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
          <AlertCircle size={14} /> {apiError}
          <button onClick={() => setApiError('')} className="ml-auto"><X size={13} /></button>
        </div>
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Plans',  value: plans.length,                          col: '#a78bfa' },
          { label: 'Active',       value: plans.filter(p => p.isActive).length,  col: '#a78bfa' },
          { label: 'Inactive',     value: plans.filter(p => !p.isActive).length, col: '#f87171' },
          { label: 'Max ROI',      value: plans.length ? Math.max(...plans.map(p => p.roi)) + '%' : '—', col: '#fbbf24' },
        ].map(s => (
          <div key={s.label} className="liquid-glass rounded-2xl p-5">
            <div className="text-xs mb-2" style={{ color: s.col }}>{s.label}</div>
            <div className="text-3xl font-bold tracking-tight" style={{ color: 'hsl(40 10% 96%)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-32">
          <Loader2 size={28} style={{ color: 'hsl(240 5% 40%)', animation: 'spin 1s linear infinite' }} />
        </div>
      )}

      {/* ── Plan cards ── */}
      {!loading && sorted.length === 0 && (
        <div className="text-center py-24 liquid-glass rounded-3xl">
          <TrendingUp size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm" style={{ color: 'hsl(240 5% 65%)' }}>No investment plans yet. Add one above.</p>
        </div>
      )}

      {!loading && sorted.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {sorted.map((p, i) => {
            const bs = badgeStyle(p.badge)
            return (
              <div key={p.id}
                className="liquid-glass rounded-3xl p-6 flex flex-col gap-4 transition-all hover:bg-white/[0.02]"
                style={{ opacity: p.isActive ? 1 : 0.6 }}
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold text-base truncate" style={{ color: 'hsl(40 6% 95%)' }}>{p.name}</span>
                      {bs && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: bs.bg, color: bs.color }}>{p.badge}</span>
                      )}
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full ml-auto"
                        style={p.isActive
                          ? { background: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)' }
                          : { background: 'rgba(239,68,68,0.10)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: 'hsl(240 5% 55%)' }}>
                      {p.roiPeriod} · {p.duration} · order #{p.sortOrder}
                    </p>
                  </div>
                  <button onClick={() => toggleActive(p)} className="flex-shrink-0 hover:opacity-80 transition-opacity mt-0.5">
                    {p.isActive
                      ? <ToggleRight size={24} style={{ color: '#a78bfa' }} />
                      : <ToggleLeft  size={24} style={{ color: 'hsl(240 5% 40%)' }} />}
                  </button>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />

                {/* ROI */}
                <div className="flex items-end gap-2">
                  <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'hsl(40 6% 95%)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                    {p.roi}%
                  </span>
                  <span style={{ fontSize: 12, color: 'hsl(240 5% 50%)', marginBottom: 4 }}>
                    {p.roiPeriod} returns
                  </span>
                </div>

                {/* Deposit range */}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.04)', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div>
                    <p style={{ fontSize: 10, color: 'hsl(240 5% 50%)', marginBottom: 1 }}>Min</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#a78bfa' }}>{fmt(p.minDeposit)}</p>
                  </div>
                  <div style={{ width: 1, background: 'rgba(255,255,255,0.07)' }} />
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 10, color: 'hsl(240 5% 50%)', marginBottom: 1 }}>Max</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'hsl(40 6% 85%)' }}>
                      {p.maxDeposit != null ? fmt(p.maxDeposit) : 'Unlimited'}
                    </p>
                  </div>
                </div>

                {/* Features */}
                <ul style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {p.features.slice(0, 4).map((f, fi) => (
                    <li key={fi} className="flex items-center gap-2 text-xs" style={{ color: 'hsl(240 5% 65%)' }}>
                      <Check size={11} style={{ color: '#a78bfa', flexShrink: 0 }} /> {f}
                    </li>
                  ))}
                  {p.features.length > 4 && (
                    <li className="text-xs" style={{ color: 'hsl(240 5% 45%)' }}>+{p.features.length - 4} more features</li>
                  )}
                </ul>

                {/* Actions */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.875rem' }} className="flex items-center justify-between">
                  {/* Reorder */}
                  <div className="flex items-center gap-1">
                    <button onClick={() => moveOrder(p, 'up')} disabled={i === 0}
                      className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 transition-colors">
                      <ChevronUp size={14} style={{ color: 'hsl(240 5% 60%)' }} />
                    </button>
                    <button onClick={() => moveOrder(p, 'down')} disabled={i === sorted.length - 1}
                      className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 transition-colors">
                      <ChevronDown size={14} style={{ color: 'hsl(240 5% 60%)' }} />
                    </button>
                  </div>
                  {/* Edit / Delete */}
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(p)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors hover:bg-white/8"
                      style={{ color: 'hsl(240 5% 65%)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <Pencil size={11} /> Edit
                    </button>
                    <button onClick={() => openDelete(p)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors hover:bg-red-500/10"
                      style={{ color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <Trash2 size={11} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ════════════════════════════════════════════
          Add / Edit Modal
      ════════════════════════════════════════════ */}
      {(modal === 'add' || modal === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full max-w-lg rounded-3xl p-8 relative max-h-[90vh] overflow-y-auto"
            style={{ background: 'hsl(260 40% 7%)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}>

            <button onClick={() => setModal(null)} className="absolute top-5 right-5 p-2 rounded-xl hover:bg-white/10 transition-colors">
              <X size={16} style={{ color: 'hsl(240 5% 65%)' }} />
            </button>

            <div className="flex items-center gap-3 mb-7">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.18)' }}>
                {modal === 'add' ? <Plus size={17} style={{ color: '#a78bfa' }} /> : <Pencil size={17} style={{ color: '#a78bfa' }} />}
              </div>
              <div>
                <h2 className="text-lg font-semibold">{modal === 'add' ? 'Add New Plan' : `Edit — ${editTarget?.name}`}</h2>
                <p className="text-xs" style={{ color: 'hsl(240 5% 65%)' }}>
                  {modal === 'add' ? 'Create an investment plan for clients' : 'Update plan details — changes are live instantly'}
                </p>
              </div>
            </div>

            {formError && (
              <div className="flex items-center gap-2 mb-5 px-4 py-3 rounded-xl text-sm"
                style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                <AlertCircle size={14} /> {formError}
              </div>
            )}

            <div className="space-y-5">

              {/* Row: Name + Badge */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: 'hsl(240 5% 65%)' }}>Plan Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Starter"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(40 6% 95%)' }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: 'hsl(240 5% 65%)' }}>Badge <span style={{ color: 'hsl(240 5% 45%)' }}>(optional)</span></label>
                  <input value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))}
                    placeholder="e.g. Popular, Pro, Elite"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(40 6% 95%)' }} />
                </div>
              </div>

              {/* Row: ROI + Period */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: 'hsl(240 5% 65%)' }}>ROI % *</label>
                  <div className="relative">
                    <input value={form.roi} onChange={e => setForm(f => ({ ...f, roi: e.target.value }))}
                      type="number" min="0" step="0.1" placeholder="e.g. 8"
                      className="w-full pl-4 pr-10 py-3 rounded-xl text-sm outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(40 6% 95%)' }} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: '#a78bfa' }}>%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: 'hsl(240 5% 65%)' }}>Period</label>
                  <select value={form.roiPeriod} onChange={e => setForm(f => ({ ...f, roiPeriod: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(40 6% 95%)' }}>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'hsl(240 5% 65%)' }}>Duration</label>
                <input value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                  placeholder="e.g. 30 days"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(40 6% 95%)' }} />
              </div>

              {/* Row: Min + Max deposit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: 'hsl(240 5% 65%)' }}>Min Deposit ($) *</label>
                  <input value={form.minDeposit} onChange={e => setForm(f => ({ ...f, minDeposit: e.target.value }))}
                    type="number" min="0" placeholder="e.g. 500"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(40 6% 95%)' }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: 'hsl(240 5% 65%)' }}>Max Deposit ($) <span style={{ color: 'hsl(240 5% 45%)' }}>(blank = unlimited)</span></label>
                  <input value={form.maxDeposit} onChange={e => setForm(f => ({ ...f, maxDeposit: e.target.value }))}
                    type="number" min="0" placeholder="Leave blank for unlimited"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(40 6% 95%)' }} />
                </div>
              </div>

              {/* Features */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium" style={{ color: 'hsl(240 5% 65%)' }}>Features</label>
                  <button type="button" onClick={addFeature}
                    className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg"
                    style={{ background: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.25)' }}>
                    <Plus size={11} /> Add
                  </button>
                </div>
                <div className="space-y-2">
                  {form.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input value={f} onChange={e => setFeature(i, e.target.value)}
                        placeholder={`Feature ${i + 1}`}
                        className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(40 6% 95%)' }} />
                      {form.features.length > 1 && (
                        <button type="button" onClick={() => removeFeature(i)}
                          className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                          style={{ color: '#f87171' }}>
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Row: Sort order + Active */}
              <div className="grid grid-cols-2 gap-4 items-end">
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: 'hsl(240 5% 65%)' }}>Display Order</label>
                  <input value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))}
                    type="number" min="0" placeholder="0"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(40 6% 95%)' }} />
                </div>
                <div className="flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="text-sm font-medium">Active</p>
                  <button type="button" onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}>
                    {form.isActive
                      ? <ToggleRight size={28} style={{ color: '#a78bfa' }} />
                      : <ToggleLeft  size={28} style={{ color: 'hsl(240 5% 45%)' }} />}
                  </button>
                </div>
              </div>

            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-8">
              <button onClick={() => setModal(null)} disabled={saving}
                className="flex-1 py-3 rounded-xl text-sm transition-colors hover:bg-white/5"
                style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(240 5% 65%)' }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', color: '#fff' }}>
                {saving && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                {modal === 'add' ? 'Create Plan' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
          Delete Modal
      ════════════════════════════════════════════ */}
      {modal === 'delete' && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full max-w-sm rounded-3xl p-8"
            style={{ background: 'hsl(260 40% 7%)', border: '1px solid rgba(239,68,68,0.3)', boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: 'rgba(239,68,68,0.15)' }}>
              <Trash2 size={20} style={{ color: '#f87171' }} />
            </div>
            <h2 className="text-lg font-semibold text-center mb-2">Delete Plan?</h2>
            <p className="text-sm text-center mb-7" style={{ color: 'hsl(240 5% 65%)' }}>
              "<strong style={{ color: 'hsl(40 6% 95%)' }}>{deleteTarget.name}</strong>" will be permanently removed and will no longer appear on the user dashboard.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} disabled={saving}
                className="flex-1 py-3 rounded-xl text-sm transition-colors hover:bg-white/5"
                style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(240 5% 65%)' }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={saving}
                className="flex-1 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all hover:opacity-90"
                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', color: '#f87171' }}>
                {saving && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
