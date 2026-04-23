import { createContext, useContext, useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'
const PRINCIPAL_KEY = 'Principal@elitebullhood#2027'

const DEFAULT_NAME  = 'Elitebullhood'
const DEFAULT_EMAIL = 'support@elitebullhood.com'

type PlatformSettingsContextType = {
  platformName: string
  updatePlatformName: (name: string) => void
  resetPlatformName: () => void
  platformEmail: string
  updatePlatformEmail: (email: string) => void
  resetPlatformEmail: () => void
}

const PlatformNameContext = createContext<PlatformSettingsContextType>({
  platformName: DEFAULT_NAME,
  updatePlatformName: () => {},
  resetPlatformName: () => {},
  platformEmail: DEFAULT_EMAIL,
  updatePlatformEmail: () => {},
  resetPlatformEmail: () => {},
})

export function PlatformNameProvider({ children }: { children: React.ReactNode }) {
  const [platformName, setPlatformName]   = useState<string>(DEFAULT_NAME)
  const [platformEmail, setPlatformEmail] = useState<string>(DEFAULT_EMAIL)

  useEffect(() => {
    fetch(`${API_BASE}/admin/public/branding`)
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data) {
          if (json.data.platform_name)  setPlatformName(json.data.platform_name)
          if (json.data.platform_email) setPlatformEmail(json.data.platform_email)
        }
      })
      .catch(() => {})
  }, [])

  const saveToDB = (settings: Record<string, string>) => {
    fetch(`${API_BASE}/admin/principal/branding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ principalKey: PRINCIPAL_KEY, settings }),
    }).catch(() => {})
  }

  const updatePlatformName = (name: string) => {
    const v = name.trim() || DEFAULT_NAME
    setPlatformName(v)
    saveToDB({ platform_name: v })
  }
  const resetPlatformName = () => {
    setPlatformName(DEFAULT_NAME)
    saveToDB({ platform_name: '' })
  }

  const updatePlatformEmail = (email: string) => {
    const v = email.trim() || DEFAULT_EMAIL
    setPlatformEmail(v)
    saveToDB({ platform_email: v })
  }
  const resetPlatformEmail = () => {
    setPlatformEmail(DEFAULT_EMAIL)
    saveToDB({ platform_email: '' })
  }

  return (
    <PlatformNameContext.Provider value={{
      platformName, updatePlatformName, resetPlatformName,
      platformEmail, updatePlatformEmail, resetPlatformEmail,
    }}>
      {children}
    </PlatformNameContext.Provider>
  )
}

export const usePlatformName  = () => useContext(PlatformNameContext)
export const DEFAULT_PLATFORM_NAME  = DEFAULT_NAME
export const DEFAULT_PLATFORM_EMAIL = DEFAULT_EMAIL
