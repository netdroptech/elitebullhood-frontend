import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/ui/Navbar'
import { cn } from '@/lib/utils'

const PAIRS = [
  { label: 'BTC/USDT',  price: '103,247.50', change: '+2.34', up: true,  color: '#f7931a' },
  { label: 'ETH/USDT',  price: '3,891.22',   change: '+1.78', up: true,  color: '#627eea' },
  { label: 'SOL/USDT',  price: '182.64',      change: '-0.95', up: false, color: '#9945ff' },
  { label: 'BNB/USDT',  price: '712.10',      change: '+0.63', up: true,  color: '#f3ba2f' },
  { label: 'XRP/USDT',  price: '0.5841',      change: '-1.22', up: false, color: '#346aa9' },
  { label: 'ADA/USDT',  price: '0.4512',      change: '+3.05', up: true,  color: '#4b9cd3' },
  { label: 'DOGE/USDT', price: '0.1823',      change: '+5.41', up: true,  color: '#c2a633' },
  { label: 'AVAX/USDT', price: '38.92',       change: '-2.17', up: false, color: '#e84142' },
]
const PAIRS_DOUBLED = [...PAIRS, ...PAIRS]

// Hero background video — local rotating globe
const HERO_VIDEO = '/videos/rotating_globe.mp4'

// No external poster needed — the first frame of the local video loads instantly
const HERO_POSTER = ''

function AnnouncementBadge() {
  return (
    <div className={cn('liquid-glass rounded-full flex items-center gap-2 px-4 py-2 text-sm text-foreground/80')}>
      <span className="text-primary-gradient font-medium">Nova+ Launched!</span>
      <span className="flex items-center gap-1 bg-white/10 rounded-full px-2.5 py-0.5 text-xs font-medium text-foreground/70">
        Explore <ChevronRight className="w-3 h-3" strokeWidth={2.5} />
      </span>
    </div>
  )
}

function SocialProofBar() {
  return (
    <div className="relative z-10 w-full flex items-center gap-8 px-6 py-6 overflow-hidden">
      <div className="shrink-0 text-sm text-foreground/50 leading-snug">
        Live markets<br />available now
      </div>
      <div className="flex-1 overflow-hidden relative">
        <div className="absolute left-0 top-0 bottom-0 w-12 z-10 pointer-events-none bg-gradient-to-r from-background to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none bg-gradient-to-l from-background to-transparent" />
        <div className="flex animate-marquee whitespace-nowrap gap-3">
          {PAIRS_DOUBLED.map(({ label, price, change, up, color }, i) => (
            <div key={`${label}-${i}`} className="flex items-center gap-3 shrink-0 liquid-glass rounded-full px-4 py-2">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span className="text-sm font-semibold text-foreground/80 tracking-wide">{label}</span>
              <span className="text-sm text-foreground/50 font-mono">${price}</span>
              <span
                className="text-xs font-semibold px-1.5 py-0.5 rounded-md"
                style={{
                  color: up ? '#a78bfa' : '#f87171',
                  backgroundColor: up ? 'rgba(167,139,250,0.12)' : 'rgba(248,113,113,0.12)',
                }}
              >
                {change}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function HeroSection() {
  const navigate = useNavigate()
  return (
    <section className="relative w-full min-h-screen flex flex-col overflow-hidden">
      <video
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster={HERO_POSTER}
      >
        <source src={HERO_VIDEO} type="video/mp4" />
      </video>

      {/* Purple gradient overlay — multi-layer to keep the globe visible while
          washing the scene in brand purple/violet/cyan. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 50% 40%, rgba(139,92,246,0.28) 0%, rgba(139,92,246,0.12) 35%, transparent 65%), radial-gradient(ellipse 60% 50% at 15% 30%, rgba(168,85,247,0.32) 0%, transparent 60%), radial-gradient(ellipse 60% 55% at 85% 70%, rgba(34,211,238,0.18) 0%, transparent 60%), linear-gradient(180deg, rgba(30,15,60,0.55) 0%, rgba(20,10,45,0.65) 40%, rgba(15,8,35,0.88) 75%, hsl(260 87% 3%) 98%)',
          mixBlendMode: 'normal',
        }}
      />
      {/* Soft violet vignette at the edges */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 40%, rgba(88,28,135,0.35) 90%, rgba(30,10,50,0.75) 100%)',
        }}
      />

      <div className="relative z-10 flex flex-col flex-1 w-full">
        <Navbar />

        <div className="flex flex-col flex-1 items-center justify-center px-4 pt-20 pb-8 text-center">
          <AnnouncementBadge />
          <h1 className="mt-8 text-hero-heading text-[2rem] sm:text-[2.75rem] lg:text-[3.5rem] font-semibold leading-[1.05] tracking-tight max-w-5xl">
            Trade Smarter. Grow Faster.<br />Take Control of Your<br />Financial Future.
          </h1>
          <p className="text-hero-sub text-lg max-w-lg mt-4 opacity-80 leading-relaxed">
            Access global markets with powerful tools, real-time data, and a platform built for both beginners and professionals. Start trading with confidence today.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
            <Button variant="hero" onClick={() => navigate('/register')}>Get Started</Button>
          </div>
        </div>

        <div className="mt-auto">
          <SocialProofBar />
        </div>
      </div>
    </section>
  )
}
