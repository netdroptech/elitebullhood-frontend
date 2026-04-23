import { usePlatformName } from '@/context/PlatformNameContext'
import { PageBackground } from '@/components/ui/PageBackground'
import { Navbar } from '@/components/ui/Navbar'
import { Footer } from '@/components/ui/Footer'
import { Reveal } from '@/components/ui/Reveal'

const cookieTypes = [
  {
    name: 'Strictly Necessary',
    badge: 'Always Active',
    badgeGreen: true,
    description: 'These cookies are essential for the website to function and cannot be switched off. They are usually only set in response to actions you take, such as setting your privacy preferences, logging in, or filling in forms. You can set your browser to block these cookies, but some parts of the site will not work.',
    examples: ['Session authentication token', 'CSRF protection token', 'Cookie consent preference', 'Load balancer routing'],
  },
  {
    name: 'Performance & Analytics',
    badge: 'Optional',
    badgeGreen: false,
    description: 'These cookies allow us to count visits and traffic sources so we can measure and improve the performance of the Service. They help us understand which pages are the most and least popular and see how visitors move around the site. All information these cookies collect is aggregated and therefore anonymous.',
    examples: ['Page view counts', 'Session duration', 'Traffic source attribution', 'Feature usage heatmaps'],
  },
  {
    name: 'Functional',
    badge: 'Optional',
    badgeGreen: false,
    description: 'These cookies enable the website to provide enhanced functionality and personalisation. They may be set by us or by third-party providers whose services we have added to our pages. If you disable these cookies, some or all of these services may not function properly.',
    examples: ['User interface preferences (theme, layout)', 'Language and region settings', 'Recently viewed instruments', 'Watchlist persistence'],
  },
  {
    name: 'Targeting & Marketing',
    badge: 'Optional',
    badgeGreen: false,
    description: 'These cookies may be set through our site by our advertising partners. They may be used by those companies to build a profile of your interests and show you relevant adverts on other sites. They do not store directly personal information, but are based on uniquely identifying your browser and internet device.',
    examples: ['Ad campaign attribution', 'Retargeting identifiers', 'Social media pixels', 'Conversion tracking'],
  },
]


export function CookiesPage() {
  const { platformName, platformEmail } = usePlatformName()
  const sections = [
    {
      title: '1. What Are Cookies?',
      body: `Cookies are small text files that are placed on your device (computer, smartphone, or tablet) when you visit a website. They are widely used to make websites work more efficiently and to provide information to the site's operators. Cookies can be "persistent" (remaining on your device until deleted or they expire) or "session" cookies (deleted when you close your browser).`,
    },
    {
      title: '2. How We Use Cookies',
      body: `Elitebullhood uses cookies and similar technologies (such as web beacons, pixels, and local storage) to: keep you signed in to your account; remember your preferences and settings; understand how you use the Service; measure the effectiveness of our features; deliver personalised content; and improve overall platform performance and security.`,
    },
    {
      title: '3. Third-Party Cookies',
      body: `Some cookies on the Service are set by third-party services that appear on our pages. We use third-party analytics providers (such as Google Analytics) to help us understand usage patterns. These third parties may use their own cookies and tracking technologies, which are governed by their own privacy policies. We do not control these third-party cookies.`,
    },
    {
      title: '4. Managing Your Cookie Preferences',
      body: `You can control and manage cookies in several ways. Most browsers allow you to refuse or accept cookies, delete existing cookies, and set preferences for certain websites. Disabling cookies may affect your experience on the Service — some features may not work as intended. You can also opt out of analytics cookies using browser add-ons such as the Google Analytics Opt-out Browser Add-on.`,
    },
    {
      title: '5. Do Not Track',
      body: `Some browsers include a "Do Not Track" feature that signals websites not to track your activity. Our Service does not currently respond to Do Not Track signals because there is no consistent industry standard for compliance. However, you can use the cookie controls described above to limit tracking on our platform.`,
    },
    {
      title: '6. Updates to This Policy',
      body: `We may update this Cookies Policy from time to time to reflect changes in technology, legislation, our operations, or other developments. We will notify you of material changes by posting an updated version on this page with a revised "Last Updated" date. Please check back periodically to stay informed.`,
    },
    {
      title: '7. Contact Us',
      body: `If you have any questions about our use of cookies or this Cookies Policy, please contact us at ${platformEmail} or write to us at ${platformName} Inc., 123 N Wacker Drive, Chicago, IL 60606, United States.`,
    },
  ]
  
  return (
    <div className="min-h-screen text-foreground overflow-x-hidden" style={{ background: 'hsl(260 87% 2%)', position: 'relative' }}>
      <PageBackground />
      <div className="relative">
        <div className="pointer-events-none fixed inset-0 z-0"
          style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -10%, hsl(262 95% 76% / 0.05) 0%, transparent 70%)' }} />

        <Navbar />

        {/* Hero */}
        <section className="relative pt-40 pb-20 px-4 text-center">
          <Reveal>
            <div className="inline-flex items-center gap-2 liquid-glass rounded-full px-4 py-2 mb-6">
              <span className="text-muted-foreground text-sm">Legal</span>
              <span className="liquid-glass rounded-full px-3 py-0.5 text-xs text-foreground font-medium">Cookies Policy</span>
            </div>
            <h1 className="text-hero-heading text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.05] mb-5">
              Cookies Policy
            </h1>
            <p className="text-hero-sub text-lg max-w-2xl mx-auto opacity-80">
              We use cookies to power a better experience. Here's a full breakdown of what we use and why. Last updated: 1 April 2026.
            </p>
          </Reveal>
        </section>

        {/* Cookie type cards */}
        <section className="relative px-4 pb-16 max-w-5xl mx-auto">
          <Reveal>
            <h2 className="text-hero-heading text-2xl font-semibold mb-8 text-center">Cookie Categories</h2>
          </Reveal>
          <div className="grid sm:grid-cols-2 gap-5">
            {cookieTypes.map((ct, i) => (
              <Reveal key={ct.name} delay={i * 80}>
                <div className="liquid-glass rounded-2xl p-7 h-full flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-hero-heading text-base font-semibold">{ct.name}</h3>
                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${ct.badgeGreen
                      ? 'bg-primary/15 text-primary'
                      : 'bg-secondary text-muted-foreground'}`}>
                      {ct.badge}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">{ct.description}</p>
                  <div className="border-t border-border/50 pt-4 mt-auto">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Examples</p>
                    <ul className="flex flex-col gap-1">
                      {ct.examples.map((ex) => (
                        <li key={ex} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                          {ex}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* General sections */}
        <section className="relative px-4 pb-32 max-w-3xl mx-auto">
          <div className="flex flex-col gap-8">
            {sections.map((s, i) => (
              <Reveal key={s.title} delay={i * 40}>
                <div className="liquid-glass rounded-2xl p-7">
                  <h2 className="text-hero-heading text-lg font-semibold mb-3">{s.title}</h2>
                  <p className="text-muted-foreground text-sm leading-relaxed">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <Footer />
      </div>
    </div>
  )
}
