import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  User, Mail, Lock, Phone, Globe, Calendar,
  Eye, EyeOff, ChevronRight, ChevronLeft,
  Check, AlertCircle, Loader2,
} from 'lucide-react'
import { api } from '../../lib/api'
import { useLogo } from '@/context/LogoContext'
import { usePlatformName } from '@/context/PlatformNameContext'
import { PageBackground } from '@/components/ui/PageBackground'

// ─── Steps ───────────────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Account',  desc: 'Email & Password' },
  { label: 'Profile',  desc: 'Personal Details' },
  { label: 'Confirm',  desc: 'Review & Submit'  },
]

const COUNTRIES = [
  'United States','United Kingdom','Canada','Australia','Germany','France',
  'Netherlands','Switzerland','Japan','Singapore','United Arab Emirates',
  'South Africa','Nigeria','Kenya','Ghana','India','Brazil','Mexico',
  'Argentina','Spain','Italy','Portugal','Sweden','Norway','Denmark','Other',
]

// ─── Component ───────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const navigate = useNavigate()
  const { logoUrl } = useLogo()
  const { platformName } = usePlatformName()
  const [step,    setStep]    = useState(0)
  const [loading, setLoading] = useState(false)
  const [done,    setDone]    = useState(false)
  const [verificationRequired, setVerificationRequired] = useState(true)
  const [error,   setError]   = useState('')
  const [showPw,  setShowPw]  = useState(false)
  const [showCPw, setShowCPw] = useState(false)

  const [form, setForm] = useState({
    firstName:    '',
    lastName:     '',
    email:        '',
    password:     '',
    confirmPw:    '',
    phone:        '',
    country:      '',
    dateOfBirth:  '',
    referralCode: '',
    agree:        false,
  })

  function set(field: string, value: string | boolean) {
    setForm(f => ({ ...f, [field]: value }))
    setError('')
  }

  // ── Validation per step ──────────────────────────────────────────────────
  function validateStep(): string {
    if (step === 0) {
      if (!form.firstName.trim()) return 'First name is required.'
      if (!form.lastName.trim())  return 'Last name is required.'
      if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return 'Enter a valid email address.'
      if (form.password.length < 8)  return 'Password must be at least 8 characters.'
      if (!/[A-Z]/.test(form.password)) return 'Password must contain an uppercase letter.'
      if (!/[0-9]/.test(form.password)) return 'Password must contain a number.'
      if (form.password !== form.confirmPw) return 'Passwords do not match.'
    }
    if (step === 2) {
      if (!form.agree) return 'You must accept the terms to continue.'
    }
    return ''
  }

  function next() {
    const err = validateStep()
    if (err) { setError(err); return }
    setError('')
    setStep(s => s + 1)
  }

  function back() { setStep(s => s - 1); setError('') }

  // ── Password strength ─────────────────────────────────────────────────────
  function pwStrength(pw: string): { score: number; label: string; color: string } {
    let score = 0
    if (pw.length >= 8)            score++
    if (/[A-Z]/.test(pw))          score++
    if (/[0-9]/.test(pw))          score++
    if (/[^A-Za-z0-9]/.test(pw))   score++
    const map = [
      { label: '',       color: 'transparent' },
      { label: 'Weak',   color: '#ef4444' },
      { label: 'Fair',   color: '#f97316' },
      { label: 'Good',   color: '#eab308' },
      { label: 'Strong', color: '#8b5cf6' },
    ]
    return { score, ...map[score] }
  }

  const strength = pwStrength(form.password)

  // ── Submit ───────────────────────────────────────────────────────────────
  async function handleSubmit() {
    const err = validateStep()
    if (err) { setError(err); return }

    setLoading(true)
    setError('')
    try {
      const res: any = await api.post('/auth/register', {
        firstName:    form.firstName,
        lastName:     form.lastName,
        email:        form.email,
        password:     form.password,
        phone:        form.phone        || undefined,
        country:      form.country      || undefined,
        dateOfBirth:  form.dateOfBirth  || undefined,
        referralCode: form.referralCode || undefined,
      })
      // Backend returns { data: { verificationRequired: boolean } }
      // When admin turned verification OFF, user can log in immediately.
      const required = res?.data?.verificationRequired !== false
      setVerificationRequired(required)
      setDone(true)
    } catch (e: any) {
      setError(e.message ?? 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Success screen ───────────────────────────────────────────────────────
  if (done) return (
    <AuthShell>
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}>
          <Check size={28} style={{ color: '#a78bfa' }} />
        </div>
        <h2 className="text-2xl font-semibold mb-2" style={{ color: 'hsl(40 6% 95%)' }}>Account Created!</h2>
        <p className="text-sm mb-6" style={{ color: 'hsl(240 5% 65%)' }}>
          {verificationRequired ? (
            <>
              We've sent a verification link to <strong style={{ color: 'hsl(40 6% 90%)' }}>{form.email}</strong>.
              Please check your inbox and verify before logging in.
            </>
          ) : (
            <>
              Your account <strong style={{ color: 'hsl(40 6% 90%)' }}>{form.email}</strong> is ready.
              You can log in right away.
            </>
          )}
        </p>
        <button onClick={() => navigate('/login')}
          className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', color: '#fff', boxShadow: '0 4px 20px rgba(139,92,246,0.3)' }}>
          {verificationRequired ? 'Go to Login' : 'Log In Now'}
        </button>
      </div>
    </AuthShell>
  )

  return (
    <AuthShell>

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-8">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={
                  i < step
                    ? { background: 'rgba(139,92,246,0.2)',  border: '1.5px solid #a78bfa', color: '#a78bfa' }
                    : i === step
                    ? { background: 'rgba(139,92,246,0.15)', border: '1.5px solid #8b5cf6', color: '#c4b5fd' }
                    : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(240 5% 45%)' }
                }>
                {i < step ? <Check size={13} /> : i + 1}
              </div>
              <span className="text-[10px] mt-1 font-medium"
                style={{ color: i === step ? '#c4b5fd' : 'hsl(240 5% 45%)' }}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-px mx-2 mt-[-12px]"
                style={{ background: i < step ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.08)' }} />
            )}
          </div>
        ))}
      </div>

      <h2 className="text-xl font-semibold mb-1" style={{ color: 'hsl(40 6% 95%)' }}>{STEPS[step].label}</h2>
      <p className="text-sm mb-6" style={{ color: 'hsl(240 5% 60%)' }}>{STEPS[step].desc}</p>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 mb-5 px-4 py-3 rounded-xl text-sm"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* ── STEP 0: Account ── */}
      {step === 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field icon={<User size={15}/>} label="First Name" value={form.firstName} onChange={v => set('firstName', v)} placeholder="John" />
            <Field icon={<User size={15}/>} label="Last Name"  value={form.lastName}  onChange={v => set('lastName',  v)} placeholder="Doe" />
          </div>
          <Field icon={<Mail size={15}/>} label="Email Address" value={form.email} onChange={v => set('email', v)} placeholder="you@example.com" type="email" />
          <div>
            <Field
              icon={<Lock size={15}/>}
              label="Password"
              value={form.password}
              onChange={v => set('password', v)}
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              type={showPw ? 'text' : 'password'}
              suffix={
                <button type="button" onClick={() => setShowPw(b => !b)} className="hover:text-white transition-colors">
                  {showPw ? <EyeOff size={14}/> : <Eye size={14}/>}
                </button>
              }
            />
            {form.password && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 flex gap-1">
                  {[1,2,3,4].map(n => (
                    <div key={n} className="flex-1 h-1 rounded-full transition-all"
                      style={{ background: n <= strength.score ? strength.color : 'rgba(255,255,255,0.08)' }} />
                  ))}
                </div>
                <span className="text-xs font-medium" style={{ color: strength.color }}>{strength.label}</span>
              </div>
            )}
          </div>
          <Field
            icon={<Lock size={15}/>}
            label="Confirm Password"
            value={form.confirmPw}
            onChange={v => set('confirmPw', v)}
            placeholder="Repeat password"
            type={showCPw ? 'text' : 'password'}
            suffix={
              <button type="button" onClick={() => setShowCPw(b => !b)} className="hover:text-white transition-colors">
                {showCPw ? <EyeOff size={14}/> : <Eye size={14}/>}
              </button>
            }
          />
        </div>
      )}

      {/* ── STEP 1: Profile ── */}
      {step === 1 && (
        <div className="space-y-4">
          <Field icon={<Phone size={15}/>} label="Phone Number" value={form.phone} onChange={v => set('phone', v)} placeholder="+1 234 567 890" type="tel" optional />
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'hsl(240 5% 65%)' }}>
              Country <span style={{ color: 'hsl(240 5% 45%)' }}>(optional)</span>
            </label>
            <div className="relative">
              <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'hsl(240 5% 50%)' }} />
              <select
                value={form.country}
                onChange={e => set('country', e.target.value)}
                className="w-full pl-9 pr-4 py-3 rounded-xl text-sm appearance-none outline-none"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: form.country ? 'hsl(40 6% 90%)' : 'hsl(240 5% 50%)',
                }}>
                <option value="">Select country…</option>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <Field icon={<Calendar size={15}/>} label="Date of Birth" value={form.dateOfBirth} onChange={v => set('dateOfBirth', v)} type="date" optional />
          <Field icon={<User size={15}/>} label="Referral Code" value={form.referralCode} onChange={v => set('referralCode', v)} placeholder="Optional referral code" optional />
        </div>
      )}

      {/* ── STEP 2: Confirm ── */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="rounded-2xl p-5 space-y-3"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <SummaryRow label="Name"    value={`${form.firstName} ${form.lastName}`} />
            <SummaryRow label="Email"   value={form.email} />
            {form.phone      && <SummaryRow label="Phone"   value={form.phone} />}
            {form.country    && <SummaryRow label="Country" value={form.country} />}
            {form.dateOfBirth && <SummaryRow label="D.O.B." value={form.dateOfBirth} />}
          </div>

          {/* Terms checkbox */}
          <label className="flex items-start gap-3 cursor-pointer">
            <div
              onClick={() => set('agree', !form.agree)}
              className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 transition-all cursor-pointer"
              style={form.agree
                ? { background: 'rgba(139,92,246,0.2)', border: '1.5px solid #8b5cf6' }
                : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.15)' }}>
              {form.agree && <Check size={11} style={{ color: '#a78bfa' }} />}
            </div>
            <span className="text-xs leading-relaxed" style={{ color: 'hsl(240 5% 60%)' }}>
              I agree to the{' '}
              <Link to="/terms" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: '#a78bfa' }}>Terms of Service</Link>
              {' '}and{' '}
              <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: '#a78bfa' }}>Privacy Policy</Link>.
              I confirm I am 18 years or older.
            </span>
          </label>
        </div>
      )}

      {/* Navigation */}
      <div className={`flex gap-3 mt-8 ${step === 0 ? 'justify-end' : 'justify-between'}`}>
        {step > 0 && (
          <button onClick={back}
            className="flex items-center gap-1.5 px-5 py-3 rounded-xl text-sm transition-colors hover:bg-white/5"
            style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(240 5% 65%)' }}>
            <ChevronLeft size={15} /> Back
          </button>
        )}
        {step < 2 ? (
          <button onClick={next}
            className="flex items-center gap-1.5 px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', color: '#fff', boxShadow: '0 4px 16px rgba(139,92,246,0.25)' }}>
            Continue <ChevronRight size={15} />
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={loading}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', color: '#fff', boxShadow: '0 4px 16px rgba(139,92,246,0.25)' }}>
            {loading
              ? <><Loader2 size={15} className="animate-spin"/> Creating account…</>
              : <><Check size={15}/> Create Account</>}
          </button>
        )}
      </div>

      <p className="text-center text-xs mt-6" style={{ color: 'hsl(240 5% 50%)' }}>
        Already have an account?{' '}
        <Link to="/login" className="font-medium" style={{ color: '#a78bfa' }}>Sign in</Link>
      </p>
    </AuthShell>
  )
}

