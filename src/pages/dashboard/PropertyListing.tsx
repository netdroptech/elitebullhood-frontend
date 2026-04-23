import { useState, useEffect } from 'react'
import { MapPin, Bed, Bath, Square, TrendingUp, Heart, Eye, Search, ChevronDown, Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'
const API_BASE = API_BASE_URL.replace('/api', '')

interface Property {
  id: string
  title: string
  address: string
  city: string
  country: string
  type: string
  price: number
  roi: number
  yieldPct: number | null
  beds: number | null
  baths: number | null
  area: number | null
  description: string | null
  imageUrl: string | null
  gallery: string[]
  tags: string[]
  rating: number
  reviews: number
  featured: boolean
  isListed: boolean
  status: string
}

function imgSrc(url: string | null | undefined) {
  if (!url) return ''
  if (url.startsWith('/uploads/')) return API_BASE + url
  return url
}

const STATUS_STYLES: Record<string, { color: string; bg: string }> = {
  AVAILABLE: { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  PENDING:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  SOLD:      { color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
}

const TYPE_OPTIONS = ['All', 'APARTMENT', 'VILLA', 'PENTHOUSE', 'HOUSE', 'CONDO', 'LOFT', 'COMMERCIAL', 'CHALET', 'TOWNHOUSE', 'DUPLEX', 'STUDIO', 'LAND']
const SORT_OPTIONS = ['Featured', 'Price: Low to High', 'Price: High to Low', 'Highest ROI', 'Highest Yield']

function fmt(n: number) {
  if (n >= 1_000_000) return `$${parseFloat((n / 1_000_000).toFixed(2))}M`
  return `$${(n / 1_000).toFixed(0)}K`
}

function displayType(t: string) {
  return t.charAt(0) + t.slice(1).toLowerCase()
}

function displayStatus(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase()
}

export function PropertyListing() {
  const navigate = useNavigate()
  const [search, setSearch]         = useState('')
  const [filterType, setFilterType] = useState('All')
  const [sortBy, setSortBy]         = useState('Featured')
  const [liked, setLiked] = useState<string[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProperties()
  }, [])

  async function fetchProperties() {
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE_URL}/admin/public/properties`)
      const json = await res.json()
      if (json.success) {
        setProperties(json.data ?? [])
      }
    } catch (e) {
      console.error('Failed to fetch properties', e)
    } finally {
      setLoading(false)
    }
  }

  const filtered = properties
    .filter(p =>
      (filterType === 'All' || p.type === filterType) &&
      (search === '' ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.address.toLowerCase().includes(search.toLowerCase()) ||
        p.city.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === 'Price: Low to High')  return a.price - b.price
      if (sortBy === 'Price: High to Low')  return b.price - a.price
      if (sortBy === 'Highest ROI')          return b.roi - a.roi
      if (sortBy === 'Highest Yield')        return (b.yieldPct ?? 0) - (a.yieldPct ?? 0)
      // Featured first
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0)
    })

  const toggleLike = (id: string) =>
    setLiked(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const avgROI = properties.length ? (properties.reduce((s, p) => s + p.roi, 0) / properties.length).toFixed(1) : '0.0'
  const totalValue = properties.reduce((s, p) => s + p.price, 0)
  const available = properties.filter(p => p.status === 'AVAILABLE').length

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto overflow-x-hidden">

      {/* ── Page Header ── */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span style={{
            fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
            color: '#a78bfa', background: 'rgba(167,139,250,0.1)',
            padding: '4px 10px', borderRadius: 999,
          }}>
            REAL ESTATE
          </span>
          <span style={{ color: 'hsl(240 5% 40%)', fontSize: 12 }}>•</span>
          <span style={{ fontSize: 11, color: 'hsl(240 5% 55%)' }}>{properties.length} Properties Listed</span>
        </div>
        <h1 style={{
          fontSize: 28, fontWeight: 700, color: 'hsl(40 10% 96%)',
          letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 8,
        }}>
          Property Listings
        </h1>
        <p style={{ color: 'hsl(240 5% 55%)', fontSize: 14, lineHeight: 1.6, maxWidth: 560 }}>
          Explore premium real estate investment opportunities across global markets.
          Each property is vetted for yield, growth, and liquidity.
        </p>
      </div>

      {/* ── Stats Strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Listings',     value: String(properties.length), sub: 'Active properties',   color: '#c4b5fd' },
          { label: 'Available Now',      value: String(available), sub: 'Ready to invest', color: '#a78bfa' },
          { label: 'Avg. ROI',           value: `${avgROI}%`, sub: 'Annual return',       color: '#f59e0b' },
          { label: 'Portfolio Value',    value: fmt(totalValue),   sub: 'Combined listing', color: '#38bdf8' },
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 16, padding: '18px 20px',
          }}>
            <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)', fontWeight: 500, marginBottom: 6, letterSpacing: '0.04em' }}>
              {stat.label}
            </p>
            <p style={{ fontSize: 22, fontWeight: 700, color: stat.color, lineHeight: 1 }}>
              {stat.value}
            </p>
            <p style={{ fontSize: 11, color: 'hsl(240 5% 45%)', marginTop: 4 }}>{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Search + Filters Bar ── */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        {/* Search */}
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={15} style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: 'hsl(240 5% 45%)',
          }} />
          <input
            type="text"
            placeholder="Search by name or location…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', paddingLeft: 36, paddingRight: 14,
              height: 40, borderRadius: 10, fontSize: 13,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'hsl(40 6% 95%)', outline: 'none',
            }}
          />
        </div>

        {/* Type filter */}
        <div style={{ position: 'relative' }}>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            style={{
              height: 40, paddingLeft: 14, paddingRight: 32, borderRadius: 10, fontSize: 13,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'hsl(40 6% 85%)', cursor: 'pointer', outline: 'none',
              appearance: 'none', minWidth: 140,
            }}
          >
            {TYPE_OPTIONS.map(t => <option key={t} value={t} style={{ background: 'hsl(260 87% 6%)' }}>{t === 'All' ? 'All' : displayType(t)}</option>)}
          </select>
          <ChevronDown size={13} style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            color: 'hsl(240 5% 50%)', pointerEvents: 'none',
          }} />
        </div>

        {/* Sort */}
        <div style={{ position: 'relative' }}>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{
              height: 40, paddingLeft: 14, paddingRight: 32, borderRadius: 10, fontSize: 13,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'hsl(40 6% 85%)', cursor: 'pointer', outline: 'none',
              appearance: 'none', minWidth: 170,
            }}
          >
            {SORT_OPTIONS.map(s => <option key={s} value={s} style={{ background: 'hsl(260 87% 6%)' }}>{s}</option>)}
          </select>
          <ChevronDown size={13} style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            color: 'hsl(240 5% 50%)', pointerEvents: 'none',
          }} />
        </div>
      </div>

      {/* ── Results Count ── */}
      <p style={{ fontSize: 12, color: 'hsl(240 5% 50%)', marginBottom: 20 }}>
        Showing <span style={{ color: 'hsl(40 6% 85%)', fontWeight: 600 }}>{filtered.length}</span> of {properties.length} properties
      </p>

      {/* ── Loading State ── */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <p style={{ fontSize: 14, color: 'hsl(240 5% 55%)' }}>Loading properties…</p>
        </div>
      )}

      {/* ── Property Grid ── */}
      {!loading && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filtered.map(property => {
          const statusStyle = STATUS_STYLES[property.status] ?? STATUS_STYLES.AVAILABLE
          const isLiked = liked.includes(property.id)

          return (
            <div
              key={property.id}
              style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 20, overflow: 'hidden',
                transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
                cursor: 'pointer',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLDivElement
                el.style.transform = 'translateY(-4px)'
                el.style.borderColor = 'rgba(167,139,250,0.35)'
                el.style.boxShadow = '0 12px 40px rgba(167,139,250,0.12)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLDivElement
                el.style.transform = 'translateY(0)'
                el.style.borderColor = 'rgba(255,255,255,0.07)'
                el.style.boxShadow = 'none'
              }}
            >
              {/* Image */}
              <div style={{ position: 'relative', height: 190, overflow: 'hidden' }}>
                <img
                  src={imgSrc(property.imageUrl)}
                  alt={property.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />

                {/* Gradient overlay on image */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.55) 100%)',
                }} />

                {/* Featured badge */}
                {property.featured && (
                  <span style={{
                    position: 'absolute', top: 10, left: 10,
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                    color: '#f59e0b', background: 'rgba(245,158,11,0.2)',
                    backdropFilter: 'blur(6px)',
                    border: '1px solid rgba(245,158,11,0.3)',
                    padding: '3px 8px', borderRadius: 999,
                  }}>
                    ★ FEATURED
                  </span>
                )}

                {/* Status badge */}
                <span style={{
                  position: 'absolute', top: 10, right: 44,
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
                  color: statusStyle.color, background: statusStyle.bg,
                  backdropFilter: 'blur(6px)',
                  border: `1px solid ${statusStyle.color}30`,
                  padding: '3px 8px', borderRadius: 999,
                }}>
                  {property.status}
                </span>

                {/* Like button */}
                <button
                  onClick={e => { e.stopPropagation(); toggleLike(property.id) }}
                  style={{
                    position: 'absolute', top: 10, right: 10,
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'transform 0.15s',
                  }}
                >
                  <Heart
                    size={13}
                    style={{
                      fill: isLiked ? '#f87171' : 'none',
                      color: isLiked ? '#f87171' : 'rgba(255,255,255,0.7)',
                    }}
                  />
                </button>

                {/* Type pill on image bottom */}
                <span style={{
                  position: 'absolute', bottom: 10, left: 10,
                  fontSize: 10, fontWeight: 600,
                  color: 'rgba(255,255,255,0.9)', background: 'rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(6px)',
                  padding: '3px 8px', borderRadius: 6,
                }}>
                  {displayType(property.type)}
                </span>

                {/* ROI pill on image bottom right */}
                <span style={{
                  position: 'absolute', bottom: 10, right: 10,
                  fontSize: 10, fontWeight: 700,
                  color: '#a78bfa', background: 'rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(6px)',
                  padding: '3px 8px', borderRadius: 6,
                  display: 'flex', alignItems: 'center', gap: 3,
                }}>
                  <TrendingUp size={10} />
                  {property.roi}% ROI
                </span>
              </div>

              {/* Body */}
              <div style={{ padding: '14px 16px 16px' }}>
                {/* Title + Price */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h3 style={{
                    fontSize: 13.5, fontWeight: 700, color: 'hsl(40 10% 94%)',
                    lineHeight: 1.3, flex: 1,
                  }}>
                    {property.title}
                  </h3>
                </div>

                {/* Price */}
                <p style={{ fontSize: 17, fontWeight: 800, color: '#a78bfa', marginBottom: 8, letterSpacing: '-0.01em' }}>
                  {fmt(property.price)}
                  <span style={{ fontSize: 11, fontWeight: 400, color: 'hsl(240 5% 50%)', marginLeft: 4 }}>
                    / {property.yieldPct ?? 0}% yield
                  </span>
                </p>

                {/* Location */}
                <div className="flex items-center gap-1 mb-10px" style={{ marginBottom: 10 }}>
                  <MapPin size={11} style={{ color: 'hsl(240 5% 45%)', flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: 'hsl(240 5% 50%)', lineHeight: 1.3 }}>
                    {property.address}{property.city ? `, ${property.city}` : ''}{property.country ? `, ${property.country}` : ''}
                  </span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {(property.tags ?? []).map(tag => (
                    <span key={tag} style={{
                      fontSize: 10, fontWeight: 500, padding: '2px 7px', borderRadius: 5,
                      background: 'rgba(167,139,250,0.1)', color: '#c4b5fd',
                      border: '1px solid rgba(167,139,250,0.2)',
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '12px 0' }} />

                {/* Specs */}
                <div className="flex items-center justify-between">
                  {(property.beds ?? 0) > 0 && (
                    <div className="flex items-center gap-1">
                      <Bed size={12} style={{ color: 'hsl(240 5% 45%)' }} />
                      <span style={{ fontSize: 12, color: 'hsl(240 5% 60%)', fontWeight: 500 }}>{property.beds} bed</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Bath size={12} style={{ color: 'hsl(240 5% 45%)' }} />
                    <span style={{ fontSize: 12, color: 'hsl(240 5% 60%)', fontWeight: 500 }}>{property.baths ?? 0} bath</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Square size={12} style={{ color: 'hsl(240 5% 45%)' }} />
                    <span style={{ fontSize: 12, color: 'hsl(240 5% 60%)', fontWeight: 500 }}>{(property.area ?? 0).toLocaleString()} ft²</span>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-1">
                    <Star size={11} style={{ fill: '#f59e0b', color: '#f59e0b' }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'hsl(40 6% 85%)' }}>{property.rating}</span>
                    <span style={{ fontSize: 11, color: 'hsl(240 5% 45%)' }}>({property.reviews} reviews)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye size={11} style={{ color: 'hsl(240 5% 45%)' }} />
                    <span style={{ fontSize: 11, color: 'hsl(240 5% 45%)' }}>
                      {Math.floor(Math.random() * 800 + 200)}
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={() => {
                    if (property.status !== 'SOLD') navigate(`/dashboard/properties/${property.id}`)
                  }}
                  style={{
                    width: '100%', marginTop: 14, height: 38, borderRadius: 10,
                    fontSize: 13, fontWeight: 600,
                    cursor: property.status === 'SOLD' ? 'default' : 'pointer',
                    background: property.status === 'SOLD'
                      ? 'rgba(255,255,255,0.04)'
                      : 'linear-gradient(135deg, rgba(167,139,250,0.25) 0%, rgba(167,139,250,0.15) 100%)',
                    color: property.status === 'SOLD' ? 'hsl(240 5% 45%)' : '#c4b5fd',
                    border: property.status === 'SOLD'
                      ? '1px solid rgba(255,255,255,0.06)'
                      : '1px solid rgba(167,139,250,0.3)',
                    transition: 'all 0.2s',
                  }}
                >
                  {property.status === 'SOLD' ? 'Property Sold' :
                   property.status === 'PENDING' ? 'View Details' : 'View'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
      )}

      {/* ── Empty State ── */}
      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <p style={{ fontSize: 14, color: 'hsl(240 5% 50%)' }}>No properties found.</p>
        </div>
      )}

      {/* ── Disclaimer ── */}
      <div style={{
        marginTop: 48, padding: '16px 20px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12,
      }}>
        <p style={{ fontSize: 11, color: 'hsl(240 5% 42%)', lineHeight: 1.7 }}>
          <span style={{ fontWeight: 600, color: 'hsl(240 5% 55%)' }}>Investment Disclaimer: </span>
          Property listings and ROI figures shown are for illustrative purposes only. Real estate investments involve risk, including possible loss of principal. Past performance and projected yields do not guarantee future results.
          Always consult with a licensed financial or real estate advisor before investing.
        </p>
      </div>
    </div>
  )
}
