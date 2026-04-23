import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'
const PRINCIPAL_KEY = 'Principal@elitebullhood#2027'

interface FaviconContextValue {
  faviconUrl: string | null
  updateFavicon: (dataUrl: string) => void
  resetFavicon: () => void
}

const FaviconContext = createContext<FaviconContextValue>({
  faviconUrl: null,
  updateFavicon: () => {},
  resetFavicon: () => {},
})

export function FaviconProvider({ children }: { children: ReactNode }) {
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API_BASE}/admin/public/branding`)
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data?.platform_favicon) {
          setFaviconUrl(json.data.platform_favicon)
        }
      })
      .catch(() => {})
  }, [])

  function updateFavicon(dataUrl: string) {
    setFaviconUrl(dataUrl)
    fetch(`${API_BASE}/admin/principal/branding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ principalKey: PRINCIPAL_KEY, settings: { platform_favicon: dataUrl } }),
    }).catch(() => {})
  }

  function resetFavicon() {
    setFaviconUrl(null)
    fetch(`${API_BASE}/admin/principal/branding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ principalKey: PRINCIPAL_KEY, settings: { platform_favicon: '' } }),
    }).catch(() => {})
  }

  return (
    <FaviconContext.Provider value={{ faviconUrl, updateFavicon, resetFavicon }}>
      {children}
    </FaviconContext.Provider>
  )
}

export function useFavicon() {
  return useContext(FaviconContext)
}
