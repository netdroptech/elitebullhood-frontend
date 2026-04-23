import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, User, Mail, Phone, Globe, Calendar,
  CheckCircle2, Clock, X, DollarSign, Save, Trash2,
  AlertTriangle, Loader2, RefreshCw, ShieldCheck, Ban,
  KeyRound, Eye, EyeOff, RefreshCcw, Check, WalletCards,
} from 'lucide-react'
import { adminApi } from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserDetail {
  id:               string
  firstName:        string
  lastName:         string
  email:            string
  phone?:           string
  country?:         string
  city?:            string
  address?:         string
  postalCode?:      string
  dateOfBirth?:     string
  status:           string
  kycStatus:        string
  plan:             string
  balance:          number
  totalDeposits:    number
  totalWithdrawals: number
  totalProfit:      number
  tradeProgress?:   number
  signalStrength?:  number
  createdAt:        string
  lastLoginAt?:     string
  transactions:     Tx[]
}

interface Tx {
  id:        string
  type:      string
  amount:    number
  status:    string
  note?:     string
  createdAt: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { c: string; bg: string; border: string; label: string; dot: string }> = {
  ACTIVE:    { c: '#a78bfa', bg: 'rgba(167,139,250,0.1)',   border: 'rgba(167,139,250,0.3)',   label: 'Active',    dot: '#a78bfa' },
  PENDING:   { c: '#f59e0b', bg: 'rgba(245,158,11,0.1)',   border: 'rgba(245,158,11,0.3)',   label: 'Pending',   dot: '#f59e0b' },
  SUSPENDED: { c: '#fb923c', bg: 'rgba(251,146,60,0.1)',   border: 'rgba(251,146,60,0.3)',   label: 'Suspended', dot: '#fb923c' },
  BANNED:    { c: '#f87171', bg: 'rgba(248,113,113,0.1)',  border: 'rgba(248,113,113,0.3)',  label: 'Banned',    dot: '#f87171' },
}
const KYC_STYLES: Record<string, { c: string; bg: string; label: string }> = {
  APPROVED:      { c: '#a78bfa', bg: 'rgba(167,139,250,0.12)',  label: 'Approved'      },
  PENDING:       { c: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  label: 'Pending'       },
  REJECTED:      { c: '#f87171', bg: 'rgba(248,113,113,0.12)', label: 'Rejected'      },
  NOT_SUBMITTED: { c: '#94a3b8', bg: 'rgba(148,163,184,0.1)',  label: 'Not Submitted' },
}
const TX_TYPE: Record<string, { c: string; label: string }> = {
  DEPOSIT:    { c: '#a78bfa', label: 'Deposit'    },
  WITHDRAWAL: { c: '#f87171', label: 'Withdrawal' },
  PROFIT:     { c: '#60a5fa', label: 'Profit'     },
  BONUS:      { c: '#f59e0b', label: 'Bonus'      },
}

function fmt(n: number) { return `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}` }
function fmtDate(d?: string) { return d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—' }
function avatarColor(email: string) {
  const cols = ['#a78bfa','#60a5fa','#a78bfa','#f59e0b','#f87171','#a78bfa']
  let h = 0; for (const c of email) h = (h * 31 + c.charCodeAt(0)) & 0xffff
  return cols[h % cols.length]
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.75)' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, background: 'hsl(260 87% 5%)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'hsl(40 10% 95%)' }}>{title}</p>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 7, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'hsl(240 5% 55%)' }}>
            <X size={14} />
          </button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'hsl(240 5% 50%)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
      {children}
    </div>
  )
}

const inp: React.CSSProperties = {
  width: '100%', padding: '8px 11px', borderRadius: 8, fontSize: 13,
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  color: 'hsl(40 6% 90%)', outline: 'none', boxSizing: 'border-box',
}

