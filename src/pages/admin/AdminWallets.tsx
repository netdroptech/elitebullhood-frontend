import { useState, useEffect, useCallback } from 'react'
import {
  Wallet, Plus, Pencil, Trash2, Copy, Check, ToggleLeft, ToggleRight,
  X, ChevronDown, AlertCircle, ShieldCheck, Eye, EyeOff,
  Globe, Loader2,
} from 'lucide-react'
import { adminApi } from '@/lib/api'

// ─── Types ───────────────────────────────────────────────────────────────────

interface WalletEntry {
  id:        string
  network:   string
  label:     string
  address:   string
  tag?:      string
  chain?:    string
  icon:      string
  color:     string
  isActive:  boolean
  createdAt: string
}

type ModalMode = 'add' | 'edit' | 'delete' | null

// ─── Network config ───────────────────────────────────────────────────────────

const NETWORKS = [
  { name: 'Bitcoin',       icon: '₿', color: '#f7931a', chains: ['Native SegWit', 'Legacy', 'P2SH'] },
  { name: 'Ethereum',      icon: 'Ξ', color: '#627eea', chains: ['ERC-20'] },
  { name: 'USDT',          icon: '₮', color: '#26a17b', chains: ['ERC-20', 'TRC-20', 'BEP-20', 'SOL'] },
  { name: 'USDC',          icon: '○', color: '#2775ca', chains: ['ERC-20', 'TRC-20', 'BEP-20', 'SOL'] },
  { name: 'BNB',           icon: 'B', color: '#f3ba2f', chains: ['BEP-20', 'BEP-2'] },
  { name: 'Solana',        icon: '◎', color: '#9945ff', chains: ['SPL'] },
  { name: 'XRP',           icon: 'X', color: '#00aae4', chains: ['XRP Ledger'] },
  { name: 'Litecoin',      icon: 'Ł', color: '#bfbbbb', chains: ['Native'] },
  { name: 'Dogecoin',      icon: 'Ð', color: '#c2a633', chains: ['Native'] },
  { name: 'Tron',          icon: 'T', color: '#e50914', chains: ['TRC-20', 'TRC-10'] },
  { name: 'Polygon',       icon: '◈', color: '#8247e5', chains: ['ERC-20'] },
  { name: 'Avalanche',     icon: 'A', color: '#e84142', chains: ['ERC-20'] },
  { name: 'Bank Transfer', icon: '$', color: '#8b5cf6', chains: ['SWIFT / WIRE', 'ACH', 'SEPA', 'Local'] },
  { name: 'PayPal',        icon: 'P', color: '#003087', chains: ['PayPal'] },
  { name: 'Custom',        icon: '?', color: '#94a3b8', chains: ['Other'] },
]

// ─── Small helpers ────────────────────────────────────────────────────────────

