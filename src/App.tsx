import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { LogoProvider } from '@/context/LogoContext'
import { PlatformNameProvider } from '@/context/PlatformNameContext'
import { LiveChatProvider } from '@/context/LiveChatContext'
import { FaviconProvider } from '@/context/FaviconContext'
import { FaviconInjector } from '@/components/ui/FaviconInjector'
import { LiveChatInjector } from '@/components/ui/LiveChatInjector'
import { PrincipalLogin } from '@/pages/principal/PrincipalLogin'
import { PrincipalDashboard } from '@/pages/principal/PrincipalDashboard'
import { HeroSection } from '@/components/sections/HeroSection'
import { FeaturesSection } from '@/components/sections/FeaturesSection'
// import { VideoShowcaseSection } from '@/components/sections/VideoShowcaseSection'
import { NumbersSection } from '@/components/sections/NumbersSection'
import { TestimonialsSection } from '@/components/sections/TestimonialsSection'
import { CTAFooterWrapper } from '@/components/sections/CTAFooterWrapper'
import { PageBackground } from '@/components/ui/PageBackground'
import { AboutPage } from '@/pages/AboutPage'
import { SupportPage } from '@/pages/SupportPage'
import { MarketsPage } from '@/pages/MarketsPage'
import { TradePage } from '@/pages/TradePage'
import { PlatformsPage } from '@/pages/PlatformsPage'
import { EducationPage } from '@/pages/EducationPage'
import { TermsPage } from '@/pages/TermsPage'
import { PrivacyPage } from '@/pages/PrivacyPage'
import { CookiesPage } from '@/pages/CookiesPage'
import RegisterPage      from '@/pages/auth/RegisterPage'
import LoginPage         from '@/pages/auth/LoginPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import ResetPasswordPage  from '@/pages/auth/ResetPasswordPage'
import VerifyEmailPage    from '@/pages/auth/VerifyEmailPage'
import KYCPage, { KYCPendingPage } from '@/pages/auth/KYCPage'
import { DashboardLayout } from '@/pages/dashboard/DashboardLayout'
import { DashboardHome } from '@/pages/dashboard/DashboardHome'
import { AccountStatement } from '@/pages/dashboard/AccountStatement'
import { InvestmentPlans } from '@/pages/dashboard/InvestmentPlans'
import { MyPortfolio } from '@/pages/dashboard/MyPortfolio'
import { PerformanceHistory } from '@/pages/dashboard/PerformanceHistory'
import { LiveMarkets } from '@/pages/dashboard/LiveMarkets'
import { CopyTrading } from '@/pages/dashboard/CopyTrading'
import { AITradingBots } from '@/pages/dashboard/AITradingBots'
import { PremiumSignals } from '@/pages/dashboard/PremiumSignals'
import { DepositFunds } from '@/pages/dashboard/DepositFunds'
import { WithdrawalFunds } from '@/pages/dashboard/WithdrawalFunds'
import { PropertyListing } from '@/pages/dashboard/PropertyListing'
import { PropertyDetail } from '@/pages/dashboard/PropertyDetail'
import { TradingMarkets } from '@/pages/dashboard/TradingMarkets'
import { TradeDetail } from '@/pages/dashboard/TradeDetail'
import { TradingAssets } from '@/pages/dashboard/TradingAssets'
import { Holding } from '@/pages/dashboard/Holding'
import { Mining } from '@/pages/dashboard/Mining'
import { Staking } from '@/pages/dashboard/Staking'
import { ClosedTrades } from '@/pages/dashboard/ClosedTrades'
import { ProfileSettings } from '@/pages/dashboard/settings/ProfileSettings'
import { ProfileUpdate } from '@/pages/dashboard/settings/ProfileUpdate'
import { KYCVerification } from '@/pages/dashboard/settings/KYCVerification'
import { PaymentMethods } from '@/pages/dashboard/settings/PaymentMethods'
import { Security2FA } from '@/pages/dashboard/settings/Security2FA'
import { LanguageRegion } from '@/pages/dashboard/settings/LanguageRegion'
import { HelpSupport } from '@/pages/dashboard/settings/HelpSupport'
import { AdminLayout } from '@/pages/admin/AdminLayout'
import { AdminLogin } from '@/pages/admin/AdminLogin'
import { AdminHome } from '@/pages/admin/AdminHome'
import { AdminUsers } from '@/pages/admin/AdminUsers'
import { AdminUserDetail } from '@/pages/admin/AdminUserDetail'
import { AdminTransactions } from '@/pages/admin/AdminTransactions'
import { AdminKYC } from '@/pages/admin/AdminKYC'
import { AdminProperties } from '@/pages/admin/AdminProperties'
import { AdminWallets } from '@/pages/admin/AdminWallets'
import { AdminCopyTraders } from '@/pages/admin/AdminCopyTraders'
import { AdminTrades } from '@/pages/admin/AdminTrades'
import { AdminCopyHistory } from '@/pages/admin/AdminCopyHistory'
import { AdminPropertyInvestments } from '@/pages/admin/AdminPropertyInvestments'
import { AdminAutoDeposit } from '@/pages/admin/AdminAutoDeposit'
import { AdminTeam } from '@/pages/admin/AdminTeam'
import { AdminInvestmentPlans } from '@/pages/admin/AdminInvestmentPlans'
import { AdminNotifications } from '@/pages/admin/AdminNotifications'
import { AdminSettings } from '@/pages/admin/AdminSettings'
import { BannedPage } from '@/pages/BannedPage'
import { NotFound404 } from '@/pages/NotFound404'

