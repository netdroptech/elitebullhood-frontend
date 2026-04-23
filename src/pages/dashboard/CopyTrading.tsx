import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Users, TrendingUp, Shield, Copy, RefreshCw, CheckCircle,
  AlertTriangle, ArrowDownLeft, X, ChevronRight, StopCircle,
  Sliders, Clock, BarChart2, Zap, DollarSign, Activity,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

// ─── Types ────────────────────────────────────────────────────────────────────
interface CopyTrader {
  id:            string
  name:          string
  username:      string
  imageUrl:      string | null
  strategy:      string
  description:   string | null
  winRate:       number
  monthlyReturn: number
  totalReturn:   number
  returnPct:     number
  followers:     number
  minAmount:     number
  riskLevel:     string
  tags:          string[]
  isActive:      boolean
  isVerified:    boolean
  sortOrder:     number
}

interface ActiveCopy {
  id:               string
  traderId:         string
  traderName:       string
  profilePic:       string | null
  allocatedAmount:  number
  maxDrawdown:      number | null
  profitLoss:       number
  roiPct:           number
  status:           string
  startTime:        string
  traderReturnPct:  number
  traderWinRate:    number
  minAmount:        number
}

interface CopyHistoryRow {
  id:              string
  traderId:        string
  traderName:      string
  profilePic:      string | null
  allocatedAmount: number
  profitLoss:      number
  roiPct:          number
  status:          string
  startTime:       string
  stopTime:        string | null
  traderReturnPct: number
}

interface CopyTrade {
  id:             string
  relationshipId: string
  traderId:       string
  traderName:     string
  asset:          string
  tradeType:      string
  entryPrice:     number
  exitPrice:      number | null
  lotSize:        number
  profitLoss:     number
  status:         string
  createdAt:      string
  closedAt:       string | null
}

type Tab = 'find' | 'active' | 'history' | 'trades'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const RISK_COLORS: Record<string, { color: string; bg: string }> = {
  Low:    { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)'  },
  Medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
  High:   { color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
}
const AVATAR_COLORS = ['#8b5cf6','#ec4899','#f59e0b','#8b5cf6','#3b82f6','#f97316','#06b6d4','#a3e635']

function avatarColor(name: string) {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}
function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??'
}
function fmtDate(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function fmtMoney(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') ?? 'http://localhost:4000'
function imgSrc(url: string | null) {
  if (!url) return null
  if (url.startsWith('http')) return url
  return `${API_BASE}${url}`
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function TraderAvatar({ name, imageUrl, size = 48 }: { name: string; imageUrl: string | null; size?: number }) {
  const [err, setErr] = useState(false)
  const src = imgSrc(imageUrl)
  const color = avatarColor(name)
  if (src && !err) {
    return (
      <img src={src} alt={name} onError={() => setErr(true)}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover',
          flexShrink: 0, border: `2px solid ${color}55`, boxShadow: `0 0 0 3px ${color}18` }} />
    )
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `${color}22`, border: `2px solid ${color}55`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.28, fontWeight: 800, color }}>
      {initials(name)}
    </div>
  )
}

