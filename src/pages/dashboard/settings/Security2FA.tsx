import { useState } from 'react'
import { ArrowLeft, Shield, Key, Smartphone, Monitor, LogOut, CheckCircle2, AlertTriangle, Eye, EyeOff, Copy } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const inputStyle: React.CSSProperties = {
  width: '100%', height: 42, padding: '0 14px',
  borderRadius: 10, fontSize: 13, background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.09)', color: 'hsl(40 6% 90%)',
  outline: 'none', boxSizing: 'border-box',
}

const SESSIONS = [
  { id: 1, device: 'Chrome on macOS',       location: 'Lagos, Nigeria',   time: 'Active now',    current: true  },
  { id: 2, device: 'Safari on iPhone 15',   location: 'Abuja, Nigeria',   time: '2 hours ago',   current: false },
  { id: 3, device: 'Chrome on Windows 11',  location: 'London, UK',       time: '3 days ago',    current: false },
]

const BACKUP_CODES = [
  'A1B2-C3D4', 'E5F6-G7H8', 'I9J0-K1L2', 'M3N4-O5P6',
  'Q7R8-S9T0', 'U1V2-W3X4', 'Y5Z6-A7B8', 'C9D0-E1F2',
]

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24, marginBottom: 20 }}>
      <p style={{ fontSize: 14, fontWeight: 700, color: 'hsl(40 10% 94%)', marginBottom: sub ? 2 : 16 }}>{title}</p>
      {sub && <p style={{ fontSize: 12, color: 'hsl(240 5% 52%)', marginBottom: 16 }}>{sub}</p>}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 20 }} />
      {children}
    </div>
  )
}

