import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { usePlatformName } from '@/context/PlatformNameContext'
import { Footer } from '@/components/ui/Footer'
import { Reveal } from '@/components/ui/Reveal'
import { useHlsVideo } from '@/hooks/useHlsVideo'
import { cn } from '@/lib/utils'

const HLS_SRC = 'https://stream.mux.com/tLkHO1qZoaaQOUeVWo8hEBeGQfySP02EPS02BmnNFyXys.m3u8'
const SUPPORT_EMAIL = 'support@elitebullhood.com'

function CTASection() {
  const { platformName } = usePlatformName()
  const navigate = useNavigate()
  return (
    <div className="relative z-10 py-24 sm:py-32 px-4">
      <div className="max-w-4xl mx-auto">
        <Reveal>
          <div className={cn('liquid-glass rounded-[2rem] p-8 sm:p-20 text-center flex flex-col items-center gap-6')}>
            <h2 className="text-hero-heading text-3xl sm:text-5xl font-semibold leading-tight">
              Ready to Start<br />Trading Smarter?
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-md">
              {platformName} — Join 850,000+ traders accessing global markets. Open your account in minutes — no hidden fees.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              <Button variant="hero" onClick={() => navigate('/register')}>Start Free Today</Button>
              <Button
                variant="heroSecondary"
                onClick={() => { window.location.href = `mailto:${SUPPORT_EMAIL}` }}
              >
                Talk to Sales
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  )
}

export function CTAFooterWrapper() {
  const videoRef = useHlsVideo(HLS_SRC)

  return (
    <div className="relative w-full overflow-hidden">
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted loop playsInline autoPlay />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, hsl(260 87% 3%) 0%, hsl(260 87% 3% / 0.85) 15%, hsl(260 87% 3% / 0.4) 40%, hsl(260 87% 3% / 0.15) 60%, hsl(260 87% 3% / 0.3) 100%)' }}
      />
      <CTASection />
      <Footer />
    </div>
  )
}
