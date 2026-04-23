import { useNavigate } from 'react-router-dom'
import { usePlatformName } from '@/context/PlatformNameContext'
import { useState, useEffect } from 'react'
import { Shield, Globe, Zap, Users, TrendingUp, Lock } from 'lucide-react'
import { PageBackground } from '@/components/ui/PageBackground'
import { Navbar } from '@/components/ui/Navbar'
import { Footer } from '@/components/ui/Footer'
import { Button } from '@/components/ui/button'
import { Reveal } from '@/components/ui/Reveal'
import { cn } from '@/lib/utils'

const API_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api').replace('/api', '')

const STATS = [
  { value: '$2.1B',  label: 'Daily trading volume' },
  { value: '850K+',  label: 'Active traders globally' },
  { value: '500+',   label: 'Tradable instruments' },
  { value: '99.98%', label: 'Platform uptime' },
]

const VALUES = [
  { icon: Shield,     title: 'Trust & Transparency',  desc: 'We operate with full regulatory compliance and hold client funds in segregated accounts. Every transaction is auditable and every fee is disclosed upfront.' },
  { icon: Zap,        title: 'Speed & Precision',     desc: 'Sub-millisecond order execution and real-time data feeds ensure you always trade at the price you see — never the price you didn\'t expect.' },
  { icon: Globe,      title: 'Global Access',         desc: 'From forex and crypto to commodities and indices, we give traders in over 150 countries access to the markets that matter most to them.' },
  { icon: Users,      title: 'Built for Everyone',    desc: 'Whether you\'re placing your first trade or managing a multi-million dollar portfolio, our platform scales with you — without compromising on power.' },
  { icon: TrendingUp, title: 'Continuous Innovation', desc: 'Our engineering team ships improvements every week. We listen to traders, move fast, and build tools that give our users a genuine edge in the market.' },
  { icon: Lock,       title: 'Bank-Grade Security',   desc: 'Two-factor authentication, end-to-end encryption, and 24/7 infrastructure monitoring protect your account and funds around the clock.' },
]

// No static fallback — team is managed entirely from the admin panel

function HeroSection() {
  const { platformName } = usePlatformName()
  return (
    <section className="relative w-full overflow-hidden pt-6 pb-24 sm:pb-32">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(167,139,250,0.08) 0%, transparent 70%)' }} />
      <Navbar />
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center pt-20 sm:pt-24">
        <Reveal>
          <div className="inline-flex items-center gap-2 liquid-glass rounded-full px-4 py-2 mb-6 sm:mb-8">
            <span className="text-sm text-foreground/70">Who We Are</span>
            <span className="w-1 h-1 rounded-full bg-primary" style={{ background: 'var(--primary-gradient)' }} />
            <span className="text-sm text-foreground/50">Our Story</span>
          </div>
          <h1 className="text-hero-heading text-[2rem] sm:text-[3.5rem] lg:text-[4.5rem] font-semibold leading-[1.05] tracking-tight">
            We're Building the<br /><span className="text-primary-gradient">Future of Trading</span>
          </h1>
          <p className="text-hero-sub text-base sm:text-lg max-w-2xl mx-auto mt-5 sm:mt-6 opacity-80 leading-relaxed">
            {platformName} was founded by traders, engineers, and compliance experts who were frustrated by the status quo — slow platforms, opaque fees, and tools that couldn't keep up. We set out to build something better.
          </p>
        </Reveal>
      </div>
    </section>
  )
}

