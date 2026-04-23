import { useState, useEffect } from 'react'

/**
 * Drop this component as the *first child* of any page's root div.
 * All layers use position:fixed so they tile the full viewport as the
 * user scrolls, and pointer-events:none so they never block clicks.
 */
export function PageBackground() {
  const [particles, setParticles] = useState<
    { x: number; y: number; size: number; speed: number; opacity: number }[]
  >([])

  useEffect(() => {
    setParticles(
      Array.from({ length: 28 }, () => ({
        x:       Math.random() * 100,
        y:       Math.random() * 100,
        size:    Math.random() * 2.5 + 0.5,
        speed:   Math.random() * 40 + 20,
        opacity: Math.random() * 0.25 + 0.05,
      }))
    )
  }, [])

  return (
    <>
      {/* Floating particles */}
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'fixed',
            left: `${p.x}%`,
            top:  `${p.y}%`,
            width:  p.size,
            height: p.size,
            borderRadius: '50%',
            background: i % 3 === 0 ? '#7c3aed' : i % 3 === 1 ? '#6d28d9' : '#a78bfa',
            opacity: p.opacity,
            animation: `pgBgFloat ${p.speed}s linear infinite`,
            animationDelay: `${-(Math.random() * p.speed).toFixed(2)}s`,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      ))}

      {/* Glow blobs */}
      <div style={{ position: 'fixed', top: '-20%', left: '-10%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-20%', right: '-10%', width: '45vw', height: '45vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.10) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Grid texture */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none', zIndex: 0 }} />

      <style>{`
        @keyframes pgBgFloat {
          0%   { transform: translateY(0)      scale(1);   opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(-100vh) scale(0.5); opacity: 0; }
        }
      `}</style>
    </>
  )
}
