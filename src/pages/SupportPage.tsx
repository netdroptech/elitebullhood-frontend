import { useState } from 'react'
import { usePlatformName } from '@/context/PlatformNameContext'
import {
  Search, BookOpen, BarChart2, ShieldCheck, Wallet,
  Settings, MessageCircle, Mail, Phone, ChevronDown,
} from 'lucide-react'
import { PageBackground } from '@/components/ui/PageBackground'
import { Navbar } from '@/components/ui/Navbar'
import { Footer } from '@/components/ui/Footer'
import { Button } from '@/components/ui/button'
import { Reveal } from '@/components/ui/Reveal'
import { cn } from '@/lib/utils'

const CATEGORIES = [
  { icon: BookOpen,      title: 'Getting Started',       desc: 'Account setup, verification, and your first trade.',  count: 12 },
  { icon: BarChart2,     title: 'Trading & Orders',       desc: 'Order types, execution, margin, and leverage.',       count: 18 },
  { icon: Wallet,        title: 'Deposits & Withdrawals', desc: 'Funding methods, limits, and processing times.',      count: 9  },
  { icon: ShieldCheck,   title: 'Security & Account',     desc: '2FA, password resets, and account protection.',       count: 14 },
  { icon: Settings,      title: 'Platform & Tools',       desc: 'Charts, indicators, alerts, and platform settings.',  count: 21 },
  { icon: MessageCircle, title: 'Legal & Compliance',     desc: 'Regulations, disclosures, and KYC requirements.',     count: 7  },
]



const CONTACT = [
  { icon: MessageCircle, title: 'Live Chat',      desc: 'Chat with our support team in real time. Available 24/7 for all account holders.',         action: 'Start Chat',  highlight: true  },
  { icon: Mail,          title: 'Email Support',  desc: 'Send us a detailed message and we\'ll respond within 4 hours on business days.',            action: 'Send Email',  highlight: false },
  { icon: Phone,         title: 'Phone Support',  desc: 'Speak directly with a specialist. Available Monday–Friday, 8am–8pm GMT.',                  action: 'Call Us',     highlight: false },
]

