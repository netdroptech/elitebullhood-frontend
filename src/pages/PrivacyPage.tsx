import { usePlatformName } from '@/context/PlatformNameContext'
import { PageBackground } from '@/components/ui/PageBackground'
import { Navbar } from '@/components/ui/Navbar'
import { Footer } from '@/components/ui/Footer'
import { Reveal } from '@/components/ui/Reveal'


export function PrivacyPage() {
  const { platformName, platformEmail } = usePlatformName()
  const sections = [
    {
      title: '1. Introduction',
      body: `Elitebullhood ("we", "our", or "us") is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform and related services ("Service"). Please read this policy carefully. If you disagree with its terms, please discontinue use of the Service.`,
    },
    {
      title: '2. Information We Collect',
      body: `We collect information you provide directly to us, including when you create an account (name, email address, password), complete a profile, submit trading preferences, or contact us for support. We also collect information automatically when you use the Service, such as IP address, browser type, operating system, referring URLs, device identifiers, and usage data including pages visited, features used, and time spent on the platform.`,
    },
    {
      title: '3. How We Use Your Information',
      body: `We use the information we collect to: provide, maintain, and improve the Service; process transactions and send related information; send transactional and promotional communications (you may opt out of promotional emails at any time); monitor and analyse usage patterns and trends; detect, investigate, and prevent fraudulent or illegal activity; comply with legal obligations; and personalise your experience on the platform.`,
    },
    {
      title: '4. Sharing of Information',
      body: `We may share your information with: (a) service providers who perform services on our behalf, such as payment processing, data analytics, and customer support — these parties are bound by confidentiality obligations; (b) business partners with your consent; (c) law enforcement or regulatory authorities when required by law or to protect our rights; and (d) a successor entity in the event of a merger, acquisition, or sale of assets, with notice to you prior to transfer.`,
    },
    {
      title: '5. Cookies & Tracking Technologies',
      body: `We use cookies, web beacons, and similar tracking technologies to collect and store information about your use of the Service. Cookies allow us to recognise your browser, maintain your session, remember your preferences, and measure traffic and usage patterns. You can control cookies through your browser settings; however, disabling cookies may limit your ability to use certain features of the Service. For full details, see our Cookies Policy.`,
    },
    {
      title: '6. Data Retention',
      body: `We retain your personal information for as long as your account is active or as needed to provide the Service and comply with our legal obligations. When you delete your account, we will delete or anonymise your information within 90 days, except where we are required to retain it for legal, regulatory, or fraud-prevention purposes. Aggregated, anonymised data may be retained indefinitely.`,
    },
    {
      title: '7. Security',
      body: `We implement industry-standard technical and organisational measures to protect your information against unauthorised access, alteration, disclosure, or destruction. These include TLS/HTTPS encryption for data in transit, AES-256 encryption for sensitive data at rest, multi-factor authentication options, and regular security audits. No method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.`,
    },
    {
      title: '8. Your Rights',
      body: `Depending on your jurisdiction, you may have the right to: access the personal information we hold about you; correct inaccurate or incomplete information; request deletion of your personal information; object to or restrict certain processing; and data portability. To exercise any of these rights, please contact us at ${platformEmail}. We will respond to your request within 30 days. We may need to verify your identity before processing your request.`,
    },
    {
      title: '9. International Data Transfers',
      body: `Elitebullhood is based in the United States. If you access the Service from outside the United States, your information may be transferred to, stored, and processed in the United States or other countries where data protection laws may differ from those in your country. By using the Service, you consent to this transfer. We take appropriate steps to ensure your data is protected in accordance with this Privacy Policy.`,
    },
    {
      title: '10. Children\'s Privacy',
      body: `The Service is not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that a child under 18 has provided us with personal information, we will take steps to delete that information. If you believe a child has provided us with their personal information, please contact us immediately.`,
    },
    {
      title: '11. Third-Party Links',
      body: `The Service may contain links to third-party websites or services. We are not responsible for the privacy practices of those third parties. We encourage you to review the privacy policies of any third-party sites you visit. The inclusion of a link does not imply endorsement or responsibility for the linked site's content or practices.`,
    },
    {
      title: '12. Changes to This Policy',
      body: `We may update this Privacy Policy from time to time. We will notify you of material changes by posting the new policy on this page and updating the "Last Updated" date. Your continued use of the Service after any changes constitutes your acceptance of the updated policy. We encourage you to review this policy periodically.`,
    },
    {
      title: '13. Contact Us',
      body: `If you have questions or concerns about this Privacy Policy or our data practices, please contact our Data Protection team at ${platformEmail}, or by post at ${platformName} Inc., 123 N Wacker Drive, Chicago, IL 60606, United States.`,
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
              <span className="liquid-glass rounded-full px-3 py-0.5 text-xs text-foreground font-medium">Privacy Policy</span>
            </div>
            <h1 className="text-hero-heading text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.05] mb-5">
              Privacy Policy
            </h1>
            <p className="text-hero-sub text-lg max-w-2xl mx-auto opacity-80">
              Your privacy matters to us. Here's exactly how we collect, use, and protect your personal data. Last updated: 1 April 2026.
            </p>
          </Reveal>
        </section>

        {/* Content */}
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
