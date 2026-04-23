import { useState } from 'react'
import { ArrowLeft, Upload, CheckCircle2, Clock, AlertCircle, ChevronRight, FileText, Camera, User, Shield } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const STEPS = ['Personal Details', 'ID Document', 'Selfie Verification', 'Review']

function StepBadge({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: done ? 'rgba(167,139,250,0.15)' : active ? 'rgba(167,139,250,0.25)' : 'rgba(255,255,255,0.05)',
      border: done ? '2px solid rgba(167,139,250,0.4)' : active ? '2px solid rgba(167,139,250,0.5)' : '2px solid rgba(255,255,255,0.08)',
      fontSize: 12, fontWeight: 800,
      color: done ? '#a78bfa' : active ? '#c4b5fd' : 'hsl(240 5% 45%)',
    }}>
      {done ? <CheckCircle2 size={14} /> : n}
    </div>
  )
}

function UploadZone({ label, hint }: { label: string; hint: string }) {
  const [dragging, setDragging] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); setUploaded(true) }}
      style={{
        border: `2px dashed ${uploaded ? 'rgba(167,139,250,0.4)' : dragging ? 'rgba(167,139,250,0.5)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 14, padding: '28px 20px', textAlign: 'center',
        background: uploaded ? 'rgba(167,139,250,0.04)' : dragging ? 'rgba(167,139,250,0.05)' : 'rgba(255,255,255,0.02)',
        cursor: 'pointer', transition: 'all 0.2s', marginBottom: 16,
      }}
      onClick={() => setUploaded(true)}
    >
      {uploaded ? (
        <>
          <CheckCircle2 size={28} style={{ color: '#a78bfa', margin: '0 auto 8px' }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: '#a78bfa' }}>Document uploaded</p>
          <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)', marginTop: 3 }}>Click to replace</p>
        </>
      ) : (
        <>
          <Upload size={28} style={{ color: 'hsl(240 5% 42%)', margin: '0 auto 10px' }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: 'hsl(40 6% 85%)' }}>{label}</p>
          <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)', marginTop: 4 }}>{hint}</p>
          <button style={{ marginTop: 12, fontSize: 12, fontWeight: 600, padding: '7px 18px', borderRadius: 8, background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)', color: '#c4b5fd', cursor: 'pointer' }}>
            Browse files
          </button>
        </>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', height: 42, padding: '0 14px',
  borderRadius: 10, fontSize: 13, background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.09)', color: 'hsl(40 6% 90%)',
  outline: 'none', boxSizing: 'border-box',
}

export function KYCVerification() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [docType, setDocType] = useState('passport')

  const DOC_TYPES = [
    { id: 'passport', label: 'Passport', icon: '🛂' },
    { id: 'national', label: 'National ID', icon: '🪪' },
    { id: 'license',  label: "Driver's License", icon: '🚗' },
  ]

  const LEVEL_STATUS = [
    { level: 'Level 1 — Email Verified',    status: 'Verified',  color: '#a78bfa', bg: 'rgba(167,139,250,0.1)',  icon: CheckCircle2 },
    { level: 'Level 2 — Identity (KYC)',     status: 'Pending',   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: Clock },
    { level: 'Level 3 — Enhanced Due Diligence', status: 'Locked', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', icon: Shield },
  ]

  return (
    <div className="p-4 md:p-6 max-w-[760px] mx-auto overflow-x-hidden">
      <div className="flex items-center gap-3 mb-7">
        <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: 'hsl(240 5% 60%)', fontSize: 12 }}>
          <ArrowLeft size={14} /> Back
        </button>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'hsl(40 10% 96%)' }}>KYC Verification</h1>
          <p style={{ fontSize: 13, color: 'hsl(240 5% 52%)' }}>Verify your identity to unlock full account features</p>
        </div>
      </div>

      {/* Verification Levels */}
      <div style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20, marginBottom: 24 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'hsl(40 10% 94%)', marginBottom: 14 }}>Verification Levels</p>
        {LEVEL_STATUS.map((l, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < LEVEL_STATUS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: l.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <l.icon size={15} style={{ color: l.color }} />
              </div>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'hsl(40 6% 85%)' }}>{l.level}</p>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, color: l.color, background: l.bg }}>{l.status}</span>
          </div>
        ))}
      </div>

      {/* Stepper */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28, overflowX: 'auto', paddingBottom: 4 }}>
        {STEPS.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <button onClick={() => i <= step && setStep(i)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: i <= step ? 'pointer' : 'default' }}>
              <StepBadge n={i + 1} active={i === step} done={i < step} />
              <span style={{ fontSize: 10, fontWeight: 600, color: i === step ? '#c4b5fd' : i < step ? '#a78bfa' : 'hsl(240 5% 45%)', whiteSpace: 'nowrap' }}>{s}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div style={{ width: 36, height: 2, background: i < step ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.07)', margin: '0 6px', marginBottom: 18, flexShrink: 0 }} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24, marginBottom: 20 }}>

        {/* Step 0 — Personal Details */}
        {step === 0 && (
          <>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'hsl(40 10% 94%)', marginBottom: 4 }}>Personal Details</p>
            <p style={{ fontSize: 12, color: 'hsl(240 5% 52%)', marginBottom: 20 }}>Enter your details exactly as they appear on your government-issued ID.</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[['Legal First Name','John'],['Legal Last Name','Doe'],['Date of Birth',''],['Nationality','Nigerian']].map(([label, ph]) => (
                <div key={label}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'hsl(240 5% 50%)', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>{label}</label>
                  <input style={inputStyle} placeholder={ph} />
                </div>
              ))}
            </div>
          </>
        )}

        {/* Step 1 — ID Document */}
        {step === 1 && (
          <>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'hsl(40 10% 94%)', marginBottom: 4 }}>Upload Identity Document</p>
            <p style={{ fontSize: 12, color: 'hsl(240 5% 52%)', marginBottom: 20 }}>Select document type and upload a clear, unobstructed photo.</p>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
              {DOC_TYPES.map(d => (
                <button key={d.id} onClick={() => setDocType(d.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, cursor: 'pointer', border: docType === d.id ? '1px solid rgba(167,139,250,0.4)' : '1px solid rgba(255,255,255,0.08)', background: docType === d.id ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.03)', color: docType === d.id ? '#c4b5fd' : 'hsl(240 5% 60%)', fontSize: 12, fontWeight: 600, transition: 'all 0.15s' }}>
                  <span>{d.icon}</span> {d.label}
                </button>
              ))}
            </div>
            <UploadZone label="Upload Front of Document" hint="JPG, PNG or PDF · Max 10MB" />
            <UploadZone label="Upload Back of Document" hint="JPG, PNG or PDF · Max 10MB" />
          </>
        )}

        {/* Step 2 — Selfie */}
        {step === 2 && (
          <>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'hsl(40 10% 94%)', marginBottom: 4 }}>Selfie Verification</p>
            <p style={{ fontSize: 12, color: 'hsl(240 5% 52%)', marginBottom: 20 }}>Take a clear photo of your face to verify it matches your document.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {['✅ Good lighting','✅ Face fully visible','❌ No sunglasses','❌ No hat or cap'].map(tip => (
                <div key={tip} style={{ padding: '10px 14px', borderRadius: 10, background: tip.startsWith('✅') ? 'rgba(167,139,250,0.06)' : 'rgba(248,113,113,0.06)', border: `1px solid ${tip.startsWith('✅') ? 'rgba(167,139,250,0.15)' : 'rgba(248,113,113,0.15)'}`, fontSize: 12, color: tip.startsWith('✅') ? '#a78bfa' : '#f87171' }}>
                  {tip}
                </div>
              ))}
            </div>
            <UploadZone label="Upload Selfie Photo" hint="Hold your ID next to your face · JPG or PNG" />
          </>
        )}

        {/* Step 3 — Review */}
        {step === 3 && (
          <>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'hsl(40 10% 94%)', marginBottom: 4 }}>Review & Submit</p>
            <p style={{ fontSize: 12, color: 'hsl(240 5% 52%)', marginBottom: 20 }}>Please review your submitted information before sending.</p>
            {[
              { label: 'Full Name',     value: 'Edwin —',      icon: User },
              { label: 'Document Type',value: 'Passport',      icon: FileText },
              { label: 'Selfie',        value: '1 photo uploaded', icon: Camera },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(167,139,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <row.icon size={14} style={{ color: '#a78bfa' }} />
                </div>
                <div>
                  <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)' }}>{row.label}</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'hsl(40 6% 88%)' }}>{row.value}</p>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 10, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <p style={{ fontSize: 12, color: '#f59e0b', lineHeight: 1.6 }}>By submitting, you confirm all provided information is accurate. False information may result in account suspension.</p>
            </div>
          </>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
        <button onClick={() => step > 0 ? setStep(s => s - 1) : navigate(-1)} style={{ padding: '10px 22px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'hsl(240 5% 55%)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          {step === 0 ? 'Cancel' : '← Back'}
        </button>
        <button onClick={() => step < STEPS.length - 1 ? setStep(s => s + 1) : null} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 22px', borderRadius: 10, background: step === STEPS.length - 1 ? 'linear-gradient(135deg,#8b5cf6,#7c3aed)' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          {step === STEPS.length - 1 ? '🚀 Submit Verification' : <>Continue <ChevronRight size={14} /></>}
        </button>
      </div>
    </div>
  )
}