export function Security2FA() {
  const navigate = useNavigate()
  const [twoFAEnabled, setTwoFAEnabled] = useState(false)
  const [showSetup, setShowSetup]       = useState(false)
  const [otpStep, setOtpStep]           = useState<'qr' | 'verify' | 'done'>('qr')
  const [otpCode, setOtpCode]           = useState('')
  const [showCurrent, setShowCurrent]   = useState(false)
  const [showNew, setShowNew]           = useState(false)
  const [showConfirm, setShowConfirm]   = useState(false)
  const [pwSaved, setPwSaved]           = useState(false)
  const [copiedCodes, setCopiedCodes]   = useState(false)

  const SECRET = 'JBSWY3DPEHPK3PXP'

  function handleVerify() {
    if (otpCode.length === 6) { setOtpStep('done'); setTwoFAEnabled(true) }
  }

  return (
    <div className="p-4 md:p-6 max-w-[760px] mx-auto overflow-x-hidden">
      <div className="flex items-center gap-3 mb-7">
        <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: 'hsl(240 5% 60%)', fontSize: 12 }}>
          <ArrowLeft size={14} /> Back
        </button>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'hsl(40 10% 96%)' }}>Security & 2FA</h1>
          <p style={{ fontSize: 13, color: 'hsl(240 5% 52%)' }}>Protect your account with two-factor authentication</p>
        </div>
      </div>

      {/* Security Score */}
      <div style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: twoFAEnabled ? 'rgba(167,139,250,0.12)' : 'rgba(245,158,11,0.12)', border: `1px solid ${twoFAEnabled ? 'rgba(167,139,250,0.2)' : 'rgba(245,158,11,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={22} style={{ color: twoFAEnabled ? '#a78bfa' : '#f59e0b' }} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'hsl(40 10% 94%)' }}>Security Score</p>
              <p style={{ fontSize: 12, color: twoFAEnabled ? '#a78bfa' : '#f59e0b' }}>{twoFAEnabled ? 'Strong — All protections active' : 'Fair — Enable 2FA to strengthen'}</p>
            </div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: twoFAEnabled ? '#a78bfa' : '#f59e0b' }}>{twoFAEnabled ? '95' : '65'}<span style={{ fontSize: 14, fontWeight: 500, color: 'hsl(240 5% 50%)' }}>/100</span></div>
        </div>
        {/* Score bar */}
        <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.06)' }}>
          <div style={{ height: '100%', width: twoFAEnabled ? '95%' : '65%', borderRadius: 999, background: twoFAEnabled ? 'linear-gradient(90deg,#a78bfa,#8b5cf6)' : 'linear-gradient(90deg,#f59e0b,#d97706)', transition: 'all 0.5s ease' }} />
        </div>
      </div>

      {/* 2FA */}
      <Section title="Two-Factor Authentication" sub="Add an extra layer of security using an authenticator app">
        {!twoFAEnabled && !showSetup && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={16} style={{ color: '#f59e0b' }} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'hsl(40 6% 85%)' }}>2FA is disabled</p>
                <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)' }}>Your account is less secure without it</p>
              </div>
            </div>
            <button onClick={() => setShowSetup(true)} style={{ padding: '9px 18px', borderRadius: 9, background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
              <Smartphone size={14} /> Enable 2FA
            </button>
          </div>
        )}

        {twoFAEnabled && !showSetup && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(167,139,250,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={16} style={{ color: '#a78bfa' }} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#a78bfa' }}>2FA is enabled</p>
                <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)' }}>Authenticator app is configured</p>
              </div>
            </div>
            <button onClick={() => { setTwoFAEnabled(false); setOtpStep('qr'); setOtpCode('') }} style={{ padding: '9px 18px', borderRadius: 9, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Disable 2FA
            </button>
          </div>
        )}

        {showSetup && otpStep === 'qr' && (
          <div>
            <p style={{ fontSize: 13, color: 'hsl(40 6% 82%)', marginBottom: 20 }}>Scan the QR code below with your authenticator app (Google Authenticator, Authy, etc.).</p>
            {/* Fake QR Code */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <div style={{ width: 148, height: 148, background: '#fff', borderRadius: 12, padding: 8, display: 'grid', gridTemplateColumns: 'repeat(10,1fr)', gap: 1 }}>
                {Array.from({ length: 100 }).map((_, i) => (
                  <div key={i} style={{ background: Math.random() > 0.5 ? '#000' : '#fff', borderRadius: 1 }} />
                ))}
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px 14px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div>
                <p style={{ fontSize: 11, color: 'hsl(240 5% 48%)' }}>Manual entry key</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'hsl(40 6% 88%)', letterSpacing: 2 }}>{SECRET}</p>
              </div>
              <button onClick={() => navigator.clipboard?.writeText(SECRET)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: 'hsl(240 5% 60%)', fontSize: 11 }}>
                <Copy size={12} /> Copy
              </button>
            </div>
            <button onClick={() => setOtpStep('verify')} style={{ width: '100%', padding: '11px', borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              I've scanned the code →
            </button>
          </div>
        )}

        {showSetup && otpStep === 'verify' && (
          <div>
            <p style={{ fontSize: 13, color: 'hsl(40 6% 82%)', marginBottom: 16 }}>Enter the 6-digit code from your authenticator app to verify setup.</p>
            <input value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="000 000" maxLength={6}
              style={{ ...inputStyle, textAlign: 'center', fontSize: 22, fontWeight: 800, letterSpacing: 8, marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setOtpStep('qr')} style={{ flex: 1, padding: '11px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'hsl(240 5% 55%)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>← Back</button>
              <button onClick={handleVerify} style={{ flex: 2, padding: '11px', borderRadius: 10, background: otpCode.length === 6 ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : 'rgba(255,255,255,0.05)', border: 'none', color: otpCode.length === 6 ? '#fff' : 'hsl(240 5% 40%)', fontSize: 13, fontWeight: 700, cursor: otpCode.length === 6 ? 'pointer' : 'default' }}>
                Verify & Activate
              </button>
            </div>
          </div>
        )}

        {showSetup && otpStep === 'done' && (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <CheckCircle2 size={44} style={{ color: '#a78bfa', margin: '0 auto 12px' }} />
            <p style={{ fontSize: 15, fontWeight: 700, color: '#a78bfa', marginBottom: 6 }}>2FA Successfully Enabled!</p>
            <p style={{ fontSize: 12, color: 'hsl(240 5% 52%)', marginBottom: 20 }}>Your account is now protected with two-factor authentication.</p>
            <button onClick={() => setShowSetup(false)} style={{ padding: '10px 28px', borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Done
            </button>
          </div>
        )}
      </Section>

      {/* Change Password */}
      <Section title="Change Password" sub="Use a strong password that you don't use elsewhere">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'Current Password', show: showCurrent, toggle: () => setShowCurrent(v => !v) },
            { label: 'New Password',     show: showNew,     toggle: () => setShowNew(v => !v) },
            { label: 'Confirm New Password', show: showConfirm, toggle: () => setShowConfirm(v => !v) },
          ].map(({ label, show, toggle }) => (
            <div key={label}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'hsl(240 5% 50%)', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</label>
              <div style={{ position: 'relative' }}>
                <Key size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'hsl(240 5% 42%)', pointerEvents: 'none' }} />
                <input type={show ? 'text' : 'password'} style={{ ...inputStyle, paddingLeft: 36, paddingRight: 40 }} placeholder="••••••••••••" />
                <button onClick={toggle} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 45%)', padding: 4 }}>
                  {show ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
            <button onClick={() => { setPwSaved(true); setTimeout(() => setPwSaved(false), 3000) }} style={{ padding: '10px 22px', borderRadius: 10, background: pwSaved ? 'rgba(167,139,250,0.15)' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', border: pwSaved ? '1px solid rgba(167,139,250,0.3)' : 'none', color: pwSaved ? '#a78bfa' : '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
              {pwSaved ? <><CheckCircle2 size={14} /> Password Updated!</> : 'Update Password'}
            </button>
          </div>
        </div>
      </Section>

      {/* Backup Codes */}
      <Section title="Backup Codes" sub="Use these one-time codes if you lose access to your authenticator app">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
          {BACKUP_CODES.map(code => (
            <div key={code} style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center', fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: 'hsl(240 5% 70%)', letterSpacing: 1 }}>
              {code}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => { navigator.clipboard?.writeText(BACKUP_CODES.join('\n')); setCopiedCodes(true); setTimeout(() => setCopiedCodes(false), 2000) }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: copiedCodes ? 'rgba(167,139,250,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${copiedCodes ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.08)'}`, color: copiedCodes ? '#a78bfa' : 'hsl(240 5% 55%)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <Copy size={12} /> {copiedCodes ? 'Copied!' : 'Copy All'}
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.2)', color: '#c4b5fd', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            Regenerate Codes
          </button>
        </div>
      </Section>

      {/* Active Sessions */}
      <Section title="Active Sessions" sub="Devices currently signed into your account">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {SESSIONS.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, background: s.current ? 'rgba(167,139,250,0.04)' : 'rgba(255,255,255,0.02)', border: `1px solid ${s.current ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.06)'}`, flexWrap: 'wrap' }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Monitor size={16} style={{ color: 'hsl(240 5% 55%)' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'hsl(40 6% 85%)' }}>{s.device}</p>
                  {s.current && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: 'rgba(167,139,250,0.12)', color: '#a78bfa' }}>This device</span>}
                </div>
                <p style={{ fontSize: 11, color: 'hsl(240 5% 48%)', marginTop: 2 }}>{s.location} · {s.time}</p>
              </div>
              {!s.current && (
                <button style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, padding: '6px 12px', borderRadius: 7, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)', color: '#f87171', cursor: 'pointer', flexShrink: 0 }}>
                  <LogOut size={12} /> Revoke
                </button>
              )}
            </div>
          ))}
        </div>
        <button style={{ marginTop: 14, width: '100%', padding: '10px', borderRadius: 10, background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)', color: '#f87171', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
          <LogOut size={14} /> Sign Out All Other Sessions
        </button>
      </Section>
    </div>
  )
}
