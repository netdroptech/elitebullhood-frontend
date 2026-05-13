import { useState, useRef, useEffect } from 'react'
import { Camera, User, AtSign, FileText, Twitter, Linkedin, Globe, Save, ArrowLeft, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

// Resolve absolute URL for avatar paths returned by the API (e.g. "/uploads/avatars/foo.png")
const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') ?? 'https://elitebullhood-backend.onrender.com'

function SettingsCard({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '24px', marginBottom: 20 }}>
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'hsl(40 10% 94%)', marginBottom: 3 }}>{title}</p>
        {sub && <p style={{ fontSize: 12, color: 'hsl(240 5% 52%)' }}>{sub}</p>}
      </div>
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 20 }} />
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(240 5% 55%)', marginBottom: 7, letterSpacing: '0.03em' }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', height: 42, paddingLeft: 14, paddingRight: 14,
  borderRadius: 10, fontSize: 13, fontWeight: 500,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.09)',
  color: 'hsl(40 6% 90%)', outline: 'none', boxSizing: 'border-box',
}

export function ProfileSettings() {
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()
  const [saved, setSaved] = useState(false)

  // ── Avatar upload state ─────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarError,     setAvatarError]     = useState<string | null>(null)

  const initial = (user?.firstName?.[0] ?? user?.email?.[0] ?? '?').toUpperCase()
  const avatarSrc = user?.avatarUrl ? `${API_BASE}${user.avatarUrl}` : null

  async function handleAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    // Reset the input value right away so picking the same file twice still re-fires onChange.
    e.target.value = ''
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('Image must be 2MB or smaller.')
      return
    }
    if (!/^image\/(jpeg|jpg|png|webp)$/.test(file.type)) {
      setAvatarError('Please choose a JPG, PNG or WebP image.')
      return
    }

    setAvatarError(null)
    setUploadingAvatar(true)
    try {
      const form = new FormData()
      form.append('avatar', file)
      await api.upload<{ success: boolean; data: { avatarUrl: string } }>('/user/avatar', form)
      // Refresh the global auth user so EVERY component (topbar, dropdowns, etc.) re-renders with the new image.
      await refreshUser()
    } catch (err: any) {
      setAvatarError(err?.message ?? 'Upload failed. Please try again.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  async function handleAvatarRemove() {
    setAvatarError(null)
    setUploadingAvatar(true)
    try {
      await api.delete('/user/avatar')
      await refreshUser()
    } catch (err: any) {
      setAvatarError(err?.message ?? 'Could not remove photo.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  // Profile form — loads the real values from the AuthContext user, and saves
  // them via PATCH /api/user/me on submit. Falls back to sensible defaults
  // (e.g. firstName + lastName) when the user hasn't filled the field yet.
  const buildInitial = () => ({
    displayName: user?.displayName ?? [user?.firstName, user?.lastName].filter(Boolean).join(' ') ?? '',
    username:    user?.username    ?? '',
    bio:         user?.bio         ?? '',
    twitter:     user?.twitter     ?? '',
    linkedin:    user?.linkedin    ?? '',
    website:     user?.website     ?? '',
  })
  const [form, setForm] = useState(buildInitial)
  const [saving, setSaving]     = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Keep the form in sync when the auth user refreshes (e.g. after a save or
  // an avatar upload).
  useEffect(() => { setForm(buildInitial()) }, [user?.id])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSave() {
    setSaveError(null)
    setSaving(true)
    try {
      // Split "First Last" → firstName / lastName so the rest of the platform
      // (topbar greeting, KYC pre-fill, admin user list, etc.) shows the new name too.
      const dn = form.displayName.trim()
      const [firstName, ...rest] = dn.split(/\s+/)
      const lastName = rest.join(' ')

      await api.patch('/user/me', {
        displayName: form.displayName,
        username:    form.username,
        bio:         form.bio,
        twitter:     form.twitter,
        linkedin:    form.linkedin,
        website:     form.website,
        firstName:   firstName || user?.firstName || '',
        lastName:    lastName  || user?.lastName  || '',
      })
      await refreshUser()
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setSaveError(err?.message ?? 'Could not save your changes.')
    } finally {
      setSaving(false)
    }
  }

  const THEMES = [
    { id: 'dark',    label: 'Dark',    color: '#0d0b1e' },
    { id: 'darker',  label: 'Darker',  color: '#060410' },
    { id: 'purple',  label: 'Purple',  color: '#1a0d2e' },
  ]
  const [theme, setTheme] = useState('dark')

  return (
    <div className="p-4 md:p-6 max-w-[760px] mx-auto overflow-x-hidden">

      {/* Header */}
      <div className="flex items-center gap-3 mb-7">
        <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: 'hsl(240 5% 60%)', fontSize: 12 }}>
          <ArrowLeft size={14} /> Back
        </button>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'hsl(40 10% 96%)', lineHeight: 1.2 }}>Profile Settings</h1>
          <p style={{ fontSize: 13, color: 'hsl(240 5% 52%)' }}>Update your display name, avatar and public profile</p>
        </div>
      </div>

      {/* Avatar */}
      <SettingsCard title="Profile Picture" sub="Upload a photo that represents you">
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: avatarSrc ? '#000' : 'linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 800, color: '#050505',
              overflow: 'hidden',
            }}>
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt="Profile"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                />
              ) : (
                initial
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 26, height: 26, borderRadius: '50%',
                background: 'hsl(260 87% 8%)', border: '2px solid hsl(260 87% 5%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: uploadingAvatar ? 'wait' : 'pointer',
              }}
            >
              {uploadingAvatar
                ? <Loader2 size={12} style={{ color: '#c4b5fd', animation: 'spin 1s linear infinite' }} />
                : <Camera size={12} style={{ color: '#c4b5fd' }} />}
            </button>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
          <div>
            <p style={{ fontSize: 13, color: 'hsl(40 6% 85%)', marginBottom: 6 }}>Upload a new avatar</p>
            <p style={{ fontSize: 11, color: 'hsl(240 5% 48%)', marginBottom: 12 }}>JPG, PNG or WebP. Max size 2MB.</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                style={{ fontSize: 12, fontWeight: 600, padding: '7px 16px', borderRadius: 8, background: 'rgba(167,139,250,0.2)', border: '1px solid rgba(167,139,250,0.3)', color: '#c4b5fd', cursor: uploadingAvatar ? 'wait' : 'pointer' }}
              >
                {uploadingAvatar ? 'Uploading…' : 'Upload Photo'}
              </button>
              {avatarSrc && (
                <button
                  type="button"
                  onClick={handleAvatarRemove}
                  disabled={uploadingAvatar}
                  style={{ fontSize: 12, fontWeight: 500, padding: '7px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'hsl(240 5% 55%)', cursor: uploadingAvatar ? 'wait' : 'pointer' }}
                >
                  Remove
                </button>
              )}
            </div>
            {avatarError && (
              <p style={{ fontSize: 11, color: '#f87171', marginTop: 8 }}>{avatarError}</p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={handleAvatarPick}
            />
          </div>
        </div>
      </SettingsCard>

      {/* Basic Info */}
      <SettingsCard title="Display Name & Username" sub="This is how you appear across the platform">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="DISPLAY NAME">
            <div style={{ position: 'relative' }}>
              <User size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'hsl(240 5% 45%)', pointerEvents: 'none' }} />
              <input style={{ ...inputStyle, paddingLeft: 34 }} value={form.displayName} onChange={set('displayName')} />
            </div>
          </Field>
          <Field label="USERNAME">
            <div style={{ position: 'relative' }}>
              <AtSign size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'hsl(240 5% 45%)', pointerEvents: 'none' }} />
              <input style={{ ...inputStyle, paddingLeft: 34 }} value={form.username} onChange={set('username')} />
            </div>
          </Field>
        </div>
        <Field label="BIO">
          <div style={{ position: 'relative' }}>
            <FileText size={14} style={{ position: 'absolute', left: 12, top: 12, color: 'hsl(240 5% 45%)', pointerEvents: 'none' }} />
            <textarea
              rows={3}
              value={form.bio}
              onChange={set('bio')}
              style={{ ...inputStyle, height: 'auto', paddingLeft: 34, paddingTop: 10, paddingBottom: 10, resize: 'vertical', lineHeight: 1.6 }}
            />
          </div>
          <p style={{ fontSize: 11, color: 'hsl(240 5% 45%)', marginTop: 5 }}>{form.bio.length}/160 characters</p>
        </Field>
      </SettingsCard>

      {/* Social Links */}
      <SettingsCard title="Social Links" sub="Add links to your public profiles">
        {[
          { key: 'twitter',  label: 'TWITTER / X',  icon: Twitter,  placeholder: '@yourhandle' },
          { key: 'linkedin', label: 'LINKEDIN',      icon: Linkedin, placeholder: 'linkedin.com/in/you' },
          { key: 'website',  label: 'WEBSITE',       icon: Globe,    placeholder: 'https://yoursite.com' },
        ].map(({ key, label, icon: Icon, placeholder }) => (
          <Field key={key} label={label}>
            <div style={{ position: 'relative' }}>
              <Icon size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'hsl(240 5% 45%)', pointerEvents: 'none' }} />
              <input style={{ ...inputStyle, paddingLeft: 34 }} placeholder={placeholder} value={form[key as keyof typeof form]} onChange={set(key as keyof typeof form)} />
            </div>
          </Field>
        ))}
      </SettingsCard>

      {/* Theme */}
      <SettingsCard title="Dashboard Theme" sub="Choose your preferred colour scheme">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                padding: '14px 20px', borderRadius: 12, cursor: 'pointer',
                border: theme === t.id ? '2px solid #a78bfa' : '2px solid rgba(255,255,255,0.07)',
                background: theme === t.id ? 'rgba(167,139,250,0.08)' : 'rgba(255,255,255,0.02)',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ width: 48, height: 32, borderRadius: 8, background: t.color, border: '1px solid rgba(255,255,255,0.1)' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: theme === t.id ? '#c4b5fd' : 'hsl(240 5% 55%)' }}>{t.label}</span>
            </button>
          ))}
        </div>
      </SettingsCard>

      {/* Save error */}
      {saveError && (
        <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.22)', color: '#f87171', fontSize: 12 }}>
          {saveError}
        </div>
      )}

      {/* Save */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button onClick={() => navigate(-1)} disabled={saving} style={{ padding: '10px 22px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'hsl(240 5% 55%)', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>Cancel</button>
        <button onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 22px', borderRadius: 10, background: saved ? 'rgba(167,139,250,0.15)' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', border: saved ? '1px solid rgba(167,139,250,0.3)' : 'none', color: saved ? '#a78bfa' : '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', transition: 'all 0.2s', opacity: saving ? 0.7 : 1 }}>
          {saving
            ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
            : <><Save size={14} /> {saved ? 'Saved!' : 'Save Changes'}</>}
        </button>
      </div>
    </div>
  )
}