function Sparkline({ totalReturn, color }: { totalReturn: number; color: string }) {
  const seed = Math.abs(totalReturn * 7) % 100
  const pts = Array.from({ length: 12 }, (_, i) => {
    const trend = (i / 11) * totalReturn
    const noise = Math.sin((i + seed) * 1.3) * (totalReturn * 0.08)
    return 100 + trend * 0.6 + noise
  })
  const min = Math.min(...pts); const max = Math.max(...pts); const range = max - min || 1
  const W = 200, H = 48
  const svgPts = pts.map((v, i) => {
    const x = (i / (pts.length - 1)) * W
    const y = H - ((v - min) / range) * (H - 8) - 4
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <polyline points={svgPts} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

function Skeleton({ w = '100%', h = 14 }: { w?: string | number; h?: string | number }) {
  return <div style={{ width: w, height: h, borderRadius: 6, background: 'rgba(255,255,255,0.07)', animation: 'skPulse 1.4s ease-in-out infinite' }} />
}

function PnlBadge({ value }: { value: number }) {
  const pos = value >= 0
  return (
    <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
      color: pos ? '#a78bfa' : '#f87171',
      background: pos ? 'rgba(167,139,250,0.12)' : 'rgba(248,113,113,0.12)' }}>
      {pos ? '+' : ''}{fmtMoney(value)}
    </span>
  )
}

// ─── Modals ───────────────────────────────────────────────────────────────────
interface StartCopyModalProps {
  trader: CopyTrader
  balance: number
  onClose: () => void
  onConfirm: (traderId: string, amount: number, maxDrawdown: number | null) => Promise<void>
  submitting: boolean
}
function StartCopyModal({ trader, balance, onClose, onConfirm, submitting }: StartCopyModalProps) {
  const [amount, setAmount]     = useState(String(trader.minAmount))
  const [drawdown, setDrawdown] = useState('')
  const [err, setErr]           = useState('')

  async function handleSubmit() {
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) { setErr('Enter a valid amount'); return }
    if (amt < trader.minAmount) { setErr(`Minimum is $${trader.minAmount}`); return }
    if (amt > balance) { setErr('Amount exceeds your balance'); return }
    const dd = drawdown.trim() ? parseFloat(drawdown) : null
    if (dd !== null && (isNaN(dd) || dd <= 0 || dd > 100)) { setErr('Max drawdown must be 1–100%'); return }
    setErr('')
    await onConfirm(trader.id, amt, dd)
  }

  return (
    <div onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: 'hsl(260 60% 6%)', border: '1px solid rgba(167,139,250,0.18)',
          borderRadius: '1.125rem', padding: '2rem', maxWidth: 440, width: '100%',
          animation: 'fadeIn 0.18s ease', boxShadow: '0 24px 64px rgba(0,0,0,0.6)', position: 'relative' }}>

        {/* Close */}
        <button onClick={onClose}
          style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none',
            cursor: 'pointer', color: 'hsl(240 5% 50%)', padding: 4 }}>
          <X size={16} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
          <TraderAvatar name={trader.name} imageUrl={trader.imageUrl} size={48} />
          <div>
            <p style={{ fontWeight: 700, color: 'hsl(40 6% 93%)', fontSize: 15 }}>{trader.name}</p>
            <p style={{ fontSize: 12, color: 'hsl(240 5% 50%)', marginTop: 2 }}>{trader.strategy}</p>
          </div>
          {/* 0% fees badge */}
          <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, padding: '3px 10px',
            borderRadius: 999, background: 'rgba(167,139,250,0.12)', color: '#c4b5fd',
            border: '1px solid rgba(167,139,250,0.2)' }}>
            <Zap size={9} style={{ display: 'inline', marginRight: 3, verticalAlign: 'middle' }} />
            0% fees
          </span>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: '1.5rem' }}>
          {[
            { label: 'All-time Return', value: `+${trader.totalReturn.toFixed(1)}%`, color: '#a78bfa' },
            { label: 'Win Rate', value: `${trader.winRate}%`, color: '#a78bfa' },
            { label: 'Risk', value: trader.riskLevel, color: RISK_COLORS[trader.riskLevel]?.color ?? '#f59e0b' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '0.5rem', padding: '0.625rem', textAlign: 'center' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 700, color: s.color }}>{s.value}</p>
              <p style={{ fontSize: 10, color: 'hsl(240 5% 48%)', marginTop: 2 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Allocation input */}
        <label style={{ display: 'block', marginBottom: '1rem' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'hsl(240 5% 60%)', display: 'block', marginBottom: 6 }}>
            Allocation Amount
          </span>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              color: 'hsl(240 5% 55%)', fontSize: 13 }}>$</span>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} min={trader.minAmount}
              style={{ width: '100%', padding: '0.625rem 0.875rem 0.625rem 1.75rem',
                borderRadius: '0.6rem', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)', color: 'hsl(40 6% 92%)',
                fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 11 }}>
            <span style={{ color: 'hsl(240 5% 48%)' }}>Min: <span style={{ color: '#a78bfa' }}>${trader.minAmount.toLocaleString()}</span></span>
            <span style={{ color: 'hsl(240 5% 48%)' }}>Balance: <span style={{ color: 'hsl(40 6% 80%)' }}>${fmtMoney(balance)}</span></span>
          </div>
        </label>

        {/* Max Drawdown input */}
        <label style={{ display: 'block', marginBottom: '1.25rem' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'hsl(240 5% 60%)', display: 'block', marginBottom: 6 }}>
            Max Drawdown Limit <span style={{ fontWeight: 400, color: 'hsl(240 5% 42%)' }}>(optional — stops copying if loss hits this %)</span>
          </span>
          <div style={{ position: 'relative' }}>
            <input type="number" value={drawdown} onChange={e => setDrawdown(e.target.value)}
              placeholder="e.g. 20" min={1} max={100}
              style={{ width: '100%', padding: '0.625rem 2rem 0.625rem 0.875rem',
                borderRadius: '0.6rem', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)', color: 'hsl(40 6% 92%)',
                fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              color: 'hsl(240 5% 55%)', fontSize: 13 }}>%</span>
          </div>
        </label>

        {err && (
          <p style={{ fontSize: 12, color: '#f87171', marginBottom: '1rem',
            padding: '8px 12px', background: 'rgba(248,113,113,0.08)',
            borderRadius: '0.5rem', border: '1px solid rgba(248,113,113,0.2)' }}>{err}</p>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: '0.65rem', borderRadius: '0.6rem', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(240 5% 65%)' }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            style={{ flex: 2, padding: '0.65rem', borderRadius: '0.6rem', fontSize: 13, fontWeight: 700,
              cursor: submitting ? 'not-allowed' : 'pointer',
              background: submitting ? 'rgba(167,139,250,0.2)' : 'linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)',
              color: submitting ? '#a78bfa' : '#050505', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              boxShadow: submitting ? 'none' : '0 4px 16px rgba(167,139,250,0.2)' }}>
            {submitting ? 'Starting…' : (<><Copy size={13} /> Start Copying</>)}
          </button>
        </div>
      </div>
    </div>
  )
}

