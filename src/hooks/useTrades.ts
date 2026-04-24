/**
 * useTrades — simulated binary-options trading engine.
 *
 * Persists all trades + a running balance delta to localStorage.
 * Ticks every second to resolve expired trades with a random outcome.
 * On resolution, adjusts balance delta by (stake + profit).
 */
import { useState, useEffect, useCallback } from 'react'

export type TradeStatus = 'open' | 'won' | 'lost'
export type TradeDirection = 'CALL' | 'PUT'   // UP / DOWN
export type AssetCategory = 'crypto' | 'forex' | 'stock' | 'commodity'

export interface Trade {
  id:              string
  symbol:          string          // URL-style code, e.g. "BTCUSDT"
  pair:            string          // Display, e.g. "BTC/USDT"
  name:            string          // Human, e.g. "Bitcoin"
  category:        AssetCategory
  flagEmoji?:      string          // For non-crypto assets
  direction:       TradeDirection
  amount:          number          // Stake in USD
  payoutMultiplier: number         // e.g. 1.85 → 85 % profit on win
  openTime:        number          // Unix ms
  expiresAt:       number          // openTime + duration*1000
  durationLabel:   string          // "1 minute"
  openPrice:       number
  status:          TradeStatus
  closePrice?:     number
  profit?:         number          // Positive on win, negative on loss
}

const TRADES_KEY  = 'elite:trades'
const BALANCE_KEY = 'elite:balanceDelta'

function readTrades(): Trade[] {
  try {
    const raw = localStorage.getItem(TRADES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch { return [] }
}
function writeTrades(t: Trade[]) {
  try { localStorage.setItem(TRADES_KEY, JSON.stringify(t)) } catch {}
}
function readBalanceDelta(): number {
  try {
    const raw = localStorage.getItem(BALANCE_KEY)
    return raw ? parseFloat(raw) || 0 : 0
  } catch { return 0 }
}
function writeBalanceDelta(d: number) {
  try { localStorage.setItem(BALANCE_KEY, String(d)) } catch {}
}

function randomOutcome(): boolean {
  // Slight house edge — 48 % win rate
  return Math.random() < 0.48
}

function notify() {
  window.dispatchEvent(new Event('elite:trades:changed'))
}

export function useTrades() {
  const [trades, setTrades] = useState<Trade[]>(() => readTrades())
  const [balanceDelta, setBalanceDelta] = useState<number>(() => readBalanceDelta())

  // Cross-component / cross-tab sync
  useEffect(() => {
    function onChanged() {
      setTrades(readTrades())
      setBalanceDelta(readBalanceDelta())
    }
    function onStorage(e: StorageEvent) {
      if (e.key === TRADES_KEY || e.key === BALANCE_KEY) onChanged()
    }
    window.addEventListener('elite:trades:changed', onChanged)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('elite:trades:changed', onChanged)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  // Resolve expired trades every second
  useEffect(() => {
    function tick() {
      const now = Date.now()
      const current = readTrades()
      let changed = false
      let deltaChange = 0

      const next = current.map(t => {
        if (t.status !== 'open' || t.expiresAt > now) return t
        const won = randomOutcome()
        const profit = won
          ? +(t.amount * (t.payoutMultiplier - 1))
          : -t.amount
        const closeJitter = (Math.random() - 0.5) * 0.004   // ±0.2 %
        const closePrice = +(t.openPrice * (1 + closeJitter)).toFixed(6)
        changed = true
        // On resolution: return stake + profit to balance delta.
        // (We subtracted the full stake at open time.)
        deltaChange += t.amount + profit
        return {
          ...t,
          status: won ? 'won' : 'lost' as TradeStatus,
          profit,
          closePrice,
        }
      })

      if (changed) {
        writeTrades(next)
        const nextDelta = readBalanceDelta() + deltaChange
        writeBalanceDelta(nextDelta)
        notify()
      }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  /** Place a new trade. Caller must have already verified sufficient balance. */
  const openTrade = useCallback((input: Omit<Trade, 'id' | 'openTime' | 'expiresAt' | 'status'> & { durationSec: number }) => {
    const now = Date.now()
    const trade: Trade = {
      id:              `t_${now.toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
      symbol:          input.symbol,
      pair:            input.pair,
      name:            input.name,
      category:        input.category,
      flagEmoji:       input.flagEmoji,
      direction:       input.direction,
      amount:          input.amount,
      payoutMultiplier: input.payoutMultiplier,
      openTime:        now,
      expiresAt:       now + input.durationSec * 1000,
      durationLabel:   input.durationLabel,
      openPrice:       input.openPrice,
      status:          'open',
    }
    const current = readTrades()
    const next = [trade, ...current]
    writeTrades(next)
    // Lock stake immediately
    const nextDelta = readBalanceDelta() - input.amount
    writeBalanceDelta(nextDelta)
    notify()
    return trade
  }, [])

  /** Clear all trade history (useful for debugging / testing). */
  const clearAll = useCallback(() => {
    writeTrades([])
    writeBalanceDelta(0)
    notify()
  }, [])

  const openList   = trades.filter(t => t.status === 'open')
  const closedList = trades.filter(t => t.status !== 'open')

  return {
    trades, openList, closedList,
    balanceDelta,
    openTrade, clearAll,
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
