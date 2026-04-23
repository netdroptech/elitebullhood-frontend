import { useState, useEffect } from 'react'
import { Lock, Eye, EyeOff, CheckCircle2, AlertTriangle, Loader2, KeyRound, MapPin, Phone, ShieldCheck } from 'lucide-react'
import { adminApi } from '@/lib/api'

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminSettings() {
  const [currentPw,  setCurrentPw]  = useState('')
  const [newPw,      setNewPw]      = useState('')
  const [confirmPw,  setConfirmPw]  = useState('')

  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew,     setShowNew]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [saving,     setSaving]     = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg,   setErrorMsg]   = useState('')

  // ── Contact info state ─────────────────────────────────────────────────────
  const [address,      setAddress]      = useState('')
  const [phone,        setPhone]        = useState('')
  const [contactSaving,  setContactSaving]  = useState(false)
  const [contactSuccess, setContactSuccess] = useState('')
  const [contactError,   setContactError]   = useState('')

  // ── Account verification toggle state ──────────────────────────────────────
  const [verificationRequired,  setVerificationRequired] = useState(true)
  const [verificationSaving,    setVerificationSaving]   = useState(false)
  const [verificationMsg,       setVerificationMsg]      = useState('')
  const [verificationMsgType,   setVerificationMsgType]  = useState<'ok' | 'err' | ''>('')

  // Load existing settings on mount
  useEffect(() => {
    adminApi.get<{ success: boolean; data: Record<string, string> }>('/admin/settings')
      .then(res => {
        setAddress(res.data.platform_address ?? '')
        setPhone(res.data.platform_phone   ?? '')
        // Default to true when the key is missing
        setVerificationRequired(res.data.account_verification_required !== 'false')
      })
      .catch(() => {/* silently ignore */})
  }, [])

  async function toggleVerificationRequired(nextValue: boolean) {
    setVerificationSaving(true); setVerificationMsg(''); setVerificationMsgType('')
    // Optimistically reflect the new state
    setVerificationRequired(nextValue)
    try {
      await adminApi.patch('/admin/settings/account_verification_required', {
        value: nextValue ? 'true' : 'false',
      })
      setVerificationMsg(nextValue
        ? 'Verification is now REQUIRED. New users must verify their email to activate.'
        : 'Verification is now OFF. New registrations are auto-activated.')
      setVerificationMsgType('ok')
    } catch (err: any) {
      // Roll back on failure
      setVerificationRequired(!nextValue)
      setVerificationMsg(err?.message ?? 'Failed to update setting.')
      setVerificationMsgType('err')
    } finally {
      setVerificationSaving(false)
    }
  }

  async function handleContactSave(e: React.FormEvent) {
    e.preventDefault()
    setContactSuccess(''); setContactError('')
    setContactSaving(true)
    try {
      await Promise.all([
        adminApi.patch('/admin/settings/platform_address', { value: address }),
        adminApi.patch('/admin/settings/platform_phone',   { value: phone }),
      ])
      setContactSuccess('Contact information updated successfully.')
    } catch (err: any) {
      setContactError(err?.message ?? 'Failed to update contact info.')
    } finally {
      setContactSaving(false)
    }
  }

  // ── Strength indicator ─────────────────────────────────────────────────────
  function getStrength(pw: string): { label: string; color: string; width: string } {
    if (pw.length === 0) return { label: '', color: 'transparent', width: '0%' }
    let score = 0
    if (pw.length >= 8)  score++
    if (pw.length >= 12) score++
    if (/[A-Z]/.test(pw)) score++
    if (/[0-9]/.test(pw)) score++
    if (/[^A-Za-z0-9]/.test(pw)) score++
    if (score <= 1) return { label: 'Weak',   color: '#f87171', width: '25%' }
    if (score <= 2) return { label: 'Fair',   color: '#f59e0b', width: '50%' }
    if (score <= 3) return { label: 'Good',   color: '#60a5fa', width: '75%' }
    return                  { label: 'Strong', color: '#a78bfa', width: '100%' }
  }

  const strength = getStrength(newPw)

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSuccessMsg(''); setErrorMsg('')

    if (!currentPw || !newPw || !confirmPw) {
      setErrorMsg('All fields are required.'); return
    }
    if (newPw.length < 8) {
      setErrorMsg('New password must be at least 8 characters.'); return
    }
    if (newPw !== confirmPw) {
      setErrorMsg('New passwords do not match.'); return
    }
    if (newPw === currentPw) {
      setErrorMsg('New password must be different from current password.'); return
    }

    setSaving(true)
    try {
      await adminApi.post('/admin/settings/change-password', {
        currentPassword: currentPw,
        newPassword:     newPw,
      })
      setSuccessMsg('Password updated successfully.')
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message ?? 'Failed to update password.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ padding: '24px 16px 60px', maxWidth: 980, margin: '0 auto' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'hsl(40 10% 96%)', marginBottom: 4 }}>
          System Settings
        </h1>
        <p style={{ fontSize: 13, color: 'hsl(240 5% 50%)' }}>
          Manage your admin account and platform configuration.
        </p>
      </div>

      {/* ── Contact Info Card ── */}
      <div style={{
        background: 'hsl(260 60% 5%)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14, overflow: 'hidden',
        maxWidth: 560, marginBottom: 28,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 22px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ width: 34, height: 34, borderRadius: '0.55rem', background: 'rgba(167,139,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MapPin size={16} style={{ color: '#a78bfa' }} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'hsl(40 6% 92%)' }}>Platform Contact Info</p>
            <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)' }}>Shown in the footer and support pages</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleContactSave} style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Address */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'hsl(240 5% 55%)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Office / Location Address
            </label>
            <div style={{ position: 'relative' }}>
              <MapPin size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'hsl(240 5% 45%)', pointerEvents: 'none' }} />
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="e.g. Colorado 81147, USA"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '0.65rem 0.875rem 0.65rem 2.1rem',
                  borderRadius: 9, fontSize: 13,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'hsl(40 6% 90%)', outline: 'none', fontFamily: 'inherit',
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'rgba(167,139,250,0.4)'}
                onBlur={e  => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'hsl(240 5% 55%)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Phone Number
            </label>
            <div style={{ position: 'relative' }}>
              <Phone size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'hsl(240 5% 45%)', pointerEvents: 'none' }} />
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. +1 (800) 555-0100"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '0.65rem 0.875rem 0.65rem 2.1rem',
                  borderRadius: 9, fontSize: 13,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'hsl(40 6% 90%)', outline: 'none', fontFamily: 'inherit',
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'rgba(167,139,250,0.4)'}
                onBlur={e  => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
          </div>

          {/* Feedback */}
          {contactSuccess && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 9, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.25)' }}>
              <CheckCircle2 size={14} style={{ color: '#a78bfa', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#a78bfa' }}>{contactSuccess}</span>
            </div>
          )}
          {contactError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 9, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)' }}>
              <AlertTriangle size={14} style={{ color: '#f87171', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#f87171' }}>{contactError}</span>
            </div>
          )}

          {/* Save button */}
          <button
            type="submit"
            disabled={contactSaving}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              padding: '0.7rem 1rem', borderRadius: 9,
              background: contactSaving ? 'rgba(167,139,250,0.15)' : 'rgba(167,139,250,0.18)',
              border: '1px solid rgba(167,139,250,0.35)',
              color: '#c4b5fd', fontSize: 13, fontWeight: 700,
              cursor: contactSaving ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { if (!contactSaving) e.currentTarget.style.background = 'rgba(167,139,250,0.28)' }}
            onMouseLeave={e => { if (!contactSaving) e.currentTarget.style.background = 'rgba(167,139,250,0.18)' }}
          >
            {contactSaving
              ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
              : <><MapPin size={14} /> Save Contact Info</>
            }
          </button>
        </form>
      </div>

      {/* ── Account Verification Toggle Card ── */}
      <div style={{
        background: 'hsl(260 60% 5%)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14, overflow: 'hidden',
        maxWidth: 560, marginBottom: 28,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 22px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ width: 34, height: 34, borderRadius: '0.55rem', background: 'rgba(74,222,128,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={16} style={{ color: '#4ade80' }} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'hsl(40 6% 92%)' }}>Account Verification on Registration</p>
            <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)' }}>Require new users to verify their email before they can use the platform</p>
          </div>
        </div>

        <div style={{ padding: '22px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', borderRadius: 10,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'hsl(40 6% 90%)', marginBottom: 3 }}>
                {verificationRequired ? 'Verification Required' : 'Verification Off'}
              </p>
              <p style={{ fontSize: 11, color: 'hsl(240 5% 55%)', lineHeight: 1.5 }}>
                {verificationRequired
                  ? 'New users get a verification email and must click the link before their account becomes active.'
                  : 'New users are instantly active after registration. No verification email is sent.'}
              </p>
            </div>

            {/* Toggle switch */}
            <button
              type="button"
              disabled={verificationSaving}
              onClick={() => toggleVerificationRequired(!verificationRequired)}
              aria-label={verificationRequired ? 'Turn off verification' : 'Turn on verification'}
              style={{
                position: 'relative', flexShrink: 0,
                width: 46, height: 26, marginLeft: 16, padding: 0, borderRadius: 999,
                cursor: verificationSaving ? 'not-allowed' : 'pointer',
                background: verificationRequired ? 'rgba(74,222,128,0.5)' : 'rgba(120,120,120,0.4)',
                border: verificationRequired ? '1px solid rgba(74,222,128,0.7)' : '1px solid rgba(255,255,255,0.15)',
                transition: 'all 0.2s ease',
              }}
            >
              <span style={{
                position: 'absolute', top: 2, left: verificationRequired ? 22 : 2,
                width: 20, height: 20, borderRadius: '50%',
                background: '#fff', transition: 'left 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }} />
            </button>
          </div>

          {verificationSaving && (
            <p style={{ fontSize: 11, color: 'hsl(240 5% 55%)', marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Saving…
            </p>
          )}

          {verificationMsg && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px', borderRadius: 9, marginTop: 12,
              background: verificationMsgType === 'ok' ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)',
              border: verificationMsgType === 'ok' ? '1px solid rgba(74,222,128,0.25)' : '1px solid rgba(248,113,113,0.25)',
            }}>
              {verificationMsgType === 'ok'
                ? <CheckCircle2 size={14} style={{ color: '#4ade80', flexShrink: 0 }} />
                : <AlertTriangle size={14} style={{ color: '#f87171', flexShrink: 0 }} />}
              <span style={{ fontSize: 12, color: verificationMsgType === 'ok' ? '#4ade80' : '#f87171' }}>{verificationMsg}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Change Password Card ── */}
      <div style={{
        background: 'hsl(260 60% 5%)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14, overflow: 'hidden',
        maxWidth: 560,
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '16px 22px', borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: '0.55rem',
            background: 'rgba(96,165,250,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <KeyRound size={16} style={{ color: '#60a5fa' }} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'hsl(40 6% 92%)' }}>Change Password</p>
            <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)' }}>Update your admin account password</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '22px' }}>

          {/* Current password */}
          <PwField
            label="Current Password"
            value={currentPw}
            onChange={setCurrentPw}
            show={showCurrent}
            onToggle={() => setShowCurrent(v => !v)}
            placeholder="Enter your current password"
          />

          <div style={{ height: 16 }} />

          {/* New password */}
          <PwField
            label="New Password"
            value={newPw}
            onChange={setNewPw}
            show={showNew}
            onToggle={() => setShowNew(v => !v)}
            placeholder="At least 8 characters"
          />

          {/* Strength bar */}
          {newPw.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ height: 3, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: strength.width, background: strength.color, borderRadius: 999, transition: 'all 0.3s ease' }} />
              </div>
              <p style={{ fontSize: 11, color: strength.color, marginTop: 4 }}>{strength.label}</p>
            </div>
          )}

          <div style={{ height: 16 }} />

          {/* Confirm new password */}
          <PwField
            label="Confirm New Password"
            value={confirmPw}
            onChange={setConfirmPw}
            show={showConfirm}
            onToggle={() => setShowConfirm(v => !v)}
            placeholder="Re-enter new password"
            hasError={confirmPw.length > 0 && confirmPw !== newPw}
          />
          {confirmPw.length > 0 && confirmPw !== newPw && (
            <p style={{ fontSize: 11, color: '#f87171', marginTop: 4 }}>Passwords do not match.</p>
          )}

          {/* Messages */}
          {successMsg && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px', borderRadius: 9, marginTop: 16,
              background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.25)',
            }}>
              <CheckCircle2 size={14} style={{ color: '#a78bfa', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#a78bfa' }}>{successMsg}</span>
            </div>
          )}
          {errorMsg && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px', borderRadius: 9, marginTop: 16,
              background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)',
            }}>
              <AlertTriangle size={14} style={{ color: '#f87171', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#f87171' }}>{errorMsg}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            style={{
              marginTop: 22, width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              padding: '0.7rem 1rem', borderRadius: 9,
              background: saving ? 'rgba(96,165,250,0.3)' : 'rgba(96,165,250,0.18)',
              border: '1px solid rgba(96,165,250,0.35)',
              color: '#93c5fd', fontSize: 13, fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.background = 'rgba(96,165,250,0.28)' }}
            onMouseLeave={e => { if (!saving) e.currentTarget.style.background = 'rgba(96,165,250,0.18)' }}
          >
            {saving
              ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Updating…</>
              : <><Lock size={14} /> Update Password</>
            }
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Password field sub-component ─────────────────────────────────────────────

function PwField({
  label, value, onChange, show, onToggle, placeholder, hasError = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  show: boolean
  onToggle: () => void
  placeholder?: string
  hasError?: boolean
}) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: 11, fontWeight: 600,
        color: 'hsl(240 5% 55%)', marginBottom: 6,
        textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%', padding: '0.65rem 2.5rem 0.65rem 0.875rem',
            borderRadius: 9, fontSize: 13,
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${hasError ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.1)'}`,
            color: 'hsl(40 6% 90%)', outline: 'none', boxSizing: 'border-box',
            fontFamily: 'inherit', transition: 'border-color 0.15s ease',
          }}
          onFocus={e => { if (!hasError) e.currentTarget.style.borderColor = 'rgba(96,165,250,0.5)' }}
          onBlur={e => { if (!hasError) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
        />
        <button
          type="button"
          onClick={onToggle}
          style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'hsl(240 5% 50%)', display: 'flex', alignItems: 'center', padding: 2,
          }}
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  )
}
