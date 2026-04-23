import { usePlatformName } from '@/context/PlatformNameContext'
import { PageBackground } from '@/components/ui/PageBackground'
import { Navbar } from '@/components/ui/Navbar'
import { Footer } from '@/components/ui/Footer'
import { Reveal } from '@/components/ui/Reveal'


export function TermsPage() {
  const { platformName, platformEmail } = usePlatformName()
  const sections = [
    {
      title: '1. Acceptance of Terms',
      body: `By accessing or using the Elitebullhood platform ("Service"), you agree to be bound by these Terms & Conditions ("Terms"). If you do not agree to all of these Terms, you may not access or use the Service. These Terms apply to all visitors, users, and others who access or use the Service.`,
    },
    {
      title: '2. Eligibility',
      body: `You must be at least 18 years of age to use the Service. By using the Service you represent and warrant that you are of legal age to form a binding contract with Elitebullhood and that you meet all eligibility requirements outlined herein. The Service is not available to persons who have previously been prohibited from using it.`,
    },
    {
      title: '3. Account Registration',
      body: `To access certain features of the Service you must register for an account. You agree to provide accurate, current, and complete information during registration and to update that information to keep it accurate, current, and complete. You are responsible for safeguarding your password and for any activities or actions under your account. Elitebullhood will not be liable for any loss or damage arising from your failure to comply with this obligation.`,
    },
    {
      title: '4. Trading & Financial Services',
      body: `Elitebullhood provides tools and analytics to assist with trading decisions. All trading involves significant risk of loss. Past performance is not indicative of future results. You acknowledge that you are solely responsible for your trading decisions and that Elitebullhood does not provide investment advice, portfolio management, or financial advisory services. Nothing on the platform constitutes a recommendation to buy, sell, or hold any financial instrument.`,
    },
    {
      title: '5. Prohibited Conduct',
      body: `You agree not to engage in any of the following: (a) using the Service for any unlawful purpose or in violation of any regulations; (b) attempting to gain unauthorised access to the Service or its related systems; (c) transmitting any viruses, worms, or malicious code; (d) scraping, crawling, or harvesting data from the Service without prior written consent; (e) impersonating any person or entity; or (f) engaging in market manipulation or any other conduct that violates applicable trading regulations.`,
    },
    {
      title: '6. Intellectual Property',
      body: `The Service and its original content, features, and functionality are and will remain the exclusive property of Elitebullhood and its licensors. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of Elitebullhood. You may not reproduce, distribute, or create derivative works from any content on the Service without express written permission.`,
    },
    {
      title: '7. Fees & Payments',
      body: `Certain features of the Service are offered on a subscription basis. You agree to pay all applicable fees as described on the Service at the time of purchase. Elitebullhood reserves the right to change its pricing at any time upon reasonable notice. All fees are non-refundable except as expressly stated in our Refund Policy. If you dispute any charge you must notify us within 30 days of the charge date.`,
    },
    {
      title: '8. Disclaimer of Warranties',
      body: `The Service is provided on an "AS IS" and "AS AVAILABLE" basis without any warranties of any kind, either express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, or non-infringement. Elitebullhood does not warrant that the Service will be uninterrupted, error-free, or free of viruses or other harmful components.`,
    },
    {
      title: '9. Limitation of Liability',
      body: `To the maximum extent permitted by applicable law, Elitebullhood and its affiliates, officers, employees, agents, partners, and licensors shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation loss of profits, data, goodwill, or other intangible losses, resulting from your access to or use of (or inability to access or use) the Service.`,
    },
    {
      title: '10. Indemnification',
      body: `You agree to defend, indemnify, and hold harmless Elitebullhood and its licensors, service providers, employees, contractors, agents, officers, and directors from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable legal fees) arising out of or relating to your violation of these Terms or your use of the Service.`,
    },
    {
      title: '11. Governing Law & Dispute Resolution',
      body: `These Terms shall be governed by and construed in accordance with the laws of the State of Illinois, United States, without regard to its conflict of law provisions. Any dispute arising from or relating to these Terms or the Service shall first be attempted to be resolved through good-faith negotiation. If unresolved, disputes shall be submitted to binding arbitration in Chicago, Illinois under the rules of the American Arbitration Association.`,
    },
    {
      title: '12. Changes to Terms',
      body: `Elitebullhood reserves the right to modify or replace these Terms at any time at its sole discretion. We will provide notice of significant changes by updating the "Last Updated" date at the top of this page. Your continued use of the Service after any changes constitutes your acceptance of the new Terms. If you do not agree to the revised Terms, you must stop using the Service.`,
    },
    {
      title: '13. Contact Us',
      body: `If you have any questions about these Terms, please contact us at ${platformEmail} or by mail at ${platformName} Inc., 123 N Wacker Drive, Chicago, IL 60606, United States.`,
    },
  ]
  
  return (
    <div className="min-h-screen text-foreground overflow-x-hidden" style={{ background: 'hsl(260 87% 2%)', position: 'relative' }}>
      <PageBackground />
      <div className="relative">
        {/* Subtle radial glow */}
        <div className="pointer-events-none fixed inset-0 z-0"
          style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -10%, hsl(262 95% 76% / 0.05) 0%, transparent 70%)' }} />

        <Navbar />

        {/* Hero */}
        <section className="relative pt-40 pb-20 px-4 text-center">
          <Reveal>
            <div className="inline-flex items-center gap-2 liquid-glass rounded-full px-4 py-2 mb-6">
              <span className="text-muted-foreground text-sm">Legal</span>
              <span className="liquid-glass rounded-full px-3 py-0.5 text-xs text-foreground font-medium">Terms & Conditions</span>
            </div>
            <h1 className="text-hero-heading text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.05] mb-5">
              Terms &amp; Conditions
            </h1>
            <p className="text-hero-sub text-lg max-w-2xl mx-auto opacity-80">
              Please read these terms carefully before using the Elitebullhood platform. Last updated: 1 April 2026.
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
