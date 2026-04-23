interface VertexLogoProps {
  /** icon-only: just the reticle mark, no wordmark */
  iconOnly?: boolean
  /** height of the full lockup in px */
  height?: number
  className?: string
}

/**
 * Recreates the VERTEX brand lockup:
 *   – Green corner-bracket targeting frame
 *   – Two downward arrow markers
 *   – VERTEX wordmark in spaced caps
 */
export function VertexLogo({ iconOnly = false, height = 36, className = '' }: VertexLogoProps) {
  const iconH = iconOnly ? height : height * 0.62
  const iconW = iconH * (40 / 30)   // aspect ratio of icon

  return (
    <div className={`flex items-center gap-2.5 ${className}`} style={{ height }}>
      {/* ── Icon ── */}
      <svg
        width={iconW}
        height={iconH}
        viewBox="0 0 40 30"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        {/* Top-left corner bracket */}
        <path
          d="M1 13 L1 1 L13 1"
          stroke="url(#logo-grad)"
          strokeWidth="2.2"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
        {/* Top-right corner bracket */}
        <path
          d="M27 1 L39 1 L39 13"
          stroke="url(#logo-grad)"
          strokeWidth="2.2"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
        {/* Downward arrow */}
        <path
          d="M13 18 L20 27 L27 18"
          stroke="url(#logo-grad)"
          strokeWidth="2.2"
          strokeLinecap="square"
          strokeLinejoin="miter"
          fill="none"
        />
      </svg>

      {/* ── Wordmark ── */}
      {!iconOnly && (
        <span
          style={{
            fontSize: height * 0.44,
            letterSpacing: '0.22em',
            fontWeight: 500,
            color: 'hsl(var(--foreground))',
            lineHeight: 1,
            fontFamily: 'inherit',
          }}
        >
          VERTEX
        </span>
      )}
    </div>
  )
}
