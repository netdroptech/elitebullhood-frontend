import { useState, useEffect, useCallback, useRef } from 'react'
import { Copy, CheckCircle, AlertCircle, ArrowDownLeft, Clock, Shield, Loader2, Upload, X, ImageIcon } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActiveWallet {
  id:      string
  network: string
  label:   string
  address: string
  tag?:    string | null
  chain?:  string | null
  icon:    string
  color:   string
}

interface Transaction {
  id:        string
  type:      string
  amount:    number
  currency:  string
  status:    string
  note?:     string
  network?:  string
  createdAt: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function statusColor(s: string) {
  if (s === 'COMPLETED') return '#a78bfa'
  if (s === 'REJECTED' || s === 'CANCELLED') return '#f87171'
  return '#f59e0b'
}
function statusLabel(s: string) { return s.charAt(0) + s.slice(1).toLowerCase() }

// ─── Card shell ───────────────────────────────────────────────────────────────

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.875rem', ...style }}>
      {children}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DepositFunds() {
  const { user } = useAuth()

  const [wallets,        setWallets]        = useState<ActiveWallet[]>([])
  const [walletsLoading, setWalletsLoading] = useState(true)
  const [selectedId,     setSelectedId]     = useState<string | null>(null)
  const [copied,         setCopied]         = useState(false)

  // Step 3 state
  const [amount,        setAmount]        = useState('')
  const [proofFile,     setProofFile]     = useState<File | null>(null)
  const [proofPreview,  setProofPreview]  = useState<string | null>(null)
  const [submitting,    setSubmitting]    = useState(false)
  const [submitError,   setSubmitError]   = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Recent deposits
  const [deposits,   setDeposits]   = useState<Transaction[]>([])
  const [txLoading,  setTxLoading]  = useState(true)
  const [pendingAmt, setPendingAmt] = useState(0)

  const balance      = user?.balance       ?? 0
  const totalDeposit = user?.totalDeposits ?? 0
  const selectedWallet = wallets.find(w => w.id === selectedId) ?? wallets[0] ?? null
  const isBankWallet   = selectedWallet?.network === 'Bank Transfer'

  // ── Fetch wallets ──────────────────────────────────────────────────────────
  const fetchWallets = useCallback(async () => {
    setWalletsLoading(true)
    try {
      const res = await api.get<{ success: boolean; data: ActiveWallet[] }>('/admin/wallets/active')
      setWallets(res.data)
      if (res.data.length > 0) setSelectedId(res.data[0].id)
    } catch (e) { console.error(e) }
    finally { setWalletsLoading(false) }
  }, [])

  // ── Fetch recent deposits ──────────────────────────────────────────────────
  const fetchDeposits = useCallback(async () => {
    setTxLoading(true)
    try {
      const res = await api.get<{ success: boolean; data: Transaction[] }>('/user/transactions?limit=50')
      const deps = res.data.filter(t => t.type === 'DEPOSIT')
      setDeposits(deps.slice(0, 5))
      setPendingAmt(deps.filter(t => t.status === 'PENDING' || t.status === 'PROCESSING').reduce((s, t) => s + t.amount, 0))
    } catch (e) { console.error(e) }
    finally { setTxLoading(false) }
  }, [])

  useEffect(() => { fetchWallets(); fetchDeposits() }, [fetchWallets, fetchDeposits])

  // ── Copy address ───────────────────────────────────────────────────────────
  function copyAddress() {
    if (!selectedWallet) return
    navigator.clipboard.writeText(selectedWallet.address).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Handle proof file pick ─────────────────────────────────────────────────
  function handleProofPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setProofFile(file)
    setSubmitError('')
    const reader = new FileReader()
    reader.onload = ev => setProofPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function removeProof() {
    setProofFile(null)
    setProofPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Submit deposit proof ───────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError('')

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setSubmitError('Please enter a valid deposit amount.')
      return
    }
    if (!proofFile) {
      setSubmitError('Please upload your payment proof screenshot or receipt.')
      return
    }

    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('amount',       amount)
      fd.append('network',      selectedWallet?.network ?? '')
      fd.append('walletId',     selectedWallet?.id ?? '')
      fd.append('paymentProof', proofFile)

      await api.upload('/user/deposit/submit', fd)

      setSubmitSuccess(true)
      setAmount('')
      removeProof()
      fetchDeposits()
    } catch (err: any) {
      setSubmitError(err.message ?? 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const hasWallets = wallets.length > 0

  return (
    <div className="p-4 md:p-6 max-w-[960px] mx-auto overflow-x-hidden">
      <style>{`@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>

      {/* Header */}
      <div className="mb-6">
        <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'hsl(40 6% 95%)', marginBottom: 3 }}>Deposit Funds</h1>
        <p style={{ fontSize: 13, color: 'hsl(240 5% 55%)' }}>Add funds to your account to start trading and investing</p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Account Balance', value: fmt(balance),      icon: ArrowDownLeft, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
          { label: 'Total Deposited', value: fmt(totalDeposit), icon: CheckCircle,   color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
          { label: 'Pending',         value: fmt(pendingAmt),   icon: Clock,         color: '#f59e0b', bg: 'rgba(245,158,11,0.1)'  },
        ].map(s => (
          <Card key={s.label} style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: '0.5rem', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <s.icon size={15} style={{ color: s.color }} />
            </div>
            <div>
              <p style={{ fontSize: 11, color: 'hsl(240 5% 55%)', marginBottom: 2 }}>{s.label}</p>
              <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'hsl(40 6% 92%)', letterSpacing: '-0.02em' }}>{s.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {walletsLoading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 0' }}>
          <Loader2 size={28} style={{ color: 'hsl(240 5% 40%)', animation: 'spin 1s linear infinite' }} />
        </div>
      )}

      {!walletsLoading && !hasWallets && (
        <Card style={{ padding: '3rem', textAlign: 'center' }}>
          <AlertCircle size={28} style={{ color: 'hsl(240 5% 45%)', margin: '0 auto 0.75rem' }} />
          <p style={{ fontSize: 14, fontWeight: 500, color: 'hsl(40 6% 75%)', marginBottom: 4 }}>No deposit methods available</p>
          <p style={{ fontSize: 12, color: 'hsl(240 5% 50%)' }}>Please contact support or check back later.</p>
        </Card>
      )}

      {!walletsLoading && hasWallets && (
        <div className="grid lg:grid-cols-[1fr_340px] gap-5">

          {/* ── Left column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Step 1 — Choose wallet */}
            <Card style={{ padding: '1.375rem' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'hsl(240 5% 50%)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1rem' }}>
                Step 1 — Choose Payment Method
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {wallets.map(w => (
                  <button key={w.id} onClick={() => { setSelectedId(w.id); setCopied(false); setSubmitSuccess(false) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.875rem 1rem', borderRadius: '0.75rem', border: selectedWallet?.id === w.id ? `1px solid ${w.color}55` : '1px solid rgba(255,255,255,0.07)', background: selectedWallet?.id === w.id ? `${w.color}08` : 'rgba(255,255,255,0.02)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                    <span style={{ width: 38, height: 38, borderRadius: '0.625rem', background: w.color + '20', color: w.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, flexShrink: 0 }}>{w.icon}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'hsl(40 6% 92%)', marginBottom: 1 }}>{w.label}</p>
                      <p style={{ fontSize: 11, color: 'hsl(240 5% 55%)' }}>{w.network}{w.chain ? ` · ${w.chain}` : ''}</p>
                    </div>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, border: selectedWallet?.id === w.id ? 'none' : '2px solid rgba(255,255,255,0.2)', background: selectedWallet?.id === w.id ? w.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {selectedWallet?.id === w.id && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#050505' }} />}
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            {/* Step 2 — Copy address (crypto) */}
            {selectedWallet && !isBankWallet && (
              <Card style={{ padding: '1.375rem' }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'hsl(240 5% 50%)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1rem' }}>
                  Step 2 — Copy Deposit Address
                </p>

                {/* Address box */}
                <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)', marginBottom: 6 }}>Deposit Address</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.75rem 1rem', borderRadius: '0.625rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '0.75rem' }}>
                  <p style={{ flex: 1, fontSize: 11, fontFamily: 'monospace', color: 'hsl(40 6% 75%)', wordBreak: 'break-all', lineHeight: 1.5 }}>{selectedWallet.address}</p>
                  <button onClick={copyAddress}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0.4rem 0.75rem', borderRadius: '0.5rem', background: copied ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.06)', border: copied ? '1px solid rgba(167,139,250,0.3)' : '1px solid rgba(255,255,255,0.1)', color: copied ? '#a78bfa' : 'hsl(40 6% 80%)', fontSize: 12, cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s' }}>
                    {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>

                {selectedWallet.tag && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, padding: '0.625rem 0.875rem', borderRadius: '0.5rem', background: 'rgba(255,193,7,0.06)', border: '1px solid rgba(255,193,7,0.2)', marginBottom: '0.75rem' }}>
                    <AlertCircle size={13} style={{ color: '#fbbf24', flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: 11, color: 'hsl(40 6% 70%)', lineHeight: 1.6 }}>
                      <strong style={{ color: '#fbbf24' }}>Memo / Tag required:</strong>{' '}
                      <span style={{ fontFamily: 'monospace', color: '#fde68a' }}>{selectedWallet.tag}</span>
                    </p>
                  </div>
                )}

                {/* QR Code */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.625rem', border: '1px solid rgba(255,255,255,0.07)', marginBottom: '0.75rem' }}>
                  <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)', marginBottom: '0.75rem' }}>Scan QR Code</p>
                  <div style={{ background: '#fff', borderRadius: '0.5rem', padding: 10, display: 'inline-flex' }}>
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(selectedWallet.address)}&size=150x150&margin=2`} alt="QR" width={150} height={150} style={{ display: 'block', borderRadius: '0.25rem' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, padding: '0.625rem 0.875rem', borderRadius: '0.5rem', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <AlertCircle size={13} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 11, color: 'hsl(40 6% 70%)', lineHeight: 1.6 }}>
                    Only send <strong style={{ color: 'hsl(40 6% 88%)' }}>{selectedWallet.network}{selectedWallet.chain ? ` (${selectedWallet.chain})` : ''}</strong> to this address.
                  </p>
                </div>
              </Card>
            )}

            {/* Step 2 — Bank wire */}
            {selectedWallet && isBankWallet && (
              <Card style={{ padding: '1.375rem' }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'hsl(240 5% 50%)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1rem' }}>
                  Step 2 — Bank Wire Details
                </p>
                <div style={{ padding: '0.75rem 0.875rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '0.75rem' }}>
                  <p style={{ fontSize: 12, fontFamily: 'monospace', color: 'hsl(40 6% 82%)', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{selectedWallet.address}</p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0.875rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: 12, color: 'hsl(240 5% 55%)' }}>Your Reference</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'hsl(40 6% 88%)', fontFamily: 'monospace' }}>{user?.id?.slice(0, 8).toUpperCase() ?? 'AC-XXXX'}</span>
                </div>
              </Card>
            )}

            {/* Step 3 — Amount + Proof Upload */}
            {selectedWallet && (
              <Card style={{ padding: '1.375rem' }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'hsl(240 5% 50%)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1rem' }}>
                  Step 3 — Enter Amount & Upload Proof
                </p>

                {/* Success banner */}
                {submitSuccess && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '0.875rem 1rem', borderRadius: '0.625rem', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.25)', marginBottom: '1rem' }}>
                    <CheckCircle size={16} style={{ color: '#a78bfa', flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#a78bfa', marginBottom: 2 }}>Deposit Submitted!</p>
                      <p style={{ fontSize: 12, color: 'hsl(40 6% 70%)', lineHeight: 1.5 }}>Your payment proof has been uploaded and is pending admin review. You'll see it as <strong style={{ color: '#f59e0b' }}>Pending</strong> in your transaction history.</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Amount input */}
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(40 6% 70%)', marginBottom: 6 }}>Amount Deposited (USD)</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'hsl(240 5% 50%)', fontWeight: 600 }}>$</span>
                      <input
                        type="number"
                        min="1"
                        step="any"
                        placeholder="0.00"
                        value={amount}
                        onChange={e => { setAmount(e.target.value); setSubmitError(''); setSubmitSuccess(false) }}
                        style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 1.75rem', borderRadius: '0.625rem', fontSize: 15, fontWeight: 600, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(40 6% 92%)', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  {/* Proof upload */}
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(40 6% 70%)', marginBottom: 6 }}>Payment Proof (Screenshot / Receipt)</label>

                    {!proofFile ? (
                      <button type="button" onClick={() => fileInputRef.current?.click()}
                        style={{ width: '100%', padding: '1.5rem 1rem', borderRadius: '0.75rem', border: '2px dashed rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.02)', color: 'hsl(240 5% 50%)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, transition: 'all 0.15s', boxSizing: 'border-box' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(167,139,250,0.35)'; (e.currentTarget as HTMLElement).style.background = 'rgba(167,139,250,0.04)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)' }}
                      >
                        <Upload size={22} style={{ color: 'hsl(240 5% 45%)' }} />
                        <span style={{ fontSize: 12, fontWeight: 600 }}>Click to upload proof</span>
                        <span style={{ fontSize: 11, color: 'hsl(240 5% 40%)' }}>PNG, JPG, WEBP or PDF · max 10 MB</span>
                      </button>
                    ) : (
                      <div style={{ position: 'relative', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid rgba(167,139,250,0.25)', background: 'rgba(167,139,250,0.04)' }}>
                        {proofPreview && proofFile.type.startsWith('image/') ? (
                          <img src={proofPreview} alt="proof" style={{ width: '100%', maxHeight: 200, objectFit: 'contain', display: 'block', background: 'rgba(0,0,0,0.2)' }} />
                        ) : (
                          <div style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <ImageIcon size={20} style={{ color: '#a78bfa' }} />
                            <span style={{ fontSize: 12, color: 'hsl(40 6% 75%)' }}>{proofFile.name}</span>
                          </div>
                        )}
                        <button type="button" onClick={removeProof}
                          style={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          <X size={13} />
                        </button>
                        <div style={{ padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <CheckCircle size={12} style={{ color: '#a78bfa' }} />
                          <span style={{ fontSize: 11, color: '#a78bfa', fontWeight: 600 }}>Proof selected</span>
                          <button type="button" onClick={() => fileInputRef.current?.click()} style={{ marginLeft: 'auto', fontSize: 11, color: 'hsl(240 5% 50%)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Change</button>
                        </div>
                      </div>
                    )}

                    <input ref={fileInputRef} type="file" accept="image/*,application/pdf" onChange={handleProofPick} style={{ display: 'none' }} />
                  </div>

                  {/* Error */}
                  {submitError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.625rem 0.875rem', borderRadius: '0.5rem', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
                      <AlertCircle size={13} style={{ color: '#f87171', flexShrink: 0 }} />
                      <p style={{ fontSize: 12, color: '#f87171' }}>{submitError}</p>
                    </div>
                  )}

                  {/* Submit */}
                  <button type="submit" disabled={submitting}
                    style={{ width: '100%', padding: '0.875rem', borderRadius: '0.75rem', background: submitting ? 'rgba(167,139,250,0.3)' : 'rgba(167,139,250,0.9)', border: 'none', color: '#050505', fontSize: 14, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.15s' }}>
                    {submitting ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Submitting…</> : <><Upload size={15} /> Submit Deposit Proof</>}
                  </button>
                </form>
              </Card>
            )}
          </div>

          {/* ── Right column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* How it works */}
            <Card style={{ padding: '1.25rem' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'hsl(240 5% 50%)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.875rem' }}>How It Works</p>
              {[
                { n: '1', label: 'Choose method', desc: 'Select your preferred payment method above.' },
                { n: '2', label: 'Send payment', desc: 'Transfer funds to the address or bank details shown.' },
                { n: '3', label: 'Upload proof',  desc: 'Enter the amount and upload your payment receipt.' },
                { n: '4', label: 'Admin approval', desc: 'We verify and credit your account, usually within 1–24h.' },
              ].map(step => (
                <div key={step.n} style={{ display: 'flex', gap: 10, marginBottom: '0.75rem' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, fontWeight: 800, color: '#a78bfa' }}>{step.n}</div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'hsl(40 6% 82%)', marginBottom: 1 }}>{step.label}</p>
                    <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)', lineHeight: 1.5 }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </Card>

            {/* Selected method */}
            {selectedWallet && (
              <Card style={{ padding: '1.25rem' }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'hsl(240 5% 50%)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.875rem' }}>Selected Method</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.625rem', marginBottom: '0.75rem' }}>
                  <span style={{ width: 32, height: 32, borderRadius: '0.5rem', background: selectedWallet.color + '20', color: selectedWallet.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, flexShrink: 0 }}>{selectedWallet.icon}</span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'hsl(40 6% 90%)' }}>{selectedWallet.label}</p>
                    <p style={{ fontSize: 11, color: 'hsl(240 5% 55%)' }}>{selectedWallet.network}{selectedWallet.chain ? ` · ${selectedWallet.chain}` : ''}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: 12, color: 'hsl(240 5% 55%)' }}>Processing</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'hsl(40 6% 85%)' }}>{isBankWallet ? '1–3 business days' : '1–24 hours'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem' }}>
                  <span style={{ fontSize: 12, color: 'hsl(240 5% 55%)' }}>Fee</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'hsl(40 6% 85%)' }}>{isBankWallet ? 'Bank dependent' : 'None'}</span>
                </div>
              </Card>
            )}

            {/* Security notice */}
            <Card style={{ padding: '1.25rem' }}>
              <div className="flex items-center gap-2 mb-3">
                <Shield size={14} style={{ color: '#a78bfa' }} />
                <p style={{ fontSize: 12, fontWeight: 600, color: 'hsl(40 6% 88%)' }}>Secure & Protected</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['256-bit SSL encryption', 'Cold wallet storage (95% of funds)', 'Multi-sig authorization required', 'Real-time fraud monitoring'].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle size={11} style={{ color: '#a78bfa', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'hsl(240 5% 60%)' }}>{item}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent deposits */}
            <Card style={{ padding: '1.25rem' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'hsl(240 5% 50%)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.875rem' }}>Recent Deposits</p>
              {txLoading && <div style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem 0' }}><Loader2 size={18} style={{ color: 'hsl(240 5% 45%)', animation: 'spin 1s linear infinite' }} /></div>}
              {!txLoading && deposits.length === 0 && <p style={{ fontSize: 12, color: 'hsl(240 5% 45%)', textAlign: 'center', padding: '1rem 0' }}>No deposits yet</p>}
              {!txLoading && deposits.map(d => (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.625rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.03)', marginBottom: 6 }}>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#a78bfa' }}>+{fmt(d.amount)}</p>
                    <p style={{ fontSize: 10, color: 'hsl(240 5% 50%)' }}>{d.network ? `${d.network}` : 'Deposit'} · {fmtDate(d.createdAt)}</p>
                  </div>
                  <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 999, background: `${statusColor(d.status)}18`, color: statusColor(d.status), fontWeight: 600 }}>
                    {statusLabel(d.status)}
                  </span>
                </div>
              ))}
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