function HeroSection() {
  const [query, setQuery] = useState('')
  return (
    <section className="relative w-full overflow-hidden pt-6 pb-20 sm:pb-28">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(167,139,250,0.07) 0%, transparent 70%)' }} />
      <Navbar />
      <div className="relative z-10 max-w-3xl mx-auto px-4 text-center pt-20 sm:pt-24">
        <Reveal>
          <div className="inline-flex items-center gap-2 liquid-glass rounded-full px-4 py-2 mb-6 sm:mb-8">
            <span className="text-sm text-foreground/70">Help Centre</span>
            <span className="w-1 h-1 rounded-full shrink-0" style={{ background: 'var(--primary-gradient)' }} />
            <span className="text-sm text-foreground/50">24/7 Support</span>
          </div>
          <h1 className="text-hero-heading text-[2rem] sm:text-[3.5rem] font-semibold leading-[1.05] tracking-tight">
            How Can We<br /><span className="text-primary-gradient">Help You?</span>
          </h1>
          <p className="text-hero-sub text-base sm:text-lg mt-4 opacity-80">
            Search our knowledge base or browse by category below.
          </p>
          <div className="relative mt-8 sm:mt-10 max-w-xl mx-auto">
            <div className="liquid-glass rounded-2xl flex items-center gap-3 px-5 py-4">
              <Search className="w-5 h-5 text-foreground/40 shrink-0" strokeWidth={1.8} />
              <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search for answers… e.g. 'how to withdraw'" className="flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground/30 outline-none min-w-0" />
              {query && <button onClick={() => setQuery('')} className="text-foreground/40 hover:text-foreground transition-colors text-xs shrink-0">Clear</button>}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function CategoriesSection() {
  return (
    <section className="py-12 sm:py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <Reveal><h2 className="text-hero-heading text-2xl sm:text-3xl font-semibold text-center mb-8 sm:mb-10">Browse by Topic</h2></Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {CATEGORIES.map(({ icon: Icon, title, desc, count }, i) => (
            <Reveal key={title} delay={i * 80}>
              <button className={cn('liquid-glass rounded-3xl p-6 sm:p-7 flex items-start gap-4 sm:gap-5 text-left w-full', 'hover:bg-white/[0.04] transition-colors')}>
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.18)' }}>
                  <Icon className="w-5 h-5" style={{ color: '#a78bfa' }} strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-hero-heading text-sm sm:text-base font-semibold">{title}</p>
                    <span className="text-xs text-muted-foreground bg-white/5 rounded-full px-2 py-0.5 shrink-0">{count}</span>
                  </div>
                  <p className="text-muted-foreground text-xs sm:text-sm mt-1.5 leading-relaxed">{desc}</p>
                </div>
              </button>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={cn('liquid-glass rounded-2xl overflow-hidden transition-colors', open && 'bg-white/[0.02]')}>
      <button className="w-full flex items-center justify-between gap-4 px-5 sm:px-7 py-4 sm:py-5 text-left" onClick={() => setOpen(!open)}>
        <span className="text-foreground text-sm font-medium">{q}</span>
        <ChevronDown className={cn('w-4 h-4 text-foreground/40 shrink-0 transition-transform duration-200', open && 'rotate-180')} strokeWidth={2} />
      </button>
      <div className={cn('overflow-hidden transition-all duration-300', open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0')}>
        <p className="text-muted-foreground text-sm leading-relaxed px-5 sm:px-7 pb-5 sm:pb-6">{a}</p>
      </div>
    </div>
  )
}

function FAQSection() {
  const { platformName } = usePlatformName()
  const FAQS = [
    { q: 'How do I open a trading account?',          a: 'Opening an account takes less than 5 minutes. Click \"Sign Up\", enter your email and password, complete identity verification (KYC) by uploading a government-issued ID and proof of address, and you\'ll be approved within 24 hours. Most accounts are approved instantly.' },
    { q: 'What is the minimum deposit?',              a: 'Our minimum deposit is $50 USD (or equivalent in your local currency). We accept bank transfers, credit/debit cards, and major e-wallets. Crypto deposits are also supported with no minimum.' },
    { q: 'How quickly are withdrawals processed?',    a: 'Withdrawals are processed within 1 business day. E-wallet withdrawals are typically instant. Bank transfers take 1–3 business days depending on your bank. All withdrawals go back to your original funding method.' },
    { q: 'What leverage is available?',               a: 'Leverage varies by instrument and account type. Forex pairs offer up to 1:500, indices up to 1:100, commodities up to 1:50, and crypto up to 1:20. Professional accounts may qualify for higher leverage subject to regulatory requirements.' },
    { q: `Is my money safe with ${platformName}?`,    a: 'Yes. All client funds are held in segregated accounts at tier-1 banks, completely separate from company operating funds. We are fully regulated and subject to regular audits. Additionally, we maintain a client protection fund for added security.' },
    { q: 'How do I enable two-factor authentication?', a: 'Go to Account Settings → Security → Two-Factor Authentication. We support Google Authenticator, Authy, and SMS-based 2FA. We strongly recommend enabling 2FA on all accounts to protect against unauthorised access.' },
    { q: 'What trading platforms do you support?',    a: 'We offer our own web-based platform (no download required), a desktop application for Windows and macOS, and native iOS and Android apps. All platforms share the same account, positions, and order history in real time.' },
    { q: `Can I trade cryptocurrencies?`,             a: `Yes. We offer spot and CFD trading on 50+ cryptocurrency pairs including BTC, ETH, SOL, BNB, XRP, and more — all tradable 24/7 from your single ${platformName} account alongside forex, stocks, and commodities.` },
  ]
  return (
    <section className="py-16 sm:py-24 px-4">
      <div className="max-w-3xl mx-auto">
        <Reveal className="text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 liquid-glass rounded-full px-4 py-2 mb-5 sm:mb-6">
            <span className="text-sm text-foreground/70">Quick Answers</span>
          </div>
          <h2 className="text-hero-heading text-2xl sm:text-4xl font-semibold leading-tight">Frequently Asked Questions</h2>
          <p className="text-muted-foreground text-sm sm:text-base mt-4">Can't find your answer? Our support team is available 24/7.</p>
        </Reveal>
        <div className="flex flex-col gap-3">
          {FAQS.map((faq, i) => (
            <Reveal key={faq.q} delay={i * 50}><FAQItem {...faq} /></Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function ContactSection() {
  return (
    <section className="py-16 sm:py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <Reveal className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 liquid-glass rounded-full px-4 py-2 mb-5 sm:mb-6">
            <span className="text-sm text-foreground/70">Still Need Help?</span>
          </div>
          <h2 className="text-hero-heading text-2xl sm:text-4xl font-semibold leading-tight">Get in Touch With Us</h2>
          <p className="text-muted-foreground text-sm sm:text-base mt-4 max-w-md mx-auto">Our support specialists are available around the clock.</p>
        </Reveal>
        <div className="grid sm:grid-cols-3 gap-5 sm:gap-6">
          {CONTACT.map(({ icon: Icon, title, desc, action, highlight }, i) => (
            <Reveal key={title} delay={i * 100}>
              <div className={cn('liquid-glass rounded-3xl p-7 sm:p-8 flex flex-col gap-5', highlight && 'ring-1 ring-white/10')}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={highlight ? { background: 'var(--primary-gradient)' } : { background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)' }}>
                  <Icon className="w-5 h-5" style={{ color: highlight ? '#050505' : '#a78bfa' }} strokeWidth={1.8} />
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <p className="text-hero-heading text-base font-semibold">{title}</p>
                  <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
                </div>
                <Button variant={highlight ? 'hero' : 'heroSecondary'} className="w-full justify-center">{action}</Button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

export function SupportPage() {
  const { platformName, platformEmail } = usePlatformName()
  return (
    <div className="min-h-screen text-foreground overflow-x-hidden" style={{ background: 'hsl(260 87% 2%)', position: 'relative' }}>
      <PageBackground />
      <HeroSection />
      <CategoriesSection />
      <FAQSection />
      <ContactSection />
      <Footer />
    </div>
  )
}
