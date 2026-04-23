import { useState, useRef, useEffect } from 'react'
import {
  Plus, Pencil, Trash2, Search, Upload, X, CheckCircle2,
  ImagePlus, MapPin, BedDouble, Bath, Maximize2, Star,
  Building2, DollarSign, TrendingUp, Tag, Eye, ToggleLeft, ToggleRight,
} from 'lucide-react'
import { adminApi } from '@/lib/api'

/* ─── types ─── */
interface Property {
  id: string
  title: string
  address: string
  city: string
  country: string
  type: string
  price: number
  roi: number
  yieldPct: number
  beds: number
  baths: number
  area: number
  status: 'Available' | 'Pending' | 'Sold'
  isListed: boolean
  imageUrl: string
  tags: string[]
  description: string
  rating: number
  gallery: string[]
  reviews: number
  featured: boolean
}

/* ─── constants ─── */
const TYPES    = ['All', 'Villa', 'Penthouse', 'Apartment', 'Townhouse', 'Duplex', 'Studio', 'Loft', 'Commercial']
const STATUSES = ['Available', 'Pending', 'Sold'] as const
const STATUS_C: Record<string, { c: string; bg: string }> = { Available: { c: '#a78bfa', bg: 'rgba(167,139,250,0.12)' }, AVAILABLE: { c: '#a78bfa', bg: 'rgba(167,139,250,0.12)' }, Pending: { c: '#f59e0b', bg: 'rgba(245,158,11,0.12)' }, PENDING: { c: '#f59e0b', bg: 'rgba(245,158,11,0.12)' }, Sold: { c: '#f87171', bg: 'rgba(248,113,113,0.12)' }, SOLD: { c: '#f87171', bg: 'rgba(248,113,113,0.12)' } }
const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') ?? 'http://localhost:4000'

const EMPTY: Omit<Property, 'id'> = {
  title: '', address: '', city: '', country: '', type: 'Apartment',
  price: 0, roi: 0, yieldPct: 0, beds: 0, baths: 0, area: 0,
  status: 'Available', isListed: true, imageUrl: '', tags: [], description: '', rating: 4.5, gallery: [], reviews: 0, featured: false,
}

function inp(style?: React.CSSProperties): React.CSSProperties {
  return {
    width: '100%', height: 40, padding: '0 12px', borderRadius: 9, fontSize: 13,
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
    color: 'hsl(40 6% 90%)', outline: 'none', boxSizing: 'border-box', ...style,
  }
}

function imgSrc(url: string | null | undefined) {
  if (!url) return ''
  if (url.startsWith('/uploads/')) return API_BASE + url
  return url
}

const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: 'hsl(240 5% 48%)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 5 }}>{label}</label>
    {children}
  </div>
)

