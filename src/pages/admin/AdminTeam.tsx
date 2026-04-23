import { useState, useEffect, useCallback, useRef } from 'react'
import { adminApi } from '@/lib/api'
import { Plus, Pencil, Trash2, RefreshCw, Users, X, GripVertical, Upload, Image } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'
const BACKEND  = API_BASE.replace('/api', '')

interface TeamMember {
  id: string
  name: string
  role: string
  bio: string
  initials: string
  photoUrl: string | null
  sortOrder: number
  createdAt: string
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: 'hsl(240 6% 9%)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 14,
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  padding: '9px 12px',
  color: 'hsl(40 6% 90%)',
  fontSize: 13,
  outline: 'none',
  fontFamily: 'inherit',
}

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600,
  color: 'hsl(240 5% 55%)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 5,
  display: 'block',
}

// ── Avatar helper ─────────────────────────────────────────────────────────────
function Avatar({ member, size = 48 }: { member: TeamMember; size?: number }) {
  if (member.photoUrl) {
    const src = member.photoUrl.startsWith('http')
      ? member.photoUrl
      : `${BACKEND}${member.photoUrl}`
    return (
      <img
        src={src}
        alt={member.name}
        style={{ width: size, height: size, borderRadius: size / 4, objectFit: 'cover', flexShrink: 0 }}
      />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: size / 4, flexShrink: 0,
      background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.3, fontWeight: 800, color: '#fff',
    }}>
      {member.initials || member.name.slice(0, 2).toUpperCase()}
    </div>
  )
}

// ── Modal ────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
      overflowY: 'auto',
    }}>
      <div style={{
        width: '100%', maxWidth: 520, margin: 'auto',
        background: 'hsl(240 6% 9%)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 18,
        boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'hsl(40 10% 94%)' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 50%)', padding: 4, display: 'flex' }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: '1.5rem' }}>{children}</div>
      </div>
    </div>
  )
}

