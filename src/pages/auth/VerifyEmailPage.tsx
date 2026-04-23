import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { usePlatformName } from '@/context/PlatformNameContext'
import { CheckCircle, Loader2, AlertCircle, Mail } from 'lucide-react'
import { api } from '../../lib/api'
import { PageBackground } from '@/components/ui/PageBackground'

export default function VerifyEmailPage() {
  const { platformName } = usePlatformName()
  const [params]         = useSearchParams()
  const token            = params.get('token') ?? ''

  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing verification token.')
      setLoading(false)
      return
    }

    api.get(`/auth/verify-email?token=${token}`)
      .then(() => { setSuccess(true) })
      .catch((e: any) => { setError(e.message ?? 'Verification failed. The link may have expired.') })
      .finally(() => setLoading(false))
  }, [token])

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
        <Link to="/" className="flex items-center gap-2 justify-center mb-8" style={{ textDecoration: 'none' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' }}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" strokeWidth="2.5">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
            </svg>
          </div>
          <span className="text-xl font-semibold tracking-tight" style={{ color: 'hsl(40 6% 95%)' }}>{platformName}</span>
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
          {/* Loading state */}
          {loading && (
            <div className="text-center py-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)' }}
              >
                <Loader2 size={26} className="animate-spin" style={{ color: '#a78bfa' }} />
              </div>
              <h2 className="text-xl font-semibold mb-2" style={{ color: 'hsl(40 6% 95%)' }}>Verifying your email</h2>
              <p className="text-sm" style={{ color: 'hsl(240 5% 60%)' }}>
                Please wait while we verify your email address...
              </p>
            </div>
          )}

          {/* Success state */}
          {!loading && success && (
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
                Email Verified!
              </h2>
              <p className="text-sm mb-6" style={{ color: 'hsl(240 5% 60%)' }}>
                Your email has been verified successfully. You can now sign in to your account.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', color: '#fff', boxShadow: '0 4px 20px rgba(139,92,246,0.3)' }}
              >
                Sign In Now
              </Link>
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="text-center py-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}
              >
                <AlertCircle size={26} style={{ color: '#f87171' }} />
              </div>
              <h2 className="text-xl font-semibold mb-2" style={{ color: 'hsl(40 6% 95%)' }}>Verification Failed</h2>
              <p className="text-sm mb-6" style={{ color: 'hsl(240 5% 60%)' }}>
                {error}
              </p>
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', color: '#fff', boxShadow: '0 4px 20px rgba(139,92,246,0.3)' }}
              >
                Register Again
              </Link>
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 mt-4 text-xs transition-colors hover:opacity-80"
                style={{ color: 'hsl(240 5% 50%)' }}
              >
                <Mail size={13} /> Already verified? Sign In
              </Link>
            </div>
          )}
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
