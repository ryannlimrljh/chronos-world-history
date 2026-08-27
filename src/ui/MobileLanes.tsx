import { useMemo, useState } from 'react'
import type { Polity, RegionId } from '../types'
import { CURRENT_YEAR } from '../types'
import { REGIONS, getRegion } from '../config/regions'
import { eraForYear } from '../config/eras'
import { useAppStore } from '../store/app'
import { durationYears, formatRange } from '../interact/format'
import { strokeFor } from '../config/color'
import { eraName, polityBlurb, polityName, politySecondary, regionName, ui } from '../i18n'

/**
 * The small-screen reading mode: one region at a time as a vertical
 * scroll of dated bars, with a region switcher across the top.
 *
 * The mosaic's whole argument is horizontal comparison, which a phone
 * cannot show honestly, so below 900px this reads the same data as a
 * chronology instead of pretending to be a poster. Tapping a bar opens
 * the same detail drawer Explore uses.
 */
export function MobileLanes({
  polities,
}: {
  polities: ReadonlyMap<string, Polity>
}) {
  const lang = useAppStore((s) => s.lang)
  const select = useAppStore((s) => s.select)
  const [region, setRegion] = useState<RegionId>('east-asia')

  const list = useMemo(
    () =>
      [...polities.values()]
        .filter((p) => p.region === region)
        .sort((a, b) => a.start - b.start || a.end - b.end),
    [polities, region],
  )

  const span = useMemo(() => {
    const min = Math.min(...list.map((p) => p.start))
    const max = Math.max(...list.map((p) => p.end))
    return { min, max, range: Math.max(max - min, 1) }
  }, [list])

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--paper)',
        fontFamily: 'var(--font-label)',
      }}
    >
      <header style={{ padding: '12px 14px 8px', borderBottom: '1px solid rgba(26,22,20,0.2)' }}>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontSize: 22,
            letterSpacing: '-0.01em',
          }}
        >
          WORLD HISTORY
        </div>
        <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>
          {ui('subtitle', '5000-Year Interactive Timeline', lang)}
        </div>
      </header>

      {/* Region switcher */}
      <nav
        style={{
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          padding: '10px 14px',
          borderBottom: '1px solid rgba(26,22,20,0.2)',
        }}
      >
        {REGIONS.map((r) => {
          const on = r.id === region
          return (
            <button
              key={r.id}
              onClick={() => setRegion(r.id)}
              style={{
                font: 'inherit',
                fontSize: 12.5,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                padding: '8px 12px',
                minHeight: 44,
                cursor: 'pointer',
                border: '1px solid rgba(26,22,20,0.35)',
                background: on ? 'var(--ink)' : 'transparent',
                color: on ? 'var(--paper)' : 'var(--ink)',
                borderBottom: on ? undefined : `3px solid ${r.colorFamily}`,
              }}
            >
              {regionName(r.id, lang, r.name)}
            </button>
          )
        })}
      </nav>

      {/* Chronology */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px 28px' }}>
        {list.map((p) => {
          const fill = getRegion(p.region).tints[2]!
          const left = ((p.start - span.min) / span.range) * 100
          const width = Math.max((durationYears(p) / span.range) * 100, 1.5)
          const era = eraForYear(Math.round((p.start + p.end) / 2))
          return (
            <button
              key={p.id}
              onClick={() => select(p.id)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                font: 'inherit',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid rgba(26,22,20,0.12)',
                padding: '10px 2px',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>
                  {polityName(p, lang)}
                  {politySecondary(p, lang) && (
                    <span style={{ fontWeight: 400, opacity: 0.6, fontSize: 13 }}>
                      {' '}{politySecondary(p, lang)}
                    </span>
                  )}
                </span>
                <span style={{ fontSize: 12, opacity: 0.65, whiteSpace: 'nowrap' }}>
                  {formatRange(p)}
                </span>
              </div>
              {/* Position within the lane's span: the one spatial cue
                  that survives a narrow screen. */}
              <div style={{ position: 'relative', height: 8, margin: '6px 0 5px' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(26,22,20,0.07)' }} />
                <div
                  style={{
                    position: 'absolute',
                    left: `${left}%`,
                    width: `${width}%`,
                    top: 0,
                    bottom: 0,
                    background: fill,
                    border: `1px solid ${strokeFor(fill)}`,
                  }}
                />
              </div>
              <div style={{ fontSize: 12.5, lineHeight: 1.55, opacity: 0.8 }}>
                {polityBlurb(p, lang)}
              </div>
              <div style={{ fontSize: 11, opacity: 0.5, marginTop: 3 }}>
                {durationYears(p)} {ui('years', 'years', lang)}
                {era ? ` · ${eraName(era, lang)}` : ''}
                {p.end >= CURRENT_YEAR ? ` · ${ui('present', 'present', lang)}` : ''}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
