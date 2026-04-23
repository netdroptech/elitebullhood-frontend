import { useState, useEffect } from 'react'
import { usePlatformName } from '@/context/PlatformNameContext'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'

export function Footer() {
  const { platformName, platformEmail } = usePlatformName()
  const [cookieDismissed, setCookieDismissed] = useState(false)
  const [phone,   setPhone]   = useState('+1 (812) 760-8730')
  const [address, setAddress] = useState('Colorado 81147, USA')

  useEffect(() => {
    fetch(`${API}/admin/public/contact`)
      .then(r => r.json())
      .then(res => {
        if (res?.data?.platform_phone)   setPhone(res.data.platform_phone)
        if (res?.data?.platform_address) setAddress(res.data.platform_address)
      })
      .catch(() => {/* keep defaults */})
  }, [])

  return (
    <footer className="relative z-10 px-4 pt-16 pb-0">
      <div className="max-w-6xl mx-auto">
        {/* Main grid: brand (wide) + 4 link columns */}
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1.5fr_1fr_1fr] gap-10 mb-12">

          {/* Brand */}
          <div className="flex flex-col gap-4">
            <span className="text-foreground text-xl font-bold tracking-tight">
              {platformName}
            </span>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
              Empower your trades with real-time insights and advanced market analytics.{' '}
              <a href="https://www.tradingview.com/markets/cryptocurrencies/prices-all/" target="_blank" rel="noopener noreferrer" className="text-primary-gradient font-medium hover:opacity-80 transition-opacity">
                Track live crypto prices
              </a>{' '}
              and make informed decisions with TradingView-powered data.
            </p>
          </div>

          {/* COMPANY */}
          <div>
            <h4 className="text-foreground text-xs font-semibold tracking-widest uppercase mb-5">
              Company
            </h4>
            <ul className="flex flex-col gap-3">
              <li>
                <a href="/about" className="text-muted-foreground text-sm hover:text-foreground transition-colors">
                  About us
                </a>
              </li>
            </ul>
          </div>

          {/* HELP */}
          <div>
            <h4 className="text-foreground text-xs font-semibold tracking-widest uppercase mb-5">
              Help
            </h4>
            <ul className="flex flex-col gap-3">
              <li>
                <a href="/support" className="text-muted-foreground text-sm hover:text-foreground transition-colors">
                  Support Center
                </a>
              </li>
              <li className="text-muted-foreground text-sm">
                Email:{' '}
                <a
                  href={`mailto:${platformEmail}`}
                  className="text-primary-gradient hover:opacity-80 transition-opacity"
                >
                  {platformEmail}
                </a>
              </li>
              <li className="text-muted-foreground text-sm">
                Phone:{' '}
                <a
                  href={`tel:${phone.replace(/[\s()\-]/g, '')}`}
                  className="text-primary-gradient hover:opacity-80 transition-opacity"
                >
                  {phone}
                </a>
              </li>
            </ul>
          </div>

          {/* LOCATION */}
          <div>
            <h4 className="text-foreground text-xs font-semibold tracking-widest uppercase mb-5">
              Location
            </h4>
            <ul className="flex flex-col gap-3">
              <li className="flex items-start gap-2 text-muted-foreground text-sm leading-relaxed">
                {/* pin icon inline SVG so no extra import needed */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="13" height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mt-0.5 shrink-0 text-primary"
                >
                  <path d="M20 10c0 6-8 13-8 13s-8-7-8-13a8 8 0 0 1 16 0Z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <span>{address}</span>
              </li>
            </ul>
          </div>

          {/* LEGAL */}
          <div>
            <h4 className="text-foreground text-xs font-semibold tracking-widest uppercase mb-5">
              Legal
            </h4>
            <ul className="flex flex-col gap-3">
              {[
                { label: 'Terms & Conditions', href: '/terms' },
                { label: 'Privacy Policy', href: '/privacy' },
                { label: 'Cookies Policy', href: '/cookies' },
              ].map((item) => (
                <li key={item.label}>
                  <a href={item.href} className="text-muted-foreground text-sm hover:text-foreground transition-colors">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom bar — full width with top border */}
      <div className="border-t border-border/30">
        <div className="max-w-6xl mx-auto py-6">
          <p className="text-muted-foreground text-sm">
            © 2026 {platformName}. All rights reserved.
          </p>
        </div>
      </div>

      {/* Cookie consent bar */}
      {!cookieDismissed && (
        <div className="fixed bottom-6 left-6 z-50 flex items-center gap-3 bg-[hsl(240_6%_12%)] border border-border/60 rounded-2xl px-5 py-3 shadow-2xl text-sm text-muted-foreground">
          <span className="text-base">🍪</span>
          <span>
            By browsing this website, you accept our{' '}
            <a href="/cookies" className="text-primary-gradient font-medium hover:opacity-80 transition-opacity">
              Cookies Policy
            </a>
          </span>
          <button
            onClick={() => setCookieDismissed(true)}
            className="ml-3 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}
    </footer>
  )
}
