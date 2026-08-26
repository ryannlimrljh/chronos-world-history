import { useEffect, useMemo } from 'react'
import type { LayoutResult, Polity } from '../types'
import { eraForYear } from '../config/eras'
import { getRegion } from '../config/regions'
import { useAppStore } from '../store/app'
import { centerOnRect } from '../interact/camera'
import { formatRange, durationYears } from '../interact/format'
import { categoryName, eraName, polityName, politySecondary, regionName, ui } from '../i18n'

/**
 * The right-side detail drawer. At most 380px, hairline border, no shadow;
 * it floats over the artefact and gets out of the way. Predecessors,
 * successors and contemporaries are chips that navigate and re-centre.
 */
export function Drawer({
  layout,
  polities,
}: {
  layout: LayoutResult
  polities: ReadonlyMap<string, Polity>
}) {
  const selectedId = useAppStore((s) => s.selectedId)
  const select = useAppStore((s) => s.select)
  const lang = useAppStore((s) => s.lang)

  useEffect(() => {
    if (!selectedId) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') select(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedId, select])

  const p = selectedId ? polities.get(selectedId) : undefined
  const rectOf = useMemo(() => {
    const m = new Map(layout.rects.map((r) => [r.polityId, r]))
    return (id: string) => m.get(id)
  }, [layout])

  const contemporaries = useMemo(() => {
    if (!p) return []
    const mid = Math.round((p.start + p.end) / 2)
    return [...polities.values()]
      .filter((q) => q.id !== p.id && q.start <= mid && q.end >= mid)
      .sort((a, b) => b.significance - a.significance)
      .slice(0, 14)
  }, [p, polities])

  if (!p) return null
  const mid = Math.round((p.start + p.end) / 2)
  const era = eraForYear(mid)

  const jump = (id: string) => {
    select(id)
    const rect = rectOf(id)
    if (rect) centerOnRect(rect)
  }

  const chip = (id: string) => {
    const q = polities.get(id)
    if (!q) return null
    return (
      <button
        key={id}
        onClick={() => jump(id)}
        style={{
          font: 'inherit',
          fontSize: 12,
          padding: '2px 8px',
          border: '1px solid rgba(26,22,20,0.4)',
          background: 'transparent',
          cursor: 'pointer',
          marginRight: 5,
          marginBottom: 5,
        }}
      >
        {polityName(q, lang)}
      </button>
    )
  }

  const label = (text: string) => (
    <div
      style={{
        fontSize: 10,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        opacity: 0.55,
        marginTop: 14,
        marginBottom: 4,
      }}
    >
      {text}
    </div>
  )

  return (
    <aside
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: 'min(380px, 90vw)',
        overflowY: 'auto',
        background: 'var(--paper)',
        borderLeft: '1px solid rgba(26,22,20,0.35)',
        padding: '18px 20px 28px',
        zIndex: 20,
        fontFamily: 'var(--font-label)',
      }}
    >
      <button
        onClick={() => select(null)}
        aria-label="Close details"
        style={{
          position: 'absolute',
          top: 10,
          right: 12,
          font: 'inherit',
          fontSize: 16,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          opacity: 0.6,
        }}
      >
        ✕
      </button>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 900,
          fontSize: 24,
          lineHeight: 1.05,
          textTransform: 'uppercase',
          letterSpacing: '-0.01em',
          margin: 0,
          paddingRight: 20,
        }}
      >
        {polityName(p, lang)}
      </h2>
      {politySecondary(p, lang) && (
        <div style={{ fontSize: 15, opacity: 0.75, marginTop: 3 }}>
          {politySecondary(p, lang)}
        </div>
      )}
      <div style={{ fontSize: 14, marginTop: 8, fontWeight: 600 }}>
        {formatRange(p)}
        <span style={{ opacity: 0.6, fontWeight: 400 }}>
          {' '}· {durationYears(p)} {ui('years', 'years', lang)}
        </span>
      </div>
      <div style={{ fontSize: 12, marginTop: 4, opacity: 0.75 }}>
        {regionName(p.region, lang, getRegion(p.region).name)} ·{' '}
        {categoryName(p.category, lang)}
        {era ? ` · ${eraName(era, lang)}` : ''}
        {p.capital ? ` · ${ui('capital', 'capital', lang)} ${p.capital}` : ''}
      </div>
      {(p.startPrecision !== 'exact' || p.endPrecision !== 'exact' || p.confidence !== 'high') && (
        <div style={{ fontSize: 11, marginTop: 4, opacity: 0.55 }}>
          {ui('datingConfidence', 'Dating confidence', lang)}: {p.confidence}
          {p.startPrecision !== 'exact' ? ` · start ${p.startPrecision}` : ''}
          {p.endPrecision !== 'exact' ? ` · end ${p.endPrecision}` : ''}
        </div>
      )}
      <p style={{ fontSize: 14, lineHeight: 1.45, marginTop: 12 }}>{p.blurb}</p>

      {p.predecessors && p.predecessors.length > 0 && (
        <>
          {label(ui('precededBy', 'Preceded by', lang))}
          <div>{p.predecessors.map(chip)}</div>
        </>
      )}
      {p.successors && p.successors.length > 0 && (
        <>
          {label(ui('succeededBy', 'Succeeded by', lang))}
          <div>{p.successors.map(chip)}</div>
        </>
      )}
      {contemporaries.length > 0 && (
        <>
          {label(
            `${ui('aliveIn', 'Alive in', lang)} ${mid < 0 ? `${-mid} BCE` : `${mid} CE`}`,
          )}
          <div>{contemporaries.map((q) => chip(q.id))}</div>
        </>
      )}
      {p.wikipedia && (
        <>
          {label(ui('source', 'Source', lang))}
          <a
            href={p.wikipedia}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 13, color: 'inherit' }}
          >
            Wikipedia ↗
          </a>
        </>
      )}
    </aside>
  )
}
