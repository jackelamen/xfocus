import React, { useMemo, useRef, useState, useEffect, useId } from 'react'

/*
 * One shared timer "face" used by both the inline timer and immersive focus mode.
 *
 * Every face renders the same three things — a time readout, a caption, and a
 * sense of how much of the session is gone — but each one has its own
 * character and its own accent pair, so switching styles actually changes the
 * mood of the session rather than just the shape of the progress indicator.
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
 *   fill      - enlarge the glyphs (immersive zen mode)
 */

/*
 * Each face commits to one accent pair instead of every face sharing the same
 * coral. Coral stays the app's voice (ring, digital, flip — the "instrument"
 * faces); the journey faces borrow the palette their scene actually implies.
 */
const ACCENTS = {
  digital:  { from: '#ff7e4d', to: '#ffb894' },
  flip:     { from: '#ff7e4d', to: '#ffb894' },
  ring:     { from: '#ff7e4d', to: '#ffb894' },
  analog:   { from: '#ff7e4d', to: '#ffb894' },
  racecar:  { from: '#ed5f2c', to: '#ffc861' },   // kerb red into flag gold
  airplane: { from: '#5aa8e6', to: '#ffb894' },   // sky into dawn
  rocket:   { from: '#9b8fe0', to: '#ff7e4d' },   // violet exhaust into flame
  hiker:    { from: '#5aa8e6', to: '#8fd6a8' },   // alpine blue into pine
}

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
  const inkSoft = dark ? 'rgba(255,255,255,0.34)' : 'var(--ink-3)'
  const overtimeColor = dark ? '#ffb894' : 'var(--coral-deep)'
  const uid = useId().replace(/:/g, '')
  const accent = ACCENTS[style] || ACCENTS.ring

  const common = {
    display, progress: clamp01(progress), running, overtime, stateLabel,
    dark, ink, inkSoft, overtimeColor, size, fill, uid, accent,
  }

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

function clamp01(n) { return Math.min(1, Math.max(0, Number(n) || 0)) }

/* ----- shared caption ----- */
function Caption({ stateLabel, inkSoft, size = 230 }) {
  if (!stateLabel) return null
  return (
    <span
      className="font-bold uppercase"
      style={{
        fontSize: Math.max(9, Math.min(12, size * 0.048)),
        letterSpacing: '0.3em',
        // The tracking pushes the word right; pull it back so it stays centred.
        textIndent: '0.3em',
        color: inkSoft,
        marginTop: size * 0.028,
      }}
    >
      {stateLabel}
    </span>
  )
}

/* Linear accent gradient, declared once per face. */
function AccentGrad({ id, accent, horizontal = false }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2={horizontal ? '1' : '1'} y2={horizontal ? '0' : '1'}>
      <stop offset="0%" stopColor={accent.from} />
      <stop offset="100%" stopColor={accent.to} />
    </linearGradient>
  )
}

/* ====================== DIGITAL — instrument readout ======================
   Character: quiet precision. The unlit "ghost" glyphs behind the live time
   are what an LCD actually looks like, and they stop the number from floating
   in space. A hairline rule under the readout fills as the session burns down,
   so progress is legible without a second widget. */
function DigitalFace({ display, stateLabel, ink, inkSoft, overtime, overtimeColor, running, progress, size, fill, accent, dark }) {
  const fontSize = size * (fill ? 0.42 : 0.25)
  const color = overtime ? overtimeColor : ink
  const ghost = display.replace(/\d/g, '8')
  const ruleW = size * (fill ? 0.86 : 0.62)

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      {/* ambient light pooled under the digits while the clock runs */}
      {running && (
        <div
          className="absolute xf-glow pointer-events-none"
          style={{
            width: ruleW * 1.3, height: size * 0.3,
            background: `radial-gradient(ellipse at 50% 50%, ${overtime ? 'rgba(255,184,148,0.34)' : hexA(accent.from, 0.26)} 0%, rgba(0,0,0,0) 72%)`,
            filter: 'blur(14px)',
          }}
        />
      )}

      <div className="relative flex items-center justify-center">
        {/* unlit segments */}
        <span
          aria-hidden
          className="tabular-nums absolute inset-0 flex items-center justify-center select-none"
          style={{ ...digitType(fontSize), color: dark ? 'rgba(255,255,255,0.07)' : 'rgba(43,47,68,0.07)' }}
        >
          {ghost}
        </span>
        <span className="tabular-nums relative" style={{ ...digitType(fontSize), color }}>
          {display}
        </span>
      </div>

      {/* progress rule */}
      <div
        className="relative overflow-hidden"
        style={{ width: ruleW, height: 2, marginTop: size * 0.045, background: dark ? 'rgba(255,255,255,0.09)' : 'rgba(43,47,68,0.09)', borderRadius: 2 }}
      >
        <div
          style={{
            width: `${(overtime ? 1 : progress) * 100}%`, height: '100%', borderRadius: 2,
            background: `linear-gradient(90deg, ${accent.from}, ${accent.to})`,
            transition: 'width 1s linear',
          }}
        />
      </div>

      <Caption stateLabel={stateLabel} inkSoft={inkSoft} size={size} />
    </div>
  )
}

