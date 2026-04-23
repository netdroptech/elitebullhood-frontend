import { useState } from 'react'
import { usePlatformName } from '@/context/PlatformNameContext'
import { BookOpen, Video, GraduationCap, TrendingUp, BarChart2, Shield, ChevronDown } from 'lucide-react'
import { PageBackground } from '@/components/ui/PageBackground'
import { Navbar } from '@/components/ui/Navbar'
import { Footer } from '@/components/ui/Footer'
import { Button } from '@/components/ui/button'
import { Reveal } from '@/components/ui/Reveal'
import { cn } from '@/lib/utils'

const LEARNING_PATHS = [
  { icon: BookOpen,      level: 'Beginner',     tag: '12 lessons', title: 'Trading Foundations',       desc: 'Start from scratch. Understand how markets work, what drives price, and how to place your first trade safely.',                            topics: ['How financial markets work', 'Reading a price chart', 'Understanding bid/ask & spread', 'Your first demo trade'] },
  { icon: TrendingUp,    level: 'Intermediate', tag: '18 lessons', title: 'Technical Analysis',         desc: 'Master the tools professionals use to read charts, identify trends, and time entries and exits with precision.',                         topics: ['Support & resistance levels', 'Moving averages & momentum', 'Candlestick patterns', 'Risk/reward & position sizing'] },
  { icon: GraduationCap, level: 'Advanced',     tag: '24 lessons', title: 'Professional Strategies',   desc: 'Deep-dive into institutional strategies, market microstructure, and the psychology of consistent performance.',                           topics: ['Order flow & market microstructure', 'Multi-timeframe analysis', 'Portfolio & correlation management', 'Building a trading edge'] },
]

const GUIDES = [
  { category: 'Forex',       title: 'What Moves Currency Pairs?',      readTime: '6 min read', desc: 'Central bank policy, inflation data, and geopolitical events — the macro forces behind every forex move.' },
  { category: 'Crypto',      title: 'Bitcoin Halving Explained',        readTime: '5 min read', desc: 'What the halving cycle means for supply, demand, and historical price patterns in the crypto market.' },
  { category: 'Risk',        title: 'Position Sizing & the 1% Rule',   readTime: '4 min read', desc: 'Why the most successful traders risk no more than 1% per trade — and how to calculate your position size.' },
  { category: 'Psychology',  title: 'Overcoming Loss Aversion',        readTime: '7 min read', desc: 'The cognitive biases that cost traders money and evidence-based techniques to trade more rationally.' },
  { category: 'Indices',     title: 'Trading the S&P 500',             readTime: '5 min read', desc: 'How index composition, earnings seasons, and Fed policy shape the world\'s most followed equity index.' },
  { category: 'Commodities', title: 'Gold as a Safe Haven',            readTime: '4 min read', desc: 'The relationship between gold, the US dollar, real interest rates, and global risk sentiment.' },
]

const VIDEO_COURSES = [
  { icon: Video,    title: 'Chart Reading Masterclass',      lessons: 8,  duration: '2h 40m', desc: 'A step-by-step video walkthrough covering every chart type, timeframe strategy, and pattern recognition technique.' },
  { icon: BarChart2,title: 'Trading Forex from Scratch',     lessons: 10, duration: '3h 15m', desc: 'Everything you need to trade currency markets — from session timing and economic calendars to live trade walkthroughs.' },
  { icon: Shield,   title: 'Risk Management in Practice',    lessons: 6,  duration: '1h 55m', desc: 'Real trades, real scenarios. Learn how to size positions, set stops, and manage drawdown through live examples.' },
]


function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="liquid-glass rounded-2xl overflow-hidden" style={{ maxHeight: open ? '500px' : '64px', transition: 'max-height 0.35s ease' }}>
      <button className="w-full flex items-center justify-between px-5 sm:px-6 py-4 text-left gap-4" onClick={() => setOpen(!open)}>
        <span className="text-foreground text-sm font-medium">{q}</span>
        <ChevronDown className={cn('w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-300', open && 'rotate-180')} strokeWidth={2} />
      </button>
      <div className="px-5 sm:px-6 pb-5 text-muted-foreground text-sm leading-relaxed">{a}</div>
    </div>
  )
}

