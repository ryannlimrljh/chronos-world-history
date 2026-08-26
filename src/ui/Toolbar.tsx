import { useAppStore } from '../store/app'
import { useViewStore } from '../store/view'
import { DEFAULT_SCALE } from '../layout/scale'
import { ui } from '../i18n'

/**
 * The visible face of the keyboard shortcuts. Every hidden power feature
 * gets a labelled button: search, zoom, fit, time cursor. Discoverability
 * first; the shortcuts stay for fast hands.
 */
export function Toolbar() {
  const lang = useAppStore((s) => s.lang)
  const setSearchOpen = useAppStore((s) => s.setSearchOpen)
  const timeCursor = useAppStore((s) => s.timeCursor)
  const setTimeCursor = useAppStore((s) => s.setTimeCursor)

  const zoom = (f: number) => {
    const { viewport, zoomAt } = useViewStore.getState()
    zoomAt(f, viewport.width / 2, viewport.height / 2)
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
  ) => (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      style={{
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
    </button>
  )

  return (
    <div
      style={{
        position: 'absolute',
        top: 88,
        right: 14,
        zIndex: 25,
        border: '1px solid rgba(26,22,20,0.45)',
        background: 'var(--paper)',
      }}
    >
      {btn('⌕', `${ui('toolSearch', 'Search', lang)} · ⌘K`, () => setSearchOpen(true))}
      {btn('＋', `${ui('toolZoomIn', 'Zoom in', lang)} · +`, () => zoom(1.35))}
      {btn('－', `${ui('toolZoomOut', 'Zoom out', lang)} · −`, () => zoom(0.74))}
      {btn('⛶', `${ui('toolFit', 'Fit whole poster', lang)} · 0`, () =>
        useViewStore.getState().fitAll(),
      )}
      {btn('☰', `${ui('toolCursor', 'Time cursor', lang)} · T`, toggleCursor, timeCursor !== null)}
    </div>
  )
}
