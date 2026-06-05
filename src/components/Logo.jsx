import React from 'react'

// xFocus mark: a focus-timer ring (near-complete) with a center dot, echoing
// the timer dial. `variant`:
//   'tile'  — coral-tinted ring on a white rounded tile (sidebar/login icon)
//   'solid' — white ring on a coral tile (PWA-style, high contrast)
export default function Logo({ size = 40, variant = 'tile', radius = 0.32 }) {
  const r = size * radius
  const cx = size / 2
  const cy = size / 2
  const stroke = Math.max(2.5, size * 0.085)
  const circ = 2 * Math.PI * r
  const gap = circ * 0.24 // open arc at the bottom, like a near-full timer

  const tile = variant === 'solid'
  const tileRadius = size * 0.3

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label="xFocus">
      <defs>
        <linearGradient id="xf-logo-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={tile ? '#ffffff' : '#ff7e4d'} />
          <stop offset="100%" stopColor={tile ? '#ffe7da' : '#ed5f2c'} />
        </linearGradient>
      </defs>

      {/* Tile background */}
      <rect
        x="0" y="0" width={size} height={size} rx={tileRadius}
        fill={tile ? '#ff7e4d' : '#ffffff'}
      />
      {!tile && (
        <rect x="0.75" y="0.75" width={size - 1.5} height={size - 1.5} rx={tileRadius - 1}
          fill="none" stroke="#ffe1d2" strokeWidth="1.5" />
      )}

      {/* Track (faint) */}
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke={tile ? 'rgba(255,255,255,0.25)' : 'rgba(43,47,68,0.06)'} strokeWidth={stroke} />

      {/* Focus ring arc */}
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke="url(#xf-logo-grad)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${circ - gap} ${gap}`}
        transform={`rotate(-90 ${cx} ${cy})`}
      />

      {/* Center dot */}
      <circle cx={cx} cy={cy} r={size * 0.09} fill={tile ? '#ffffff' : '#ed5f2c'} />
    </svg>
  )
}