const sel: React.CSSProperties = { ...inp, cursor: 'pointer' }

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminUserDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [user,    setUser]    = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  // Edit form state
  const [editing,    setEditing]    = useState(false)
  const [form,       setForm]       = useState<Partial<UserDetail>>({})
  const [saving,     setSaving]     = useState(false)
  const [saveMsg,    setSaveMsg]    = useState('')
  const [saveErr,    setSaveErr]    = useState('')

  // Delete modal
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleting,    setDeleting]    = useState(false)

  // Quick action modals
  const [modal,      setModal]      = useState<'deposit'|'withdraw'|'profit'|'balance'|'status'|null>(null)
  const [modalAmt,   setModalAmt]   = useState('')
  const [modalNote,  setModalNote]  = useState('')
  const [modalStatus,setModalStatus]= useState('ACTIVE')
  const [balanceOp,  setBalanceOp]  = useState<'add'|'subtract'>('add')
  const [acting,     setActing]     = useState(false)
  const [actMsg,     setActMsg]     = useState('')

  // Password view state
  const [userPassword,       setUserPassword]       = useState<string | null>(null)
  const [passVisible,        setPassVisible]        = useState(false)
  const [passLoading,        setPassLoading]        = useState(false)

  // Withdrawal code state
  const [withdrawalCode,     setWithdrawalCode]     = useState<string | null>(null)
  const [codeVisible,        setCodeVisible]        = useState(false)
  const [customCode,         setCustomCode]         = useState('')
  const [codeSaving,         setCodeSaving]         = useState(false)
  const [codeMsg,            setCodeMsg]            = useState('')
  const [codeErr,            setCodeErr]            = useState('')
  const [codeLoading,        setCodeLoading]        = useState(false)

  // Wallet state
  const [walletAddress,      setWalletAddress]      = useState<string | null>(null)
  const [walletVerified,     setWalletVerified]     = useState(false)
  const [walletLoading,      setWalletLoading]      = useState(false)
  const [walletActing,       setWalletActing]       = useState(false)
  const [walletMsg,          setWalletMsg]          = useState('')
  const [walletErr,          setWalletErr]          = useState('')

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!id) return
    setLoading(true); setError('')
    try {
      const res = await adminApi.get<{ success: boolean; data: UserDetail }>(`/admin/users/${id}`)
      setUser(res.data)
      setForm(res.data)
      setModalStatus(res.data.status)
    } catch (e: any) {
      setError(e.message ?? 'Failed to load user.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])
  useEffect(() => { if (id) { loadWithdrawalCode(); loadWallet() } }, [id])

  // ── Save edits ─────────────────────────────────────────────────────────────
  async function saveEdits() {
    if (!id) return
    setSaving(true); setSaveErr(''); setSaveMsg('')
    try {
      const res = await adminApi.put<{ success: boolean; data: UserDetail }>(`/admin/users/${id}`, form)
      setUser(res.data)
      setForm(res.data)
      setEditing(false)
      setSaveMsg('Changes saved successfully.')
      setTimeout(() => setSaveMsg(''), 3000)
    } catch (e: any) {
      setSaveErr(e.message ?? 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  // ── Delete user ────────────────────────────────────────────────────────────
  async function confirmDelete() {
    if (!id) return
    setDeleting(true)
    try {
      await adminApi.delete(`/admin/users/${id}`)
      navigate('/admin/users')
    } catch (e: any) {
      setActMsg(e.message ?? 'Delete failed.')
      setDeleteModal(false)
    } finally {
      setDeleting(false)
    }
  }

  // ── Quick actions ──────────────────────────────────────────────────────────
  async function runAction() {
    if (!id) return
    setActing(true); setActMsg('')
    try {
      if (modal === 'deposit')  await adminApi.post(`/admin/users/${id}/deposit`,  { amount: Number(modalAmt), note: modalNote })
      if (modal === 'withdraw') await adminApi.post(`/admin/users/${id}/withdraw`, { amount: Number(modalAmt), note: modalNote })
      if (modal === 'profit')   await adminApi.post(`/admin/users/${id}/profit`,   { amount: Number(modalAmt), note: modalNote })
      if (modal === 'balance')  await adminApi.post(`/admin/users/${id}/balance`,  { operation: balanceOp, amount: Number(modalAmt), note: modalNote })
      if (modal === 'status')   await adminApi.post(`/admin/users/${id}/status`,   { status: modalStatus })
      setModal(null); setModalAmt(''); setModalNote(''); setBalanceOp('add')
      load()
    } catch (e: any) {
      setActMsg(e.message ?? 'Action failed.')
    } finally {
      setActing(false)
    }
  }

  // ── Withdrawal code actions ────────────────────────────────────────────────
  async function loadWithdrawalCode() {
    if (!id) return
    setCodeLoading(true)
    try {
      const res = await adminApi.get<{ success: boolean; data: { code: string | null } }>(`/admin/users/${id}/withdrawal-code`)
      setWithdrawalCode(res.data.code)
    } catch { /* silently ignore */ }
    finally { setCodeLoading(false) }
  }

  async function saveWithdrawalCode(generate: boolean) {
    if (!id) return
    if (!generate && !/^\d{5}$/.test(customCode)) {
      setCodeErr('Code must be exactly 5 digits.')
      return
    }
    setCodeSaving(true); setCodeErr(''); setCodeMsg('')
    try {
      const body = generate ? {} : { code: customCode }
      const res = await adminApi.post<{ success: boolean; data: { code: string } }>(`/admin/users/${id}/withdrawal-code`, body)
      setWithdrawalCode(res.data.code)
      setCodeVisible(true)
      setCustomCode('')
      setCodeMsg(generate ? `New code generated: ${res.data.code}` : 'Code updated successfully.')
      setTimeout(() => setCodeMsg(''), 4000)
    } catch (e: any) {
      setCodeErr(e.message ?? 'Failed to set code.')
    } finally {
      setCodeSaving(false)
    }
  }

  // ── Wallet actions ─────────────────────────────────────────────────────────
  async function loadWallet() {
    if (!id) return
    setWalletLoading(true)
    try {
      const res = await adminApi.get<{ success: boolean; data: { address: string | null; verified: boolean } }>(`/admin/users/${id}/wallet`)
      setWalletAddress(res.data.address)
      setWalletVerified(res.data.verified)
    } catch { /* ignore */ }
    finally { setWalletLoading(false) }
  }

  async function doWalletVerify(verified: boolean) {
    if (!id) return
    setWalletActing(true); setWalletMsg(''); setWalletErr('')
    try {
      await adminApi.post(`/admin/users/${id}/wallet/verify`, { verified })
      setWalletVerified(verified)
      setWalletMsg(verified ? 'Wallet marked as connected.' : 'Wallet disconnected.')
      setTimeout(() => setWalletMsg(''), 3500)
    } catch (e: any) {
      setWalletErr(e.message ?? 'Action failed.')
    } finally {
      setWalletActing(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <Loader2 size={28} style={{ color: '#a78bfa', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (error || !user) return (
    <div style={{ padding: '3rem', textAlign: 'center' }}>
      <AlertTriangle size={28} style={{ color: '#f87171', margin: '0 auto 12px' }} />
      <p style={{ color: '#f87171', marginBottom: 16 }}>{error || 'User not found.'}</p>
      <button onClick={() => navigate('/admin/users')} style={{ padding: '8px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(40 6% 80%)', cursor: 'pointer', fontSize: 13 }}>← Back</button>
    </div>
  )

  const col = avatarColor(user.email)
  const ss  = STATUS_STYLES[user.status] ?? STATUS_STYLES['PENDING']
  const ks  = KYC_STYLES[user.kycStatus] ?? KYC_STYLES['NOT_SUBMITTED']

  return (
    <div style={{ padding: '20px 16px 60px', maxWidth: 980, margin: '0 auto' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Quick-action modals */}
      {modal && (
        <Modal title={modal === 'deposit' ? 'Manual Deposit' : modal === 'withdraw' ? 'Manual Withdrawal' : modal === 'profit' ? 'Credit Profit' : modal === 'balance' ? 'Adjust Balance' : 'Change Status'} onClose={() => { setModal(null); setActMsg(''); setBalanceOp('add') }}>
          {(modal === 'deposit' || modal === 'withdraw' || modal === 'profit') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Field label="Amount (USD)">
                <input style={inp} type="number" min="0" step="any" value={modalAmt} onChange={e => setModalAmt(e.target.value)} placeholder="0.00" />
              </Field>
              <Field label="Note (optional)">
                <input style={inp} value={modalNote} onChange={e => setModalNote(e.target.value)} placeholder="Reason…" />
              </Field>
            </div>
          )}
          {modal === 'balance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Add / Subtract toggle */}
              <Field label="Operation">
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['add', 'subtract'] as const).map(op => (
                    <button
                      key={op}
                      onClick={() => setBalanceOp(op)}
                      style={{
                        flex: 1, padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                        fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
                        background: balanceOp === op
                          ? op === 'add' ? 'rgba(167,139,250,0.15)' : 'rgba(248,113,113,0.15)'
                          : 'rgba(255,255,255,0.04)',
                        border: balanceOp === op
                          ? op === 'add' ? '1px solid rgba(167,139,250,0.4)' : '1px solid rgba(248,113,113,0.4)'
                          : '1px solid rgba(255,255,255,0.08)',
                        color: balanceOp === op
                          ? op === 'add' ? '#a78bfa' : '#f87171'
                          : 'hsl(240 5% 55%)',
                      }}
                    >
                      {op === 'add' ? '+ Add' : '− Subtract'}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Amount (USD)">
                <input style={inp} type="number" min="0" step="any" value={modalAmt} onChange={e => setModalAmt(e.target.value)} placeholder="0.00" />
              </Field>
              {/* Live balance preview */}
              {modalAmt && Number(modalAmt) > 0 && user && (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'hsl(240 5% 55%)' }}>
                    <span>Current balance</span>
                    <span style={{ color: 'hsl(40 6% 80%)' }}>${user.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'hsl(240 5% 55%)', marginTop: 4 }}>
                    <span>{balanceOp === 'add' ? 'Adding' : 'Subtracting'}</span>
                    <span style={{ color: balanceOp === 'add' ? '#a78bfa' : '#f87171' }}>
                      {balanceOp === 'add' ? '+' : '−'}${Number(modalAmt).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600 }}>
                    <span style={{ color: 'hsl(40 6% 80%)' }}>New balance</span>
                    <span style={{ color: '#a78bfa' }}>
                      ${Math.max(0, balanceOp === 'add' ? user.balance + Number(modalAmt) : user.balance - Number(modalAmt)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}
              <Field label="Note (optional)">
                <input style={inp} value={modalNote} onChange={e => setModalNote(e.target.value)} placeholder="Reason…" />
              </Field>
            </div>
          )}
          {modal === 'status' && (
            <Field label="New Status">
              <select style={sel} value={modalStatus} onChange={e => setModalStatus(e.target.value)}>
                {['ACTIVE','PENDING','SUSPENDED','BANNED'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          )}
          {actMsg && <p style={{ fontSize: 12, color: '#f87171', marginTop: 10 }}>{actMsg}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button onClick={() => setModal(null)} style={{ flex: 1, padding: '9px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(240 5% 55%)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
            <button onClick={runAction} disabled={acting} style={{ flex: 2, padding: '9px', borderRadius: 8, background: 'rgba(167,139,250,0.18)', border: '1px solid rgba(167,139,250,0.3)', color: '#a78bfa', fontSize: 13, fontWeight: 700, cursor: acting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              {acting ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Working…</> : 'Confirm'}
            </button>
          </div>
        </Modal>
      )}

      {/* Delete confirmation modal */}
      {deleteModal && (
        <Modal title="Delete User" onClose={() => setDeleteModal(false)}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <Trash2 size={22} style={{ color: '#f87171' }} />
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'hsl(40 6% 90%)', marginBottom: 8 }}>Delete {user.firstName} {user.lastName}?</p>
            <p style={{ fontSize: 13, color: 'hsl(240 5% 52%)', lineHeight: 1.6, marginBottom: 20 }}>
              This will permanently delete the account and all associated data. This action <strong style={{ color: '#f87171' }}>cannot be undone</strong>.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setDeleteModal(false)} style={{ flex: 1, padding: '9px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(240 5% 55%)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={confirmDelete} disabled={deleting} style={{ flex: 2, padding: '9px', borderRadius: 8, background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', fontSize: 13, fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {deleting ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Deleting…</> : <><Trash2 size={14} /> Yes, Delete</>}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/admin/users')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'hsl(240 5% 55%)', fontSize: 12, cursor: 'pointer' }}>
          <ArrowLeft size={13} /> Back
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 21, fontWeight: 800, color: 'hsl(40 10% 96%)' }}>{user.firstName} {user.lastName}</h1>
          <p style={{ fontSize: 12, color: 'hsl(240 5% 50%)', marginTop: 2 }}>{user.email} · joined {fmtDate(user.createdAt)}</p>
        </div>
        <button onClick={() => setDeleteModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 8, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          <Trash2 size={13} /> Delete User
        </button>
        <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'hsl(240 5% 55%)', fontSize: 12, cursor: 'pointer' }}>
          <RefreshCw size={13} />
        </button>
      </div>

      {/* ── STATUS BANNER ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '14px 20px', borderRadius: 13, marginBottom: 20,
        background: ss.bg, border: `1px solid ${ss.border}`,
        flexWrap: 'wrap',
      }}>
        {/* Pulsing dot + label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{
            width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
            background: ss.dot,
            boxShadow: `0 0 8px ${ss.dot}`,
            display: 'inline-block',
            animation: user.status === 'ACTIVE' ? 'liveBlink 1.4s ease-in-out infinite' : 'none',
          }} />
          <span style={{ fontSize: 13, fontWeight: 800, color: ss.c, letterSpacing: '0.04em' }}>
            {ss.label}
          </span>
        </div>

        <div style={{ width: 1, height: 18, background: `${ss.border}`, flexShrink: 0 }} />

        <p style={{ fontSize: 12, color: ss.c, opacity: 0.8, flex: 1 }}>
          {user.status === 'ACTIVE'    && 'This account is active and has full platform access.'}
          {user.status === 'PENDING'   && 'This account is pending review. The user can log in but all features are locked.'}
          {user.status === 'SUSPENDED' && 'This account has been temporarily suspended. The user cannot access the platform.'}
          {user.status === 'BANNED'    && 'This account is permanently banned and blocked from all access.'}
        </p>

        {/* Quick change status buttons */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {Object.entries(STATUS_STYLES)
            .filter(([key]) => key !== user.status)
            .map(([key, style]) => (
              <button
                key={key}
                onClick={() => { setModalStatus(key); setModal('status') }}
                style={{
                  padding: '4px 11px', borderRadius: 7, fontSize: 11, fontWeight: 700,
                  background: style.bg, border: `1px solid ${style.border}`,
                  color: style.c, cursor: 'pointer',
                }}
              >
                → {style.label}
              </button>
            ))}
        </div>
      </div>
      <style>{`@keyframes liveBlink { 0%,100%{opacity:1;box-shadow:0 0 8px #a78bfa} 50%{opacity:0.3;box-shadow:none} }`}</style>

      {/* Save / action messages */}
      {saveMsg && <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 9, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', fontSize: 13, color: '#a78bfa' }}>{saveMsg}</div>}
      {saveErr && <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 9, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', fontSize: 13, color: '#f87171' }}>{saveErr}</div>}
      {actMsg  && <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 9, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', fontSize: 13, color: '#f87171' }}>{actMsg}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16, marginBottom: 20 }}>
        {/* Balance card */}
        {[
          { label: 'Balance',          value: fmt(user.balance),          c: '#a78bfa' },
          { label: 'Total Deposited',  value: fmt(user.totalDeposits),    c: '#60a5fa' },
          { label: 'Total Withdrawn',  value: fmt(user.totalWithdrawals), c: '#f87171' },
          { label: 'Total Profit',     value: fmt(user.totalProfit),      c: '#f59e0b' },
        ].map(s => (
          <div key={s.label} style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 13, padding: '14px 18px' }}>
            <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)', marginBottom: 5 }}>{s.label}</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: s.c }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 13, padding: '14px 18px', marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'hsl(240 5% 45%)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>Quick Actions</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: '+ Deposit',      icon: DollarSign,  action: 'deposit'  as const, col: '#a78bfa', bg: 'rgba(167,139,250,0.12)',  border: 'rgba(167,139,250,0.25)'  },
            { label: '− Withdraw',     icon: DollarSign,  action: 'withdraw' as const, col: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.25)' },
            { label: '+ Profit',       icon: DollarSign,  action: 'profit'   as const, col: '#4ade80', bg: 'rgba(74,222,128,0.12)',  border: 'rgba(74,222,128,0.25)'  },
            { label: 'Set Balance',    icon: DollarSign,  action: 'balance'  as const, col: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.25)'  },
            { label: 'Change Status',  icon: ShieldCheck, action: 'status'   as const, col: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.25)'  },
          ].map(a => (
            <button key={a.action} onClick={() => { setModal(a.action); setActMsg('') }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 8, background: a.bg, border: `1px solid ${a.border}`, color: a.col, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              <a.icon size={13} /> {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── CLIENT PASSWORD SECTION ── */}
      <div style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <Eye size={15} style={{ color: '#818cf8' }} />
          <p style={{ fontSize: 14, fontWeight: 700, color: 'hsl(40 6% 90%)' }}>Client Password</p>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'hsl(240 5% 45%)' }}>View the client's login password</span>
        </div>
        <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', minHeight: 42 }}>
            <KeyRound size={14} style={{ color: '#818cf8', flexShrink: 0 }} />
            {passLoading ? (
              <Loader2 size={13} style={{ color: '#818cf8', animation: 'spin 1s linear infinite' }} />
            ) : userPassword ? (
              <span style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: passVisible ? '0.05em' : '0.2em', color: passVisible ? '#818cf8' : 'hsl(240 5% 40%)', fontFamily: 'monospace', transition: 'color 0.15s' }}>
                {passVisible ? userPassword : '• • • • • • • •'}
              </span>
            ) : (
              <span style={{ fontSize: 13, color: 'hsl(240 5% 40%)' }}>Click "View Password" to reveal</span>
            )}
          </div>
          {userPassword && (
            <button onClick={() => setPassVisible(v => !v)}
              style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.2)', color: '#818cf8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              {passVisible ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          )}
          <button
            onClick={async () => {
              setPassLoading(true)
              try {
                const res = await adminApi.get<{ success: boolean; data: { password: string } }>(`/admin/users/${id}/password`)
                setUserPassword(res.data.password)
                setPassVisible(true)
              } catch { setUserPassword('(not available)') }
              finally { setPassLoading(false) }
            }}
            style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(129,140,248,0.15)', border: '1px solid rgba(129,140,248,0.3)', color: '#818cf8', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {passLoading ? 'Loading…' : userPassword ? 'Refresh' : 'View Password'}
          </button>
        </div>
      </div>

      {/* ── WITHDRAWAL CODE SECTION ── */}
      <div style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <KeyRound size={15} style={{ color: '#f59e0b' }} />
          <p style={{ fontSize: 14, fontWeight: 700, color: 'hsl(40 6% 90%)' }}>Withdrawal Security Code</p>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'hsl(240 5% 45%)' }}>Share this code with the client — required for every withdrawal</span>
        </div>

        <div style={{ padding: '18px 20px' }}>
          {/* Current code display */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <KeyRound size={14} style={{ color: '#f59e0b', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: 'hsl(240 5% 50%)' }}>Current code:</span>
              {codeLoading ? (
                <Loader2 size={13} style={{ color: '#a78bfa', animation: 'spin 1s linear infinite' }} />
              ) : withdrawalCode ? (
                <span style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '0.2em', color: codeVisible ? '#f59e0b' : 'hsl(240 5% 40%)', fontFamily: 'monospace', transition: 'color 0.15s' }}>
                  {codeVisible ? withdrawalCode : '• • • • •'}
                </span>
              ) : (
                <span style={{ fontSize: 13, color: 'hsl(240 5% 40%)', fontStyle: 'italic' }}>Not set</span>
              )}
            </div>
            {withdrawalCode && (
              <button
                onClick={() => setCodeVisible(v => !v)}
                style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'hsl(240 5% 55%)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}
              >
                {codeVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                {codeVisible ? 'Hide' : 'Show'}
              </button>
            )}
          </div>

          {/* Success / error messages */}
          {codeMsg && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', marginBottom: 12 }}>
              <Check size={13} style={{ color: '#a78bfa' }} />
              <span style={{ fontSize: 12, color: '#a78bfa' }}>{codeMsg}</span>
            </div>
          )}
          {codeErr && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', marginBottom: 12 }}>
              <AlertTriangle size={13} style={{ color: '#f87171' }} />
              <span style={{ fontSize: 12, color: '#f87171' }}>{codeErr}</span>
            </div>
          )}

          {/* Actions row */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            {/* Generate button */}
            <button
              onClick={() => saveWithdrawalCode(true)}
              disabled={codeSaving}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', fontSize: 12, fontWeight: 700, cursor: codeSaving ? 'not-allowed' : 'pointer', opacity: codeSaving ? 0.6 : 1 }}
            >
              {codeSaving ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCcw size={12} />}
              Generate New Code
            </button>

            {/* Divider */}
            <span style={{ fontSize: 11, color: 'hsl(240 5% 40%)', alignSelf: 'center' }}>or set manually:</span>

            {/* Manual input */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                type="text"
                inputMode="numeric"
                maxLength={5}
                placeholder="5 digits"
                value={customCode}
                onChange={e => { setCustomCode(e.target.value.replace(/\D/g, '').slice(0, 5)); setCodeErr('') }}
                style={{ width: 90, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: `1px solid ${codeErr ? 'rgba(248,113,113,0.4)' : 'rgba(255,255,255,0.1)'}`, color: 'hsl(40 6% 90%)', fontSize: 14, fontWeight: 700, letterSpacing: '0.2em', outline: 'none', textAlign: 'center', fontFamily: 'monospace' }}
              />
              <button
                onClick={() => saveWithdrawalCode(false)}
                disabled={codeSaving || customCode.length !== 5}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: customCode.length === 5 ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${customCode.length === 5 ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.08)'}`, color: customCode.length === 5 ? '#a78bfa' : 'hsl(240 5% 40%)', fontSize: 12, fontWeight: 700, cursor: codeSaving || customCode.length !== 5 ? 'not-allowed' : 'pointer' }}
              >
                {codeSaving ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={12} />}
                Set Code
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONNECTED WALLET SECTION ── */}
      <div style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <WalletCards size={15} style={{ color: '#60a5fa' }} />
          <p style={{ fontSize: 14, fontWeight: 700, color: 'hsl(40 6% 90%)' }}>Connected Wallet</p>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'hsl(240 5% 45%)' }}>User's linked crypto wallet address</span>
        </div>
        <div style={{ padding: '18px 20px' }}>
          {walletLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Loader2 size={14} style={{ color: '#a78bfa', animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: 13, color: 'hsl(240 5% 50%)' }}>Loading…</span>
            </div>
          ) : !walletAddress ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <WalletCards size={15} style={{ color: 'hsl(240 5% 40%)' }} />
              <span style={{ fontSize: 13, color: 'hsl(240 5% 45%)', fontStyle: 'italic' }}>No wallet connected yet.</span>
            </div>
          ) : (
            <>
              {/* Wallet address row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: `1px solid ${walletVerified ? 'rgba(167,139,250,0.2)' : 'rgba(245,158,11,0.2)'}`, marginBottom: 14 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '0.5rem', flexShrink: 0,
                  background: walletVerified ? 'rgba(167,139,250,0.12)' : 'rgba(245,158,11,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {walletVerified
                    ? <CheckCircle2 size={15} style={{ color: '#a78bfa' }} />
                    : <Clock size={15} style={{ color: '#f59e0b' }} />
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 11, color: walletVerified ? '#a78bfa' : '#f59e0b', fontWeight: 600, marginBottom: 2 }}>
                    {walletVerified ? 'CONNECTED' : 'PENDING VERIFICATION'}
                  </p>
                  <p style={{ fontSize: 13, color: 'hsl(40 6% 82%)', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                    {walletAddress}
                  </p>
                </div>
              </div>

              {/* Success / error messages */}
              {walletMsg && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', marginBottom: 12 }}>
                  <Check size={13} style={{ color: '#a78bfa' }} />
                  <span style={{ fontSize: 12, color: '#a78bfa' }}>{walletMsg}</span>
                </div>
              )}
              {walletErr && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', marginBottom: 12 }}>
                  <AlertTriangle size={13} style={{ color: '#f87171' }} />
                  <span style={{ fontSize: 12, color: '#f87171' }}>{walletErr}</span>
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {!walletVerified && (
                  <button
                    onClick={() => doWalletVerify(true)}
                    disabled={walletActing}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)', color: '#a78bfa', fontSize: 12, fontWeight: 700, cursor: walletActing ? 'not-allowed' : 'pointer', opacity: walletActing ? 0.6 : 1 }}
                  >
                    {walletActing ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={12} />}
                    Mark Wallet Connected
                  </button>
                )}
                {walletVerified && (
                  <button
                    onClick={() => doWalletVerify(false)}
                    disabled={walletActing}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171', fontSize: 12, fontWeight: 700, cursor: walletActing ? 'not-allowed' : 'pointer', opacity: walletActing ? 0.6 : 1 }}
                  >
                    {walletActing ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <X size={12} />}
                    Disconnect Wallet
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── EDIT SECTION ── */}
      <div style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
        {/* Edit header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <User size={15} style={{ color: '#a78bfa' }} />
            <p style={{ fontSize: 14, fontWeight: 700, color: 'hsl(40 6% 90%)' }}>User Information</p>
          </div>
          {!editing ? (
            <button onClick={() => { setEditing(true); setSaveErr('') }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 8, background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)', color: '#a78bfa', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              Edit
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setEditing(false); setForm(user); setSaveErr('') }}
                style={{ padding: '7px 13px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(240 5% 55%)', fontSize: 12, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={saveEdits} disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 8, background: 'rgba(167,139,250,0.18)', border: '1px solid rgba(167,139,250,0.3)', color: '#a78bfa', fontSize: 12, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</> : <><Save size={12} /> Save Changes</>}
              </button>
            </div>
          )}
        </div>

        <div style={{ padding: '20px' }}>
          {/* Personal info grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14, marginBottom: 20 }}>
            <Field label="First Name">
              {editing
                ? <input style={inp} value={form.firstName ?? ''} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
                : <p style={{ fontSize: 13, color: 'hsl(40 6% 85%)', padding: '8px 0' }}>{user.firstName}</p>}
            </Field>
            <Field label="Last Name">
              {editing
                ? <input style={inp} value={form.lastName ?? ''} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
                : <p style={{ fontSize: 13, color: 'hsl(40 6% 85%)', padding: '8px 0' }}>{user.lastName}</p>}
            </Field>
            <Field label="Email">
              {editing
                ? <input style={inp} type="email" value={form.email ?? ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                : <p style={{ fontSize: 13, color: 'hsl(40 6% 85%)', padding: '8px 0' }}>{user.email}</p>}
            </Field>
            <Field label="Phone">
              {editing
                ? <input style={inp} value={form.phone ?? ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+" />
                : <p style={{ fontSize: 13, color: 'hsl(40 6% 85%)', padding: '8px 0' }}>{user.phone || '—'}</p>}
            </Field>
            <Field label="Country">
              {editing
                ? <input style={inp} value={form.country ?? ''} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} />
                : <p style={{ fontSize: 13, color: 'hsl(40 6% 85%)', padding: '8px 0' }}>{user.country || '—'}</p>}
            </Field>
            <Field label="City">
              {editing
                ? <input style={inp} value={form.city ?? ''} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                : <p style={{ fontSize: 13, color: 'hsl(40 6% 85%)', padding: '8px 0' }}>{user.city || '—'}</p>}
            </Field>
            <Field label="Address">
              {editing
                ? <input style={inp} value={form.address ?? ''} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                : <p style={{ fontSize: 13, color: 'hsl(40 6% 85%)', padding: '8px 0' }}>{user.address || '—'}</p>}
            </Field>
            <Field label="Postal Code">
              {editing
                ? <input style={inp} value={form.postalCode ?? ''} onChange={e => setForm(f => ({ ...f, postalCode: e.target.value }))} />
                : <p style={{ fontSize: 13, color: 'hsl(40 6% 85%)', padding: '8px 0' }}>{user.postalCode || '—'}</p>}
            </Field>
            <Field label="Date of Birth">
              {editing
                ? <input style={inp} type="date" value={form.dateOfBirth ? form.dateOfBirth.slice(0,10) : ''} onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))} />
                : <p style={{ fontSize: 13, color: 'hsl(40 6% 85%)', padding: '8px 0' }}>{user.dateOfBirth ? fmtDate(user.dateOfBirth) : '—'}</p>}
            </Field>
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginBottom: 16 }} />
          <p style={{ fontSize: 11, fontWeight: 700, color: 'hsl(240 5% 45%)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 14 }}>Account Settings</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 14 }}>
            <Field label="Account Status">
              {editing
                ? <select style={sel} value={form.status ?? user.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {['ACTIVE','PENDING','SUSPENDED','BANNED'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                : <span style={{ display: 'inline-block', marginTop: 6, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: ss.bg, border: `1px solid ${ss.border}`, color: ss.c }}>{ss.label}</span>}
            </Field>
            <Field label="KYC Status">
              {editing
                ? <select style={sel} value={form.kycStatus ?? user.kycStatus} onChange={e => setForm(f => ({ ...f, kycStatus: e.target.value }))}>
                    {['NOT_SUBMITTED','PENDING','APPROVED','REJECTED'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                : <span style={{ display: 'inline-block', marginTop: 6, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: ks.bg, color: ks.c }}>{ks.label}</span>}
            </Field>
            <Field label="Plan">
              {editing
                ? <select style={sel} value={form.plan ?? user.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}>
                    {['BASIC','SILVER','GOLD','PLATINUM'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                : <p style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', padding: '8px 0' }}>{user.plan}</p>}
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14 }}>
            <Field label="Balance (USD)">
              {editing
                ? <input style={inp} type="number" min="0" step="any" value={form.balance ?? user.balance} onChange={e => setForm(f => ({ ...f, balance: Number(e.target.value) }))} />
                : <p style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa', padding: '8px 0' }}>{fmt(user.balance)}</p>}
            </Field>
            <Field label="Total Deposits">
              {editing
                ? <input style={inp} type="number" min="0" step="any" value={form.totalDeposits ?? user.totalDeposits} onChange={e => setForm(f => ({ ...f, totalDeposits: Number(e.target.value) }))} />
                : <p style={{ fontSize: 13, color: 'hsl(40 6% 85%)', padding: '8px 0' }}>{fmt(user.totalDeposits)}</p>}
            </Field>
            <Field label="Total Withdrawals">
              {editing
                ? <input style={inp} type="number" min="0" step="any" value={form.totalWithdrawals ?? user.totalWithdrawals} onChange={e => setForm(f => ({ ...f, totalWithdrawals: Number(e.target.value) }))} />
                : <p style={{ fontSize: 13, color: 'hsl(40 6% 85%)', padding: '8px 0' }}>{fmt(user.totalWithdrawals)}</p>}
            </Field>
            <Field label="Total Profit">
              {editing
                ? <input style={inp} type="number" min="0" step="any" value={form.totalProfit ?? user.totalProfit} onChange={e => setForm(f => ({ ...f, totalProfit: Number(e.target.value) }))} />
                : <p style={{ fontSize: 13, color: 'hsl(40 6% 85%)', padding: '8px 0' }}>{fmt(user.totalProfit)}</p>}
            </Field>
          </div>

          {/* Trading indicators */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '18px 0 14px' }} />
          <p style={{ fontSize: 11, fontWeight: 700, color: 'hsl(240 5% 45%)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 14 }}>Trading Indicators</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
            <Field label="Trade Progress (%)">
              {editing
                ? <input style={inp} type="number" min="0" max="100" step="1"
                    value={form.tradeProgress ?? user.tradeProgress ?? 0}
                    onChange={e => setForm(f => ({ ...f, tradeProgress: Math.max(0, Math.min(100, Math.round(Number(e.target.value)))) }))} />
                : <div style={{ padding: '8px 0' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#60a5fa', marginBottom: 6 }}>{user.tradeProgress ?? 0}%</p>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${user.tradeProgress ?? 0}%`, background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)', borderRadius: 999 }} />
                    </div>
                  </div>}
            </Field>
            <Field label="Signal Strength (%)">
              {editing
                ? <input style={inp} type="number" min="0" max="100" step="1"
                    value={form.signalStrength ?? user.signalStrength ?? 0}
                    onChange={e => setForm(f => ({ ...f, signalStrength: Math.max(0, Math.min(100, Math.round(Number(e.target.value)))) }))} />
                : <div style={{ padding: '8px 0' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa', marginBottom: 6 }}>{user.signalStrength ?? 0}%</p>
                    <div style={{ display: 'flex', gap: 3 }}>
                      {Array.from({ length: 10 }).map((_, i) => {
                        const lit = i < Math.round((user.signalStrength ?? 0) / 10)
                        return <div key={i} style={{ flex: 1, height: 8, borderRadius: 2, background: lit ? 'linear-gradient(180deg, #a78bfa, #7c3aed)' : 'rgba(255,255,255,0.06)' }} />
                      })}
                    </div>
                  </div>}
            </Field>
          </div>

          {saveErr && <p style={{ fontSize: 12, color: '#f87171', marginTop: 12 }}>{saveErr}</p>}
        </div>
      </div>

      {/* ── TRANSACTION HISTORY ── */}
      <div style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'hsl(40 6% 90%)' }}>Transaction History</p>
        </div>
        {!user.transactions || user.transactions.length === 0 ? (
          <p style={{ padding: '2.5rem', textAlign: 'center', fontSize: 13, color: 'hsl(240 5% 44%)' }}>No transactions yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.025)' }}>
                  {['TYPE','AMOUNT','STATUS','NOTE','DATE'].map(h => (
                    <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'hsl(240 5% 42%)', letterSpacing: '0.07em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {user.transactions.map(tx => {
                  const tt = TX_TYPE[tx.type] ?? { c: '#94a3b8', label: tx.type }
                  const isOut = tx.type === 'WITHDRAWAL'
                  return (
                    <tr key={tx.id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: `${tt.c}15`, color: tt.c }}>{tt.label}</span>
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 700, color: isOut ? '#f87171' : '#a78bfa', whiteSpace: 'nowrap' }}>
                        {isOut ? '−' : '+'}{fmt(tx.amount)}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
                          background: tx.status === 'COMPLETED' ? 'rgba(167,139,250,0.12)' : tx.status === 'PENDING' ? 'rgba(245,158,11,0.12)' : 'rgba(248,113,113,0.12)',
                          color:      tx.status === 'COMPLETED' ? '#a78bfa'               : tx.status === 'PENDING' ? '#f59e0b'               : '#f87171' }}>
                          {tx.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: 12, color: 'hsl(240 5% 50%)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.note || '—'}</td>
                      <td style={{ padding: '10px 16px', fontSize: 11, color: 'hsl(240 5% 48%)', whiteSpace: 'nowrap' }}>{fmtDate(tx.createdAt)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