function digitType(fontSize) {
  return {
    fontFamily: 'Manrope, sans-serif',
    fontWeight: 800,
    fontSize,
    lineHeight: 1,
    letterSpacing: '-0.045em',
    fontVariantNumeric: 'tabular-nums',
  }
}

/* ====================== FLIP — split-flap board ======================
   Character: mechanical patience. A real split-flap has a hinge, two leaves
   and side pins; the old leaf falls before the new one swings up. Only the
   digit that actually changed animates, which is what makes it read as a
   machine rather than a screen effect. */
function FlipFace({ display, stateLabel, ink, inkSoft, overtime, overtimeColor, dark, size, fill }) {
  const plus = display.startsWith('+')
  const clean = plus ? display.slice(1) : display
  const chars = clean.split('')
  const cardW = size * (fill ? 0.24 : 0.152)
  const cardH = size * (fill ? 0.40 : 0.27)
  const color = overtime ? overtimeColor : ink

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <div className="flex items-center" style={{ gap: size * 0.016 }}>
        {chars.map((ch, i) =>
          ch === ':' ? (
            <Colon key={i} color={color} h={cardH} />
          ) : (
            <FlipCard key={i} char={ch} color={color} w={cardW} h={cardH} dark={dark} />
          )
        )}
      </div>
      <Caption stateLabel={plus ? 'overtime' : stateLabel} inkSoft={inkSoft} size={size} />
    </div>
  )
}

function Colon({ color, h }) {
  const dot = Math.max(2.5, h * 0.075)
  return (
    <div className="flex flex-col justify-center" style={{ height: h, gap: h * 0.16, padding: `0 ${dot * 0.5}px` }}>
      <span style={{ width: dot, height: dot, borderRadius: '50%', background: color, opacity: 0.85 }} />
      <span style={{ width: dot, height: dot, borderRadius: '50%', background: color, opacity: 0.85 }} />
    </div>
  )
}

/* Half of a flap. The glyph is drawn at full card height inside a clipped box,
   so the top and bottom halves line up into one continuous digit. */
function FlipLeaf({ which, value, h, type, leafTop, leafBottom, cls = '', z }) {
  const top = which === 'top'
  const r = h * 0.11
  return (
    <div
      className={`${cls} absolute left-0 right-0 overflow-hidden flex justify-center`}
      style={{
        height: h / 2,
        [top ? 'top' : 'bottom']: 0,
        zIndex: z,
        background: top ? leafTop : leafBottom,
        borderRadius: top ? `${r}px ${r}px 0 0` : `0 0 ${r}px ${r}px`,
      }}
    >
      <span
        className="tabular-nums select-none"
        style={{ ...type, height: h, lineHeight: `${h}px`, marginTop: top ? 0 : -h / 2 }}
      >
        {value}
      </span>
    </div>
  )
}

function FlipCard({ char, color, w, h, dark }) {
  const prevRef = useRef(char)
  const [anim, setAnim] = useState(null)   // { from, to, key }

  useEffect(() => {
    const prev = prevRef.current
    if (prev !== char) {
      setAnim({ from: prev, to: char, key: Date.now() })
      prevRef.current = char
      const t = setTimeout(() => setAnim(null), 380)
      return () => clearTimeout(t)
    }
  }, [char])

  // Warm paper leaves in light, graphite in dark — both with a top-lit face.
  const leafTop = dark
    ? 'linear-gradient(180deg,#33333f,#20202b)'
    : 'linear-gradient(180deg,#ffffff,#eef1f8)'
  const leafBottom = dark
    ? 'linear-gradient(180deg,#15151d,#0d0d14)'
    : 'linear-gradient(180deg,#e4e8f2,#d7dce9)'
  const seam = dark ? 'rgba(0,0,0,0.6)' : 'rgba(43,47,68,0.13)'
  const fontSize = h * 0.66
  const type = { ...digitType(fontSize), color }

  const leaf = { h, type, leafTop, leafBottom }

  return (
    <div
      className="relative"
      style={{
        width: w, height: h, perspective: h * 3,
        filter: dark ? 'drop-shadow(0 6px 12px rgba(0,0,0,0.55))' : 'drop-shadow(0 5px 12px rgba(43,47,68,0.14))',
      }}
    >
      {/* resting leaves: top already shows the new value, bottom still the old */}
      <FlipLeaf {...leaf} which="top" value={char} />
      <FlipLeaf {...leaf} which="bottom" value={anim ? anim.from : char} />

      {/* the two moving leaves: old top falls away, new bottom swings up */}
      {anim && (
        <React.Fragment key={anim.key}>
          <FlipLeaf {...leaf} which="top" value={anim.from} cls="xf-flap-front" z={4} />
          <FlipLeaf {...leaf} which="bottom" value={anim.to} cls="xf-flap-back" z={4} />
        </React.Fragment>
      )}

      {/* hinge seam + side pins */}
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 pointer-events-none" style={{ height: 1, background: seam, zIndex: 6 }} />
      <div className="absolute -translate-y-1/2 pointer-events-none" style={{ top: '50%', left: -1, width: 2, height: h * 0.16, borderRadius: 2, background: dark ? 'rgba(255,255,255,0.16)' : 'rgba(43,47,68,0.18)', zIndex: 6 }} />
      <div className="absolute -translate-y-1/2 pointer-events-none" style={{ top: '50%', right: -1, width: 2, height: h * 0.16, borderRadius: 2, background: dark ? 'rgba(255,255,255,0.16)' : 'rgba(43,47,68,0.18)', zIndex: 6 }} />
    </div>
  )
}

