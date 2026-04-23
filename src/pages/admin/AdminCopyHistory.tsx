import { useState, useEffect } from 'react'
import {
  History, Plus, Pencil, Trash2, X, AlertCircle, RefreshCw,
  TrendingUp, Activity, BarChart2, Users,
} from 'lucide-react'
import { adminApi } from '@/lib/api'

/* ─── Types ─────────────────────────────────────────────────────────────────── */
interface LookupUser   { id: string; fullName: string; email: string }
interface LookupTrader { id: string; name: string }

interface CopyRelationship {
  id: string; followerId: string; traderId: string
  allocatedAmount: number; maxDrawdown: number | null
  profitLoss: number; status: string
  startTime: string; stopTime: string | null
  createdAt: string; updatedAt: string
  followerName: string; followerEmail: string; traderName: string
}

interface CopyTrade {
  id: string; relationshipId: string; followerId: string; traderId: string
  asset: string; tradeType: string; entryPrice: number; exitPrice: number | null
  lotSize: number; profitLoss: number; status: string
  createdAt: string; closedAt: string | null
  followerName: string; traderName: string
}

type Tab = 'relationships' | 'trades'
type Modal = 'add-rel' | 'edit-rel' | 'del-rel' | 'add-trade' | 'edit-trade' | 'del-trade' | null

