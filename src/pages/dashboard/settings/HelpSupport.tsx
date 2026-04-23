import { usePlatformName } from '@/context/PlatformNameContext'
import { useState } from 'react'
import { ArrowLeft, ChevronDown, MessageCircle, Mail, Phone, FileText, ExternalLink, Send, CheckCircle2, Search, BookOpen, Zap, Shield } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface FAQ { q: string; a: string }

const CHANNELS = [
  { icon: MessageCircle, label: 'Live Chat',     sub: 'Average reply: 2 min',  color: '#a78bfa', bg: 'rgba(167,139,250,0.1)',   cta: 'Start Chat',    available: true  },
  { icon: Mail,          label: 'Email Support', sub: 'Reply within 24 hours', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',   cta: 'Send Email',    available: true  },
  { icon: Phone,         label: 'Phone Support', sub: 'Mon–Fri 9am – 6pm WAT', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  cta: 'Call Now',      available: false },
]

export function HelpSupport() {
  const navigate = useNavigate()
  const { platformName } = usePlatformName()
  const FAQS: { category: string; icon: React.ElementType; color: string; bg: string; items: FAQ[] }[] = [
    {
      category: 'Getting Started',
      icon: Zap,
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.1)',
      items: [
        { q: 'How do I create an account?', a: 'Click "Sign Up" on the homepage and enter your email. You\'ll receive a verification link within minutes. Once verified, complete your profile to gain full access.' },
        { q: 'What documents do I need for KYC?', a: 'You\'ll need a government-issued photo ID (passport, national ID, or driver\'s license) and a selfie holding your document. Verification typically takes 1–2 business days.' },
        { q: 'How do I deposit funds?', a: 'Go to Wallet & Funds → Deposit. Choose your preferred method (bank transfer, card, or crypto), enter the amount, and follow the on-screen instructions.' },
      ],
    },
    {
      category: 'Trading & Signals',
      icon: BookOpen,
      color: '#60a5fa',
      bg: 'rgba(96,165,250,0.1)',
      items: [
        { q: 'How do trading signals work?', a: 'Our AI engine analyses market data in real time and generates buy/sell signals with entry price, take-profit, and stop-loss levels. Signals are delivered instantly via dashboard and email.' },
        { q: 'Can I copy a trader automatically?', a: 'Yes. In Copy Trading, find a trader you like, click "Copy", set your allocation and risk limit, and every trade they make will be mirrored proportionally in your account.' },
        { q: 'What are the trading fees?', a: 'Spot trades incur a 0.1% maker/taker fee. Premium members enjoy 50% reduced fees. There are no deposit fees; withdrawal fees vary by method.' },
      ],
    },
    {
      category: 'Security & Account',
      icon: Shield,
      color: '#a78bfa',
      bg: 'rgba(167,139,250,0.1)',
      items: [
        { q: 'How do I enable two-factor authentication?', a: 'Go to Settings → Security & 2FA. Click "Enable 2FA", scan the QR code with an authenticator app like Google Authenticator, then enter the 6-digit code to verify.' },
        { q: 'I forgot my password. What should I do?', a: 'On the login page, click "Forgot Password?" and enter your email. You\'ll receive a secure reset link valid for 30 minutes.' },
        { q: 'Can I have multiple accounts?', a: `No. ${platformName} permits one account per user. Operating multiple accounts may result in permanent suspension per our Terms of Service.` },
      ],
    },
  ]

  const [openFaq, setOpenFaq] = useState<string | null>(null)
  const [search, setSearch]   = useState('')
  const [category, setCategory] = useState('All')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent]       = useState(false)

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 13,
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
    color: 'hsl(40 6% 90%)', outline: 'none', boxSizing: 'border-box',
  }

  const categories = ['All', ...FAQS.map(f => f.category)]

  const filtered = FAQS
    .filter(g => category === 'All' || g.category === category)
    .map(g => ({
      ...g,
      items: g.items.filter(item =>
        !search || item.q.toLowerCase().includes(search.toLowerCase()) || item.a.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter(g => g.items.length > 0)

  function handleSend() {
    if (!subject || !message) return
    setSent(true)
    setTimeout(() => { setSent(false); setSubject(''); setMessage('') }, 3500)
  }

  return (
    <div className="p-4 md:p-6 max-w-[760px] mx-auto overflow-x-hidden">
      <div className="flex items-center gap-3 mb-7">
        <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: 'hsl(240 5% 60%)', fontSize: 12 }}>
          <ArrowLeft size={14} /> Back
        </button>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'hsl(40 10% 96%)' }}>Help & Support</h1>
          <p style={{ fontSize: 13, color: 'hsl(240 5% 52%)' }}>Find answers or reach out to our support team</p>
        </div>
      </div>

      {/* Support Channels */}
      <div className="grid sm:grid-cols-3 gap-4" style={{ marginBottom: 24 }}>
        {CHANNELS.map(ch => (
          <div key={ch.label} style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '18px 16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: ch.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ch.icon size={18} style={{ color: ch.color }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'hsl(40 6% 88%)' }}>{ch.label}</p>
              <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)', marginTop: 2 }}>{ch.sub}</p>
            </div>
            <button style={{ width: '100%', padding: '8px', borderRadius: 8, background: ch.available ? ch.bg : 'rgba(255,255,255,0.03)', border: `1px solid ${ch.available ? ch.color + '33' : 'rgba(255,255,255,0.06)'}`, color: ch.available ? ch.color : 'hsl(240 5% 40%)', fontSize: 12, fontWeight: 700, cursor: ch.available ? 'pointer' : 'default' }}>
              {ch.available ? ch.cta : 'Unavailable'}
            </button>
          </div>
        ))}
      </div>

      {/* FAQ Search */}
      <div style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24, marginBottom: 20 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'hsl(40 10% 94%)', marginBottom: 4 }}>Frequently Asked Questions</p>
        <p style={{ fontSize: 12, color: 'hsl(240 5% 52%)', marginBottom: 16 }}>Browse answers to common questions</p>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 16 }} />

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 14 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'hsl(240 5% 42%)', pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search questions..." style={{ ...inputStyle, paddingLeft: 36, height: 40 }} />
        </div>

        {/* Category Filter */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {categories.map(c => (
            <button key={c} onClick={() => setCategory(c)} style={{ padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: category === c ? '1px solid rgba(167,139,250,0.4)' : '1px solid rgba(255,255,255,0.08)', background: category === c ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.03)', color: category === c ? '#c4b5fd' : 'hsl(240 5% 55%)', transition: 'all 0.15s' }}>
              {c}
            </button>
          ))}
        </div>

        {/* Accordion */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(group => (
            <div key={group.category}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: group.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <group.icon size={12} style={{ color: group.color }} />
                </div>
                <p style={{ fontSize: 11, fontWeight: 700, color: group.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{group.category}</p>
              </div>
              {group.items.map(item => {
                const key = item.q
                const isOpen = openFaq === key
                return (
                  <div key={key} style={{ borderRadius: 10, overflow: 'hidden', marginBottom: 6, border: isOpen ? '1px solid rgba(167,139,250,0.2)' : '1px solid rgba(255,255,255,0.06)', background: isOpen ? 'rgba(167,139,250,0.04)' : 'rgba(255,255,255,0.02)' }}>
                    <button onClick={() => setOpenFaq(isOpen ? null : key)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'hsl(40 6% 88%)', flex: 1 }}>{item.q}</span>
                      <ChevronDown size={14} style={{ color: 'hsl(240 5% 50%)', flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>
                    {isOpen && (
                      <div style={{ padding: '0 16px 14px', fontSize: 12, color: 'hsl(240 5% 60%)', lineHeight: 1.7 }}>
                        {item.a}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
          {filtered.length === 0 && (
            <p style={{ fontSize: 13, color: 'hsl(240 5% 48%)', textAlign: 'center', padding: '20px 0' }}>No results for "{search}"</p>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24, marginBottom: 20 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'hsl(40 10% 94%)', marginBottom: 4 }}>Resources</p>
        <p style={{ fontSize: 12, color: 'hsl(240 5% 52%)', marginBottom: 16 }}>Useful links and documentation</p>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 16 }} />
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { icon: FileText, label: 'User Guide',          sub: 'Full platform documentation',  color: '#60a5fa' },
            { icon: BookOpen, label: 'Trading Academy',     sub: 'Beginner to advanced courses',  color: '#a78bfa' },
            { icon: Shield,   label: 'Security Centre',     sub: 'Best practices & safety tips',  color: '#a78bfa' },
            { icon: FileText, label: 'API Documentation',   sub: 'For developers and integrations', color: '#f59e0b' },
          ].map(r => (
            <button key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: `${r.color}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <r.icon size={15} style={{ color: r.color }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'hsl(40 6% 85%)' }}>{r.label}</p>
                <p style={{ fontSize: 11, color: 'hsl(240 5% 48%)' }}>{r.sub}</p>
              </div>
              <ExternalLink size={12} style={{ color: 'hsl(240 5% 40%)', flexShrink: 0 }} />
            </button>
          ))}
        </div>
      </div>

      {/* Contact Form */}
      <div style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24, marginBottom: 20 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'hsl(40 10% 94%)', marginBottom: 4 }}>Contact Support</p>
        <p style={{ fontSize: 12, color: 'hsl(240 5% 52%)', marginBottom: 16 }}>Couldn't find your answer? We'll get back to you within 24 hours.</p>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 20 }} />

        {sent ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle2 size={40} style={{ color: '#a78bfa', margin: '0 auto 12px' }} />
            <p style={{ fontSize: 15, fontWeight: 700, color: '#a78bfa', marginBottom: 6 }}>Message Sent!</p>
            <p style={{ fontSize: 12, color: 'hsl(240 5% 52%)' }}>Our support team will respond within 24 hours.</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'hsl(240 5% 50%)', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>SUBJECT</label>
              <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Issue with withdrawal" style={{ ...inputStyle, height: 42 }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'hsl(240 5% 50%)', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>MESSAGE</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={5} placeholder="Describe your issue in detail..." style={{ ...inputStyle, height: 'auto', paddingTop: 12, paddingBottom: 12, resize: 'vertical', lineHeight: 1.6 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={handleSend} disabled={!subject || !message} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 22px', borderRadius: 10, background: subject && message ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : 'rgba(255,255,255,0.05)', border: 'none', color: subject && message ? '#fff' : 'hsl(240 5% 40%)', fontSize: 13, fontWeight: 700, cursor: subject && message ? 'pointer' : 'default', transition: 'all 0.2s' }}>
                <Send size={13} /> Send Message
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
