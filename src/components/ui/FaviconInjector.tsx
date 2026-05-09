import { useEffect } from 'react'
import { useFavicon } from '@/context/FaviconContext'

/**
 * Keeps the browser tab favicon in sync with the stored favicon URL.
 * When a custom favicon is set, replaces all <link rel="icon"> elements.
 * When reset, restores the original favicon from /favicon.ico.
 */
export function FaviconInjector() {
  const { faviconUrl } = useFavicon()

  useEffect(() => {
    // Remove existing favicon links
    const existing = document.querySelectorAll('link[rel~="icon"]')
    existing.forEach(el => el.remove())

    // Create a new favicon link
    const link = document.createElement('link')
    link.rel = 'icon'

    if (faviconUrl) {
      // Detect type from data URL prefix
      const mimeMatch = faviconUrl.match(/^data:([^;]+);/)
      link.type = mimeMatch ? mimeMatch[1] : 'image/png'
      link.href = faviconUrl
    } else {
      // Restore default favicon (now actually ships in /public).
      link.type = 'image/x-icon'
      link.href = '/favicon.ico'
    }

    document.head.appendChild(link)
  }, [faviconUrl])

  return null
}
