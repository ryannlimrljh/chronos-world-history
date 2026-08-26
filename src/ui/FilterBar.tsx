import { useState } from 'react'
import type { PolityCategory, RegionId } from '../types'
import { REGIONS } from '../config/regions'
import { ERAS } from '../config/eras'
import { useAppStore, EMPTY_FILTERS } from '../store/app'

const CATEGORIES: PolityCategory[] = [
  'empire', 'kingdom', 'dynasty', 'republic', 'caliphate',
  'khanate', 'confederation', 'city-state', 'colonial', 'modern-state',
]

/**
 * Floating filter panel, top-left, hairline border, no shadow. Filters
 * desaturate rather than hide, so nothing ever vanishes from the map.
 */
export function FilterBar() {
  const filters = useAppStore((s) => s.filters)
  const setFilters = useAppStore((s) => s.setFilters)
  const resetFilters = useAppStore((s) => s.resetFilters)
  const [open, setOpen] = useState(false)

  const activeCount =
    filters.regions.size +
    filters.categories.size +
    filters.eras.size +
    (filters.minSignificance > 1 ? 1 : 0)

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
      style={{
        position: 'absolute',
        top: 40,
        left: 102,
        zIndex: 20,
        fontFamily: 'var(--font-label)',
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          font: 'inherit',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          padding: '5px 10px',
          border: '1px solid rgba(26,22,20,0.45)',
          background: 'var(--paper)',
          cursor: 'pointer',
        }}
      >
        Filters{activeCount > 0 ? ` · ${activeCount}` : ''}
      </button>
      {open && (
        <div
          style={{
            marginTop: 6,
            width: 300,
            maxHeight: '70vh',
            overflowY: 'auto',
            padding: '10px 12px 12px',
            border: '1px solid rgba(26,22,20,0.45)',
            background: 'var(--paper)',
          }}
        >
          {heading('Regions')}
          <div>
            {REGIONS.map((r) => (
              <button
                key={r.id}
                style={chipStyle(filters.regions.has(r.id))}
                onClick={() =>
                  setFilters({ regions: toggleSet<RegionId>(filters.regions, r.id) })
                }
              >
                {r.name}
              </button>
            ))}
          </div>
          {heading('Categories')}
          <div>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                style={chipStyle(filters.categories.has(c))}
                onClick={() =>
                  setFilters({ categories: toggleSet(filters.categories, c) })
                }
              >
                {c}
              </button>
            ))}
          </div>
          {heading('Eras')}
          <div>
            {ERAS.map((e) => (
              <button
                key={e.id}
                style={chipStyle(filters.eras.has(e.id))}
                onClick={() => setFilters({ eras: toggleSet(filters.eras, e.id) })}
              >
                {e.name}
              </button>
            ))}
          </div>
          {heading('Minimum significance')}
          <div>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                style={chipStyle(filters.minSignificance === n)}
                onClick={() => setFilters({ minSignificance: n })}
              >
                {n}+
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              resetFilters()
              setFilters(EMPTY_FILTERS)
            }}
            style={{ ...chipStyle(false), marginTop: 10 }}
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}