/* ====================== RING — the breath ======================
   Character: calm. A minute-tick track gives the arc something to measure
   against, and the leading cap carries a small glowing head so the eye can
   find "now" instantly. */
function RingFace({ display, stateLabel, progress, running, overtime, ink, inkSoft, overtimeColor, dark, size, uid, accent }) {
  const R = 44
  const CIRCUM = 2 * Math.PI * R
  const offset = CIRCUM * (1 - progress)
  const headAngle = (progress * 360 - 90) * (Math.PI / 180)
  const hx = 50 + R * Math.cos(headAngle)
  const hy = 50 + R * Math.sin(headAngle)
  const gradId = `xf-ring-${uid}`

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* The halo should read as light coming off the ring, not as a cloud
          behind the number — so it's ring-shaped and kept faint. */}
      {running && (
        <div
          className="absolute inset-0 rounded-full xf-halo pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 50%, rgba(255,126,77,0) 52%, ${overtime ? 'rgba(255,184,148,0.30)' : hexA(accent.from, 0.22)} 76%, rgba(255,126,77,0) 92%)`,
            filter: 'blur(5px)',
          }}
        />
      )}
      <svg width={size} height={size} viewBox="0 0 100 100">
        <defs><AccentGrad id={gradId} accent={accent} /></defs>

        {/* minute ticks — quiet, but they turn the ring into a scale */}
        <g transform="translate(50 50)">
          {Array.from({ length: 60 }, (_, i) => {
            const major = i % 5 === 0
            const a = (i * 6 - 90) * (Math.PI / 180)
            const r1 = R - (major ? 5.5 : 3.2)
            return (
              <line
                key={i}
                x1={r1 * Math.cos(a)} y1={r1 * Math.sin(a)}
                x2={(R - 1.5) * Math.cos(a)} y2={(R - 1.5) * Math.sin(a)}
                stroke={dark ? '#fff' : '#2b2f44'}
                strokeWidth={major ? 0.9 : 0.4}
                opacity={major ? (dark ? 0.28 : 0.2) : (dark ? 0.12 : 0.09)}
                strokeLinecap="round"
              />
            )
          })}
        </g>

        {/* Rotated with the SVG transform attribute, not a CSS transform — the
            arc has to start at twelve o'clock in every renderer. */}
        <g transform="rotate(-90 50 50)">
          <circle cx="50" cy="50" r={R} fill="none" stroke={dark ? 'rgba(255,255,255,0.07)' : 'rgba(43,47,68,0.07)'} strokeWidth="3.5" />
          {/* A round cap on a zero-length arc leaves a stray dot, so the
              progress stroke only exists once there's progress to show. */}
          {progress > 0.004 && (
            <circle
              cx="50" cy="50" r={R} fill="none"
              stroke={`url(#${gradId})`} strokeWidth="3.5" strokeLinecap="round"
              strokeDasharray={CIRCUM} strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          )}
        </g>

        {/* leading head */}
        {progress > 0.004 && progress < 0.999 && (
          <g style={{ transition: 'all 1s linear' }}>
            <circle cx={hx} cy={hy} r="4.6" fill={accent.to} opacity="0.22" />
            <circle cx={hx} cy={hy} r="2.3" fill={dark ? '#fff' : '#fff'} stroke={accent.from} strokeWidth="1.4" />
          </g>
        )}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="tabular-nums" style={{ ...digitType(size * 0.205), color: overtime ? overtimeColor : ink }}>
          {display}
        </span>
        <Caption stateLabel={stateLabel} inkSoft={inkSoft} size={size} />
      </div>
    </div>
  )
}

