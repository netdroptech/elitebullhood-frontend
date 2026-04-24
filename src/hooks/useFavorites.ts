/**
 * useFavorites — persistent favorites list stored in localStorage.
 *
 * Shared across pages (LiveMarkets, TradeDetail, etc.) so starring on one
 * page surfaces on the Star view elsewhere.
 *
 * Canonical symbol format is "BTC/USDT" (with slash). Any "BTCUSDT" input
 * is normalized before write.
 */
import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'elite:favorites'

function readFavorites(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return ['BTC/USDT', 'ETH/USDT']
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function normalizeSymbol(sym: string): string {
  if (sym.includes('/')) return sym.toUpperCase()
  const upper = sym.toUpperCase()
  if (upper.endsWith('USDT')) return upper.slice(0, -4) + '/USDT'
  if (upper.endsWith('USD'))  return upper.slice(0, -3) + '/USD'
  return upper
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => readFavorites())

  // Keep state in sync across tabs / across components in the same tab
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) setFavorites(readFavorites())
    }
    function onCustom() { setFavorites(readFavorites()) }
    window.addEventListener('storage', onStorage)
    window.addEventListener('elite:favorites:changed', onCustom)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('elite:favorites:changed', onCustom)
    }
  }, [])

  const toggle = useCallback((symbol: string) => {
    const s = normalizeSymbol(symbol)
    setFavorites(prev => {
      const next = prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        // Notify other components in the same tab (storage event only fires cross-tab)
        window.dispatchEvent(new Event('elite:favorites:changed'))
      } catch { /* quota exceeded, storage disabled, etc. */ }
      return next
    })
  }, [])

  const isFavorite = useCallback(
    (symbol: string) => favorites.includes(normalizeSymbol(symbol)),
    [favorites],
  )

  return { favorites, toggle, isFavorite }
}
