import { useState } from 'react'
import { ArrowLeft, Globe, Clock, DollarSign, Calendar, Save, CheckCircle2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const selectStyle: React.CSSProperties = {
  width: '100%', height: 42, paddingLeft: 14, paddingRight: 14,
  borderRadius: 10, fontSize: 13, background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.09)', color: 'hsl(40 6% 90%)',
  outline: 'none', boxSizing: 'border-box', appearance: 'none',
}

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

function Field({ label, icon: Icon, children }: { label: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'hsl(240 5% 50%)', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <Icon size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'hsl(240 5% 42%)', pointerEvents: 'none', zIndex: 1 }} />
        <div style={{ paddingLeft: 34 }}>
          {children}
        </div>
      </div>
    </div>
  )
}

const LANGUAGES = [
  { code: 'en', flag: '🇬🇧', label: 'English (US)' },
  { code: 'en-gb', flag: '🇬🇧', label: 'English (UK)' },
  { code: 'fr', flag: '🇫🇷', label: 'French' },
  { code: 'de', flag: '🇩🇪', label: 'German' },
  { code: 'es', flag: '🇪🇸', label: 'Spanish' },
  { code: 'pt', flag: '🇵🇹', label: 'Portuguese' },
  { code: 'ar', flag: '🇸🇦', label: 'Arabic' },
  { code: 'zh', flag: '🇨🇳', label: 'Chinese (Simplified)' },
  { code: 'ja', flag: '🇯🇵', label: 'Japanese' },
  { code: 'ko', flag: '🇰🇷', label: 'Korean' },
]

const TIMEZONES = [
  'UTC-12:00 Baker Island', 'UTC-08:00 Pacific Time (US)', 'UTC-05:00 Eastern Time (US)',
  'UTC+00:00 Greenwich Mean Time', 'UTC+01:00 Central European Time',
  'UTC+01:00 West Africa Time (Lagos)', 'UTC+02:00 Eastern European Time',
  'UTC+03:00 Moscow', 'UTC+05:30 India Standard Time',
  'UTC+07:00 Indochina Time', 'UTC+08:00 China Standard Time',
  'UTC+09:00 Japan Standard Time', 'UTC+10:00 AEST (Sydney)',
]

const CURRENCIES = [
  '$ USD — US Dollar', '€ EUR — Euro', '£ GBP — British Pound',
  '₦ NGN — Nigerian Naira', '¥ JPY — Japanese Yen', 'C$ CAD — Canadian Dollar',
  'A$ AUD — Australian Dollar', 'CHF — Swiss Franc', '¥ CNY — Chinese Yuan',
  'R ZAR — South African Rand', 'د.إ AED — UAE Dirham',
]

const DATE_FORMATS = [
  'MM/DD/YYYY  (01/25/2026)',
  'DD/MM/YYYY  (25/01/2026)',
  'YYYY-MM-DD  (2026-01-25)',
  'DD MMM YYYY (25 Jan 2026)',
  'MMM DD, YYYY (Jan 25, 2026)',
]

const TIME_FORMATS = ['12-hour (1:45 PM)', '24-hour (13:45)']

const NUMBER_FORMATS = [
  '1,000.00  (US standard)',
  '1.000,00  (European)',
  '1 000.00  (Space separator)',
]