/* ====================== ANALOG — the dial ======================
   Character: a real instrument. Numerals at the quarters, a tapered hand with
   a counterweight, and a hairline sweep hand for life. The readout sits under
   the dial instead of on top of it, which is what was making it feel cramped. */
function AnalogFace({ display, stateLabel, progress, running, overtime, ink, inkSoft, overtimeColor, dark, size, uid, accent }) {
  const dialSize = size * 0.76
  const remain = 1 - progress
  const angle = remain * 360
  const R = 42
  const gradId = `xf-analog-${uid}`

  // Seconds parsed off the display drive the sweep hand.
  const secs = useMemo(() => {
    const m = /(\d{1,2}):(\d{2})\s*$/.exec(display || '')
    return m ? Number(m[2]) : 0
  }, [display])
  const sweepA = (secs * 6 - 90) * (Math.PI / 180)

  const handRad = (angle - 90) * (Math.PI / 180)
  const hx = 50 + R * 0.86 * Math.cos(handRad)
  const hy = 50 + R * 0.86 * Math.sin(handRad)

  const wedge = useMemo(() => {
    if (remain >= 0.9999) return null
    if (remain <= 0) return ''
    const a = (angle - 90) * (Math.PI / 180)
    const ex = 50 + R * Math.cos(a)
    const ey = 50 + R * Math.sin(a)
    return `M 50 50 L 50 ${50 - R} A ${R} ${R} 0 ${angle > 180 ? 1 : 0} 1 ${ex.toFixed(2)} ${ey.toFixed(2)} Z`
  }, [angle, remain])

  const handColor = overtime ? overtimeColor : (dark ? '#fff' : 'var(--ink)')

  return (
    <div className="flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={dialSize} height={dialSize} viewBox="0 0 100 100">
        <defs><AccentGrad id={gradId} accent={accent} /></defs>

        {/* case + dial */}
        <circle cx="50" cy="50" r={R + 6} fill={dark ? 'rgba(255,255,255,0.045)' : '#fff'}
          stroke={dark ? 'rgba(255,255,255,0.10)' : 'rgba(43,47,68,0.08)'} strokeWidth="1" />
        <circle cx="50" cy="50" r={R + 1.5} fill="none" stroke={dark ? 'rgba(255,255,255,0.08)' : 'rgba(43,47,68,0.07)'} strokeWidth="0.6" />

        {wedge !== null && (
          <path d={wedge} fill={`url(#${gradId})`} opacity={dark ? 0.7 : 0.8} style={{ transition: 'all 1s linear' }} />
        )}

        {/* ticks: every minute, longer at the quarters */}
        {Array.from({ length: 60 }, (_, i) => {
          const a = (i * 6 - 90) * (Math.PI / 180)
          const major = i % 15 === 0
          const mid = i % 5 === 0
          const inner = R - (major ? 7 : mid ? 4.5 : 2.4)
          return (
            <line
              key={i}
              x1={50 + inner * Math.cos(a)} y1={50 + inner * Math.sin(a)}
              x2={50 + R * Math.cos(a)} y2={50 + R * Math.sin(a)}
              stroke={dark ? '#fff' : '#2b2f44'}
              strokeWidth={major ? 1.6 : mid ? 0.9 : 0.45}
              opacity={major ? 0.55 : mid ? 0.32 : 0.16}
              strokeLinecap="round"
            />
          )
        })}

        {/* quarter numerals — set inside the tick ring so nothing collides
            with the ticks or gets clipped by the case */}
        {[[50, 27, '60'], [73, 50, '15'], [50, 73, '30'], [27, 50, '45']].map(([x, y, t]) => (
          <text key={t} x={x} y={y} textAnchor="middle" dominantBaseline="central"
            style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 6.4, letterSpacing: '-0.02em' }}
            fill={dark ? 'rgba(255,255,255,0.42)' : 'rgba(43,47,68,0.34)'}>
            {t}
          </text>
        ))}

        {/* sweep hand — hairline, gives the dial a pulse */}
        {running && (
          <line x1={50 - 7 * Math.cos(sweepA)} y1={50 - 7 * Math.sin(sweepA)}
            x2={50 + (R - 4) * Math.cos(sweepA)} y2={50 + (R - 4) * Math.sin(sweepA)}
            stroke={accent.from} strokeWidth="0.7" strokeLinecap="round" opacity="0.85"
            style={{ transition: 'all 0.25s cubic-bezier(0.4,1.6,0.5,1)' }} />
        )}

        {/* main hand: tapered, with a counterweight tail */}
        <g style={{ transition: 'all 1s linear' }}>
          <line x1={50 - 9 * Math.cos(handRad)} y1={50 - 9 * Math.sin(handRad)} x2={hx} y2={hy}
            stroke={handColor} strokeWidth="2.4" strokeLinecap="round" />
          <circle cx={50 - 9 * Math.cos(handRad)} cy={50 - 9 * Math.sin(handRad)} r="2.4" fill={handColor} />
        </g>
        <circle cx="50" cy="50" r="2.8" fill={dark ? '#14141f' : '#fff'} stroke={handColor} strokeWidth="1.6" />
      </svg>

      <div className="flex flex-col items-center" style={{ marginTop: size * 0.02 }}>
        <span className="tabular-nums" style={{ ...digitType(size * 0.135), color: overtime ? overtimeColor : ink }}>
          {display}
        </span>
        <Caption stateLabel={stateLabel} inkSoft={inkSoft} size={size} />
      </div>
    </div>
  )
}

