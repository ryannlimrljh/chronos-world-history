import { useMemo } from 'react'
import type { HistoricalEvent, LayoutResult, Polity } from '../types'
import { CURRENT_YEAR } from '../types'
import { REGIONS } from '../config/regions'
import { useViewStore } from '../store/view'
import { useAppStore } from '../store/app'
import { eventTitle, polityName, ui } from '../i18n'
import eventsRaw from '../../data/events.json'

/**
 * Everything that makes the canvas a poster rather than a chart: the title
 * block, the milestone list, the flag row, the legend, the footnote and
 * the landmark silhouettes. All of it lives in WORLD coordinates inside
 * one transformed wrapper, so it pans, zooms and prints with the mosaic —
 * it is part of the artefact, not part of the app chrome.
 */

const FLAGS: Record<string, string> = {
  usa: '🇺🇸', 'great-britain': '🇬🇧', 'france-modern': '🇫🇷', spain: '🇪🇸',
  portugal: '🇵🇹', netherlands: '🇳🇱', italy: '🇮🇹', 'greece-modern': '🇬🇷',
  germany: '🇩🇪', 'russia-modern': '🇷🇺', turkey: '🇹🇷', 'egypt-modern': '🇪🇬',
  'alaouite-morocco': '🇲🇦', 'south-africa': '🇿🇦', 'iran-modern': '🇮🇷',
  kazakhstan: '🇰🇿', india: '🇮🇳', 'siam-thailand': '🇹🇭', indonesia: '🇮🇩',
  'china-modern': '🇨🇳', 'korea-modern': '🇰🇷', 'japan-modern': '🇯🇵',
  australia: '🇦🇺',
}

const INK50 = 'rgba(26,22,20,0.5)'

function Clock({ size }: { size: number }) {
  // The glyph swap: the second O of HISTORY is a clock face.
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ display: 'inline-block', verticalAlign: 'baseline', margin: '0 1px' }}
      aria-hidden
    >
      <circle cx="50" cy="50" r="44" fill="none" stroke="var(--ink)" strokeWidth="13" />
      <line x1="50" y1="50" x2="50" y2="24" stroke="var(--ink)" strokeWidth="10" strokeLinecap="round" />
      <line x1="50" y1="50" x2="70" y2="58" stroke="var(--ink)" strokeWidth="10" strokeLinecap="round" />
    </svg>
  )
}

/** Flat monochrome landmark silhouettes. Grey, no detail beyond outline. */
function BigBen({ x, y, h }: { x: number; y: number; h: number }) {
  return (
    <svg width={h * 0.34} height={h} viewBox="0 0 34 100" style={{ position: 'absolute', left: x, top: y }} aria-hidden>
      <g fill="#a89d97">
        <polygon points="17,0 22,12 22,20 12,20 12,12" />
        <rect x="10" y="20" width="14" height="14" />
        <rect x="12" y="34" width="10" height="46" />
        <rect x="8" y="80" width="18" height="20" />
      </g>
      <circle cx="17" cy="27" r="4.5" fill="#FAF0EC" />
      <line x1="17" y1="27" x2="17" y2="23.5" stroke="#a89d97" strokeWidth="1.6" />
      <line x1="17" y1="27" x2="19.5" y2="28" stroke="#a89d97" strokeWidth="1.6" />
    </svg>
  )
}

function Pyramids({ x, y, h }: { x: number; y: number; h: number }) {
  return (
    <svg width={h * 2} height={h} viewBox="0 0 100 50" style={{ position: 'absolute', left: x, top: y }} aria-hidden>
      <polygon points="30,50 55,4 80,50" fill="#a89d97" />
      <polygon points="5,50 26,18 47,50" fill="#bcb2ac" />
    </svg>
  )
}

function Camel({ x, y, h }: { x: number; y: number; h: number }) {
  return (
    <svg width={h * 1.4} height={h} viewBox="0 0 70 50" style={{ position: 'absolute', left: x, top: y }} aria-hidden>
      <path
        d="M6 48 L9 34 Q10 26 16 25 Q20 15 26 20 Q30 12 36 19 Q46 16 50 22 L55 12 Q57 8 60 9 L64 14 L61 16 L57 17 L54 26 Q53 32 47 33 L46 48 L42 48 L42 36 L24 36 L22 48 L18 48 L19 34 Q13 35 12 40 L10 48 Z"
        fill="#a89d97"
      />
    </svg>
  )
}

function Pagoda({ x, y, h }: { x: number; y: number; h: number }) {
  return (
    <svg width={h * 0.9} height={h} viewBox="0 0 45 50" style={{ position: 'absolute', left: x, top: y }} aria-hidden>
      <g fill="#a89d97">
        <rect x="21" y="0" width="3" height="6" />
        <polygon points="22.5,4 38,14 7,14" />
        <rect x="17" y="14" width="11" height="5" />
        <polygon points="22.5,16 42,28 3,28" />
        <rect x="15" y="28" width="15" height="6" />
        <polygon points="22.5,30 45,44 0,44" />
        <rect x="18" y="44" width="9" height="6" />
      </g>
    </svg>
  )
}

