import { useState } from 'react'
import { ArrowLeft, CreditCard, Plus, Trash2, CheckCircle2, Building2, Bitcoin, Star, MoreVertical } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface Card { id: number; brand: string; last4: string; expiry: string; primary: boolean }
interface Bank { id: number; name: string; account: string; routing: string; primary: boolean }
interface Crypto { id: number; symbol: string; label: string; address: string; color: string }

const INITIAL_CARDS: Card[] = [
  { id: 1, brand: 'Visa',       last4: '4242', expiry: '09/27', primary: true  },
  { id: 2, brand: 'Mastercard', last4: '8810', expiry: '03/26', primary: false },
]

const INITIAL_BANKS: Bank[] = [
  { id: 1, name: 'Chase Bank',       account: '••••••7890', routing: '••••0021', primary: true  },
  { id: 2, name: 'Bank of America',  account: '••••••3344', routing: '••••0026', primary: false },
]

const CRYPTOS: Crypto[] = [
  { id: 1, symbol: 'BTC', label: 'Bitcoin',  address: 'bc1qxy2kgdygjrsqtzq2n0yrf...', color: '#f7931a' },
  { id: 2, symbol: 'ETH', label: 'Ethereum', address: '0x71C7656EC7ab88b098defB...', color: '#627eea' },
  { id: 3, symbol: 'USDT', label: 'Tether',  address: 'TQnz6fB5X7c5X5XQ5R...', color: '#26a17b' },
]

const CARD_COLORS: Record<string, string> = {
  Visa: 'linear-gradient(135deg,#1a1f71,#2563eb)',
  Mastercard: 'linear-gradient(135deg,#eb001b,#f79e1b)',
  Amex: 'linear-gradient(135deg,#007bc1,#00a8e0)',
}

function Section({ title, sub, action, children }: { title: string; sub?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'hsl(40 10% 94%)' }}>{title}</p>
          {sub && <p style={{ fontSize: 12, color: 'hsl(240 5% 52%)', marginTop: 2 }}>{sub}</p>}
        </div>
        {action}
      </div>
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '16px 0' }} />
      {children}
    </div>
  )
}

function AddBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 8, background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)', color: '#c4b5fd', cursor: 'pointer', flexShrink: 0 }}>
      <Plus size={13} /> {label}
    </button>
  )
}