/* ====================== JOURNEY (racecar / airplane / rocket / hiker) ====== */
function JourneyFace({ kind, display, stateLabel, progress, running, overtime, ink, inkSoft, overtimeColor, dark, size, uid, accent }) {
  const p = clamp01(progress)
  const gradId = `xf-journey-${uid}`
  const sceneProps = { p, running, dark, gradId, accent, uid }

  return (
    <div className="relative flex flex-col items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size * 0.78} viewBox="0 0 100 78">
        <defs>
          <AccentGrad id={gradId} accent={accent} horizontal />
          <linearGradient id={`${gradId}-sky`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent.from} stopOpacity={dark ? 0.28 : 0.2} />
            <stop offset="100%" stopColor={accent.to} stopOpacity="0" />
          </linearGradient>
        </defs>
        {kind === 'racecar' && <RaceCar {...sceneProps} overtime={overtime} />}
        {kind === 'airplane' && <Airplane {...sceneProps} />}
        {kind === 'rocket' && <Rocket {...sceneProps} />}
        {kind === 'hiker' && <Hiker {...sceneProps} />}
      </svg>
      <div className="flex flex-col items-center" style={{ marginTop: -size * 0.03 }}>
        <span className="tabular-nums" style={{ ...digitType(size * 0.16), color: overtime ? overtimeColor : ink }}>
          {display}
        </span>
        <Caption stateLabel={stateLabel} inkSoft={inkSoft} size={size} />
      </div>
    </div>
  )
}

/* ----- F1: a circuit, not an ellipse -----
   Character: speed. Kerb stripes on the inside edge and a checkered gantry
   read as motorsport instantly; streaks only appear while the clock runs, so
   motion means something. */
function RaceCar({ p, running, dark, gradId, overtime }) {
  const rx = 39, ry = 25, cx = 50, cy = 36
  const ovalLen = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)))  // Ramanujan
  const ang = (-90 + p * 360) * (Math.PI / 180)
  const px = cx + rx * Math.cos(ang)
  const py = cy + ry * Math.sin(ang)
  const heading = Math.atan2(ry * Math.cos(ang), -rx * Math.sin(ang)) * (180 / Math.PI)
  const asphalt = dark ? '#23232f' : '#dfe3ee'

  // The lap is drawn as an explicit path starting at the top and running
  // clockwise, so the travelled stroke follows the same line as the asphalt.
  // (Rotating an ellipse to move its start point deforms it into a different
  // oval — which is exactly what was happening before.)
  const lap =
    `M ${cx} ${cy - ry} ` +
    `A ${rx} ${ry} 0 0 1 ${cx} ${cy + ry} ` +
    `A ${rx} ${ry} 0 0 1 ${cx} ${cy - ry}`

  return (
    <>
      {/* asphalt */}
      <path d={lap} fill="none" stroke={asphalt} strokeWidth="8" />
      {/* inner kerb */}
      <path d={lap} fill="none" stroke="#ed5f2c" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.4" />
      {/* racing line travelled */}
      {p > 0.004 && (
        <path
          d={lap} fill="none" stroke={`url(#${gradId})`} strokeWidth="3.4" strokeLinecap="round"
          strokeDasharray={ovalLen} strokeDashoffset={ovalLen * (1 - p)}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      )}
      {/* Start / finish: a checkered band laid ACROSS the asphalt at the top of
          the lap, offset left of dead-centre so the car (which sits at twelve
          o'clock when the session starts) doesn't land on top of it. */}
      <g transform={`translate(${cx - 9} ${cy - ry})`}>
        {[0, 1, 2, 3, 4, 5, 6, 7].map(i => {
          const col = i % 2, row = Math.floor(i / 2)
          return (
            <rect key={i} x={col * 1.6} y={-4 + row * 2} width="1.6" height="2"
              fill={(col + row) % 2 === 0 ? '#fff' : '#2b2f44'} />
          )
        })}
      </g>

      {/* car */}
      <g transform={`translate(${px} ${py}) rotate(${heading})`} style={{ transition: 'transform 1s linear' }}>
        {running && [0, 1, 2].map(i => (
          <rect key={i} className="xf-streak" x={-9 - i * 2.5} y={-1.6 + i * 1.6} width="4.5" height="0.7" rx="0.35"
            fill={dark ? 'rgba(255,255,255,0.6)' : 'rgba(43,47,68,0.45)'} style={{ animationDelay: `${i * 0.12}s` }} />
        ))}
        {/* wheels sit outside the body, like a real open-wheeler */}
        <rect x="-3.4" y="-3.3" width="2.1" height="1.5" rx="0.6" fill="#14141c" />
        <rect x="1.4" y="-3.3" width="2.1" height="1.5" rx="0.6" fill="#14141c" />
        <rect x="-3.4" y="1.8" width="2.1" height="1.5" rx="0.6" fill="#14141c" />
        <rect x="1.4" y="1.8" width="2.1" height="1.5" rx="0.6" fill="#14141c" />
        {/* wings */}
        <rect x="3.5" y="-2.2" width="0.9" height="4.4" rx="0.4" fill={overtime ? '#ed5f2c' : '#ff7e4d'} />
        <rect x="-4.6" y="-2.6" width="1" height="5.2" rx="0.4" fill={overtime ? '#ed5f2c' : '#ff7e4d'} />
        {/* monocoque */}
        <path d="M -4 0 L -1.6 -1.5 L 3.2 -1 L 4.2 0 L 3.2 1 L -1.6 1.5 Z" fill={overtime ? '#ed5f2c' : '#ff7e4d'} />
        <circle cx="-0.4" cy="0" r="0.95" fill="#14141c" opacity="0.75" />
      </g>
    </>
  )
}