// ─── Admin Protected Route ────────────────────────────────────────────────────
// Blocks access to /admin/* if no admin session exists in localStorage.
// When logout clears the session, any page refresh on any admin tab redirects here.
function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAdmin = localStorage.getItem('apex_admin_session') === '1'
  if (!isAdmin) return <Navigate to="/admin/login" replace />
  return <>{children}</>
}

// ─── Protected Route ──────────────────────────────────────────────────────────
// Redirects unauthenticated users to /login.
// Guards /kyc and /kyc-pending — redirects approved users straight to the dashboard.
function KYCRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return null
  if (!user) return <Navigate to="/login" replace />
  if (user.kycStatus === 'APPROVED') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

// Redirects users with unapproved KYC to /kyc or /kyc-pending.
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(260 87% 3%)' }}>
      <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
    </div>
  )

  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />

  // Banned users can only see the banned page
  if (user.status === 'BANNED') return <Navigate to="/banned" replace />

  if (user.kycStatus === 'NOT_SUBMITTED') return <Navigate to="/kyc"         replace />
  if (user.kycStatus === 'PENDING')       return <Navigate to="/kyc-pending"  replace />
  if (user.kycStatus === 'REJECTED')      return <Navigate to="/kyc"          replace />

  return <>{children}</>
}

function HomePage() {
  return (
    <div className="min-h-screen text-foreground overflow-x-hidden" style={{ background: 'hsl(260 87% 2%)', position: 'relative' }}>
      <PageBackground />
      <div style={{ position: 'relative', zIndex: 1 }}>
      <HeroSection />
      <FeaturesSection />
      {/* VideoShowcaseSection removed */}
      <NumbersSection />
      <TestimonialsSection />
      <CTAFooterWrapper />
      </div>
    </div>
  )
}

