import { useEffect } from 'react'
import type { PolityCategory, RegionId } from '../types'
import { REGIONS } from '../config/regions'
import { ERAS } from '../config/eras'
import { useAppStore, EMPTY_FILTERS } from '../store/app'
import { categoryDescription, categoryName, eraName, regionName, ui } from '../i18n'
import { formatYear } from '../interact/format'
import { useRightOffset } from './chrome'

const CATEGORIES: PolityCategory[] = [
  'empire', 'kingdom', 'dynasty', 'republic', 'caliphate',
  'khanate', 'confederation', 'city-state', 'colonial', 'modern-state',
]

/**
 * The filter panel, anchored beside the right rail (its button lives in
 * the Toolbar). Filters desaturate rather than hide, so nothing ever
 * vanishes from the map. Esc closes.
 */
export function FilterBar() {
  const filters = useAppStore((s) => s.filters)
  const setFilters = useAppStore((s) => s.setFilters)
  const resetFilters = useAppStore((s) => s.resetFilters)
  const lang = useAppStore((s) => s.lang)
  const open = useAppStore((s) => s.filtersOpen)
  const setOpen = useAppStore((s) => s.setFiltersOpen)
  const right = useRightOffset()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  if (!open) return null

  const toggleSet = <T,>(set: ReadonlySet<T>, v: T): Set<T> => {
    const next = new Set(set)
    if (next.has(v)) next.delete(v)
    else next.add(v)
    return next
  }

  const chipStyle = (on: boolean) => ({
    font: 'inherit',
    fontSize: 11,
    padding: '2px 7px',
    marginRight: 4,
    marginBottom: 4,
    cursor: 'pointer',
    border: '1px solid rgba(26,22,20,0.4)',
    background: on ? 'var(--ink)' : 'transparent',
    color: on ? 'var(--paper)' : 'var(--ink)',
  })

  const heading = (text: string) => (
    <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.55, margin: '10px 0 4px' }}>
      {text}
    </div>
  )

  return (
    <div
      className="chronos-pop chronos-shift"
      style={{
        position: 'absolute',
        top: 88,
        right: right + 42,
        zIndex: 25,
        width: 300,
        maxHeight: '70vh',
        overflowY: 'auto',
        padding: '10px 12px 12px',
        border: '1px solid rgba(26,22,20,0.45)',
        background: 'var(--paper)',
        fontFamily: 'var(--font-label)',
      }}
    >
      <div style={{ fontSize: 11, lineHeight: 1.5, opacity: 0.65 }}>
        {ui(
          'filterHint',
          'Filters never hide anything: what does not match simply fades, so the shape of history stays visible.',
          lang,
        )}
      </div>
      {heading(ui('regions', 'Regions', lang))}
      <div>
        {REGIONS.map((r) => (
          <button
            key={r.id}
            className="cbtn"
            data-tip={`${ui('filterFocus', 'Highlight only', lang)}: ${regionName(r.id, lang, r.name)}`}
            style={chipStyle(filters.regions.has(r.id))}
            onClick={() =>
              setFilters({ regions: toggleSet<RegionId>(filters.regions, r.id) })
            }
          >
            {regionName(r.id, lang, r.name)}
          </button>
        ))}
      </div>
      {heading(ui('categories', 'Categories', lang))}
      <div>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            className="cbtn"
            data-tip={categoryDescription(c, lang)}
            style={chipStyle(filters.categories.has(c))}
            onClick={() => setFilters({ categories: toggleSet(filters.categories, c) })}
          >
            {categoryName(c, lang)}
          </button>
        ))}
      </div>
      {heading(ui('eras', 'Eras', lang))}
      <div>
        {ERAS.map((e) => (
          <button
            key={e.id}
            className="cbtn"
            data-tip={`${eraName(e, lang)} · ${formatYear(e.start)} – ${formatYear(e.end)}`}
            style={chipStyle(filters.eras.has(e.id))}
            onClick={() => setFilters({ eras: toggleSet(filters.eras, e.id) })}
          >
            {eraName(e, lang)}
          </button>
        ))}
      </div>
      {heading(ui('minSignificance', 'Minimum significance', lang))}
      <div>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            className="cbtn"
            data-tip={
              n === 1
                ? ui('sigAll', 'Show everything', lang)
                : `${ui('sigOnly', 'Highlight only polities of significance', lang)} ${n}+`
            }
            style={chipStyle(filters.minSignificance === n)}
            onClick={() => setFilters({ minSignificance: n })}
          >
            {n}+
          </button>
        ))}
      </div>
      <button
        className="cbtn"
        onClick={() => {
          resetFilters()
          setFilters(EMPTY_FILTERS)
        }}
        style={{ ...chipStyle(false), marginTop: 10 }}
      >
        {ui('clearAll', 'Clear all', lang)}
      </button>
    </div>
  )
}
