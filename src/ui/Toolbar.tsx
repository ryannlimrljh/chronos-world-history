import type { LayoutResult, Polity, TimeScale } from '../types'
import { useAppStore } from '../store/app'
import { useViewStore } from '../store/view'
import { DEFAULT_SCALE } from '../layout/scale'
import { smoothZoom } from '../interact/camera'
import { ui } from '../i18n'
import { downloadPosterSvg } from '../export/svg'
import { useRightOffset } from './chrome'

/**
 * The visible face of the keyboard shortcuts, in one consistent right
 * rail: search, zoom, fit, time cursor, filters. Shifts smoothly aside
 * when the detail drawer opens.
 */
export function Toolbar({
  layout,
  polities,
  scale,
}: {
  layout: LayoutResult
  polities: ReadonlyMap<string, Polity>
  scale: TimeScale
}) {
  const lang = useAppStore((s) => s.lang)
  const setSearchOpen = useAppStore((s) => s.setSearchOpen)
  const timeCursor = useAppStore((s) => s.timeCursor)
  const setTimeCursor = useAppStore((s) => s.setTimeCursor)
  const filtersOpen = useAppStore((s) => s.filtersOpen)
  const setFiltersOpen = useAppStore((s) => s.setFiltersOpen)
  const filters = useAppStore((s) => s.filters)
  const startTour = useAppStore((s) => s.startTour)
  const tourChapter = useAppStore((s) => s.tourChapter)
  const right = useRightOffset()

  const activeFilters =
    filters.regions.size +
    filters.categories.size +
    filters.eras.size +
    (filters.minSignificance > 1 ? 1 : 0)

  const zoom = (f: number) => {
    const { viewport } = useViewStore.getState()
    smoothZoom(f, viewport.width / 2, viewport.height / 2)
  }
  const toggleCursor = () => {
    if (timeCursor !== null) {
      setTimeCursor(null)
      return
    }
    const { camera, viewport } = useViewStore.getState()
    const midWorldY = (viewport.height / 2 - camera.ty) / camera.k
    setTimeCursor(Math.round(DEFAULT_SCALE.yToYear(midWorldY)))
  }

  const btn = (
    label: string,
    title: string,
    onClick: () => void,
    active = false,
    badge?: number,
  ) => (
    <button
      onClick={onClick}
      data-tip={title}
      aria-label={title}
      className="cbtn"
      style={{
        position: 'relative',
        width: 34,
        height: 34,
        border: 'none',
        borderBottom: '1px solid rgba(26,22,20,0.25)',
        background: active ? 'var(--ink)' : 'transparent',
        color: active ? 'var(--paper)' : 'var(--ink)',
        fontFamily: 'var(--font-label)',
        fontSize: 15,
        fontWeight: 600,
        cursor: 'pointer',
        display: 'block',
      }}
    >
      {label}
      {badge ? (
        <span
          style={{
            position: 'absolute',
            top: 2,
            right: 2,
            fontSize: 8,
            fontWeight: 700,
            background: active ? 'var(--paper)' : 'var(--ink)',
            color: active ? 'var(--ink)' : 'var(--paper)',
            borderRadius: 8,
            padding: '0 4px',
            lineHeight: '10px',
          }}
        >
          {badge}
        </span>
      ) : null}
    </button>
  )

  return (
    <div
      className="chronos-shift"
      style={{
        position: 'absolute',
        top: 88,
        right,
        zIndex: 25,
        border: '1px solid rgba(26,22,20,0.45)',
        background: 'var(--paper)',
      }}
    >
      {btn('▶', ui('toolTour', 'Guided tour', lang), startTour, tourChapter !== null)}
      {btn('⌕', `${ui('toolSearch', 'Search', lang)} · ⌘K`, () => setSearchOpen(true))}
      {btn('＋', `${ui('toolZoomIn', 'Zoom in', lang)} · +`, () => zoom(1.6))}
      {btn('－', `${ui('toolZoomOut', 'Zoom out', lang)} · −`, () => zoom(0.62))}
      {btn('⛶', `${ui('toolFit', 'Fit whole poster', lang)} · 0`, () =>
        useViewStore.getState().fitAll(),
      )}
      {btn('☰', `${ui('toolCursor', 'Time cursor', lang)} · T`, toggleCursor, timeCursor !== null)}
      {btn('⤓', ui('toolExport', 'Export A1 poster (SVG)', lang), () =>
        downloadPosterSvg({
          layout,
          polities,
          scale,
          filters: useAppStore.getState().filters,
          lang: useAppStore.getState().lang,
        }),
      )}
      {btn(
        '▽',
        ui('filters', 'Filters', lang),
        () => setFiltersOpen(!filtersOpen),
        filtersOpen || activeFilters > 0,
        activeFilters || undefined,
      )}
    </div>
  )
}
