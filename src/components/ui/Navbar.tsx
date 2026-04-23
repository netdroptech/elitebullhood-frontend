import { useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronDown, ChevronRight, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLogo } from '@/context/LogoContext'
import { usePlatformName } from '@/context/PlatformNameContext'
import { cn } from '@/lib/utils'

const FEATURES_DROPDOWN = [
  { label: 'Markets',   path: '/markets'   },
  { label: 'Trade',     path: '/trade'     },
  { label: 'Platforms', path: '/platforms' },
  { label: 'Education', path: '/education' },
]

const NAV_LINKS = [
  { label: 'Home',     path: '/' },
  { label: 'About Us', path: '/about' },
  { label: 'Support',  path: '/support' },
]

export function Navbar() {
  const { logoUrl } = useLogo()
  const { platformName } = usePlatformName()
  const [featuresOpen, setFeaturesOpen] = useState(false)
  const [mobileOpen, setMobileOpen]     = useState(false)
  const [mobileFeaturesOpen, setMobileFeaturesOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const openFeatures  = () => { if (closeTimer.current) clearTimeout(closeTimer.current); setFeaturesOpen(true) }
  const closeFeatures = () => { closeTimer.current = setTimeout(() => setFeaturesOpen(false), 120) }
  const keepFeatures  = () => { if (closeTimer.current) clearTimeout(closeTimer.current) }

  const isActive = (path: string) => location.pathname === path
  const isFeaturePage = FEATURES_DROPDOWN.some(f => f.path === location.pathname)

  const go = (path: string) => {
    navigate(path)
    setMobileOpen(false)
    setFeaturesOpen(false)
  }

  return (
    <div className="w-full flex justify-center px-4 pt-6 z-50 relative">
      <div className="relative w-full max-w-[850px]">

        {/* ── Glass bar ── */}
        <nav className="liquid-glass rounded-3xl flex items-center justify-between px-5 py-3 gap-4">
          {/* Logo */}
          <button onClick={() => go('/')} className="shrink-0">
            <img src={logoUrl} alt={platformName} className="h-8 w-auto object-contain" />
          </button>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ label, path }) => (
              <button
                key={path}
                onClick={() => go(path)}
                className={cn(
                  'px-3 py-1.5 text-sm transition-colors rounded-lg hover:bg-white/5',
                  isActive(path) ? 'text-foreground font-medium' : 'text-foreground/70 hover:text-foreground'
                )}
              >
                {label}
              </button>
            ))}

            {/* Features dropdown trigger */}
            <button
              className={cn(
                'flex items-center gap-0.5 px-3 py-1.5 text-sm transition-colors rounded-lg hover:bg-white/5',
                isFeaturePage ? 'text-foreground font-medium' : 'text-foreground/70 hover:text-foreground'
              )}
              onMouseEnter={openFeatures}
              onMouseLeave={closeFeatures}
            >
              Features
              <ChevronDown
                className={cn('w-3.5 h-3.5 opacity-60 transition-transform duration-200', featuresOpen && 'rotate-180')}
                strokeWidth={2}
              />
            </button>
          </div>

          {/* Desktop CTA + mobile hamburger */}
          <div className="flex items-center gap-2">
            <Button variant="heroSecondary" size="sm" className="hidden md:inline-flex shrink-0" style={{ fontSize: '12px' }} onClick={() => navigate('/login')}>
              Log In
            </Button>
            <Button variant="hero" size="sm" className="hidden md:inline-flex shrink-0" style={{ fontSize: '12px' }} onClick={() => navigate('/register')}>
              Sign Up
            </Button>
            <button
              className="md:hidden p-2 text-foreground/70 hover:text-foreground transition-colors rounded-lg hover:bg-white/5"
              onClick={() => setMobileOpen(o => !o)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>

        {/* ── Desktop dropdown — outside overflow:hidden ── */}
        <div
          className="hidden md:block absolute right-[88px] top-full"
          style={{ paddingTop: '8px' }}
          onMouseEnter={keepFeatures}
          onMouseLeave={closeFeatures}
        >
          <div
            className={cn(
              'liquid-glass rounded-2xl py-2 min-w-[150px]',
              'transition-all duration-200 origin-top',
              featuresOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
            )}
          >
            {FEATURES_DROPDOWN.map(({ label, path }) => (
              <button
                key={label}
                onClick={() => { go(path) }}
                className={cn(
                  'w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors',
                  isActive(path) ? 'text-foreground font-medium' : 'text-foreground/70 hover:text-foreground'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Mobile drawer ── */}
        <div
          className={cn(
            'md:hidden absolute left-0 right-0 top-full mt-2 z-50',
            'transition-all duration-300 origin-top',
            mobileOpen ? 'opacity-100 scale-y-100 pointer-events-auto' : 'opacity-0 scale-y-95 pointer-events-none'
          )}
          style={{ transformOrigin: 'top center' }}
        >
          <div className="liquid-glass rounded-3xl overflow-hidden py-3">
            {/* Main nav links */}
            {NAV_LINKS.map(({ label, path }) => (
              <button
                key={path}
                onClick={() => go(path)}
                className={cn(
                  'w-full text-left px-5 py-3.5 text-sm transition-colors hover:bg-white/5',
                  isActive(path) ? 'text-foreground font-medium' : 'text-foreground/70'
                )}
              >
                {label}
              </button>
            ))}

            {/* Features group */}
            <button
              className={cn(
                'w-full text-left px-5 py-3.5 text-sm transition-colors hover:bg-white/5 flex items-center justify-between',
                isFeaturePage ? 'text-foreground font-medium' : 'text-foreground/70'
              )}
              onClick={() => setMobileFeaturesOpen(o => !o)}
            >
              <span>Features</span>
              <ChevronRight
                className={cn('w-4 h-4 opacity-50 transition-transform duration-200', mobileFeaturesOpen && 'rotate-90')}
                strokeWidth={2}
              />
            </button>

            {/* Features sub-items */}
            <div
              className={cn(
                'overflow-hidden transition-all duration-300',
                mobileFeaturesOpen ? 'max-h-64' : 'max-h-0'
              )}
            >
              {FEATURES_DROPDOWN.map(({ label, path }) => (
                <button
                  key={path}
                  onClick={() => go(path)}
                  className={cn(
                    'w-full text-left pl-9 pr-5 py-3 text-sm transition-colors hover:bg-white/5',
                    isActive(path) ? 'text-foreground font-medium' : 'text-foreground/60'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Mobile CTA */}
            <div className="px-4 pt-2 pb-1">
              <Button variant="hero" className="w-full justify-center" onClick={() => { navigate('/register'); setMobileOpen(false) }}>Sign Up</Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