function StatsSection() {
  return (
    <section className="py-10 sm:py-16 px-4">
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {STATS.map(({ value, label }, i) => (
          <Reveal key={label} delay={i * 80}>
            <div className="liquid-glass rounded-2xl p-5 sm:p-6 text-center">
              <p className="text-hero-heading text-2xl sm:text-4xl font-semibold tracking-tight">{value}</p>
              <p className="text-muted-foreground text-xs sm:text-sm mt-2">{label}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function MissionSection() {
  const { platformName } = usePlatformName()
  return (
    <section className="py-16 sm:py-24 px-4">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <Reveal direction="right">
          <div className="flex flex-col gap-5 sm:gap-6">
            <div className="inline-flex items-center gap-2 liquid-glass rounded-full px-4 py-2 w-fit">
              <span className="text-sm text-foreground/70">Our Mission</span>
            </div>
            <h2 className="text-hero-heading text-2xl sm:text-5xl font-semibold leading-tight">
              Democratising Access<br />to Global Markets
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              For too long, professional-grade trading tools were reserved for institutions with deep pockets. We believe every trader — regardless of account size or experience — deserves the same data, the same execution speed, and the same quality of platform.
            </p>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              That's why we built {platformName}: a single platform where retail and professional traders stand on equal footing, powered by infrastructure that was once only available to the world's largest banks.
            </p>
            <Button variant="hero" className="w-fit mt-2" onClick={() => window.location.href='/register'}>Start Trading Free</Button>
          </div>
        </Reveal>

        <Reveal direction="left" delay={120}>
          <div className="relative flex flex-col gap-4">
            <div className="liquid-glass rounded-3xl p-7 sm:p-8">
              <p className="text-muted-foreground text-sm mb-3">Our commitment to clients</p>
              <p className="text-hero-heading text-base sm:text-xl font-semibold leading-snug">
                "We built this brokerage to bridge the gap between ambition and opportunity — giving every client a fair, transparent, and powerful path to grow their wealth."
              </p>
              <div className="flex items-center gap-3 mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-border/40">
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold text-foreground/80" style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa' }}>AC</div>
                <div>
                  <p className="text-foreground text-sm font-medium">{platformName}</p>
                  <p className="text-muted-foreground text-xs">Global Investment Brokerage</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="liquid-glass rounded-2xl p-5">
                <p className="text-hero-heading text-2xl font-semibold">2019</p>
                <p className="text-muted-foreground text-xs mt-1">Year founded</p>
              </div>
              <div className="liquid-glass rounded-2xl p-5">
                <p className="text-hero-heading text-2xl font-semibold">150+</p>
                <p className="text-muted-foreground text-xs mt-1">Countries served</p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function ValuesSection() {
  return (
    <section className="py-16 sm:py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <Reveal className="text-center mb-10 sm:mb-16">
          <div className="inline-flex items-center gap-2 liquid-glass rounded-full px-4 py-2 mb-5 sm:mb-6">
            <span className="text-sm text-foreground/70">What Drives Us</span>
          </div>
          <h2 className="text-hero-heading text-2xl sm:text-5xl font-semibold leading-tight">Our Core Values</h2>
          <p className="text-muted-foreground text-base sm:text-lg mt-4 max-w-xl mx-auto">
            Every decision we make — from product to policy — comes back to these six principles.
          </p>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {VALUES.map(({ icon: Icon, title, desc }, i) => (
            <Reveal key={title} delay={i * 80}>
              <div className={cn('liquid-glass rounded-3xl p-6 sm:p-7 flex flex-col gap-4 hover:bg-white/[0.03] transition-colors')}>
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

function TeamSection() {
  const [team,   setTeam]   = useState<any[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const API = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'
    fetch(`${API}/admin/public/team`)
      .then(r => r.json())
      .then(res => {
        if (res?.data?.length) setTeam(res.data)
      })
      .catch(() => {/* keep fallback */})
      .finally(() => setLoaded(true))
  }, [])

  return (
    <section className="py-16 sm:py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <Reveal className="text-center mb-10 sm:mb-16">
          <div className="inline-flex items-center gap-2 liquid-glass rounded-full px-4 py-2 mb-5 sm:mb-6">
            <span className="text-sm text-foreground/70">The People Behind It</span>
          </div>
          <h2 className="text-hero-heading text-2xl sm:text-5xl font-semibold leading-tight">Meet the Leadership Team</h2>
          <p className="text-muted-foreground text-base sm:text-lg mt-4 max-w-xl mx-auto">
            Traders, engineers, and compliance experts — united by a single mission.
          </p>
        </Reveal>
        {loaded && team.length === 0 ? null : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {team.map((member: any, i: number) => {
            const photoSrc = member.photoUrl
              ? (member.photoUrl.startsWith('http') ? member.photoUrl : `${API_BASE}${member.photoUrl}`)
              : null

            return (
              <Reveal key={member.id || member.name} delay={i * 80}>
                <div className="liquid-glass rounded-3xl p-5 sm:p-6 flex flex-col gap-3 sm:gap-4 hover:bg-white/[0.03] transition-colors">
                  {/* Avatar: photo or initials */}
                  {photoSrc ? (
                    <img
                      src={photoSrc}
                      alt={member.name}
                      className="w-14 h-14 rounded-2xl object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-base sm:text-lg font-semibold shrink-0" style={{ background: 'var(--primary-gradient)', color: '#050505' }}>
                      {member.initials || member.name?.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-hero-heading text-sm sm:text-base font-semibold">{member.name}</p>
                    <p className="text-xs sm:text-sm mt-0.5" style={{ color: '#a78bfa' }}>{member.role}</p>
                  </div>
                  {member.bio && (
                    <p className="text-muted-foreground text-xs leading-relaxed">{member.bio}</p>
                  )}
                </div>
              </Reveal>
            )
          })}
        </div>
        )}
      </div>
    </section>
  )
}

function CTASection() {
  const { platformName } = usePlatformName()
  return (
    <section className="py-16 sm:py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <Reveal>
          <div className="liquid-glass rounded-[2rem] p-8 sm:p-20 text-center flex flex-col items-center gap-6">
            <h2 className="text-hero-heading text-2xl sm:text-5xl font-semibold leading-tight">Ready to Trade<br />with an Edge?</h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-md">Join 850,000+ traders who chose {platformName} for speed, transparency, and access to global markets.</p>
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              <Button variant="hero" onClick={() => window.location.href='/register'}>Open Free Account</Button>
              <Button variant="heroSecondary" onClick={() => window.location.href='/support'}>Contact Sales</Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export function AboutPage() {
  return (
    <div className="min-h-screen text-foreground overflow-x-hidden" style={{ background: 'hsl(260 87% 2%)', position: 'relative' }}>
      <PageBackground />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <HeroSection />
        <StatsSection />
        <MissionSection />
        <ValuesSection />
        <TeamSection />
        <CTASection />
        <Footer />
      </div>
    </div>
  )
}
