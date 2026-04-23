import { useState, useEffect } from 'react'
import { usePlatformName } from '@/context/PlatformNameContext'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Mail, Lock, Eye, EyeOff, AlertTriangle, ChevronRight } from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'

export function AdminLogin() {
  return <AdminLoginInner />
}

// ── Login form ────────────────────────────────────────────────────────────────
function AdminLoginInner() {
  const navigate = useNavigate()
  const { platformName } = usePlatformName()

  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [showPw,    setShowPw]    = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [attempts,  setAttempts]  = useState(0)
  const [shake,     setShake]     = useState(false)
  const [particles, setParticles] = useState<{ x: number; y: number; size: number; speed: number; opacity: number }[]>([])

  useEffect(() => {
    setParticles(Array.from({ length: 28 }, () => ({
      x:       Math.random() * 100,
      y:       Math.random() * 100,
      size:    Math.random() * 2.5 + 0.5,
      speed:   Math.random() * 40 + 20,
      opacity: Math.random() * 0.25 + 0.05,
    })))
  }, [])

  function triggerShake() {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) { setError('Please enter both email and password.'); return }
    setError('')
    setLoading(true)
    try {
      const res  = await fetch(`${BASE}/auth/admin/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!data.success) {
        const next = attempts + 1
        setAttempts(next)
        setError(data.message ?? `Invalid credentials. ${Math.max(0, 3 - next)} attempt(s) remaining.`)
        triggerShake()
        setLoading(false)
        return
      }

      localStorage.setItem('apex_admin_token',   data.data.accessToken)
      localStorage.setItem('apex_admin_session',  '1')
      localStorage.setItem('apex_admin_email',    data.data.admin.email)
      localStorage.setItem('apex_admin_name',     data.data.admin.name ?? 'Admin')
      setTimeout(() => navigate('/admin'), 1000)
    } catch {
      setError('Could not reach server. Make sure the backend is running.')
      triggerShake()
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'hsl(260 87% 2%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Geist Sans', 'Inter', system-ui, sans-serif",
    }}>

      {/* Animated background particles */}
      {particles.map((p, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size,
          borderRadius: '50%',
          background: i % 3 === 0 ? '#7c3aed' : i % 3 === 1 ? '#6d28d9' : '#a78bfa',
          opacity: p.opacity,
          animation: `floatUp ${p.speed}s linear infinite`,
          animationDelay: `${-Math.random() * p.speed}s`,
          pointerEvents: 'none',
        }} />
      ))}

      {/* Glow blobs */}
      <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '45vw', height: '45vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Grid texture */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

      {/* Card wrapper */}
      <div style={{
        width: '100%', maxWidth: 440, position: 'relative', zIndex: 10,
        animation: shake ? 'shake 0.45s ease' : undefined,
      }}>

        {/* Top badge */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 18px', borderRadius: 999, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)', backdropFilter: 'blur(10px)' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa', animation: 'pulse 1.8s ease-in-out infinite' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#c4b5fd', letterSpacing: '0.08em' }}>{platformName.toUpperCase()} SECURE ACCESS</span>
          </div>
        </div>

        {/* Main card */}
        <div style={{
          background: 'rgba(15, 10, 30, 0.88)',
          border: '1px solid rgba(167,139,250,0.18)',
          borderRadius: 24,
          backdropFilter: 'blur(24px)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset, 0 1px 0 rgba(255,255,255,0.08) inset',
          overflow: 'hidden',
        }}>

          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(124,58,237,0.2))', padding: '28px 32px 24px', borderBottom: '1px solid rgba(167,139,250,0.12)', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.6), transparent)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(124,58,237,0.45)', flexShrink: 0 }}>
                <ShieldCheck size={24} style={{ color: '#fff' }} />
              </div>
              <div>
                <p style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>Admin Portal</p>
                <p style={{ fontSize: 12, color: 'rgba(196,181,253,0.75)', marginTop: 2 }}>Restricted access — authorized personnel only</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '28px 32px 32px' }}>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 10, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', marginBottom: 20, animation: 'fadeIn 0.2s ease' }}>
                <AlertTriangle size={14} style={{ color: '#f87171', flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: '#f87171', fontWeight: 500 }}>{error}</p>
              </div>
            )}

            {!loading ? (
              <form onSubmit={handleLogin}>
                {/* Email */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'hsl(240 5% 50%)', letterSpacing: '0.07em', marginBottom: 7, textTransform: 'uppercase' }}>Admin Email</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'hsl(240 5% 42%)', pointerEvents: 'none' }} />
                    <input
                      type="email" value={email}
                      onChange={e => { setEmail(e.target.value); setError('') }}
                      placeholder="admin@elitebullhood.com" autoComplete="email"
                      style={{ width: '100%', height: 46, paddingLeft: 38, paddingRight: 14, borderRadius: 11, fontSize: 13, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: 'hsl(40 6% 92%)', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                      onFocus={e => (e.target.style.borderColor = 'rgba(167,139,250,0.5)')}
                      onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,0.09)')}
                    />
                  </div>
                </div>

                {/* Password */}
                <div style={{ marginBottom: 22 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'hsl(240 5% 50%)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Password</label>
                    <button type="button" style={{ fontSize: 11, color: '#a78bfa', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Forgot?</button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Lock size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'hsl(240 5% 42%)', pointerEvents: 'none' }} />
                    <input
                      type={showPw ? 'text' : 'password'} value={password}
                      onChange={e => { setPassword(e.target.value); setError('') }}
                      placeholder="••••••••••••" autoComplete="current-password"
                      style={{ width: '100%', height: 46, paddingLeft: 38, paddingRight: 44, borderRadius: 11, fontSize: 13, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: 'hsl(40 6% 92%)', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                      onFocus={e => (e.target.style.borderColor = 'rgba(167,139,250,0.5)')}
                      onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,0.09)')}
                    />
                    <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 44%)', padding: 4, display: 'flex', alignItems: 'center' }}>
                      {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={attempts >= 3} style={{
                  width: '100%', height: 48, borderRadius: 12,
                  background: attempts >= 3 ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                  border: 'none',
                  color: attempts >= 3 ? 'hsl(240 5% 38%)' : '#fff',
                  fontSize: 14, fontWeight: 700,
                  cursor: attempts >= 3 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: attempts >= 3 ? 'none' : '0 8px 24px rgba(124,58,237,0.4)',
                  transition: 'all 0.2s',
                }}>
                  {attempts >= 3 ? 'Account Locked' : <><span>Sign In to Admin</span><ChevronRight size={16} /></>}
                </button>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0 8px' }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 0 40px rgba(124,58,237,0.5)', animation: 'spinGlow 1s linear infinite' }}>
                  <ShieldCheck size={26} style={{ color: '#fff' }} />
                </div>
                <p style={{ fontSize: 15, fontWeight: 800, color: 'hsl(40 10% 94%)', marginBottom: 5 }}>Signing in…</p>
                <p style={{ fontSize: 12, color: 'hsl(240 5% 50%)', marginBottom: 22 }}>Loading admin panel</p>
                <div style={{ height: 3, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'linear-gradient(90deg, #7c3aed, #a78bfa)', borderRadius: 999, animation: 'progressFill 1.3s ease forwards' }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <p style={{ fontSize: 11, color: 'hsl(240 5% 35%)' }}>
            Not an admin?{' '}
            <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', fontSize: 11, fontWeight: 600, padding: 0 }}>
              Go to dashboard
            </button>
          </p>
          <p style={{ fontSize: 10, color: 'hsl(240 5% 27%)', marginTop: 6 }}>
            All access attempts are logged and monitored.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes floatUp {
          0%   { transform: translateY(0) scale(1); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(-100vh) scale(0.5); opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px #a78bfa; }
          50%       { opacity: 0.3; box-shadow: none; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15%       { transform: translateX(-7px); }
          30%       { transform: translateX(7px); }
          45%       { transform: translateX(-5px); }
          60%       { transform: translateX(5px); }
          75%       { transform: translateX(-3px); }
          90%       { transform: translateX(3px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spinGlow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes progressFill {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  )
}
