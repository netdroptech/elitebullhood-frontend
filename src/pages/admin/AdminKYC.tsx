import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, CheckCircle2, X, Eye, Clock, AlertTriangle, ChevronRight, RefreshCw } from 'lucide-react'
import { adminApi } from '@/lib/api'

const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') ?? 'http://localhost:4000'

// ─── Types ────────────────────────────────────────────────────────────────────

interface KYCRecord {
  id:              string
  status:          string
  docType:         string
  frontUrl?:       string
  backUrl?:        string
  selfieUrl?:      string
  firstName?:      string
  lastName?:       string
  nationality?:    string
  address?:        string
  submittedAt:     string
  reviewedAt?:     string
  rejectionReason?: string
  user: {
    id:        string
    firstName: string
    lastName:  string
    email:     string
    country?:  string
  }
}

// ─── Status styles ────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { c: string; bg: string; border: string; label: string; icon: React.ElementType }> = {
  APPROVED:      { c: '#a78bfa', bg: 'rgba(167,139,250,0.1)',   border: 'rgba(167,139,250,0.2)',   label: 'Approved',       icon: CheckCircle2 },
  PENDING:       { c: '#f59e0b', bg: 'rgba(245,158,11,0.1)',   border: 'rgba(245,158,11,0.2)',   label: 'Pending Review', icon: Clock },
  REJECTED:      { c: '#f87171', bg: 'rgba(248,113,113,0.1)',  border: 'rgba(248,113,113,0.2)',  label: 'Rejected',       icon: X },
  NOT_SUBMITTED: { c: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.15)', label: 'Not Submitted',  icon: AlertTriangle },
}

