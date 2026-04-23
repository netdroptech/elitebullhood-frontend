import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePlatformName } from '@/context/PlatformNameContext'
import {
  Mail, ArrowLeft, CheckCircle, Loader2, AlertCircle, KeyRound,
} from 'lucide-react'
import { api } from '../../lib/api'
import { PageBackground } from '@/components/ui/PageBackground'

type Stage = 'form' | 'loading' | 'sent'

export default function ForgotPasswordPage() {
  const { platformName } = usePlatformName()
  const [email,   setEmail]   = useState('')
  const [stage,   setStage]   = useState<Stage>('form')
  const [error,   setError]   = useState('')
  const [resent,  setResent]  = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Please enter a valid email address.')
      return
    }

    setError('')
    setStage('loading')

    try {
      await api.post('/auth/forgot-password', { email })
    } catch {
      // Silently succeed — never reveal whether an email exists
    }

    // Always show success regardless of whether account exists (security best practice)
    setStage('sent')
  }

  async function handleResend() {
    if (resent) return
    try {
      await api.post('/auth/forgot-password', { email })
    } catch {
      // silent
    }
    setResent(true)
    setTimeout(() => setResent(false), 30000)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'hsl(260 87% 2%)', position: 'relative', overflow: 'hidden', fontFamily: "'Geist Sans','Inter',system-ui,sans-serif" }}
    >
      <PageBackground />
      {/* Glow blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-[-15%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle,#7c3aed,transparent 70%)', filter: 'blur(60px)' }}
        />
        <div
          className="absolute bottom-[-20%] right-[-10%] w-[450px] h-[450px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle,#6d28d9,transparent 70%)', filter: 'blur(60px)' }}
        />
      </div>

      <div className="relative w-full max-w-sm">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 justify-center mb-8" style={{ textDecoration: 'none' }}>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" strokeWidth="2.5">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
            </svg>
          </div>
          <span className="text-xl font-semibold tracking-tight" style={{ color: 'hsl(40 6% 95%)' }}>{platformName}</span>
        </Link>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
          borderRadius: '1.5rem',
          padding: '2.5rem',
        }}>

          {/* ── FORM stage ── */}
          {stage !== 'sent' && (
            <>
              {/* Icon header */}
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)' }}
                >
                  <KeyRound size={20} style={{ color: '#a78bfa' }} />
                </div>
                <div>
                  <h1 className="text-lg font-semibold" style={{ color: 'hsl(40 6% 95%)' }}>
                    Forgot password?
                  </h1>
                  <p className="text-xs" style={{ color: 'hsl(240 5% 55%)' }}>
                    We'll send a reset link to your inbox
                  </p>
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
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'hsl(240 5% 65%)' }}>
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: 'hsl(240 5% 50%)' }}
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError('') }}
                      placeholder="you@example.com"
                      autoComplete="email"
                      autoFocus
                      className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none placeholder:opacity-40 transition-all"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'hsl(40 6% 90%)',
                      }}
                      onFocus={e => (e.currentTarget.style.borderColor = 'rgba(139,92,246,0.45)')}
                      onBlur={e  => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={stage === 'loading'}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                  style={{
                    background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)',
                    color: '#fff',
                    boxShadow: '0 4px 20px rgba(139,92,246,0.3)',
                  }}
                >
                  {stage === 'loading'
                    ? <><Loader2 size={15} className="animate-spin" /> Sending…</>
                    : 'Send Reset Link'
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
            </>
          )}

          {/* ── SENT stage ── */}
          {stage === 'sent' && (
            <div className="text-center py-4">
              {/* Animated success ring */}
              <div className="relative w-20 h-20 mx-auto mb-6">
                {/* Outer pulse ring */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{ background: 'rgba(139,92,246,0.1)', animation: 'ringPulse 2s ease-in-out infinite' }}
                />
                {/* Inner circle */}
                <div
                  className="absolute inset-2 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}
                >
                  <CheckCircle size={28} style={{ color: '#a78bfa' }} />
                </div>
              </div>

              <h2 className="text-xl font-semibold mb-2" style={{ color: 'hsl(40 6% 95%)' }}>
                Check your inbox
              </h2>
              <p className="text-sm leading-relaxed mb-1" style={{ color: 'hsl(240 5% 60%)' }}>
                We've sent a password reset link to
              </p>
              <p className="text-sm font-semibold mb-6" style={{ color: '#a78bfa' }}>
                {email}
              </p>

              {/* Info box */}
              <div
                className="rounded-xl px-4 py-3 mb-6 text-left"
                style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}
              >
                {[
                  'The link expires in 15 minutes',
                  'Check your spam folder if you don\'t see it',
                  'Only the latest link will be valid',
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-2.5 mb-2 last:mb-0">
                    <div
                      className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                      style={{ background: '#a78bfa' }}
                    />
                    <span className="text-xs" style={{ color: 'hsl(240 5% 58%)' }}>{tip}</span>
                  </div>
                ))}
              </div>

              {/* Resend */}
              <p className="text-xs mb-5" style={{ color: 'hsl(240 5% 50%)' }}>
                Didn't receive it?{' '}
                <button
                  onClick={handleResend}
                  disabled={resent}
                  className="font-semibold transition-colors disabled:opacity-40"
                  style={{ background: 'none', border: 'none', cursor: resent ? 'default' : 'pointer', color: '#a78bfa', padding: 0, fontSize: 'inherit' }}
                >
                  {resent ? 'Email sent ✓' : 'Resend email'}
                </button>
              </p>

              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-xs transition-colors hover:opacity-80"
                style={{ color: 'hsl(240 5% 50%)' }}
              >
                <ArrowLeft size={13} /> Back to Sign In
              </Link>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes ringPulse {
          0%, 100% { transform: scale(1);   opacity: 0.6; }
          50%       { transform: scale(1.12); opacity: 0.2; }
        }
      `}</style>
    </div>
  )
}