// ── Member Form ───────────────────────────────────────────────────────────────
function MemberForm({
  initial, saving, onSave, onClose,
}: {
  initial?: TeamMember | null
  saving: boolean
  onSave: (formData: FormData) => void
  onClose: () => void
}) {
  const [name,      setName]      = useState(initial?.name      || '')
  const [role,      setRole]      = useState(initial?.role      || '')
  const [bio,       setBio]       = useState(initial?.bio       || '')
  const [initials,  setInitials]  = useState(initial?.initials  || '')
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder?.toString() || '0')
  const [preview,   setPreview]   = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Auto-fill initials from name
  const handleNameChange = (v: string) => {
    setName(v)
    if (!initial?.initials) {
      setInitials(v.split(' ').map(w => w[0] || '').join('').toUpperCase().slice(0, 2))
    }
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) setPreview(URL.createObjectURL(f))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const fd = new FormData()
    fd.append('name',      name)
    fd.append('role',      role)
    fd.append('bio',       bio)
    fd.append('initials',  initials)
    fd.append('sortOrder', sortOrder)
    if (fileRef.current?.files?.[0]) fd.append('teamPhoto', fileRef.current.files[0])
    onSave(fd)
  }

  const currentPhoto = initial?.photoUrl
    ? (initial.photoUrl.startsWith('http') ? initial.photoUrl : `${BACKEND}${initial.photoUrl}`)
    : null

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Photo upload */}
      <div>
        <label style={labelStyle}>Profile Photo</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Preview */}
          <div style={{ width: 72, height: 72, borderRadius: 14, overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {(preview || currentPhoto) ? (
              <img src={preview || currentPhoto!} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Image size={24} style={{ color: 'hsl(240 5% 35%)' }} />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} id="teamPhotoInput" />
            <label
              htmlFor="teamPhotoInput"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: 'hsl(240 5% 65%)', fontSize: 12, cursor: 'pointer' }}
            >
              <Upload size={13} /> {preview || currentPhoto ? 'Change Photo' : 'Upload Photo'}
            </label>
            <p style={{ fontSize: 11, color: 'hsl(240 5% 40%)', marginTop: 5 }}>JPEG, PNG or WebP · Max 5 MB</p>
          </div>
        </div>
      </div>

      {/* Name + Initials row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
        <div>
          <label style={labelStyle}>Full Name *</label>
          <input required value={name} onChange={e => handleNameChange(e.target.value)} placeholder="e.g. Marcus Klein" style={inputStyle} />
        </div>
        <div style={{ width: 80 }}>
          <label style={labelStyle}>Initials</label>
          <input value={initials} onChange={e => setInitials(e.target.value.toUpperCase().slice(0, 3))} placeholder="MK" style={{ ...inputStyle, textAlign: 'center', fontWeight: 700, letterSpacing: '0.1em' }} />
        </div>
      </div>

      {/* Role */}
      <div>
        <label style={labelStyle}>Job Title / Role *</label>
        <input required value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. CEO & Co-Founder" style={inputStyle} />
      </div>

      {/* Bio */}
      <div>
        <label style={labelStyle}>Bio</label>
        <textarea rows={3} value={bio} onChange={e => setBio(e.target.value)} placeholder="Short bio…" style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }} />
      </div>

      {/* Sort order */}
      <div>
        <label style={labelStyle}>Display Order (lower = first)</label>
        <input type="number" min="0" value={sortOrder} onChange={e => setSortOrder(e.target.value)} style={{ ...inputStyle, width: 100 }} />
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
        <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'hsl(240 5% 60%)', fontSize: 13, cursor: 'pointer' }}>
          Cancel
        </button>
        <button type="submit" disabled={saving} style={{ flex: 2, padding: '10px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving…' : initial ? 'Save Changes' : 'Add Member'}
        </button>
      </div>
    </form>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function AdminTeam() {
  const [members,    setMembers]    = useState<TeamMember[]>([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [addOpen,    setAddOpen]    = useState(false)
  const [editTarget, setEditTarget] = useState<TeamMember | null>(null)
  const [delTarget,  setDelTarget]  = useState<TeamMember | null>(null)
  const [saving,     setSaving]     = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminApi.get<{ success: boolean; data: TeamMember[] }>('/admin/team')
      setMembers(res.data ?? [])
      setError('')
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load team members.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── Multipart post/put helpers ─────────────────────────────────────────────
  const token = localStorage.getItem('apex_admin_token') ?? ''

  const postForm = async (url: string, fd: FormData) => {
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    })
    const json = await res.json()
    if (!json.success) throw new Error(json.message ?? 'Request failed.')
    return json
  }

  const putForm = async (url: string, fd: FormData) => {
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    })
    const json = await res.json()
    if (!json.success) throw new Error(json.message ?? 'Request failed.')
    return json
  }

  // ── CRUD handlers ──────────────────────────────────────────────────────────
  const handleCreate = async (fd: FormData) => {
    setSaving(true)
    try {
      await postForm('/admin/team', fd)
      setAddOpen(false)
      load()
    } catch (e: any) { alert(e?.message ?? 'Failed to create member.') }
    finally { setSaving(false) }
  }

  const handleUpdate = async (fd: FormData) => {
    if (!editTarget) return
    setSaving(true)
    try {
      await putForm(`/admin/team/${editTarget.id}`, fd)
      setEditTarget(null)
      load()
    } catch (e: any) { alert(e?.message ?? 'Failed to update member.') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!delTarget) return
    setSaving(true)
    try {
      await adminApi.delete(`/admin/team/${delTarget.id}`)
      setDelTarget(null)
      load()
    } catch (e: any) { alert(e?.message ?? 'Failed to delete member.') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ padding: '1.75rem 1.5rem', maxWidth: 960, margin: '0 auto', fontFamily: "'Geist Sans','Inter',system-ui,sans-serif" }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'hsl(40 10% 94%)', marginBottom: 4 }}>Leadership Team</h1>
          <p style={{ fontSize: 13, color: 'hsl(240 5% 50%)' }}>Manage the team members shown on the About page</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={load} title="Refresh" style={{ width: 36, height: 36, borderRadius: 9, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'hsl(240 5% 55%)' }}>
            <RefreshCw size={14} />
          </button>
          <button onClick={() => setAddOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            <Plus size={14} /> Add Member
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: '1.75rem' }}>
        <div style={{ ...card, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(167,139,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa' }}>
            <Users size={14} />
          </div>
          <div>
            <p style={{ fontSize: 18, fontWeight: 800, color: 'hsl(40 10% 94%)' }}>{members.length}</p>
            <p style={{ fontSize: 10.5, color: 'hsl(240 5% 50%)' }}>Team Members</p>
          </div>
        </div>
        <div style={{ ...card, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(96,165,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
            <Image size={14} />
          </div>
          <div>
            <p style={{ fontSize: 18, fontWeight: 800, color: 'hsl(40 10% 94%)' }}>{members.filter(m => m.photoUrl).length}</p>
            <p style={{ fontSize: 10.5, color: 'hsl(240 5% 50%)' }}>With Photo</p>
          </div>
        </div>
      </div>

      {/* Cards grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'hsl(240 5% 45%)', fontSize: 13 }}>Loading…</div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: '#f87171', fontSize: 13 }}>{error}</div>
      ) : members.length === 0 ? (
        <div style={{ ...card, padding: '3rem', textAlign: 'center' }}>
          <Users size={36} style={{ color: 'hsl(240 5% 30%)', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 14, color: 'hsl(240 5% 45%)' }}>No team members yet</p>
          <p style={{ fontSize: 12, color: 'hsl(240 5% 35%)', marginTop: 4 }}>Add your first member — they'll appear on the About page instantly</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14 }}>
          {members.map(member => (
            <div key={member.id} style={{ ...card, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Top row: avatar + name/role */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <Avatar member={member} size={52} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'hsl(40 10% 92%)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.name}</p>
                  <p style={{ fontSize: 12, color: '#a78bfa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.role}</p>
                  <p style={{ fontSize: 10.5, color: 'hsl(240 5% 42%)', marginTop: 3 }}>Order: {member.sortOrder}</p>
                </div>
              </div>

              {/* Bio */}
              {member.bio && (
                <p style={{ fontSize: 12, color: 'hsl(240 5% 52%)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {member.bio}
                </p>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>
                <button
                  onClick={() => setEditTarget(member)}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px', borderRadius: 8, border: '1px solid rgba(96,165,250,0.25)', background: 'rgba(96,165,250,0.07)', color: '#60a5fa', fontSize: 12, cursor: 'pointer' }}
                >
                  <Pencil size={12} /> Edit
                </button>
                <button
                  onClick={() => setDelTarget(member)}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px', borderRadius: 8, border: '1px solid rgba(248,113,113,0.25)', background: 'rgba(248,113,113,0.07)', color: '#f87171', fontSize: 12, cursor: 'pointer' }}
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add modal ── */}
      {addOpen && (
        <Modal title="Add Team Member" onClose={() => setAddOpen(false)}>
          <MemberForm saving={saving} onSave={handleCreate} onClose={() => setAddOpen(false)} />
        </Modal>
      )}

      {/* ── Edit modal ── */}
      {editTarget && (
        <Modal title="Edit Team Member" onClose={() => setEditTarget(null)}>
          <MemberForm initial={editTarget} saving={saving} onSave={handleUpdate} onClose={() => setEditTarget(null)} />
        </Modal>
      )}

      {/* ── Delete confirm ── */}
      {delTarget && (
        <Modal title="Remove Member" onClose={() => setDelTarget(null)}>
          <div style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
            <Avatar member={delTarget} size={52} />
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'hsl(40 10% 92%)' }}>{delTarget.name}</p>
              <p style={{ fontSize: 12, color: '#a78bfa' }}>{delTarget.role}</p>
            </div>
          </div>
          <p style={{ fontSize: 13, color: 'hsl(40 6% 70%)', marginBottom: 20 }}>
            This will remove <strong style={{ color: 'hsl(40 10% 92%)' }}>{delTarget.name}</strong> from the About page. Their photo will also be deleted. This cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setDelTarget(null)} style={{ flex: 1, padding: '10px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'hsl(240 5% 60%)', fontSize: 13, cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={handleDelete} disabled={saving} style={{ flex: 1, padding: '10px', borderRadius: 9, border: 'none', background: 'rgba(239,68,68,0.9)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Removing…' : 'Remove Member'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
