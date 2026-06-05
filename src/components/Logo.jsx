import React from 'react'

// xFocus mark: a broken focus-ring (open at the lower-left) with a center dot,
// echoing the timer dial. Drawn as an explicit arc path so it renders identically
// everywhere (browsers AND the rasterizer used for the PWA icons).
//   'tile'  — coral ring on a white rounded tile (PWA icon / favicon look)
//   'solid' — white ring on a coral tile (in-app sidebar/login)
export default function Logo({ size = 40, variant = 'tile' }) {
  const cx = size / 2
  const cy = size / 2
  const r = size * 0.29
  const stroke = size * 0.08
  const tileRadius = size * 0.3
  const solid = variant === 'solid'

  // Arc open at lower-left: gap centered at 225°, ~85° wide.
  const gapCenter = 225, gapDeg = 85
  const start = gapCenter + gapDeg / 2
  const end = gapCenter - gapDeg / 2 + 360
  const pt = (a) => {
    const rad = (a * Math.PI) / 180
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]
  }
  const [x1, y1] = pt(start)
  const [x2, y2] = pt(end)
  const arc = `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 1 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`

  const ringColor = solid ? '#ffffff' : 'url(#xf-logo-grad)'
  const dotColor = solid ? '#ffffff' : '#ed5f2c'

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label="xFocus">
      <defs>
        <linearGradient id="xf-logo-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff7e4d" />
          <stop offset="100%" stopColor="#ed5f2c" />
        </linearGradient>
      </defs>

      {/* Tile */}
      <rect x="0" y="0" width={size} height={size} rx={tileRadius} fill={solid ? '#ff7e4d' : '#ffffff'} />
      {!solid && (
        <rect x="0.75" y="0.75" width={size - 1.5} height={size - 1.5} rx={tileRadius - 1}
          fill="none" stroke="#ffe1d2" strokeWidth="1.5" />
      )}

      {/* Broken focus ring */}
      <path d={arc} fill="none" stroke={ringColor} strokeWidth={stroke} strokeLinecap="round" />

      {/* Center dot */}
      <circle cx={cx} cy={cy} r={size * 0.085} fill={dotColor} />
    </svg>
  )
}