export function PosterChrome({
  layout,
  polities,
}: {
  layout: LayoutResult
  polities: ReadonlyMap<string, Polity>
}) {
  const camera = useViewStore((s) => s.camera)
  const lang = useAppStore((s) => s.lang)
  const events = useMemo(
    () =>
      [...(eventsRaw.events as HistoricalEvent[])].sort(
        (a, b) => a.year - b.year,
      ),
    [],
  )
  const flagEntries = useMemo(() => {
    const out: { flag: string; name: string; x: number; w: number }[] = []
    for (const rect of layout.rects) {
      const p = polities.get(rect.polityId)
      if (!p || p.end < CURRENT_YEAR) continue
      const flag = FLAGS[p.id]
      if (!flag) continue
      out.push({ flag, name: polityName(p, lang), x: rect.x, w: rect.width })
    }
    return out.sort((a, b) => a.x - b.x)
  }, [layout, polities, lang])

  const third = Math.ceil(events.length / 3)
  const cols = [
    events.slice(0, third),
    events.slice(third, third * 2),
    events.slice(third * 2),
  ]

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: layout.width,
        height: layout.height,
        transform: `translate(${camera.tx}px, ${camera.ty}px) scale(${camera.k})`,
        transformOrigin: '0 0',
        pointerEvents: 'none',
        fontFamily: 'var(--font-label)',
        color: 'var(--ink)',
      }}
    >
      {/* ---- Title block (top-left reserve) ---- */}
      <div style={{ position: 'absolute', left: 14, top: 12, width: 312 }}>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontSize: 46,
            lineHeight: 0.92,
            letterSpacing: '-0.015em',
            textTransform: 'uppercase',
          }}
        >
          World
          <br />
          Hist
          <Clock size={35} />
          ry
        </div>
        <div
          style={{
            display: 'inline-block',
            marginTop: 10,
            padding: '3px 16px',
            border: '1.5px solid var(--ink)',
            borderRadius: 999,
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          {ui('subtitle', '5000-Year Interactive Timeline', lang)}
        </div>

        {/* ---- Milestone list: texture as much as content ---- */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {cols.map((col, i) => (
            <div key={i} style={{ flex: 1 }}>
              {col.map((e) => (
                <div
                  key={e.id}
                  style={{
                    fontSize: 5.2,
                    lineHeight: 1.55,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  <span style={{ opacity: 0.45 }}>◦ </span>
                  <span style={{ opacity: 0.6, fontVariantNumeric: 'tabular-nums' }}>
                    {e.year < 0 ? `${-e.year} BCE` : e.year}
                  </span>{' '}
                  {eventTitle(e.id, e.title, lang)}
                </div>
              ))}
            </div>
          ))}
        </div>
        {/* Landmarks tucked into the title zone's lower margin */}
        <div style={{ position: 'relative', height: 40 }}>
          <BigBen x={0} y={-4} h={44} />
          <Pyramids x={50} y={18} h={22} />
        </div>
      </div>

      {/* Camel walking the skyline above the tallest early tower */}
      <Camel x={360} y={-26} h={26} />
      {/* Pagoda on the eastern skyline */}
      <Pagoda x={layout.width - 30} y={196} h={30} />

      {/* ---- Flag row: modern states aligned to their columns ---- */}
      {flagEntries.map((f) => (
        <div
          key={f.name}
          style={{
            position: 'absolute',
            left: f.x,
            top: layout.height + 4,
            width: f.w,
            textAlign: 'center',
            overflow: 'visible',
          }}
        >
          <div style={{ fontSize: 11, lineHeight: 1 }}>{f.flag}</div>
          <div
            style={{
              fontSize: 4.4,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              opacity: 0.7,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {f.name}
          </div>
        </div>
      ))}

      {/* ---- Legend + footnote rule ---- */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: layout.height + 30,
          width: layout.width,
          borderTop: `0.5px solid ${INK50}`,
          paddingTop: 4,
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 8px' }}>
          {REGIONS.map((r) => (
            <span key={r.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 2.5, fontSize: 5, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              <span
                style={{
                  width: 6,
                  height: 6,
                  background: r.colorFamily,
                  border: '0.5px solid rgba(26,22,20,0.4)',
                  display: 'inline-block',
                }}
              />
              {r.name}
            </span>
          ))}
        </div>
        <div style={{ fontSize: 4.6, opacity: 0.55, marginTop: 3, lineHeight: 1.5 }}>
          {ui(
            'footnote',
            'Rectangle height is lifespan; width reflects significance relative to contemporaries. The time scale is non-linear: ancient centuries are compressed, modern centuries expanded. Dates follow one scholarly convention where several exist; approximate dates are marked c. · © 2026 Chronos',
            lang,
          )}
        </div>
      </div>
    </div>
  )
}