function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden pt-6 pb-24 sm:pb-32">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(167,139,250,0.07) 0%, transparent 70%)' }} />
      <Navbar />
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center pt-20 sm:pt-24">
        <Reveal>
          <div className="inline-flex items-center gap-2 liquid-glass rounded-full px-4 py-2 mb-6 sm:mb-8">
            <span className="text-sm text-foreground/70">60+ Free Lessons</span>
            <span className="w-1 h-1 rounded-full" style={{ background: 'var(--primary-gradient)' }} />
            <span className="text-sm text-foreground/50">All Skill Levels</span>
          </div>
          <h1 className="text-hero-heading text-[2rem] sm:text-[3.5rem] lg:text-[4.5rem] font-semibold leading-[1.05] tracking-tight">
            Learn to Trade.<br /><span className="text-primary-gradient">Completely Free.</span>
          </h1>
          <p className="text-hero-sub text-base sm:text-lg max-w-2xl mx-auto mt-5 sm:mt-6 opacity-80 leading-relaxed">
            From your very first chart to advanced professional strategies — a structured curriculum built by traders, for traders.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-7 sm:mt-8">
            <Button variant="hero">Start Learning Free</Button>
            <Button variant="heroSecondary">Browse All Courses</Button>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function LearningPathsSection() {
  return (
    <section className="py-16 sm:py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <Reveal className="text-center mb-10 sm:mb-16">
          <div className="inline-flex items-center gap-2 liquid-glass rounded-full px-4 py-2 mb-5 sm:mb-6">
            <span className="text-sm text-foreground/70">Structured Curriculum</span>
          </div>
          <h2 className="text-hero-heading text-2xl sm:text-5xl font-semibold leading-tight">Three Paths.<br />One Destination.</h2>
          <p className="text-muted-foreground text-base sm:text-lg mt-4 max-w-xl mx-auto">Pick the learning path that matches your current level and progress at your own pace.</p>
        </Reveal>
        <div className="grid sm:grid-cols-3 gap-5 sm:gap-6">
          {LEARNING_PATHS.map(({ icon: Icon, level, tag, title, desc, topics }, i) => (
            <Reveal key={title} delay={i * 100}>
              <div className="liquid-glass rounded-3xl p-7 sm:p-8 flex flex-col gap-5 sm:gap-6">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)' }}>
                    <Icon className="w-6 h-6" style={{ color: '#a78bfa' }} strokeWidth={1.5} />
                  </div>
                  <span className="text-xs text-muted-foreground liquid-glass rounded-full px-3 py-1">{tag}</span>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: '#a78bfa' }}>{level}</p>
                  <h3 className="text-hero-heading text-lg sm:text-xl font-semibold">{title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mt-2">{desc}</p>
                </div>
                <ul className="flex flex-col gap-2.5">
                  {topics.map((t) => (
                    <li key={t} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: 'var(--primary-gradient)' }} />
                      {t}
                    </li>
                  ))}
                </ul>
                <Button variant="heroSecondary" className="w-full justify-center mt-auto">Start {level} Path</Button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function GuidesSection() {
  return (
    <section className="py-16 sm:py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 sm:mb-12 gap-4 sm:gap-6">
          <Reveal>
            <div>
              <div className="inline-flex items-center gap-2 liquid-glass rounded-full px-4 py-2 mb-4">
                <span className="text-sm text-foreground/70">Market Guides</span>
              </div>
              <h2 className="text-hero-heading text-2xl sm:text-4xl font-semibold leading-tight">In-Depth Guides</h2>
              <p className="text-muted-foreground text-sm sm:text-base mt-2 max-w-sm">Short, practical reads on the markets, strategies, and mindset topics that matter most.</p>
            </div>
          </Reveal>
          <Button variant="heroSecondary" className="shrink-0 self-start sm:self-auto">View All Guides</Button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {GUIDES.map(({ category, title, readTime, desc }, i) => (
            <Reveal key={title} delay={i * 80}>
              <div className="liquid-glass rounded-3xl p-6 sm:p-7 flex flex-col gap-4 hover:bg-white/[0.03] transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: 'rgba(167,139,250,0.1)', color: '#a78bfa' }}>{category}</span>
                  <span className="text-xs text-muted-foreground">{readTime}</span>
                </div>
                <h3 className="text-hero-heading text-sm sm:text-base font-semibold leading-snug">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function VideoCoursesSection() {
  return (
    <section className="py-16 sm:py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <Reveal className="text-center mb-10 sm:mb-16">
          <div className="inline-flex items-center gap-2 liquid-glass rounded-full px-4 py-2 mb-5 sm:mb-6">
            <span className="text-sm text-foreground/70">Video Library</span>
          </div>
          <h2 className="text-hero-heading text-2xl sm:text-5xl font-semibold leading-tight">Learn by Watching</h2>
          <p className="text-muted-foreground text-base sm:text-lg mt-4 max-w-xl mx-auto">Step-by-step video courses with live trade examples, chart walkthroughs, and real-world application.</p>
        </Reveal>
        <div className="grid sm:grid-cols-3 gap-5 sm:gap-6">
          {VIDEO_COURSES.map(({ icon: Icon, title, lessons, duration, desc }, i) => (
            <Reveal key={title} delay={i * 100}>
              <div className="liquid-glass rounded-3xl p-7 sm:p-8 flex flex-col gap-5 hover:bg-white/[0.03] transition-colors">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)' }}>
                  <Icon className="w-6 h-6" style={{ color: '#a78bfa' }} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-hero-heading text-base sm:text-lg font-semibold">{title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mt-2">{desc}</p>
                </div>
                <div className="flex items-center gap-4 pt-4 border-t border-border/40">
                  <span className="text-xs text-muted-foreground">{lessons} lessons</span>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <span className="text-xs text-muted-foreground">{duration}</span>
                </div>
                <Button variant="heroSecondary" className="w-full justify-center">Watch Now</Button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function FAQSection() {
  const { platformName } = usePlatformName()
  const FAQS = [
    { q: 'Do I need any trading experience?',     a: 'Not at all. Our content starts from absolute zero — "what is a pip?" — and progresses all the way to advanced institutional strategies. Pick the level that matches where you are today.' },
    { q: 'Is all the educational content free?',  a: `Yes. Every lesson, guide, and video course in the Education hub is completely free for all ${platformName} account holders. Simply sign up for a free account to access everything.` },
    { q: 'Can I practise without risking money?', a: 'Absolutely. Every lesson is paired with a link to open a demo account pre-loaded with virtual funds. Apply any technique in a real market environment without any financial risk.' },
    { q: 'How often is new content added?',       a: 'We publish new guides and market analysis articles weekly. Video courses are updated quarterly to reflect current market conditions and feedback from our trading community.' },
    { q: 'Is there a certificate on completion?', a: 'Yes — completing a full learning path earns you a downloadable certificate of completion that you can share on your professional profile.' },
  ]
  return (
    <section className="py-16 sm:py-24 px-4">
      <div className="max-w-3xl mx-auto">
        <Reveal className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 liquid-glass rounded-full px-4 py-2 mb-5 sm:mb-6">
            <span className="text-sm text-foreground/70">Got Questions?</span>
          </div>
          <h2 className="text-hero-heading text-2xl sm:text-4xl font-semibold leading-tight">Frequently Asked</h2>
        </Reveal>
        <div className="flex flex-col gap-3">
          {FAQS.map(({ q, a }, i) => (
            <Reveal key={q} delay={i * 60}><FAQItem q={q} a={a} /></Reveal>
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
            <h2 className="text-hero-heading text-2xl sm:text-5xl font-semibold leading-tight">Start Learning.<br />Start Trading.</h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-md">Create a free account to unlock every course, guide, and video — plus a practice demo account.</p>
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              <Button variant="hero">Create Free Account</Button>
              <Button variant="heroSecondary">Browse Curriculum</Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export function EducationPage() {
  const { platformName } = usePlatformName()
  return (
    <div className="min-h-screen text-foreground overflow-x-hidden" style={{ background: 'hsl(260 87% 2%)', position: 'relative' }}>
      <PageBackground />
      <HeroSection />
      <LearningPathsSection />
      <GuidesSection />
      <VideoCoursesSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  )
}
