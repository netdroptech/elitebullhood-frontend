import { useState, useCallback, useRef, useEffect } from 'react'
import { Send, Search, Bell, CheckCircle, AlertCircle, Info, AlertTriangle, X, Loader2, User } from 'lucide-react'
import { adminApi } from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserResult {
  id:         string
  firstName:  string
  lastName:   string
  email:      string
  status:     string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  INFO:    { label: 'Info',    icon: Info,          color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.3)'  },
  SUCCESS: { label: 'Success', icon: CheckCircle,   color: '#a78bfa', bg: 'rgba(167,139,250,0.1)',  border: 'rgba(167,139,250,0.3)'  },
  WARNING: { label: 'Warning', icon: AlertTriangle, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)'  },
  ERROR:   { label: 'Error',   icon: AlertCircle,   color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)' },
} as const

type NotifType = keyof typeof TYPE_CONFIG

const inp: React.CSSProperties = {
  width:       '100%',
  padding:     '10px 12px',
  borderRadius: 8,
  background:  'rgba(255,255,255,0.05)',
  border:      '1px solid rgba(255,255,255,0.1)',
  color:       'hsl(40 6% 88%)',
  fontSize:    13,
  outline:     'none',
  boxSizing:   'border-box',
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminNotifications() {
  // User search
  const [query,       setQuery]       = useState('')
  const [results,     setResults]     = useState<UserResult[]>([])
  const [searching,   setSearching]   = useState(false)
  const [dropOpen,    setDropOpen]    = useState(false)
  const [selected,    setSelected]    = useState<UserResult | null>(null)
  const searchRef  = useRef<HTMLDivElement>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Form state
  const [notifType,  setNotifType]  = useState<NotifType>('INFO')
  const [title,      setTitle]      = useState('')
  const [message,    setMessage]    = useState('')
  const [link,       setLink]       = useState('')
  const [sending,    setSending]    = useState(false)
  const [success,    setSuccess]    = useState('')
  const [error,      setError]      = useState('')

  // Broadcast mode (send to all users with a status filter)
  const [broadcastMode, setBroadcastMode] = useState(false)
  const [broadcastTarget, setBroadcastTarget] = useState<'ALL' | 'ACTIVE' | 'PENDING'>('ALL')
  const [broadcastList, setBroadcastList] = useState<UserResult[]>([])
  const [loadingBroadcast, setLoadingBroadcast] = useState(false)

  // Close dropdown on outside click
  useEffect(() => {
    function h(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setDropOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // ── User search (debounced) ──────────────────────────────────────────────
  useEffect(() => {
    if (!query.trim()) { setResults([]); setDropOpen(false); return }
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await adminApi.get<{ success: boolean; data: UserResult[] }>(
          `/admin/users?search=${encodeURIComponent(query)}&limit=8`
        )
        setResults(res.data ?? [])
        setDropOpen(true)
      } catch { setResults([]) }
      finally { setSearching(false) }
    }, 300)
  }, [query])

  // ── Load broadcast list ──────────────────────────────────────────────────
  const loadBroadcastList = useCallback(async () => {
    setLoadingBroadcast(true)
    try {
      const q = broadcastTarget === 'ALL' ? '' : `&status=${broadcastTarget}`
      const res = await adminApi.get<{ success: boolean; data: UserResult[] }>(
        `/admin/users?limit=500${q}`
      )
      setBroadcastList(res.data ?? [])
    } catch { setBroadcastList([]) }
    finally { setLoadingBroadcast(false) }
  }, [broadcastTarget])

  useEffect(() => {
    if (broadcastMode) loadBroadcastList()
  }, [broadcastMode, broadcastTarget, loadBroadcastList])

  // ── Send notification ────────────────────────────────────────────────────
  async function handleSend() {
    setSuccess(''); setError('')
    if (!title.trim())   { setError('Title is required.'); return }
    if (!message.trim()) { setError('Message is required.'); return }

    if (!broadcastMode && !selected) { setError('Please select a recipient.'); return }

    setSending(true)
    try {
      if (broadcastMode) {
        // Send to all users in the broadcast list sequentially
        let sent = 0
        for (const u of broadcastList) {
          try {
            await adminApi.post('/admin/notifications/send', {
              userId:  u.id,
              title:   title.trim(),
              message: message.trim(),
              type:    notifType,
              link:    link.trim() || undefined,
            })
            sent++
          } catch { /* skip failed */ }
        }
        setSuccess(`Notification sent to ${sent} user${sent !== 1 ? 's' : ''}.`)
      } else {
        await adminApi.post('/admin/notifications/send', {
          userId:  selected!.id,
          title:   title.trim(),
          message: message.trim(),
          type:    notifType,
          link:    link.trim() || undefined,
        })
        setSuccess(`Notification sent to ${selected!.firstName} ${selected!.lastName}.`)
      }
      setTitle(''); setMessage(''); setLink('')
      setSelected(null); setQuery('')
    } catch (e: any) {
      setError(e.message ?? 'Failed to send notification.')
    } finally {
      setSending(false)
    }
  }

  const cfg = TYPE_CONFIG[notifType]
  const TypeIcon = cfg.icon

  return (
    <div style={{ padding: '24px 20px 60px', maxWidth: 740, margin: '0 auto' }}>

      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bell size={15} color="#a78bfa" />
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'hsl(40 6% 95%)', margin: 0 }}>Send Notification</h1>
        </div>
        <p style={{ fontSize: 13, color: 'hsl(240 5% 50%)', marginLeft: 42 }}>
          Compose and deliver a personal notification to a specific user or broadcast to a group.
        </p>
      </div>

      {/* Recipient mode toggle */}
      <div style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '1.25rem', marginBottom: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'hsl(240 5% 45%)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Recipient</p>

        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {([false, true] as const).map(bcast => (
            <button
              key={String(bcast)}
              onClick={() => setBroadcastMode(bcast)}
              style={{
                flex: 1, padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                background: broadcastMode === bcast ? 'rgba(167,139,250,0.1)' : 'rgba(255,255,255,0.03)',
                border:     broadcastMode === bcast ? '1px solid rgba(167,139,250,0.3)' : '1px solid rgba(255,255,255,0.08)',
                color:      broadcastMode === bcast ? '#a78bfa' : 'hsl(240 5% 55%)',
                transition: 'all 0.15s',
              }}
            >
              {bcast ? '📢 Broadcast' : '👤 Specific User'}
            </button>
          ))}
        </div>

        {!broadcastMode ? (
          /* User search */
          <div ref={searchRef} style={{ position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'hsl(240 5% 45%)', pointerEvents: 'none' }} />
              <input
                style={{ ...inp, paddingLeft: 32 }}
                placeholder="Search by name or email…"
                value={query}
                onChange={e => { setQuery(e.target.value); setSelected(null) }}
                onFocus={() => results.length > 0 && setDropOpen(true)}
              />
              {searching && <Loader2 size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#a78bfa', animation: 'spin 1s linear infinite' }} />}
            </div>

            {/* Search dropdown */}
            {dropOpen && results.length > 0 && (
              <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50, borderRadius: 8, background: 'hsl(260 87% 5%)', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', boxShadow: '0 12px 32px rgba(0,0,0,0.5)' }}>
                {results.map(u => (
                  <button
                    key={u.id}
                    onClick={() => { setSelected(u); setQuery(`${u.firstName} ${u.lastName}`); setDropOpen(false) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <User size={12} color="#a78bfa" />
                    </div>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: 'hsl(40 6% 88%)', marginBottom: 1 }}>{u.firstName} {u.lastName}</p>
                      <p style={{ fontSize: 11, color: 'hsl(240 5% 48%)' }}>{u.email}</p>
                    </div>
                    <span style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 6px', borderRadius: 999, background: u.status === 'ACTIVE' ? 'rgba(167,139,250,0.1)' : 'rgba(245,158,11,0.1)', color: u.status === 'ACTIVE' ? '#a78bfa' : '#f59e0b', fontWeight: 600 }}>
                      {u.status}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Selected user chip */}
            {selected && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, padding: '8px 10px', borderRadius: 8, background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.2)' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(167,139,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User size={11} color="#a78bfa" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#a78bfa', margin: 0 }}>{selected.firstName} {selected.lastName}</p>
                  <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)', margin: 0 }}>{selected.email}</p>
                </div>
                <button onClick={() => { setSelected(null); setQuery('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 45%)', display: 'flex', padding: 2 }}>
                  <X size={13} />
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Broadcast target selector */
          <div>
            <p style={{ fontSize: 11, color: 'hsl(240 5% 45%)', marginBottom: 8 }}>Send to all users with status:</p>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['ALL', 'ACTIVE', 'PENDING'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setBroadcastTarget(t)}
                  style={{
                    flex: 1, padding: '7px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    background: broadcastTarget === t ? 'rgba(96,165,250,0.1)' : 'rgba(255,255,255,0.03)',
                    border:     broadcastTarget === t ? '1px solid rgba(96,165,250,0.3)' : '1px solid rgba(255,255,255,0.07)',
                    color:      broadcastTarget === t ? '#60a5fa' : 'hsl(240 5% 52%)',
                    transition: 'all 0.15s',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              {loadingBroadcast
                ? <Loader2 size={12} style={{ color: '#a78bfa', animation: 'spin 1s linear infinite' }} />
                : <span style={{ fontSize: 11, color: '#a78bfa', fontWeight: 600 }}>{broadcastList.length}</span>
              }
              <span style={{ fontSize: 11, color: 'hsl(240 5% 48%)' }}>users will receive this notification</span>
            </div>
          </div>
        )}
      </div>

      {/* Notification type */}
      <div style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '1.25rem', marginBottom: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'hsl(240 5% 45%)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Notification Type</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
          {(Object.entries(TYPE_CONFIG) as [NotifType, typeof TYPE_CONFIG[NotifType]][]).map(([key, c]) => {
            const Icon = c.icon
            const active = notifType === key
            return (
              <button
                key={key}
                onClick={() => setNotifType(key)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                  padding: '10px 6px', borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
                  background: active ? c.bg : 'rgba(255,255,255,0.02)',
                  border:     active ? `1px solid ${c.border}` : '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <Icon size={15} color={active ? c.color : 'hsl(240 5% 45%)'} />
                <span style={{ fontSize: 10, fontWeight: 700, color: active ? c.color : 'hsl(240 5% 50%)', letterSpacing: '0.04em' }}>{c.label.toUpperCase()}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Content form */}
      <div style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '1.25rem', marginBottom: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'hsl(240 5% 45%)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Message</p>

        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)', marginBottom: 5 }}>Title <span style={{ color: '#f87171' }}>*</span></p>
          <input
            style={inp}
            placeholder="e.g. Account verified, Deposit approved…"
            value={title}
            maxLength={80}
            onChange={e => setTitle(e.target.value)}
          />
          <p style={{ fontSize: 10, color: 'hsl(240 5% 38%)', marginTop: 4, textAlign: 'right' }}>{title.length}/80</p>
        </div>

        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)', marginBottom: 5 }}>Message <span style={{ color: '#f87171' }}>*</span></p>
          <textarea
            style={{ ...inp, minHeight: 90, resize: 'vertical', lineHeight: 1.6 }}
            placeholder="Write your notification message here…"
            value={message}
            maxLength={500}
            onChange={e => setMessage(e.target.value)}
          />
          <p style={{ fontSize: 10, color: 'hsl(240 5% 38%)', marginTop: 2, textAlign: 'right' }}>{message.length}/500</p>
        </div>

        <div>
          <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)', marginBottom: 5 }}>Link (optional)</p>
          <input
            style={inp}
            placeholder="e.g. /dashboard/statement"
            value={link}
            onChange={e => setLink(e.target.value)}
          />
          <p style={{ fontSize: 10, color: 'hsl(240 5% 38%)', marginTop: 4 }}>If provided, the notification will be clickable and navigate to this path.</p>
        </div>
      </div>

      {/* Preview */}
      {(title || message) && (
        <div style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '1.25rem', marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'hsl(240 5% 45%)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Preview</p>
          <div style={{ display: 'flex', gap: 10, padding: '12px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, flexShrink: 0, marginTop: 5 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'hsl(40 6% 92%)', marginBottom: 3 }}>{title || '—'}</p>
              <p style={{ fontSize: 12, color: 'hsl(240 5% 55%)', lineHeight: 1.5 }}>{message || '—'}</p>
              <p style={{ fontSize: 10, color: 'hsl(240 5% 38%)', marginTop: 4 }}>Just now</p>
            </div>
          </div>
        </div>
      )}

      {/* Feedback */}
      {success && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', marginBottom: 14 }}>
          <CheckCircle size={14} color="#a78bfa" />
          <p style={{ fontSize: 13, color: '#a78bfa', margin: 0 }}>{success}</p>
        </div>
      )}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', marginBottom: 14 }}>
          <AlertCircle size={14} color="#f87171" />
          <p style={{ fontSize: 13, color: '#f87171', margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Send button */}
      <button
        onClick={handleSend}
        disabled={sending}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '0.875rem', borderRadius: 10, background: 'linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)', color: '#050505', fontSize: 14, fontWeight: 700, border: 'none', cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.7 : 1, boxShadow: '0 4px 20px rgba(167,139,250,0.2)' }}
      >
        {sending
          ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Sending…</>
          : <><Send size={15} /> {broadcastMode ? `Send to ${broadcastList.length} Users` : 'Send Notification'}</>
        }
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
