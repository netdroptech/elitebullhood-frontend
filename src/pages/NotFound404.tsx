import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { ShieldOff, ArrowLeft } from 'lucide-react'

export function NotFound404() {
  const navigate = useNavigate()

  const [particles] = useState(() =>
    Array.from({ length: 22 }, () => ({
      x:       Math.random() * 100,
      y:       Math.random() * 100,
      size:    Math.random() * 2.2 + 0.4,
      speed:   Math.random() * 38 + 18,
      opacity: Math.random() * 0.18 + 0.04,
    }))
  )

  return (
    <div style={{
      minHeight: '100vh',
      background: 'hsl(260 87% 2%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Geist Sans', 'Inter', system-ui, sans-serif",
    }}>

      {/* Background particles */}
      {particles.map((p, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size,
          borderRadius: '50%',
          background: i % 3 === 0 ? '#7c3aed' : i % 3 === 1 ? '#6d28d9' : '#a78bfa',
          opacity: p.opacity,
          animation: `nfFloat ${p.speed}s linear infinite`,
          animationDelay: `${-Math.random() * p.speed}s`,
          pointerEvents: 'none',
        }} />
      ))}

      {/* Glow blobs */}
      <div style={{ position: 'absolute', top: '-15%', left: '-10%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-15%', right: '-10%', width: '45vw', height: '45vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Grid texture */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.013) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.013) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

      {/* Card */}
      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', maxWidth: 480, width: '100%' }}>

        {/* Icon */}
        <div style={{
          width: 88, height: 88, borderRadius: 24,
          background: 'linear-gradient(135deg, rgba(248,113,113,0.15), rgba(239,68,68,0.1))',
          border: '1px solid rgba(248,113,113,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 28px',
          boxShadow: '0 0 40px rgba(248,113,113,0.1)',
        }}>
          <ShieldOff size={38} style={{ color: '#f87171' }} />
        </div>

        {/* 404 */}
        <p style={{
          fontSize: 110,
          fontWeight: 900,
          color: 'transparent',
          backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          lineHeight: 1,
          margin: '0 0 8px',
          letterSpacing: '-6px',
          userSelect: 'none',
        }}>
          404
        </p>

        {/* Heading */}
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#f5f3ff', margin: '0 0 12px', letterSpacing: '-0.02em' }}>
          This page doesn't exist
        </h1>

        {/* Sub */}
        <p style={{ fontSize: 14, color: 'hsl(240 5% 50%)', lineHeight: 1.7, margin: '0 0 36px', maxWidth: 360, marginInline: 'auto' }}>
          The page you're looking for has been moved, removed, or never existed. If you're trying to access the admin panel, make sure you have the correct URL.
        </p>

        {/* Divider */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)', marginBottom: 36 }} />

        {/* CTA */}
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '13px 28px', borderRadius: 12,
            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
            border: 'none', color: '#fff',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(124,58,237,0.35)',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          <ArrowLeft size={16} />
          Back to Website
        </button>

        {/* Fine print */}
        <p style={{ fontSize: 11, color: 'hsl(240 5% 28%)', marginTop: 20 }}>
          Error 404 — Page Not Found
        </p>
      </div>

      <style>{`
        @keyframes nfFloat {
          0%   { transform: translateY(0) scale(1); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(-100vh) scale(0.5); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
