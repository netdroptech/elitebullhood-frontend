import { useHlsVideo } from '@/hooks/useHlsVideo'
import { Reveal } from '@/components/ui/Reveal'
import { cn } from '@/lib/utils'

const HLS_SRC = 'https://stream.mux.com/Kec29dVyJgiPdtWaQtPuEiiGHkJIYQAVUJcNiIHUYeo.m3u8'

export function NumbersSection() {
  const videoRef = useHlsVideo(HLS_SRC)

  return (
    <section className="relative w-full overflow-hidden">
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted loop playsInline autoPlay />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to top, hsl(260 87% 3%) 0%, hsl(260 87% 3% / 0.85) 15%, hsl(260 87% 3% / 0.4) 40%, hsl(260 87% 3% / 0.15) 60%, hsl(260 87% 3% / 0.3) 100%)' }}
      />

      <div className="relative z-10 py-24 sm:py-32 px-4">
        <div className="max-w-6xl mx-auto flex flex-col items-center">
          {/* Hero metric */}
          <Reveal className="text-center mb-16 sm:mb-24">
            <p className={cn('text-hero-heading font-semibold tracking-tighter leading-none', 'text-6xl sm:text-[8rem] lg:text-[10rem]')}>
              $2.1B
            </p>
            <p className="text-hero-sub text-xl sm:text-2xl font-medium mt-4">Daily trading volume</p>
            <p className="text-muted-foreground text-base mt-3 max-w-sm mx-auto">
              Trusted by traders worldwide to move serious capital across global markets every day.
            </p>
          </Reveal>

          {/* Two bottom metrics */}
          <Reveal delay={150} className="w-full max-w-3xl">
            <div className={cn('liquid-glass rounded-3xl p-8 sm:p-12 grid md:grid-cols-2')}>
              <div className="text-center py-4 md:pr-8">
                <p className="text-hero-heading text-5xl sm:text-6xl font-semibold tracking-tight">850K+</p>
                <p className="text-muted-foreground text-sm mt-3">Active traders globally</p>
              </div>
              <div className="text-center py-4 md:pl-8 md:border-l border-t md:border-t-0 border-border/50 mt-4 pt-4 md:mt-0 md:pt-0">
                <p className="text-hero-heading text-5xl sm:text-6xl font-semibold tracking-tight">99.98%</p>
                <p className="text-muted-foreground text-sm mt-3">Platform uptime</p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