function avatarColor(email: string) {
  const cols = ['#a78bfa','#60a5fa','#a78bfa','#f59e0b','#f87171','#a78bfa']
  let h = 0
  for (const c of email) h = (h * 31 + c.charCodeAt(0)) & 0xffff
  return cols[h % cols.length]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminKYC() {
  const navigate = useNavigate()

  const [records,  setRecords]  = useState<KYCRecord[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [tab,      setTab]      = useState<'PENDING'|'ALL'>('PENDING')
  const [selected, setSelected] = useState<string | null>(null)

  const [rejectNote,  setRejectNote]  = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionMsg,   setActionMsg]   = useState<{ type: 'success'|'error'; text: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = tab === 'PENDING' ? '?status=PENDING' : ''
      const res = await adminApi.get<{ success: boolean; data: KYCRecord[] }>(`/kyc/admin/list${params}`)
      setRecords(res.data)
    } catch (err: any) {
      setError(err.message ?? 'Failed to load KYC records.')
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => { load() }, [load])

  const selectedRecord = selected ? records.find(r => r.id === selected) : null

  async function doApprove(id: string) {
    setActionLoading(true)
    setActionMsg(null)
    try {
      await adminApi.post(`/kyc/admin/${id}/approve`, {})
      setActionMsg({ type: 'success', text: 'KYC approved successfully.' })
      setSelected(null)
      load()
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message ?? 'Approval failed.' })
    } finally {
      setActionLoading(false)
    }
  }

  async function doReject(id: string) {
    if (!rejectNote.trim()) { setActionMsg({ type: 'error', text: 'Please enter a rejection reason.' }); return }
    setActionLoading(true)
    setActionMsg(null)
    try {
      await adminApi.post(`/kyc/admin/${id}/reject`, { reason: rejectNote })
      setActionMsg({ type: 'success', text: 'KYC rejected.' })
      setRejectNote('')
      setSelected(null)
      load()
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message ?? 'Rejection failed.' })
    } finally {
      setActionLoading(false)
    }
  }

  const pending  = records.filter(r => r.status === 'PENDING').length
  const approved = records.filter(r => r.status === 'APPROVED').length
  const rejected = records.filter(r => r.status === 'REJECTED').length
  const displayList = tab === 'PENDING' ? records.filter(r => r.status === 'PENDING') : records

  return (
    <div style={{ padding: '20px 16px 40px' }} className="md:p-8">

      {/* Header */}
      <div style={{ marginBottom: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'hsl(40 10% 96%)' }}>KYC Verification</h1>
          <p style={{ fontSize: 13, color: 'hsl(240 5% 50%)', marginTop: 3 }}>Review and approve identity verification submissions</p>
        </div>
        <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 9, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'hsl(240 5% 55%)', fontSize: 12, cursor: 'pointer' }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Action message */}
      {actionMsg && (
        <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 10, background: actionMsg.type === 'success' ? 'rgba(167,139,250,0.08)' : 'rgba(248,113,113,0.08)', border: `1px solid ${actionMsg.type === 'success' ? 'rgba(167,139,250,0.2)' : 'rgba(248,113,113,0.2)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ color: actionMsg.type === 'success' ? '#a78bfa' : '#f87171', fontSize: 13 }}>{actionMsg.text}</p>
          <button onClick={() => setActionMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 50%)', fontSize: 16 }}>×</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" style={{ marginBottom: 22 }}>
        {[
          { label: 'Pending Review', value: String(pending),             c: '#f59e0b', bg: 'rgba(245,158,11,0.1)',   icon: Clock },
          { label: 'Approved',       value: String(approved),            c: '#a78bfa', bg: 'rgba(167,139,250,0.1)',   icon: CheckCircle2 },
          { label: 'Rejected',       value: String(rejected),            c: '#f87171', bg: 'rgba(248,113,113,0.1)',  icon: X },
          { label: 'Total Records',  value: String(records.length),      c: '#a78bfa', bg: 'rgba(167,139,250,0.1)',  icon: ShieldCheck },
        ].map(s => (
          <div key={s.label} style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 13, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 38, height: 38, borderRadius: 9, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <s.icon size={17} style={{ color: s.c }} />
            </div>
            <div>
              <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)' }}>{s.label}</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: s.c, lineHeight: 1.1 }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 16, background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {[{ k: 'PENDING', label: `Pending (${pending})` }, { k: 'ALL', label: `All (${records.length})` }].map(t => (
          <button key={t.k} onClick={() => { setTab(t.k as any); setSelected(null) }} style={{ padding: '7px 16px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: tab === t.k ? 'rgba(167,139,250,0.2)' : 'transparent', color: tab === t.k ? '#c4b5fd' : 'hsl(240 5% 52%)', transition: 'all 0.13s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', marginBottom: 16 }}>
          <p style={{ color: '#f87171', fontSize: 13 }}>{error}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-6">
        {/* List */}
        <div style={{ gridColumn: 'span 2' }}>
          <div style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '13px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'hsl(40 10% 94%)' }}>{tab === 'PENDING' ? 'Awaiting Review' : 'All KYC Records'}</p>
            </div>
            <div style={{ maxHeight: 560, overflowY: 'auto', scrollbarWidth: 'none' }}>
              {loading ? (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <div style={{ width: 24, height: 24, border: '2px solid rgba(167,139,250,0.3)', borderTopColor: '#a78bfa', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
                  <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                </div>
              ) : displayList.length === 0 ? (
                <p style={{ padding: 30, textAlign: 'center', fontSize: 12, color: 'hsl(240 5% 44%)' }}>No {tab === 'PENDING' ? 'pending' : ''} KYC applications.</p>
              ) : displayList.map(r => {
                const sm  = STATUS_META[r.status] ?? STATUS_META.NOT_SUBMITTED
                const col = avatarColor(r.user.email)
                const ini = `${r.user.firstName[0] ?? ''}${r.user.lastName[0] ?? ''}`.toUpperCase()
                return (
                  <button key={r.id}
                    onClick={() => setSelected(selected === r.id ? null : r.id)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: selected === r.id ? 'rgba(167,139,250,0.1)' : 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s' }}
                    onMouseEnter={e => { if (selected !== r.id) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                    onMouseLeave={e => { if (selected !== r.id) e.currentTarget.style.background = 'transparent' }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: `${col}20`, border: `1px solid ${col}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: col, flexShrink: 0 }}>{ini}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12.5, fontWeight: 600, color: 'hsl(40 6% 87%)', whiteSpace: 'nowrap' }}>{r.user.firstName} {r.user.lastName}</p>
                      <p style={{ fontSize: 10.5, color: 'hsl(240 5% 46%)', marginTop: 1 }}>{r.user.email}</p>
                    </div>
                    <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: sm.bg, color: sm.c, border: `1px solid ${sm.border}`, flexShrink: 0 }}>{sm.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Detail panel */}
        <div style={{ gridColumn: 'span 3' }}>
          {!selectedRecord ? (
            <div style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '60px 20px', textAlign: 'center' }}>
              <ShieldCheck size={44} style={{ color: 'rgba(167,139,250,0.4)', margin: '0 auto 14px' }} />
              <p style={{ fontSize: 14, fontWeight: 700, color: 'hsl(240 5% 50%)' }}>Select a user</p>
              <p style={{ fontSize: 12, color: 'hsl(240 5% 40%)', marginTop: 5 }}>Click any user on the left to review their KYC submission</p>
            </div>
          ) : (
            <div style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 14 }}>
                {(() => {
                  const col = avatarColor(selectedRecord.user.email)
                  const ini = `${selectedRecord.user.firstName[0] ?? ''}${selectedRecord.user.lastName[0] ?? ''}`.toUpperCase()
                  return (
                    <>
                      <div style={{ width: 44, height: 44, borderRadius: 11, background: `${col}20`, border: `2px solid ${col}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: col, flexShrink: 0 }}>{ini}</div>
                      <div>
                        <p style={{ fontSize: 15, fontWeight: 800, color: 'hsl(40 10% 95%)' }}>{selectedRecord.user.firstName} {selectedRecord.user.lastName}</p>
                        <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)' }}>{selectedRecord.user.email} · {selectedRecord.user.country || '—'}</p>
                      </div>
                    </>
                  )
                })()}
                <button onClick={() => navigate(`/admin/users/${selectedRecord.user.id}`)} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, padding: '6px 11px', borderRadius: 7, background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.25)', color: '#c4b5fd', cursor: 'pointer', flexShrink: 0 }}>
                  Full Profile <ChevronRight size={11} />
                </button>
              </div>

              <div style={{ padding: '18px 20px' }}>
                {/* Documents */}
                <p style={{ fontSize: 11, fontWeight: 700, color: 'hsl(240 5% 45%)', letterSpacing: '0.07em', marginBottom: 14 }}>SUBMITTED DOCUMENTS</p>
                <div className="grid sm:grid-cols-3 gap-3" style={{ marginBottom: 20 }}>
                  {[
                    { label: 'Front of ID', url: selectedRecord.frontUrl },
                    ...(selectedRecord.backUrl ? [{ label: 'Back of ID', url: selectedRecord.backUrl }] : []),
                    { label: 'Selfie', url: selectedRecord.selfieUrl },
                  ].map(doc => (
                    <div key={doc.label} style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: 'hsl(240 5% 55%)' }}>{doc.label}</p>
                      </div>
                      {doc.url ? (
                        <a href={`${BASE_URL}${doc.url}`} target="_blank" rel="noopener noreferrer">
                          <img src={`${BASE_URL}${doc.url}`} alt={doc.label} style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block' }} />
                          <div style={{ padding: '6px 12px', display: 'flex', justifyContent: 'flex-end' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#a78bfa' }}><Eye size={11} /> View</span>
                          </div>
                        </a>
                      ) : (
                        <div style={{ height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)' }}>
                          <p style={{ fontSize: 11, color: 'hsl(240 5% 40%)' }}>Not uploaded</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Details */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'hsl(240 5% 45%)', letterSpacing: '0.07em', marginBottom: 12 }}>VERIFICATION DETAILS</p>
                  {[
                    { label: 'Full Name',     value: `${selectedRecord.firstName || selectedRecord.user.firstName} ${selectedRecord.lastName || selectedRecord.user.lastName}` },
                    { label: 'Email',         value: selectedRecord.user.email },
                    { label: 'Nationality',   value: selectedRecord.nationality || selectedRecord.user.country || '—' },
                    { label: 'Document Type', value: selectedRecord.docType?.replace('_', ' ') || '—' },
                    { label: 'Submitted',     value: new Date(selectedRecord.submittedAt).toLocaleDateString() },
                    { label: 'KYC Status',    value: STATUS_META[selectedRecord.status]?.label || selectedRecord.status },
                    ...(selectedRecord.rejectionReason ? [{ label: 'Rejection Reason', value: selectedRecord.rejectionReason }] : []),
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ fontSize: 11.5, color: 'hsl(240 5% 50%)' }}>{row.label}</span>
                      <span style={{ fontSize: 11.5, fontWeight: 600, color: 'hsl(40 6% 80%)', maxWidth: '60%', textAlign: 'right' }}>{row.value}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                {selectedRecord.status === 'PENDING' && (
                  <>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'hsl(240 5% 48%)', letterSpacing: '0.05em', marginBottom: 6, textTransform: 'uppercase' }}>REJECTION REASON (required if rejecting)</label>
                      <textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)} rows={2} placeholder="Reason sent to the user if rejected..." style={{ width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: 'hsl(40 6% 88%)', outline: 'none', boxSizing: 'border-box', resize: 'none', lineHeight: 1.5 }} />
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={() => doApprove(selectedRecord.id)} disabled={actionLoading} style={{ flex: 1, padding: '11px', borderRadius: 10, background: actionLoading ? 'rgba(255,255,255,0.05)' : 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)', color: actionLoading ? 'hsl(240 5% 40%)' : '#a78bfa', fontSize: 13, fontWeight: 700, cursor: actionLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <CheckCircle2 size={15} /> {actionLoading ? 'Processing…' : 'Approve KYC'}
                      </button>
                      <button onClick={() => doReject(selectedRecord.id)} disabled={actionLoading} style={{ flex: 1, padding: '11px', borderRadius: 10, background: actionLoading ? 'rgba(255,255,255,0.05)' : 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: actionLoading ? 'hsl(240 5% 40%)' : '#f87171', fontSize: 13, fontWeight: 700, cursor: actionLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <X size={15} /> {actionLoading ? 'Processing…' : 'Reject KYC'}
                      </button>
                    </div>
                  </>
                )}

                {selectedRecord.status === 'APPROVED' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)' }}>
                    <CheckCircle2 size={18} style={{ color: '#a78bfa' }} />
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#a78bfa' }}>This user is fully verified. All identity checks passed.</p>
                  </div>
                )}

                {selectedRecord.status === 'REJECTED' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.18)' }}>
                    <X size={18} style={{ color: '#f87171' }} />
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#f87171' }}>KYC was rejected. User may resubmit documents.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
