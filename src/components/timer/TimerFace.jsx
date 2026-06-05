import React, { useMemo } from 'react'

/*
 * One shared timer "face" used by both the inline timer and immersive focus mode.
 *
 * Props:
 *   style     - 'digital' | 'flip' | 'ring' | 'analog' | 'racecar' | 'airplane' | 'rocket' | 'hiker'
 *   display   - the formatted time string, e.g. "24:31" or "+01:12"
 *   progress  - 0..1 (fraction of planned time elapsed). For flow mode pass 0.
 *   running   - bool
 *   overtime  - bool
 *   stateLabel- small caption under the time
 *   theme     - 'light' (inline) | 'dark' (focus mode)
 *   size      - px square for the visual area
 */
export const TIMER_STYLES = [
  { id: 'digital',  label: 'Digital',  icon: 'pin' },
  { id: 'flip',     label: 'Flip',     icon: 'view_agenda' },
  { id: 'ring',     label: 'Ring',     icon: 'radio_button_unchecked' },
  { id: 'analog',   label: 'Analog',   icon: 'schedule' },
  { id: 'racecar',  label: 'F1',       icon: 'sports_score' },
  { id: 'airplane', label: 'Plane',    icon: 'flight' },
  { id: 'rocket',   label: 'Rocket',   icon: 'rocket_launch' },
  { id: 'hiker',    label: 'Summit',   icon: 'landscape' },
]

export const STYLE_STORAGE_KEY = 'xf-timer-style'

export default function TimerFace({
  style = 'ring',
  display,
  progress = 0,
  running = false,
  overtime = false,
  stateLabel = '',
  theme = 'light',
  size = 230,
  fill = false,
}) {
  const dark = theme === 'dark'
  const ink = dark ? '#fff' : 'var(--ink)'
  const inkSoft = dark ? 'rgba(255,255,255,0.3)' : 'var(--ink-3)'
  const overtimeColor = dark ? '#ffb894' : 'var(--coral-deep)'

  const common = { display, progress, running, overtime, stateLabel, dark, ink, inkSoft, overtimeColor, size, fill }

  switch (style) {
    case 'digital':  return <DigitalFace {...common} />
    case 'flip':     return <FlipFace {...common} />
    case 'analog':   return <AnalogFace {...common} />
    case 'racecar':  return <JourneyFace {...common} kind="racecar" />
    case 'airplane': return <JourneyFace {...common} kind="airplane" />
    case 'rocket':   return <JourneyFace {...common} kind="rocket" />
    case 'hiker':    return <JourneyFace {...common} kind="hiker" />
    case 'ring':
    default:         return <RingFace {...common} />
  }
}

/* ----- caption ----- */
function Caption({ stateLabel, inkSoft }) {
  return (
    <span className="text-[11px] font-bold uppercase mt-1" style={{ letterSpacing: '0.28em', color: inkSoft }}>
      {stateLabel}
    </span>
  )
}

/* ====================== DIGITAL ====================== */
function DigitalFace({ display, stateLabel, ink, inkSoft, overtime, overtimeColor, running, size, fill }) {
  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <span
        className="tabular-nums"
        style={{
          fontFamily: 'Manrope, sans-serif',
          fontWeight: 800,
          fontSize: size * (fill ? 0.44 : 0.27),
          letterSpacing: '-0.04em',
          color: overtime ? overtimeColor : ink,
          textShadow: running ? `0 0 26px ${overtime ? 'rgba(255,184,148,0.5)' : 'rgba(255,126,77,0.45)'}` : 'none',
          transition: 'text-shadow 0.6s ease',
        }}
      >
        {display}
      </span>
      <Caption stateLabel={stateLabel} inkSoft={inkSoft} />
    </div>
  )
}

