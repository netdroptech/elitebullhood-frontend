import { Zap, Shield, RefreshCw, ArrowRightLeft, SlidersHorizontal, Activity } from 'lucide-react'
import { PageBackground } from '@/components/ui/PageBackground'
import { Navbar } from '@/components/ui/Navbar'
import { Footer } from '@/components/ui/Footer'
import { Button } from '@/components/ui/button'
import { Reveal } from '@/components/ui/Reveal'

const EXECUTION_STATS = [
  { stat: '< 1ms',    label: 'Avg. order execution' },
  { stat: '99.98%',   label: 'Platform uptime'      },
  { stat: '0.0 pips', label: 'Min. spread on EUR/USD'},
  { stat: '1:500',    label: 'Max. leverage'         },
]

const ORDER_TYPES = [
  { icon: Zap,              title: 'Market Orders',     desc: 'Execute instantly at the best available price. Ideal for high-liquidity instruments where speed is the priority.' },
  { icon: SlidersHorizontal,title: 'Limit & Stop Orders',desc: 'Set your target price and let the market come to you. Orders trigger automatically when your price is reached.' },
  { icon: ArrowRightLeft,   title: 'OCO Orders',        desc: 'One-Cancels-the-Other orders let you bracket a position — one side executes, the other cancels automatically.' },
  { icon: RefreshCw,        title: 'Trailing Stops',    desc: 'Lock in profits as the market moves in your favour. Your stop adjusts dynamically to protect your position.' },
  { icon: Shield,           title: 'Guaranteed Stops',  desc: 'For a small premium, guarantee your stop level is honoured regardless of slippage or market gaps.' },
  { icon: Activity,         title: 'Algo & API Orders', desc: 'Send orders programmatically via our REST or WebSocket API. Full FIX protocol support for institutional clients.' },
]

const ACCOUNT_TYPES = [
  { name: 'Standard',      minDeposit: '$100',    spread: 'From 1.0 pip',  commission: '$0',         leverage: 'Up to 1:200',  highlight: false },
  { name: 'Pro',           minDeposit: '$1,000',  spread: 'From 0.0 pips', commission: '$3.50/lot',  leverage: 'Up to 1:500',  highlight: true  },
  { name: 'Institutional', minDeposit: '$50,000', spread: 'Raw ECN',       commission: 'Custom',     leverage: 'Negotiable',   highlight: false },
]

const RISK_FEATURES = [
  'Negative balance protection on all accounts',
  'Margin call alerts via SMS and email',
  'One-click position close from the order panel',
  'Real-time P&L displayed on every open position',
  'Equity stop-out level set at 50% for Standard, 20% for Pro',
  'Dedicated risk management desk for institutional clients',
]

function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden pt-6 pb-24 sm:pb-32">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(167,139,250,0.07) 0%, transparent 70%)' }} />
      <Navbar />
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center pt-20 sm:pt-24">
        <Reveal>
          <div className="inline-flex items-center gap-2 liquid-glass rounded-full px-4 py-2 mb-6 sm:mb-8">
            <span className="text-sm text-foreground/70">Execution</span>
            <span className="w-1 h-1 rounded-full" style={{ background: 'var(--primary-gradient)' }} />
            <span className="text-sm text-foreground/50">Sub-millisecond</span>
          </div>
          <h1 className="text-hero-heading text-[2rem] sm:text-[3.5rem] lg:text-[4.5rem] font-semibold leading-[1.05] tracking-tight">
            Execute with<br /><span className="text-primary-gradient">Precision & Speed</span>
          </h1>
          <p className="text-hero-sub text-base sm:text-lg max-w-2xl mx-auto mt-5 sm:mt-6 opacity-80 leading-relaxed">
            Professional order types, raw ECN pricing, and sub-millisecond execution — every tool you need to trade any market with confidence.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-7 sm:mt-8">
            <Button variant="hero" onClick={() => window.location.href='/register'}>Start Trading</Button>
            <Button variant="heroSecondary" onClick={() => window.location.href='/register'}>View Account Types</Button>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function ExecutionStatsSection() {
  return (
    <section className="py-8 sm:py-10 px-4">
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {EXECUTION_STATS.map(({ stat, label }, i) => (
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

function OrderTypesSection() {
  return (
    <section className="py-16 sm:py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <Reveal className="text-center mb-10 sm:mb-16">
          <div className="inline-flex items-center gap-2 liquid-glass rounded-full px-4 py-2 mb-5 sm:mb-6">
            <span className="text-sm text-foreground/70">Order Management</span>
          </div>
          <h2 className="text-hero-heading text-2xl sm:text-5xl font-semibold leading-tight">Every Order Type<br />You'll Ever Need</h2>
          <p className="text-muted-foreground text-base sm:text-lg mt-4 max-w-xl mx-auto">From simple market orders to advanced algorithmic routing — full control over how and when you execute.</p>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {ORDER_TYPES.map(({ icon: Icon, title, desc }, i) => (
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


function RiskManagementSection() {
  return (
    <section className="py-16 sm:py-24 px-4">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <Reveal direction="right">
          <div className="flex flex-col gap-5 sm:gap-6">
            <div className="inline-flex items-center gap-2 liquid-glass rounded-full px-4 py-2 w-fit">
              <span className="text-sm text-foreground/70">Risk Management</span>
              <span className="w-1 h-1 rounded-full" style={{ background: 'var(--primary-gradient)' }} />
              <span className="text-sm text-foreground/50">Built In</span>
            </div>
            <h2 className="text-hero-heading text-2xl sm:text-5xl font-semibold leading-tight">Tools That Keep<br />You in Control</h2>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">Risk management isn't an afterthought — it's baked into every layer of the platform. From protective stop orders to real-time margin monitoring, we give you the guardrails to trade with discipline.</p>
            <Button variant="hero" className="w-fit mt-2" onClick={() => window.location.href='/register'}>Open an Account</Button>
          </div>
        </Reveal>
        <Reveal direction="left" delay={120}>
          <div className="liquid-glass rounded-3xl p-7 sm:p-8 flex flex-col gap-4">
            <h3 className="text-hero-heading text-base sm:text-lg font-semibold mb-2">Risk Features Included</h3>
            {RISK_FEATURES.map((feature) => (
              <div key={feature} className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: 'var(--primary-gradient)' }} />
                <p className="text-muted-foreground text-sm leading-relaxed">{feature}</p>
              </div>
            ))}
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
            <h2 className="text-hero-heading text-2xl sm:text-5xl font-semibold leading-tight">Ready to Trade<br />Like a Pro?</h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-md">Open your account in minutes and access professional-grade execution from day one.</p>
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              <Button variant="hero" onClick={() => window.location.href='/register'}>Get Started Free</Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export function TradePage() {
  return (
    <div className="min-h-screen text-foreground overflow-x-hidden" style={{ background: 'hsl(260 87% 2%)', position: 'relative' }}>
      <PageBackground />
      <HeroSection />
      <ExecutionStatsSection />
      <OrderTypesSection />
      <RiskManagementSection />
      <CTASection />
      <Footer />
    </div>
  )
}