// ─── AuthShell ────────────────────────────────────────────────────────────────

function AuthShell({ children }: { children: React.ReactNode }) {
  const { logoUrl } = useLogo()
  const { platformName } = usePlatformName()
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'hsl(260 87% 2%)', position: 'relative', overflow: 'hidden' }}>
      <PageBackground />

      {/* Glow blobs — green */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle,#7c3aed,transparent 70%)', filter: 'blur(60px)' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle,#6d28d9,transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      <div className="relative w-full max-w-md">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link to="/"><img src={logoUrl} alt={platformName} style={{ height: 56, objectFit: 'contain', cursor: 'pointer' }} /></Link>
        </div>

        <div className="rounded-3xl p-8"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
          }}>
          {children}
        </div>
      </div>
    </div>
  )
}

// ─── Field ────────────────────────────────────────────────────────────────────

interface FieldProps {
  icon: React.ReactNode
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  optional?: boolean
  suffix?: React.ReactNode
}

function Field({ icon, label, value, onChange, placeholder, type = 'text', optional, suffix }: FieldProps) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'hsl(240 5% 65%)' }}>
        {label} {optional && <span style={{ color: 'hsl(240 5% 45%)' }}>(optional)</span>}
      </label>
      <div className="relative flex items-center">
        <span className="absolute left-3 flex-shrink-0" style={{ color: 'hsl(240 5% 50%)' }}>{icon}</span>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-10 py-3 rounded-xl text-sm outline-none placeholder:opacity-40"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'hsl(40 6% 90%)',
          }}
        />
        {suffix && <span className="absolute right-3" style={{ color: 'hsl(240 5% 50%)' }}>{suffix}</span>}
      </div>
    </div>
  )
}

// ─── SummaryRow ───────────────────────────────────────────────────────────────

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span style={{ color: 'hsl(240 5% 55%)' }}>{label}</span>
      <span style={{ color: 'hsl(40 6% 88%)' }}>{value}</span>
    </div>
  )
}