interface AdjustAllocModalProps {
  copy: ActiveCopy
  balance: number
  onClose: () => void
  onConfirm: (id: string, amount: number) => Promise<void>
  submitting: boolean
}
function AdjustAllocModal({ copy, balance, onClose, onConfirm, submitting }: AdjustAllocModalProps) {
  const [amount, setAmount] = useState(String(copy.allocatedAmount))
  const [err, setErr] = useState('')

  async function handleSubmit() {
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) { setErr('Enter a valid amount'); return }
    if (amt < copy.minAmount) { setErr(`Minimum is $${copy.minAmount}`); return }
    const diff = amt - copy.allocatedAmount
    if (diff > 0 && diff > balance) { setErr(`Need $${fmtMoney(diff)} more but balance is $${fmtMoney(balance)}`); return }
    setErr('')
    await onConfirm(copy.id, amt)
  }

  return (
    <div onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: 'hsl(260 60% 6%)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '1.125rem', padding: '2rem', maxWidth: 380, width: '100%',
          animation: 'fadeIn 0.18s ease', boxShadow: '0 24px 64px rgba(0,0,0,0.6)', position: 'relative' }}>

        <button onClick={onClose}
          style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none',
            cursor: 'pointer', color: 'hsl(240 5% 50%)', padding: 4 }}>
          <X size={16} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: '0.6rem', background: 'rgba(167,139,250,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sliders size={16} style={{ color: '#a78bfa' }} />
          </div>
          <div>
            <p style={{ fontWeight: 700, color: 'hsl(40 6% 93%)', fontSize: 14 }}>Adjust Allocation</p>
            <p style={{ fontSize: 12, color: 'hsl(240 5% 50%)' }}>{copy.traderName}</p>
          </div>
        </div>

        <label style={{ display: 'block', marginBottom: '1.25rem' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'hsl(240 5% 60%)', display: 'block', marginBottom: 6 }}>New Allocation</span>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'hsl(240 5% 55%)', fontSize: 13 }}>$</span>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} min={copy.minAmount}
              style={{ width: '100%', padding: '0.625rem 0.875rem 0.625rem 1.75rem',
                borderRadius: '0.6rem', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)', color: 'hsl(40 6% 92%)',
                fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 11 }}>
            <span style={{ color: 'hsl(240 5% 48%)' }}>Current: <span style={{ color: '#a78bfa' }}>${fmtMoney(copy.allocatedAmount)}</span></span>
            <span style={{ color: 'hsl(240 5% 48%)' }}>Avail balance: <span style={{ color: 'hsl(40 6% 80%)' }}>${fmtMoney(balance)}</span></span>
          </div>
        </label>

        {err && <p style={{ fontSize: 12, color: '#f87171', marginBottom: '1rem', padding: '8px 12px', background: 'rgba(248,113,113,0.08)', borderRadius: '0.5rem', border: '1px solid rgba(248,113,113,0.2)' }}>{err}</p>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: '0.65rem', borderRadius: '0.6rem', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(240 5% 65%)' }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            style={{ flex: 2, padding: '0.65rem', borderRadius: '0.6rem', fontSize: 13, fontWeight: 700,
              cursor: submitting ? 'not-allowed' : 'pointer',
              background: 'linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)',
              color: '#050505', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              boxShadow: '0 4px 16px rgba(167,139,250,0.2)' }}>
            {submitting ? 'Updating…' : 'Update Allocation'}
          </button>
        </div>
      </div>
    </div>
  )
}