/* ----- Plane: departure to arrival -----
   Character: a trip with two ends. Named endpoints (dots on a horizon) plus a
   contrail that only exists behind the aircraft make progress feel like
   distance covered rather than a bar filling. */
function Airplane({ p, running, dark, gradId, accent }) {
  const path = 'M 10 66 Q 32 10 50 16 Q 68 22 90 66'
  const { x, y, angle } = pointOnQuadChain(p, [
    [10, 66, 32, 10, 50, 16],
    [50, 16, 68, 22, 90, 66],
  ])
  const ground = dark ? 'rgba(255,255,255,0.16)' : 'rgba(43,47,68,0.16)'

  return (
    <>
      {/* sky wash — same rounded panel shape as the rocket's night sky */}
      <rect x="4" y="0" width="92" height="72" rx="10" fill={`url(#${gradId}-sky)`} />
      {/* clouds — soft, low contrast, never competing with the plane */}
      {[[22, 30, 1], [72, 24, 0.8], [58, 44, 0.6]].map(([cxp, cyp, s], i) => (
        <g key={i} opacity={dark ? 0.13 : 0.16} fill={dark ? '#fff' : '#5aa8e6'}>
          <ellipse cx={cxp} cy={cyp} rx={6 * s} ry={2.2 * s} />
          <ellipse cx={cxp - 3 * s} cy={cyp + 0.6 * s} rx={4 * s} ry={1.8 * s} />
          <ellipse cx={cxp + 3.4 * s} cy={cyp + 0.8 * s} rx={3.4 * s} ry={1.5 * s} />
        </g>
      ))}

      {/* horizon + runways */}
      <line x1="4" y1="70" x2="96" y2="70" stroke={ground} strokeWidth="1.2" strokeLinecap="round" />
      <rect x="6" y="68.4" width="13" height="2.6" rx="1.3" fill={ground} />
      <rect x="81" y="68.4" width="13" height="2.6" rx="1.3" fill={ground} />

      {/* planned route */}
      <path d={path} fill="none" stroke={dark ? 'rgba(255,255,255,0.2)' : 'rgba(43,47,68,0.18)'} strokeWidth="1" strokeDasharray="1.5 3" strokeLinecap="round" />
      {/* contrail */}
      <path d={path} fill="none" stroke={`url(#${gradId})`} strokeWidth="2.2" strokeLinecap="round"
        pathLength={1} strokeDasharray="1" strokeDashoffset={1 - p}
        style={{ transition: 'stroke-dashoffset 1s linear' }} />

      {/* endpoints */}
      <circle cx="10" cy="66" r="2" fill={accent.from} />
      <circle cx="90" cy="66" r="2.4" fill="none" stroke={accent.to} strokeWidth="1.2" />
      <circle cx="90" cy="66" r={p >= 1 ? 1.2 : 0} fill={accent.to} style={{ transition: 'r 0.4s ease' }} />

      {/* aircraft */}
      <g transform={`translate(${x} ${y}) rotate(${angle})`} style={{ transition: 'transform 1s linear' }}>
        <path d="M -4.6 0 L 2.2 -0.9 L 5.4 0 L 2.2 0.9 Z" fill={dark ? '#fff' : '#2b2f44'} />
        <path d="M -0.6 0 L -3.4 -3.4 L -0.2 -0.5 Z" fill={accent.to} />
        <path d="M -0.6 0 L -3.4 3.4 L -0.2 0.5 Z" fill={accent.to} />
        <path d="M -4.4 0 L -5.6 -1.6 L -3.8 -0.4 Z" fill={dark ? 'rgba(255,255,255,0.7)' : 'rgba(43,47,68,0.6)'} />
        {running && <circle cx="-5.4" cy="0" r="1.1" fill={accent.to} opacity="0.35" />}
      </g>
    </>
  )
}

