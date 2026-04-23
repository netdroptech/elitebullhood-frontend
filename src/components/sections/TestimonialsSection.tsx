import { Reveal } from '@/components/ui/Reveal'
import { cn } from '@/lib/utils'

const TESTIMONIALS = [
  {
    initials: 'JM',
    name: 'James Mercer',
    role: 'Full-Time Forex Trader',
    quote: "I've traded on a dozen platforms over the years. The execution speed here is in a different league — I'm consistently getting fills at the price I want, even during high-volatility events.",
  },
  {
    initials: 'AL',
    name: 'Aisha Lennox',
    role: 'Crypto Portfolio Manager',
    quote: "The charting tools and real-time data feeds gave me everything I needed to move from a casual investor to actively managing a seven-figure portfolio. The platform just gets out of your way.",
  },
  {
    initials: 'RP',
    name: 'Rafael Pinto',
    role: 'Proprietary Trader, São Paulo',
    quote: "Ultra-tight spreads, deep liquidity, and a support team that actually understands trading. I moved my entire operation here six months ago and haven't looked back.",
  },
]

function TestimonialCard({ initials, name, role, quote, offset }: (typeof TESTIMONIALS)[0] & { offset?: boolean }) {
  return (
    <div className={cn('liquid-glass rounded-3xl p-8 flex flex-col gap-6', offset && 'md:-translate-y-6')}>
      <p className="text-foreground/80 text-sm leading-relaxed flex-1">&ldquo;{quote}&rdquo;</p>
      <div className="border-t border-border/50" />
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold text-foreground/80 shrink-0">
          {initials}
        </div>
        <div>
          <p className="text-foreground text-sm font-medium">{name}</p>
          <p className="text-muted-foreground text-xs mt-0.5">{role}</p>
        </div>
      </div>
    </div>
  )
}

export function TestimonialsSection() {
  return (
    <section className="py-20 sm:py-32 px-4">
      <div className="max-w-6xl mx-auto">
        <Reveal className="text-center mb-12 sm:mb-16">
          <h2 className="text-hero-heading text-3xl sm:text-5xl font-semibold leading-tight">
            Trusted by Traders<br />Around the World
          </h2>
          <p className="text-muted-foreground text-lg mt-4">Hear from the traders who made the switch.</p>
        </Reveal>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6 items-start">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i * 120}>
              <TestimonialCard {...t} offset={i === 1} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