/* ====================== FLIP CLOCK ====================== */
function FlipFace({ display, stateLabel, ink, inkSoft, overtime, overtimeColor, dark, size, fill }) {
  // display can be "24:31" or "+01:12" — strip any leading +
  const plus = display.startsWith('+')
  const clean = plus ? display.slice(1) : display
  const chars = clean.split('') // e.g. ['2','4',':','3','1']
  const cardBg = dark ? 'linear-gradient(180deg,#23232f,#14141d)' : 'linear-gradient(180deg,#ffffff,#eef1f8)'
  const cardColor = overtime ? overtimeColor : ink
  const cardW = size * (fill ? 0.26 : 0.16)
  const cardH = size * (fill ? 0.40 : 0.24)
  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <div className="flex items-center" style={{ gap: size * 0.012 }}>
        {chars.map((ch, i) =>
          ch === ':' ? (
            <span key={i} style={{ color: cardColor, fontWeight: 800, fontSize: cardH * 0.5, padding: `0 ${size * 0.005}px` }}>:</span>
          ) : (
            <FlipCard key={i} char={ch} bg={cardBg} color={cardColor} w={cardW} h={cardH} dark={dark} />
          )
        )}
      </div>
      <div className="mt-2"><Caption stateLabel={plus ? 'overtime' : stateLabel} inkSoft={inkSoft} /></div>
    </div>
  )
}

function FlipCard({ char, bg, color, w, h, dark }) {
  return (
    <div
      key={char} /* re-mount on change so the flip animation replays */
      className="xf-flip relative flex items-center justify-center rounded-[10px] overflow-hidden"
      style={{
        width: w,
        height: h,
        background: bg,
        color,
        fontFamily: 'Manrope, sans-serif',
        fontWeight: 800,
        fontSize: h * 0.62,
        boxShadow: dark ? '0 4px 14px rgba(0,0,0,0.5)' : '0 4px 14px rgba(43,47,68,0.12)',
        border: dark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(43,47,68,0.05)',
      }}
    >
      <span className="tabular-nums">{char}</span>
      {/* center seam */}
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2" style={{ height: 1, background: dark ? 'rgba(0,0,0,0.45)' : 'rgba(43,47,68,0.10)' }} />
    </div>
  )
}

