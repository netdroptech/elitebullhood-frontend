import { Monitor, Smartphone, Code2, BarChart2, Bell, Settings2, Wifi, Lock } from 'lucide-react'
import { PageBackground } from '@/components/ui/PageBackground'
import { Navbar } from '@/components/ui/Navbar'
import { Footer } from '@/components/ui/Footer'
import { Button } from '@/components/ui/button'
import { Reveal } from '@/components/ui/Reveal'

const PLATFORMS = [
  { icon: Monitor,    name: 'Web Terminal', tag: 'No download needed', desc: 'Launch a fully-featured trading terminal directly in your browser. Real-time charts, one-click execution, and complete order management — no installation required.', features: ['Advanced TradingView charts', 'Multi-monitor layout', 'Full order book & depth', 'Customisable workspace'], cta: 'Launch Web Terminal', highlight: false },
  { icon: Smartphone, name: 'Mobile App',   tag: 'iOS & Android',      desc: 'Trade on the move with our award-winning mobile app. Built from the ground up for touch — not a stripped-down desktop port.',                                         features: ['Face ID / biometric login', 'Push notifications on fills', 'Watchlists & price alerts', 'Full account management'], cta: 'Download the App',    highlight: true  },
  { icon: Code2,      name: 'API & Algo',   tag: 'REST & WebSocket',   desc: 'Connect your own systems directly to our matching engine. Low-latency REST endpoints, real-time WebSocket streams, and full FIX protocol support.',                      features: ['Sub-millisecond WebSocket feeds', 'REST order management', 'FIX protocol for institutions', 'Sandbox environment included'], cta: 'View API Docs', highlight: false },
]

const PLATFORM_STATS = [
  { stat: '99.98%', label: 'Uptime SLA'           },
  { stat: '< 1ms',  label: 'API response time'    },
  { stat: '5M+',    label: 'Orders processed daily'},
  { stat: '150+',   label: 'Countries supported'  },
]

const FEATURES = [
  { icon: BarChart2, title: 'Professional Charting', desc: '100+ technical indicators, 50+ drawing tools, and 20+ chart types — all powered by TradingView.' },
  { icon: Bell,      title: 'Smart Alerts',          desc: 'Price, indicator, and news alerts delivered via push, email, or SMS so you never miss a move.' },
  { icon: Settings2, title: 'Fully Customisable',    desc: 'Rearrange panels, save layouts, and configure hotkeys to build a workspace that matches your workflow.' },
  { icon: Wifi,      title: 'Real-Time Data',        desc: 'Level II quotes, time & sales, and order flow data updated tick-by-tick across all instruments.' },
  { icon: Lock,      title: 'Secure by Default',     desc: '2FA, device management, session timeouts, and IP whitelisting keep your account locked down.' },
  { icon: Monitor,   title: 'Multi-Device Sync',     desc: 'Your watchlists, layouts, and preferences sync instantly across web, desktop, and mobile.' },
]

const COMPARISON = [
  { feature: 'Real-time streaming quotes',  web: true,  mobile: true,  api: true  },
  { feature: 'Advanced charting suite',     web: true,  mobile: true,  api: false },
  { feature: 'One-click order entry',       web: true,  mobile: true,  api: false },
  { feature: 'Algorithmic order routing',   web: false, mobile: false, api: true  },
  { feature: 'Custom indicator scripts',    web: true,  mobile: false, api: true  },
  { feature: 'Push / SMS notifications',    web: false, mobile: true,  api: false },
  { feature: 'FIX protocol support',        web: false, mobile: false, api: true  },
  { feature: 'Multi-account management',    web: true,  mobile: true,  api: true  },
]