interface InsufficientModalProps {
  trader: CopyTrader
  balance: number
  onClose: () => void
}
function InsufficientModal({ trader, balance, onClose }: InsufficientModalProps) {
  const navigate = useNavigate()
  return (
    <div onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: 'hsl(260 60% 6%)', border: '1px solid rgba(248,113,113,0.25)',
          borderRadius: '1.125rem', padding: '2rem', maxWidth: 420, width: '100%',
          animation: 'fadeIn 0.18s ease', boxShadow: '0 24px 64px rgba(0,0,0,0.6)', position: 'relative' }}>
        <button onClick={onClose}
          style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none',
            cursor: 'pointer', color: 'hsl(240 5% 50%)', padding: 4 }}>
          <X size={16} />
        </button>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(248,113,113,0.12)',
          border: '1px solid rgba(248,113,113,0.2)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', marginBottom: '1.25rem' }}>
          <AlertTriangle size={22} style={{ color: '#f87171' }} />
        </div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'hsl(40 6% 94%)', marginBottom: 8 }}>Insufficient Balance</h3>
        <p style={{ fontSize: 13.5, color: 'hsl(240 5% 58%)', lineHeight: 1.6, marginBottom: '0.5rem' }}>
          To copy <span style={{ color: 'hsl(40 6% 88%)', fontWeight: 600 }}>{trader.name}</span>, you need a minimum of{' '}
          <span style={{ color: '#a78bfa', fontWeight: 700 }}>${trader.minAmount.toLocaleString()}</span>.
        </p>
        <p style={{ fontSize: 13, color: 'hsl(240 5% 48%)', marginBottom: '1.5rem' }}>
          Your current balance is{' '}
          <span style={{ color: '#f87171', fontWeight: 600 }}>${fmtMoney(balance)}</span>.
          {' '}Deposit to start copying.
        </p>
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '0.6rem',
          padding: '0.75rem 1rem', marginBottom: '1.5rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 10, color: 'hsl(240 5% 50%)', marginBottom: 2 }}>Amount needed</p>
            <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f87171' }}>
              +${fmtMoney(Math.max(0, trader.minAmount - balance))}
            </p>
          </div>
          <ArrowDownLeft size={20} style={{ color: '#f87171', opacity: 0.6 }} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: '0.65rem', borderRadius: '0.6rem', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(240 5% 65%)' }}>
            Cancel
          </button>
          <button onClick={() => { onClose(); navigate('/dashboard/deposit') }}
            style={{ flex: 2, padding: '0.65rem', borderRadius: '0.6rem', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', background: 'linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)',
              color: '#050505', border: 'none', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 6, boxShadow: '0 4px 16px rgba(167,139,250,0.2)' }}>
            <ArrowDownLeft size={14} /> Deposit Funds
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function CopyTrading() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Tab
  const [tab, setTab] = useState<Tab>('find')

  // Find Traders tab
  const [traders,    setTraders]    = useState<CopyTrader[]>([])
  const [tradersLoading, setTradersLoading] = useState(true)
  const [tradersError,   setTradersError]   = useState<string | null>(null)
  const [riskFilter, setRiskFilter] = useState('All')

  // Active Copies tab
  const [activeCopies, setActiveCopies] = useState<ActiveCopy[]>([])
  const [activeLoading, setActiveLoading] = useState(false)
  const [activeError,   setActiveError]   = useState<string | null>(null)

  // History tab
  const [history,       setHistory]       = useState<CopyHistoryRow[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError,   setHistoryError]   = useState<string | null>(null)

  // Trades tab
  const [trades,       setTrades]       = useState<CopyTrade[]>([])
  const [tradesLoading, setTradesLoading] = useState(false)
  const [tradesError,   setTradesError]   = useState<string | null>(null)

  // Modals
  const [startModal,      setStartModal]      = useState<CopyTrader | null>(null)
  const [insufficientModal, setInsufficientModal] = useState<CopyTrader | null>(null)
  const [adjustModal,     setAdjustModal]     = useState<ActiveCopy | null>(null)
  const [submitting,      setSubmitting]      = useState(false)
  const [actionError,     setActionError]     = useState<string | null>(null)

  const balance = user?.balance ?? 0

  // ── Fetch helpers ────────────────────────────────────────────────────────
  const fetchTraders = useCallback(async () => {
    setTradersLoading(true); setTradersError(null)
    try {
      const res = await api.get<{ success: boolean; data: CopyTrader[] }>('/user/traders')
      setTraders(res.data)
    } catch (e: any) {
      setTradersError(e?.message ?? 'Failed to load traders.')
    } finally { setTradersLoading(false) }
  }, [])

  const fetchActiveCopies = useCallback(async () => {
    setActiveLoading(true); setActiveError(null)
    try {
      const res = await api.get<{ success: boolean; data: ActiveCopy[] }>('/user/copy/active')
      setActiveCopies(res.data ?? [])
    } catch (e: any) {
      setActiveError(e?.message ?? 'Failed to load active copies.')
    } finally { setActiveLoading(false) }
  }, [])

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true); setHistoryError(null)
    try {
      const res = await api.get<{ success: boolean; data: CopyHistoryRow[] }>('/user/copy/history')
      setHistory(res.data ?? [])
    } catch (e: any) {
      setHistoryError(e?.message ?? 'Failed to load history.')
    } finally { setHistoryLoading(false) }
  }, [])

  const fetchTrades = useCallback(async () => {
    setTradesLoading(true); setTradesError(null)
    try {
      const res = await api.get<{ success: boolean; data: CopyTrade[] }>('/user/copy/trades')
      setTrades(res.data ?? [])
    } catch (e: any) {
      setTradesError(e?.message ?? 'Failed to load trades.')
    } finally { setTradesLoading(false) }
  }, [])

  // Load on mount + tab switch
  useEffect(() => { fetchTraders() }, [fetchTraders])
  useEffect(() => {
    if (tab === 'active')  fetchActiveCopies()
    if (tab === 'history') fetchHistory()
    if (tab === 'trades')  fetchTrades()
  }, [tab])

  // ── Derived ───────────────────────────────────────────────────────────────
  const filtered = useMemo(() =>
    riskFilter === 'All' ? traders : traders.filter(t => t.riskLevel === riskFilter),
  [traders, riskFilter])

  const avgWin = traders.length
    ? (traders.reduce((s, t) => s + t.winRate, 0) / traders.length).toFixed(1) : '—'
  const avgRiskLabel = traders.length === 0 ? '—'
    : (() => {
        const score = traders.reduce((s, t) => s + (t.riskLevel === 'High' ? 3 : t.riskLevel === 'Medium' ? 2 : 1), 0) / traders.length
        return score >= 2.5 ? 'High' : score >= 1.5 ? 'Medium' : 'Low'
      })()

  const activePnl  = activeCopies.reduce((s, c) => s + c.profitLoss, 0)
  const totalAlloc = activeCopies.reduce((s, c) => s + c.allocatedAmount, 0)

  // Active trader ids (to disable "Copy" button for already-copied traders)
  const activeTraderIds = useMemo(() => new Set(activeCopies.map(c => c.traderId)), [activeCopies])

  // ── Actions ───────────────────────────────────────────────────────────────
  async function handleStartCopy(traderId: string, amount: number, maxDrawdown: number | null) {
    setSubmitting(true); setActionError(null)
    try {
      await api.post('/user/copy/start', { traderId, allocatedAmount: amount, maxDrawdown })
      setStartModal(null)
      await fetchActiveCopies()
      await fetchTraders()
      setTab('active')
    } catch (e: any) {
      setActionError(e?.message ?? 'Failed to start copying')
    } finally { setSubmitting(false) }
  }

  async function handleStopCopy(id: string) {
    if (!confirm('Stop copying this trader? Your allocated funds will be returned.')) return
    try {
      await api.post(`/user/copy/${id}/stop`, {})
      await fetchActiveCopies()
    } catch (e: any) {
      alert(e?.message ?? 'Failed to stop copying')
    }
  }

  async function handleAdjustAlloc(id: string, amount: number) {
    setSubmitting(true)
    try {
      await api.patch(`/user/copy/${id}/allocation`, { allocatedAmount: amount })
      setAdjustModal(null)
      await fetchActiveCopies()
    } catch (e: any) {
      alert(e?.message ?? 'Failed to update allocation')
    } finally { setSubmitting(false) }
  }

  function onClickCopy(trader: CopyTrader) {
    if (activeTraderIds.has(trader.id)) return  // already copied, handled in active tab
    if (balance < trader.minAmount) {
      setInsufficientModal(trader)
      return
    }
    setActionError(null)
    setStartModal(trader)
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  const TABS: { id: Tab; label: string; icon: any; badge?: number }[] = [
    { id: 'find',    label: 'Find Traders',  icon: Users },
    { id: 'active',  label: 'Active Copies', icon: Activity, badge: activeCopies.length },
    { id: 'history', label: 'History',       icon: Clock },
    { id: 'trades',  label: 'Trade Log',     icon: BarChart2 },
  ]

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto overflow-x-hidden">
      <style>{`
        @keyframes skPulse { 0%,100%{opacity:.5} 50%{opacity:.15} }
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
      `}</style>

      {/* ── Modals ── */}
      {insufficientModal && (
        <InsufficientModal trader={insufficientModal} balance={balance} onClose={() => setInsufficientModal(null)} />
      )}
      {startModal && (
        <StartCopyModal trader={startModal} balance={balance}
          onClose={() => { setStartModal(null); setActionError(null) }}
          onConfirm={handleStartCopy} submitting={submitting} />
      )}
      {adjustModal && (
        <AdjustAllocModal copy={adjustModal} balance={balance}
          onClose={() => setAdjustModal(null)}
          onConfirm={handleAdjustAlloc} submitting={submitting} />
      )}

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'hsl(40 6% 95%)' }}>Copy Trading</h1>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(167,139,250,0.15)', color: '#c4b5fd' }}>Pro</span>
            {/* 0% fees */}
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 999,
              background: 'rgba(167,139,250,0.08)', color: '#c4b5fd',
              border: '1px solid rgba(167,139,250,0.15)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Zap size={9} /> 0% Fees
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'hsl(240 5% 55%)' }}>Mirror top-performing traders automatically — no performance fees, ever</p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: 0, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 1rem',
              borderRadius: '0.5rem 0.5rem 0 0', fontSize: 13, fontWeight: 500, cursor: 'pointer',
              border: 'none', borderBottom: tab === t.id ? '2px solid #a78bfa' : '2px solid transparent',
              background: 'none', color: tab === t.id ? '#a78bfa' : 'hsl(240 5% 55%)',
              marginBottom: -1, transition: 'color 0.15s' }}>
            <t.icon size={14} />
            {t.label}
            {t.badge != null && t.badge > 0 && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 999,
                background: 'rgba(167,139,250,0.2)', color: '#c4b5fd' }}>{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {actionError && (
        <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 10,
          background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)',
          color: '#fca5a5', fontSize: 13 }}>
          {actionError}
        </div>
      )}

      {/* ════════════════════════════════ FIND TRADERS ════════════════════════ */}
      {tab === 'find' && (
        <>
          {/* Stats strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            {[
              { label: 'Available Traders', value: tradersLoading ? '…' : String(traders.length), icon: Users,      color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
              { label: 'Avg. Win Rate',     value: tradersLoading ? '…' : `${avgWin}%`,           icon: TrendingUp, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
              { label: 'Avg. Risk Level',   value: tradersLoading ? '…' : avgRiskLabel,           icon: Shield,
                color: avgRiskLabel === 'High' ? '#f87171' : '#a78bfa',
                bg: avgRiskLabel === 'High' ? 'rgba(248,113,113,0.1)' : 'rgba(167,139,250,0.1)' },
            ].map(s => (
              <div key={s.label} style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.875rem', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: '0.6rem', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <s.icon size={16} style={{ color: s.color }} />
                </div>
                <div>
                  <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)', marginBottom: 2 }}>{s.label}</p>
                  <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'hsl(40 6% 92%)' }}>{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Risk filter */}
          <div style={{ display: 'flex', gap: 6, marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {['All', 'Low', 'Medium', 'High'].map(r => (
              <button key={r} onClick={() => setRiskFilter(r)}
                style={{ padding: '0.375rem 0.875rem', borderRadius: 999, fontSize: 12, fontWeight: 500,
                  cursor: 'pointer', border: 'none',
                  background: riskFilter === r ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.04)',
                  color: riskFilter === r ? '#c4b5fd' : 'hsl(240 5% 55%)', transition: 'all 0.15s' }}>
                {r === 'All' ? 'All Traders' : `${r} Risk`}
              </button>
            ))}
            <button onClick={fetchTraders}
              style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
                padding: '0.375rem 0.75rem', borderRadius: '0.6rem',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'hsl(40 6% 85%)', fontSize: 12, cursor: 'pointer' }}>
              <RefreshCw size={12} style={{ animation: tradersLoading ? 'spin 0.8s linear infinite' : 'none' }} />
            </button>
          </div>

          {tradersError && (
            <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 10,
              background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)',
              color: '#fca5a5', fontSize: 13 }}>
              {tradersError} — <button onClick={fetchTraders} style={{ color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}>Retry</button>
            </div>
          )}

          {tradersLoading && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[0,1,2,3,4,5].map(i => (
                <div key={i} style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.875rem', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <Skeleton w={52} h={52} />
                    <div style={{ flex: 1 }}><Skeleton w="65%" h={14} /><div style={{ marginTop: 7 }}><Skeleton w="40%" h={11} /></div></div>
                  </div>
                  <Skeleton w="100%" h={48} />
                  <div style={{ marginTop: 10 }}><Skeleton w="50%" h={28} /></div>
                  <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                    {[0,1,2].map(j => <Skeleton key={j} w="100%" h={44} />)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!tradersLoading && traders.length === 0 && (
            <div style={{ padding: '60px 20px', textAlign: 'center', background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.875rem' }}>
              <Users size={36} style={{ color: 'rgba(255,255,255,0.1)', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: 'hsl(240 5% 42%)' }}>No traders available yet</p>
            </div>
          )}

          {!tradersLoading && filtered.length === 0 && traders.length > 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center', background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.875rem' }}>
              <p style={{ fontSize: 13, color: 'hsl(240 5% 45%)' }}>No {riskFilter.toLowerCase()} risk traders found.</p>
            </div>
          )}

          {!tradersLoading && filtered.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(tr => {
                const isCopying = activeTraderIds.has(tr.id)
                const risk = RISK_COLORS[tr.riskLevel] ?? RISK_COLORS.Medium
                const color = avatarColor(tr.name)
                return (
                  <div key={tr.id}
                    style={{ background: 'hsl(260 60% 5%)',
                      border: `1px solid ${isCopying ? 'rgba(167,139,250,0.25)' : 'rgba(255,255,255,0.07)'}`,
                      borderRadius: '0.875rem', padding: '1.25rem',
                      display: 'flex', flexDirection: 'column', transition: 'border-color 0.2s',
                      boxShadow: isCopying ? '0 0 0 1px rgba(167,139,250,0.1)' : 'none' }}>

                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <TraderAvatar name={tr.name} imageUrl={tr.imageUrl} size={52} />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <p style={{ fontWeight: 700, color: 'hsl(40 6% 93%)', fontSize: 14 }}>{tr.name}</p>
                            {tr.isVerified && <CheckCircle size={13} style={{ color: '#60a5fa' }} />}
                          </div>
                          <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)', marginTop: 1 }}>{tr.username || tr.strategy}</p>
                        </div>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, color: risk.color, background: risk.bg, flexShrink: 0 }}>
                        {tr.riskLevel}
                      </span>
                    </div>

                    <div style={{ margin: '0 -0.25rem 0.625rem', height: 48 }}>
                      <Sparkline totalReturn={tr.totalReturn} color={tr.totalReturn >= 0 ? '#a78bfa' : '#f87171'} />
                    </div>

                    <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#a78bfa', letterSpacing: '-0.02em', marginBottom: 2 }}>
                      +{tr.totalReturn.toFixed(1)}%
                    </p>
                    <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)', marginBottom: '0.875rem' }}>All-time return</p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 10 }}>
                      {[
                        { label: 'Win Rate', value: `${tr.winRate}%` },
                        { label: 'Copiers',  value: tr.followers.toLocaleString() },
                        { label: 'Monthly',  value: `+${tr.monthlyReturn}%` },
                      ].map(s => (
                        <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '0.5rem', padding: '0.5rem 0.375rem', textAlign: 'center' }}>
                          <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'hsl(40 6% 88%)' }}>{s.value}</p>
                          <p style={{ fontSize: 10, color: 'hsl(240 5% 50%)', marginTop: 1 }}>{s.label}</p>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999, background: `${color}15`, color }}>{tr.strategy}</span>
                      {(Array.isArray(tr.tags) ? tr.tags : []).slice(0, 3).map(tag => (
                        <span key={tag} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', color: 'hsl(240 5% 60%)' }}>{tag}</span>
                      ))}
                    </div>

                    {tr.description && (
                      <p style={{ fontSize: 11.5, color: 'hsl(240 5% 52%)', lineHeight: 1.5, marginBottom: 10,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {tr.description}
                      </p>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'hsl(240 5% 50%)', marginBottom: '0.875rem', marginTop: 'auto' }}>
                      <span>Min copy: <span style={{ color: 'hsl(40 6% 80%)' }}>${tr.minAmount.toLocaleString()}</span></span>
                      <span style={{ color: '#c4b5fd', fontWeight: 600 }}>0% fees</span>
                    </div>

                    <button onClick={() => isCopying ? setTab('active') : onClickCopy(tr)}
                      style={{ width: '100%', padding: '0.625rem', borderRadius: '0.625rem',
                        fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        transition: 'all 0.15s',
                        ...(isCopying
                          ? { background: 'rgba(167,139,250,0.12)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.25)' }
                          : { background: 'linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)', color: '#050505', border: 'none', boxShadow: '0 4px 16px rgba(167,139,250,0.18)' }
                        ) }}>
                      {isCopying ? (<><CheckCircle size={13} /> Currently Copying <ChevronRight size={13} /></>) : (<><Copy size={13} /> Copy Trader</>)}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ════════════════════════════════ ACTIVE COPIES ══════════════════════ */}
      {tab === 'active' && (
        <>
          {/* Summary bar */}
          {activeCopies.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 12, marginBottom: '1.5rem' }}>
              {[
                { label: 'Active Positions', value: String(activeCopies.length),      icon: Activity,    color: '#a78bfa' },
                { label: 'Total Allocated',  value: `$${fmtMoney(totalAlloc)}`,        icon: DollarSign,  color: '#a78bfa' },
                { label: 'Total P&L',        value: `${activePnl >= 0 ? '+' : ''}$${fmtMoney(activePnl)}`, icon: TrendingUp, color: activePnl >= 0 ? '#a78bfa' : '#f87171' },
              ].map(s => (
                <div key={s.label} style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.875rem', padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '0.5rem', background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <s.icon size={14} style={{ color: s.color }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 10, color: 'hsl(240 5% 50%)', marginBottom: 1 }}>{s.label}</p>
                    <p style={{ fontSize: '0.95rem', fontWeight: 700, color: s.color }}>{s.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.875rem' }}>
            <button onClick={fetchActiveCopies}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.375rem 0.75rem',
                borderRadius: '0.6rem', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(40 6% 85%)', fontSize: 12, cursor: 'pointer' }}>
              <RefreshCw size={12} style={{ animation: activeLoading ? 'spin 0.8s linear infinite' : 'none' }} /> Refresh
            </button>
          </div>

          {activeError && (
            <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 10, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#fca5a5', fontSize: 13 }}>
              {activeError}
            </div>
          )}

          {activeLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[0,1,2].map(i => <div key={i} style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.875rem', padding: '1.25rem', height: 96 }}><Skeleton w="100%" h="100%" /></div>)}
            </div>
          )}

          {!activeLoading && activeCopies.length === 0 && (
            <div style={{ padding: '60px 20px', textAlign: 'center', background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.875rem' }}>
              <Copy size={36} style={{ color: 'rgba(255,255,255,0.1)', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: 'hsl(240 5% 42%)' }}>No active copy positions</p>
              <p style={{ fontSize: 13, color: 'hsl(240 5% 32%)', marginTop: 4 }}>Go to "Find Traders" to start copying a trader.</p>
              <button onClick={() => setTab('find')}
                style={{ marginTop: 16, padding: '0.5rem 1.25rem', borderRadius: '0.6rem', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', background: 'linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)',
                  color: '#050505', border: 'none' }}>
                Find Traders
              </button>
            </div>
          )}

          {!activeLoading && activeCopies.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activeCopies.map(copy => {
                const roiPos = copy.roiPct >= 0
                return (
                  <div key={copy.id}
                    style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '0.875rem', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 12 }}>

                    {/* Top row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <TraderAvatar name={copy.traderName} imageUrl={copy.profilePic} size={44} />
                      <div style={{ flex: 1, minWidth: 120 }}>
                        <p style={{ fontWeight: 700, color: 'hsl(40 6% 93%)', fontSize: 14 }}>{copy.traderName}</p>
                        <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)', marginTop: 2 }}>Since {fmtDate(copy.startTime)}</p>
                      </div>

                      {/* P&L */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <PnlBadge value={copy.profitLoss} />
                        <p style={{ fontSize: 10, color: roiPos ? '#a78bfa' : '#f87171', marginTop: 3, fontWeight: 600 }}>
                          {roiPos ? '+' : ''}{copy.roiPct}% ROI
                        </p>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px,1fr))', gap: 8 }}>
                      {[
                        { label: 'Allocated',     value: `$${fmtMoney(copy.allocatedAmount)}`, color: 'hsl(40 6% 85%)' },
                        { label: 'Max Drawdown',  value: copy.maxDrawdown != null ? `${copy.maxDrawdown}%` : 'None', color: copy.maxDrawdown ? '#f59e0b' : 'hsl(240 5% 55%)' },
                        { label: "Trader's W/R",  value: `${copy.traderWinRate}%`, color: '#a78bfa' },
                        { label: "Trader Return", value: `+${copy.traderReturnPct}%`, color: '#a78bfa' },
                      ].map(s => (
                        <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem', padding: '0.5rem 0.75rem' }}>
                          <p style={{ fontSize: 10, color: 'hsl(240 5% 50%)', marginBottom: 2 }}>{s.label}</p>
                          <p style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button onClick={() => setAdjustModal(copy)}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0.45rem 0.875rem',
                          borderRadius: '0.5rem', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                          background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)',
                          color: '#c4b5fd' }}>
                        <Sliders size={12} /> Adjust Allocation
                      </button>
                      <button onClick={() => handleStopCopy(copy.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0.45rem 0.875rem',
                          borderRadius: '0.5rem', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                          background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
                          color: '#f87171', marginLeft: 'auto' }}>
                        <StopCircle size={12} /> Stop Copying
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ════════════════════════════════ HISTORY ════════════════════════════ */}
      {tab === 'history' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.875rem' }}>
            <button onClick={fetchHistory}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.375rem 0.75rem',
                borderRadius: '0.6rem', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(40 6% 85%)', fontSize: 12, cursor: 'pointer' }}>
              <RefreshCw size={12} style={{ animation: historyLoading ? 'spin 0.8s linear infinite' : 'none' }} /> Refresh
            </button>
          </div>

          {historyError && <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 10, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#fca5a5', fontSize: 13 }}>{historyError}</div>}

          {historyLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[0,1,2].map(i => <div key={i} style={{ height: 72, borderRadius: '0.875rem', background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)' }}><Skeleton w="100%" h="100%" /></div>)}
            </div>
          )}

          {!historyLoading && history.length === 0 && (
            <div style={{ padding: '60px 20px', textAlign: 'center', background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.875rem' }}>
              <Clock size={36} style={{ color: 'rgba(255,255,255,0.1)', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: 'hsl(240 5% 42%)' }}>No copy history yet</p>
            </div>
          )}

          {!historyLoading && history.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {history.map(row => {
                const pnlPos = row.profitLoss >= 0
                const statusColor = row.status === 'active' ? '#a78bfa' : 'hsl(240 5% 50%)'
                return (
                  <div key={row.id}
                    style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: '0.75rem', padding: '1rem 1.25rem',
                      display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <TraderAvatar name={row.traderName} imageUrl={row.profilePic} size={40} />
                    <div style={{ flex: 1, minWidth: 120 }}>
                      <p style={{ fontWeight: 600, color: 'hsl(40 6% 90%)', fontSize: 13 }}>{row.traderName}</p>
                      <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)', marginTop: 2 }}>
                        {fmtDate(row.startTime)}
                        {row.stopTime ? ` → ${fmtDate(row.stopTime)}` : ''}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, flexWrap: 'wrap' }}>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)' }}>Allocated</p>
                        <p style={{ fontSize: 13, fontWeight: 700, color: 'hsl(40 6% 85%)' }}>${fmtMoney(row.allocatedAmount)}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)' }}>P&L</p>
                        <PnlBadge value={row.profitLoss} />
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)' }}>ROI</p>
                        <p style={{ fontSize: 12, fontWeight: 700, color: pnlPos ? '#a78bfa' : '#f87171' }}>
                          {pnlPos ? '+' : ''}{row.roiPct}%
                        </p>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                        color: statusColor, background: `${statusColor}18`, border: `1px solid ${statusColor}30`,
                        textTransform: 'capitalize' }}>
                        {row.status}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ════════════════════════════════ TRADE LOG ══════════════════════════ */}
      {tab === 'trades' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.875rem' }}>
            <button onClick={fetchTrades}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.375rem 0.75rem',
                borderRadius: '0.6rem', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(40 6% 85%)', fontSize: 12, cursor: 'pointer' }}>
              <RefreshCw size={12} style={{ animation: tradesLoading ? 'spin 0.8s linear infinite' : 'none' }} /> Refresh
            </button>
          </div>

          {tradesError && <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 10, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#fca5a5', fontSize: 13 }}>{tradesError}</div>}

          {tradesLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[0,1,2,3].map(i => <div key={i} style={{ height: 60, borderRadius: '0.75rem', background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)' }}><Skeleton w="100%" h="100%" /></div>)}
            </div>
          )}

          {!tradesLoading && trades.length === 0 && (
            <div style={{ padding: '60px 20px', textAlign: 'center', background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.875rem' }}>
              <BarChart2 size={36} style={{ color: 'rgba(255,255,255,0.1)', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: 'hsl(240 5% 42%)' }}>No copy trades yet</p>
              <p style={{ fontSize: 13, color: 'hsl(240 5% 32%)', marginTop: 4 }}>Trades from your copy positions will appear here.</p>
            </div>
          )}

          {!tradesLoading && trades.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {['Trader','Asset','Type','Entry','Exit','Lot','P&L','Status','Date'].map(h => (
                      <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', color: 'hsl(240 5% 50%)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {trades.map(tr => {
                    const pnlPos = tr.profitLoss >= 0
                    const isOpen = tr.status === 'open'
                    return (
                      <tr key={tr.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.1s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <td style={{ padding: '0.625rem 0.75rem', color: 'hsl(40 6% 85%)', fontWeight: 600 }}>{tr.traderName}</td>
                        <td style={{ padding: '0.625rem 0.75rem', color: 'hsl(40 6% 85%)', fontWeight: 600 }}>{tr.asset || '—'}</td>
                        <td style={{ padding: '0.625rem 0.75rem' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 999,
                            color: tr.tradeType === 'buy' ? '#a78bfa' : '#f87171',
                            background: tr.tradeType === 'buy' ? 'rgba(167,139,250,0.12)' : 'rgba(248,113,113,0.12)',
                            textTransform: 'uppercase' }}>
                            {tr.tradeType}
                          </span>
                        </td>
                        <td style={{ padding: '0.625rem 0.75rem', color: 'hsl(40 6% 80%)' }}>${tr.entryPrice.toFixed(4)}</td>
                        <td style={{ padding: '0.625rem 0.75rem', color: 'hsl(240 5% 55%)' }}>{tr.exitPrice ? `$${tr.exitPrice.toFixed(4)}` : '—'}</td>
                        <td style={{ padding: '0.625rem 0.75rem', color: 'hsl(240 5% 65%)' }}>{tr.lotSize}</td>
                        <td style={{ padding: '0.625rem 0.75rem' }}>
                          <span style={{ color: pnlPos ? '#a78bfa' : '#f87171', fontWeight: 700 }}>
                            {pnlPos ? '+' : ''}${fmtMoney(tr.profitLoss)}
                          </span>
                        </td>
                        <td style={{ padding: '0.625rem 0.75rem' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 999,
                            color: isOpen ? '#f59e0b' : 'hsl(240 5% 55%)',
                            background: isOpen ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.05)',
                            textTransform: 'capitalize' }}>
                            {tr.status}
                          </span>
                        </td>
                        <td style={{ padding: '0.625rem 0.75rem', color: 'hsl(240 5% 50%)', whiteSpace: 'nowrap' }}>
                          {fmtDate(tr.createdAt)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
