import { ChevronRight } from 'lucide-react'
import { useHlsVideo } from '@/hooks/useHlsVideo'
import { Reveal } from '@/components/ui/Reveal'
import { cn } from '@/lib/utils'

const HLS_SRC = 'https://stream.mux.com/Jwr2RhmsNrd6GEspBNgm02vJsRZAGlaoQIh4AucGdASw.m3u8'

const FEATURES = [
  {
    title: 'Real-Time Market Data',
    desc: 'Stream live price feeds, order book depth, and trade history across hundreds of instruments — with sub-millisecond latency and zero data gaps.',
    statValue: '<1ms',
    statLabel: 'avg. data latency',
  },
  {
    title: 'Advanced Charting',
    desc: 'Professional-grade charts with 100+ technical indicators, multi-timeframe analysis, and fully customisable layouts built for serious traders.',
    statValue: '100+',
    statLabel: 'technical indicators',
  },
  {
    title: 'Regulated & Secure',
    desc: 'Fully licensed and compliant with international financial regulations. Your funds are held in segregated accounts with bank-grade encryption.',
    statValue: '100%',
    statLabel: 'segregated client funds',
  },
]

function FeatureCard({ title, desc, statValue, statLabel }: (typeof FEATURES)[0]) {
  return (
    <div className={cn('liquid-glass rounded-3xl p-8 flex flex-col gap-4 hover:bg-white/[0.03] transition-colors')}>
      <h3 className="text-hero-heading text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed flex-1">{desc}</p>
      <div className="border-t border-border/50 pt-4 mt-2">
        <p className="text-hero-heading text-2xl font-semibold">{statValue}</p>
        <p className="text-muted-foreground text-sm mt-0.5">{statLabel}</p>
      </div>
    </div>
  )
}

export function FeaturesSection() {
  const videoRef = useHlsVideo(HLS_SRC)

  return (
    <section className="relative w-full overflow-hidden py-24 sm:py-32">
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted loop playsInline autoPlay />
      <div className="absolute top-0 left-0 right-0 pointer-events-none" style={{ height: '40%', background: 'linear-gradient(to bottom, hsl(var(--background)) 0%, hsl(var(--background) / 0.8) 60%, transparent 100%)' }} />
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ height: '40%', background: 'linear-gradient(to top, hsl(var(--background)) 0%, hsl(var(--background) / 0.8) 60%, transparent 100%)' }} />
      <div className="absolute inset-0 bg-background/40 pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <Reveal className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 liquid-glass rounded-full px-4 py-2 mb-6">
            <span className="text-sm text-foreground/70">Platform Features</span>
            <span className="flex items-center gap-1 text-sm text-foreground/50">
              Overview <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.5} />
            </span>
          </div>
          <h2 className="text-hero-heading text-3xl sm:text-5xl font-semibold leading-tight">
            Everything You Need<br />to Trade at Your Best
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg mt-4 max-w-xl mx-auto">
            Three core pillars that give you the edge — whether you're placing your first trade or managing a professional portfolio.
          </p>
        </Reveal>

        {/* Cards — staggered */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 120}>
              <FeatureCard {...f} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
