import { ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Reveal } from '@/components/ui/Reveal'
import { useHlsVideo } from '@/hooks/useHlsVideo'
import { cn } from '@/lib/utils'

const HLS_SRC = 'https://stream.mux.com/1CCfG6mPC7LbMOAs6iBOfPeNd3WaKlZuHuKHp00G62j8.m3u8'

const BULLETS = [
  'One-click execution across spot, margin & futures',
  'Instant order fills with best-price routing',
  'Stop-loss, take-profit & trailing orders built in',
]

export function ChessSection() {
  const videoRef = useHlsVideo(HLS_SRC)

  return (
    <section className="py-20 sm:py-32 px-4">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
        {/* Left — Video */}
        <Reveal direction="right">
          <div className={cn('liquid-glass rounded-3xl aspect-[4/3] overflow-hidden')}>
            <video ref={videoRef} className="w-full h-full object-cover" muted loop playsInline autoPlay />
          </div>
        </Reveal>

        {/* Right — Content */}
        <Reveal direction="left" delay={100}>
          <div className="flex flex-col gap-5 sm:gap-6">
            <div className="inline-flex items-center gap-2 liquid-glass rounded-full px-4 py-2 w-fit">
              <span className="text-sm text-foreground/70">Smart Order Execution</span>
              <span className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium text-primary-foreground bg-primary-gradient">
                New
              </span>
            </div>

            <h2 className="text-hero-heading text-3xl sm:text-5xl font-semibold leading-tight">
              Execute Trades<br />With Precision & Speed
            </h2>

            <p className="text-muted-foreground text-base leading-relaxed max-w-md">
              Our intelligent order routing engine finds the best available price across liquidity pools in real time — so every trade you place is executed at the optimal rate, with minimal slippage.
            </p>

            <ul className="flex flex-col gap-3">
              {BULLETS.map((item) => (
                <li key={item} className="flex items-center gap-3 text-foreground/80 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--primary-gradient)' }} />
                  {item}
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-3 mt-2">
              <Button variant="hero">Start Trading</Button>
              <Button variant="heroSecondary">
                View Order Types <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
