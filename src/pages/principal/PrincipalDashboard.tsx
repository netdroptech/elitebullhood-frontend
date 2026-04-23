import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Crown, Upload, RotateCcw, CheckCircle, Image, LogOut, AlertTriangle, X, Type, Pencil, Mail, MessageSquare, Trash2, Code2, Sparkles, ShieldCheck, Eye, EyeOff, KeyRound, Copy, RefreshCw, Link2, User, Settings, Globe } from 'lucide-react'
import { useLogo } from '@/context/LogoContext'
import { usePlatformName, DEFAULT_PLATFORM_NAME, DEFAULT_PLATFORM_EMAIL } from '@/context/PlatformNameContext'
import { useLiveChat } from '@/context/LiveChatContext'
import { useFavicon } from '@/context/FaviconContext'
import defaultLogoImg from '@/assets/logo.png'

const API_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api')
const PRINCIPAL_KEY = 'Principal@elitebullhood#2027'

function PrincipalProtectedRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  useEffect(() => {
    if (localStorage.getItem('apex_principal_session') !== '1') {
      navigate('/principal/login', { replace: true })
    }
  }, [])
  if (localStorage.getItem('apex_principal_session') !== '1') return null
  return <>{children}</>
}

export function PrincipalDashboard() {
  return <PrincipalProtectedRoute><PrincipalDashboardInner /></PrincipalProtectedRoute>
}