export function AdminProperties() {
  const [props, setProps]         = useState<Property[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [search, setSearch]       = useState('')
  const [typeFilter, setType]     = useState('All')
  const [statusFilter, setStatus] = useState('All')
  const [modal, setModal]         = useState<'add' | 'edit' | 'delete' | 'view' | null>(null)
  const [selected, setSelected]   = useState<Property | null>(null)
  const [form, setForm]           = useState<Omit<Property,'id'>>(EMPTY)
  const [tagInput, setTagInput]   = useState('')
  const [saved, setSaved]         = useState(false)
  const [saving, setSaving]       = useState(false)
  const [imgPreview, setImgPreview] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [galleryFiles, setGalleryFiles] = useState<File[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  /* fetch properties on mount */
  useEffect(() => {
    fetchProperties()
  }, [])

  async function fetchProperties() {
    try {
      setLoading(true)
      setError('')
      const res = await adminApi.get<{data: Property[]}>('/admin/properties')
      setProps(res.data)
    } catch (err) {
      setError('Failed to load properties')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  /* derived */
  const displayed = props.filter(p => {
    const q = search.toLowerCase()
    const mQ = !q || p.title.toLowerCase().includes(q) || p.city.toLowerCase().includes(q) || p.country.toLowerCase().includes(q)
    const mT = typeFilter === 'All' || p.type === typeFilter
    const mS = statusFilter === 'All' || p.status === statusFilter
    return mQ && mT && mS
  })

  function openAdd() {
    setForm({ ...EMPTY })
    setImgPreview('')
    setPhotoFile(null)
    setGalleryFiles([])
    setTagInput('')
    setSaved(false)
    setModal('add')
  }

  function openEdit(p: Property) {
    setSelected(p)
    setForm({
      title: p.title, address: p.address, city: p.city, country: p.country, type: p.type,
      price: p.price, roi: p.roi, yieldPct: p.yieldPct, beds: p.beds, baths: p.baths, area: p.area,
      status: p.status, isListed: p.isListed, imageUrl: p.imageUrl, tags: [...p.tags],
      description: p.description, rating: p.rating, gallery: [...p.gallery], reviews: p.reviews, featured: p.featured
    })
    setImgPreview(imgSrc(p.imageUrl))
    setPhotoFile(null)
    setGalleryFiles([])
    setTagInput('')
    setSaved(false)
    setModal('edit')
  }

  function openDelete(p: Property) { setSelected(p); setModal('delete') }
  function openView(p: Property)   { setSelected(p); setModal('view') }

  async function handleSave() {
    if (!form.title || !form.city || saving) return
    setSaving(true)

    const fd = new FormData()
    fd.append('title', form.title)
    fd.append('address', form.address)
    fd.append('city', form.city)
    fd.append('country', form.country)
    fd.append('type', form.type)
    fd.append('price', String(form.price))
    fd.append('roi', String(form.roi))
    fd.append('yieldPct', String(form.yieldPct))
    fd.append('beds', String(form.beds))
    fd.append('baths', String(form.baths))
    fd.append('area', String(form.area))
    fd.append('description', form.description)
    fd.append('tags', JSON.stringify(form.tags))
    fd.append('rating', String(form.rating))
    fd.append('reviews', String(form.reviews))
    fd.append('featured', String(form.featured))
    fd.append('isListed', String(form.isListed))
    fd.append('status', form.status)

    if (photoFile) {
      fd.append('propertyImage', photoFile)
    } else if (form.imageUrl && !form.imageUrl.startsWith('/uploads/')) {
      fd.append('imageUrl', form.imageUrl)
    }

    if (galleryFiles.length > 0) {
      galleryFiles.forEach(f => fd.append('propertyGallery', f))
    }

    try {
      const token = localStorage.getItem('apex_admin_token')
      const headers: Record<string,string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`

      const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'
      const url = modal === 'add' ? `${BASE}/admin/properties` : `${BASE}/admin/properties/${selected!.id}`
      const method = modal === 'add' ? 'POST' : 'PUT'

      const resp = await fetch(url, { method, headers, body: fd })
      if (!resp.ok) throw new Error('Save failed')

      setSaving(false)
      setSaved(true)
      setTimeout(() => {
        setSaved(false)
        setModal(null)
        fetchProperties()
      }, 1200)
    } catch (err) {
      setSaving(false)
      setError('Failed to save property')
      console.error(err)
    }
  }

  async function handleDelete() {
    if (!selected) return
    try {
      await adminApi.delete('/admin/properties/' + selected.id)
      setModal(null)
      fetchProperties()
    } catch (err) {
      setError('Failed to delete property')
      console.error(err)
    }
  }

  async function toggleListed(id: string) {
    const prop = props.find(p => p.id === id)
    if (!prop) return

    const fd = new FormData()
    fd.append('isListed', String(!prop.isListed))

    try {
      const token = localStorage.getItem('apex_admin_token')
      const headers: Record<string,string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`

      const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'
      const resp = await fetch(`${BASE}/admin/properties/${id}`, { method: 'PUT', headers, body: fd })
      if (!resp.ok) throw new Error('Toggle failed')

      fetchProperties()
    } catch (err) {
      setError('Failed to update property')
      console.error(err)
    }
  }

  function addTag() {
    const t = tagInput.trim()
    if (t && !form.tags.includes(t)) setForm(f => ({ ...f, tags: [...f.tags, t] }))
    setTagInput('')
  }

  function removeTag(t: string) { setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) })) }

  function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setImgPreview(url)
    setPhotoFile(file)
    setForm(f => ({ ...f, imageUrl: file.name }))
  }

  function handleGalleryFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    setGalleryFiles(files)
  }

  const filterBtn = (active: boolean): React.CSSProperties => ({
    padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer',
    border: active ? '1px solid rgba(167,139,250,0.35)' : '1px solid rgba(255,255,255,0.08)',
    background: active ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.03)',
    color: active ? '#c4b5fd' : 'hsl(240 5% 55%)',
  })

  return (
    <div style={{ padding: '20px 16px 60px' }} className="md:p-8">

      {/* Error message */}
      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'hsl(40 10% 96%)' }}>Property Listings</h1>
          {loading ? (
            <p style={{ fontSize: 13, color: 'hsl(240 5% 50%)', marginTop: 3 }}>Loading properties...</p>
          ) : (
            <p style={{ fontSize: 13, color: 'hsl(240 5% 50%)', marginTop: 3 }}>{props.length} properties · {props.filter(p => p.isListed).length} live on platform</p>
          )}
        </div>
        <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 6px 20px rgba(124,58,237,0.35)' }}>
          <Plus size={15} /> Add Property
        </button>
      </div>

      {/* Summary strip */}
      {!loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" style={{ marginBottom: 22 }}>
          {[
            { label: 'Total Listings',     value: String(props.length),                              icon: Building2,  c: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
            { label: 'Live on Platform',   value: String(props.filter(p => p.isListed).length),        icon: Eye,        c: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
            { label: 'Total Value',        value: `$${parseFloat((props.reduce((s,p)=>s+p.price,0)/1e6).toFixed(2))}M`, icon: DollarSign, c: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
            { label: 'Avg ROI',            value: props.length > 0 ? `${(props.reduce((s,p)=>s+p.roi,0)/props.length).toFixed(1)}%` : '0%', icon: TrendingUp, c: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
          ].map(s => (
            <div key={s.label} style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 13, padding: '15px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 9, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><s.icon size={17} style={{ color: s.c }} /></div>
              <div><p style={{ fontSize: 11, color: 'hsl(240 5% 50%)' }}>{s.label}</p><p style={{ fontSize: 20, fontWeight: 800, color: s.c }}>{s.value}</p></div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 13, padding: '12px 14px', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'hsl(240 5% 42%)', pointerEvents: 'none' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title, city, country…" style={{ ...inp(), height: 36, paddingLeft: 30 }} />
          </div>
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.08)' }} />
          {['All', 'Available', 'Pending', 'Sold'].map(s => (
            <button key={s} onClick={() => setStatus(s)} style={filterBtn(statusFilter === s)}>{s}</button>
          ))}
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.08)' }} />
          {['All', 'Villa', 'Penthouse', 'Apartment', 'Townhouse', 'Duplex', 'Studio', 'Loft'].map(t => (
            <button key={t} onClick={() => setType(t)} style={filterBtn(typeFilter === t)}>{t}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.025)' }}>
                {['PROPERTY','LOCATION','TYPE','PRICE','ROI / YIELD','SPECS','STATUS','LISTED','ACTIONS'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'hsl(240 5% 42%)', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.map(p => {
                const sc = STATUS_C[p.status] ?? { c: '#a78bfa', bg: 'rgba(167,139,250,0.12)' }
                return (
                  <tr key={p.id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

                    {/* Property */}
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 46, height: 34, borderRadius: 7, overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.04)' }}>
                          {p.imageUrl ? <img src={imgSrc(p.imageUrl)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <Building2 size={16} style={{ color: 'hsl(240 5% 40%)', margin: '9px 15px' }} />}
                        </div>
                        <div>
                          <p style={{ fontSize: 12.5, fontWeight: 700, color: 'hsl(40 6% 88%)', whiteSpace: 'nowrap', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 1 }}>
                            <Star size={9} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                            <span style={{ fontSize: 10, color: 'hsl(240 5% 48%)' }}>{p.rating}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <MapPin size={11} style={{ color: 'hsl(240 5% 44%)', flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: 'hsl(240 5% 58%)', whiteSpace: 'nowrap' }}>{p.city}, {p.country}</span>
                      </div>
                    </td>

                    {/* Type */}
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: 'rgba(167,139,250,0.12)', color: '#c4b5fd' }}>{p.type}</span>
                    </td>

                    {/* Price */}
                    <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 700, color: '#a78bfa', whiteSpace: 'nowrap' }}>
                      ${p.price >= 1e6 ? parseFloat((p.price/1e6).toFixed(2))+'M' : (p.price/1000).toFixed(0)+'K'}
                    </td>

                    {/* ROI / Yield */}
                    <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>{p.roi}%</p>
                      <p style={{ fontSize: 10, color: 'hsl(240 5% 48%)' }}>{p.yieldPct}% yield</p>
                    </td>

                    {/* Specs */}
                    <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span style={{ fontSize: 10.5, color: 'hsl(240 5% 55%)', display: 'flex', alignItems: 'center', gap: 3 }}><BedDouble size={10} />{p.beds}</span>
                        <span style={{ fontSize: 10.5, color: 'hsl(240 5% 55%)', display: 'flex', alignItems: 'center', gap: 3 }}><Bath size={10} />{p.baths}</span>
                        <span style={{ fontSize: 10.5, color: 'hsl(240 5% 55%)', display: 'flex', alignItems: 'center', gap: 3 }}><Maximize2 size={10} />{p.area}m²</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 9px', borderRadius: 6, background: sc.bg, color: sc.c }}>{p.status}</span>
                    </td>

                    {/* Listed toggle */}
                    <td style={{ padding: '11px 14px' }}>
                      <button onClick={() => toggleListed(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
                        {p.isListed
                          ? <ToggleRight size={22} style={{ color: '#a78bfa' }} />
                          : <ToggleLeft  size={22} style={{ color: 'hsl(240 5% 38%)' }} />}
                        <span style={{ fontSize: 10.5, fontWeight: 600, color: p.isListed ? '#a78bfa' : 'hsl(240 5% 38%)' }}>{p.isListed ? 'Live' : 'Hidden'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button onClick={() => openView(p)} style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="View">
                          <Eye size={13} style={{ color: '#60a5fa' }} />
                        </button>
                        <button onClick={() => openEdit(p)} style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="Edit">
                          <Pencil size={13} style={{ color: '#c4b5fd' }} />
                        </button>
                        <button onClick={() => openDelete(p)} style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="Delete">
                          <Trash2 size={13} style={{ color: '#f87171' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {displayed.length === 0 && (
                <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', fontSize: 13, color: 'hsl(240 5% 44%)' }}>No properties match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══════════ ADD / EDIT MODAL ══════════ */}
      {(modal === 'add' || modal === 'edit') && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 16px', overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: 680, background: 'hsl(260 87% 5%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, overflow: 'hidden', animation: 'propDropIn 0.2s ease', marginBottom: 24 }}>

            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(167,139,250,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={16} style={{ color: '#fff' }} />
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 800, color: 'hsl(40 10% 95%)' }}>{modal === 'add' ? 'Add New Property' : 'Edit Property'}</p>
                  <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)' }}>{modal === 'add' ? 'Fill in the details below to list a new property' : `Editing: ${selected?.title}`}</p>
                </div>
              </div>
              <button onClick={() => setModal(null)} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(240 5% 55%)' }}><X size={14} /></button>
            </div>

            <div style={{ padding: '22px 22px 26px', overflowY: 'auto', maxHeight: 'calc(90vh - 80px)' }}>

              {/* Image upload */}
              <F label="Property Image">
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{ height: 160, borderRadius: 12, border: '2px dashed rgba(167,139,250,0.3)', background: imgPreview ? 'transparent' : 'rgba(167,139,250,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', position: 'relative', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(167,139,250,0.6)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(167,139,250,0.3)')}
                >
                  {imgPreview
                    ? <img src={imgPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                    : <div style={{ textAlign: 'center' }}>
                        <ImagePlus size={28} style={{ color: 'rgba(167,139,250,0.5)', margin: '0 auto 8px' }} />
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#a78bfa' }}>Click to upload image</p>
                        <p style={{ fontSize: 11, color: 'hsl(240 5% 44%)', marginTop: 3 }}>JPG, PNG, WebP — max 10MB</p>
                      </div>
                  }
                  {imgPreview && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.45)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0)')}
                    >
                      <Upload size={22} style={{ color: '#fff', opacity: 0 }} />
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImageFile} style={{ display: 'none' }} />
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <input value={photoFile ? '' : (form.imageUrl && !form.imageUrl.startsWith('/uploads/') ? form.imageUrl : '')} onChange={e => { setForm(f => ({ ...f, imageUrl: e.target.value })); setImgPreview(e.target.value) }} placeholder="…or paste an image URL" style={{ ...inp(), height: 36, flex: 1, fontSize: 12 }} />
                </div>
              </F>

              {/* Gallery upload */}
              <F label="Gallery Images">
                <div style={{ border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, padding: 12 }}>
                  <button type="button" onClick={() => galleryRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', color: '#c4b5fd', fontSize: 12, fontWeight: 600, cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
                    <Plus size={14} /> Add Gallery Images
                  </button>
                  <input ref={galleryRef} type="file" multiple accept="image/*" onChange={handleGalleryFiles} style={{ display: 'none' }} />
                  {galleryFiles.length > 0 && (
                    <div style={{ marginTop: 10, fontSize: 12, color: 'hsl(240 5% 60%)' }}>
                      {galleryFiles.length} image(s) selected
                    </div>
                  )}
                </div>
              </F>

              {/* Title + Type */}
              <div className="grid sm:grid-cols-2 gap-4">
                <F label="Property Title *">
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Lekki Ocean View Villa" style={inp()} />
                </F>
                <F label="Property Type">
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={{ ...inp(), appearance: 'none' }}>
                    {TYPES.filter(t => t !== 'All').map(t => <option key={t} value={t} style={{ background: 'hsl(260 87% 6%)' }}>{t}</option>)}
                  </select>
                </F>
              </div>

              {/* Address + City + Country */}
              <F label="Street Address">
                <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="e.g. 14 Admiralty Way" style={inp()} />
              </F>
              <div className="grid sm:grid-cols-2 gap-4">
                <F label="City *">
                  <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="e.g. Lagos" style={inp()} />
                </F>
                <F label="Country">
                  <input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} placeholder="e.g. Nigeria" style={inp()} />
                </F>
              </div>

              {/* Price + ROI + Yield */}
              <div className="grid sm:grid-cols-3 gap-4">
                <F label="Price (USD)">
                  <div style={{ position: 'relative' }}>
                    <DollarSign size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'hsl(240 5% 44%)', pointerEvents: 'none' }} />
                    <input type="number" value={form.price || ''} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} placeholder="850000" style={{ ...inp(), paddingLeft: 26 }} />
                  </div>
                </F>
                <F label="ROI (%)">
                  <input type="number" step="0.1" value={form.roi || ''} onChange={e => setForm(f => ({ ...f, roi: Number(e.target.value) }))} placeholder="18.4" style={inp()} />
                </F>
                <F label="Yield (%)">
                  <input type="number" step="0.1" value={form.yieldPct || ''} onChange={e => setForm(f => ({ ...f, yieldPct: Number(e.target.value) }))} placeholder="9.2" style={inp()} />
                </F>
              </div>

              {/* Beds + Baths + Area */}
              <div className="grid sm:grid-cols-3 gap-4">
                <F label="Bedrooms">
                  <input type="number" value={form.beds || ''} onChange={e => setForm(f => ({ ...f, beds: Number(e.target.value) }))} placeholder="4" style={inp()} />
                </F>
                <F label="Bathrooms">
                  <input type="number" value={form.baths || ''} onChange={e => setForm(f => ({ ...f, baths: Number(e.target.value) }))} placeholder="3" style={inp()} />
                </F>
                <F label="Area (m²)">
                  <input type="number" value={form.area || ''} onChange={e => setForm(f => ({ ...f, area: Number(e.target.value) }))} placeholder="280" style={inp()} />
                </F>
              </div>

              {/* Status + Rating */}
              <div className="grid sm:grid-cols-2 gap-4">
                <F label="Availability Status">
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Property['status'] }))} style={{ ...inp(), appearance: 'none' }}>
                    {STATUSES.map(s => <option key={s} value={s} style={{ background: 'hsl(260 87% 6%)' }}>{s}</option>)}
                  </select>
                </F>
                <F label="Star Rating (0–5)">
                  <input type="number" min="0" max="5" step="0.1" value={form.rating || ''} onChange={e => setForm(f => ({ ...f, rating: Number(e.target.value) }))} placeholder="4.5" style={inp()} />
                </F>
              </div>

              {/* Description */}
              <F label="Description">
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Brief description of the property…" style={{ ...inp(), height: 'auto', paddingTop: 10, paddingBottom: 10, resize: 'vertical', lineHeight: 1.6 }} />
              </F>

              {/* Tags */}
              <F label="Tags">
                <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                  {form.tags.map(t => (
                    <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 6, background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.25)', color: '#c4b5fd' }}>
                      {t}
                      <button onClick={() => removeTag(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a78bfa', padding: 0, display: 'flex', lineHeight: 1 }}><X size={10} /></button>
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="e.g. Pool, Gated, Rooftop — press Enter" style={{ ...inp(), height: 36, flex: 1, fontSize: 12 }} />
                  <button onClick={addTag} style={{ padding: '0 14px', borderRadius: 8, background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.25)', color: '#c4b5fd', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                    <Tag size={13} />
                  </button>
                </div>
              </F>

              {/* Listed toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', marginBottom: 20 }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'hsl(40 6% 88%)' }}>Show on Platform</p>
                  <p style={{ fontSize: 11, color: 'hsl(240 5% 48%)' }}>Make this property visible to all users</p>
                </div>
                <button onClick={() => setForm(f => ({ ...f, isListed: !f.isListed }))} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  {form.isListed
                    ? <ToggleRight size={32} style={{ color: '#a78bfa' }} />
                    : <ToggleLeft  size={32} style={{ color: 'hsl(240 5% 38%)' }} />}
                </button>
              </div>

              {/* Save */}
              <button onClick={handleSave} disabled={!form.title || !form.city || saving} style={{ width: '100%', height: 46, borderRadius: 11, background: saved ? 'rgba(167,139,250,0.15)' : saving ? 'rgba(124,58,237,0.6)' : (!form.title || !form.city) ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', border: saved ? '1px solid rgba(167,139,250,0.3)' : 'none', color: saved ? '#a78bfa' : (!form.title || !form.city) ? 'hsl(240 5% 40%)' : '#fff', fontSize: 14, fontWeight: 700, cursor: (!form.title || !form.city || saving) ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s', opacity: saving ? 0.8 : 1 }}>
                {saving ? <><svg width="18" height="18" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="31.4 31.4" strokeLinecap="round" /></svg> Saving...</> : saved ? <><CheckCircle2 size={16} /> Saved!</> : modal === 'add' ? <><Plus size={15} /> Add Property</> : <><Pencil size={14} /> Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ VIEW MODAL ══════════ */}
      {modal === 'view' && selected && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 520, background: 'hsl(260 87% 5%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, overflow: 'hidden', animation: 'propDropIn 0.2s ease' }}>
            {selected.imageUrl && <img src={imgSrc(selected.imageUrl)} style={{ width: '100%', height: 200, objectFit: 'cover' }} alt="" />}
            <div style={{ padding: '20px 22px 26px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <p style={{ fontSize: 17, fontWeight: 800, color: 'hsl(40 10% 96%)' }}>{selected.title}</p>
                  <p style={{ fontSize: 12, color: 'hsl(240 5% 50%)', marginTop: 3 }}><MapPin size={10} style={{ display: 'inline', marginRight: 3 }} />{selected.address}, {selected.city}, {selected.country}</p>
                </div>
                <button onClick={() => setModal(null)} style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.06)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(240 5% 55%)', flexShrink: 0 }}><X size={13} /></button>
              </div>
              <div className="grid grid-cols-3 gap-3" style={{ marginBottom: 14 }}>
                {[
                  { label: 'Price', value: selected.price >= 1e6 ? `$${parseFloat((selected.price/1e6).toFixed(2))}M` : `$${(selected.price/1000).toFixed(0)}K`, c: '#a78bfa' },
                  { label: 'ROI',   value: `${selected.roi}%`,    c: '#f59e0b' },
                  { label: 'Yield', value: `${selected.yieldPct}%`,  c: '#60a5fa' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 9, padding: '10px 12px', textAlign: 'center' }}>
                    <p style={{ fontSize: 11, color: 'hsl(240 5% 48%)' }}>{s.label}</p>
                    <p style={{ fontSize: 16, fontWeight: 800, color: s.c }}>{s.value}</p>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 12.5, color: 'hsl(240 5% 60%)', lineHeight: 1.7, marginBottom: 14 }}>{selected.description}</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                {selected.tags.map(t => (
                  <span key={t} style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 6, background: 'rgba(167,139,250,0.12)', color: '#c4b5fd' }}>{t}</span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setModal(null); setTimeout(() => openEdit(selected), 50) }} style={{ flex: 1, padding: '10px', borderRadius: 9, background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Pencil size={13} /> Edit Property
                </button>
                <button onClick={() => setModal(null)} style={{ flex: 1, padding: '10px', borderRadius: 9, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'hsl(240 5% 55%)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ DELETE CONFIRM ══════════ */}
      {modal === 'delete' && selected && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 400, background: 'hsl(260 87% 5%)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 18, padding: '28px 24px', animation: 'propDropIn 0.2s ease', textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: 13, background: 'rgba(248,113,113,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <Trash2 size={22} style={{ color: '#f87171' }} />
            </div>
            <p style={{ fontSize: 16, fontWeight: 800, color: 'hsl(40 10% 95%)', marginBottom: 6 }}>Delete Property?</p>
            <p style={{ fontSize: 12.5, color: 'hsl(240 5% 52%)', marginBottom: 22, lineHeight: 1.6 }}>
              <strong style={{ color: 'hsl(40 6% 80%)' }}>{selected.title}</strong> will be permanently removed from the platform.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: '11px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'hsl(240 5% 55%)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleDelete} style={{ flex: 1, padding: '11px', borderRadius: 10, background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes propDropIn { from{opacity:0;transform:translateY(-10px) scale(0.98)} to{opacity:1;transform:translateY(0) scale(1)} }`}</style>
    </div>
  )
}
