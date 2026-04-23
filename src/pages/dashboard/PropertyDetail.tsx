import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  MapPin, Bed, Bath, Square, TrendingUp, Star, ArrowLeft,
  Shield, CheckCircle, ChevronLeft, ChevronRight, Calendar, BarChart3,
} from 'lucide-react'

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

function fmt(n: number) {
  if (n >= 1_000_000) return `$${parseFloat((n / 1_000_000).toFixed(2))}M`
  return `$${(n / 1_000).toFixed(0)}K`
}

function displayType(t: string) {
  return t.charAt(0) + t.slice(1).toLowerCase()
}

export function PropertyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeImg, setActiveImg] = useState(0)
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    fetchProperty()
  }, [id])

  async function fetchProperty() {
    try {
      setLoading(true)
      setError(null)
      // Try fetching from the public endpoint list and find by id
      const res = await fetch(`${API_BASE_URL}/admin/public/properties`)
      const json = await res.json()
      if (json.success) {
        const found = (json.data as Property[]).find(p => p.id === id)
        if (found) {
          setProperty(found)
        } else {
          setError('Property not found')
        }
      } else {
        setError('Failed to load property')
      }
    } catch (e) {
      console.error('Failed to fetch property', e)
      setError('Failed to load property')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-[900px] mx-auto flex flex-col items-center justify-center" style={{ minHeight: '60vh' }}>
        <p style={{ fontSize: 14, color: 'hsl(240 5% 55%)' }}>Loading property…</p>
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="p-8 max-w-[900px] mx-auto flex flex-col items-center justify-center" style={{ minHeight: '60vh' }}>
        <p style={{ fontSize: 18, fontWeight: 600, color: 'hsl(40 6% 88%)', marginBottom: 12 }}>{error || 'Property not found'}</p>
        <button
          onClick={() => navigate('/dashboard/properties')}
          style={{
            padding: '0.625rem 1.5rem', borderRadius: 10,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
            color: 'hsl(40 6% 85%)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
          }}
        >
          Back to Listings
        </button>
      </div>
    )
  }

  const allImages = [property.imageUrl, ...(property.gallery ?? [])].filter(Boolean) as string[]
  const statusColor = property.status === 'AVAILABLE' ? '#a78bfa' : property.status === 'PENDING' ? '#f59e0b' : '#f87171'
  const statusBg = property.status === 'AVAILABLE' ? 'rgba(167,139,250,0.12)' : property.status === 'PENDING' ? 'rgba(245,158,11,0.12)' : 'rgba(248,113,113,0.12)'

  const prevImg = () => setActiveImg(i => (i === 0 ? allImages.length - 1 : i - 1))
  const nextImg = () => setActiveImg(i => (i === allImages.length - 1 ? 0 : i + 1))

  return (
    <div className="p-4 md:p-8 max-w-[1100px] mx-auto overflow-x-hidden">

      {/* ── Back Button ── */}
      <button
        onClick={() => navigate('/dashboard/properties')}
        className="flex items-center gap-2 mb-6"
        style={{
          fontSize: 13, color: 'hsl(240 5% 55%)', background: 'none',
          border: 'none', cursor: 'pointer', padding: 0,
        }}
      >
        <ArrowLeft size={15} />
        Back to Listings
      </button>

      {/* ── Image Gallery ── */}
      <div style={{
        borderRadius: 20, overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.07)',
        marginBottom: 24,
      }}>
        {/* Main Image */}
        <div style={{ position: 'relative', height: 420, overflow: 'hidden', background: '#0a0a0a' }}>
          <img
            src={imgSrc(allImages[activeImg])}
            alt={property.title}
            style={{
              width: '100%', height: '100%', objectFit: 'cover', display: 'block',
              transition: 'opacity 0.3s',
            }}
          />

          {/* Gradient overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.5) 100%)',
          }} />

          {/* Nav arrows */}
          <button
            onClick={prevImg}
            style={{
              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
              width: 38, height: 38, borderRadius: '50%',
              background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#fff',
            }}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={nextImg}
            style={{
              position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
              width: 38, height: 38, borderRadius: '50%',
              background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#fff',
            }}
          >
            <ChevronRight size={18} />
          </button>

          {/* Image counter */}
          <span style={{
            position: 'absolute', bottom: 14, right: 14,
            fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.8)',
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)',
            padding: '4px 10px', borderRadius: 8,
          }}>
            {activeImg + 1} / {allImages.length}
          </span>

          {/* Status badge */}
          <span style={{
            position: 'absolute', top: 14, left: 14,
            fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
            color: statusColor, background: statusBg,
            backdropFilter: 'blur(6px)',
            border: `1px solid ${statusColor}30`,
            padding: '4px 12px', borderRadius: 999,
          }}>
            {property.status}
          </span>

          {property.featured && (
            <span style={{
              position: 'absolute', top: 14, left: property.status ? 120 : 14,
              fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
              color: '#f59e0b', background: 'rgba(245,158,11,0.2)',
              backdropFilter: 'blur(6px)',
              border: '1px solid rgba(245,158,11,0.3)',
              padding: '4px 10px', borderRadius: 999,
            }}>
              ★ FEATURED
            </span>
          )}
        </div>

        {/* Thumbnail strip */}
        <div style={{
          display: 'flex', gap: 3, padding: 3,
          background: 'rgba(255,255,255,0.02)',
          overflowX: 'auto',
        }}>
          {allImages.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveImg(i)}
              style={{
                flex: '0 0 auto', width: 80, height: 56,
                borderRadius: 8, overflow: 'hidden',
                border: activeImg === i ? '2px solid #a78bfa' : '2px solid transparent',
                opacity: activeImg === i ? 1 : 0.5,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <img src={imgSrc(img)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </button>
          ))}
        </div>
      </div>

      {/* ── Content Grid ── */}
      <div className="grid lg:grid-cols-[1fr_340px] gap-6">

        {/* Left — Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Title + Price */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                background: 'rgba(167,139,250,0.1)', color: '#c4b5fd',
                border: '1px solid rgba(167,139,250,0.2)',
              }}>
                {displayType(property.type)}
              </span>
              {(property.tags ?? []).map(tag => (
                <span key={tag} style={{
                  fontSize: 10, fontWeight: 500, padding: '3px 8px', borderRadius: 6,
                  background: 'rgba(255,255,255,0.04)', color: 'hsl(240 5% 60%)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  {tag}
                </span>
              ))}
            </div>
            <h1 style={{
              fontSize: 26, fontWeight: 700, color: 'hsl(40 10% 96%)',
              letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 6,
            }}>
              {property.title}
            </h1>
            <div className="flex items-center gap-1.5 mb-4">
              <MapPin size={13} style={{ color: 'hsl(240 5% 45%)' }} />
              <span style={{ fontSize: 13, color: 'hsl(240 5% 55%)' }}>
                {property.address}{property.city ? `, ${property.city}` : ''}{property.country ? `, ${property.country}` : ''}
              </span>
            </div>
            <p style={{
              fontSize: 28, fontWeight: 800, color: '#a78bfa',
              letterSpacing: '-0.02em',
            }}>
              {fmt(property.price)}
              <span style={{ fontSize: 14, fontWeight: 400, color: 'hsl(240 5% 50%)', marginLeft: 8 }}>
                / {property.yieldPct ?? 0}% yield
              </span>
            </p>
          </div>

          {/* Specs Row */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 12,
            padding: '16px 20px',
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 16,
          }}>
            {(property.beds ?? 0) > 0 && (
              <div className="flex items-center gap-2" style={{ minWidth: 90 }}>
                <Bed size={16} style={{ color: '#a78bfa' }} />
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: 'hsl(40 6% 92%)' }}>{property.beds}</p>
                  <p style={{ fontSize: 10, color: 'hsl(240 5% 50%)' }}>Bedrooms</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2" style={{ minWidth: 90 }}>
              <Bath size={16} style={{ color: '#38bdf8' }} />
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'hsl(40 6% 92%)' }}>{property.baths ?? 0}</p>
                <p style={{ fontSize: 10, color: 'hsl(240 5% 50%)' }}>Bathrooms</p>
              </div>
            </div>
            <div className="flex items-center gap-2" style={{ minWidth: 90 }}>
              <Square size={16} style={{ color: '#f59e0b' }} />
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'hsl(40 6% 92%)' }}>{(property.area ?? 0).toLocaleString()}</p>
                <p style={{ fontSize: 10, color: 'hsl(240 5% 50%)' }}>Sq. Ft.</p>
              </div>
            </div>
            <div className="flex items-center gap-2" style={{ minWidth: 90 }}>
              <Star size={16} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'hsl(40 6% 92%)' }}>{property.rating}</p>
                <p style={{ fontSize: 10, color: 'hsl(240 5% 50%)' }}>{property.reviews} reviews</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div style={{
            padding: '20px 24px',
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 16,
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'hsl(40 6% 88%)', marginBottom: 10 }}>
              About This Property
            </h3>
            <p style={{
              fontSize: 13, color: 'hsl(240 5% 60%)', lineHeight: 1.8,
            }}>
              {property.description}
            </p>
          </div>

          {/* Investment Highlights */}
          <div style={{
            padding: '20px 24px',
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 16,
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'hsl(40 6% 88%)', marginBottom: 14 }}>
              Investment Highlights
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Projected ROI', value: `${property.roi}%`, icon: TrendingUp, color: '#a78bfa' },
                { label: 'Annual Yield', value: `${property.yieldPct ?? 0}%`, icon: BarChart3, color: '#38bdf8' },
                { label: 'Property Type', value: displayType(property.type), icon: Shield, color: '#f59e0b' },
                { label: 'Investment Term', value: '12–36 mo', icon: Calendar, color: '#a78bfa' },
              ].map(h => (
                <div key={h.label} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 14px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 8,
                    background: `${h.color}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <h.icon size={16} style={{ color: h.color }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'hsl(40 6% 92%)' }}>{h.value}</p>
                    <p style={{ fontSize: 10, color: 'hsl(240 5% 50%)' }}>{h.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — Invest Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Invest CTA Card */}
          <div style={{
            padding: '24px',
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 20, position: 'sticky', top: 24,
          }}>
            <p style={{
              fontSize: 12, fontWeight: 600, color: 'hsl(240 5% 50%)',
              letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16,
            }}>
              Investment Summary
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {[
                { label: 'Listing Price', value: fmt(property.price) },
                { label: 'Projected ROI', value: `${property.roi}%` },
                { label: 'Annual Yield', value: `${property.yieldPct ?? 0}%` },
                { label: 'Status', value: property.status.charAt(0) + property.status.slice(1).toLowerCase() },
              ].map(r => (
                <div key={r.label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '10px 12px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.03)',
                }}>
                  <span style={{ fontSize: 12, color: 'hsl(240 5% 55%)' }}>{r.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'hsl(40 6% 88%)' }}>{r.value}</span>
                </div>
              ))}
            </div>

            {property.status === 'AVAILABLE' ? (
              <button
                onClick={() => navigate('/dashboard/deposit')}
                style={{
                  width: '100%', padding: '14px', borderRadius: 12,
                  fontSize: 14, fontWeight: 700,
                  background: 'linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)',
                  color: '#050505', border: 'none', cursor: 'pointer',
                  boxShadow: '0 4px 24px rgba(167,139,250,0.25)',
                  transition: 'all 0.2s',
                }}
              >
                Invest Now
              </button>
            ) : property.status === 'PENDING' ? (
              <button
                style={{
                  width: '100%', padding: '14px', borderRadius: 12,
                  fontSize: 14, fontWeight: 700,
                  background: 'rgba(245,158,11,0.15)',
                  color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)',
                  cursor: 'pointer',
                }}
              >
                Join Waitlist
              </button>
            ) : (
              <button
                disabled
                style={{
                  width: '100%', padding: '14px', borderRadius: 12,
                  fontSize: 14, fontWeight: 600,
                  background: 'rgba(255,255,255,0.04)',
                  color: 'hsl(240 5% 45%)', border: '1px solid rgba(255,255,255,0.06)',
                  cursor: 'not-allowed',
                }}
              >
                Property Sold
              </button>
            )}
          </div>

          {/* Trust Indicators */}
          <div style={{
            padding: '20px',
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 16,
          }}>
            <div className="flex items-center gap-2 mb-3">
              <Shield size={14} style={{ color: '#a78bfa' }} />
              <p style={{ fontSize: 12, fontWeight: 600, color: 'hsl(40 6% 88%)' }}>Investor Protection</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'Fully vetted & verified property',
                'Escrow-protected transactions',
                'Transparent ROI reporting',
                'Legal documentation included',
                'Dedicated investment advisor',
              ].map(item => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle size={11} style={{ color: '#a78bfa', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'hsl(240 5% 60%)' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div style={{
            padding: '14px 16px', borderRadius: 12,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <p style={{ fontSize: 10, color: 'hsl(240 5% 42%)', lineHeight: 1.6 }}>
              <span style={{ fontWeight: 600, color: 'hsl(240 5% 55%)' }}>Disclaimer: </span>
              Property listings and ROI figures are for illustrative purposes only. Real estate investments involve risk. Past performance does not guarantee future results.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
