import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { usePlatformName } from '@/context/PlatformNameContext'
import {
  Lock, Eye, EyeOff, ArrowLeft, CheckCircle,
  Loader2, AlertCircle, ShieldCheck,
} from 'lucide-react'
import { api } from '../../lib/api'
import { PageBackground } from '@/components/ui/PageBackground'

export default function ResetPasswordPage() {
  const navigate        = useNavigate()
  const { platformName } = usePlatformName()
  const [params]        = useSearchParams()
  const token           = params.get('token') ?? ''

  const [password,  setPassword]  = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw,    setShowPw]    = useState(false)
  const [showCPw,   setShowCPw]   = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [done,      setDone]      = useState(false)
  const [error,     setError]     = useState('')

  // ── Password strength ─────────────────────────────────────────────────────
  function pwStrength(pw: string): { score: number; label: string; color: string } {
    let score = 0
    if (pw.length >= 8)           score++
    if (/[A-Z]/.test(pw))         score++
    if (/[0-9]/.test(pw))         score++
    if (/[^A-Za-z0-9]/.test(pw))  score++
    const map = [
      { label: '',       color: 'transparent' },
      { label: 'Weak',   color: '#ef4444' },
      { label: 'Fair',   color: '#f97316' },
      { label: 'Good',   color: '#eab308' },
      { label: 'Strong', color: '#8b5cf6' },
    ]
    return { score, ...map[score] }
  }

  const strength = pwStrength(password)

  // ── Rules ─────────────────────────────────────────────────────────────────
  const rules = [
    { label: 'At least 8 characters',  ok: password.length >= 8 },
    { label: 'One uppercase letter',    ok: /[A-Z]/.test(password) },
    { label: 'One number',             ok: /[0-9]/.test(password) },
    { label: 'Passwords match',        ok: !!confirmPw && password === confirmPw },
  ]

  // ── Submit ───────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8)           { setError('Password must be at least 8 characters.'); return }
    if (!/[A-Z]/.test(password))       { setError('Password must contain an uppercase letter.'); return }
    if (!/[0-9]/.test(password))       { setError('Password must contain a number.'); return }
    if (password !== confirmPw)        { setError('Passwords do not match.'); return }
    if (!token)                        { setError('Invalid or missing reset token.'); return }

    setError('')
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, password })
      setDone(true)
    } catch (e: any) {
      setError(e.message ?? 'Reset failed. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  // ── Invalid token guard ───────────────────────────────────────────────────
  if (!token) return (
    <PageShell>
      <div className="text-center py-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}
        >
          <AlertCircle size={26} style={{ color: '#f87171' }} />
        </div>
        <h2 className="text-xl font-semibold mb-2" style={{ color: 'hsl(40 6% 95%)' }}>Invalid Link</h2>
        <p className="text-sm mb-6" style={{ color: 'hsl(240 5% 60%)' }}>
          This password reset link is invalid or has expired. Please request a new one.
        </p>
        <Link
          to="/forgot-password"
          className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', color: '#fff', boxShadow: '0 4px 20px rgba(139,92,246,0.3)' }}
        >
          Request New Link
        </Link>
      </div>
    </PageShell>
  )

  // ── Success screen ────────────────────────────────────────────────────────
  if (done) return (
    <PageShell>
      <div className="text-center py-4">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div
            className="absolute inset-0 rounded-full"
            style={{ background: 'rgba(139,92,246,0.1)', animation: 'ringPulse 2s ease-in-out infinite' }}
          />
          <div
            className="absolute inset-2 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}
          >
            <CheckCircle size={28} style={{ color: '#a78bfa' }} />
          </div>
        </div>
        <h2 className="text-xl font-semibold mb-2" style={{ color: 'hsl(40 6% 95%)' }}>
          Password Updated!
        </h2>
        <p className="text-sm mb-6" style={{ color: 'hsl(240 5% 60%)' }}>
          Your password has been reset successfully. You can now sign in with your new password.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', color: '#fff', boxShadow: '0 4px 20px rgba(139,92,246,0.3)' }}
        >
          Sign In Now
        </button>
      </div>
    </PageShell>
  )

  // ── Main form ─────────────────────────────────────────────────────────────
  return (
    <PageShell>
      {/* Icon header */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)' }}
        >
          <ShieldCheck size={20} style={{ color: '#a78bfa' }} />
        </div>
        <div>
          <h1 className="text-lg font-semibold" style={{ color: 'hsl(40 6% 95%)' }}>Set new password</h1>
          <p className="text-xs" style={{ color: 'hsl(240 5% 55%)' }}>Choose a strong password for your account</p>
        </div>
      </div>

      {error && (
        <div
          className="flex items-center gap-2 mb-5 px-4 py-3 rounded-xl text-sm"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}
        >
          <AlertCircle size={14} className="flex-shrink-0" /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* New password */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'hsl(240 5% 65%)' }}>
            New Password
          </label>
          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'hsl(240 5% 50%)' }} />
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              autoFocus
              className="w-full pl-9 pr-10 py-3 rounded-xl text-sm outline-none placeholder:opacity-40 transition-all"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'hsl(40 6% 90%)',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(139,92,246,0.45)')}
              onBlur={e  => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
            <button
              type="button"
              onClick={() => setShowPw(b => !b)}
              className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-white transition-colors"
              style={{ color: 'hsl(240 5% 50%)' }}
            >
              {showPw ? <EyeOff size={14}/> : <Eye size={14}/>}
            </button>
          </div>

          {/* Strength bar */}
          {password && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 flex gap-1">
                {[1,2,3,4].map(n => (
                  <div
                    key={n}
                    className="flex-1 h-1 rounded-full transition-all"
                    style={{ background: n <= strength.score ? strength.color : 'rgba(255,255,255,0.08)' }}
                  />
                ))}
              </div>
              <span className="text-xs font-medium" style={{ color: strength.color }}>{strength.label}</span>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'hsl(240 5% 65%)' }}>
            Confirm Password
          </label>
          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'hsl(240 5% 50%)' }} />
            <input
              type={showCPw ? 'text' : 'password'}
              value={confirmPw}
              onChange={e => { setConfirmPw(e.target.value); setError('') }}
              placeholder="Repeat your new password"
              className="w-full pl-9 pr-10 py-3 rounded-xl text-sm outline-none placeholder:opacity-40 transition-all"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${confirmPw && confirmPw !== password ? 'rgba(239,68,68,0.4)' : confirmPw && confirmPw === password ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.1)'}`,
                color: 'hsl(40 6% 90%)',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(139,92,246,0.45)')}
              onBlur={e  => {
                if (confirmPw && confirmPw !== password) {
                  e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'
                } else if (confirmPw && confirmPw === password) {
                  e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)'
                } else {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                }
              }}
            />
            <button
              type="button"
              onClick={() => setShowCPw(b => !b)}
              className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-white transition-colors"
              style={{ color: 'hsl(240 5% 50%)' }}
            >
              {showCPw ? <EyeOff size={14}/> : <Eye size={14}/>}
            </button>
          </div>
        </div>

        {/* Requirements checklist */}
        <div
          className="rounded-xl p-4 space-y-2"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          {rules.map((r, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                style={{
                  background: r.ok ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${r.ok ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.1)'}`,
                }}
              >
                {r.ok && (
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1.5 4L3 5.5L6.5 2" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span className="text-xs transition-colors" style={{ color: r.ok ? '#c4b5fd' : 'hsl(240 5% 48%)' }}>
                {r.label}
              </span>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold mt-1 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', color: '#fff', boxShadow: '0 4px 20px rgba(139,92,246,0.3)' }}
        >
          {loading
            ? <><Loader2 size={15} className="animate-spin"/> Updating password…</>
            : 'Update Password'
          }
        </button>
      </form>

      <div className="mt-6 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Link
          to="/login"
          className="flex items-center justify-center gap-2 text-xs transition-colors hover:opacity-80"
          style={{ color: 'hsl(240 5% 50%)' }}
        >
          <ArrowLeft size={13} /> Back to Sign In
        </Link>
      </div>
    </PageShell>
  )
}

// ─── Shared shell ─────────────────────────────────────────────────────────────

function PageShell({ children }: { children: React.ReactNode }) {
  const { platformName } = usePlatformName()
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'hsl(260 87% 2%)', position: 'relative', overflow: 'hidden', fontFamily: "'Geist Sans','Inter',system-ui,sans-serif" }}
    >
      <PageBackground />
      {/* Glow blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle,#7c3aed,transparent 70%)', filter: 'blur(60px)' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[450px] h-[450px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle,#6d28d9,transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center mb-8" style={{ textDecoration: 'none' }}>
          <img
            src="/uploads/platform/logo.png"
            alt={platformName}
            style={{ height: 48, width: 'auto', maxWidth: 200, objectFit: 'contain' }}
          />
        </Link>

        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
            borderRadius: '1.5rem',
            padding: '2.5rem',
          }}
        >
          {children}
        </div>
      </div>

      <style>{`
        @keyframes ringPulse {
          0%, 100% { transform: scale(1);    opacity: 0.6; }
          50%       { transform: scale(1.12); opacity: 0.2; }
        }
      `}</style>
    </div>
  )
}
