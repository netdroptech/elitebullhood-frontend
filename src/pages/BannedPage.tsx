import { usePlatformName } from '@/context/PlatformNameContext'
import { ShieldX, Mail, AlertTriangle } from 'lucide-react'
import { PageBackground } from '@/components/ui/PageBackground'

export function BannedPage() {
  const { platformName, platformEmail } = usePlatformName()
  return (
    <div
      style={{
        minHeight:       '100vh',
        background:      'hsl(260 87% 2%)',
        display:         'flex',
        flexDirection:   'column',
        alignItems:      'center',
        justifyContent:  'center',
        padding:         '2rem',
        fontFamily:      "'Geist Sans', 'Inter', system-ui, sans-serif",
        position:        'relative',
        overflow:        'hidden',
      }}
    >
      <PageBackground />
      {/* Ambient glow */}
      <div
        style={{
          position:     'absolute',
          top:          '50%',
          left:         '50%',
          transform:    'translate(-50%, -60%)',
          width:        '600px',
          height:       '600px',
          borderRadius: '50%',
          background:   'radial-gradient(circle, rgba(220,38,38,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Card */}
      <div
        style={{
          position:     'relative',
          maxWidth:     '520px',
          width:        '100%',
          background:   'rgba(220,38,38,0.04)',
          border:       '1px solid rgba(220,38,38,0.25)',
          borderRadius: '1.5rem',
          padding:      '3rem 2.5rem',
          textAlign:    'center',
          boxShadow:    '0 0 80px rgba(220,38,38,0.08), inset 0 1px 1px rgba(255,255,255,0.05)',
        }}
      >
        {/* Icon */}
        <div
          style={{
            display:        'inline-flex',
            alignItems:     'center',
            justifyContent: 'center',
            width:          '80px',
            height:         '80px',
            borderRadius:   '50%',
            background:     'rgba(220,38,38,0.12)',
            border:         '2px solid rgba(220,38,38,0.3)',
            marginBottom:   '1.5rem',
          }}
        >
          <ShieldX size={40} color="#ef4444" strokeWidth={1.5} />
        </div>

        {/* Status badge */}
        <div
          style={{
            display:        'inline-flex',
            alignItems:     'center',
            gap:            '0.4rem',
            background:     'rgba(220,38,38,0.1)',
            border:         '1px solid rgba(220,38,38,0.3)',
            borderRadius:   '9999px',
            padding:        '0.3rem 0.85rem',
            marginBottom:   '1.25rem',
            fontSize:       '0.7rem',
            fontWeight:     600,
            letterSpacing:  '0.08em',
            color:          '#ef4444',
            textTransform:  'uppercase',
          }}
        >
          <div
            style={{
              width:        '6px',
              height:       '6px',
              borderRadius: '50%',
              background:   '#ef4444',
              flexShrink:   0,
            }}
          />
          Account Banned
        </div>

        {/* Heading */}
        <h1
          style={{
            fontSize:     'clamp(1.6rem, 5vw, 2.2rem)',
            fontWeight:   700,
            color:        '#fca5a5',
            lineHeight:   1.15,
            marginBottom: '1rem',
            letterSpacing: '-0.02em',
          }}
        >
          Access Permanently<br />Revoked
        </h1>

        {/* Description */}
        <p
          style={{
            color:        'rgba(255,255,255,0.45)',
            fontSize:     '0.95rem',
            lineHeight:   1.65,
            marginBottom: '0.75rem',
          }}
        >
          Your account has been permanently banned from this platform.
          This action was taken due to a violation of our Terms of Service.
        </p>
        <p
          style={{
            color:        'rgba(255,255,255,0.3)',
            fontSize:     '0.85rem',
            lineHeight:   1.65,
            marginBottom: '2rem',
          }}
        >
          Your IP address has been flagged and further access attempts
          will be logged and monitored.
        </p>

        {/* Divider */}
        <div
          style={{
            width:        '100%',
            height:       '1px',
            background:   'rgba(220,38,38,0.15)',
            marginBottom: '1.75rem',
          }}
        />

        {/* Warning note */}
        <div
          style={{
            display:      'flex',
            alignItems:   'flex-start',
            gap:          '0.65rem',
            background:   'rgba(255,255,255,0.02)',
            border:       '1px solid rgba(255,255,255,0.06)',
            borderRadius: '0.75rem',
            padding:      '0.85rem 1rem',
            marginBottom: '1.75rem',
            textAlign:    'left',
          }}
        >
          <AlertTriangle size={16} color="rgba(252,165,165,0.6)" style={{ marginTop: '2px', flexShrink: 0 }} />
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', lineHeight: 1.6, margin: 0 }}>
            If you believe this ban was applied in error, you may contact our support team.
            Please include your registered email address in your message.
          </p>
        </div>

        {/* Contact button */}
        <a
          href={`mailto:${platformEmail}`}
          style={{
            display:        'inline-flex',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            '0.5rem',
            width:          '100%',
            padding:        '0.85rem 1.5rem',
            background:     'rgba(220,38,38,0.1)',
            border:         '1px solid rgba(220,38,38,0.25)',
            borderRadius:   '9999px',
            color:          '#fca5a5',
            fontSize:       '0.9rem',
            fontWeight:     500,
            textDecoration: 'none',
            cursor:         'pointer',
            transition:     'all 0.2s ease',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLAnchorElement
            el.style.background = 'rgba(220,38,38,0.18)'
            el.style.borderColor = 'rgba(220,38,38,0.4)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLAnchorElement
            el.style.background = 'rgba(220,38,38,0.1)'
            el.style.borderColor = 'rgba(220,38,38,0.25)'
          }}
        >
          <Mail size={16} />
          Contact Support
        </a>

        {/* Footer note */}
        <p
          style={{
            marginTop:  '1.5rem',
            color:      'rgba(255,255,255,0.18)',
            fontSize:   '0.75rem',
            lineHeight: 1.5,
          }}
        >
          © 2026 {platformName} Inc. · All access to this platform has been revoked.
        </p>
      </div>
    </div>
  )
}
