import { TrendingUp, DollarSign, Bitcoin, BarChart2, Layers, Globe2 } from 'lucide-react'
import { PageBackground } from '@/components/ui/PageBackground'
import { Navbar } from '@/components/ui/Navbar'
import { Footer } from '@/components/ui/Footer'
import { Button } from '@/components/ui/button'
import { Reveal } from '@/components/ui/Reveal'
import { cn } from '@/lib/utils'

const ASSET_CLASSES = [
  { icon: DollarSign, label: 'Forex',         pairs: '80+ pairs',      spread: 'From 0.0 pips', leverage: 'Up to 1:500', desc: 'Trade major, minor and exotic currency pairs with tight spreads and deep liquidity around the clock.' },
  { icon: Bitcoin,    label: 'Crypto',         pairs: '60+ assets',     spread: 'From 0.1%',     leverage: 'Up to 1:10',  desc: 'Access Bitcoin, Ethereum, and top altcoins with competitive fees and 24/7 market availability.' },
  { icon: BarChart2,  label: 'Indices',        pairs: '30+ indices',    spread: 'From 0.4 pts',  leverage: 'Up to 1:200', desc: 'Trade the world\'s leading indices — S&P 500, NASDAQ, DAX, and more — in real time.' },
  { icon: Layers,     label: 'Commodities',    pairs: '25+ markets',    spread: 'From 0.03',     leverage: 'Up to 1:100', desc: 'Gold, silver, oil, and agricultural commodities — hedge your portfolio or speculate on price movements.' },
  { icon: TrendingUp, label: 'Stocks & ETFs',  pairs: '300+ equities',  spread: 'From $0.01',    leverage: 'Up to 1:20',  desc: 'Buy and sell shares of the world\'s most recognised companies across US, EU, and UK exchanges.' },
  { icon: Globe2,     label: 'Bonds & Rates',  pairs: '15+ products',   spread: 'From 0.5 pts',  leverage: 'Up to 1:50',  desc: 'Gain exposure to government and corporate bond markets for diversified, macro-driven strategies.' },
]

const MARKET_DATA = [
  { pair: 'EUR/USD', price: '1.08432',   change: '+0.14%', up: true  },
  { pair: 'BTC/USD', price: '67,241.00', change: '+2.31%', up: true  },
  { pair: 'XAU/USD', price: '2,318.50',  change: '-0.42%', up: false },
  { pair: 'GBP/USD', price: '1.26714',   change: '+0.08%', up: true  },
  { pair: 'ETH/USD', price: '3,541.20',  change: '+1.87%', up: true  },
  { pair: 'US500',   price: '5,204.34',  change: '-0.22%', up: false },
]

const CONDITIONS = [
  { stat: '< 1ms', label: 'Order execution speed' },
  { stat: '0.0',   label: 'Min. pip spread on FX'  },
  { stat: '500+',  label: 'Tradable instruments'   },
  { stat: '24/7',  label: 'Market access'          },
]