/* ─── Helpers ───────────────────────────────────────────────────────────────── */
function fmtMoney(n: number) { return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function Skeleton({ w = '100%', h = 14 }: { w?: string | number; h?: string | number }) {
  return <div style={{ width: w, height: h, borderRadius: 6, background: 'rgba(255,255,255,0.07)', animation: 'skPulse 1.4s ease-in-out infinite' }} />
}

const fieldStyle: React.CSSProperties = {
  width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
  color: 'hsl(40 6% 92%)', fontSize: 13, outline: 'none', boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600, color: 'hsl(240 5% 55%)', marginBottom: 4,
}

/* ─── Main Component ────────────────────────────────────────────────────────── */
export function AdminCopyHistory() {
  const [tab, setTab] = useState<Tab>('relationships')
  const [modal, setModal] = useState<Modal>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  // Data
  const [relationships, setRelationships] = useState<CopyRelationship[]>([])
  const [trades, setTrades] = useState<CopyTrade[]>([])
  const [users, setUsers] = useState<LookupUser[]>([])
  const [traders, setTraders] = useState<LookupTrader[]>([])

  // Selected item for edit/delete
  const [selected, setSelected] = useState<CopyRelationship | CopyTrade | null>(null)

  // ─ Relationship form
  const [relForm, setRelForm] = useState({
    followerId: '', traderId: '', allocatedAmount: '', maxDrawdown: '',
    profitLoss: '0', status: 'active', startTime: '', stopTime: '',
  })

  // ─ Trade form
  const [tradeForm, setTradeForm] = useState({
    relationshipId: '', followerId: '', traderId: '', asset: '', tradeType: 'buy',
    entryPrice: '', exitPrice: '', lotSize: '', profitLoss: '0', status: 'open',
    createdAt: '', closedAt: '',
  })

  /* ─── Fetch ─────────────────────────────────────────────────────────────── */
  async function fetchAll() {
    setLoading(true); setError(null)
    try {
      const [lookups, rels, tds] = await Promise.all([
        adminApi.get<{ success: boolean; data: { users: LookupUser[]; traders: LookupTrader[] } }>('/admin/copy-lookups'),
        adminApi.get<{ success: boolean; data: CopyRelationship[] }>('/admin/copy-relationships'),
        adminApi.get<{ success: boolean; data: CopyTrade[] }>('/admin/copy-trades'),
      ])
      setUsers(lookups.data.users ?? [])
      setTraders(lookups.data.traders ?? [])
      setRelationships(rels.data ?? [])
      setTrades(tds.data ?? [])
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load data')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  /* ─── Modal openers ─────────────────────────────────────────────────────── */
  function openAddRel() {
    setRelForm({ followerId: '', traderId: '', allocatedAmount: '', maxDrawdown: '', profitLoss: '0', status: 'active', startTime: '', stopTime: '' })
    setFormError(''); setModal('add-rel')
  }
  function openEditRel(r: CopyRelationship) {
    setSelected(r)
    setRelForm({
      followerId: r.followerId, traderId: r.traderId,
      allocatedAmount: String(r.allocatedAmount), maxDrawdown: r.maxDrawdown != null ? String(r.maxDrawdown) : '',
      profitLoss: String(r.profitLoss), status: r.status,
      startTime: r.startTime ? new Date(r.startTime).toISOString().slice(0, 16) : '',
      stopTime: r.stopTime ? new Date(r.stopTime).toISOString().slice(0, 16) : '',
    })
    setFormError(''); setModal('edit-rel')
  }
  function openDelRel(r: CopyRelationship) { setSelected(r); setModal('del-rel') }

  function openAddTrade() {
    setTradeForm({ relationshipId: '', followerId: '', traderId: '', asset: '', tradeType: 'buy', entryPrice: '', exitPrice: '', lotSize: '', profitLoss: '0', status: 'open', createdAt: '', closedAt: '' })
    setFormError(''); setModal('add-trade')
  }
  function openEditTrade(t: CopyTrade) {
    setSelected(t)
    setTradeForm({
      relationshipId: t.relationshipId, followerId: t.followerId, traderId: t.traderId,
      asset: t.asset, tradeType: t.tradeType,
      entryPrice: String(t.entryPrice), exitPrice: t.exitPrice != null ? String(t.exitPrice) : '',
      lotSize: String(t.lotSize), profitLoss: String(t.profitLoss), status: t.status,
      createdAt: t.createdAt ? new Date(t.createdAt).toISOString().slice(0, 16) : '',
      closedAt: t.closedAt ? new Date(t.closedAt).toISOString().slice(0, 16) : '',
    })
    setFormError(''); setModal('edit-trade')
  }
  function openDelTrade(t: CopyTrade) { setSelected(t); setModal('del-trade') }

  /* ─── Submit handlers ───────────────────────────────────────────────────── */
  async function submitRelationship() {
    if (!relForm.followerId || !relForm.traderId) { setFormError('User and Trader are required'); return }
    if (!relForm.allocatedAmount) { setFormError('Allocated amount is required'); return }
    setSaving(true); setFormError('')
    try {
      const body = {
        followerId: relForm.followerId,
        traderId: relForm.traderId,
        allocatedAmount: parseFloat(relForm.allocatedAmount),
        maxDrawdown: relForm.maxDrawdown ? parseFloat(relForm.maxDrawdown) : null,
        profitLoss: parseFloat(relForm.profitLoss || '0'),
        status: relForm.status,
        startTime: relForm.startTime || null,
        stopTime: relForm.stopTime || null,
      }
      if (modal === 'add-rel') {
        await adminApi.post('/admin/copy-relationships', body)
      } else {
        await adminApi.put(`/admin/copy-relationships/${(selected as CopyRelationship).id}`, body)
      }
      setModal(null); await fetchAll()
    } catch (e: any) { setFormError(e?.message ?? 'Save failed') }
    finally { setSaving(false) }
  }

  async function deleteRelationship() {
    setSaving(true)
    try {
      await adminApi.delete(`/admin/copy-relationships/${(selected as CopyRelationship).id}`)
      setModal(null); await fetchAll()
    } catch (e: any) { setFormError(e?.message ?? 'Delete failed') }
    finally { setSaving(false) }
  }

  async function submitTrade() {
    if (!tradeForm.followerId || !tradeForm.traderId) { setFormError('User and Trader are required'); return }
    if (!tradeForm.asset) { setFormError('Asset is required'); return }
    if (!tradeForm.entryPrice) { setFormError('Entry price is required'); return }
    setSaving(true); setFormError('')
    try {
      const body = {
        relationshipId: tradeForm.relationshipId || null,
        followerId: tradeForm.followerId,
        traderId: tradeForm.traderId,
        asset: tradeForm.asset,
        tradeType: tradeForm.tradeType,
        entryPrice: parseFloat(tradeForm.entryPrice),
        exitPrice: tradeForm.exitPrice ? parseFloat(tradeForm.exitPrice) : null,
        lotSize: parseFloat(tradeForm.lotSize || '0'),
        profitLoss: parseFloat(tradeForm.profitLoss || '0'),
        status: tradeForm.status,
        createdAt: tradeForm.createdAt || null,
        closedAt: tradeForm.closedAt || null,
      }
      if (modal === 'add-trade') {
        await adminApi.post('/admin/copy-trades', body)
      } else {
        await adminApi.put(`/admin/copy-trades/${(selected as CopyTrade).id}`, body)
      }
      setModal(null); await fetchAll()
    } catch (e: any) { setFormError(e?.message ?? 'Save failed') }
    finally { setSaving(false) }
  }

  async function deleteTrade() {
    setSaving(true)
    try {
      await adminApi.delete(`/admin/copy-trades/${(selected as CopyTrade).id}`)
      setModal(null); await fetchAll()
    } catch (e: any) { setFormError(e?.message ?? 'Delete failed') }
    finally { setSaving(false) }
  }

  /* ─── Derived stats ────────────────────────────────────────────────────── */
  const activeRels = relationships.filter(r => r.status === 'active').length
  const totalPnl   = relationships.reduce((s, r) => s + r.profitLoss, 0)
  const totalTrades = trades.length

  const TABS: { id: Tab; label: string; icon: any; count: number }[] = [
    { id: 'relationships', label: 'Copy Relationships', icon: Users, count: relationships.length },
    { id: 'trades',        label: 'Copy Trades',        icon: BarChart2, count: trades.length },
  ]

  /* ═══════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
      <style>{`@keyframes skPulse { 0%,100%{opacity:.5} 50%{opacity:.15} } @keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}`}</style>

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <History size={20} style={{ color: '#a78bfa' }} />
            <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'hsl(40 6% 95%)' }}>Copy Trading History</h1>
          </div>
          <p style={{ fontSize: 13, color: 'hsl(240 5% 55%)' }}>Manage copy relationships, trade logs, and history records for users</p>
        </div>
        <button onClick={fetchAll}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 0.875rem',
            borderRadius: '0.6rem', background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(40 6% 85%)', fontSize: 13, cursor: 'pointer' }}>
          <RefreshCw size={13} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        {[
          { label: 'Active Relationships', value: loading ? '...' : String(activeRels), icon: Activity, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
          { label: 'Total P&L',            value: loading ? '...' : `$${fmtMoney(totalPnl)}`, icon: TrendingUp, color: totalPnl >= 0 ? '#a78bfa' : '#f87171', bg: totalPnl >= 0 ? 'rgba(167,139,250,0.1)' : 'rgba(248,113,113,0.1)' },
          { label: 'Total Trades',         value: loading ? '...' : String(totalTrades), icon: BarChart2, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
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

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 1rem',
              borderRadius: '0.5rem 0.5rem 0 0', fontSize: 13, fontWeight: 500, cursor: 'pointer',
              border: 'none', borderBottom: tab === t.id ? '2px solid #a78bfa' : '2px solid transparent',
              background: 'none', color: tab === t.id ? '#a78bfa' : 'hsl(240 5% 55%)', marginBottom: -1 }}>
            <t.icon size={14} /> {t.label}
            <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', color: 'hsl(240 5% 60%)' }}>{t.count}</span>
          </button>
        ))}
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 10, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#fca5a5', fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* ═════════════ RELATIONSHIPS TAB ═════════════ */}
      {tab === 'relationships' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.875rem' }}>
            <button onClick={openAddRel}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 1rem',
                borderRadius: '0.6rem', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: 'linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)',
                color: '#050505', border: 'none', boxShadow: '0 4px 16px rgba(167,139,250,0.18)' }}>
              <Plus size={14} /> Add Relationship
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[0,1,2].map(i => <div key={i} style={{ height: 60, borderRadius: '0.75rem', background: 'hsl(260 60% 5%)' }}><Skeleton w="100%" h="100%" /></div>)}
            </div>
          ) : relationships.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.875rem' }}>
              <Users size={36} style={{ color: 'rgba(255,255,255,0.1)', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: 'hsl(240 5% 42%)' }}>No copy relationships yet</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {['User','Trader','Allocated','P&L','Status','Started','Stopped','Actions'].map(h => (
                      <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', color: 'hsl(240 5% 50%)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {relationships.map(r => {
                    const pnlPos = r.profitLoss >= 0
                    return (
                      <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <td style={{ padding: '0.625rem 0.75rem' }}>
                          <p style={{ color: 'hsl(40 6% 90%)', fontWeight: 600 }}>{r.followerName || '—'}</p>
                          <p style={{ fontSize: 10, color: 'hsl(240 5% 45%)', marginTop: 1 }}>{r.followerEmail}</p>
                        </td>
                        <td style={{ padding: '0.625rem 0.75rem', color: 'hsl(40 6% 85%)', fontWeight: 600 }}>{r.traderName || '—'}</td>
                        <td style={{ padding: '0.625rem 0.75rem', color: 'hsl(40 6% 80%)' }}>${fmtMoney(r.allocatedAmount)}</td>
                        <td style={{ padding: '0.625rem 0.75rem' }}>
                          <span style={{ fontWeight: 700, color: pnlPos ? '#a78bfa' : '#f87171' }}>
                            {pnlPos ? '+' : ''}${fmtMoney(r.profitLoss)}
                          </span>
                        </td>
                        <td style={{ padding: '0.625rem 0.75rem' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                            color: r.status === 'active' ? '#a78bfa' : 'hsl(240 5% 55%)',
                            background: r.status === 'active' ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.06)',
                            textTransform: 'capitalize' }}>
                            {r.status}
                          </span>
                        </td>
                        <td style={{ padding: '0.625rem 0.75rem', color: 'hsl(240 5% 55%)', whiteSpace: 'nowrap', fontSize: 11 }}>{fmtDate(r.startTime)}</td>
                        <td style={{ padding: '0.625rem 0.75rem', color: 'hsl(240 5% 55%)', whiteSpace: 'nowrap', fontSize: 11 }}>{fmtDate(r.stopTime)}</td>
                        <td style={{ padding: '0.625rem 0.75rem' }}>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button onClick={() => openEditRel(r)}
                              style={{ padding: '4px 8px', borderRadius: '0.4rem', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', cursor: 'pointer', color: '#c4b5fd' }}>
                              <Pencil size={12} />
                            </button>
                            <button onClick={() => openDelRel(r)}
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
        </>
      )}

      {/* ═════════════ TRADES TAB ═════════════ */}
      {tab === 'trades' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.875rem' }}>
            <button onClick={openAddTrade}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 1rem',
                borderRadius: '0.6rem', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: 'linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)',
                color: '#050505', border: 'none', boxShadow: '0 4px 16px rgba(167,139,250,0.18)' }}>
              <Plus size={14} /> Add Trade
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[0,1,2,3].map(i => <div key={i} style={{ height: 52, borderRadius: '0.75rem', background: 'hsl(260 60% 5%)' }}><Skeleton w="100%" h="100%" /></div>)}
            </div>
          ) : trades.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.875rem' }}>
              <BarChart2 size={36} style={{ color: 'rgba(255,255,255,0.1)', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: 'hsl(240 5% 42%)' }}>No copy trades yet</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {['User','Trader','Asset','Type','Entry','Exit','Lot','P&L','Status','Date','Actions'].map(h => (
                      <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', color: 'hsl(240 5% 50%)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {trades.map(t => {
                    const pnlPos = t.profitLoss >= 0
                    return (
                      <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <td style={{ padding: '0.625rem 0.75rem', color: 'hsl(40 6% 85%)', fontWeight: 600 }}>{t.followerName || '—'}</td>
                        <td style={{ padding: '0.625rem 0.75rem', color: 'hsl(40 6% 85%)', fontWeight: 600 }}>{t.traderName || '—'}</td>
                        <td style={{ padding: '0.625rem 0.75rem', color: 'hsl(40 6% 90%)', fontWeight: 700 }}>{t.asset || '—'}</td>
                        <td style={{ padding: '0.625rem 0.75rem' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 999,
                            color: t.tradeType === 'buy' ? '#a78bfa' : '#f87171',
                            background: t.tradeType === 'buy' ? 'rgba(167,139,250,0.12)' : 'rgba(248,113,113,0.12)',
                            textTransform: 'uppercase' }}>{t.tradeType}</span>
                        </td>
                        <td style={{ padding: '0.625rem 0.75rem', color: 'hsl(40 6% 80%)' }}>${parseFloat(String(t.entryPrice)).toFixed(2)}</td>
                        <td style={{ padding: '0.625rem 0.75rem', color: 'hsl(240 5% 55%)' }}>{t.exitPrice != null ? `$${parseFloat(String(t.exitPrice)).toFixed(2)}` : '—'}</td>
                        <td style={{ padding: '0.625rem 0.75rem', color: 'hsl(240 5% 65%)' }}>{t.lotSize}</td>
                        <td style={{ padding: '0.625rem 0.75rem' }}>
                          <span style={{ fontWeight: 700, color: pnlPos ? '#a78bfa' : '#f87171' }}>
                            {pnlPos ? '+' : ''}${fmtMoney(t.profitLoss)}
                          </span>
                        </td>
                        <td style={{ padding: '0.625rem 0.75rem' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 999,
                            color: t.status === 'open' ? '#f59e0b' : '#a78bfa',
                            background: t.status === 'open' ? 'rgba(245,158,11,0.12)' : 'rgba(167,139,250,0.12)',
                            textTransform: 'capitalize' }}>{t.status}</span>
                        </td>
                        <td style={{ padding: '0.625rem 0.75rem', color: 'hsl(240 5% 50%)', whiteSpace: 'nowrap', fontSize: 11 }}>{fmtDate(t.createdAt)}</td>
                        <td style={{ padding: '0.625rem 0.75rem' }}>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button onClick={() => openEditTrade(t)}
                              style={{ padding: '4px 8px', borderRadius: '0.4rem', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', cursor: 'pointer', color: '#c4b5fd' }}>
                              <Pencil size={12} />
                            </button>
                            <button onClick={() => openDelTrade(t)}
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
        </>
      )}

      {/* ═══════════ MODALS ═══════════ */}
      {/* ── Relationship Add/Edit Modal ── */}
      {(modal === 'add-rel' || modal === 'edit-rel') && (
        <div onClick={() => setModal(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: 'hsl(260 60% 6%)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '1.125rem', padding: '2rem', maxWidth: 520, width: '100%', animation: 'fadeIn 0.18s ease', boxShadow: '0 24px 64px rgba(0,0,0,0.6)', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setModal(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 50%)', padding: 4 }}><X size={16} /></button>

            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'hsl(40 6% 95%)', marginBottom: '1.5rem' }}>
              {modal === 'add-rel' ? 'Add Copy Relationship' : 'Edit Copy Relationship'}
            </h3>

            {formError && (
              <div style={{ marginBottom: 12, padding: '8px 12px', borderRadius: '0.5rem', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#fca5a5', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertCircle size={13} /> {formError}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <label>
                <span style={labelStyle}>User *</span>
                <select value={relForm.followerId} onChange={e => setRelForm({ ...relForm, followerId: e.target.value })} style={fieldStyle} disabled={modal === 'edit-rel'}>
                  <option value="">Select user...</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>)}
                </select>
              </label>
              <label>
                <span style={labelStyle}>Trader *</span>
                <select value={relForm.traderId} onChange={e => setRelForm({ ...relForm, traderId: e.target.value })} style={fieldStyle} disabled={modal === 'edit-rel'}>
                  <option value="">Select trader...</option>
                  {traders.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              <label>
                <span style={labelStyle}>Allocated ($)</span>
                <input type="number" value={relForm.allocatedAmount} onChange={e => setRelForm({ ...relForm, allocatedAmount: e.target.value })} style={fieldStyle} />
              </label>
              <label>
                <span style={labelStyle}>Max Drawdown (%)</span>
                <input type="number" value={relForm.maxDrawdown} onChange={e => setRelForm({ ...relForm, maxDrawdown: e.target.value })} placeholder="Optional" style={fieldStyle} />
              </label>
              <label>
                <span style={labelStyle}>Profit/Loss ($)</span>
                <input type="number" value={relForm.profitLoss} onChange={e => setRelForm({ ...relForm, profitLoss: e.target.value })} style={fieldStyle} />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: '1.5rem' }}>
              <label>
                <span style={labelStyle}>Status</span>
                <select value={relForm.status} onChange={e => setRelForm({ ...relForm, status: e.target.value })} style={fieldStyle}>
                  <option value="active">Active</option>
                  <option value="stopped">Stopped</option>
                </select>
              </label>
              <label>
                <span style={labelStyle}>Start Time</span>
                <input type="datetime-local" value={relForm.startTime} onChange={e => setRelForm({ ...relForm, startTime: e.target.value })} style={fieldStyle} />
              </label>
              <label>
                <span style={labelStyle}>Stop Time</span>
                <input type="datetime-local" value={relForm.stopTime} onChange={e => setRelForm({ ...relForm, stopTime: e.target.value })} style={fieldStyle} />
              </label>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModal(null)}
                style={{ flex: 1, padding: '0.6rem', borderRadius: '0.6rem', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(240 5% 65%)' }}>Cancel</button>
              <button onClick={submitRelationship} disabled={saving}
                style={{ flex: 2, padding: '0.6rem', borderRadius: '0.6rem', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)', color: '#050505', border: 'none' }}>
                {saving ? 'Saving...' : modal === 'add-rel' ? 'Create Relationship' : 'Update Relationship'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Relationship Delete Confirm ── */}
      {modal === 'del-rel' && selected && (
        <div onClick={() => setModal(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: 'hsl(260 60% 6%)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '1.125rem', padding: '2rem', maxWidth: 380, width: '100%', animation: 'fadeIn 0.18s ease' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'hsl(40 6% 95%)', marginBottom: 8 }}>Delete Relationship?</h3>
            <p style={{ fontSize: 13, color: 'hsl(240 5% 55%)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              This will permanently delete this copy relationship and all associated trades. This action cannot be undone.
            </p>
            {formError && <p style={{ fontSize: 12, color: '#f87171', marginBottom: 12 }}>{formError}</p>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModal(null)}
                style={{ flex: 1, padding: '0.6rem', borderRadius: '0.6rem', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(240 5% 65%)' }}>Cancel</button>
              <button onClick={deleteRelationship} disabled={saving}
                style={{ flex: 1, padding: '0.6rem', borderRadius: '0.6rem', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171' }}>
                {saving ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Trade Add/Edit Modal ── */}
      {(modal === 'add-trade' || modal === 'edit-trade') && (
        <div onClick={() => setModal(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: 'hsl(260 60% 6%)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '1.125rem', padding: '2rem', maxWidth: 560, width: '100%', animation: 'fadeIn 0.18s ease', boxShadow: '0 24px 64px rgba(0,0,0,0.6)', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setModal(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 50%)', padding: 4 }}><X size={16} /></button>

            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'hsl(40 6% 95%)', marginBottom: '1.5rem' }}>
              {modal === 'add-trade' ? 'Add Copy Trade' : 'Edit Copy Trade'}
            </h3>

            {formError && (
              <div style={{ marginBottom: 12, padding: '8px 12px', borderRadius: '0.5rem', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#fca5a5', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertCircle size={13} /> {formError}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <label>
                <span style={labelStyle}>User *</span>
                <select value={tradeForm.followerId} onChange={e => setTradeForm({ ...tradeForm, followerId: e.target.value })} style={fieldStyle}>
                  <option value="">Select user...</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>)}
                </select>
              </label>
              <label>
                <span style={labelStyle}>Trader *</span>
                <select value={tradeForm.traderId} onChange={e => setTradeForm({ ...tradeForm, traderId: e.target.value })} style={fieldStyle}>
                  <option value="">Select trader...</option>
                  {traders.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              <label>
                <span style={labelStyle}>Asset *</span>
                <input type="text" value={tradeForm.asset} onChange={e => setTradeForm({ ...tradeForm, asset: e.target.value })} placeholder="e.g. BTC/USD" style={fieldStyle} />
              </label>
              <label>
                <span style={labelStyle}>Trade Type</span>
                <select value={tradeForm.tradeType} onChange={e => setTradeForm({ ...tradeForm, tradeType: e.target.value })} style={fieldStyle}>
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                </select>
              </label>
              <label>
                <span style={labelStyle}>Status</span>
                <select value={tradeForm.status} onChange={e => setTradeForm({ ...tradeForm, status: e.target.value })} style={fieldStyle}>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              <label>
                <span style={labelStyle}>Entry Price</span>
                <input type="number" step="0.01" value={tradeForm.entryPrice} onChange={e => setTradeForm({ ...tradeForm, entryPrice: e.target.value })} style={fieldStyle} />
              </label>
              <label>
                <span style={labelStyle}>Exit Price</span>
                <input type="number" step="0.01" value={tradeForm.exitPrice} onChange={e => setTradeForm({ ...tradeForm, exitPrice: e.target.value })} placeholder="—" style={fieldStyle} />
              </label>
              <label>
                <span style={labelStyle}>Lot Size</span>
                <input type="number" step="0.01" value={tradeForm.lotSize} onChange={e => setTradeForm({ ...tradeForm, lotSize: e.target.value })} style={fieldStyle} />
              </label>
              <label>
                <span style={labelStyle}>Profit/Loss ($)</span>
                <input type="number" step="0.01" value={tradeForm.profitLoss} onChange={e => setTradeForm({ ...tradeForm, profitLoss: e.target.value })} style={fieldStyle} />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: '1.5rem' }}>
              <label>
                <span style={labelStyle}>Trade Date</span>
                <input type="datetime-local" value={tradeForm.createdAt} onChange={e => setTradeForm({ ...tradeForm, createdAt: e.target.value })} style={fieldStyle} />
              </label>
              <label>
                <span style={labelStyle}>Closed Date</span>
                <input type="datetime-local" value={tradeForm.closedAt} onChange={e => setTradeForm({ ...tradeForm, closedAt: e.target.value })} style={fieldStyle} />
              </label>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModal(null)}
                style={{ flex: 1, padding: '0.6rem', borderRadius: '0.6rem', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(240 5% 65%)' }}>Cancel</button>
              <button onClick={submitTrade} disabled={saving}
                style={{ flex: 2, padding: '0.6rem', borderRadius: '0.6rem', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)', color: '#050505', border: 'none' }}>
                {saving ? 'Saving...' : modal === 'add-trade' ? 'Create Trade' : 'Update Trade'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Trade Delete Confirm ── */}
      {modal === 'del-trade' && selected && (
        <div onClick={() => setModal(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: 'hsl(260 60% 6%)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '1.125rem', padding: '2rem', maxWidth: 380, width: '100%', animation: 'fadeIn 0.18s ease' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'hsl(40 6% 95%)', marginBottom: 8 }}>Delete Trade?</h3>
            <p style={{ fontSize: 13, color: 'hsl(240 5% 55%)', marginBottom: '1.5rem' }}>This trade record will be permanently removed.</p>
            {formError && <p style={{ fontSize: 12, color: '#f87171', marginBottom: 12 }}>{formError}</p>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModal(null)}
                style={{ flex: 1, padding: '0.6rem', borderRadius: '0.6rem', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(240 5% 65%)' }}>Cancel</button>
              <button onClick={deleteTrade} disabled={saving}
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
