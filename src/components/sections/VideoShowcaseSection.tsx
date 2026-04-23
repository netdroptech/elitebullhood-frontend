import { useState, useRef } from 'react'
import { ChevronRight, Volume2, VolumeX } from 'lucide-react'

export function VideoShowcaseSection() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isMuted, setIsMuted] = useState(true)

  const toggleSound = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
      setIsMuted(videoRef.current.muted)
    }
  }

  return (
    <section className="relative py-24 md:py-32 px-4 overflow-hidden">
      {/* ── Content ── */}
      <div className="relative z-10 max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 liquid-glass rounded-full px-4 py-1.5 mb-6">
            <span style={{ fontSize: 13, color: 'hsl(40 6% 82%)' }}>Platform Preview</span>
            <span
              className="rounded-full px-2 py-0.5 text-xs font-medium"
              style={{
                background: 'hsl(262 95% 76%)',
                color: 'hsl(0 0% 5%)',
                fontSize: 11,
              }}
            >
              Live
            </span>
            <ChevronRight size={13} style={{ color: 'hsl(240 5% 55%)' }} />
          </div>

          <h2
            style={{
              color: 'hsl(40 10% 96%)',
              fontSize: 'clamp(1.75rem, 5vw, 3rem)',
              fontWeight: 600,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              marginBottom: 14,
            }}
          >
            See the Platform
            <br />
            in Action
          </h2>
          <p
            style={{
              color: 'hsl(40 6% 82%)',
              fontSize: 16,
              maxWidth: 480,
              margin: '0 auto',
              opacity: 0.8,
              lineHeight: 1.6,
            }}
          >
            Watch how traders use Elitebullhood to execute strategies, monitor markets, and grow their portfolios.
          </p>
        </div>

        {/* Video Container */}
        <div
          className="liquid-glass mx-auto"
          style={{
            maxWidth: 900,
            borderRadius: '1.5rem',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
            }}
          >
            <source src="/videos/showcase.mp4" type="video/mp4" />
          </video>

          {/* Sound toggle button */}
          <button
            onClick={toggleSound}
            style={{
              position: 'absolute',
              bottom: 16,
              right: 16,
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: isMuted ? 'rgba(255,255,255,0.6)' : '#a78bfa',
              transition: 'all 0.2s',
            }}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>
      </div>
    </section>
  )
}
