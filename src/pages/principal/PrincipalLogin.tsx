import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound, Eye, EyeOff, AlertTriangle, ChevronRight, Crown } from 'lucide-react'

// ── Hardcoded principal credentials (frontend-only super access) ──────────────
const PRINCIPAL_USER = 'principal'
const PRINCIPAL_PASS = 'Principal@elitebullhood#2027'

export function PrincipalLogin() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [shake,    setShake]    = useState(false)
  const [particles, setParticles] = useState<{ x: number; y: number; size: number; speed: number; opacity: number }[]>([])

  useEffect(() => {
    // Redirect if already authenticated as principal
    if (localStorage.getItem('apex_principal_session') === '1') {
      navigate('/principal', { replace: true })
    }
    setParticles(Array.from({ length: 24 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 40 + 20,
      opacity: Math.random() * 0.2 + 0.04,
    })))
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username || !password) { setError('Please enter both username and password.'); return }
    setLoading(true)
    setError('')

    setTimeout(() => {
      if (username === PRINCIPAL_USER && password === PRINCIPAL_PASS) {
        localStorage.setItem('apex_principal_session', '1')
        navigate('/principal', { replace: true })
      } else {
        setShake(true)
        setTimeout(() => setShake(false), 500)
        setError('Invalid credentials. Access denied.')
        setLoading(false)
      }
    }, 900)
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

      {/* Particles */}
      {particles.map((p, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size,
          borderRadius: '50%',
          background: i % 3 === 0 ? '#7c3aed' : i % 3 === 1 ? '#6d28d9' : '#a78bfa',
          opacity: p.opacity,
          animation: `pFloatUp ${p.speed}s linear infinite`,
          animationDelay: `${-Math.random() * p.speed}s`,
          pointerEvents: 'none',
        }} />
      ))}

      {/* Gold glow blobs */}
      <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '55vw', height: '55vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '48vw', height: '48vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Grid */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

      {/* Card wrapper */}
      <div style={{
        width: '100%', maxWidth: 420, position: 'relative', zIndex: 10,
        animation: shake ? 'pShake 0.45s ease' : undefined,
      }}>

        {/* Crown badge */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 18px', borderRadius: 999, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', backdropFilter: 'blur(10px)' }}>
            <Crown size={12} style={{ color: '#a78bfa' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#c4b5fd', letterSpacing: '0.1em' }}>PRINCIPAL ACCESS</span>
          </div>
        </div>

        {/* Main card */}
        <div style={{
          background: 'rgba(12, 8, 26, 0.9)',
          border: '1px solid rgba(167,139,250,0.15)',
          borderRadius: 24,
          backdropFilter: 'blur(28px)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.03) inset, 0 1px 0 rgba(255,255,255,0.07) inset',
          overflow: 'hidden',
        }}>

          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.22), rgba(124,58,237,0.18))',
            padding: '26px 32px 22px',
            borderBottom: '1px solid rgba(167,139,250,0.1)',
            position: 'relative',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.5), transparent)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(124,58,237,0.4)',
                flexShrink: 0,
              }}>
                <Crown size={22} style={{ color: '#fff' }} />
              </div>
              <div>
                <p style={{ fontSize: 19, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>Principal Portal</p>
                <p style={{ fontSize: 12, color: 'rgba(196,181,253,0.7)', marginTop: 2 }}>Super-level platform control</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '26px 32px 30px' }}>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 10, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', marginBottom: 20 }}>
                <AlertTriangle size={14} style={{ color: '#f87171', flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: '#f87171', fontWeight: 500 }}>{error}</p>
              </div>
            )}

            {!loading ? (
              <form onSubmit={handleSubmit}>

                {/* Username */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'hsl(240 5% 50%)', letterSpacing: '0.07em', marginBottom: 7, textTransform: 'uppercase' }}>Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={e => { setUsername(e.target.value); setError('') }}
                    placeholder="principal"
                    autoComplete="username"
                    style={{
                      width: '100%', height: 46, padding: '0 14px',
                      borderRadius: 11, fontSize: 13,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'hsl(40 6% 92%)', outline: 'none', boxSizing: 'border-box',
                      transition: 'border-color 0.15s',
                    }}
                    onFocus={e => (e.target.style.borderColor = 'rgba(167,139,250,0.45)')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                  />
                </div>

                {/* Password */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'hsl(240 5% 50%)', letterSpacing: '0.07em', marginBottom: 7, textTransform: 'uppercase' }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <KeyRound size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'hsl(240 5% 42%)', pointerEvents: 'none' }} />
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError('') }}
                      placeholder="••••••••••••"
                      autoComplete="current-password"
                      style={{
                        width: '100%', height: 46, paddingLeft: 38, paddingRight: 44,
                        borderRadius: 11, fontSize: 13,
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: 'hsl(40 6% 92%)', outline: 'none', boxSizing: 'border-box',
                        transition: 'border-color 0.15s',
                      }}
                      onFocus={e => (e.target.style.borderColor = 'rgba(167,139,250,0.45)')}
                      onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                    />
                    <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 44%)', padding: 4, display: 'flex', alignItems: 'center' }}>
                      {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <button type="submit" style={{
                  width: '100%', height: 48, borderRadius: 12,
                  background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                  border: 'none', color: '#fff',
                  fontSize: 14, fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 8px 24px rgba(124,58,237,0.35)',
                  transition: 'all 0.2s',
                }}>
                  <span>Access Principal Panel</span>
                  <ChevronRight size={16} />
                </button>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0 8px' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 0 36px rgba(124,58,237,0.5)', animation: 'pSpinGlow 1s linear infinite' }}>
                  <Crown size={22} style={{ color: '#fff' }} />
                </div>
                <p style={{ fontSize: 15, fontWeight: 800, color: 'hsl(40 10% 94%)', marginBottom: 5 }}>Authenticating…</p>
                <p style={{ fontSize: 12, color: 'hsl(240 5% 50%)', marginBottom: 22 }}>Loading principal dashboard</p>
                <div style={{ height: 3, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'linear-gradient(90deg, #7c3aed, #a78bfa)', borderRadius: 999, animation: 'pProgressFill 1.1s ease forwards' }} />
                </div>
              </div>
            )}
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 18, fontSize: 10, color: 'hsl(240 5% 28%)' }}>
          All access attempts are logged and monitored.
        </p>
      </div>

      <style>{`
        @keyframes pFloatUp {
          0%   { transform: translateY(0) scale(1); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(-100vh) scale(0.5); opacity: 0; }
        }
        @keyframes pShake {
          0%, 100% { transform: translateX(0); }
          15%       { transform: translateX(-7px); }
          30%       { transform: translateX(7px); }
          45%       { transform: translateX(-5px); }
          60%       { transform: translateX(5px); }
          75%       { transform: translateX(-3px); }
          90%       { transform: translateX(3px); }
        }
        @keyframes pSpinGlow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes pProgressFill {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  )
}
