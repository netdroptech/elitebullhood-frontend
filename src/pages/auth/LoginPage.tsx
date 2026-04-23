import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLogo } from '@/context/LogoContext'
import { usePlatformName } from '@/context/PlatformNameContext'
import { PageBackground } from '@/components/ui/PageBackground'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const { logoUrl } = useLogo()
  const { platformName } = usePlatformName()
  const location  = useLocation()
  const from      = (location.state as any)?.from ?? '/dashboard'

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [attempts, setAttempts] = useState(0)
  const [shake,    setShake]    = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) { setError('Please fill in both fields.'); return }
    if (attempts >= 5) { setError('Too many failed attempts. Please wait a few minutes.'); return }

    setLoading(true)
    setError('')
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (e: any) {
      const count = attempts + 1
      setAttempts(count)
      setError(e.message ?? 'Invalid email or password.')
      setShake(true)
      setTimeout(() => setShake(false), 500)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'hsl(260 87% 2%)', position: 'relative', overflow: 'hidden' }}>
      <PageBackground />

      {/* Glow blobs — green */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle,#7c3aed,transparent 70%)', filter: 'blur(60px)' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle,#6d28d9,transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      <div className="relative w-full max-w-sm">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link to="/"><img src={logoUrl} alt={platformName} style={{ height: 56, objectFit: 'contain', cursor: 'pointer' }} /></Link>
        </div>

        {/* Card */}
        <div
          className={shake ? 'shake' : ''}
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
            borderRadius: '1.5rem',
            padding: '2.5rem',
          }}
        >
          <div className="flex items-center gap-3 mb-7">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)' }}>
              <ShieldCheck size={18} style={{ color: '#a78bfa' }} />
            </div>
            <div>
              <h1 className="text-lg font-semibold" style={{ color: 'hsl(40 6% 95%)' }}>Welcome back</h1>
              <p className="text-xs" style={{ color: 'hsl(240 5% 55%)' }}>Sign in to your {platformName} account</p>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 mb-5 px-4 py-3 rounded-xl text-sm"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}>
              <AlertCircle size={14} /> {error}
              {attempts > 0 && attempts < 5 && (
                <span className="ml-auto text-xs opacity-70">{5 - attempts} attempts left</span>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'hsl(240 5% 65%)' }}>
                Email Address
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'hsl(240 5% 50%)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none placeholder:opacity-40 transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'hsl(40 6% 90%)',
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium" style={{ color: 'hsl(240 5% 65%)' }}>Password</label>
                <Link to="/forgot-password" className="text-xs transition-colors hover:opacity-80"
                  style={{ color: '#a78bfa' }}>
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'hsl(240 5% 50%)' }} />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="Your password"
                  autoComplete="current-password"
                  className="w-full pl-9 pr-10 py-3 rounded-xl text-sm outline-none placeholder:opacity-40"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'hsl(40 6% 90%)',
                  }}
                />
                <button type="button" onClick={() => setShowPw(b => !b)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-white transition-colors"
                  style={{ color: 'hsl(240 5% 50%)' }}>
                  {showPw ? <EyeOff size={14}/> : <Eye size={14}/>}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || attempts >= 5}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold mt-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', color: '#fff', boxShadow: '0 4px 20px rgba(139,92,246,0.3)' }}>
              {loading
                ? <><Loader2 size={15} className="animate-spin"/> Signing in…</>
                : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-xs mt-6" style={{ color: 'hsl(240 5% 50%)' }}>
            Don't have an account?{' '}
            <Link to="/register" className="font-medium" style={{ color: '#a78bfa' }}>Create one</Link>
          </p>

        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%,60%  { transform: translateX(-6px); }
          40%,80%  { transform: translateX(6px); }
        }
        .shake { animation: shake 0.4s ease; }
      `}</style>
    </div>
  )
}