function PrincipalDashboardInner() {
  const navigate = useNavigate()
  const { logoUrl, updateLogo, resetLogo } = useLogo()
  const { platformName, updatePlatformName, resetPlatformName, platformEmail, updatePlatformEmail, resetPlatformEmail } = usePlatformName()
  const { liveChatScript, updateLiveChatScript, removeLiveChatScript } = useLiveChat()
  const { faviconUrl, updateFavicon, resetFavicon } = useFavicon()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const faviconInputRef = useRef<HTMLInputElement>(null)

  // Logo state
  const [preview,  setPreview]  = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [fileSize, setFileSize] = useState<string>('')
  const [logoSuccess, setLogoSuccess] = useState(false)
  const [logoError,   setLogoError]   = useState('')
  const [dragging, setDragging] = useState(false)

  // Platform name state
  const [nameInput,   setNameInput]   = useState(platformName)
  const [nameSuccess, setNameSuccess] = useState(false)
  const [nameEditing, setNameEditing] = useState(false)

  // Platform email state
  const [emailInput,   setEmailInput]   = useState(platformEmail)
  const [emailSuccess, setEmailSuccess] = useState(false)
  const [emailEditing, setEmailEditing] = useState(false)
  const [emailError,   setEmailError]   = useState('')

  // Domain link state (persisted to database)
  const [domainValue,   setDomainValue]   = useState<string>(window.location.origin)
  const [domainInput,   setDomainInput]   = useState<string>(window.location.origin)
  const [domainEditing, setDomainEditing] = useState(false)
  const [domainSuccess, setDomainSuccess] = useState(false)
  const [domainError,   setDomainError]   = useState('')
  const [domainLoaded,  setDomainLoaded]  = useState(false)

  function applyDomain() {
    const trimmed = domainInput.trim().replace(/\/$/, '') // strip trailing slash
    if (!trimmed) { setDomainError('Domain cannot be empty.'); return }
    try { new URL(trimmed) } catch { setDomainError('Enter a valid URL (e.g. https://myplatform.com).'); return }
    setDomainError('')
    setDomainValue(trimmed)
    setDomainEditing(false)
    setDomainSuccess(true)
    setTimeout(() => setDomainSuccess(false), 3000)
    fetch(`${API_BASE}/admin/principal/branding`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ principalKey: PRINCIPAL_KEY, settings: { platform_domain: trimmed } }),
    }).catch(() => {})
  }

  function resetDomain() {
    const origin = window.location.origin
    setDomainValue(origin)
    setDomainInput(origin)
    setDomainEditing(false)
    setDomainSuccess(false)
    setDomainError('')
    fetch(`${API_BASE}/admin/principal/branding`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ principalKey: PRINCIPAL_KEY, settings: { platform_domain: '' } }),
    }).catch(() => {})
  }

  const isCustomDomain = domainLoaded && domainValue !== window.location.origin

  // Live chat state
  const [chatInput,   setChatInput]   = useState(liveChatScript)
  const [chatSuccess, setChatSuccess] = useState(false)
  const [chatDirty,   setChatDirty]   = useState(false)

  // Sync state when data loads from database
  useEffect(() => { if (liveChatScript) setChatInput(liveChatScript) }, [liveChatScript])
  useEffect(() => { if (platformName)   setNameInput(platformName) },   [platformName])
  useEffect(() => { if (platformEmail)  setEmailInput(platformEmail) }, [platformEmail])

  // Admin credentials state
  const [adminEmail,       setAdminEmail]       = useState('')
  const [adminPassword,    setAdminPassword]    = useState('')
  const [adminConfirm,     setAdminConfirm]     = useState('')
  const [adminShowPw,      setAdminShowPw]      = useState(false)
  const [adminShowConfirm, setAdminShowConfirm] = useState(false)
  const [adminLoading,     setAdminLoading]     = useState(false)
  const [adminSuccess,     setAdminSuccess]     = useState('')
  const [adminError,       setAdminError]       = useState('')

  // Admin email — fetched live from database (password never stored)
  const [savedCreds,    setSavedCreds]    = useState<{ email: string } | null>(null)
  const [copiedField,   setCopiedField]   = useState<'email' | null>(null)
  const [fetchingEmail, setFetchingEmail] = useState(false)

  // On mount: fetch the live admin email from the database via backend
  useEffect(() => {
    async function fetchAdminEmail() {
      setFetchingEmail(true)
      try {
        const res  = await fetch(`${API_BASE}/auth/principal/admin-info?key=${encodeURIComponent(PRINCIPAL_KEY)}`)
        const data = await res.json()
        if (data.success) {
          setSavedCreds({ email: data.data.email })
        }
      } catch { /* silently ignore */ }
      finally { setFetchingEmail(false) }
    }
    fetchAdminEmail()
    // Also clear any old localStorage credentials that may have stored passwords
    localStorage.removeItem('apex_admin_saved_creds')
  }, [])

  // On mount: fetch domain + auth code from database
  useEffect(() => {
    async function fetchBrandingExtras() {
      try {
        const res  = await fetch(`${API_BASE}/admin/public/branding`)
        const json = await res.json()
        if (json.success && json.data) {
          if (json.data.platform_domain) {
            setDomainValue(json.data.platform_domain)
            setDomainInput(json.data.platform_domain)
            setDomainLoaded(true)
          }
          if (json.data.admin_auth_code) {
            setAuthCode(json.data.admin_auth_code)
            setAuthCodeInput(json.data.admin_auth_code)
          }
        }
      } catch { /* silently ignore */ }
    }
    fetchBrandingExtras()
  }, [])

  function copyCredField(field: 'email', value: string) {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2500)
    })
  }

  // Favicon state
  const [faviconPreview,  setFaviconPreview]  = useState<string | null>(null)
  const [faviconFileName, setFaviconFileName] = useState<string>('')
  const [faviconFileSize, setFaviconFileSize] = useState<string>('')
  const [faviconSuccess,  setFaviconSuccess]  = useState(false)
  const [faviconError,    setFaviconError]    = useState('')
  const [faviconDragging, setFaviconDragging] = useState(false)

  // Admin auth code state (persisted to database)
  const [authCode,        setAuthCode]        = useState<string>('')
  const [authCodeInput,   setAuthCodeInput]   = useState<string>('')
  const [authCodeCopied,  setAuthCodeCopied]  = useState(false)
  const [authCodeSaved,   setAuthCodeSaved]   = useState(false)
  const [authCodeEditing, setAuthCodeEditing] = useState(false)

  // Active page state
  const [activePage, setActivePage] = useState<'branding' | 'security' | 'settings'>('branding')

  function generateAuthCode() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
    const seg = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    const code = `${seg(4)}-${seg(4)}-${seg(4)}`
    setAuthCodeInput(code)
  }

  function saveAuthCode() {
    const trimmed = authCodeInput.trim()
    if (!trimmed) return
    setAuthCode(trimmed)
    setAuthCodeEditing(false)
    setAuthCodeSaved(true)
    setTimeout(() => setAuthCodeSaved(false), 3000)
    fetch(`${API_BASE}/admin/principal/branding`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ principalKey: PRINCIPAL_KEY, settings: { admin_auth_code: trimmed } }),
    }).catch(() => {})
  }

  function revokeAuthCode() {
    setAuthCode('')
    setAuthCodeInput('')
    setAuthCodeEditing(false)
    setAuthCodeSaved(false)
    fetch(`${API_BASE}/admin/principal/branding`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ principalKey: PRINCIPAL_KEY, settings: { admin_auth_code: '' } }),
    }).catch(() => {})
  }

  function copyAuthUrl() {
    const base = domainValue.replace(/\/$/, '')
    const url  = `${base}/admin/login?auth=${encodeURIComponent(authCode)}`
    navigator.clipboard.writeText(url).then(() => {
      setAuthCodeCopied(true)
      setTimeout(() => setAuthCodeCopied(false), 2500)
    })
  }

  // Keep inputs in sync when values change from outside
  useEffect(() => { setNameInput(platformName) }, [platformName])
  useEffect(() => { setEmailInput(platformEmail) }, [platformEmail])
  useEffect(() => { setChatInput(liveChatScript); setChatDirty(false) }, [liveChatScript])

  const isCustomLogo    = logoUrl !== defaultLogoImg
  const isCustomName    = platformName !== DEFAULT_PLATFORM_NAME
  const isCustomEmail   = platformEmail !== DEFAULT_PLATFORM_EMAIL
  const isCustomFavicon = !!faviconUrl

  function handleFile(file: File) {
    setLogoError('')
    if (!file.type.startsWith('image/')) { setLogoError('Please upload a valid image file (PNG, JPG, SVG, WebP).'); return }
    if (file.size > 2 * 1024 * 1024) { setLogoError('Image must be under 2MB.'); return }

    const reader = new FileReader()
    reader.onload = e => {
      setPreview(e.target?.result as string)
      setFileName(file.name)
      setFileSize((file.size / 1024).toFixed(1) + ' KB')
      setLogoSuccess(false)
    }
    reader.readAsDataURL(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function applyLogo() {
    if (!preview) return
    updateLogo(preview)
    setLogoSuccess(true)
    setTimeout(() => setLogoSuccess(false), 3000)
  }

  function handleLogoReset() {
    resetLogo()
    setPreview(null)
    setFileName('')
    setFileSize('')
    setLogoSuccess(false)
    setLogoError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function applyName() {
    const trimmed = nameInput.trim()
    if (!trimmed) return
    updatePlatformName(trimmed)
    setNameEditing(false)
    setNameSuccess(true)
    setTimeout(() => setNameSuccess(false), 3000)
  }

  function handleNameReset() {
    resetPlatformName()
    setNameInput(DEFAULT_PLATFORM_NAME)
    setNameEditing(false)
    setNameSuccess(false)
  }

  function applyEmail() {
    const trimmed = emailInput.trim()
    if (!trimmed) return
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmed)) { setEmailError('Please enter a valid email address.'); return }
    setEmailError('')
    updatePlatformEmail(trimmed)
    setEmailEditing(false)
    setEmailSuccess(true)
    setTimeout(() => setEmailSuccess(false), 3000)
  }

  function handleEmailReset() {
    resetPlatformEmail()
    setEmailInput(DEFAULT_PLATFORM_EMAIL)
    setEmailEditing(false)
    setEmailSuccess(false)
    setEmailError('')
  }

  function applyChatScript() {
    if (!chatInput.trim()) return
    updateLiveChatScript(chatInput.trim())
    setChatDirty(false)
    setChatSuccess(true)
    setTimeout(() => setChatSuccess(false), 3000)
  }

  function removeChatScript() {
    removeLiveChatScript()
    setChatInput('')
    setChatDirty(false)
    setChatSuccess(false)
  }

  async function applyAdminCredentials() {
    setAdminError('')
    setAdminSuccess('')
    if (!adminEmail.trim() && !adminPassword.trim()) {
      setAdminError('Enter a new email, a new password, or both.')
      return
    }
    if (adminPassword && adminPassword.length < 8) {
      setAdminError('Password must be at least 8 characters.')
      return
    }
    if (adminPassword && adminPassword !== adminConfirm) {
      setAdminError('Passwords do not match.')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (adminEmail && !emailRegex.test(adminEmail.trim())) {
      setAdminError('Enter a valid email address.')
      return
    }
    setAdminLoading(true)
    try {
      const body: Record<string, string> = { principalKey: PRINCIPAL_KEY }
      if (adminEmail.trim())    body.newEmail    = adminEmail.trim()
      if (adminPassword.trim()) body.newPassword = adminPassword.trim()

      const res  = await fetch(`${API_BASE}/auth/principal/update-admin-credentials`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      const data = await res.json()
      if (!data.success) { setAdminError(data.message ?? 'Update failed.'); return }

      setAdminSuccess(
        data.updated.email && data.updated.password
          ? 'Admin email and password updated successfully.'
          : data.updated.email
          ? 'Admin email updated successfully.'
          : 'Admin password updated successfully.'
      )
      // Update displayed email if it was changed (password never stored)
      if (adminEmail.trim()) {
        setSavedCreds({ email: adminEmail.trim() })
      }
      setAdminEmail('')
      setAdminPassword('')
      setAdminConfirm('')
      setTimeout(() => setAdminSuccess(''), 5000)
    } catch {
      setAdminError('Network error. Is the backend running?')
    } finally {
      setAdminLoading(false)
    }
  }

  function handleFaviconFile(file: File) {
    setFaviconError('')
    if (!file.type.startsWith('image/')) { setFaviconError('Please upload a valid image file (PNG, ICO, SVG, WebP).'); return }
    if (file.size > 512 * 1024) { setFaviconError('Favicon must be under 512KB.'); return }
    const reader = new FileReader()
    reader.onload = e => {
      setFaviconPreview(e.target?.result as string)
      setFaviconFileName(file.name)
      setFaviconFileSize((file.size / 1024).toFixed(1) + ' KB')
      setFaviconSuccess(false)
    }
    reader.readAsDataURL(file)
  }

  function applyFavicon() {
    if (!faviconPreview) return
    updateFavicon(faviconPreview)
    setFaviconSuccess(true)
    setTimeout(() => setFaviconSuccess(false), 3000)
  }

  function handleFaviconReset() {
    resetFavicon()
    setFaviconPreview(null)
    setFaviconFileName('')
    setFaviconFileSize('')
    setFaviconSuccess(false)
    setFaviconError('')
    if (faviconInputRef.current) faviconInputRef.current.value = ''
  }

  function handleLogout() {
    localStorage.removeItem('apex_principal_session')
    navigate('/principal/login', { replace: true })
  }

  // Mobile responsive state
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const [particles] = useState(() =>
    Array.from({ length: 20 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 40 + 20,
      opacity: Math.random() * 0.18 + 0.04,
    }))
  )

  return (
    <div style={{
      minHeight: '100vh',
      background: 'hsl(260 87% 2%)',
      fontFamily: "'Geist Sans', 'Inter', system-ui, sans-serif",
      position: 'relative',
    }}>
      {/* Background */}
      {particles.map((p, i) => (
        <div key={i} style={{
          position: 'fixed',
          left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size,
          borderRadius: '50%',
          background: i % 3 === 0 ? '#7c3aed' : i % 3 === 1 ? '#6d28d9' : '#a78bfa',
          opacity: p.opacity,
          animation: `pdFloatUp ${p.speed}s linear infinite`,
          animationDelay: `${-Math.random() * p.speed}s`,
          pointerEvents: 'none',
          zIndex: 0,
        }} />
      ))}
      <div style={{ position: 'fixed', top: '-20%', right: '-10%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-20%', left: '-10%', width: '45vw', height: '45vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none', zIndex: 0 }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* Top bar */}
        <div style={{
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(12,8,26,0.7)',
          backdropFilter: 'blur(20px)',
          padding: '0 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 64,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Crown size={17} style={{ color: '#fff' }} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1.2 }}>Principal Panel</p>
              <p style={{ fontSize: 11, color: 'rgba(196,181,253,0.6)', margin: 0 }}>Super-level control</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 9, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.18)', color: '#f87171', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            <LogOut size={13} />
            Sign Out
          </button>
        </div>

        {/* Main layout: sidebar (desktop) + bottom tabs (mobile) + content */}
        <div style={{ display: 'flex', height: isMobile ? 'auto' : 'calc(100vh - 64px)' }}>

          {/* ── Desktop Sidebar ── */}
          {!isMobile && (
            <div style={{
              width: 240, flexShrink: 0,
              borderRight: '1px solid rgba(255,255,255,0.07)',
              background: 'rgba(12,8,26,0.5)',
              overflowY: 'auto',
              position: 'sticky', top: 64,
              height: 'calc(100vh - 64px)',
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ flex: 1, padding: '20px 12px' }}>
                {[
                  { key: 'branding', icon: <Image size={16} style={{ color: '#a78bfa', flexShrink: 0 }} />, label: 'Branding', sub: 'Logo, name & favicon' },
                  { key: 'security', icon: <ShieldCheck size={16} style={{ color: '#a78bfa', flexShrink: 0 }} />, label: 'Security', sub: 'Credentials & access' },
                  { key: 'settings', icon: <Settings size={16} style={{ color: '#a78bfa', flexShrink: 0 }} />, label: 'Settings', sub: 'Domain, email & integrations' },
                ].map(item => (
                  <button key={item.key} onClick={() => setActivePage(item.key as any)} style={{
                    width: '100%', padding: '12px 14px', marginBottom: 8, borderRadius: 11, border: 'none',
                    background: activePage === item.key ? 'rgba(167,139,250,0.1)' : 'transparent',
                    borderLeft: activePage === item.key ? '3px solid #a78bfa' : '3px solid transparent',
                    paddingLeft: activePage === item.key ? '11px' : '14px',
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    {item.icon}
                    <div style={{ textAlign: 'left' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: 0 }}>{item.label}</p>
                      <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)', margin: '2px 0 0' }}>{item.sub}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 11, color: 'hsl(240 5% 45%)', lineHeight: 1.4 }}>{platformEmail}</p>
                <p style={{ margin: '4px 0 0', fontSize: 10, color: 'hsl(240 5% 35%)' }}>v1.0.0 Principal</p>
              </div>
            </div>
          )}

          {/* Content area */}
          <div style={{
            flex: 1, overflowY: 'auto',
            padding: isMobile ? '24px 16px 80px' : '48px 24px',
            maxWidth: 720, marginLeft: 'auto', marginRight: 'auto', width: '100%',
          }}>

            {/* ── BRANDING PAGE ── */}
            {activePage === 'branding' && (
              <>
                <div style={{ marginBottom: 40 }}>
                  <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>Branding</h1>
                  <p style={{ fontSize: 14, color: 'hsl(240 5% 55%)', marginTop: 6 }}>Manage the platform name, logo, and favicon.</p>
                </div>

                {/* Logo Management Card */}
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 20,
                  overflow: 'hidden',
                }}>
                  <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Image size={16} style={{ color: '#a78bfa' }} />
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>Platform Logo</p>
                  </div>

                  <div style={{ padding: 28 }}>
                    <div style={{ marginBottom: 28 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: 'hsl(240 5% 48%)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>Current Logo</p>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '18px 28px',
                        borderRadius: 14,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        gap: 16,
                      }}>
                        <img src={logoUrl} alt="Current logo" style={{ height: 40, objectFit: 'contain', maxWidth: 160 }} />
                        {isCustomLogo && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)', padding: '3px 8px', borderRadius: 999, letterSpacing: '0.06em' }}>CUSTOM</span>
                        )}
                      </div>
                      {isCustomLogo && (
                        <button
                          onClick={handleLogoReset}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, padding: '6px 12px', borderRadius: 8, background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.18)', color: '#f87171', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                        >
                          <RotateCcw size={11} />
                          Restore Default Logo
                        </button>
                      )}
                    </div>

                    <div style={{ marginBottom: 24 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: 'hsl(240 5% 48%)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>Upload New Logo</p>
                      <div
                        onDragOver={e => { e.preventDefault(); setDragging(true) }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          border: `2px dashed ${dragging ? 'rgba(167,139,250,0.6)' : 'rgba(255,255,255,0.1)'}`,
                          borderRadius: 14,
                          padding: '32px 24px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          background: dragging ? 'rgba(167,139,250,0.04)' : 'rgba(255,255,255,0.01)',
                          transition: 'all 0.2s',
                        }}
                      >
                        <Upload size={24} style={{ color: 'hsl(240 5% 42%)', margin: '0 auto 10px' }} />
                        <p style={{ fontSize: 14, color: 'hsl(40 6% 80%)', fontWeight: 500, margin: '0 0 4px' }}>
                          Drag & drop your logo here
                        </p>
                        <p style={{ fontSize: 12, color: 'hsl(240 5% 45%)', margin: 0 }}>
                          or click to browse — PNG, JPG, SVG, WebP · Max 2MB
                        </p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
                      />
                    </div>

                    {logoError && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 10, background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.18)', marginBottom: 20 }}>
                        <AlertTriangle size={13} style={{ color: '#f87171', flexShrink: 0 }} />
                        <p style={{ fontSize: 12, color: '#f87171', fontWeight: 500, margin: 0 }}>{logoError}</p>
                        <button onClick={() => setLogoError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}><X size={12} /></button>
                      </div>
                    )}

                    {logoSuccess && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 10, background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.2)', marginBottom: 20 }}>
                        <CheckCircle size={13} style={{ color: '#a78bfa', flexShrink: 0 }} />
                        <p style={{ fontSize: 12, color: '#c4b5fd', fontWeight: 500, margin: 0 }}>Logo updated successfully across the entire platform!</p>
                      </div>
                    )}

                    {preview && (
                      <div style={{ marginBottom: 24 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: 'hsl(240 5% 48%)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>New Logo Preview</p>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 20,
                          padding: '18px 24px',
                          borderRadius: 14,
                          background: 'rgba(167,139,250,0.04)',
                          border: '1px solid rgba(167,139,250,0.15)',
                        }}>
                          <img src={preview} alt="Preview" style={{ height: 44, objectFit: 'contain', maxWidth: 160 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: 'hsl(40 6% 88%)', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName}</p>
                            <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)', margin: 0 }}>{fileSize}</p>
                          </div>
                          <button
                            onClick={() => { setPreview(null); setFileName(''); setFileSize(''); if (fileInputRef.current) fileInputRef.current.value = '' }}
                            style={{ background: 'none', border: 'none', color: 'hsl(240 5% 44%)', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={applyLogo}
                      disabled={!preview}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        width: '100%',
                        height: 48,
                        borderRadius: 12,
                        background: preview ? 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' : 'rgba(255,255,255,0.04)',
                        border: preview ? 'none' : '1px solid rgba(255,255,255,0.07)',
                        color: preview ? '#fff' : 'hsl(240 5% 38%)',
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: preview ? 'pointer' : 'not-allowed',
                        boxShadow: preview ? '0 8px 24px rgba(124,58,237,0.35)' : 'none',
                        transition: 'all 0.2s',
                      }}
                    >
                      <CheckCircle size={16} />
                      Apply Logo to Platform
                    </button>
                  </div>
                </div>

                {/* Platform Name Card */}
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 20,
                  overflow: 'hidden',
                  marginTop: 24,
                }}>
                  <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Type size={16} style={{ color: '#a78bfa' }} />
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>Platform Name</p>
                  </div>

                  <div style={{ padding: 28 }}>
                    <div style={{ marginBottom: 24 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: 'hsl(240 5% 48%)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>Current Name</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '14px 20px',
                          borderRadius: 12,
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.07)',
                          flex: 1,
                        }}>
                          <span style={{ fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>{platformName}</span>
                          {isCustomName && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)', padding: '3px 8px', borderRadius: 999, letterSpacing: '0.06em', marginLeft: 'auto' }}>CUSTOM</span>
                          )}
                        </div>
                        <button
                          onClick={() => setNameEditing(e => !e)}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 10, background: nameEditing ? 'rgba(167,139,250,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${nameEditing ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.07)'}`, color: nameEditing ? '#a78bfa' : 'hsl(40 6% 70%)', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          <Pencil size={12} />
                          {nameEditing ? 'Cancel' : 'Edit'}
                        </button>
                      </div>
                      {isCustomName && !nameEditing && (
                        <button
                          onClick={handleNameReset}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, padding: '6px 12px', borderRadius: 8, background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.18)', color: '#f87171', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                        >
                          <RotateCcw size={11} />
                          Restore Default Name
                        </button>
                      )}
                    </div>

                    {nameEditing && (
                      <div style={{ marginBottom: 4 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: 'hsl(240 5% 48%)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>New Platform Name</p>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <input
                            type="text"
                            value={nameInput}
                            onChange={e => setNameInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') applyName() }}
                            placeholder="e.g. Elitebullhood"
                            maxLength={40}
                            style={{
                              flex: 1, height: 46, padding: '0 14px',
                              borderRadius: 11, fontSize: 14, fontWeight: 500,
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(167,139,250,0.35)',
                              color: 'hsl(40 6% 92%)', outline: 'none', boxSizing: 'border-box',
                            }}
                            autoFocus
                          />
                          <button
                            onClick={applyName}
                            disabled={!nameInput.trim() || nameInput.trim() === platformName}
                            style={{
                              height: 46, padding: '0 20px', borderRadius: 11,
                              background: (nameInput.trim() && nameInput.trim() !== platformName) ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : 'rgba(255,255,255,0.04)',
                              border: 'none',
                              color: (nameInput.trim() && nameInput.trim() !== platformName) ? '#fff' : 'hsl(240 5% 40%)',
                              fontSize: 13, fontWeight: 700,
                              cursor: (nameInput.trim() && nameInput.trim() !== platformName) ? 'pointer' : 'not-allowed',
                              boxShadow: (nameInput.trim() && nameInput.trim() !== platformName) ? '0 6px 18px rgba(124,58,237,0.3)' : 'none',
                              display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
                            }}
                          >
                            <CheckCircle size={14} />
                            Apply
                          </button>
                        </div>
                        <p style={{ fontSize: 11, color: 'hsl(240 5% 40%)', marginTop: 8 }}>{nameInput.length}/40 characters · Press Enter to apply</p>
                      </div>
                    )}

                    {nameSuccess && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 10, background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.2)', marginTop: 12 }}>
                        <CheckCircle size={13} style={{ color: '#a78bfa', flexShrink: 0 }} />
                        <p style={{ fontSize: 12, color: '#c4b5fd', fontWeight: 500, margin: 0 }}>Platform name updated across the entire platform!</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Favicon Card */}
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 20,
                  overflow: 'hidden',
                  marginTop: 24,
                }}>
                  <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Sparkles size={16} style={{ color: '#a78bfa' }} />
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>Browser Favicon</p>
                  </div>

                  <div style={{ padding: 28 }}>
                    <div style={{ marginBottom: 28 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: 'hsl(240 5% 48%)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>Current Favicon</p>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 16,
                        padding: '16px 22px',
                        borderRadius: 14,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.07)',
                      }}>
                        {isCustomFavicon ? (
                          <img src={faviconUrl!} alt="Current favicon" style={{ width: 32, height: 32, objectFit: 'contain', imageRendering: 'pixelated' }} />
                        ) : (
                          <div style={{ width: 32, height: 32, borderRadius: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Sparkles size={14} style={{ color: 'hsl(240 5% 40%)' }} />
                          </div>
                        )}
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: 'hsl(40 6% 80%)', margin: '0 0 2px' }}>
                            {isCustomFavicon ? 'Custom favicon active' : 'Default favicon (favicon.ico)'}
                          </p>
                          <p style={{ fontSize: 11, color: 'hsl(240 5% 45%)', margin: 0 }}>
                            {isCustomFavicon ? 'Showing in browser tab' : 'Upload a custom icon below'}
                          </p>
                        </div>
                        {isCustomFavicon && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)', padding: '3px 8px', borderRadius: 999, letterSpacing: '0.06em', marginLeft: 4 }}>CUSTOM</span>
                        )}
                      </div>
                      {isCustomFavicon && (
                        <button
                          onClick={handleFaviconReset}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, padding: '6px 12px', borderRadius: 8, background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.18)', color: '#f87171', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                        >
                          <RotateCcw size={11} />
                          Restore Default Favicon
                        </button>
                      )}
                    </div>

                    <div style={{ marginBottom: 24 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: 'hsl(240 5% 48%)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>Upload New Favicon</p>
                      <div
                        onDragOver={e => { e.preventDefault(); setFaviconDragging(true) }}
                        onDragLeave={() => setFaviconDragging(false)}
                        onDrop={e => { e.preventDefault(); setFaviconDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFaviconFile(f) }}
                        onClick={() => faviconInputRef.current?.click()}
                        style={{
                          border: `2px dashed ${faviconDragging ? 'rgba(167,139,250,0.6)' : 'rgba(255,255,255,0.1)'}`,
                          borderRadius: 14,
                          padding: '28px 24px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          background: faviconDragging ? 'rgba(167,139,250,0.04)' : 'rgba(255,255,255,0.01)',
                          transition: 'all 0.2s',
                        }}
                      >
                        <Upload size={22} style={{ color: 'hsl(240 5% 42%)', margin: '0 auto 10px' }} />
                        <p style={{ fontSize: 14, color: 'hsl(40 6% 80%)', fontWeight: 500, margin: '0 0 4px' }}>
                          Drag & drop your favicon here
                        </p>
                        <p style={{ fontSize: 12, color: 'hsl(240 5% 45%)', margin: 0 }}>
                          or click to browse — PNG, ICO, SVG, WebP · Max 512KB · Recommended 32×32 or 64×64
                        </p>
                      </div>
                      <input
                        ref={faviconInputRef}
                        type="file"
                        accept="image/*,.ico"
                        style={{ display: 'none' }}
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleFaviconFile(f) }}
                      />
                    </div>

                    {faviconError && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 10, background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.18)', marginBottom: 20 }}>
                        <AlertTriangle size={13} style={{ color: '#f87171', flexShrink: 0 }} />
                        <p style={{ fontSize: 12, color: '#f87171', fontWeight: 500, margin: 0 }}>{faviconError}</p>
                        <button onClick={() => setFaviconError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}><X size={12} /></button>
                      </div>
                    )}

                    {faviconSuccess && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 10, background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.2)', marginBottom: 20 }}>
                        <CheckCircle size={13} style={{ color: '#a78bfa', flexShrink: 0 }} />
                        <p style={{ fontSize: 12, color: '#c4b5fd', fontWeight: 500, margin: 0 }}>Favicon updated! Check your browser tab.</p>
                      </div>
                    )}

                    {faviconPreview && (
                      <div style={{ marginBottom: 24 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: 'hsl(240 5% 48%)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>New Favicon Preview</p>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 20,
                          padding: '16px 20px',
                          borderRadius: 14,
                          background: 'rgba(167,139,250,0.04)',
                          border: '1px solid rgba(167,139,250,0.15)',
                        }}>
                          <img src={faviconPreview} alt="Favicon preview" style={{ width: 36, height: 36, objectFit: 'contain', imageRendering: 'pixelated', borderRadius: 6 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: 'hsl(40 6% 88%)', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{faviconFileName}</p>
                            <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)', margin: 0 }}>{faviconFileSize}</p>
                          </div>
                          <button
                            onClick={() => { setFaviconPreview(null); setFaviconFileName(''); setFaviconFileSize(''); if (faviconInputRef.current) faviconInputRef.current.value = '' }}
                            style={{ background: 'none', border: 'none', color: 'hsl(240 5% 44%)', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={applyFavicon}
                      disabled={!faviconPreview}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        width: '100%',
                        height: 48,
                        borderRadius: 12,
                        background: faviconPreview ? 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' : 'rgba(255,255,255,0.04)',
                        border: faviconPreview ? 'none' : '1px solid rgba(255,255,255,0.07)',
                        color: faviconPreview ? '#fff' : 'hsl(240 5% 38%)',
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: faviconPreview ? 'pointer' : 'not-allowed',
                        boxShadow: faviconPreview ? '0 8px 24px rgba(124,58,237,0.35)' : 'none',
                        transition: 'all 0.2s',
                      }}
                    >
                      <CheckCircle size={16} />
                      Apply Favicon to Platform
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ── SECURITY PAGE ── */}
            {activePage === 'security' && (
              <>
                <div style={{ marginBottom: 40 }}>
                  <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>Security</h1>
                  <p style={{ fontSize: 14, color: 'hsl(240 5% 55%)', marginTop: 6 }}>Manage admin credentials and access control.</p>
                </div>

                {/* Admin Credentials Card */}
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(248,113,113,0.12)',
                  borderRadius: 20,
                  overflow: 'hidden',
                  marginTop: 24,
                }}>
                  <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(248,113,113,0.1)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <ShieldCheck size={16} style={{ color: '#f87171' }} />
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>Admin Credentials</p>
                    <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: '#f87171', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', padding: '3px 8px', borderRadius: 999, letterSpacing: '0.06em' }}>SENSITIVE</span>
                  </div>

                  <div style={{ padding: 28 }}>
                    <div style={{ marginBottom: 24, padding: '18px 20px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                        <User size={13} style={{ color: '#c4b5fd' }} />
                        <p style={{ fontSize: 11, fontWeight: 700, color: '#c4b5fd', letterSpacing: '0.07em', textTransform: 'uppercase', margin: 0 }}>Current Admin Account</p>
                        {fetchingEmail && <span style={{ marginLeft: 'auto', fontSize: 10, color: 'hsl(240 5% 44%)' }}>Fetching from database…</span>}
                      </div>

                      {/* Email — live from database */}
                      <div style={{ marginBottom: 12 }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: 'hsl(240 5% 44%)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 5 }}>Login Email</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, padding: '9px 13px', borderRadius: 9, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'monospace', fontSize: 13, color: savedCreds?.email ? 'hsl(40 6% 88%)' : 'hsl(240 5% 38%)' }}>
                            {savedCreds?.email || (fetchingEmail ? '…' : 'Not available')}
                          </div>
                          {savedCreds?.email && (
                            <button onClick={() => copyCredField('email', savedCreds.email)} style={{ flexShrink: 0, height: 36, paddingInline: 12, borderRadius: 8, background: copiedField === 'email' ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.06)', border: `1px solid ${copiedField === 'email' ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.1)'}`, color: copiedField === 'email' ? '#a78bfa' : 'hsl(240 5% 55%)', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.2s' }}>
                              {copiedField === 'email' ? <><CheckCircle size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Password — security notice */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 14px', borderRadius: 9, background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.15)' }}>
                        <ShieldCheck size={14} style={{ color: '#fbbf24', flexShrink: 0 }} />
                        <p style={{ fontSize: 12, color: 'hsl(40 6% 58%)', margin: 0, lineHeight: 1.5 }}>
                          Passwords are encrypted and stored securely in the database. They cannot be retrieved — use the form below to set a new one.
                        </p>
                      </div>
                    </div>

                    <p style={{ fontSize: 12, color: 'hsl(240 5% 50%)', marginBottom: 24, lineHeight: 1.6 }}>
                      Update the admin login email or password. Leave a field blank to keep it unchanged. The admin will need to use the new credentials on their next login.
                    </p>

                    <div style={{ marginBottom: 18 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: 'hsl(240 5% 48%)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>New Admin Email</p>
                      <input
                        type="email"
                        value={adminEmail}
                        onChange={e => { setAdminEmail(e.target.value); setAdminError(''); setAdminSuccess('') }}
                        placeholder="Leave blank to keep current email"
                        style={{
                          width: '100%', height: 46, borderRadius: 11, padding: '0 16px',
                          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                          color: 'hsl(40 6% 88%)', fontSize: 14, outline: 'none',
                          fontFamily: "'Geist Sans','Inter',system-ui,sans-serif", boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: 18 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: 'hsl(240 5% 48%)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>New Admin Password</p>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={adminShowPw ? 'text' : 'password'}
                          value={adminPassword}
                          onChange={e => { setAdminPassword(e.target.value); setAdminError(''); setAdminSuccess('') }}
                          placeholder="Leave blank to keep current password"
                          style={{
                            width: '100%', height: 46, borderRadius: 11, padding: '0 44px 0 16px',
                            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                            color: 'hsl(40 6% 88%)', fontSize: 14, outline: 'none',
                            fontFamily: "'Geist Sans','Inter',system-ui,sans-serif", boxSizing: 'border-box',
                          }}
                        />
                        <button onClick={() => setAdminShowPw(v => !v)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'hsl(240 5% 44%)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                          {adminShowPw ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    {adminPassword && (
                      <div style={{ marginBottom: 18 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: 'hsl(240 5% 48%)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>Confirm New Password</p>
                        <div style={{ position: 'relative' }}>
                          <input
                            type={adminShowConfirm ? 'text' : 'password'}
                            value={adminConfirm}
                            onChange={e => { setAdminConfirm(e.target.value); setAdminError('') }}
                            placeholder="Re-enter new password"
                            style={{
                              width: '100%', height: 46, borderRadius: 11, padding: '0 44px 0 16px',
                              background: adminConfirm && adminConfirm !== adminPassword ? 'rgba(248,113,113,0.06)' : 'rgba(255,255,255,0.04)',
                              border: `1px solid ${adminConfirm && adminConfirm !== adminPassword ? 'rgba(248,113,113,0.35)' : 'rgba(255,255,255,0.1)'}`,
                              color: 'hsl(40 6% 88%)', fontSize: 14, outline: 'none',
                              fontFamily: "'Geist Sans','Inter',system-ui,sans-serif", boxSizing: 'border-box',
                            }}
                          />
                          <button onClick={() => setAdminShowConfirm(v => !v)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'hsl(240 5% 44%)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                            {adminShowConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </div>
                    )}

                    {adminError && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 10, background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.18)', marginBottom: 16 }}>
                        <AlertTriangle size={13} style={{ color: '#f87171', flexShrink: 0 }} />
                        <p style={{ fontSize: 12, color: '#f87171', fontWeight: 500, margin: 0 }}>{adminError}</p>
                        <button onClick={() => setAdminError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}><X size={12} /></button>
                      </div>
                    )}

                    {adminSuccess && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 10, background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.2)', marginBottom: 16 }}>
                        <CheckCircle size={13} style={{ color: '#a78bfa', flexShrink: 0 }} />
                        <p style={{ fontSize: 12, color: '#c4b5fd', fontWeight: 500, margin: 0 }}>{adminSuccess}</p>
                      </div>
                    )}

                    <button
                      onClick={applyAdminCredentials}
                      disabled={adminLoading}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        width: '100%', height: 48, borderRadius: 12,
                        background: adminLoading ? 'rgba(255,255,255,0.04)' : 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                        border: adminLoading ? '1px solid rgba(255,255,255,0.07)' : 'none',
                        color: adminLoading ? 'hsl(240 5% 38%)' : '#fff',
                        fontSize: 14, fontWeight: 700,
                        cursor: adminLoading ? 'not-allowed' : 'pointer',
                        boxShadow: adminLoading ? 'none' : '0 8px 24px rgba(220,38,38,0.3)',
                        transition: 'all 0.2s',
                      }}
                    >
                      <ShieldCheck size={16} />
                      {adminLoading ? 'Updating…' : 'Update Admin Credentials'}
                    </button>
                  </div>
                </div>

                {/* Admin Login Auth Code Card */}
                <div style={{
                  background: 'rgba(15,10,30,0.7)', border: '1px solid rgba(255,200,0,0.18)',
                  borderRadius: 20, padding: '28px 28px 24px', backdropFilter: 'blur(12px)',
                  marginTop: 24,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,rgba(234,179,8,0.25),rgba(202,138,4,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(234,179,8,0.3)' }}>
                      <KeyRound size={16} style={{ color: '#fbbf24' }} />
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>Admin Login Auth Code</p>
                    <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: '#fbbf24', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', padding: '3px 8px', borderRadius: 999, letterSpacing: '0.06em' }}>SECURITY</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'hsl(240 5% 48%)', marginBottom: 22, lineHeight: 1.6 }}>
                    Protect the admin login page with a secret code. The admin URL must include <span style={{ color: '#fbbf24', fontFamily: 'monospace' }}>?auth=YOUR_CODE</span> — anyone without it will see a 404 page.
                  </p>

                  {authCode ? (
                    <div style={{ marginBottom: 18, padding: '12px 16px', borderRadius: 12, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)' }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: 'hsl(240 5% 48%)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6 }}>Active Code</p>
                      <p style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 800, color: '#fbbf24', letterSpacing: '0.12em', margin: 0 }}>{authCode}</p>
                    </div>
                  ) : (
                    <div style={{ marginBottom: 18, padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}>
                      <p style={{ fontSize: 12, color: 'hsl(240 5% 40%)', margin: 0 }}>No auth code set — admin login page is publicly accessible.</p>
                    </div>
                  )}

                  {authCodeEditing ? (
                    <div style={{ marginBottom: 16 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: 'hsl(240 5% 48%)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>Set Auth Code</p>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                        <input
                          value={authCodeInput}
                          onChange={e => setAuthCodeInput(e.target.value)}
                          placeholder="e.g. ABcd-1234-EFgh"
                          style={{
                            flex: 1, height: 42, padding: '0 14px',
                            borderRadius: 10, fontSize: 14, fontFamily: 'monospace',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(251,191,36,0.35)',
                            color: '#fbbf24', outline: 'none', boxSizing: 'border-box',
                          }}
                        />
                        <button
                          onClick={generateAuthCode}
                          title="Generate random code"
                          style={{ height: 42, paddingInline: 12, borderRadius: 10, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                          <RefreshCw size={13} /> Generate
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={saveAuthCode}
                          disabled={!authCodeInput.trim()}
                          style={{ flex: 1, height: 38, borderRadius: 10, background: authCodeInput.trim() ? 'linear-gradient(135deg,#d97706,#b45309)' : 'rgba(255,255,255,0.05)', border: 'none', color: authCodeInput.trim() ? '#fff' : 'hsl(240 5% 38%)', fontSize: 13, fontWeight: 700, cursor: authCodeInput.trim() ? 'pointer' : 'not-allowed' }}>
                          Save Code
                        </button>
                        <button
                          onClick={() => { setAuthCodeEditing(false); setAuthCodeInput(authCode) }}
                          style={{ height: 38, paddingInline: 16, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(240 5% 50%)', fontSize: 13, cursor: 'pointer' }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                      <button
                        onClick={() => { setAuthCodeEditing(true); if (!authCodeInput) generateAuthCode() }}
                        style={{ height: 36, paddingInline: 14, borderRadius: 9, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Pencil size={12} />{authCode ? 'Change Code' : 'Set Auth Code'}
                      </button>
                      {authCode && (
                        <button
                          onClick={revokeAuthCode}
                          style={{ height: 36, paddingInline: 14, borderRadius: 9, background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Trash2 size={12} /> Revoke
                        </button>
                      )}
                    </div>
                  )}

                  {authCodeSaved && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 13px', borderRadius: 9, background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.2)', marginBottom: 14 }}>
                      <CheckCircle size={13} style={{ color: '#a78bfa' }} />
                      <p style={{ fontSize: 12, color: '#a78bfa', fontWeight: 600, margin: 0 }}>Auth code saved successfully.</p>
                    </div>
                  )}

                  {authCode && (
                    <div style={{ padding: '12px 14px', borderRadius: 11, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Link2 size={12} style={{ color: 'hsl(240 5% 48%)' }} />
                          <p style={{ fontSize: 10, fontWeight: 700, color: 'hsl(240 5% 48%)', letterSpacing: '0.07em', textTransform: 'uppercase', margin: 0 }}>Admin Login URL</p>
                        </div>
                        <button
                          onClick={copyAuthUrl}
                          style={{ height: 28, paddingInline: 10, borderRadius: 7, background: authCodeCopied ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.06)', border: `1px solid ${authCodeCopied ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.1)'}`, color: authCodeCopied ? '#a78bfa' : 'hsl(240 5% 55%)', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.2s' }}>
                          {authCodeCopied ? <><CheckCircle size={11} /> Copied!</> : <><Copy size={11} /> Copy URL</>}
                        </button>
                      </div>
                      <p style={{ fontFamily: 'monospace', fontSize: 11, color: 'hsl(240 5% 55%)', wordBreak: 'break-all', margin: 0, lineHeight: 1.5 }}>
                        {domainValue.replace(/\/$/, '')}/admin/login?auth=<span style={{ color: '#fbbf24' }}>{authCode}</span>
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── SETTINGS PAGE ── */}
            {activePage === 'settings' && (
              <>
                <div style={{ marginBottom: 40 }}>
                  <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>Settings</h1>
                  <p style={{ fontSize: 14, color: 'hsl(240 5% 55%)', marginTop: 6 }}>Configure email and integrations.</p>
                </div>

                {/* Domain Link Card */}
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 20,
                  overflow: 'hidden',
                  marginTop: 0,
                }}>
                  <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Globe size={16} style={{ color: '#a78bfa' }} />
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>Platform Domain</p>
                  </div>

                  <div style={{ padding: 28 }}>
                    {/* Current domain display */}
                    <div style={{ marginBottom: 24 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: 'hsl(240 5% 48%)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>Current Domain</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 10,
                          padding: '14px 20px', borderRadius: 12, flex: 1,
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.07)',
                          overflow: 'hidden',
                        }}>
                          <Globe size={14} style={{ color: 'hsl(240 5% 50%)', flexShrink: 0 }} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>{domainValue}</span>
                          {isCustomDomain && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)', padding: '3px 8px', borderRadius: 999, letterSpacing: '0.06em', marginLeft: 'auto', flexShrink: 0 }}>CUSTOM</span>
                          )}
                        </div>
                        <button
                          onClick={() => { setDomainEditing(e => !e); setDomainError('') }}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 10, background: domainEditing ? 'rgba(167,139,250,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${domainEditing ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.07)'}`, color: domainEditing ? '#a78bfa' : 'hsl(40 6% 70%)', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
                        >
                          <Pencil size={12} />
                          {domainEditing ? 'Cancel' : 'Edit'}
                        </button>
                      </div>
                      {isCustomDomain && !domainEditing && (
                        <button
                          onClick={resetDomain}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, padding: '6px 12px', borderRadius: 8, background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.18)', color: '#f87171', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                        >
                          <RotateCcw size={11} />
                          Reset to Current Origin
                        </button>
                      )}
                    </div>

                    {/* Edit input */}
                    {domainEditing && (
                      <div style={{ marginBottom: 4 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: 'hsl(240 5% 48%)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>New Domain URL</p>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <div style={{ position: 'relative', flex: 1 }}>
                            <Globe size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'hsl(240 5% 42%)', pointerEvents: 'none' }} />
                            <input
                              type="url"
                              value={domainInput}
                              onChange={e => { setDomainInput(e.target.value); setDomainError('') }}
                              onKeyDown={e => { if (e.key === 'Enter') applyDomain() }}
                              placeholder="https://myplatform.com"
                              style={{
                                width: '100%', height: 46, paddingLeft: 38, paddingRight: 14,
                                borderRadius: 11, fontSize: 13, fontFamily: 'monospace',
                                background: 'rgba(255,255,255,0.04)',
                                border: `1px solid ${domainError ? 'rgba(248,113,113,0.45)' : 'rgba(167,139,250,0.35)'}`,
                                color: 'hsl(40 6% 92%)', outline: 'none', boxSizing: 'border-box',
                              }}
                              autoFocus
                            />
                          </div>
                          <button
                            onClick={applyDomain}
                            disabled={!domainInput.trim()}
                            style={{
                              height: 46, padding: '0 20px', borderRadius: 11,
                              background: domainInput.trim() ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : 'rgba(255,255,255,0.04)',
                              border: 'none',
                              color: domainInput.trim() ? '#fff' : 'hsl(240 5% 40%)',
                              fontSize: 13, fontWeight: 700,
                              cursor: domainInput.trim() ? 'pointer' : 'not-allowed',
                              display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', flexShrink: 0,
                            }}
                          >
                            <CheckCircle size={14} />
                            Apply
                          </button>
                        </div>
                        {domainError && <p style={{ fontSize: 11, color: '#f87171', marginTop: 7 }}>{domainError}</p>}
                        <p style={{ fontSize: 11, color: 'hsl(240 5% 40%)', marginTop: domainError ? 4 : 8 }}>
                          Used for the admin login URL and outbound email links. Include the protocol (https://).
                        </p>
                      </div>
                    )}

                    {domainSuccess && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 10, background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.2)', marginTop: 12 }}>
                        <CheckCircle size={13} style={{ color: '#a78bfa', flexShrink: 0 }} />
                        <p style={{ fontSize: 12, color: '#c4b5fd', fontWeight: 500, margin: 0 }}>Domain updated successfully!</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Platform Email Card */}
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 20,
                  overflow: 'hidden',
                  marginTop: 24,
                }}>
                  <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Mail size={16} style={{ color: '#a78bfa' }} />
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>Platform Email</p>
                  </div>

                  <div style={{ padding: 28 }}>
                    <div style={{ marginBottom: 24 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: 'hsl(240 5% 48%)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>Current Support Email</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 10,
                          padding: '14px 20px', borderRadius: 12, flex: 1,
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.07)',
                        }}>
                          <Mail size={14} style={{ color: 'hsl(240 5% 50%)', flexShrink: 0 }} />
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#fff', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{platformEmail}</span>
                          {isCustomEmail && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)', padding: '3px 8px', borderRadius: 999, letterSpacing: '0.06em', marginLeft: 'auto', flexShrink: 0 }}>CUSTOM</span>
                          )}
                        </div>
                        <button
                          onClick={() => { setEmailEditing(e => !e); setEmailError('') }}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 10, background: emailEditing ? 'rgba(167,139,250,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${emailEditing ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.07)'}`, color: emailEditing ? '#a78bfa' : 'hsl(40 6% 70%)', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
                        >
                          <Pencil size={12} />
                          {emailEditing ? 'Cancel' : 'Edit'}
                        </button>
                      </div>
                      {isCustomEmail && !emailEditing && (
                        <button
                          onClick={handleEmailReset}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, padding: '6px 12px', borderRadius: 8, background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.18)', color: '#f87171', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                        >
                          <RotateCcw size={11} />
                          Restore Default Email
                        </button>
                      )}
                    </div>

                    {emailEditing && (
                      <div style={{ marginBottom: 4 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: 'hsl(240 5% 48%)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>New Support Email</p>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <div style={{ position: 'relative', flex: 1 }}>
                            <Mail size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'hsl(240 5% 42%)', pointerEvents: 'none' }} />
                            <input
                              type="email"
                              value={emailInput}
                              onChange={e => { setEmailInput(e.target.value); setEmailError('') }}
                              onKeyDown={e => { if (e.key === 'Enter') applyEmail() }}
                              placeholder="support@yourplatform.com"
                              style={{
                                width: '100%', height: 46, paddingLeft: 38, paddingRight: 14,
                                borderRadius: 11, fontSize: 13,
                                background: 'rgba(255,255,255,0.04)',
                                border: `1px solid ${emailError ? 'rgba(248,113,113,0.45)' : 'rgba(167,139,250,0.35)'}`,
                                color: 'hsl(40 6% 92%)', outline: 'none', boxSizing: 'border-box',
                              }}
                              autoFocus
                            />
                          </div>
                          <button
                            onClick={applyEmail}
                            disabled={!emailInput.trim() || emailInput.trim() === platformEmail}
                            style={{
                              height: 46, padding: '0 20px', borderRadius: 11,
                              background: (emailInput.trim() && emailInput.trim() !== platformEmail) ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : 'rgba(255,255,255,0.04)',
                              border: 'none',
                              color: (emailInput.trim() && emailInput.trim() !== platformEmail) ? '#fff' : 'hsl(240 5% 40%)',
                              fontSize: 13, fontWeight: 700,
                              cursor: (emailInput.trim() && emailInput.trim() !== platformEmail) ? 'pointer' : 'not-allowed',
                              display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
                              flexShrink: 0,
                            }}
                          >
                            <CheckCircle size={14} />
                            Apply
                          </button>
                        </div>
                        {emailError && (
                          <p style={{ fontSize: 11, color: '#f87171', marginTop: 7 }}>{emailError}</p>
                        )}
                        <p style={{ fontSize: 11, color: 'hsl(240 5% 40%)', marginTop: emailError ? 4 : 8 }}>This email appears on all support, legal, and contact pages.</p>
                      </div>
                    )}

                    {emailSuccess && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 10, background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.2)', marginTop: 12 }}>
                        <CheckCircle size={13} style={{ color: '#a78bfa', flexShrink: 0 }} />
                        <p style={{ fontSize: 12, color: '#c4b5fd', fontWeight: 500, margin: 0 }}>Support email updated across the entire platform!</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Live Chat Script Card */}
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 20,
                  overflow: 'hidden',
                  marginTop: 24,
                }}>
                  <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <MessageSquare size={16} style={{ color: '#a78bfa' }} />
                      <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>Live Chat Script</p>
                    </div>
                    {liveChatScript && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '4px 12px', borderRadius: 999, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.22)' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa', animation: 'pdBlink 1.8s ease-in-out infinite' }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#c4b5fd', letterSpacing: '0.05em' }}>ACTIVE</span>
                      </div>
                    )}
                  </div>

                  <div style={{ padding: 28 }}>
                    <p style={{ fontSize: 13, color: 'hsl(240 5% 52%)', marginBottom: 20, lineHeight: 1.6 }}>
                      Paste your live chat embed code below (e.g. Intercom, Tidio, Crisp, LiveChat, Tawk.to). The script will be injected into every page <strong style={{ color: 'hsl(40 6% 68%)' }}>except admin and principal</strong>.
                    </p>

                    <div style={{ marginBottom: 16, position: 'relative' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <Code2 size={13} style={{ color: 'hsl(240 5% 48%)' }} />
                        <p style={{ fontSize: 11, fontWeight: 700, color: 'hsl(240 5% 48%)', letterSpacing: '0.07em', textTransform: 'uppercase', margin: 0 }}>
                          {liveChatScript ? 'Current Script' : 'Paste Script Code'}
                        </p>
                      </div>
                      <textarea
                        value={chatInput}
                        onChange={e => { setChatInput(e.target.value); setChatDirty(e.target.value.trim() !== liveChatScript.trim()) }}
                        placeholder={`<!-- Example: Tidio -->\n<script src="//code.tidio.co/xxxxxxxx.js" async></script>\n\n<!-- Example: Tawk.to -->\n<script type="text/javascript">\nvar Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();\n(function(){ var s1=document.createElement("script")...\n})();\n</script>`}
                        spellCheck={false}
                        style={{
                          width: '100%',
                          minHeight: 160,
                          padding: '14px 16px',
                          borderRadius: 12,
                          fontSize: 12,
                          fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                          lineHeight: 1.65,
                          background: 'rgba(0,0,0,0.35)',
                          border: `1px solid ${chatDirty ? 'rgba(167,139,250,0.35)' : 'rgba(255,255,255,0.08)'}`,
                          color: chatInput ? '#a5f3a0' : 'hsl(240 5% 38%)',
                          outline: 'none',
                          resize: 'vertical',
                          boxSizing: 'border-box',
                          transition: 'border-color 0.2s',
                          caretColor: '#a78bfa',
                        }}
                        onFocus={e => { if (!chatDirty) e.target.style.borderColor = 'rgba(167,139,250,0.35)' }}
                        onBlur={e => { if (!chatDirty) e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
                      />
                      {chatInput && (
                        <p style={{ fontSize: 10, color: 'hsl(240 5% 36%)', marginTop: 6, textAlign: 'right' }}>
                          {chatInput.trim().length.toLocaleString()} characters
                        </p>
                      )}
                    </div>

                    {chatSuccess && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 10, background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.2)', marginBottom: 16 }}>
                        <CheckCircle size={13} style={{ color: '#a78bfa', flexShrink: 0 }} />
                        <p style={{ fontSize: 12, color: '#c4b5fd', fontWeight: 500, margin: 0 }}>Live chat script is now active on all non-admin pages!</p>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        onClick={applyChatScript}
                        disabled={!chatInput.trim() || !chatDirty}
                        style={{
                          flex: 1,
                          height: 46, borderRadius: 11,
                          background: (chatInput.trim() && chatDirty) ? 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' : 'rgba(255,255,255,0.04)',
                          border: 'none',
                          color: (chatInput.trim() && chatDirty) ? '#fff' : 'hsl(240 5% 38%)',
                          fontSize: 13, fontWeight: 700,
                          cursor: (chatInput.trim() && chatDirty) ? 'pointer' : 'not-allowed',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                          boxShadow: (chatInput.trim() && chatDirty) ? '0 6px 18px rgba(124,58,237,0.3)' : 'none',
                          transition: 'all 0.2s',
                        }}
                      >
                        <CheckCircle size={14} />
                        {liveChatScript ? 'Update Script' : 'Activate Script'}
                      </button>

                      {liveChatScript && (
                        <button
                          onClick={removeChatScript}
                          style={{
                            height: 46, padding: '0 18px', borderRadius: 11,
                            background: 'rgba(248,113,113,0.07)',
                            border: '1px solid rgba(248,113,113,0.2)',
                            color: '#f87171', fontSize: 13, fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 7,
                            transition: 'all 0.2s',
                          }}
                        >
                          <Trash2 size={14} />
                          Remove
                        </button>
                      )}
                    </div>

                    <div style={{ marginTop: 18, padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: 'hsl(240 5% 45%)', marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Supported Providers</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                        {['Intercom', 'Tidio', 'Crisp', 'Tawk.to', 'LiveChat', 'Zendesk', 'Freshchat', 'HubSpot', 'Drift', 'Any custom script'].map(p => (
                          <span key={p} style={{ fontSize: 11, color: 'hsl(240 5% 48%)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '3px 9px', borderRadius: 6 }}>{p}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Info note */}
            <p style={{ fontSize: 11, color: 'hsl(240 5% 32%)', textAlign: 'center', marginTop: 40, marginBottom: 20 }}>
              All changes apply instantly across all pages and persist in this browser.
            </p>
          </div>
        </div>

        {/* ── Mobile Bottom Tab Bar ── */}
        {isMobile && (
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
            background: 'rgba(10,7,22,0.96)',
            backdropFilter: 'blur(24px)',
            borderTop: '1px solid rgba(255,255,255,0.07)',
            display: 'flex',
            height: 64,
          }}>
            {[
              { key: 'branding', icon: <Image size={20} />, label: 'Branding' },
              { key: 'security', icon: <ShieldCheck size={20} />, label: 'Security' },
              { key: 'settings', icon: <Settings size={20} />, label: 'Settings' },
            ].map(item => {
              const active = activePage === item.key
              return (
                <button
                  key={item.key}
                  onClick={() => setActivePage(item.key as any)}
                  style={{
                    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 4, background: 'none', border: 'none', cursor: 'pointer',
                    color: active ? '#a78bfa' : 'hsl(240 5% 45%)',
                    transition: 'color 0.15s',
                    position: 'relative',
                    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                  }}
                >
                  {active && (
                    <div style={{
                      position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                      width: 32, height: 2, background: '#a78bfa', borderRadius: 2,
                    }} />
                  )}
                  {item.icon}
                  <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, letterSpacing: '0.03em' }}>{item.label}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pdFloatUp {
          0%   { transform: translateY(0) scale(1); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(-100vh) scale(0.5); opacity: 0; }
        }
        @keyframes pdBlink {
          0%, 100% { opacity: 1; box-shadow: 0 0 5px #a78bfa; }
          50%       { opacity: 0.35; box-shadow: none; }
        }
      `}</style>
    </div>
  )
}
