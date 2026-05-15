import { useState, useEffect, useRef } from 'react'
import {
  Copy, Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  X, AlertCircle, Camera, ImageOff, RefreshCw, Users, TrendingUp, Shield,
} from 'lucide-react'
import { adminApi } from '@/lib/api'

// ─── Types ───────────────────────────────────────────────────────────────────
interface CopyTrader {
  id:            string
  name:          string
  username:      string
  imageUrl:      string | null
  strategy:      string
  description:   string | null
  winRate:       number
  monthlyReturn: number
  totalReturn:   number
  followers:     number
  minAmount:     number
  riskLevel:     string
  tags:          string[]
  isActive:      boolean
  isVerified:    boolean
  sortOrder:     number
  feeLabel:      string
  createdAt:     string
}

type ModalMode = 'add' | 'edit' | 'delete' | null

// ─── Constants ───────────────────────────────────────────────────────────────
const STRATEGIES = [
  'Swing Trading', 'Scalping', 'Position Trading', 'Day Trading',
  'Algorithmic', 'Options Trading', 'Crypto Arbitrage', 'Trend Following',
]
const RISK_LEVELS = ['Low', 'Medium', 'High']
const RISK_COLORS: Record<string, string> = {
  Low: '#a78bfa', Medium: '#f59e0b', High: '#f87171',
}
const AVATAR_COLORS = [
  '#8b5cf6','#ec4899','#f59e0b','#8b5cf6','#3b82f6',
  '#7c3aed','#f97316','#06b6d4','#ef4444','#a3e635',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??'
}
function avatarColor(name: string) {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

// Keep this fallback in lockstep with the default in src/lib/api.ts so image
// URLs work even when VITE_API_URL is unset (otherwise images 404 against localhost
// while the API itself talks to production).
const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') ?? 'https://elitebullhood-backend.onrender.com'
function imgSrc(url: string | null | undefined) {
  if (!url) return null
  if (url.startsWith('http')) return url
  return `${API_BASE}${url}`
}

// ─── Blank form ───────────────────────────────────────────────────────────────
const BLANK = {
  name: '', username: '', strategy: STRATEGIES[0], description: '',
  winRate: '', monthlyReturn: '', totalReturn: '', followers: '',
  minAmount: '100', riskLevel: 'Medium', tags: '',
  isActive: true, isVerified: false, sortOrder: '0',
  feeLabel: '0% fees',
}

// ─── Subcomponents ────────────────────────────────────────────────────────────
function Skeleton({ w = '100%', h = 14 }: { w?: string | number; h?: number }) {
  return <div style={{ width: w, height: h, borderRadius: 6, background: 'rgba(255,255,255,0.07)', animation: 'skPulse 1.4s ease-in-out infinite' }} />
}

function TraderAvatar({ trader, size = 44 }: { trader: CopyTrader; size?: number }) {
  const [imgErr, setImgErr] = useState(false)
  const src = imgSrc(trader.imageUrl)
  const color = avatarColor(trader.name)

  // Reset the error flag any time the image URL changes (e.g. admin re-uploads).
  // Without this, a single previous failure would permanently lock the avatar
  // to the initials fallback even after a successful upload.
  useEffect(() => { setImgErr(false) }, [src])

  if (src && !imgErr) {
    return (
      <img
        key={src}
        src={src}
        alt={trader.name}
        onError={() => setImgErr(true)}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: `2px solid ${color}55` }}
      />
    )
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: `${color}22`, border: `2px solid ${color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.3, fontWeight: 800, color }}>
      {initials(trader.name)}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function AdminCopyTraders() {
  const [traders,     setTraders]     = useState<CopyTrader[]>([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)
  const [modalMode,   setModalMode]   = useState<ModalMode>(null)
  const [editTarget,  setEditTarget]  = useState<CopyTrader | null>(null)
  const [deleteTarget,setDeleteTarget]= useState<CopyTrader | null>(null)
  const [saving,      setSaving]      = useState(false)
  const [formError,   setFormError]   = useState<string | null>(null)

  // Form state
  const [form, setForm] = useState(BLANK)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Fetch ──────────────────────────────────────────────────────────────────
  async function fetchTraders() {
    setLoading(true); setError(null)
    try {
      const res = await adminApi.get<{ success: boolean; data: CopyTrader[] }>('/admin/traders')
      setTraders(res.data)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load traders.')
    } finally { setLoading(false) }
  }
  useEffect(() => { fetchTraders() }, [])

  // ── Open modals ────────────────────────────────────────────────────────────
  function openAdd() {
    setForm(BLANK); setPhotoFile(null); setPhotoPreview(null)
    setFormError(null); setModalMode('add')
  }
  function openEdit(t: CopyTrader) {
    setForm({
      name: t.name, username: t.username, strategy: t.strategy,
      description: t.description ?? '', winRate: String(t.winRate),
      monthlyReturn: String(t.monthlyReturn), totalReturn: String(t.totalReturn),
      followers: String(t.followers), minAmount: String(t.minAmount),
      riskLevel: t.riskLevel, tags: (Array.isArray(t.tags) ? t.tags : []).join(', '),
      isActive: t.isActive, isVerified: t.isVerified, sortOrder: String(t.sortOrder),
      feeLabel: t.feeLabel ?? '0% fees',
    })
    setPhotoFile(null); setPhotoPreview(null)
    setFormError(null); setEditTarget(t); setModalMode('edit')
  }
  function openDelete(t: CopyTrader) { setDeleteTarget(t); setModalMode('delete') }
  function closeModal() { setModalMode(null); setEditTarget(null); setDeleteTarget(null); setSaving(false); setFormError(null) }

  // ── Photo picker ────────────────────────────────────────────────────────────
  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = ev => setPhotoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  // ── Build FormData ──────────────────────────────────────────────────────────
  function buildFormData() {
    const fd = new FormData()
    fd.append('name',          form.name)
    fd.append('username',      form.username)
    fd.append('strategy',      form.strategy)
    fd.append('description',   form.description)
    fd.append('winRate',       form.winRate)
    fd.append('monthlyReturn', form.monthlyReturn)
    fd.append('totalReturn',   form.totalReturn)
    fd.append('followers',     form.followers)
    fd.append('minAmount',     form.minAmount)
    fd.append('riskLevel',     form.riskLevel)
    fd.append('tags',          JSON.stringify(form.tags.split(',').map(s => s.trim()).filter(Boolean)))
    fd.append('isActive',      String(form.isActive))
    fd.append('isVerified',    String(form.isVerified))
    fd.append('sortOrder',     form.sortOrder)
    fd.append('feeLabel',      form.feeLabel)
    if (photoFile) fd.append('traderPhoto', photoFile)
    return fd
  }

  // ── Save (add or edit) ──────────────────────────────────────────────────────
  async function handleSave() {
    if (!form.name.trim()) { setFormError('Name is required.'); return }
    if (!form.strategy)    { setFormError('Strategy is required.'); return }
    setSaving(true); setFormError(null)
    try {
      const fd = buildFormData()
      const token = localStorage.getItem('apex_admin_token')
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`

      const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'
      const url  = modalMode === 'add'
        ? `${BASE}/admin/traders`
        : `${BASE}/admin/traders/${editTarget!.id}`
      const method = modalMode === 'add' ? 'POST' : 'PUT'

      const resp = await fetch(url, { method, headers, body: fd })
      if (resp.status === 401) {
        localStorage.removeItem('apex_admin_token')
        localStorage.removeItem('apex_admin_session')
        window.location.href = '/admin/login'
        return
      }
      const json = await resp.json()
      if (!json.success) throw new Error(json.message)
      await fetchTraders()
      closeModal()
    } catch (e: any) {
      setFormError(e?.message ?? 'Failed to save trader.')
    } finally { setSaving(false) }
  }

  // ── Delete ──────────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteTarget) return
    setSaving(true)
    try {
      await adminApi.delete(`/admin/traders/${deleteTarget.id}`)
      setTraders(prev => prev.filter(t => t.id !== deleteTarget.id))
      closeModal()
    } catch (e: any) {
      setFormError(e?.message ?? 'Failed to delete.')
    } finally { setSaving(false) }
  }

  // ── Toggle active ───────────────────────────────────────────────────────────
  async function handleToggle(t: CopyTrader) {
    setTraders(prev => prev.map(x => x.id === t.id ? { ...x, isActive: !x.isActive } : x))
    try {
      await adminApi.patch(`/admin/traders/${t.id}/toggle`, {})
    } catch {
      setTraders(prev => prev.map(x => x.id === t.id ? { ...x, isActive: t.isActive } : x))
    }
  }

  // ── Derived stats ───────────────────────────────────────────────────────────
  const active  = traders.filter(t => t.isActive).length
  const avgWin  = traders.length ? (traders.reduce((s, t) => s + t.winRate, 0) / traders.length).toFixed(1) : '—'
  const avgDD   = traders.length ? (traders.reduce((s, t) => s + (t.riskLevel === 'High' ? 12 : t.riskLevel === 'Medium' ? 7 : 4), 0) / traders.length).toFixed(1) : '—'

  // ── Form input helper ───────────────────────────────────────────────────────
  const F = (key: keyof typeof BLANK) => ({
    value: form[key] as string | boolean,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value })),
  })

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto overflow-x-hidden">
      <style>{`@keyframes skPulse { 0%,100%{opacity:.5} 50%{opacity:.15} } @keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'hsl(40 6% 95%)', marginBottom: 3 }}>Copy Traders</h1>
          <p style={{ fontSize: 13, color: 'hsl(240 5% 55%)' }}>Add, edit, and manage the traders shown to users</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={fetchTraders} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 0.875rem', borderRadius: '0.6rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'hsl(40 6% 75%)', fontSize: 13, cursor: 'pointer' }}>
            <RefreshCw size={13} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
          </button>
          <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 1rem', borderRadius: '0.6rem', background: 'linear-gradient(135deg,#a78bfa,#22d3ee)', color: '#050505', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
            <Plus size={14} /> Add Trader
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 10, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#fca5a5', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={14} /> {error}
          <button onClick={fetchTraders} style={{ marginLeft: 'auto', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}>Retry</button>
        </div>
      )}

      {/* Stats strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Traders',  value: loading ? '…' : String(traders.length), icon: Copy,      color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
          { label: 'Active Traders', value: loading ? '…' : String(active),         icon: Users,     color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
          { label: 'Avg. Win Rate',  value: loading ? '…' : `${avgWin}%`,           icon: TrendingUp,color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.875rem', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '0.6rem', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <s.icon size={16} style={{ color: s.color }} />
            </div>
            <div>
              <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)', marginBottom: 2 }}>{s.label}</p>
              <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'hsl(40 6% 92%)' }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Trader cards grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0,1,2].map(i => (
            <div key={i} style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.875rem', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <Skeleton w={48} h={48} />
                <div style={{ flex: 1 }}><Skeleton w="70%" h={13} /><div style={{ marginTop: 6 }}><Skeleton w="40%" h={11} /></div></div>
              </div>
              <Skeleton w="100%" h={10} /><div style={{ marginTop: 8 }}><Skeleton w="80%" h={10} /></div>
            </div>
          ))}
        </div>
      ) : traders.length === 0 ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.875rem' }}>
          <Copy size={32} style={{ color: 'rgba(255,255,255,0.1)', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: 'hsl(240 5% 45%)', marginBottom: 6 }}>No copy traders yet</p>
          <p style={{ fontSize: 13, color: 'hsl(240 5% 35%)', marginBottom: 16 }}>Add your first trader — they'll appear on the user dashboard immediately.</p>
          <button onClick={openAdd} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.5rem 1.25rem', borderRadius: '0.6rem', background: 'rgba(167,139,250,0.15)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.25)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={13} /> Add First Trader
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {traders.map(t => (
            <div key={t.id} style={{ background: 'hsl(260 60% 5%)', border: `1px solid ${t.isActive ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.04)'}`, borderRadius: '0.875rem', padding: '1.25rem', opacity: t.isActive ? 1 : 0.55, transition: 'opacity 0.2s' }}>
              {/* Top row: avatar + name + toggle */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <TraderAvatar trader={t} size={48} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <p style={{ fontWeight: 700, color: 'hsl(40 6% 92%)', fontSize: 14 }}>{t.name}</p>
                      {t.isVerified && <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 999, background: 'rgba(96,165,250,0.15)', color: '#60a5fa' }}>✓ VER</span>}
                    </div>
                    <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)', marginTop: 1 }}>{t.username || t.strategy}</p>
                  </div>
                </div>
                {/* Toggle */}
                <button onClick={() => handleToggle(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.isActive ? '#a78bfa' : 'hsl(240 5% 40%)', padding: 0, flexShrink: 0 }}>
                  {t.isActive ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
                </button>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 10 }}>
                {[
                  { label: 'Win Rate',   value: `${t.winRate}%` },
                  { label: 'Monthly',    value: `+${t.monthlyReturn}%` },
                  { label: 'Total Ret.', value: `+${t.totalReturn}%` },
                ].map(s => (
                  <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '6px 4px', textAlign: 'center' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa' }}>{s.value}</p>
                    <p style={{ fontSize: 10, color: 'hsl(240 5% 50%)' }}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Risk + Strategy */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 999, color: RISK_COLORS[t.riskLevel] ?? '#a78bfa', background: `${RISK_COLORS[t.riskLevel] ?? '#a78bfa'}18` }}>{t.riskLevel} Risk</span>
                <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', color: 'hsl(240 5% 60%)' }}>{t.strategy}</span>
                {(Array.isArray(t.tags) ? t.tags : []).slice(0,2).map(tag => (
                  <span key={tag} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999, background: 'rgba(255,255,255,0.04)', color: 'hsl(240 5% 55%)' }}>{tag}</span>
                ))}
              </div>

              {/* Min + Followers */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'hsl(240 5% 50%)', marginBottom: 12 }}>
                <span>Min: <span style={{ color: 'hsl(40 6% 78%)' }}>${t.minAmount.toLocaleString()}</span></span>
                <span>Followers: <span style={{ color: 'hsl(40 6% 78%)' }}>{t.followers.toLocaleString()}</span></span>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => openEdit(t)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '0.45rem', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(40 6% 78%)', fontSize: 12, cursor: 'pointer' }}>
                  <Pencil size={12} /> Edit
                </button>
                <button onClick={() => openDelete(t)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '0.45rem', borderRadius: 8, background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.15)', color: '#f87171', fontSize: 12, cursor: 'pointer' }}>
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add / Edit Modal ─────────────────────────────────────────────────── */}
      {(modalMode === 'add' || modalMode === 'edit') && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }} onClick={closeModal} />
          <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', background: 'hsl(260 87% 4%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '1.5rem', scrollbarWidth: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'hsl(40 6% 95%)' }}>{modalMode === 'add' ? 'Add Trader' : 'Edit Trader'}</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', color: 'hsl(240 5% 55%)', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
            </div>

            {formError && (
              <div style={{ marginBottom: 12, padding: '8px 12px', borderRadius: 8, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#fca5a5', fontSize: 12, display: 'flex', gap: 7, alignItems: 'center' }}>
                <AlertCircle size={13} /> {formError}
              </div>
            )}

            {/* Photo upload */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{ width: 90, height: 90, borderRadius: '50%', cursor: 'pointer', overflow: 'hidden', border: '2px dashed rgba(167,139,250,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', position: 'relative' }}
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : editTarget?.imageUrl ? (
                  <img src={imgSrc(editTarget.imageUrl) ?? ''} alt="current" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <Camera size={22} style={{ color: 'hsl(240 5% 45%)' }} />
                    <span style={{ fontSize: 10, color: 'hsl(240 5% 45%)' }}>Upload photo</span>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
              <p style={{ fontSize: 11, color: 'hsl(240 5% 45%)', marginTop: 6 }}>Click to upload trader photo (JPG, PNG, WebP)</p>
            </div>

            {/* Form fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Name + Username */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <FormField label="Name *" placeholder="e.g. Alex Mercer" {...F('name')} />
                <FormField label="Username" placeholder="@handle" {...F('username')} />
              </div>

              {/* Strategy */}
              <div>
                <label style={labelStyle}>Strategy *</label>
                <select value={form.strategy} onChange={e => setForm(p => ({ ...p, strategy: e.target.value }))} style={inputStyle}>
                  {STRATEGIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Win Rate + Monthly + Total */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <FormField label="Win Rate %" type="number" placeholder="74" {...F('winRate')} />
                <FormField label="Monthly Ret %" type="number" placeholder="8.4" {...F('monthlyReturn')} />
                <FormField label="Total Ret %" type="number" placeholder="142" {...F('totalReturn')} />
              </div>

              {/* Followers + Min Amount + Risk */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <FormField label="Followers" type="number" placeholder="1248" {...F('followers')} />
                <FormField label="Min Amount $" type="number" placeholder="500" {...F('minAmount')} />
                <div>
                  <label style={labelStyle}>Risk Level</label>
                  <select value={form.riskLevel} onChange={e => setForm(p => ({ ...p, riskLevel: e.target.value }))} style={inputStyle}>
                    {RISK_LEVELS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              {/* Tags */}
              <FormField label="Tags (comma-separated)" placeholder="BTC, ETH, Swing" {...F('tags')} />

              {/* Fees label (shown on the trader card on the user side) */}
              <FormField label="Fees Label (shown to users)" placeholder="e.g. 0% fees, 1.5% fees, Performance fee 20%" {...F('feeLabel')} />

              {/* Description */}
              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Brief bio or strategy summary..."
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }}
                />
              </div>

              {/* Sort Order */}
              <FormField label="Sort Order" type="number" placeholder="0" {...F('sortOrder')} />

              {/* Toggles */}
              <div style={{ display: 'flex', gap: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'hsl(40 6% 78%)' }}>
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} />
                  Active (visible to users)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'hsl(40 6% 78%)' }}>
                  <input type="checkbox" checked={form.isVerified} onChange={e => setForm(p => ({ ...p, isVerified: e.target.checked }))} />
                  Verified badge
                </label>
              </div>
            </div>

            {/* Modal actions */}
            <div style={{ display: 'flex', gap: 10, marginTop: '1.5rem' }}>
              <button onClick={closeModal} style={{ flex: 1, padding: '0.6rem', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(40 6% 78%)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '0.6rem', borderRadius: 10, background: saving ? 'rgba(167,139,250,0.3)' : 'linear-gradient(135deg,#a78bfa,#22d3ee)', color: '#050505', fontSize: 13, fontWeight: 700, border: 'none', cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Saving…' : modalMode === 'add' ? 'Add Trader' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ──────────────────────────────────────────────── */}
      {modalMode === 'delete' && deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }} onClick={closeModal} />
          <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 400, background: 'hsl(260 87% 4%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '1.5rem' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f87171', marginBottom: 8 }}>Delete Trader</h2>
            <p style={{ fontSize: 13, color: 'hsl(240 5% 60%)', marginBottom: 20 }}>
              Remove <strong style={{ color: 'hsl(40 6% 90%)' }}>{deleteTarget.name}</strong> from the platform? Users will no longer see them.
            </p>
            {formError && <p style={{ fontSize: 12, color: '#f87171', marginBottom: 12 }}>{formError}</p>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={closeModal} style={{ flex: 1, padding: '0.6rem', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(40 6% 78%)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleDelete} disabled={saving} style={{ flex: 1, padding: '0.6rem', borderRadius: 10, background: saving ? 'rgba(248,113,113,0.3)' : 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Reusable form field ───────────────────────────────────────────────────────
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: 'hsl(240 5% 50%)', marginBottom: 5, letterSpacing: '0.04em', textTransform: 'uppercase' }
const inputStyle: React.CSSProperties = { width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(40 6% 88%)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }

function FormField({ label, placeholder, value, onChange, type = 'text' }: {
  label: string; placeholder?: string; value: string | boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        value={value as string}
        onChange={onChange}
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  )
}