function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden pt-6 pb-24 sm:pb-32">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(167,139,250,0.07) 0%, transparent 70%)' }} />
      <Navbar />
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center pt-20 sm:pt-24">
        <Reveal>
          <div className="inline-flex items-center gap-2 liquid-glass rounded-full px-4 py-2 mb-6 sm:mb-8">
            <span className="text-sm text-foreground/70">500+ Instruments</span>
            <span className="w-1 h-1 rounded-full" style={{ background: 'var(--primary-gradient)' }} />
            <span className="text-sm text-foreground/50">One Account</span>
          </div>
          <h1 className="text-hero-heading text-[2rem] sm:text-[3.5rem] lg:text-[4.5rem] font-semibold leading-[1.05] tracking-tight">
            Every Market.<br /><span className="text-primary-gradient">One Platform.</span>
          </h1>
          <p className="text-hero-sub text-base sm:text-lg max-w-2xl mx-auto mt-5 sm:mt-6 opacity-80 leading-relaxed">
            From forex and crypto to stocks, commodities, and indices — access 500+ tradable instruments with institutional-grade spreads and lightning-fast execution.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-7 sm:mt-8">
            <Button variant="hero" onClick={() => window.location.href='/register'}>Start Trading Now</Button>
            <Button variant="heroSecondary">View All Instruments</Button>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function ConditionsBar() {
  return (
    <section className="py-8 sm:py-10 px-4">
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {CONDITIONS.map(({ stat, label }, i) => (
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

function LiveTickerSection() {
  return (
    <section className="py-16 sm:py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <Reveal className="text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 liquid-glass rounded-full px-4 py-2 mb-5 sm:mb-6">
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-sm text-foreground/70">Live Prices</span>
          </div>
          <h2 className="text-hero-heading text-2xl sm:text-5xl font-semibold">Market Snapshot</h2>
          <p className="text-muted-foreground text-base sm:text-lg mt-4 max-w-xl mx-auto">Real-time quotes across our most actively traded instruments.</p>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MARKET_DATA.map(({ pair, price, change, up }, i) => (
            <Reveal key={pair} delay={i * 80}>
              <div className="liquid-glass rounded-2xl p-5 sm:p-6 flex items-center justify-between hover:bg-white/[0.03] transition-colors">
                <div>
                  <p className="text-foreground font-semibold text-sm sm:text-base">{pair}</p>
                  <p className="text-hero-heading text-lg sm:text-xl font-semibold tracking-tight mt-1">{price}</p>
                </div>
                <span className={cn('text-xs sm:text-sm font-medium px-3 py-1.5 rounded-full', up ? 'bg-violet-500/10 text-violet-400' : 'bg-red-500/10 text-red-400')}>{change}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function AssetClassesSection() {
  return (
    <section className="py-16 sm:py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <Reveal className="text-center mb-10 sm:mb-16">
          <div className="inline-flex items-center gap-2 liquid-glass rounded-full px-4 py-2 mb-5 sm:mb-6">
            <span className="text-sm text-foreground/70">Asset Classes</span>
          </div>
          <h2 className="text-hero-heading text-2xl sm:text-5xl font-semibold leading-tight">Trade What Moves<br />the World</h2>
          <p className="text-muted-foreground text-base sm:text-lg mt-4 max-w-xl mx-auto">Six distinct asset classes, one account. Diversify your strategy without switching platforms.</p>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {ASSET_CLASSES.map(({ icon: Icon, label, pairs, spread, leverage, desc }, i) => (
            <Reveal key={label} delay={i * 80}>
              <div className="liquid-glass rounded-3xl p-6 sm:p-7 flex flex-col gap-4 hover:bg-white/[0.03] transition-colors">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)' }}>
                    <Icon className="w-5 h-5" style={{ color: '#a78bfa' }} strokeWidth={1.5} />
                  </div>
                  <span className="text-xs text-muted-foreground liquid-glass rounded-full px-3 py-1">{pairs}</span>
                </div>
                <h3 className="text-hero-heading text-lg sm:text-xl font-semibold">{label}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
                <div className="pt-4 border-t border-border/40 grid grid-cols-2 gap-3">
                  <div><p className="text-xs text-muted-foreground">Spread</p><p className="text-foreground text-sm font-medium mt-0.5">{spread}</p></div>
                  <div><p className="text-xs text-muted-foreground">Leverage</p><p className="text-foreground text-sm font-medium mt-0.5">{leverage}</p></div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
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
            <h2 className="text-hero-heading text-2xl sm:text-5xl font-semibold leading-tight">Access Every Market<br />From One Account</h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-md">Open a free account in minutes and start trading 500+ instruments with the tightest spreads in the industry.</p>
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              <Button variant="hero" onClick={() => window.location.href='/register'}>Open Free Account</Button>
              <Button variant="heroSecondary">Compare Instruments</Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export function MarketsPage() {
  return (
    <div className="min-h-screen text-foreground overflow-x-hidden" style={{ background: 'hsl(260 87% 2%)', position: 'relative' }}>
      <PageBackground />
      <HeroSection />
      <ConditionsBar />
      <LiveTickerSection />
      <AssetClassesSection />
      <CTASection />
      <Footer />
    </div>
  )
}