export function PaymentMethods() {
  const navigate = useNavigate()
  const [cards, setCards] = useState<Card[]>(INITIAL_CARDS)
  const [banks, setBanks] = useState<Bank[]>(INITIAL_BANKS)
  const [menuId, setMenuId] = useState<string | null>(null)

  const setPrimary = (list: Card[], id: number) => list.map(c => ({ ...c, primary: c.id === id }))
  const setPrimaryBank = (list: Bank[], id: number) => list.map(b => ({ ...b, primary: b.id === id }))

  return (
    <div className="p-4 md:p-6 max-w-[760px] mx-auto overflow-x-hidden">
      <div className="flex items-center gap-3 mb-7">
        <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: 'hsl(240 5% 60%)', fontSize: 12 }}>
          <ArrowLeft size={14} /> Back
        </button>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'hsl(40 10% 96%)' }}>Payment Methods</h1>
          <p style={{ fontSize: 13, color: 'hsl(240 5% 52%)' }}>Manage your cards, bank accounts and crypto wallets</p>
        </div>
      </div>

      {/* Limits Banner */}
      <div style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)', borderRadius: 12, padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <CheckCircle2 size={18} style={{ color: '#a78bfa', flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#a78bfa' }}>Identity Verified</p>
          <p style={{ fontSize: 11, color: 'hsl(240 5% 55%)' }}>You have full access to all payment methods and limits.</p>
        </div>
      </div>

      {/* Cards */}
      <Section title="Debit / Credit Cards" sub="Add cards for instant deposits and withdrawals" action={<AddBtn onClick={() => {}} label="Add Card" />}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {cards.map(card => (
            <div key={card.id} style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              {/* Mini card visual */}
              <div style={{ width: 70, height: 44, borderRadius: 8, background: CARD_COLORS[card.brand] || 'linear-gradient(135deg,#334155,#1e293b)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '6px 8px', flexShrink: 0 }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: 1 }}>•••• {card.last4}</p>
                <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>{card.brand}</p>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'hsl(40 6% 88%)' }}>{card.brand} ending ••{card.last4}</p>
                  {card.primary && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(167,139,250,0.12)', color: '#a78bfa' }}>Primary</span>}
                </div>
                <p style={{ fontSize: 11, color: 'hsl(240 5% 48%)', marginTop: 2 }}>Expires {card.expiry}</p>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {!card.primary && (
                  <button onClick={() => setCards(prev => setPrimary(prev, card.id))} style={{ fontSize: 11, fontWeight: 600, padding: '5px 12px', borderRadius: 7, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'hsl(240 5% 55%)', cursor: 'pointer' }}>
                    Set Primary
                  </button>
                )}
                <button onClick={() => setCards(prev => prev.filter(c => c.id !== card.id))} style={{ width: 30, height: 30, borderRadius: 7, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Trash2 size={13} style={{ color: '#f87171' }} />
                </button>
              </div>
            </div>
          ))}
          {cards.length === 0 && (
            <p style={{ fontSize: 12, color: 'hsl(240 5% 48%)', textAlign: 'center', padding: '16px 0' }}>No cards added yet.</p>
          )}
        </div>
      </Section>

      {/* Bank Accounts */}
      <Section title="Bank Accounts" sub="Connect bank accounts for ACH transfers" action={<AddBtn onClick={() => {}} label="Add Bank" />}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {banks.map(bank => (
            <div key={bank.id} style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Building2 size={18} style={{ color: '#60a5fa' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'hsl(40 6% 88%)' }}>{bank.name}</p>
                  {bank.primary && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(167,139,250,0.12)', color: '#a78bfa' }}>Primary</span>}
                </div>
                <p style={{ fontSize: 11, color: 'hsl(240 5% 48%)', marginTop: 2 }}>Account {bank.account} · Routing {bank.routing}</p>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {!bank.primary && (
                  <button onClick={() => setBanks(prev => setPrimaryBank(prev, bank.id))} style={{ fontSize: 11, fontWeight: 600, padding: '5px 12px', borderRadius: 7, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'hsl(240 5% 55%)', cursor: 'pointer' }}>
                    Set Primary
                  </button>
                )}
                <button onClick={() => setBanks(prev => prev.filter(b => b.id !== bank.id))} style={{ width: 30, height: 30, borderRadius: 7, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Trash2 size={13} style={{ color: '#f87171' }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Crypto Wallets */}
      <Section title="Crypto Wallets" sub="Deposit and withdraw using crypto addresses" action={<AddBtn onClick={() => {}} label="Add Wallet" />}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {CRYPTOS.map(w => (
            <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${w.color}1a`, border: `1px solid ${w.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bitcoin size={18} style={{ color: w.color }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'hsl(40 6% 88%)' }}>{w.label} ({w.symbol})</p>
                <p style={{ fontSize: 11, color: 'hsl(240 5% 48%)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.address}</p>
              </div>
              <button style={{ width: 30, height: 30, borderRadius: 7, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                <Trash2 size={13} style={{ color: '#f87171' }} />
              </button>
            </div>
          ))}
        </div>
      </Section>

      {/* Limits Overview */}
      <Section title="Transaction Limits" sub="Your current deposit and withdrawal limits">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Daily Deposit',    value: '$50,000' },
            { label: 'Daily Withdraw',   value: '$25,000' },
            { label: 'Monthly Deposit',  value: '$500,000' },
            { label: 'Monthly Withdraw', value: '$250,000' },
          ].map(l => (
            <div key={l.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '12px 14px' }}>
              <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)', marginBottom: 4 }}>{l.label}</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#a78bfa' }}>{l.value}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}