/* ----- Rocket: the ascent -----
   Character: night, and getting somewhere. The scene keeps a dark cap in both
   themes because a rocket in daylight loses the point; stars twinkle at three
   sizes so the field has depth instead of reading as random dots. */
function Rocket({ p, running, gradId, accent }) {
  const { x, y, angle } = pointOnQuadChain(p, [[50, 70, 38, 36, 74, 16]])
  const stars = [
    [14, 22, 0.9], [26, 12, 0.6], [34, 44, 0.75], [20, 56, 0.55],
    [62, 28, 0.7], [86, 40, 0.6], [88, 12, 0.9], [46, 8, 0.55], [70, 52, 0.5],
  ]
  return (
    <>
      {/* The sky is always night — stars on a pale page just read as dust, and
          a rocket in daylight loses the whole point of the face. */}
      <defs>
        <radialGradient id={`${gradId}-space`} cx="50%" cy="20%" r="85%">
          <stop offset="0%" stopColor="#2e2a4d" />
          <stop offset="60%" stopColor="#1a1830" />
          <stop offset="100%" stopColor="#0e0d1c" />
        </radialGradient>
      </defs>
      <rect x="4" y="0" width="92" height="72" rx="10" fill={`url(#${gradId}-space)`} />
      {stars.map(([sx, sy, r], i) => (
        <circle key={i} className="xf-twinkle" cx={sx} cy={sy} r={r}
          fill="#fff" opacity="0.55"
          style={{ animationDelay: `${(i % 5) * 0.6}s` }} />
      ))}

      {/* moon with craters */}
      <circle cx="76" cy="14" r="10" fill="rgba(255,255,255,0.09)" />
      <circle cx="76" cy="14" r="7" fill="#f4f1ea" />
      <circle cx="73.6" cy="11.8" r="1.5" fill="rgba(43,47,68,0.13)" />
      <circle cx="78" cy="16.4" r="1.1" fill="rgba(43,47,68,0.11)" />
      <circle cx="74.4" cy="16.8" r="0.7" fill="rgba(43,47,68,0.09)" />

      {/* launch pad */}
      <rect x="44" y="69.5" width="12" height="2" rx="1" fill="rgba(255,255,255,0.22)" />

      {/* trajectory */}
      <path d="M 50 70 Q 38 36 74 16" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1" strokeDasharray="1.5 3" />
      <path d="M 50 70 Q 38 36 74 16" fill="none" stroke={`url(#${gradId})`} strokeWidth="2.2" strokeLinecap="round"
        pathLength={1} strokeDasharray="1" strokeDashoffset={1 - p}
        style={{ transition: 'stroke-dashoffset 1s linear' }} />

      {/* rocket */}
      <g transform={`translate(${x} ${y}) rotate(${angle + 90})`} style={{ transition: 'transform 1s linear' }}>
        {running && (
          <g className="xf-flame">
            <path d="M -1.7 2.4 Q 0 8.5 1.7 2.4 Z" fill={accent.to} opacity="0.95" />
            <path d="M -0.9 2.4 Q 0 5.6 0.9 2.4 Z" fill="#ffd9bd" />
          </g>
        )}
        <path d="M 0 -6 Q 2.6 -1.6 2.6 2.4 L -2.6 2.4 Q -2.6 -1.6 0 -6 Z" fill="#ff7e4d" />
        <path d="M 0 -6 Q 1.2 -3.4 1.2 -1 L -1.2 -1 Q -1.2 -3.4 0 -6 Z" fill="#ffb894" opacity="0.55" />
        <circle cx="0" cy="-1.4" r="1.15" fill="#14141f" />
        <circle cx="-0.35" cy="-1.75" r="0.35" fill="#fff" opacity="0.6" />
        <path d="M -2.6 2.4 L -4.4 4.6 L -2.2 3.4 Z" fill="#ed5f2c" />
        <path d="M 2.6 2.4 L 4.4 4.6 L 2.2 3.4 Z" fill="#ed5f2c" />
      </g>
    </>
  )
}

/* ----- Summit: the climb -----
   Character: effort with a view. Three ridge layers give real depth, the trail
   switchbacks up the near ridge, and the hiker leans into the slope — the
   previous version pointed the walker flat regardless of the gradient. */