/* ====================== RING ====================== */
function RingFace({ display, stateLabel, progress, running, overtime, ink, inkSoft, overtimeColor, dark, size }) {
  const R = 45
  const CIRCUM = 2 * Math.PI * R
  const offset = CIRCUM * (1 - progress)
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {running && (
        <div
          className="absolute inset-0 rounded-full xf-halo"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${overtime ? 'rgba(255,184,148,0.4)' : 'rgba(255,126,77,0.32)'} 0%, rgba(255,126,77,0) 68%)`,
            filter: 'blur(6px)',
          }}
        />
      )}
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id="xf-face-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--coral)" />
            <stop offset="100%" stopColor="var(--peach)" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r={R} fill="none" stroke={dark ? 'rgba(255,255,255,0.06)' : 'rgba(43,47,68,0.06)'} strokeWidth="3" />
        <circle
          cx="50" cy="50" r={R} fill="none"
          stroke="url(#xf-face-grad)" strokeWidth="3.5" strokeLinecap="round"
          strokeDasharray={CIRCUM} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="tabular-nums" style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: size * 0.22, letterSpacing: '-0.04em', color: overtime ? overtimeColor : ink }}>
          {display}
        </span>
        <Caption stateLabel={stateLabel} inkSoft={inkSoft} />
      </div>
    </div>
  )
}

/* ====================== ANALOG ====================== */
function AnalogFace({ display, stateLabel, progress, overtime, ink, inkSoft, overtimeColor, dark, size }) {
  // A pie wedge that empties as time runs down (countdown). Hand sweeps clockwise.
  const remainFrac = 1 - progress // full at start
  const angle = remainFrac * 360
  const R = 44
  const handRad = (angle - 90) * (Math.PI / 180)
  const hx = 50 + R * 0.92 * Math.cos(handRad)
  const hy = 50 + R * 0.92 * Math.sin(handRad)
  // wedge path for remaining time
  const wedge = useMemo(() => {
    if (remainFrac >= 0.9999) return null
    if (remainFrac <= 0) return ''
    const a = (angle - 90) * (Math.PI / 180)
    const ex = 50 + R * Math.cos(a)
    const ey = 50 + R * Math.sin(a)
    const large = angle > 180 ? 1 : 0
    return `M 50 50 L 50 ${50 - R} A ${R} ${R} 0 ${large} 1 ${ex.toFixed(2)} ${ey.toFixed(2)} Z`
  }, [angle, remainFrac])
  const ticks = Array.from({ length: 12 }, (_, i) => i)
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        <defs>
          <linearGradient id="xf-analog-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--coral)" />
            <stop offset="100%" stopColor="var(--peach)" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r={R + 3} fill={dark ? 'rgba(255,255,255,0.03)' : 'rgba(43,47,68,0.03)'} />
        <circle cx="50" cy="50" r={R} fill="none" stroke={dark ? 'rgba(255,255,255,0.1)' : 'rgba(43,47,68,0.1)'} strokeWidth="1" />
        {wedge !== null && <path d={wedge} fill="url(#xf-analog-grad)" opacity="0.85" style={{ transition: 'all 1s linear' }} />}
        {ticks.map(i => {
          const a = (i * 30 - 90) * (Math.PI / 180)
          const inner = i % 3 === 0 ? R - 6 : R - 3
          return (
            <line
              key={i}
              x1={50 + inner * Math.cos(a)} y1={50 + inner * Math.sin(a)}
              x2={50 + R * Math.cos(a)} y2={50 + R * Math.sin(a)}
              stroke={dark ? 'rgba(255,255,255,0.25)' : 'rgba(43,47,68,0.22)'} strokeWidth={i % 3 === 0 ? 1.4 : 0.7}
            />
          )
        })}
        {/* hand */}
        <line x1="50" y1="50" x2={hx} y2={hy} stroke={overtime ? overtimeColor : (dark ? '#fff' : 'var(--ink)')} strokeWidth="2" strokeLinecap="round" style={{ transition: 'all 1s linear' }} />
        <circle cx="50" cy="50" r="2.4" fill={overtime ? overtimeColor : (dark ? '#fff' : 'var(--ink)')} />
      </svg>
      <div className="absolute left-0 right-0 flex flex-col items-center" style={{ top: '64%' }}>
        <span className="tabular-nums" style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: size * 0.13, color: overtime ? overtimeColor : ink }}>
          {display}
        </span>
        <Caption stateLabel={stateLabel} inkSoft={inkSoft} />
      </div>
    </div>
  )
}

/* ====================== JOURNEY (racecar / airplane / rocket / hiker) ====================== */
function JourneyFace({ kind, display, stateLabel, progress, running, overtime, ink, inkSoft, overtimeColor, dark, size }) {
  // progress 0..1 across the journey; clamp so the traveler sits at the finish at the end
  const p = Math.min(1, Math.max(0, progress))
  const trackStroke = dark ? 'rgba(255,255,255,0.18)' : 'rgba(43,47,68,0.18)'
  const doneStroke = 'url(#xf-journey-grad)'

  return (
    <div className="relative flex flex-col items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size * 0.82} viewBox="0 0 100 82">
        <defs>
          <linearGradient id="xf-journey-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--coral)" />
            <stop offset="100%" stopColor="var(--peach)" />
          </linearGradient>
        </defs>
        {kind === 'racecar' && <RaceCar p={p} trackStroke={trackStroke} doneStroke={doneStroke} dark={dark} overtime={overtime} />}
        {kind === 'airplane' && <Airplane p={p} trackStroke={trackStroke} doneStroke={doneStroke} dark={dark} />}
        {kind === 'rocket' && <Rocket p={p} trackStroke={trackStroke} doneStroke={doneStroke} dark={dark} />}
        {kind === 'hiker' && <Hiker p={p} trackStroke={trackStroke} doneStroke={doneStroke} dark={dark} />}
      </svg>
      <div className="flex flex-col items-center -mt-2">
        <span className="tabular-nums" style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: size * 0.17, letterSpacing: '-0.04em', color: overtime ? overtimeColor : ink }}>
          {display}
        </span>
        <Caption stateLabel={stateLabel} inkSoft={inkSoft} />
      </div>
    </div>
  )
}

/* ----- F1 car around an oval track ----- */
function RaceCar({ p, trackStroke, doneStroke, dark, overtime }) {
  // oval track centered at (50,38), rx=40, ry=26. Start/finish at top (angle -90).
  const rx = 40, ry = 26, cx = 50, cy = 38
  const ovalLen = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry))) // Ramanujan
  // position: start at top, go clockwise
  const ang = (-90 + p * 360) * (Math.PI / 180)
  const px = cx + rx * Math.cos(ang)
  const py = cy + ry * Math.sin(ang)
  // car heading (tangent)
  const tang = Math.atan2(ry * Math.cos(ang), -rx * Math.sin(ang)) * (180 / Math.PI)
  return (
    <>
      {/* track base */}
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={trackStroke} strokeWidth="6" strokeLinecap="round" />
      {/* progress overlay */}
      <ellipse
        cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={doneStroke} strokeWidth="6" strokeLinecap="round"
        strokeDasharray={ovalLen} strokeDashoffset={ovalLen * (1 - p)}
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dashoffset 1s linear' }}
      />
      {/* finish line at top */}
      <g>
        <rect x={cx - 1.4} y={cy - ry - 3} width="2.8" height="6" fill={dark ? '#fff' : '#2b2f44'} />
        <rect x={cx - 1.4} y={cy - ry - 3} width="1.4" height="1.5" fill={dark ? '#2b2f44' : '#fff'} />
        <rect x={cx} y={cy - ry - 1.5} width="1.4" height="1.5" fill={dark ? '#2b2f44' : '#fff'} />
      </g>
      {/* car */}
      <g transform={`translate(${px} ${py}) rotate(${tang})`} style={{ transition: 'transform 1s linear' }}>
        <ellipse cx="0" cy="0" rx="4.2" ry="2.2" fill={overtime ? '#ed5f2c' : '#ff7e4d'} />
        <rect x="-1.5" y="-3" width="3" height="6" rx="1" fill="#2b2f44" opacity="0.35" />
        <circle cx="-2.4" cy="-2.4" r="1.1" fill="#1a1a22" />
        <circle cx="2.4" cy="-2.4" r="1.1" fill="#1a1a22" />
        <circle cx="-2.4" cy="2.4" r="1.1" fill="#1a1a22" />
        <circle cx="2.4" cy="2.4" r="1.1" fill="#1a1a22" />
      </g>
    </>
  )
}

/* ----- Airplane: take off, cruise, land ----- */
function Airplane({ p, trackStroke, doneStroke, dark }) {
  // arc path from bottom-left runway up to cruise then down to bottom-right runway
  const path = 'M 8 70 Q 30 8 50 14 Q 70 20 92 70'
  const { x, y, angle } = pointOnQuadChain(p, [
    [8, 70, 30, 8, 50, 14],
    [50, 14, 70, 20, 92, 70],
  ])
  return (
    <>
      {/* ground */}
      <line x1="4" y1="74" x2="96" y2="74" stroke={trackStroke} strokeWidth="2" strokeLinecap="round" />
      <rect x="6" y="72" width="16" height="3" fill={trackStroke} opacity="0.6" />
      <rect x="78" y="72" width="16" height="3" fill={trackStroke} opacity="0.6" />
      {/* flight path */}
      <path d={path} fill="none" stroke={trackStroke} strokeWidth="1.4" strokeDasharray="2 3" opacity="0.6" />
      <path d={path} fill="none" stroke={doneStroke} strokeWidth="2" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - p} style={{ transition: 'stroke-dashoffset 1s linear' }} />
      {/* destination marker */}
      <circle cx="92" cy="70" r="2" fill={doneStroke} />
      {/* plane */}
      <g transform={`translate(${x} ${y}) rotate(${angle})`} style={{ transition: 'transform 1s linear' }}>
        <path d="M -5 0 L 4 0 L 6 -1.2 L 4 0 L 6 1.2 L 4 0 M -2 0 L -4 -3 M -2 0 L -4 3" fill="none" stroke={dark ? '#fff' : '#2b2f44'} strokeWidth="0.8" />
        <ellipse cx="0" cy="0" rx="5" ry="1.5" fill="#ff7e4d" />
        <path d="M 0 0 L -2 -3 L 0.5 0 Z" fill="#ed5f2c" />
        <path d="M 0 0 L -2 3 L 0.5 0 Z" fill="#ed5f2c" />
      </g>
    </>
  )
}

/* ----- Rocket: climb to the moon ----- */
function Rocket({ p, trackStroke, doneStroke, dark }) {
  // vertical-ish path from bottom center up to moon top-right
  const { x, y, angle } = pointOnQuadChain(p, [[50, 76, 40, 40, 74, 18]])
  return (
    <>
      {/* stars */}
      {[[20, 20], [30, 50], [80, 55], [16, 60], [64, 30]].map(([sx, sy], i) => (
        <circle key={i} cx={sx} cy={sy} r="0.7" fill={dark ? 'rgba(255,255,255,0.5)' : 'rgba(43,47,68,0.25)'} />
      ))}
      {/* path */}
      <path d="M 50 76 Q 40 40 74 18" fill="none" stroke={trackStroke} strokeWidth="1.4" strokeDasharray="2 3" opacity="0.6" />
      <path d="M 50 76 Q 40 40 74 18" fill="none" stroke={doneStroke} strokeWidth="2" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - p} style={{ transition: 'stroke-dashoffset 1s linear' }} />
      {/* moon */}
      <circle cx="74" cy="16" r="6" fill={dark ? 'rgba(255,255,255,0.85)' : 'rgba(255,184,148,0.9)'} />
      <circle cx="72" cy="14" r="1.4" fill={dark ? 'rgba(43,47,68,0.15)' : 'rgba(237,95,44,0.25)'} />
      <circle cx="76" cy="18" r="1" fill={dark ? 'rgba(43,47,68,0.12)' : 'rgba(237,95,44,0.2)'} />
      {/* rocket */}
      <g transform={`translate(${x} ${y}) rotate(${angle + 90})`} style={{ transition: 'transform 1s linear' }}>
        <path d="M 0 -5 Q 2.4 -1 2.4 2 L -2.4 2 Q -2.4 -1 0 -5 Z" fill="#ff7e4d" />
        <circle cx="0" cy="-1.2" r="1" fill={dark ? '#14141f' : '#fff'} />
        <path d="M -2.4 2 L -4 4 L -2 3 Z" fill="#ed5f2c" />
        <path d="M 2.4 2 L 4 4 L 2 3 Z" fill="#ed5f2c" />
        <path d="M -1.4 3 Q 0 7 1.4 3 Z" fill="#ffb894" opacity="0.9" />
      </g>
    </>
  )
}

/* ----- Hiker to summit ----- */
function Hiker({ p, trackStroke, doneStroke, dark }) {
  const path = 'M 8 72 L 34 50 L 50 58 L 78 18'
  const { x, y, angle } = pointOnPolyline(p, [[8, 72], [34, 50], [50, 58], [78, 18]])
  return (
    <>
      {/* mountain silhouette */}
      <path d="M 4 78 L 30 40 L 46 56 L 74 10 L 96 78 Z" fill={dark ? 'rgba(255,255,255,0.05)' : 'rgba(43,47,68,0.05)'} />
      {/* trail */}
      <path d={path} fill="none" stroke={trackStroke} strokeWidth="1.6" strokeDasharray="2 3" />
      <path d={path} fill="none" stroke={doneStroke} strokeWidth="2.2" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - p} style={{ transition: 'stroke-dashoffset 1s linear' }} strokeLinecap="round" />
      {/* summit flag */}
      <line x1="78" y1="18" x2="78" y2="9" stroke={dark ? '#fff' : '#2b2f44'} strokeWidth="1" />
      <path d="M 78 9 L 84 11 L 78 13 Z" fill="#ff7e4d" />
      {/* hiker dot */}
      <g transform={`translate(${x} ${y})`} style={{ transition: 'transform 1s linear' }}>
        <circle cx="0" cy="-3" r="1.5" fill={dark ? '#fff' : '#2b2f44'} />
        <rect x="-1.3" y="-1.5" width="2.6" height="4" rx="1.2" fill="#ff7e4d" />
      </g>
    </>
  )
}

/* ---- geometry helpers ---- */
function quadPoint(t, p0, p1, p2) {
  const mt = 1 - t
  const x = mt * mt * p0[0] + 2 * mt * t * p1[0] + t * t * p2[0]
  const y = mt * mt * p0[1] + 2 * mt * t * p1[1] + t * t * p2[1]
  const dx = 2 * mt * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0])
  const dy = 2 * mt * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1])
  return { x, y, angle: Math.atan2(dy, dx) * (180 / Math.PI) }
}
function pointOnQuadChain(p, segs) {
  const seg = Math.min(segs.length - 1, Math.floor(p * segs.length))
  const localT = p * segs.length - seg
  const s = segs[seg]
  return quadPoint(localT, [s[0], s[1]], [s[2], s[3]], [s[4], s[5]])
}
function pointOnPolyline(p, pts) {
  // total length
  const segLens = []
  let total = 0
  for (let i = 0; i < pts.length - 1; i++) {
    const d = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1])
    segLens.push(d); total += d
  }
  let dist = p * total
  for (let i = 0; i < segLens.length; i++) {
    if (dist <= segLens[i] || i === segLens.length - 1) {
      const t = segLens[i] === 0 ? 0 : dist / segLens[i]
      const x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t
      const y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t
      return { x, y, angle: 0 }
    }
    dist -= segLens[i]
  }
  return { x: pts[pts.length - 1][0], y: pts[pts.length - 1][1], angle: 0 }
}
