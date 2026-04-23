import { useReveal } from '@/hooks/useReveal'
import { cn } from '@/lib/utils'

type Direction = 'up' | 'down' | 'left' | 'right' | 'fade'

interface RevealProps {
  children: React.ReactNode
  className?: string
  /** Delay in ms — use for staggering cards */
  delay?: number
  direction?: Direction
  threshold?: number
}

function hiddenTransform(dir: Direction): string {
  switch (dir) {
    case 'up':    return 'translateY(36px)'
    case 'down':  return 'translateY(-36px)'
    case 'left':  return 'translateX(40px)'
    case 'right': return 'translateX(-40px)'
    case 'fade':  return 'translateY(0px)'
  }
}

export function Reveal({
  children,
  className,
  delay = 0,
  direction = 'up',
  threshold,
}: RevealProps) {
  const { ref, visible } = useReveal(threshold)

  return (
    <div
      ref={ref}
      className={cn(className)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translate(0,0)' : hiddenTransform(direction),
        transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  )
}
