/**
 * useTrades — backend-backed trading engine.
 *
 * Calls the real /api/trades endpoints. Trades + balance updates are
 * persisted in MongoDB and visible to admins. Polls every 3 s while mounted
 * so open-trade countdowns and resolutions feel real-time.
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '@/lib/api'

export type TradeStatus = 'OPEN' | 'WON' | 'LOST' | 'open' | 'won' | 'lost'
export type TradeDirection = 'CALL' | 'PUT'
export type AssetCategory = 'crypto' | 'forex' | 'stock' | 'commodity'

/** Shape returned by the backend (/api/trades). */
interface RawTrade {
  id:              string
  userId?:         string
  symbol:          string
  pair:            string
  name:            string
  category:        AssetCategory
  flagEmoji?:      string | null
  direction:       TradeDirection
  amount:          number
  payoutMultiplier: number
  openTime:        number | string   // server returns ISO string
  expiresAt:       number | string
  durationSec?:    number
  durationLabel:   string
  openPrice:       number
  status:          TradeStatus
  closePrice?:     number | null
  profit?:         number | null
}

/** Canonical, normalised trade the rest of the app sees. Times are numbers
 *  (unix ms) and status is lower-case. */
export interface Trade {
  id:              string
  userId?:         string
  symbol:          string
  pair:            string
  name:            string
  category:        AssetCategory
  flagEmoji?:      string
  direction:       TradeDirection
  amount:          number
  payoutMultiplier: number
  openTime:        number
  expiresAt:       number
  durationSec?:    number
  durationLabel:   string
  openPrice:       number
  status:          'open' | 'won' | 'lost'
  closePrice?:     number
  profit?:         number
}

function normalizeTrade(t: RawTrade): Trade {
  const toMs = (v: number | string) => typeof v === 'string' ? new Date(v).getTime() : v
  const status = String(t.status).toLowerCase() as 'open' | 'won' | 'lost'
  return {
    id:              t.id,
    userId:          t.userId,
    symbol:          t.symbol,
    pair:            t.pair,
    name:            t.name,
    category:        t.category,
    flagEmoji:       t.flagEmoji ?? undefined,
    direction:       t.direction,
    amount:          t.amount,
    payoutMultiplier: t.payoutMultiplier,
    openTime:        toMs(t.openTime),
    expiresAt:       toMs(t.expiresAt),
    durationSec:     t.durationSec,
    durationLabel:   t.durationLabel,
    openPrice:       t.openPrice,
    status,
    closePrice:      t.closePrice ?? undefined,
    profit:          t.profit ?? undefined,
  }
}

export interface OpenTradePayload {
  symbol:          string
  pair:            string
  name:            string
  category:        AssetCategory
  flagEmoji?:      string
  direction:       TradeDirection
  amount:          number
  payoutMultiplier?: number
  durationSec:     number
  durationLabel:   string
  openPrice:       number
}

export function useTrades() {
  const [trades,    setTrades]    = useState<Trade[]>([])
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const mountedRef = useRef(true)

  const refresh = useCallback(async () => {
    try {
      const res: any = await api.get('/trades?status=all&limit=200')
      const list = (res?.data ?? []) as RawTrade[]
      if (!mountedRef.current) return
      setTrades(list.map(normalizeTrade))
      setError(null)
    } catch (err: any) {
      if (!mountedRef.current) return
      setError(err?.message ?? 'Failed to load trades')
    }
  }, [])

  // Initial fetch + poll every 3 s
  useEffect(() => {
    mountedRef.current = true
    refresh()
    const id = setInterval(refresh, 3000)
    return () => { mountedRef.current = false; clearInterval(id) }
  }, [refresh])

  // Cross-tab notifications (when another tab places/closes trades)
  useEffect(() => {
    function onChanged() { refresh() }
    window.addEventListener('elite:trades:changed', onChanged)
    return () => window.removeEventListener('elite:trades:changed', onChanged)
  }, [refresh])

  const openTrade = useCallback(async (input: OpenTradePayload) => {
    setLoading(true)
    setError(null)
    try {
      // Direct fetch so we can surface the server's per-field validation errors
      const token = localStorage.getItem('apex_token')
      const base  = import.meta.env.VITE_API_URL ?? 'https://elitebullhood-backend.onrender.com/api'
      const res = await fetch(`${base}/trades`, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(input),
      })
      const body = await res.json().catch(() => ({}))

      if (!res.ok || !body?.success) {
        // Build a detailed message: "amount: must be > 0; openPrice: required"
        let msg = body?.message ?? `Request failed (${res.status})`
        if (Array.isArray(body?.errors) && body.errors.length) {
          msg = body.errors.map((e: any) => `${e.field}: ${e.message}`).join('; ')
        }
        setError(msg)
        return { ok: false as const, message: msg }
      }

      const created = body.data as RawTrade
      if (created) {
        setTrades(prev => [normalizeTrade(created), ...prev])
      }
      window.dispatchEvent(new Event('elite:trades:changed'))
      return { ok: true as const, trade: created }
    } catch (err: any) {
      const msg = err?.message ?? 'Failed to place trade.'
      setError(msg)
      return { ok: false as const, message: msg }
    } finally {
      setLoading(false)
    }
  }, [])

  const clearAll = useCallback(async () => {
    try {
      await api.delete('/trades/history')
      await refresh()
      window.dispatchEvent(new Event('elite:trades:changed'))
    } catch (err: any) {
      setError(err?.message ?? 'Failed to clear history')
    }
  }, [refresh])

  const openList   = trades.filter(t => t.status === 'open')
  const closedList = trades.filter(t => t.status !== 'open')

  // Backwards-compat: balanceDelta kept as 0 because the real balance now
  // lives in the backend User row. Components should read user.balance.
  const balanceDelta = 0

  return {
    trades, openList, closedList,
    loading, error,
    balanceDelta,
    openTrade, clearAll, refresh,
  }
}

/** Parse our human-readable duration string into seconds. */
export function parseDurationSec(label: string): number {
  const m = label.match(/^(\d+(?:\.\d+)?)\s*(second|minute|hour)s?/i)
  if (!m) return 60
  const n = parseFloat(m[1])
  const unit = m[2].toLowerCase()
  if (unit.startsWith('second')) return n
  if (unit.startsWith('minute')) return n * 60
  if (unit.startsWith('hour'))   return n * 3600
  return 60
}