function truncateAddr(addr: string, chars = 14) {
  if (addr.length <= chars * 2 + 3) return addr
  return addr.slice(0, chars) + '…' + addr.slice(-chars)
}

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false)
  function handleCopy() {
    navigator.clipboard.writeText(text).catch(() => {})
    setDone(true)
    setTimeout(() => setDone(false), 1800)
  }
  return (
    <button
      onClick={handleCopy}
      title="Copy address"
      className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
    >
      {done ? <Check size={14} className="text-violet-400" /> : <Copy size={14} />}
    </button>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AdminWallets() {
  const [wallets,       setWallets]       = useState<WalletEntry[]>([])
  const [loading,       setLoading]       = useState(true)
  const [saving,        setSaving]        = useState(false)
  const [modal,         setModal]         = useState<ModalMode>(null)
  const [editTarget,    setEditTarget]    = useState<WalletEntry | null>(null)
  const [deleteTarget,  setDeleteTarget]  = useState<WalletEntry | null>(null)
  const [showAddress,   setShowAddress]   = useState<Record<string, boolean>>({})
  const [filterActive,  setFilterActive]  = useState<'all' | 'active' | 'inactive'>('all')
  const [searchQ,       setSearchQ]       = useState('')
  const [saveFlash,     setSaveFlash]     = useState(false)
  const [apiError,      setApiError]      = useState('')

  // Withdrawal method toggles
  const [cryptoEnabled, setCryptoEnabled] = useState(true)
  const [bankEnabled,   setBankEnabled]   = useState(true)
  const [togglingKey,   setTogglingKey]   = useState<string | null>(null)

  const EMPTY_FORM = { network: '', label: '', address: '', tag: '', chain: '', icon: '', color: '', isActive: true }
  const [form,       setForm]      = useState(EMPTY_FORM)
  const [formError,  setFormError] = useState('')
  const [networkOpen,setNetworkOpen] = useState(false)

  // ── Load wallets ─────────────────────────────────────────────────────────────
  const loadWallets = useCallback(async () => {
    setLoading(true)
    setApiError('')
    try {
      const [walletsRes, settingsRes] = await Promise.all([
        adminApi.get<{ success: boolean; data: WalletEntry[] }>('/admin/wallets'),
        adminApi.get<{ success: boolean; data: Record<string, string> }>('/admin/settings'),
      ])
      setWallets(walletsRes.data)
      const s = settingsRes.data
      setCryptoEnabled(s['withdrawal_crypto_enabled'] !== 'false')
      setBankEnabled(s['withdrawal_bank_enabled']     !== 'false')
    } catch (err: any) {
      setApiError(err.message ?? 'Failed to load wallets.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadWallets() }, [loadWallets])

  // ── Toggle a withdrawal method ────────────────────────────────────────────────
  async function toggleWithdrawalMethod(key: 'withdrawal_crypto_enabled' | 'withdrawal_bank_enabled', current: boolean) {
    setTogglingKey(key)
    const newVal = (!current).toString()
    try {
      await adminApi.patch(`/admin/settings/${key}`, { value: newVal })
      if (key === 'withdrawal_crypto_enabled') setCryptoEnabled(!current)
      else                                     setBankEnabled(!current)
    } catch (err: any) {
      setApiError(err.message ?? 'Failed to update setting.')
    } finally {
      setTogglingKey(null)
    }
  }

  // ── Derived ───────────────────────────────────────────────────────────────────
  const displayed = wallets.filter(w => {
    const matchStatus = filterActive === 'all' || (filterActive === 'active' ? w.isActive : !w.isActive)
    const q = searchQ.toLowerCase()
    const matchSearch = !q || w.network.toLowerCase().includes(q) || w.label.toLowerCase().includes(q) || w.address.toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  const stats = {
    total:    wallets.length,
    active:   wallets.filter(w => w.isActive).length,
    inactive: wallets.filter(w => !w.isActive).length,
    networks: [...new Set(wallets.map(w => w.network))].length,
  }

  // ── Modal helpers ─────────────────────────────────────────────────────────────
  function openAdd() {
    setForm(EMPTY_FORM)
    setFormError('')
    setNetworkOpen(false)
    setModal('add')
  }

  function openEdit(w: WalletEntry) {
    setForm({ network: w.network, label: w.label, address: w.address, tag: w.tag ?? '', chain: w.chain ?? '', icon: w.icon, color: w.color, isActive: w.isActive })
    setFormError('')
    setNetworkOpen(false)
    setEditTarget(w)
    setModal('edit')
  }

  function openDelete(w: WalletEntry) {
    setDeleteTarget(w)
    setModal('delete')
  }

  function selectNetwork(net: typeof NETWORKS[0]) {
    setForm(f => ({ ...f, network: net.name, icon: net.icon, color: net.color, chain: net.chains[0] }))
    setNetworkOpen(false)
  }

  // ── Save (add / edit) ─────────────────────────────────────────────────────────
  async function handleSave() {
    if (!form.network)      { setFormError('Please select a network.'); return }
    if (!form.label.trim()) { setFormError('Label is required.'); return }
    if (!form.address.trim()){ setFormError('Wallet address / key is required.'); return }

    setSaving(true)
    setFormError('')
    try {
      const payload = {
        network:  form.network,
        label:    form.label.trim(),
        address:  form.address.trim(),
        tag:      form.tag.trim() || null,
        chain:    form.chain     || null,
        icon:     form.icon      || '?',
        color:    form.color     || '#94a3b8',
        isActive: form.isActive,
      }

      if (modal === 'add') {
        const res = await adminApi.post<{ success: boolean; data: WalletEntry }>('/admin/wallets', payload)
        setWallets(prev => [res.data, ...prev])
      } else if (modal === 'edit' && editTarget) {
        const res = await adminApi.put<{ success: boolean; data: WalletEntry }>(`/admin/wallets/${editTarget.id}`, payload)
        setWallets(prev => prev.map(w => w.id === editTarget.id ? res.data : w))
      }

      setSaveFlash(true)
      setTimeout(() => setSaveFlash(false), 2500)
      setModal(null)
    } catch (err: any) {
      setFormError(err.message ?? 'Failed to save wallet.')
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteTarget) return
    setSaving(true)
    try {
      await adminApi.delete(`/admin/wallets/${deleteTarget.id}`)
      setWallets(prev => prev.filter(w => w.id !== deleteTarget.id))
      setModal(null)
    } catch (err: any) {
      setApiError(err.message ?? 'Failed to delete wallet.')
      setModal(null)
    } finally {
      setSaving(false)
    }
  }

  // ── Toggle active ──────────────────────────────────────────────────────────────
  async function toggleActive(w: WalletEntry) {
    // Optimistic update
    setWallets(prev => prev.map(x => x.id === w.id ? { ...x, isActive: !x.isActive } : x))
    try {
      await adminApi.put(`/admin/wallets/${w.id}`, { ...w, isActive: !w.isActive })
    } catch {
      // Revert on failure
      setWallets(prev => prev.map(x => x.id === w.id ? { ...x, isActive: w.isActive } : x))
    }
  }

  function toggleShowAddress(id: string) {
    setShowAddress(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const netMeta = NETWORKS.find(n => n.name === form.network)

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 md:p-8 min-h-screen" style={{ color: 'hsl(40 6% 95%)' }}>

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.18)', border: '1px solid rgba(139,92,246,0.3)' }}>
              <Wallet size={18} style={{ color: '#a78bfa' }} />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Update Wallet</h1>
          </div>
          <p className="text-sm" style={{ color: 'hsl(240 5% 65%)' }}>
            Manage deposit wallet addresses shown to clients. Toggle, edit, or add any network.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-[1.03] active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', color: '#fff', boxShadow: '0 4px 20px rgba(139,92,246,0.35)' }}
        >
          <Plus size={15} />
          Add Wallet
        </button>
      </div>

      {/* ── Withdrawal Method Toggles ── */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1.5 h-5 rounded-full" style={{ background: 'linear-gradient(to bottom,#a78bfa,#8b5cf6)' }} />
          <h2 className="text-base font-semibold" style={{ color: 'hsl(40 6% 90%)' }}>Withdrawal Methods</h2>
          <span className="text-xs px-2 py-0.5 rounded-full ml-1" style={{ background: 'rgba(255,255,255,0.05)', color: 'hsl(240 5% 55%)', border: '1px solid rgba(255,255,255,0.08)' }}>
            Controls which methods users can withdraw with
          </span>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            {
              key:     'withdrawal_crypto_enabled' as const,
              label:   'Cryptocurrency',
              desc:    'Allow users to withdraw via crypto wallet addresses (BTC, ETH, USDT, etc.)',
              icon:    '₿',
              enabled: cryptoEnabled,
            },
            {
              key:     'withdrawal_bank_enabled' as const,
              label:   'Bank Wire Transfer',
              desc:    'Allow users to withdraw via bank wire transfer (SWIFT, ACH, SEPA, etc.)',
              icon:    '🏦',
              enabled: bankEnabled,
            },
          ].map(m => {
            const isToggling = togglingKey === m.key
            return (
              <div
                key={m.key}
                className="rounded-2xl p-5 flex items-start gap-4 transition-all"
                style={{
                  background: m.enabled ? 'rgba(167,139,250,0.04)' : 'rgba(248,113,113,0.04)',
                  border: `1px solid ${m.enabled ? 'rgba(167,139,250,0.2)' : 'rgba(248,113,113,0.2)'}`,
                }}
              >
                {/* Icon */}
                <div className="text-2xl w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: m.enabled ? 'rgba(167,139,250,0.1)' : 'rgba(248,113,113,0.1)' }}>
                  {m.icon}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold" style={{ color: 'hsl(40 6% 92%)' }}>{m.label}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{
                        background: m.enabled ? 'rgba(167,139,250,0.12)' : 'rgba(248,113,113,0.12)',
                        color:      m.enabled ? '#a78bfa' : '#f87171',
                      }}>
                      {m.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'hsl(240 5% 52%)' }}>{m.desc}</p>
                </div>

                {/* Toggle */}
                <button
                  onClick={() => toggleWithdrawalMethod(m.key, m.enabled)}
                  disabled={isToggling}
                  title={m.enabled ? 'Disable' : 'Enable'}
                  className="shrink-0 transition-transform active:scale-95"
                  style={{ background: 'none', border: 'none', cursor: isToggling ? 'not-allowed' : 'pointer', opacity: isToggling ? 0.6 : 1 }}
                >
                  {isToggling
                    ? <Loader2 size={28} style={{ color: '#a78bfa', animation: 'spin 1s linear infinite' }} />
                    : m.enabled
                      ? <ToggleRight size={34} style={{ color: '#a78bfa' }} />
                      : <ToggleLeft  size={34} style={{ color: '#f87171' }} />
                  }
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Save flash ── */}
      {saveFlash && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
          style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa' }}>
          <Check size={14} /> Wallet saved successfully
        </div>
      )}

      {/* ── API error ── */}
      {apiError && (
        <div className="flex items-center gap-2 mb-6 px-4 py-3 rounded-xl text-sm"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
          <AlertCircle size={14} /> {apiError}
          <button onClick={() => setApiError('')} className="ml-auto"><X size={13} /></button>
        </div>
      )}

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Wallets', value: stats.total,    icon: <Wallet size={16} />,     col: '#a78bfa' },
          { label: 'Active',        value: stats.active,   icon: <ShieldCheck size={16} />, col: '#a78bfa' },
          { label: 'Inactive',      value: stats.inactive, icon: <AlertCircle size={16} />, col: '#f87171' },
          { label: 'Networks',      value: stats.networks, icon: <Globe size={16} />,       col: '#38bdf8' },
        ].map(s => (
          <div key={s.label} className="liquid-glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2 text-xs" style={{ color: s.col }}>
              {s.icon}
              <span>{s.label}</span>
            </div>
            <div className="text-3xl font-bold tracking-tight" style={{ color: 'hsl(40 10% 96%)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input
          value={searchQ}
          onChange={e => setSearchQ(e.target.value)}
          placeholder="Search wallets…"
          className="flex-1 min-w-[180px] max-w-xs h-9 px-4 rounded-xl text-sm outline-none"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(40 6% 95%)' }}
        />
        {(['all', 'active', 'inactive'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilterActive(f)}
            className="px-4 py-1.5 rounded-full text-xs font-medium capitalize transition-all"
            style={filterActive === f
              ? { background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.5)', color: '#c4b5fd' }
              : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'hsl(240 5% 65%)' }}
          >
            {f}
          </button>
        ))}
        <span className="ml-auto text-xs" style={{ color: 'hsl(240 5% 65%)' }}>
          {displayed.length} / {wallets.length} wallet{wallets.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-32">
          <Loader2 size={28} style={{ color: 'hsl(240 5% 40%)', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* ── Wallet cards grid ── */}
      {!loading && displayed.length === 0 && (
        <div className="text-center py-24 liquid-glass rounded-3xl">
          <Wallet size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm" style={{ color: 'hsl(240 5% 65%)' }}>No wallets found.</p>
        </div>
      )}

      {!loading && displayed.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {displayed.map(w => (
            <WalletCard
              key={w.id}
              wallet={w}
              revealed={!!showAddress[w.id]}
              onReveal={() => toggleShowAddress(w.id)}
              onToggle={() => toggleActive(w)}
              onEdit={() => openEdit(w)}
              onDelete={() => openDelete(w)}
            />
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════════
          Add / Edit Modal
      ════════════════════════════════════════════ */}
      {(modal === 'add' || modal === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
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
                <h2 className="text-lg font-semibold">{modal === 'add' ? 'Add New Wallet' : 'Edit Wallet'}</h2>
                <p className="text-xs" style={{ color: 'hsl(240 5% 65%)' }}>
                  {modal === 'add' ? 'Enter wallet details and address / key' : 'Update wallet information'}
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

              {/* Network selector */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'hsl(240 5% 65%)' }}>Network / Type *</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setNetworkOpen(o => !o)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left"
                    style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${form.color ? form.color + '55' : 'rgba(255,255,255,0.1)'}` }}
                  >
                    {form.network ? (
                      <>
                        <span className="w-7 h-7 rounded-lg flex items-center justify-center text-base font-bold flex-shrink-0"
                          style={{ background: form.color + '25', color: form.color }}>{form.icon}</span>
                        <span>{form.network}</span>
                      </>
                    ) : (
                      <span style={{ color: 'hsl(240 5% 50%)' }}>Select a network…</span>
                    )}
                    <ChevronDown size={14} className={`ml-auto transition-transform ${networkOpen ? 'rotate-180' : ''}`} style={{ color: 'hsl(240 5% 65%)' }} />
                  </button>

                  {networkOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden z-10 max-h-64 overflow-y-auto"
                      style={{ background: 'hsl(260 40% 5%)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 16px 40px rgba(0,0,0,0.5)' }}>
                      {NETWORKS.map(net => (
                        <button key={net.name} type="button" onClick={() => selectNetwork(net)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors text-left">
                          <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                            style={{ background: net.color + '25', color: net.color }}>{net.icon}</span>
                          <span>{net.name}</span>
                          <span className="ml-auto text-xs" style={{ color: 'hsl(240 5% 50%)' }}>{net.chains[0]}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Chain / Protocol */}
              {netMeta && netMeta.chains.length > 1 && (
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: 'hsl(240 5% 65%)' }}>Chain / Protocol</label>
                  <div className="flex flex-wrap gap-2">
                    {netMeta.chains.map(c => (
                      <button key={c} type="button" onClick={() => setForm(f => ({ ...f, chain: c }))}
                        className="px-3 py-1.5 rounded-lg text-xs transition-all"
                        style={form.chain === c
                          ? { background: form.color + '30', border: `1px solid ${form.color}80`, color: form.color }
                          : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'hsl(240 5% 65%)' }}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Label */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'hsl(240 5% 65%)' }}>Wallet Label *</label>
                <input
                  value={form.label}
                  onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                  placeholder="e.g. BTC Main Wallet"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(40 6% 95%)' }}
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'hsl(240 5% 65%)' }}>
                  Wallet Address / Key *
                </label>
                <textarea
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="Enter the full wallet address or payment key"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none font-mono"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(40 6% 95%)' }}
                />
                <p className="text-xs mt-1" style={{ color: 'hsl(240 5% 50%)' }}>
                  Double-check the address before saving — deposits will be sent here.
                </p>
              </div>

              {/* Memo / Tag */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'hsl(240 5% 65%)' }}>
                  Memo / Tag / Destination Tag <span style={{ color: 'hsl(240 5% 45%)' }}>(optional)</span>
                </label>
                <input
                  value={form.tag}
                  onChange={e => setForm(f => ({ ...f, tag: e.target.value }))}
                  placeholder="Required for XRP, XLM, BNB, etc."
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(40 6% 95%)' }}
                />
              </div>

              {/* Active toggle */}
              <div className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div>
                  <p className="text-sm font-medium">Active on Platform</p>
                  <p className="text-xs mt-0.5" style={{ color: 'hsl(240 5% 55%)' }}>
                    Clients will see this wallet as a deposit option
                  </p>
                </div>
                <button type="button" onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}>
                  {form.isActive
                    ? <ToggleRight size={30} style={{ color: '#a78bfa' }} />
                    : <ToggleLeft  size={30} style={{ color: 'hsl(240 5% 45%)' }} />}
                </button>
              </div>

            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setModal(null)} disabled={saving} className="flex-1 py-3 rounded-xl text-sm transition-colors hover:bg-white/5"
                style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(240 5% 65%)' }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', color: '#fff' }}>
                {saving && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                {modal === 'add' ? 'Add Wallet' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
          Delete Modal
      ════════════════════════════════════════════ */}
      {modal === 'delete' && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full max-w-sm rounded-3xl p-8"
            style={{ background: 'hsl(260 40% 7%)', border: '1px solid rgba(239,68,68,0.3)', boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: 'rgba(239,68,68,0.15)' }}>
              <Trash2 size={20} style={{ color: '#f87171' }} />
            </div>
            <h2 className="text-lg font-semibold text-center mb-2">Remove Wallet?</h2>
            <p className="text-sm text-center mb-2" style={{ color: 'hsl(240 5% 65%)' }}>
              You're about to remove <strong style={{ color: 'hsl(40 6% 95%)' }}>{deleteTarget.label}</strong>.
            </p>
            <p className="text-xs text-center mb-7" style={{ color: 'hsl(240 5% 50%)' }}>
              This wallet will no longer appear as a deposit option for clients.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} disabled={saving} className="flex-1 py-3 rounded-xl text-sm transition-colors hover:bg-white/5"
                style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(240 5% 65%)' }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={saving}
                className="flex-1 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all hover:opacity-90"
                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', color: '#f87171' }}>
                {saving && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

// ─── Wallet Card ──────────────────────────────────────────────────────────────

interface CardProps {
  wallet:   WalletEntry
  revealed: boolean
  onReveal: () => void
  onToggle: () => void
  onEdit:   () => void
  onDelete: () => void
}

function WalletCard({ wallet: w, revealed, onReveal, onToggle, onEdit, onDelete }: CardProps) {
  return (
    <div className="liquid-glass rounded-3xl p-6 flex flex-col gap-4 transition-all hover:bg-white/[0.02]"
      style={{ borderLeft: `3px solid ${w.color}55` }}>

      {/* Top row */}
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0"
          style={{ background: w.color + '20', color: w.color }}>
          {w.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm truncate">{w.label}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium"
              style={w.isActive
                ? { background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa' }
                : { background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}>
              {w.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="text-xs" style={{ color: 'hsl(240 5% 65%)' }}>{w.network}</span>
            {w.chain && (
              <>
                <span style={{ color: 'hsl(240 5% 40%)' }}>·</span>
                <span className="text-xs" style={{ color: 'hsl(240 5% 55%)' }}>{w.chain}</span>
              </>
            )}
          </div>
        </div>
        {/* Toggle active */}
        <button onClick={onToggle} className="flex-shrink-0 transition-colors hover:opacity-80">
          {w.isActive
            ? <ToggleRight size={24} style={{ color: '#a78bfa' }} />
            : <ToggleLeft  size={24} style={{ color: 'hsl(240 5% 40%)' }} />}
        </button>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />

      {/* Address */}
      <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-xs" style={{ color: 'hsl(240 5% 55%)' }}>Address / Key</span>
          <div className="flex items-center gap-1">
            <button onClick={onReveal} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" title={revealed ? 'Hide' : 'Reveal'}>
              {revealed ? <EyeOff size={13} style={{ color: 'hsl(240 5% 60%)' }} /> : <Eye size={13} style={{ color: 'hsl(240 5% 60%)' }} />}
            </button>
            <CopyBtn text={w.address} />
          </div>
        </div>
        <p className="text-xs font-mono break-all leading-relaxed" style={{ color: 'hsl(40 6% 82%)' }}>
          {revealed ? w.address : truncateAddr(w.address, 10)}
        </p>
      </div>

      {/* Memo / Tag */}
      {w.tag && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,193,7,0.06)', border: '1px solid rgba(255,193,7,0.15)' }}>
          <AlertCircle size={12} style={{ color: '#fbbf24' }} />
          <span className="text-xs" style={{ color: '#fbbf24' }}>Memo / Tag required:</span>
          <span className="text-xs font-mono font-semibold" style={{ color: '#fde68a' }}>{w.tag}</span>
          <CopyBtn text={w.tag} />
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px]" style={{ color: 'hsl(240 5% 45%)' }}>
          Added {new Date(w.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
        <div className="flex items-center gap-1">
          <button onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors hover:bg-white/8"
            style={{ color: 'hsl(240 5% 65%)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Pencil size={11} /> Edit
          </button>
          <button onClick={onDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors hover:bg-red-500/10"
            style={{ color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
            <Trash2 size={11} /> Remove
          </button>
        </div>
      </div>
    </div>
  )
}
