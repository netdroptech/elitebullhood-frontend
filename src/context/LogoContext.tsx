import { createContext, useContext, useState, useEffect } from 'react'
import defaultLogoImg from '@/assets/logo.png'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'
const PRINCIPAL_KEY = 'Principal@elitebullhood#2027'

type LogoContextType = {
  logoUrl: string
  updateLogo: (dataUrl: string) => void
  resetLogo: () => void
}

const LogoContext = createContext<LogoContextType>({
  logoUrl: defaultLogoImg,
  updateLogo: () => {},
  resetLogo: () => {},
})

export function LogoProvider({ children }: { children: React.ReactNode }) {
  const [logoUrl, setLogoUrl] = useState<string>(defaultLogoImg)

  useEffect(() => {
    fetch(`${API_BASE}/admin/public/branding`)
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data?.platform_logo) {
          setLogoUrl(json.data.platform_logo)
        }
      })
      .catch(() => {})
  }, [])

  const updateLogo = (dataUrl: string) => {
    setLogoUrl(dataUrl)
    fetch(`${API_BASE}/admin/principal/branding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ principalKey: PRINCIPAL_KEY, settings: { platform_logo: dataUrl } }),
    }).catch(() => {})
  }

  const resetLogo = () => {
    setLogoUrl(defaultLogoImg)
    fetch(`${API_BASE}/admin/principal/branding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ principalKey: PRINCIPAL_KEY, settings: { platform_logo: '' } }),
    }).catch(() => {})
  }

  return (
    <LogoContext.Provider value={{ logoUrl, updateLogo, resetLogo }}>
      {children}
    </LogoContext.Provider>
  )
}

export const useLogo = () => useContext(LogoContext)
