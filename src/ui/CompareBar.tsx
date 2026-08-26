import type { Polity } from '../types'
import { useAppStore } from '../store/app'
import { getRegion } from '../config/regions'
import { durationYears, formatRange } from '../interact/format'

/**
 * Bottom compare strip: up to four shift-clicked polities with duration
 * bars at a shared scale, so lifespans are visually comparable.
 */
export function CompareBar({
  polities,
}: {
  polities: ReadonlyMap<string, Polity>
}) {
  const compareIds = useAppStore((s) => s.compareIds)
  const toggleCompare = useAppStore((s) => s.toggleCompare)
  const clearCompare = useAppStore((s) => s.clearCompare)

  if (compareIds.length === 0) return null
  const items = compareIds
    .map((id) => polities.get(id))
    .filter((p): p is Polity => Boolean(p))
  const maxDuration = Math.max(...items.map(durationYears), 1)

  return (
    <div
      style={{
        position: 'absolute',
        left: 102,
        bottom: 12,
        zIndex: 20,
        width: 'min(440px, calc(100vw - 130px))',
        background: 'var(--paper)',
        border: '1px solid rgba(26,22,20,0.45)',
        padding: '8px 12px 10px',
        fontFamily: 'var(--font-label)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.55 }}>
          Compare · shift-click to add ({compareIds.length}/4)
        </span>
        <button
          onClick={clearCompare}
          style={{ font: 'inherit', fontSize: 11, border: 'none', background: 'none', cursor: 'pointer', opacity: 0.6 }}
        >
          clear
        </button>
      </div>
      {items.map((p) => (
        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <button
            onClick={() => toggleCompare(p.id)}
            title="Remove"
            style={{ font: 'inherit', fontSize: 11, border: 'none', background: 'none', cursor: 'pointer', opacity: 0.5, padding: 0 }}
          >
            ✕
          </button>
          <span style={{ fontSize: 12, fontWeight: 600, width: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {p.name}
          </span>
          <div style={{ flex: 1, position: 'relative', height: 12 }}>
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 1,
                bottom: 1,
                width: `${(durationYears(p) / maxDuration) * 100}%`,
                background: getRegion(p.region).colorFamily,
                border: '1px solid rgba(26,22,20,0.35)',
              }}
            />
          </div>
          <span style={{ fontSize: 11, opacity: 0.7, whiteSpace: 'nowrap' }}>
            {durationYears(p)}y · {formatRange(p)}
          </span>
        </div>
      ))}
    </div>
  )
}