export function LanguageRegion() {
  const navigate = useNavigate()
  const [saved, setSaved] = useState(false)
  const [lang, setLang]     = useState('en')
  const [tz, setTz]         = useState('UTC+01:00 West Africa Time (Lagos)')
  const [currency, setCurrency] = useState('$ USD — US Dollar')
  const [dateFormat, setDateFormat] = useState(DATE_FORMATS[0])
  const [timeFormat, setTimeFormat] = useState(TIME_FORMATS[0])
  const [numberFormat, setNumberFormat] = useState(NUMBER_FORMATS[0])

  const selectedLang = LANGUAGES.find(l => l.code === lang)

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="p-4 md:p-6 max-w-[760px] mx-auto overflow-x-hidden">
      <div className="flex items-center gap-3 mb-7">
        <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: 'hsl(240 5% 60%)', fontSize: 12 }}>
          <ArrowLeft size={14} /> Back
        </button>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'hsl(40 10% 96%)' }}>Language & Region</h1>
          <p style={{ fontSize: 13, color: 'hsl(240 5% 52%)' }}>Set your preferred language, timezone and currency</p>
        </div>
      </div>

      {/* Language */}
      <Section title="Language" sub="Choose the display language for your dashboard">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }} className="sm:grid-cols-3">
          {LANGUAGES.map(l => (
            <button key={l.code} onClick={() => setLang(l.code)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, cursor: 'pointer', border: lang === l.code ? '1px solid rgba(167,139,250,0.4)' : '1px solid rgba(255,255,255,0.07)', background: lang === l.code ? 'rgba(167,139,250,0.1)' : 'rgba(255,255,255,0.02)', textAlign: 'left', transition: 'all 0.15s' }}>
              <span style={{ fontSize: 18 }}>{l.flag}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: lang === l.code ? '#c4b5fd' : 'hsl(40 6% 75%)' }}>{l.label}</span>
              {lang === l.code && <CheckCircle2 size={12} style={{ color: '#a78bfa', marginLeft: 'auto' }} />}
            </button>
          ))}
        </div>
      </Section>

      {/* Time & Location */}
      <Section title="Time & Location" sub="Configure your timezone and regional display">
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'hsl(240 5% 50%)', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>TIMEZONE</label>
          <div style={{ position: 'relative', marginBottom: 18 }}>
            <Clock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'hsl(240 5% 42%)', pointerEvents: 'none', zIndex: 1 }} />
            <select value={tz} onChange={e => setTz(e.target.value)} style={{ ...selectStyle, paddingLeft: 34 }}>
              {TIMEZONES.map(t => <option key={t} value={t} style={{ background: 'hsl(260 87% 6%)' }}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'hsl(240 5% 50%)', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>DATE FORMAT</label>
            <div style={{ position: 'relative' }}>
              <Calendar size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'hsl(240 5% 42%)', pointerEvents: 'none', zIndex: 1 }} />
              <select value={dateFormat} onChange={e => setDateFormat(e.target.value)} style={{ ...selectStyle, paddingLeft: 34 }}>
                {DATE_FORMATS.map(f => <option key={f} value={f} style={{ background: 'hsl(260 87% 6%)' }}>{f}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'hsl(240 5% 50%)', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>TIME FORMAT</label>
            <div style={{ position: 'relative' }}>
              <Clock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'hsl(240 5% 42%)', pointerEvents: 'none', zIndex: 1 }} />
              <select value={timeFormat} onChange={e => setTimeFormat(e.target.value)} style={{ ...selectStyle, paddingLeft: 34 }}>
                {TIME_FORMATS.map(f => <option key={f} value={f} style={{ background: 'hsl(260 87% 6%)' }}>{f}</option>)}
              </select>
            </div>
          </div>
        </div>
      </Section>

      {/* Currency & Numbers */}
      <Section title="Currency & Numbers" sub="Set how money and numbers are displayed">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'hsl(240 5% 50%)', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>DISPLAY CURRENCY</label>
            <div style={{ position: 'relative' }}>
              <DollarSign size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'hsl(240 5% 42%)', pointerEvents: 'none', zIndex: 1 }} />
              <select value={currency} onChange={e => setCurrency(e.target.value)} style={{ ...selectStyle, paddingLeft: 34 }}>
                {CURRENCIES.map(c => <option key={c} value={c} style={{ background: 'hsl(260 87% 6%)' }}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'hsl(240 5% 50%)', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>NUMBER FORMAT</label>
            <div style={{ position: 'relative' }}>
              <Globe size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'hsl(240 5% 42%)', pointerEvents: 'none', zIndex: 1 }} />
              <select value={numberFormat} onChange={e => setNumberFormat(e.target.value)} style={{ ...selectStyle, paddingLeft: 34 }}>
                {NUMBER_FORMATS.map(f => <option key={f} value={f} style={{ background: 'hsl(260 87% 6%)' }}>{f}</option>)}
              </select>
            </div>
          </div>
        </div>
      </Section>

      {/* Preview */}
      <div style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)', borderRadius: 12, padding: '16px 20px', marginBottom: 24 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#c4b5fd', marginBottom: 10 }}>Preview</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Language', value: `${selectedLang?.flag} ${selectedLang?.label}` },
            { label: 'Date',     value: dateFormat.split('  ')[1]?.replace(/[()]/g, '') || '01/25/2026' },
            { label: 'Time',     value: timeFormat.includes('12') ? '2:30 PM' : '14:30' },
            { label: 'Number',   value: numberFormat.split(' ')[0].replace('1', '1,234') },
          ].map(item => (
            <div key={item.label}>
              <p style={{ fontSize: 10, color: 'hsl(240 5% 48%)', marginBottom: 3 }}>{item.label}</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'hsl(40 6% 85%)' }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button onClick={() => navigate(-1)} style={{ padding: '10px 22px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'hsl(240 5% 55%)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
        <button onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 22px', borderRadius: 10, background: saved ? 'rgba(167,139,250,0.15)' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', border: saved ? '1px solid rgba(167,139,250,0.3)' : 'none', color: saved ? '#a78bfa' : '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
          <Save size={14} /> {saved ? 'Preferences Saved!' : 'Save Preferences'}
        </button>
      </div>
    </div>
  )
}