function Hiker({ p, running, dark, gradId, accent }) {
  const trail = [[10, 70], [30, 52], [44, 58], [58, 40], [72, 44], [82, 16]]
  const d = 'M ' + trail.map(([x, y]) => `${x} ${y}`).join(' L ')
  const { x, y, angle } = pointOnPolyline(p, trail)

  return (
    <>
      {/* sky */}
      <rect x="0" y="0" width="100" height="72" fill={`url(#${gradId}-sky)`} />
      {/* low sun — halo first so it sits in the air rather than on top of it */}
      <circle cx="20" cy="15" r="10" fill={dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,184,148,0.25)'} />
      <circle cx="20" cy="15" r="5" fill={dark ? 'rgba(255,255,255,0.34)' : 'rgba(255,184,148,0.85)'} />

      {/* Ridges recede by getting LIGHTER with distance — the near ridge has to
          be the darkest mass or the depth reads backwards. */}
      <path d="M 0 72 L 18 44 L 32 56 L 52 30 L 68 48 L 84 26 L 100 72 Z"
        fill={dark ? 'rgba(169,212,245,0.07)' : 'rgba(90,168,230,0.13)'} />
      <path d="M 0 72 L 24 50 L 40 60 L 60 34 L 78 52 L 100 72 Z"
        fill={dark ? 'rgba(169,212,245,0.13)' : 'rgba(90,168,230,0.26)'} />
      <path d="M 2 74 L 28 50 L 44 60 L 58 38 L 74 44 L 82 12 L 96 74 Z"
        fill={dark ? 'rgba(122,140,175,0.42)' : 'rgba(58,84,124,0.42)'} />
      {/* snow cap, following the summit's own facets */}
      <path d="M 82 12 L 86.5 30 L 82.5 26.5 L 79 29.5 L 77 25 Z"
        fill={dark ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.92)'} />

      {/* trail */}
      <path d={d} fill="none" stroke={dark ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.45)'} strokeWidth="1.1" strokeDasharray="1.5 2.5" strokeLinecap="round" />
      <path d={d} fill="none" stroke={`url(#${gradId})`} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
        pathLength={1} strokeDasharray="1" strokeDashoffset={1 - p}
        style={{ transition: 'stroke-dashoffset 1s linear' }} />

      {/* summit flag */}
      <line x1="82" y1="12" x2="82" y2="3.5" stroke={dark ? '#fff' : '#2b2f44'} strokeWidth="0.9" strokeLinecap="round" />
      <path d="M 82 3.5 L 89 5.8 L 82 8.2 Z" fill={p >= 1 ? accent.to : '#ff7e4d'} />

      {/* hiker — leans into the gradient, pack on the back. Coral against the
          cool ridge so the eye finds "you are here" immediately. */}
      <g transform={`translate(${x} ${y - 3.4}) rotate(${angle * 0.45})`} style={{ transition: 'transform 1s linear' }}>
        <line x1="1.5" y1="-1.6" x2="2.6" y2="2.8" stroke={dark ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.9)'} strokeWidth="0.55" strokeLinecap="round" />
        <rect x="-2.7" y="-1.7" width="1.8" height="2.9" rx="0.8" fill="#ed5f2c" />
        <rect x="-1.5" y="-2" width="3" height="4.4" rx="1.4" fill="#ff7e4d" stroke={dark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.55)'} strokeWidth="0.35" />
        <circle cx="0.1" cy="-3.7" r="1.55" fill={dark ? '#fff' : '#fdf6f1'} stroke="#ed5f2c" strokeWidth="0.4" />
        {running && <circle cx="0" cy="-6.8" r="0.85" fill={accent.to} opacity="0.4" />}
      </g>
    </>
  )
}

/* ---- helpers ---- */

// #rrggbb + alpha → rgba() string, so accent colors can tint glows.
function hexA(hex, a) {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

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

// Walks a polyline by arc length and returns the local slope, so a traveler
// can be rotated to match the ground it's standing on.
function pointOnPolyline(p, pts) {
  const segLens = []
  let total = 0
  for (let i = 0; i < pts.length - 1; i++) {
    const d = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1])
    segLens.push(d); total += d
  }
  let dist = p * total
  for (let i = 0; i < segLens.length; i++) {
    if (dist <= segLens[i] || i === segLens.length - 1) {
      const t = segLens[i] === 0 ? 0 : Math.min(1, dist / segLens[i])
      const [x0, y0] = pts[i]
      const [x1, y1] = pts[i + 1]
      return {
        x: x0 + (x1 - x0) * t,
        y: y0 + (y1 - y0) * t,
        angle: Math.atan2(y1 - y0, x1 - x0) * (180 / Math.PI),
      }
    }
    dist -= segLens[i]
  }
  const last = pts[pts.length - 1]
  return { x: last[0], y: last[1], angle: 0 }
}
