import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

export function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    accepted: false,
  })
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // placeholder — wire to your auth provider
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">

      {/* Background glow blobs */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div style={{
          position: 'absolute', top: '-15%', left: '50%', transform: 'translateX(-50%)',
          width: '700px', height: '400px',
          background: 'radial-gradient(ellipse, hsl(262 95% 76% / 0.12) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '5%', right: '10%',
          width: '400px', height: '300px',
          background: 'radial-gradient(ellipse, hsl(200 90% 60% / 0.06) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }} />
      </div>

      {/* Home button */}
      <button
        onClick={() => navigate('/')}
        title="Return home"
        style={{
          position: 'fixed', top: '1.25rem', left: '1.25rem', zIndex: 50,
          width: 40, height: 40, borderRadius: '0.75rem',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'hsl(40 6% 80%)',
          transition: 'background 0.18s ease, border-color 0.18s ease, color 0.18s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'hsl(40 6% 95%)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'hsl(40 6% 80%)' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"/>
          <path d="M9 21V12h6v9"/>
        </svg>
      </button>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md">
        <div
          style={{
            background: 'rgba(255,255,255,0.035)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            borderRadius: '1.75rem',
            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.12), 0 32px 80px rgba(0,0,0,0.55)',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '2.5rem 2.25rem 2rem',
          }}
        >
          {/* Logo mark */}
          <div className="flex justify-center mb-6">
            <div
              style={{
                width: 44, height: 44, borderRadius: '0.75rem',
                background: 'linear-gradient(160deg, hsl(240 4% 22%) 0%, hsl(240 4% 12%) 100%)',
                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {/* crosshair SVG */}
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="4" stroke="hsl(262 95% 76%)" strokeWidth="1.5"/>
                <line x1="11" y1="1" x2="11" y2="6" stroke="hsl(262 95% 76%)" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="11" y1="16" x2="11" y2="21" stroke="hsl(262 95% 76%)" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="1" y1="11" x2="6" y2="11" stroke="hsl(262 95% 76%)" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="16" y1="11" x2="21" y2="11" stroke="hsl(262 95% 76%)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-7">
            <h1 className="text-foreground text-2xl font-semibold tracking-tight mb-1.5">
              Create your account
            </h1>
            <p className="text-muted-foreground text-sm">
              Join Elitebullhood and start trading smarter.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* First + Last name row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted-foreground font-medium">First name</label>
                <input
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  placeholder="Edwin"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                  onFocus={e => Object.assign(e.currentTarget.style, inputFocusStyle)}
                  onBlur={e => Object.assign(e.currentTarget.style, inputStyle)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted-foreground font-medium">Last name</label>
                <input
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  placeholder="Doe"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                  onFocus={e => Object.assign(e.currentTarget.style, inputFocusStyle)}
                  onBlur={e => Object.assign(e.currentTarget.style, inputStyle)}
                />
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground font-medium">Email address</label>
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
                style={inputStyle}
                onFocus={e => Object.assign(e.currentTarget.style, inputFocusStyle)}
                onBlur={e => Object.assign(e.currentTarget.style, inputStyle)}
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground font-medium">Password</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  style={{ ...inputStyle, paddingRight: '2.75rem' }}
                  onFocus={e => Object.assign(e.currentTarget.style, { ...inputFocusStyle, paddingRight: '2.75rem' })}
                  onBlur={e => Object.assign(e.currentTarget.style, { ...inputStyle, paddingRight: '2.75rem' })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{
                    position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'hsl(240 5% 50%)', padding: 0, lineHeight: 1,
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Terms checkbox */}
            <label className="flex items-start gap-3 cursor-pointer group mt-1">
              <div className="relative mt-0.5 flex-shrink-0">
                <input
                  name="accepted"
                  type="checkbox"
                  checked={form.accepted}
                  onChange={handleChange}
                  required
                  className="sr-only"
                />
                <div
                  style={{
                    width: 18, height: 18, borderRadius: 5,
                    background: form.accepted
                      ? 'linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)'
                      : 'rgba(255,255,255,0.05)',
                    border: form.accepted ? 'none' : '1.5px solid rgba(255,255,255,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.18s ease',
                    boxShadow: form.accepted ? '0 0 10px rgba(167,139,250,0.3)' : 'none',
                  }}
                >
                  {form.accepted && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l2.5 2.5L9 1" stroke="hsl(0 0% 5%)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm text-muted-foreground leading-snug">
                I accept the{' '}
                <Link to="/terms" className="text-primary-gradient font-medium hover:opacity-80 transition-opacity">
                  Terms &amp; Conditions
                </Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-primary-gradient font-medium hover:opacity-80 transition-opacity">
                  Privacy Policy
                </Link>
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              style={{
                marginTop: '0.25rem',
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.875rem',
                background: 'linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)',
                color: 'hsl(0 0% 5%)',
                fontWeight: 600,
                fontSize: '0.9375rem',
                border: 'none',
                cursor: 'pointer',
                letterSpacing: '0.01em',
                transition: 'opacity 0.18s ease, transform 0.18s ease',
                boxShadow: '0 4px 24px rgba(167,139,250,0.22)',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              Sign Up
            </button>

          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.5rem 0 1.25rem' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ fontSize: '0.75rem', color: 'hsl(240 5% 50%)', letterSpacing: '0.05em' }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          </div>

          {/* Social buttons */}
          <div className="flex flex-col gap-3">
            <SocialButton icon={<GoogleIcon />} label="Continue with Google" />
            <SocialButton icon={<XIcon />} label="Continue with X" />
          </div>

          {/* Login link */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-gradient font-medium hover:opacity-80 transition-opacity">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

/* ── shared input styles ── */
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.65rem 0.875rem',
  borderRadius: '0.75rem',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.09)',
  color: 'hsl(40 6% 95%)',
  fontSize: '0.875rem',
  outline: 'none',
  transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
}

const inputFocusStyle: React.CSSProperties = {
  ...inputStyle,
  borderColor: 'rgba(167,139,250,0.45)',
  boxShadow: '0 0 0 3px rgba(167,139,250,0.08)',
}

/* ── Social button ── */
function SocialButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', padding: '0.65rem 1rem',
        borderRadius: '0.875rem',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.09)',
        color: 'hsl(40 6% 90%)',
        fontSize: '0.875rem', fontWeight: 400,
        cursor: 'pointer',
        transition: 'background 0.18s ease, border-color 0.18s ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.16)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)' }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
        {icon}
        {label}
      </span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
        <path d="M5 12h14M12 5l7 7-7 7"/>
      </svg>
    </button>
  )
}

function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>
    </svg>
  )
}