function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden pt-6 pb-24 sm:pb-32">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(167,139,250,0.07) 0%, transparent 70%)' }} />
      <Navbar />
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center pt-20 sm:pt-24">
        <Reveal>
          <div className="inline-flex items-center gap-2 liquid-glass rounded-full px-4 py-2 mb-6 sm:mb-8">
            <span className="text-sm text-foreground/70">Web · Mobile · API</span>
            <span className="w-1 h-1 rounded-full" style={{ background: 'var(--primary-gradient)' }} />
            <span className="text-sm text-foreground/50">All Platforms</span>
          </div>
          <h1 className="text-hero-heading text-[2rem] sm:text-[3.5rem] lg:text-[4.5rem] font-semibold leading-[1.05] tracking-tight">
            One Platform.<br /><span className="text-primary-gradient">Trade Anywhere.</span>
          </h1>
          <p className="text-hero-sub text-base sm:text-lg max-w-2xl mx-auto mt-5 sm:mt-6 opacity-80 leading-relaxed">
            Whether you're on desktop, mobile, or building an algorithmic strategy — our infrastructure delivers the same professional-grade experience everywhere.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-7 sm:mt-8">
            <Button variant="hero">Launch Web Terminal</Button>
            <Button variant="heroSecondary">Download Mobile App</Button>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function PlatformStatsSection() {
  return (
    <section className="py-8 sm:py-10 px-4">
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {PLATFORM_STATS.map(({ stat, label }, i) => (
          <Reveal key={label} delay={i * 80}>
            <div className="liquid-glass rounded-2xl p-5 sm:p-6 text-center">
              <p className="text-hero-heading text-2xl sm:text-4xl font-semibold tracking-tight text-primary-gradient">{stat}</p>
              <p className="text-muted-foreground text-xs sm:text-sm mt-2">{label}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function PlatformCardsSection() {
  return (
    <section className="py-16 sm:py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <Reveal className="text-center mb-10 sm:mb-16">
          <div className="inline-flex items-center gap-2 liquid-glass rounded-full px-4 py-2 mb-5 sm:mb-6">
            <span className="text-sm text-foreground/70">Choose Your Interface</span>
          </div>
          <h2 className="text-hero-heading text-2xl sm:text-5xl font-semibold leading-tight">Built for Every<br />Type of Trader</h2>
          <p className="text-muted-foreground text-base sm:text-lg mt-4 max-w-xl mx-auto">Three distinct trading environments, each optimised for a different workflow.</p>
        </Reveal>
        <div className="grid sm:grid-cols-3 gap-5 sm:gap-6">
          {PLATFORMS.map(({ icon: Icon, name, tag, desc, features, cta, highlight }, i) => (
            <Reveal key={name} delay={i * 100}>
              <div className="liquid-glass rounded-3xl p-7 sm:p-8 flex flex-col gap-6" style={highlight ? { boxShadow: 'inset 0 1px 1px rgba(167,139,250,0.15), 0 0 0 1px rgba(167,139,250,0.15)' } : {}}>
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)' }}>
                    <Icon className="w-6 h-6" style={{ color: '#a78bfa' }} strokeWidth={1.5} />
                  </div>
                  <span className="text-xs text-muted-foreground liquid-glass rounded-full px-3 py-1">{tag}</span>
                </div>
                <div>
                  <h3 className="text-hero-heading text-lg sm:text-xl font-semibold">{name}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mt-2">{desc}</p>
                </div>
                <ul className="flex flex-col gap-2.5">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: 'var(--primary-gradient)' }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button variant={highlight ? 'hero' : 'heroSecondary'} className="w-full justify-center mt-auto">{cta}</Button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function FeaturesGridSection() {
  return (
    <section className="py-16 sm:py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <Reveal className="text-center mb-10 sm:mb-16">
          <div className="inline-flex items-center gap-2 liquid-glass rounded-full px-4 py-2 mb-5 sm:mb-6">
            <span className="text-sm text-foreground/70">Built-In Capabilities</span>
          </div>
          <h2 className="text-hero-heading text-2xl sm:text-5xl font-semibold leading-tight">Powerful Features,<br />Every Platform</h2>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }, i) => (
            <Reveal key={title} delay={i * 80}>
              <div className="liquid-glass rounded-3xl p-6 sm:p-7 flex flex-col gap-4 hover:bg-white/[0.03] transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)' }}>
                  <Icon className="w-5 h-5" style={{ color: '#a78bfa' }} strokeWidth={1.5} />
                </div>
                <h3 className="text-hero-heading text-base sm:text-lg font-semibold">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function ComparisonSection() {
  return (
    <section className="py-16 sm:py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <Reveal className="text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 liquid-glass rounded-full px-4 py-2 mb-5 sm:mb-6">
            <span className="text-sm text-foreground/70">Feature Matrix</span>
          </div>
          <h2 className="text-hero-heading text-2xl sm:text-4xl font-semibold leading-tight">Compare Platforms</h2>
        </Reveal>
        <Reveal delay={100}>
          {/* Horizontal scroll on small screens */}
          <div className="overflow-x-auto -mx-4 px-4">
            <div className="liquid-glass rounded-3xl overflow-hidden min-w-[480px]">
              <div className="grid grid-cols-4 px-5 sm:px-6 py-4 border-b border-border/30">
                <span className="text-muted-foreground text-xs sm:text-sm font-medium">Feature</span>
                {['Web', 'Mobile', 'API'].map((p) => (
                  <span key={p} className="text-foreground text-xs sm:text-sm font-semibold text-center">{p}</span>
                ))}
              </div>
              {COMPARISON.map(({ feature, web, mobile, api }, idx) => (
                <div key={feature} className={`grid grid-cols-4 px-5 sm:px-6 py-3 sm:py-4 ${idx < COMPARISON.length - 1 ? 'border-b border-border/20' : ''} hover:bg-white/[0.02] transition-colors`}>
                  <span className="text-muted-foreground text-xs sm:text-sm">{feature}</span>
                  {[web, mobile, api].map((supported, i) => (
                    <div key={i} className="flex justify-center">
                      {supported ? <span className="text-sm sm:text-base" style={{ color: '#a78bfa' }}>✓</span> : <span className="text-muted-foreground/30 text-sm sm:text-base">–</span>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section className="py-16 sm:py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <Reveal>
          <div className="liquid-glass rounded-[2rem] p-8 sm:p-20 text-center flex flex-col items-center gap-6">
            <h2 className="text-hero-heading text-2xl sm:text-5xl font-semibold leading-tight">Start Trading on<br />Your Preferred Platform</h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-md">One free account gives you instant access to every platform — web, mobile, and API.</p>
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              <Button variant="hero">Create Free Account</Button>
              <Button variant="heroSecondary">Explore API Docs</Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export function PlatformsPage() {
  return (
    <div className="min-h-screen text-foreground overflow-x-hidden" style={{ background: 'hsl(260 87% 2%)', position: 'relative' }}>
      <PageBackground />
      <HeroSection />
      <PlatformStatsSection />
      <PlatformCardsSection />
      <FeaturesGridSection />
      <ComparisonSection />
      <CTASection />
      <Footer />
    </div>
  )
}
