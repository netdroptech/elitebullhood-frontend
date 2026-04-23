import { Button } from '@/components/ui/button'
import { Reveal } from '@/components/ui/Reveal'
import { useHlsVideo } from '@/hooks/useHlsVideo'
import { cn } from '@/lib/utils'

const HLS_SRC = 'https://stream.mux.com/f0001qPDy00mvqP023lqK3lWx31uHvxirFCHK1yNLczzqxY.m3u8'

const STATS = [
  { value: '500+',    label: 'tradable instruments' },
  { value: '0.0 pips', label: 'spreads from' },
  { value: '1:500',   label: 'max leverage' },
  { value: '24/7',    label: 'market access' },
]

export function ReverseChessSection() {
  const videoRef = useHlsVideo(HLS_SRC)

  return (
    <section className="py-20 sm:py-32 px-4">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
        {/* Left — Content */}
        <Reveal direction="right" className="order-2 lg:order-1">
          <div className="flex flex-col gap-5 sm:gap-6">
            <div className="inline-flex items-center gap-2 liquid-glass rounded-full px-4 py-2 w-fit">
              <span className="text-sm text-foreground/70">Multi-Asset Trading</span>
              <span className="flex items-center gap-1 bg-secondary rounded-full px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                Pro
              </span>
            </div>

            <h2 className="text-hero-heading text-3xl sm:text-5xl font-semibold leading-tight">
              Trade Any Market,<br />Any Time
            </h2>

            <p className="text-muted-foreground text-base leading-relaxed max-w-md">
              Access forex, crypto, stocks, commodities, and indices — all from a single account. Diversify your portfolio and seize opportunities across every major market, around the clock.
            </p>

            <div className="grid grid-cols-2 gap-4 mt-2">
              {STATS.map(({ value, label }, i) => (
                <Reveal key={label} delay={i * 80}>
                  <div className={cn('liquid-glass rounded-2xl p-4')}>
                    <p className="text-hero-heading text-2xl font-semibold">{value}</p>
                    <p className="text-muted-foreground text-xs mt-1">{label}</p>
                  </div>
                </Reveal>
              ))}
            </div>

            <div className="mt-2">
              <Button variant="hero">Explore All Markets</Button>
            </div>
          </div>
        </Reveal>

        {/* Right — Video */}
        <Reveal direction="left" delay={100} className="order-1 lg:order-2">
          <div className="liquid-glass rounded-3xl aspect-[4/3] overflow-hidden">
            <video ref={videoRef} className="w-full h-full object-cover" muted loop playsInline autoPlay />
          </div>
        </Reveal>
      </div>
    </section>
  )
}