function App() {
  return (
    <PlatformNameProvider>
    <FaviconProvider>
    <LiveChatProvider>
    <LogoProvider>
    <AuthProvider>
    <FaviconInjector />
    <LiveChatInjector />
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/support" element={<SupportPage />} />
      <Route path="/markets" element={<MarketsPage />} />
      <Route path="/trade" element={<TradePage />} />
      <Route path="/platforms" element={<PlatformsPage />} />
      <Route path="/education" element={<EducationPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/cookies" element={<CookiesPage />} />
      <Route path="/register"    element={<RegisterPage />} />
      <Route path="/login"       element={<LoginPage />} />
      <Route path="/kyc"         element={<KYCRoute><KYCPage /></KYCRoute>} />
      <Route path="/kyc-pending" element={<KYCRoute><KYCPendingPage /></KYCRoute>} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password"  element={<ResetPasswordPage />} />
      <Route path="/verify-email"   element={<VerifyEmailPage />} />
      <Route path="/banned"          element={<BannedPage />} />

      {/* Dashboard — nested routes (KYC-gated) */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<DashboardHome />} />
        <Route path="statement"    element={<AccountStatement />} />
        <Route path="trade"        element={<TradingMarkets />} />
        <Route path="trade/:symbol" element={<TradeDetail />} />
        <Route path="assets"       element={<TradingAssets />} />
        <Route path="holding"      element={<Holding />} />
        <Route path="mining"       element={<Mining />} />
        <Route path="staking"      element={<Staking />} />
        <Route path="closed-trades" element={<ClosedTrades />} />
        <Route path="plans"        element={<InvestmentPlans />} />
        <Route path="portfolio"    element={<MyPortfolio />} />
        <Route path="performance"  element={<PerformanceHistory />} />
        <Route path="markets"      element={<LiveMarkets />} />
        <Route path="copy-trading" element={<CopyTrading />} />
        <Route path="ai-bots"      element={<AITradingBots />} />
        <Route path="signals"      element={<PremiumSignals />} />
        <Route path="deposit"      element={<DepositFunds />} />
        <Route path="withdrawal"   element={<WithdrawalFunds />} />
        <Route path="properties"       element={<PropertyListing />} />
        <Route path="properties/:id"   element={<PropertyDetail />} />
        {/* Settings pages */}
        <Route path="settings/profile"   element={<ProfileSettings />} />
        <Route path="settings/update"    element={<ProfileUpdate />} />
        <Route path="settings/kyc"       element={<KYCVerification />} />
        <Route path="settings/payments"  element={<PaymentMethods />} />
        <Route path="settings/security"  element={<Security2FA />} />
        <Route path="settings/locale"    element={<LanguageRegion />} />
        <Route path="settings/support"   element={<HelpSupport />} />
      </Route>
      {/* Admin login (standalone, no layout) */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Admin panel — protected: must be logged in as admin */}
      <Route path="/admin" element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
        <Route index element={<AdminHome />} />
        <Route path="users"            element={<AdminUsers />} />
        <Route path="users/:id"        element={<AdminUserDetail />} />
        <Route path="transactions"     element={<AdminTransactions />} />
        <Route path="deposits"         element={<AdminTransactions />} />
        <Route path="withdrawals"      element={<AdminTransactions />} />
        <Route path="kyc"              element={<AdminKYC />} />
        <Route path="properties"       element={<AdminProperties />} />
        <Route path="wallets"            element={<AdminWallets />} />
        <Route path="copy-traders"     element={<AdminCopyTraders />} />
        <Route path="trades"           element={<AdminTrades />} />
        <Route path="copy-history"          element={<AdminCopyHistory />} />
        <Route path="property-investments"  element={<AdminPropertyInvestments />} />
        <Route path="auto-deposit"          element={<AdminAutoDeposit />} />
        <Route path="team"                  element={<AdminTeam />} />
        <Route path="investment-plans" element={<AdminInvestmentPlans />} />
        <Route path="analytics"        element={<AdminHome />} />
        <Route path="suspensions"      element={<AdminUsers />} />
        <Route path="notifications"    element={<AdminNotifications />} />
        <Route path="settings"         element={<AdminSettings />} />
      </Route>
      {/* Principal (super-level) — standalone routes */}
      <Route path="/principal/login" element={<PrincipalLogin />} />
      <Route path="/principal"       element={<PrincipalDashboard />} />
      {/* 404 — explicit route + catch-all */}
      <Route path="/404" element={<NotFound404 />} />
      <Route path="*"    element={<NotFound404 />} />
    </Routes>
    </AuthProvider>
    </LogoProvider>
    </LiveChatProvider>
    </FaviconProvider>
    </PlatformNameProvider>
  )
}

export default App
