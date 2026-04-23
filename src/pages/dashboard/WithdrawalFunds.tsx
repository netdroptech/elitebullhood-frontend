import { useState, useEffect, useCallback, useRef } from 'react'
import { ArrowUpRight, Clock, Shield, CheckCircle, AlertCircle, ChevronDown, Lock, Loader2, KeyRound } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

// ─── Types ────────────────────────────────────────────────────────────────────

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
function statusBg(s: string) {
  if (s === 'COMPLETED') return 'rgba(167,139,250,0.1)'
  if (s === 'REJECTED' || s === 'CANCELLED') return 'rgba(248,113,113,0.1)'
  return 'rgba(245,158,11,0.1)'
}
function statusLabel(s: string) { return s.charAt(0) + s.slice(1).toLowerCase() }

const METHODS = [
  {
    id: 'crypto',
    label: 'Cryptocurrency',
    sub: 'Instant · No fees',
    icon: '₿',
    iconBg: 'rgba(245,158,11,0.15)',
    processingTime: 'Within 24 hours',
    fee: 'Network fee only',
    minAmount: '$50',
  },
]

const CRYPTO_COINS = ['Bitcoin (BTC)', 'Ethereum (ETH)', 'USDT (TRC-20)', 'USDT (ERC-20)', 'BNB (BEP-20)', 'Solana (SOL)']


function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.875rem', ...style }}>{children}</div>
}

