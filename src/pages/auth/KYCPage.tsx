import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShieldCheck, Upload, X, Check, AlertCircle, Loader2,
  FileText, Camera, CreditCard, Clock, XCircle,
} from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { useLogo } from '../../context/LogoContext'
import { usePlatformName } from '../../context/PlatformNameContext'

// ─── Types ────────────────────────────────────────────────────────────────────

type DocType = 'PASSPORT' | 'NATIONAL_ID' | 'DRIVERS_LICENSE'

const DOC_TYPES: { value: DocType; label: string; needsBack: boolean }[] = [
  { value: 'PASSPORT',         label: 'Passport',         needsBack: false },
  { value: 'NATIONAL_ID',      label: 'National ID Card', needsBack: true  },
  { value: 'DRIVERS_LICENSE',  label: "Driver's License", needsBack: true  },
]


// ─── Pending / Rejected screens ───────────────────────────────────────────────

export function KYCPendingPage() {
  const { user, logout, refreshUser } = useAuth()
  const navigate = useNavigate()
  const { logoUrl } = useLogo()
  const { platformName } = usePlatformName()

  // ── Real-time approval detection ───────────────────────────────────────────
  // Poll the user record every 10s while the customer is parked on this page.
  // The moment the admin approves the KYC, `user.kycStatus` flips to APPROVED
  // and the KYCRoute guard auto-redirects to /dashboard. We also flash a
  // brief on-screen notice so the transition is obvious.
  const [justVerified, setJustVerified] = useState(false)
  useEffect(() => {
    let cancelled = false
    const tick = async () => {
      try { await refreshUser() } catch { /* network blip — try again next tick */ }
    }
    const id = window.setInterval(() => { if (!cancelled) tick() }, 10_000)
    return () => { cancelled = true; window.clearInterval(id) }
  }, [refreshUser])

  // When the user object reports APPROVED, show the success splash for ~1.5s
  // before the route guard pushes them to the dashboard.
  useEffect(() => {
    if (user?.kycStatus === 'APPROVED') {
      setJustVerified(true)
      const t = window.setTimeout(() => navigate('/dashboard', { replace: true }), 1500)
      return () => window.clearTimeout(t)
    }
  }, [user?.kycStatus, navigate])

  if (justVerified) {
    return (
      <div style={{ minHeight: '100vh', background: 'hsl(260 87% 3%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Geist Sans','Inter',system-ui,sans-serif", textAlign: 'center' }}>
        <div style={{ maxWidth: 420 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(167,139,250,0.15)', border: '2px solid rgba(167,139,250,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 22px' }}>
            <Check size={40} style={{ color: '#a78bfa' }} strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'hsl(40 6% 96%)', margin: '0 0 10px' }}>You're verified!</h1>
          <p style={{ fontSize: 14, color: 'hsl(240 5% 60%)' }}>Welcome aboard{user?.firstName ? `, ${user.firstName}` : ''} — taking you to your dashboard…</p>
        </div>
      </div>
    )
  }

  const steps = [
    { label: 'Account Created',     sub: 'Registration complete',           done: true,  active: false },
    { label: 'Documents Submitted', sub: 'KYC documents uploaded',          done: true,  active: false },
    { label: 'Admin Review',        sub: 'Under manual review',             done: false, active: true  },
    { label: 'Full Access Granted', sub: 'Trading & investment unlocked',   done: false, active: false },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'hsl(260 87% 3%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(0px, 3vw, 24px) clamp(0px, 4vw, 16px)', fontFamily: "'Geist Sans','Inter',system-ui,sans-serif", position: 'relative', overflow: 'hidden' }}>

      {/* Background glows */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 65%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '-15%', right: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.05) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.012) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      {/* Card — col-6 on desktop, full-width on mobile */}
      <div className="kyc-pending-card" style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: 680,
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 28,
        backdropFilter: 'blur(24px)',
        overflow: 'hidden',
      }}>

        {/* Amber top accent bar */}
        <div style={{ height: 3, background: 'linear-gradient(90deg, transparent, #f59e0b 30%, #fbbf24 70%, transparent)' }} />

        {/* Top section */}
        <div style={{ padding: 'clamp(28px,5vw,44px) clamp(20px,6vw,48px) 36px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {/* Platform logo */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 32 }}>
            <img src={logoUrl} alt={platformName} style={{ height: 32, objectFit: 'contain', maxWidth: 140 }} />
          </div>

          {/* Animated pulse icon */}
          <div style={{ position: 'relative', width: 72, height: 72, margin: '0 auto 24px' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', animation: 'kycPulse 2.5s ease-in-out infinite' }} />
            <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '50%', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={30} style={{ color: '#fbbf24' }} />
            </div>
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'hsl(40 6% 96%)', margin: '0 0 10px', letterSpacing: '-0.02em' }}>
            Verification Pending
          </h1>
          <p style={{ fontSize: 14, color: 'hsl(240 5% 62%)', margin: '0 0 6px', lineHeight: 1.6 }}>
            Hi <strong style={{ color: 'hsl(40 10% 90%)', fontWeight: 600 }}>{user?.firstName}</strong>, your documents are currently under review.
          </p>
          <p style={{ fontSize: 13, color: 'hsl(240 5% 50%)', margin: 0, lineHeight: 1.6 }}>
            Our team typically completes verification within{' '}
            <strong style={{ color: '#fbbf24', fontWeight: 600 }}>24–48 hours</strong>.
            {' '}You'll receive an email once approved.
          </p>
        </div>

        {/* Steps timeline */}
        <div style={{ padding: 'clamp(24px,4vw,32px) clamp(20px,6vw,48px) clamp(28px,4vw,40px)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'hsl(240 5% 42%)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 20 }}>Verification Progress</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {steps.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'stretch' }}>
                {/* Left: dot + line */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 32 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: s.done ? 'rgba(167,139,250,0.15)' : s.active ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${s.done ? 'rgba(167,139,250,0.35)' : s.active ? 'rgba(245,158,11,0.35)' : 'rgba(255,255,255,0.08)'}`,
                    color: s.done ? '#a78bfa' : s.active ? '#fbbf24' : 'hsl(240 5% 40%)',
                    boxShadow: s.active ? '0 0 12px rgba(245,158,11,0.25)' : 'none',
                    transition: 'all 0.3s',
                  }}>
                    {s.done
                      ? <Check size={14} strokeWidth={2.5} />
                      : s.active
                      ? <Clock size={13} />
                      : <ShieldCheck size={13} />}
                  </div>
                  {i < steps.length - 1 && (
                    <div style={{ width: 1, flex: 1, margin: '4px 0', background: s.done ? 'rgba(167,139,250,0.25)' : 'rgba(255,255,255,0.06)' }} />
                  )}
                </div>

                {/* Right: content */}
                <div style={{ paddingBottom: i < steps.length - 1 ? 20 : 0, paddingTop: 4, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: s.done ? 'hsl(40 6% 90%)' : s.active ? 'hsl(40 10% 88%)' : 'hsl(240 5% 45%)' }}>
                      {s.label}
                    </span>
                    {s.active && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.22)', letterSpacing: '0.04em' }}>
                        IN PROGRESS
                      </span>
                    )}
                    {s.done && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(167,139,250,0.1)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.2)', letterSpacing: '0.04em' }}>
                        DONE
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: 'hsl(240 5% 48%)', margin: 0 }}>{s.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Sign out */}
          <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={() => { logout(); navigate('/login') }}
              style={{ fontSize: 12, color: 'hsl(240 5% 42%)', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s', padding: '4px 8px' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'hsl(240 5% 62%)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'hsl(240 5% 42%)')}
            >
              Sign out of this account
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes kycPulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.18); opacity: 0; }
        }
        @media (max-width: 640px) {
          .kyc-pending-card {
            border-radius: 0 !important;
            min-height: 100vh !important;
            border-left: none !important;
            border-right: none !important;
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  )
}

// ─── Main KYC Upload Page ─────────────────────────────────────────────────────

export default function KYCPage() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()

  const [step,       setStep]    = useState<'form' | 'uploading' | 'done'>('form')
  const [error,      setError]   = useState('')
  const [loading,    setLoading] = useState(false)

  // Form state
  const [docType,     setDocType]     = useState<DocType>('PASSPORT')
  const [firstName,   setFirstName]   = useState(user?.firstName ?? '')
  const [lastName,    setLastName]    = useState(user?.lastName  ?? '')

  const [address,     setAddress]     = useState('')

  // Files — customer uploads front + back of their ID. Selfie has been dropped.
  const [frontFile,  setFrontFile]  = useState<File | null>(null)
  const [backFile,   setBackFile]   = useState<File | null>(null)

  const frontRef  = useRef<HTMLInputElement>(null)
  const backRef   = useRef<HTMLInputElement>(null)

  function previewUrl(f: File | null) { return f ? URL.createObjectURL(f) : null }

  async function handleSubmit() {
    setError('')
    if (!firstName.trim()) { setError('First name is required.');          return }
    if (!lastName.trim())  { setError('Last name is required.');           return }

    if (!frontFile)        { setError('Front of ID photo is required.');   return }
    if (!backFile)         { setError('Back of ID photo is required.');    return }

    setLoading(true)
    try {
      const form = new FormData()
      form.append('docType',     docType)
      // Document number is no longer collected from the user. Send a placeholder
      // so the backend's legacy NOT NULL column stays satisfied.
      form.append('docNumber',   'N/A')
      form.append('firstName',   firstName)
      form.append('lastName',    lastName)

      form.append('address',     address)
      form.append('front',       frontFile)
      form.append('back',        backFile)
      // Selfie is no longer collected. Backend now derives selfieUrl from backUrl
      // when the field is absent, so we intentionally don't append a 'selfie' file here.

      await api.upload('/kyc/submit', form)
      await refreshUser()
      setStep('done')
    } catch (e: any) {
      setError(e.message ?? 'Submission failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'done') return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'hsl(260 87% 3%)' }}>
      <div className="max-w-md w-full text-center rounded-3xl p-10"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}>
          <Check size={28} style={{ color: '#a78bfa' }} />
        </div>
        <h2 className="text-2xl font-semibold mb-2" style={{ color: 'hsl(40 6% 95%)' }}>Documents Submitted!</h2>
        <p className="text-sm mb-6" style={{ color: 'hsl(240 5% 65%)' }}>
          We'll review your documents within 24–48 hours and notify you by email.
        </p>
        <KYCPendingPage />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: 'hsl(260 87% 3%)', color: 'hsl(40 6% 95%)' }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[450px] h-[450px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle,#6366f1,transparent 70%)', filter: 'blur(70px)' }} />
      </div>

      <div className="relative max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
            <ShieldCheck size={24} style={{ color: '#818cf8' }} />
          </div>
          <h1 className="text-3xl font-semibold mb-2">Identity Verification</h1>
          <p className="text-sm" style={{ color: 'hsl(240 5% 60%)' }}>
            Required to access trading and investment features. Takes about 2 minutes.
          </p>
        </div>

        {/* Why KYC banner */}
        <div className="flex items-start gap-3 mb-8 px-5 py-4 rounded-2xl"
          style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <ShieldCheck size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#818cf8' }} />
          <p className="text-sm" style={{ color: 'hsl(240 5% 70%)' }}>
            We verify identities to protect your account and comply with financial regulations.
            Your data is encrypted and never shared with third parties.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 mb-6 px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <div className="space-y-6">
          {/* ── Personal Details ── */}
          <Section title="Personal Details" icon={<FileText size={16}/>}>
            <div className="grid grid-cols-2 gap-4">
              <KYCField label="First Name *" value={firstName} onChange={setFirstName} placeholder="As on document" />
              <KYCField label="Last Name *"  value={lastName}  onChange={setLastName}  placeholder="As on document" />
            </div>
            <KYCField label="Residential Address (optional)" value={address} onChange={setAddress} placeholder="Street, City, Country" />
          </Section>

          {/* ── Document Type ── */}
          <Section title="Document Type" icon={<CreditCard size={16}/>}>
            <div className="grid grid-cols-3 gap-3">
              {DOC_TYPES.map(d => (
                <button key={d.value} type="button" onClick={() => setDocType(d.value)}
                  className="px-3 py-3 rounded-xl text-sm font-medium text-center transition-all"
                  style={docType === d.value
                    ? { background: 'rgba(99,102,241,0.2)', border: '1.5px solid #818cf8', color: '#c7d2fe' }
                    : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(240 5% 65%)' }}>
                  {d.label}
                </button>
              ))}
            </div>
          </Section>

          {/* ── Front of ID ── */}
          <Section title="Front of ID" icon={<Upload size={16}/>}>
            <p className="text-xs mb-4" style={{ color: 'hsl(240 5% 55%)' }}>
              Upload a clear, well-lit photo of the front side of your ID. All text must be readable. Max 10MB.
            </p>
            <div className="max-w-xs">
              <UploadBox
                label="Front of ID *"
                file={frontFile}
                preview={previewUrl(frontFile)}
                inputRef={frontRef}
                onChange={f => { setFrontFile(f); setError('') }}
              />
            </div>
          </Section>

          {/* ── Back of ID ── */}
          <Section title="Back of ID" icon={<Camera size={16}/>}>
            <p className="text-xs mb-4" style={{ color: 'hsl(240 5% 55%)' }}>
              Upload a clear, well-lit photo of the back side of your ID. Make sure all text and any barcode are visible. Max 10MB.
            </p>
            <div className="max-w-xs">
              <UploadBox
                label="Back of ID *"
                file={backFile}
                preview={previewUrl(backFile)}
                inputRef={backRef}
                onChange={f => { setBackFile(f); setError('') }}
              />
            </div>
          </Section>
        </div>

        {/* Submit */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full max-w-md flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-medium transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', boxShadow: '0 4px 24px rgba(99,102,241,0.35)' }}>
            {loading
              ? <><Loader2 size={16} className="animate-spin"/> Submitting…</>
              : <><ShieldCheck size={16}/> Submit for Verification</>}
          </button>
          <p className="text-xs" style={{ color: 'hsl(240 5% 45%)' }}>
            By submitting you confirm all information is accurate.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl p-6 space-y-4"
      style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-center gap-2 mb-1">
        <span style={{ color: '#818cf8' }}>{icon}</span>
        <h3 className="text-sm font-semibold" style={{ color: 'hsl(40 6% 90%)' }}>{title}</h3>
      </div>
      {children}
    </div>
  )
}

function KYCField({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'hsl(240 5% 65%)' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl text-sm outline-none placeholder:opacity-40"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(40 6% 90%)' }} />
    </div>
  )
}

interface UploadBoxProps {
  label:    string
  file:     File | null
  preview:  string | null
  inputRef: React.RefObject<HTMLInputElement>
  onChange: (f: File) => void
  tall?:    boolean
}

function UploadBox({ label, file, preview, inputRef, onChange, tall }: UploadBoxProps) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'hsl(240 5% 65%)' }}>{label}</label>
      <div
        onClick={() => inputRef.current?.click()}
        className={`relative cursor-pointer rounded-2xl flex flex-col items-center justify-center transition-all hover:border-indigo-500/50 ${tall ? 'h-48' : 'h-36'}`}
        style={preview
          ? { border: '1.5px solid rgba(99,102,241,0.5)', overflow: 'hidden', background: '#000' }
          : { border: '1.5px dashed rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.03)' }}>
        {preview ? (
          <>
            <img src={preview} alt="" className="w-full h-full object-cover opacity-80" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
              <span className="text-xs text-white">Click to change</span>
            </div>
          </>
        ) : (
          <>
            <Upload size={20} className="mb-2" style={{ color: 'hsl(240 5% 45%)' }} />
            <span className="text-xs" style={{ color: 'hsl(240 5% 55%)' }}>Click to upload</span>
            <span className="text-[10px] mt-1" style={{ color: 'hsl(240 5% 40%)' }}>JPG, PNG, PDF • max 10MB</span>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) onChange(f) }}
        />
      </div>
      {file && (
        <p className="text-[10px] mt-1 truncate" style={{ color: 'hsl(240 5% 50%)' }}>
          {file.name}
        </p>
      )}
    </div>
  )
}