export function WithdrawalFunds() {
  const { user } = useAuth()

  const [method, setMethod]     = useState('crypto')
  const [coin, setCoin]         = useState('USDT (TRC-20)')
  const [coinOpen, setCoinOpen] = useState(false)
  const [amount, setAmount]     = useState('')
  const [address, setAddress]   = useState('')
  const [step, setStep]         = useState<'form' | 'confirm' | 'code' | 'success'>('form')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Form validation error (shown inline above submit button)
  const [formError, setFormError] = useState('')

  // 5-digit withdrawal code
  const [codeDigits, setCodeDigits] = useState(['', '', '', '', ''])
  const [codeError,  setCodeError]  = useState('')
  const codeRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  // Real transaction data
  const [withdrawals,    setWithdrawals]    = useState<Transaction[]>([])
  const [txLoading,      setTxLoading]      = useState(true)
  const [pendingAmt,     setPendingAmt]     = useState(0)
  const [totalWithdrawn, setTotalWithdrawn] = useState(0)

  // Admin-controlled method availability
  const [cryptoEnabled,  setCryptoEnabled]  = useState(true)

  const enabledMethods = METHODS.filter(m =>
    (m.id === 'crypto' && cryptoEnabled)
  )

  const selected  = METHODS.find(m => m.id === method)!
  const balance   = user?.balance ?? 0
  const numAmount = parseFloat(amount) || 0

  // ── Fetch withdrawal history ───────────────────────────────────────────────
  const fetchWithdrawals = useCallback(async () => {
    setTxLoading(true)
    try {
      const res = await api.get<{ success: boolean; data: Transaction[] }>('/user/transactions?limit=50')
      const wds = res.data.filter(t => t.type === 'WITHDRAWAL')
      setWithdrawals(wds.slice(0, 5))
      setPendingAmt(wds.filter(t => t.status === 'PENDING' || t.status === 'PROCESSING').reduce((s, t) => s + t.amount, 0))
      setTotalWithdrawn(wds.filter(t => t.status === 'COMPLETED').reduce((s, t) => s + t.amount, 0))
    } catch (e) { console.error(e) }
    finally { setTxLoading(false) }
  }, [])

  // ── Fetch admin-controlled method settings ────────────────────────────────
  useEffect(() => {
    api.get<{ success: boolean; data: { cryptoEnabled: boolean } }>('/user/withdrawal-settings')
      .then(res => {
        setCryptoEnabled(res.data.cryptoEnabled)
      })
      .catch(() => { /* fail open */ })
  }, [])

  useEffect(() => { fetchWithdrawals() }, [fetchWithdrawals])

  function handleSubmit() {
    setFormError('')

    if (numAmount <= 0) {
      setFormError('Please enter a withdrawal amount.')
      return
    }
    if (numAmount > balance) {
      setFormError(`Amount exceeds your available balance of ${fmt(balance)}.`)
      return
    }
    if (method === 'crypto' && address.trim().length < 10) {
      setFormError('Please enter a valid destination wallet address.')
      return
    }
    setStep('confirm')
  }

  // Step: review → code entry (no API call yet)
  function handleConfirm() {
    setCodeDigits(['', '', '', '', ''])
    setCodeError('')
    setStep('code')
    // Auto-focus first box after render
    setTimeout(() => codeRefs[0].current?.focus(), 50)
  }

  // Step: code entry → actually submit
  async function handleCodeSubmit() {
    const code = codeDigits.join('')
    if (code.length < 5) { setCodeError('Please enter all 5 digits.'); return }
    setSubmitting(true)
    setCodeError('')
    setSubmitError('')
    try {
      await api.post('/user/withdrawal/submit', {
        amount:        numAmount,
        method:        'crypto',
        code,
        coin,
        address,
      })
      // Await the refresh so data is ready when user returns to form view
      await fetchWithdrawals()
      setStep('success')
    } catch (err: any) {
      const isCodeErr = (err as any).codeError
      if (isCodeErr || err.message?.toLowerCase().includes('code')) {
        setCodeError(err.message ?? 'Invalid withdrawal code.')
        // Shake the boxes and clear
        setCodeDigits(['', '', '', '', ''])
        setTimeout(() => codeRefs[0].current?.focus(), 50)
      } else {
        setSubmitError(err.message ?? 'Failed to submit withdrawal. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  // ── Code entry step ──────────────────────────────────────────────────────────
  if (step === 'code') {
    const allFilled = codeDigits.every(d => d !== '')
    return (
      <div className="p-6 max-w-[900px] mx-auto flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <style>{`
          @keyframes shake {
            0%,100%{transform:translateX(0)}
            15%,45%,75%{transform:translateX(-6px)}
            30%,60%,90%{transform:translateX(6px)}
          }
          .code-shake { animation: shake 0.45s ease; }
          @keyframes spin{to{transform:rotate(360deg)}}
        `}</style>
        <Card style={{ padding: '2rem', maxWidth: 420, width: '100%', textAlign: 'center' }}>
          {/* Icon */}
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(167,139,250,0.1)', border: '2px solid rgba(167,139,250,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <KeyRound size={26} style={{ color: '#a78bfa' }} />
          </div>

          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'hsl(40 6% 95%)', marginBottom: 6 }}>Security Verification</h2>
          <p style={{ fontSize: 13, color: 'hsl(240 5% 55%)', marginBottom: '1.75rem', lineHeight: 1.6 }}>
            Enter your 5-digit withdrawal code to authorise this transaction.
          </p>

          {/* 5-box PIN input */}
          <div id="code-boxes" style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: codeError ? '0.75rem' : '1.5rem' }}>
            {codeDigits.map((d, i) => (
              <input
                key={i}
                ref={codeRefs[i]}
                type="text"
                inputMode="numeric"
                pattern="\d*"
                maxLength={1}
                value={d}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(-1)
                  const next = [...codeDigits]
                  next[i] = val
                  setCodeDigits(next)
                  setCodeError('')
                  if (val && i < 4) codeRefs[i + 1].current?.focus()
                }}
                onKeyDown={e => {
                  if (e.key === 'Backspace' && !codeDigits[i] && i > 0) {
                    codeRefs[i - 1].current?.focus()
                  }
                  if (e.key === 'Enter' && codeDigits.every(x => x)) handleCodeSubmit()
                }}
                onPaste={e => {
                  e.preventDefault()
                  const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 5)
                  const next = ['', '', '', '', '']
                  pasted.split('').forEach((c, idx) => { if (idx < 5) next[idx] = c })
                  setCodeDigits(next)
                  setCodeError('')
                  const focusIdx = Math.min(pasted.length, 4)
                  codeRefs[focusIdx].current?.focus()
                }}
                style={{
                  width: 52, height: 62,
                  borderRadius: '0.75rem',
                  background: codeError ? 'rgba(248,113,113,0.08)' : d ? 'rgba(167,139,250,0.06)' : 'rgba(255,255,255,0.04)',
                  border: codeError
                    ? '2px solid rgba(248,113,113,0.5)'
                    : d ? '2px solid rgba(167,139,250,0.4)' : '2px solid rgba(255,255,255,0.12)',
                  color: codeError ? '#f87171' : 'hsl(40 6% 95%)',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  textAlign: 'center',
                  outline: 'none',
                  caretColor: 'transparent',
                  transition: 'border-color 0.15s, background 0.15s',
                  letterSpacing: d ? '0.1em' : undefined,
                }}
              />
            ))}
          </div>

          {/* Error message */}
          {codeError && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: '1.25rem' }}>
              <AlertCircle size={13} style={{ color: '#f87171', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#f87171' }}>{codeError}</span>
            </div>
          )}

          {/* Submit error (non-code errors like "server error") */}
          {submitError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.625rem 0.875rem', borderRadius: '0.625rem', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', marginBottom: '1rem', textAlign: 'left' }}>
              <AlertCircle size={13} style={{ color: '#f87171', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#f87171' }}>{submitError}</span>
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => { setStep('confirm'); setCodeError(''); setSubmitError('') }}
              disabled={submitting}
              style={{ flex: 1, padding: '0.75rem', borderRadius: '0.625rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(40 6% 80%)', fontSize: 13, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.5 : 1 }}
            >
              Back
            </button>
            <button
              onClick={handleCodeSubmit}
              disabled={submitting || !allFilled}
              style={{ flex: 2, padding: '0.75rem', borderRadius: '0.625rem', background: !allFilled || submitting ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)', color: !allFilled || submitting ? 'hsl(240 5% 45%)' : '#050505', fontSize: 13, fontWeight: 700, border: 'none', cursor: !allFilled || submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              {submitting ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />Verifying…</> : 'Confirm Withdrawal'}
            </button>
          </div>

          <p style={{ fontSize: 11, color: 'hsl(240 5% 40%)', marginTop: '1rem', lineHeight: 1.5 }}>
            Contact support if you haven't received your withdrawal code.
          </p>
        </Card>
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div className="p-6 max-w-[900px] mx-auto flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(167,139,250,0.15)', border: '2px solid rgba(167,139,250,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <CheckCircle size={32} style={{ color: '#a78bfa' }} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'hsl(40 6% 95%)', marginBottom: 8 }}>Withdrawal Submitted</h2>
          <p style={{ fontSize: 13, color: 'hsl(240 5% 55%)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Your withdrawal request of <strong style={{ color: 'hsl(40 6% 85%)' }}>${numAmount.toFixed(2)}</strong> has been submitted and is pending review. You'll be notified once it's processed.
          </p>
          <button onClick={() => { setStep('form'); setAmount(''); setAddress(''); setSubmitError(''); setCodeDigits(['','','','','']); setCodeError(''); setFormError(''); fetchWithdrawals() }} style={{ padding: '0.625rem 1.5rem', borderRadius: '0.625rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'hsl(40 6% 88%)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            New Withdrawal
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-[900px] mx-auto overflow-x-hidden">

      {/* Header */}
      <div className="mb-6">
        <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'hsl(40 6% 95%)', marginBottom: 3 }}>Withdrawal Funds</h1>
        <p style={{ fontSize: 13, color: 'hsl(240 5% 55%)' }}>Withdraw your earnings to your preferred payment method</p>
      </div>

      {/* Balance strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Available Balance', value: fmt(balance),         color: '#a78bfa', bg: 'rgba(167,139,250,0.1)',  icon: ArrowUpRight },
          { label: 'Total Withdrawn',   value: fmt(totalWithdrawn),  color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', icon: ArrowUpRight },
          { label: 'Pending',           value: fmt(pendingAmt),      color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: Clock        },
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

      {/* Verification required banner */}
      {balance === 0 && (
        <div style={{ borderRadius: '0.875rem', padding: '1rem 1.25rem', marginBottom: '1.25rem', background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.2)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <AlertCircle size={16} style={{ color: '#f87171', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'hsl(40 6% 88%)', marginBottom: 1 }}>Insufficient balance — make a deposit first</p>
            <p style={{ fontSize: 12, color: 'hsl(240 5% 55%)' }}>You need a funded account before placing a withdrawal request.</p>
          </div>
          <button style={{ padding: '0.45rem 1rem', borderRadius: '0.5rem', background: 'linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)', color: '#050505', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', flexShrink: 0 }}>
            Deposit Now
          </button>
        </div>
      )}

      {step === 'confirm' ? (
        /* Confirmation screen */
        <Card style={{ padding: '1.75rem', maxWidth: 520 }}>
          <div className="flex items-center gap-2 mb-5">
            <Lock size={15} style={{ color: '#a78bfa' }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: 'hsl(40 6% 92%)' }}>Confirm Withdrawal</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Amount',      value: `$${numAmount.toFixed(2)}` },
              { label: 'Method',      value: selected.label },
              { label: 'Fee',         value: selected.fee },
              { label: 'You receive', value: `$${numAmount.toFixed(2)}` },
              { label: 'Processing',  value: selected.processingTime },
              { label: 'Address', value: address.slice(0, 20) + '...' },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.625rem 0.875rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem' }}>
                <span style={{ fontSize: 12, color: 'hsl(240 5% 55%)' }}>{r.label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'hsl(40 6% 88%)' }}>{r.value}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setStep('form')} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.625rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(40 6% 80%)', fontSize: 13, cursor: 'pointer' }}>Back</button>
            <button onClick={handleConfirm} style={{ flex: 2, padding: '0.75rem', borderRadius: '0.625rem', background: 'linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)', color: '#050505', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer' }}>Continue</button>
          </div>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-[1fr_320px] gap-5">
          {/* Left — form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Step 1 — method */}
            <Card style={{ padding: '1.375rem' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'hsl(240 5% 50%)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1rem' }}>1 — Withdrawal Method</p>

              {/* All methods disabled banner */}
              {enabledMethods.length === 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.875rem 1rem', borderRadius: '0.75rem', background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.2)', marginBottom: '0.75rem' }}>
                  <AlertCircle size={15} style={{ color: '#f87171', flexShrink: 0 }} />
                  <p style={{ fontSize: 13, color: 'hsl(40 6% 80%)' }}>
                    Withdrawals are temporarily unavailable. Please contact support.
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {enabledMethods.map(m => (
                  <button
                    key={m.id}
                    onClick={() => { setMethod(m.id); setFormError('') }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.875rem 1rem', borderRadius: '0.75rem', border: method === m.id ? '1px solid rgba(167,139,250,0.3)' : '1px solid rgba(255,255,255,0.07)', background: method === m.id ? 'rgba(167,139,250,0.04)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
                  >
                    <span style={{ width: 38, height: 38, borderRadius: '0.625rem', background: m.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{m.icon}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'hsl(40 6% 92%)', marginBottom: 1 }}>{m.label}</p>
                      <p style={{ fontSize: 11, color: 'hsl(240 5% 55%)' }}>{m.sub}</p>
                    </div>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', border: method === m.id ? 'none' : '2px solid rgba(255,255,255,0.2)', background: method === m.id ? '#a78bfa' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {method === m.id && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#050505' }} />}
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            {/* Step 2 — details */}
            <Card style={{ padding: '1.375rem' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'hsl(240 5% 50%)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1rem' }}>2 — Withdrawal Details</p>

              {/* Amount */}
              <p style={{ fontSize: 11, color: 'hsl(240 5% 55%)', marginBottom: 6 }}>Amount (USD)</p>
              <div style={{ position: 'relative', marginBottom: '1rem' }}>
                <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', fontSize: 16, fontWeight: 600, color: 'hsl(240 5% 55%)' }}>$</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => { setAmount(e.target.value); setFormError('') }}
                  style={{ width: '100%', paddingLeft: '2rem', paddingRight: '1rem', paddingTop: '0.875rem', paddingBottom: '0.875rem', borderRadius: '0.625rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(40 6% 92%)', fontSize: 16, fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {['$50', '$100', '$500', 'MAX'].map(v => (
                  <button key={v} onClick={() => setAmount(v === 'MAX' ? String(balance) : v.replace('$', ''))} style={{ padding: '0.5rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'hsl(40 6% 75%)', fontSize: 12, cursor: 'pointer' }}>{v}</button>
                ))}
              </div>

              {/* Crypto: address field + coin selector */}
              <p style={{ fontSize: 11, color: 'hsl(240 5% 55%)', marginBottom: 6 }}>Select Coin</p>
                  <div style={{ position: 'relative', marginBottom: '1rem' }}>
                    <button onClick={() => setCoinOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderRadius: '0.625rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(40 6% 88%)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                      {coin}
                      <ChevronDown size={14} style={{ color: 'hsl(240 5% 50%)', transform: coinOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                    </button>
                    {coinOpen && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, marginTop: 4, borderRadius: '0.625rem', background: 'hsl(260 60% 6%)', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                        {CRYPTO_COINS.map(c => (
                          <button key={c} onClick={() => { setCoin(c); setCoinOpen(false) }} style={{ display: 'block', width: '100%', padding: '0.625rem 1rem', textAlign: 'left', fontSize: 13, color: c === coin ? '#a78bfa' : 'hsl(40 6% 80%)', background: c === coin ? 'rgba(167,139,250,0.08)' : 'transparent', border: 'none', cursor: 'pointer' }}>{c}</button>
                        ))}
                      </div>
                    )}
                  </div>

                  <p style={{ fontSize: 11, color: 'hsl(240 5% 55%)', marginBottom: 6 }}>Destination Wallet Address</p>
                  <input
                    type="text"
                    placeholder="Paste your wallet address here"
                    value={address}
                    onChange={e => { setAddress(e.target.value); setFormError('') }}
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.625rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(40 6% 88%)', fontSize: 13, outline: 'none', boxSizing: 'border-box', marginBottom: '0.875rem', fontFamily: 'monospace' }}
                  />

              {(() => {
                const hardDisabled = !cryptoEnabled
                const label = !cryptoEnabled ? 'Method Unavailable' : 'Review Withdrawal'
                return (
                  <>
                    {formError && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0.625rem 0.875rem', borderRadius: '0.625rem', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', marginBottom: '0.75rem' }}>
                        <AlertCircle size={13} style={{ color: '#f87171', flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: '#f87171' }}>{formError}</span>
                      </div>
                    )}
                    <button
                      onClick={handleSubmit}
                      disabled={hardDisabled}
                      style={{ width: '100%', padding: '0.875rem', borderRadius: '0.625rem', background: hardDisabled ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)', color: hardDisabled ? 'hsl(240 5% 45%)' : '#050505', fontSize: 14, fontWeight: 700, border: hardDisabled ? '1px solid rgba(255,255,255,0.08)' : 'none', cursor: hardDisabled ? 'not-allowed' : 'pointer', boxShadow: hardDisabled ? 'none' : '0 4px 20px rgba(167,139,250,0.2)' }}
                    >
                      {label}
                    </button>
                  </>
                )
              })()}
            </Card>
          </div>

          {/* Right — info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Card style={{ padding: '1.25rem' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'hsl(240 5% 50%)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.875rem' }}>Method Details</p>
              {[
                { label: 'Min Amount',  value: selected.minAmount },
                { label: 'Processing', value: selected.processingTime },
                { label: 'Fee',        value: selected.fee },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.625rem', marginBottom: '0.625rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: 12, color: 'hsl(240 5% 55%)' }}>{r.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'hsl(40 6% 85%)' }}>{r.value}</span>
                </div>
              ))}
            </Card>

            <Card style={{ padding: '1.25rem' }}>
              <div className="flex items-center gap-2 mb-3">
                <Shield size={14} style={{ color: '#a78bfa' }} />
                <p style={{ fontSize: 12, fontWeight: 600, color: 'hsl(40 6% 88%)' }}>Withdrawal Policy</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  'KYC verification required',
                  'Withdrawals reviewed within 24h',
                  'Address whitelisting available',
                  'Anti-money laundering checks',
                ].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle size={11} style={{ color: '#a78bfa', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'hsl(240 5% 60%)' }}>{item}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card style={{ padding: '1.25rem' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'hsl(240 5% 50%)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.875rem' }}>Recent Withdrawals</p>
              {txLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem 0' }}>
                  <Loader2 size={18} style={{ color: '#a78bfa', animation: 'spin 1s linear infinite' }} />
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                </div>
              ) : withdrawals.length === 0 ? (
                <p style={{ fontSize: 12, color: 'hsl(240 5% 45%)', textAlign: 'center', padding: '0.75rem 0' }}>No withdrawals yet</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {withdrawals.map(w => (
                    <div key={w.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.625rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.03)' }}>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#f87171' }}>−{fmt(w.amount)}</p>
                        <p style={{ fontSize: 10, color: 'hsl(240 5% 50%)' }}>
                          {w.network ? `${w.network} · ` : ''}{fmtDate(w.createdAt)}
                        </p>
                      </div>
                      <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 999, background: statusBg(w.status), color: statusColor(w.status), fontWeight: 600 }}>
                        {statusLabel(w.status)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
